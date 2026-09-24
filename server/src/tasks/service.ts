// server/src/tasks/service.ts — NEW
import { ForbiddenError, NotFoundError, ValidationError } from "../utils/errors.js";
import { assertProjectWritable, refreshProjectProgress } from "../lifecycle/service.js";
import * as repo from "./repository.js";
import * as milestonesRepo from "../milestones/repository.js";
import * as notificationsService from "../notifications/service.js";
import type { CreateTaskInput, TaskFilters, UpdateTaskInput } from "./types.js";

// G2/J1: PM-facing notice, routed through the shared notifyProject helper.
const notifyPm = async (projectCode: string, title: string, body: string) => {
  await notificationsService.notifyProject(projectCode, ["project-manager"], {
    title,
    body,
    link: `/projects/${encodeURIComponent(projectCode)}`,
  });
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  Pending: ["In Progress"],
  "In Progress": ["Completed", "Pending"],
  Completed: [],
};

export const getAll = async (filters: TaskFilters) => repo.findAll(filters);

export const getById = async (id: number) => {
  const task = await repo.findById(id);
  if (!task) throw new NotFoundError("Task", String(id));
  return task;
};

export const create = async (input: CreateTaskInput) => {
  await assertProjectWritable(input.projectCode);
  const task = await repo.create(input);
  if (!task) throw new Error("Failed to create task");
  await refreshProjectProgress(task.projectCode);
  return task;
};

// Site Personnel may only move their own task through the allowed status flow.
export const updateStatus = async (
  id: number,
  nextStatus: string,
  actingUserId: number,
  evidence: { completionNote?: string; completionFileUrl?: string } = {},
) => {
  const existing = await getById(id);
  await assertProjectWritable(existing.projectCode);
  if (existing.assignedToUserId !== actingUserId) {
    throw new ForbiddenError("You can only update tasks assigned to you");
  }
  const allowed = VALID_TRANSITIONS[existing.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw new ValidationError(
      `Cannot move task from '${existing.status}' to '${nextStatus}'`,
    );
  }

  const completing = nextStatus === "Completed";
  const progress = completing ? 100 : existing.progress;

  // The zod schema already requires a note on the Completed transition;
  // re-checked here so the rule holds for any non-HTTP caller too.
  if (completing && !evidence.completionNote?.trim()) {
    throw new ValidationError(
      "Describe what was completed before marking the task done",
    );
  }

  const updated = await repo.update(id, {
    status: nextStatus,
    progress,
    ...(completing
      ? {
          completionNote: evidence.completionNote?.trim(),
          completionFileUrl: evidence.completionFileUrl,
          completedAt: new Date(),
        }
      : {}),
  });
  if (!updated) throw new NotFoundError("Task", String(id));
  // Construction's progress is completed/total tasks (D-2) — the only gate
  // band whose number this call site can move on its own.
  await refreshProjectProgress(updated.projectCode);

  if (completing) {
    await notifyPm(
      updated.projectCode,
      "Task completed",
      `"${updated.title}" was marked complete on ${updated.projectCode}`,
    );

    // G2: if every task linked to a milestone is now Completed, tell the PM
    // the milestone itself is ready to be moved along.
    const linkedMilestones = await milestonesRepo.findMilestonesLinkedToTask(updated.id);
    for (const milestone of linkedMilestones) {
      const links = await milestonesRepo.findLinks(milestone.id);
      const taskLinks = links.filter((l) => l.linkType === "task");
      const allDone = taskLinks.length > 0 && taskLinks.every((l) => l.task?.status === "Completed");
      if (allDone) {
        await notifyPm(
          updated.projectCode,
          "Milestone ready",
          `All tasks linked to milestone "${milestone.title}" are complete`,
        );
      }
    }
  }

  return updated;
};

export const update = async (id: number, input: UpdateTaskInput) => {
  const existing = await getById(id);
  await assertProjectWritable(existing.projectCode);
  const updated = await repo.update(id, input);
  if (!updated) throw new NotFoundError("Task", String(id));
  await refreshProjectProgress(updated.projectCode);
  return updated;
};

export const remove = async (id: number) => {
  const existing = await getById(id);
  const deleted = await repo.remove(id);
  if (!deleted) throw new NotFoundError("Task", String(id));
  await refreshProjectProgress(existing.projectCode);
  return deleted;
};