// server/src/lifecycle/my-actions.ts — NEW
//
// K1: "what's waiting on me, across every project" — the lifecycle gate
// checks (gates.ts) and getLifecycleView are deliberately single-project
// (they take one LifecycleSnapshot at a time); this is the cross-project
// rollup for one actor, mirroring gate checks' own ownerRoles against
// whichever projects that actor is actually relevant to, plus every
// workflow stage pending on them (workflows/repository.ts already answers
// that cross-project on its own).
//
// Lives in its own file rather than lifecycle/service.ts to avoid a circular
// import: workflows/service.ts already imports lifecycle/service.ts
// (assertProjectWritable/refreshProjectProgress), so this instead reads
// workflows/repository.ts directly — a leaf module neither side imports.
import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { formatSuccess } from "../utils/response.js";
import { UnauthorizedError } from "../utils/errors.js";
import * as projectsRepo from "../projects/repository.js";
import * as projectMemberRepo from "../project-members/repository.js";
import * as workflowsRepo from "../workflows/repository.js";
import * as repo from "./repository.js";
import { evaluateGate } from "./gates.js";
import { isSequencedPhase, type SequencedPhase } from "./phases.js";
import { PROJECT_MEMBER_ROLES } from "../db/schema/project-members.js";
import { evaluateSignals } from "../signals/index.js";
import { FEATURES } from "../config/features.js";

export interface MyActionItem {
  projectCode: string;
  projectName: string;
  kind: "gate" | "workflow" | "signal";
  title: string;
  detail: string;
  link: string;
  /** ai-signals E3: only present on kind "signal" — lets the card style it
   * distinctly from a gate/workflow item. */
  severity?: "warn" | "critical";
}

const TERMINAL_PHASES = new Set(["Archived", "Cancelled", "Completed"]);

const isMemberRole = (role: string): boolean =>
  (PROJECT_MEMBER_ROLES as readonly string[]).includes(role);

export const getMyActions = async (actor: {
  id: number;
  role: string;
}): Promise<MyActionItem[]> => {
  const allProjects = await projectsRepo.findAll({});
  const nameByCode = new Map(allProjects.map((p) => [p.code, p.name]));
  const active = allProjects.filter((p) => !TERMINAL_PHASES.has(p.status));

  let relevant = active;
  if (isMemberRole(actor.role)) {
    const memberships = await projectMemberRepo.findAll({ userId: actor.id });
    const codes = new Set(memberships.map((m) => m.projectCode));
    relevant = active.filter((p) => codes.has(p.code));
  } else if (actor.role === "project-manager") {
    relevant = active.filter((p) => p.pmUserId === actor.id);
  }
  // Every other role (admin, finance-manager, human-resources, it-designer,
  // owner) has no per-project staffing concept — every active project is in
  // scope, narrowed below to only the gate checks that role actually owns.

  const gateItems: MyActionItem[] = [];
  const signalItems: MyActionItem[] = [];
  for (const project of relevant) {
    if (!isSequencedPhase(project.status)) continue;
    const snapshot = await repo.loadSnapshot(project.code);
    if (!snapshot) continue;
    const checks = evaluateGate(project.status as SequencedPhase, snapshot);
    for (const check of checks) {
      if (check.passed || !check.ownerRoles.includes(actor.role)) continue;
      gateItems.push({
        projectCode: project.code,
        projectName: project.name,
        kind: "gate",
        title: check.label,
        detail: check.detail ?? "",
        link: check.link || `/projects/${encodeURIComponent(project.code)}`,
      });
    }

    // ai-signals E3: only warn/critical rise to "waiting on you" — info
    // signals are advisory-only even by decision-support standards and stay
    // on the project's own Decision Support section (E2).
    if (FEATURES.ai) {
      const signals = evaluateSignals(snapshot);
      for (const signal of signals) {
        if (signal.severity === "info" || !signal.ownerRoles.includes(actor.role)) continue;
        signalItems.push({
          projectCode: project.code,
          projectName: project.name,
          kind: "signal",
          title: signal.label,
          detail: signal.detail,
          link: signal.link || `/projects/${encodeURIComponent(project.code)}`,
          severity: signal.severity as "warn" | "critical",
        });
      }
    }
  }

  // Cross-project by construction — same "admin can decide any stage"
  // privilege decideStage itself grants (EC-003).
  const isPrivileged = actor.role === "admin";
  const pendingStages = await workflowsRepo.findPendingStagesForRole(actor.role, isPrivileged);
  const workflowItems: MyActionItem[] = pendingStages.map(({ stage, workflow }) => ({
    projectCode: workflow.projectCode,
    projectName: nameByCode.get(workflow.projectCode) ?? workflow.projectCode,
    kind: "workflow",
    title: workflow.title,
    detail: `Awaiting your ${stage.roleLabel} decision`,
    link: "/workflows",
  }));

  return [...gateItems, ...signalItems, ...workflowItems];
};

const router = Router();
router.use(authenticate);

router.get("/my-actions", async (req: AuthedRequest, res, next) => {
  try {
    if (!req.authUser) throw new UnauthorizedError();
    const data = await getMyActions({ id: req.authUser.id, role: req.authUser.role });
    res.json(formatSuccess(data, "Actions waiting on you retrieved"));
  } catch (err) {
    next(err);
  }
});

export default router;
