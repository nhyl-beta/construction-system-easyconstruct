// server/src/lifecycle/service.ts — NEW
import {
  ConflictError,
  ForbiddenError,
  GateBlockedError,
  NotFoundError,
} from "../utils/errors.js";
import { logAudit } from "../utils/audit.js";
import * as notificationsService from "../notifications/service.js";
import * as projectsRepo from "../projects/repository.js";
import * as repo from "./repository.js";
import type { LifecycleSnapshot } from "./repository.js";
import { evaluateGate, type GateCheck } from "./gates.js";
import {
  HOLDABLE_PHASES,
  NEXT_PHASE,
  PHASE_BANDS,
  PHASE_TONE,
  WRITE_LOCKED_PHASES,
  isSequencedPhase,
  type ProjectPhase,
  type SequencedPhase,
} from "./phases.js";

export interface LifecycleActor {
  id: number;
  name: string;
  role: string;
}

// ── Progress ─────────────────────────────────────────────────────────────

export const computeProgress = (phase: string, snapshot: LifecycleSnapshot): number => {
  if (phase === "Construction") {
    const total = snapshot.tasks.length;
    if (total === 0) return 30;
    const done = snapshot.tasks.filter((t) => t.status === "Completed").length;
    return Math.round(30 + 65 * (done / total));
  }
  if (phase === "Completed" || phase === "Archived") return 100;
  if (phase === "On Hold" || phase === "Cancelled") return snapshot.project.progress;

  if (!isSequencedPhase(phase)) return snapshot.project.progress;
  const band = PHASE_BANDS[phase];
  const checks = evaluateGate(phase, snapshot);
  if (checks.length === 0) return band.start;
  const passed = checks.filter((c) => c.passed).length;
  return Math.round(band.start + (band.end - band.start) * (passed / checks.length));
};

/** The only writer of projects.progress — every other write path calls this
 * after it succeeds (see docs/lifecycle-progress.md group C7's call-site
 * list) instead of setting progress itself. */
export const refreshProjectProgress = async (projectCode: string): Promise<void> => {
  const snapshot = await repo.loadSnapshot(projectCode);
  if (!snapshot) return;
  const progress = computeProgress(snapshot.project.status, snapshot);
  if (progress === snapshot.project.progress) return;
  await projectsRepo.updateLifecycleFields(projectCode, { progress });
};

// ── Read ─────────────────────────────────────────────────────────────────

export interface LifecycleView {
  phase: ProjectPhase;
  progress: number;
  band: { start: number; end: number } | null;
  checks: GateCheck[];
  nextPhase: SequencedPhase | null;
  canAdvance: boolean;
  blockedReason?: string;
  constructionTasks?: { done: number; total: number };
  history: Awaited<ReturnType<typeof repo.findPhaseHistory>>;
}

export const getLifecycleView = async (projectCode: string): Promise<LifecycleView> => {
  const snapshot = await repo.loadSnapshot(projectCode);
  if (!snapshot) throw new NotFoundError("Project", projectCode);

  const phase = snapshot.project.status as ProjectPhase;
  const sequenced = isSequencedPhase(phase);
  const checks = sequenced ? evaluateGate(phase, snapshot) : [];
  const nextPhase = sequenced ? NEXT_PHASE[phase] : null;
  // Completed's "next" is Archived, but that's reached via POST .../archive
  // (Admin only), not Advance — see D-1's table.
  const advanceEligible = sequenced && phase !== "Completed" && phase !== "Archived" && nextPhase != null;
  const allPassed = checks.every((c) => c.passed);
  const canAdvance = advanceEligible && allPassed;

  const history = await repo.findPhaseHistory(projectCode);

  const view: LifecycleView = {
    phase,
    progress: snapshot.project.progress,
    band: sequenced ? PHASE_BANDS[phase] : null,
    checks,
    nextPhase: advanceEligible ? nextPhase : null,
    canAdvance,
    history,
  };

  if (!canAdvance) {
    view.blockedReason = !advanceEligible
      ? `${phase} has no Advance step`
      : `${checks.filter((c) => !c.passed).length} check(s) not yet passing`;
  }

  if (phase === "Construction") {
    view.constructionTasks = {
      done: snapshot.tasks.filter((t) => t.status === "Completed").length,
      total: snapshot.tasks.length,
    };
  }

  return view;
};

// ── Write guard ──────────────────────────────────────────────────────────

/** Blocks ordinary project-scoped writes while a project is frozen
 * (Archived/Cancelled/On Hold) — the lifecycle endpoints themselves
 * (advance/hold/resume/cancel/archive) are exempt by construction, since
 * they call projectsRepo.updateLifecycleFields directly rather than going
 * through any of the call sites this guards. */
export const assertProjectWritable = async (projectCode: string): Promise<void> => {
  const project = await projectsRepo.findByCode(projectCode);
  if (!project) throw new NotFoundError("Project", projectCode);
  if (WRITE_LOCKED_PHASES.has(project.status)) {
    throw new ConflictError(`Project is ${project.status} — changes are locked`);
  }
};

// ── Authorization ────────────────────────────────────────────────────────

const isProjectPm = (project: LifecycleSnapshot["project"], actor: LifecycleActor): boolean => {
  if (project.pmUserId != null) return project.pmUserId === actor.id;
  return project.pm === actor.name;
};

const assertCanAdvance = (project: LifecycleSnapshot["project"], actor: LifecycleActor): void => {
  if (actor.role === "admin") return;
  if (actor.role === "project-manager" && isProjectPm(project, actor)) return;
  throw new ForbiddenError("Only the project's own Project Manager, or Admin, may advance it");
};

const assertCanHold = assertCanAdvance; // same rule: PM of the project, or Admin

const assertCanCancel = (
  project: LifecycleSnapshot["project"],
  actor: LifecycleActor,
): void => {
  if (actor.role === "admin") return;
  // From Proposal, the PM may cancel too; from any later phase, Admin only.
  if (project.status === "Proposal" && actor.role === "project-manager" && isProjectPm(project, actor)) {
    return;
  }
  throw new ForbiddenError(
    project.status === "Proposal"
      ? "Only the project's own Project Manager, or Admin, may cancel it"
      : "Only Admin may cancel a project once it has left Proposal",
  );
};

// ── Notifications (4.5) ──────────────────────────────────────────────────
//
// A minimal, project-scoped notifier — membership-scoped roles resolve to
// the actual staffed users, org-wide roles broadcast by role. J1 generalizes
// this into notifications/service.notifyProject for every other domain
// event; lifecycle is its first caller, not its only one.
const notifyProjectMembersAndPm = async (
  snapshot: LifecycleSnapshot,
  title: string,
  body: string,
) => {
  const link = `/projects/${encodeURIComponent(snapshot.project.code)}`;
  const recipientUserIds = new Set(snapshot.members.map((m) => m.userId));
  if (snapshot.project.pmUserId != null) recipientUserIds.add(snapshot.project.pmUserId);

  const perUser = Array.from(recipientUserIds).map((recipientUserId) =>
    notificationsService.create({
      recipientUserId,
      title,
      body,
      link,
      projectCode: snapshot.project.code,
    }),
  );
  // pmUserId unset (legacy/backfill gap) — fall back to a role broadcast so
  // the PM still hears about their own project.
  const pmBroadcast =
    snapshot.project.pmUserId == null
      ? [notificationsService.create({ recipientRole: "project-manager", title, body, link, projectCode: snapshot.project.code })]
      : [];

  await Promise.all([...perUser, ...pmBroadcast]);
};

const notifyEnteringPhase = async (snapshot: LifecycleSnapshot, phase: SequencedPhase) => {
  const checks = evaluateGate(phase, snapshot);
  const rolesToChecks = new Map<string, GateCheck[]>();
  for (const check of checks) {
    for (const role of check.ownerRoles) {
      const list = rolesToChecks.get(role) ?? [];
      list.push(check);
      rolesToChecks.set(role, list);
    }
  }
  const link = `/projects/${encodeURIComponent(snapshot.project.code)}`;
  await Promise.all(
    Array.from(rolesToChecks.entries()).map(([role, roleChecks]) =>
      notificationsService.create({
        recipientRole: role,
        title: `Project entering ${phase}`,
        body: `${snapshot.project.code}: ${roleChecks.map((c) => c.label).join(", ")} needed.`,
        link,
        projectCode: snapshot.project.code,
      }),
    ),
  );
};

// ── Transitions ──────────────────────────────────────────────────────────

const recordTransition = async (
  snapshot: LifecycleSnapshot,
  toStatus: string,
  actor: LifecycleActor,
  opts: { reason?: string | null; override?: boolean; gateSnapshot?: unknown } = {},
) => {
  await repo.insertPhaseHistory({
    projectCode: snapshot.project.code,
    fromStatus: snapshot.project.status,
    toStatus,
    changedBy: actor.name,
    changedByUserId: actor.id,
    reason: opts.reason ?? null,
    override: opts.override ?? false,
    gateSnapshot: opts.gateSnapshot ?? null,
  });
  await logAudit({
    entityType: "project",
    entityId: snapshot.project.code,
    action: `lifecycle:${toStatus.toLowerCase().replace(/\s+/g, "-")}`,
    actor: actor.name,
    summary: `${snapshot.project.status} → ${toStatus}${opts.reason ? ` (${opts.reason})` : ""}`,
  });
};

export interface AdvanceInput {
  reason?: string;
  override?: boolean;
}

export const advance = async (
  projectCode: string,
  actor: LifecycleActor,
  input: AdvanceInput,
): Promise<LifecycleView> => {
  const snapshot = await repo.loadSnapshot(projectCode);
  if (!snapshot) throw new NotFoundError("Project", projectCode);

  const phase = snapshot.project.status;
  if (!isSequencedPhase(phase) || phase === "Completed" || phase === "Archived") {
    throw new ConflictError(`${phase} has no Advance step`);
  }
  assertCanAdvance(snapshot.project, actor);

  const nextPhase = NEXT_PHASE[phase];
  if (!nextPhase) throw new ConflictError(`${phase} has no next phase`);

  const checks = evaluateGate(phase, snapshot);
  const failing = checks.filter((c) => !c.passed);

  const isOverride = input.override === true;
  if (failing.length > 0) {
    if (!isOverride) throw new GateBlockedError(failing);
    // D-3: admin override — requires a reason of at least 10 characters,
    // and is recorded (override=true + the failing snapshot) in both the
    // history row and the audit log.
    if (actor.role !== "admin") {
      throw new ForbiddenError("Only Admin may override a blocked Advance");
    }
    if (!input.reason || input.reason.trim().length < 10) {
      throw new ConflictError("An override requires a reason of at least 10 characters");
    }
  }

  await recordTransition(snapshot, nextPhase, actor, {
    reason: input.reason ?? null,
    override: isOverride && failing.length > 0,
    gateSnapshot: checks,
  });
  await projectsRepo.updateLifecycleFields(projectCode, {
    status: nextPhase,
    statusTone: PHASE_TONE[nextPhase],
    ...(nextPhase === "Completed" ? { completedAt: new Date() } : {}),
  });
  await refreshProjectProgress(projectCode);

  const refreshed = await repo.loadSnapshot(projectCode);
  if (refreshed) {
    await notifyProjectMembersAndPm(
      refreshed,
      `Project advanced to ${nextPhase}`,
      `${snapshot.project.code} moved from ${phase} to ${nextPhase}.`,
    );
    if (isSequencedPhase(nextPhase) && nextPhase !== "Completed" && nextPhase !== "Archived") {
      await notifyEnteringPhase(refreshed, nextPhase);
    }
    if (nextPhase === "Completed") {
      await notificationsService.create({
        recipientRole: "owner",
        title: "Project completed",
        body: `${snapshot.project.code} reached 100% and is now Completed.`,
        link: `/projects/${encodeURIComponent(snapshot.project.code)}`,
        projectCode: snapshot.project.code,
      });
    }
  }

  return getLifecycleView(projectCode);
};

export interface HoldInput {
  reason: string;
}

export const hold = async (
  projectCode: string,
  actor: LifecycleActor,
  input: HoldInput,
): Promise<LifecycleView> => {
  const snapshot = await repo.loadSnapshot(projectCode);
  if (!snapshot) throw new NotFoundError("Project", projectCode);
  if (!HOLDABLE_PHASES.has(snapshot.project.status)) {
    throw new ConflictError(`Cannot hold a project in ${snapshot.project.status}`);
  }
  assertCanHold(snapshot.project, actor);
  if (!input.reason || !input.reason.trim()) {
    throw new ConflictError("A reason is required to hold a project");
  }

  await recordTransition(snapshot, "On Hold", actor, { reason: input.reason });
  await projectsRepo.updateLifecycleFields(projectCode, {
    status: "On Hold",
    statusTone: PHASE_TONE["On Hold"],
    previousStatus: snapshot.project.status,
    holdReason: input.reason,
  });

  const refreshed = await repo.loadSnapshot(projectCode);
  if (refreshed) {
    await notifyProjectMembersAndPm(
      refreshed,
      "Project put on hold",
      `${snapshot.project.code}: ${input.reason}`,
    );
  }

  return getLifecycleView(projectCode);
};

export const resume = async (projectCode: string, actor: LifecycleActor): Promise<LifecycleView> => {
  const snapshot = await repo.loadSnapshot(projectCode);
  if (!snapshot) throw new NotFoundError("Project", projectCode);
  if (snapshot.project.status !== "On Hold") {
    throw new ConflictError("Only a project that is On Hold can be resumed");
  }
  assertCanHold(snapshot.project, actor);

  const restoreTo = snapshot.project.previousStatus ?? "Construction";
  await recordTransition(snapshot, restoreTo, actor);
  await projectsRepo.updateLifecycleFields(projectCode, {
    status: restoreTo,
    statusTone: isSequencedPhase(restoreTo) ? PHASE_TONE[restoreTo] : "neutral",
    previousStatus: null,
    holdReason: null,
  });
  await refreshProjectProgress(projectCode);

  const refreshed = await repo.loadSnapshot(projectCode);
  if (refreshed) {
    await notifyProjectMembersAndPm(
      refreshed,
      "Project resumed",
      `${snapshot.project.code} resumed into ${restoreTo}.`,
    );
  }

  return getLifecycleView(projectCode);
};

export interface CancelInput {
  reason: string;
}

export const cancel = async (
  projectCode: string,
  actor: LifecycleActor,
  input: CancelInput,
): Promise<LifecycleView> => {
  const snapshot = await repo.loadSnapshot(projectCode);
  if (!snapshot) throw new NotFoundError("Project", projectCode);
  if (snapshot.project.status === "Cancelled" || snapshot.project.status === "Archived") {
    throw new ConflictError(`Project is already ${snapshot.project.status}`);
  }
  assertCanCancel(snapshot.project, actor);
  if (!input.reason || !input.reason.trim()) {
    throw new ConflictError("A reason is required to cancel a project");
  }

  await recordTransition(snapshot, "Cancelled", actor, { reason: input.reason });
  await projectsRepo.updateLifecycleFields(projectCode, {
    status: "Cancelled",
    statusTone: PHASE_TONE.Cancelled,
  });

  const refreshed = await repo.loadSnapshot(projectCode);
  if (refreshed) {
    await notifyProjectMembersAndPm(
      refreshed,
      "Project cancelled",
      `${snapshot.project.code}: ${input.reason}`,
    );
  }

  return getLifecycleView(projectCode);
};

export const archive = async (projectCode: string, actor: LifecycleActor): Promise<LifecycleView> => {
  if (actor.role !== "admin") throw new ForbiddenError("Only Admin may archive a project");

  const snapshot = await repo.loadSnapshot(projectCode);
  if (!snapshot) throw new NotFoundError("Project", projectCode);
  if (snapshot.project.status !== "Completed") {
    throw new ConflictError("Only a Completed project can be archived");
  }

  await recordTransition(snapshot, "Archived", actor);
  await projectsRepo.updateLifecycleFields(projectCode, {
    status: "Archived",
    statusTone: PHASE_TONE.Archived,
    archivedAt: new Date(),
  });

  const refreshed = await repo.loadSnapshot(projectCode);
  if (refreshed) {
    await notifyProjectMembersAndPm(
      refreshed,
      "Project archived",
      `${snapshot.project.code} has been archived.`,
    );
  }

  return getLifecycleView(projectCode);
};
