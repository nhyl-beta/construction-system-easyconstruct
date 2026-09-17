// server/src/tasks/service.ts — NEW
import { ForbiddenError, NotFoundError, ValidationError } from "../utils/errors.js";
import * as repo from "./repository.js";
import type { CreateTaskInput, TaskFilters, UpdateTaskInput } from "./types.js";

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
  const task = await repo.create(input);
  if (!task) throw new Error("Failed to create task");
  return task;
};

// Site Personnel may only move their own task through the allowed status flow.
export const updateStatus = async (
  id: number,
  nextStatus: string,
  actingUserId: number,
) => {
  const existing = await getById(id);
  if (existing.assignedToUserId !== actingUserId) {
    throw new ForbiddenError("You can only update tasks assigned to you");
  }
  const allowed = VALID_TRANSITIONS[existing.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw new ValidationError(
      `Cannot move task from '${existing.status}' to '${nextStatus}'`,
    );
  }
  const progress = nextStatus === "Completed" ? 100 : existing.progress;
  const updated = await repo.update(id, { status: nextStatus, progress });
  if (!updated) throw new NotFoundError("Task", String(id));
  return updated;
};

export const update = async (id: number, input: UpdateTaskInput) => {
  await getById(id);
  const updated = await repo.update(id, input);
  if (!updated) throw new NotFoundError("Task", String(id));
  return updated;
};

export const remove = async (id: number) => {
  await getById(id);
  const deleted = await repo.remove(id);
  if (!deleted) throw new NotFoundError("Task", String(id));
  return deleted;
};