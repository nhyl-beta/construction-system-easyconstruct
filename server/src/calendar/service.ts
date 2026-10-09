// server/src/calendar/service.ts — NEW (A2)
//
// Cross-project calendar events for the requesting user: milestone due
// dates, workflow submissions, and lifecycle phase transitions ("progress").
// Scoping mirrors lifecycle/my-actions.ts exactly (same three cases: project
// member, project manager, or role with no per-project staffing concept)
// rather than inventing a second "what projects can this user see" rule.
import * as projectsRepo from "../projects/repository.js";
import * as projectMemberRepo from "../project-members/repository.js";
import * as milestonesRepo from "../milestones/repository.js";
import * as workflowsRepo from "../workflows/repository.js";
import * as lifecycleRepo from "../lifecycle/repository.js";
import { PROJECT_MEMBER_ROLES } from "../db/schema/project-members.js";

export type CalendarEventType = "milestone" | "submission" | "progress";

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  date: string; // ISO date (YYYY-MM-DD)
  title: string;
  projectCode: string;
  projectName: string;
  detail?: string;
}

const isMemberRole = (role: string): boolean =>
  (PROJECT_MEMBER_ROLES as readonly string[]).includes(role);

const toIsoDate = (value: string | Date | null | undefined): string | null => {
  if (!value) return null;
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
};

export const getCalendarEvents = async (actor: {
  id: number;
  role: string;
}): Promise<CalendarEvent[]> => {
  const allProjects = await projectsRepo.findAll({});

  let relevant = allProjects;
  if (isMemberRole(actor.role)) {
    const memberships = await projectMemberRepo.findAll({ userId: actor.id });
    const codes = new Set(memberships.map((m) => m.projectCode));
    relevant = allProjects.filter((p) => codes.has(p.code));
  } else if (actor.role === "project-manager") {
    relevant = allProjects.filter((p) => p.pmUserId === actor.id);
  }
  // admin, finance-manager, human-resources, it-designer, owner: no
  // per-project staffing concept, every project is in scope (same rule
  // my-actions.ts uses for gate/signal items).

  const projectByCode = new Map(relevant.map((p) => [p.code, p]));
  const codes = [...projectByCode.keys()];
  const events: CalendarEvent[] = [];

  // Two grouped queries instead of one milestones query and one history query per project.
  const [milestonesByCode, historyByCode] = await Promise.all([
    milestonesRepo.findAllForProjects(codes),
    lifecycleRepo.findPhaseHistoryForProjects(codes),
  ]);
  for (const code of codes) {
    for (const m of milestonesByCode.get(code) ?? []) {
      const date = toIsoDate(m.estimatedCompletionDate);
      if (!date) continue;
      const project = projectByCode.get(m.projectCode);
      events.push({
        id: `milestone-${m.id}`,
        type: "milestone",
        date,
        title: m.title,
        projectCode: m.projectCode,
        projectName: project?.name ?? m.projectCode,
        detail: m.description ?? undefined,
      });
    }
  }

  const allWorkflows = await workflowsRepo.findWorkflowsForProjects(codes);
  for (const wf of allWorkflows) {
    if (!projectByCode.has(wf.projectCode)) continue;
    const date = toIsoDate(wf.createdAt);
    if (!date) continue;
    const project = projectByCode.get(wf.projectCode);
    events.push({
      id: `submission-${wf.id}`,
      type: "submission",
      date,
      title: wf.title,
      projectCode: wf.projectCode,
      projectName: project?.name ?? wf.projectCode,
      detail: `Submitted · ${wf.status}`,
    });
  }

  for (const code of codes) {
    for (const h of historyByCode.get(code) ?? []) {
      const date = toIsoDate(h.createdAt);
      if (!date) continue;
      const project = projectByCode.get(h.projectCode);
      events.push({
        id: `progress-${h.id}`,
        type: "progress",
        date,
        title: `${h.fromStatus} → ${h.toStatus}`,
        projectCode: h.projectCode,
        projectName: project?.name ?? h.projectCode,
        detail: `Changed by ${h.changedBy}`,
      });
    }
  }

  return events;
};
