import * as repo from "./repository.js";
import type {
  CreateNotificationInput,
  NotificationFilters,
  NotificationScope,
} from "./types.js";

export const getForRecipient = async (
  scope: NotificationScope,
  filters: NotificationFilters,
) => repo.findForRecipient(scope, filters);

// Called directly by other domain services (e.g. budget-approval-steps) — no HTTP loopback.
export const create = async (input: CreateNotificationInput) => repo.create(input);

export const markRead = async (id: number) => repo.markRead(id);