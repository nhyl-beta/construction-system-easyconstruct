import type { StatusTone } from "@/config/status-tone";

/**
 * Central status registry used across the application.
 * Add new statuses here instead of editing the StatusBadge component.
 */
export const STATUS_CONFIG: Record<string, StatusTone> = {
  // ==========================
  // General
  // ==========================
  Active: "success",
  Inactive: "neutral",
  Archived: "neutral",
  Disabled: "neutral",

  // ==========================
  // Workflow
  // ==========================
  Pending: "warning",
  Review: "warning",
  "In Review": "warning",
  Approved: "success",
  Rejected: "danger",
  Verified: "success",

  // ==========================
  // Employee
  // ==========================
  "On Leave": "warning",
  Suspended: "danger",

  // ==========================
  // Finance
  // ==========================
  Paid: "success",
  Unpaid: "danger",
  Overdue: "danger",
  Processing: "info",

  // ==========================
  // Procurement
  // ==========================
  Ordered: "info",
  Delivered: "success",
  Cancelled: "danger",

  // ==========================
  // Project
  // ==========================
  Planning: "warning",
  "In Progress": "info",
  Completed: "success",
  Delayed: "danger",
  Blocked: "danger",

  // ==========================
  // Risk
  // ==========================
  Low: "success",
  Medium: "info",
  High: "warning",
  Critical: "danger",

  // ==========================
  // AI
  // ==========================
  Flagged: "danger",
};
