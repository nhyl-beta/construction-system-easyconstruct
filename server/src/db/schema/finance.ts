import {
  integer,
  numeric,
  pgEnum,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const budgetStatusEnum = pgEnum("budget_status", [
  "draft",
  "pending-review",
  "finance-review",
  "manager-review",
  "approved",
  "rejected",
  "locked",
]);

export const adjustmentKindEnum = pgEnum("adjustment_kind", [
  "increase",
  "decrease",
  "transfer",
  "emergency",
]);

// ── Budgets ────────────────────────────────────────────────────────────────
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),

  project: varchar("project", { length: 255 }).notNull(),

  category: varchar("category", { length: 64 }).notNull(),
  owner: varchar("owner", { length: 255 }).notNull(),

  planned: numeric("planned", {
    precision: 14,
    scale: 2,
    mode: "number",
  }).notNull(),

  committed: numeric("committed", {
    precision: 14,
    scale: 2,
    mode: "number",
  })
    .default(0)
    .notNull(),

  actual: numeric("actual", {
    precision: 14,
    scale: 2,
    mode: "number",
  })
    .default(0)
    .notNull(),

  fiscalYear: varchar("fiscal_year", { length: 9 }).notNull(),

  status: budgetStatusEnum("status").notNull().default("draft"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Expenses ───────────────────────────────────────────────────────────────
export const expenses = pgTable("expenses", {
  id: varchar("id", { length: 32 }).primaryKey(), // e.g. "EXP-0182"
  vendor: varchar("vendor", { length: 255 }).notNull(),
  project: varchar("project", { length: 255 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  amount: numeric("amount", {
    precision: 14,
    scale: 2,
    mode: "number",
  }).notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  status: varchar("status", { length: 32 }).notNull(), // pending | approved | rejected
  anomalyScore: real("anomaly_score"), // 0-1, nullable
  receiptUrl: text("receipt_url"),
});

// ── Purchase requests ──────────────────────────────────────────────────────
export const purchaseRequests = pgTable("purchase_requests", {
  id: varchar("id", { length: 32 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  project: varchar("project", { length: 255 }).notNull(),
  requestedBy: varchar("requested_by", { length: 255 }).notNull(),
  amount: numeric("amount", {
    precision: 14,
    scale: 2,
    mode: "number",
  }).notNull(),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  status: varchar("status", { length: 32 }).notNull(),
});

// ── Reimbursements ─────────────────────────────────────────────────────────
export const reimbursements = pgTable("reimbursements", {
  id: varchar("id", { length: 32 }).primaryKey(),
  employee: varchar("employee", { length: 255 }).notNull(),
  purpose: varchar("purpose", { length: 255 }).notNull(),
  amount: numeric("amount", {
    precision: 14,
    scale: 2,
    mode: "number",
  }).notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  status: varchar("status", { length: 32 }).notNull(),
});

// ── Procurement orders ─────────────────────────────────────────────────────
export const procurementOrders = pgTable("procurement_orders", {
  id: varchar("id", { length: 32 }).primaryKey(), // PO number
  vendor: varchar("vendor", { length: 255 }).notNull(),
  project: varchar("project", { length: 255 }).notNull(),
  items: integer("items").notNull(),
  amount: numeric("amount", {
    precision: 14,
    scale: 2,
    mode: "number",
  }).notNull(),
  eta: varchar("eta", { length: 64 }),
  status: varchar("status", { length: 32 }).notNull(), // "In transit" | "Delivered" | ...
});

// ── Approvals queue ────────────────────────────────────────────────────────
export const approvalsQueue = pgTable("approvals_queue", {
  id: varchar("id", { length: 32 }).primaryKey(),
  kind: varchar("kind", { length: 64 }).notNull(), // Budget | Payroll | Expense | ...
  reference: varchar("reference", { length: 255 }).notNull(),
  requestedBy: varchar("requested_by", { length: 255 }).notNull(),
  amount: numeric("amount", {
    precision: 14,
    scale: 2,
    mode: "number",
  }).notNull(),
  slaHours: integer("sla_hours").notNull(),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── AI insights ────────────────────────────────────────────────────────────
export const aiInsights = pgTable("ai_insights", {
  id: varchar("id", { length: 32 }).primaryKey(),
  category: varchar("category", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  impact: text("impact").notNull(),
  confidence: real("confidence").notNull(), // 0-1
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Financial risks ────────────────────────────────────────────────────────
export const financialRisks = pgTable("financial_risks", {
  id: varchar("id", { length: 32 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  impact: text("impact").notNull(),
  project: varchar("project", { length: 255 }).notNull(),
  level: varchar("level", { length: 16 }).notNull(), // low | medium | high | critical
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Cash flow entries (monthly rollups) ────────────────────────────────────
export const cashFlowEntries = pgTable("cash_flow_entries", {
  id: serial("id").primaryKey(),
  month: varchar("month", { length: 16 }).notNull(), // "Jan 2026"
  inflow: numeric("inflow", {
    precision: 14,
    scale: 2,
    mode: "number",
  }).notNull(),
  outflow: numeric("outflow", {
    precision: 14,
    scale: 2,
    mode: "number",
  }).notNull(),
});

// ── Scheduled reports ──────────────────────────────────────────────────────
export const scheduledReports = pgTable("scheduled_reports", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  cadence: varchar("cadence", { length: 64 }).notNull(), // "Every Mon", "1st of month", ...
  time: varchar("time", { length: 16 }).notNull(), // "07:00"
  recipients: text("recipients"), // comma-separated or jsonb later
});

// ── Budget allocations ─────────────────────────────────────────────────────
export const budgetAllocations = pgTable("budget_allocations", {
  id: serial("id").primaryKey(),

  budgetId: integer("budget_id")
    .notNull()
    .references(() => budgets.id),

  department: varchar("department", { length: 128 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),

  amount: numeric("amount", {
    precision: 14,
    scale: 2,
    mode: "number",
  }).notNull(),

  consumed: numeric("consumed", {
    precision: 14,
    scale: 2,
    mode: "number",
  }).notNull(),

  status: varchar("status", { length: 32 }).notNull().default("active"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Budget adjustments ─────────────────────────────────────────────────────
export const budgetAdjustments = pgTable("budget_adjustments", {
  id: serial("id").primaryKey(),

  budgetId: integer("budget_id")
    .notNull()
    .references(() => budgets.id),

  kind: adjustmentKindEnum("kind").notNull(),

  originalAmount: numeric("original_amount", {
    precision: 14,
    scale: 2,
    mode: "number",
  }).notNull(),

  adjustmentAmount: numeric("adjustment_amount", {
    precision: 14,
    scale: 2,
    mode: "number",
  }).notNull(),

  newAmount: numeric("new_amount", {
    precision: 14,
    scale: 2,
    mode: "number",
  }).notNull(),

  reason: text("reason").notNull(),

  requestedBy: varchar("requested_by", {
    length: 255,
  }).notNull(),

  requestedAt: timestamp("requested_at").defaultNow().notNull(),

  approvedBy: varchar("approved_by", {
    length: 255,
  }),

  approvedAt: timestamp("approved_at"),

  status: budgetStatusEnum("status").notNull().default("draft"),
});

// ── Budget approval workflow ───────────────────────────────────────────────
export const budgetApprovalSteps = pgTable("budget_approval_steps", {
  id: serial("id").primaryKey(),

  budgetId: integer("budget_id")
    .notNull()
    .references(() => budgets.id),

  stage: varchar("stage", {
    length: 32,
  }).notNull(),

  decision: varchar("decision", {
    length: 16,
  }),

  actor: varchar("actor", {
    length: 255,
  }),

  comment: text("comment"),

  decidedAt: timestamp("decided_at"),
});

// ── Budget history / audit log ─────────────────────────────────────────────
export const budgetHistory = pgTable("budget_history", {
  id: serial("id").primaryKey(),

  budgetId: integer("budget_id")
    .notNull()
    .references(() => budgets.id),

  action: varchar("action", {
    length: 32,
  }).notNull(),

  field: varchar("field", {
    length: 64,
  }),

  oldValue: varchar("old_value", {
    length: 255,
  }),

  newValue: varchar("new_value", {
    length: 255,
  }),

  reason: text("reason"),

  actor: varchar("actor", {
    length: 255,
  }).notNull(),

  at: timestamp("at").defaultNow().notNull(),
});

// ── Budget comments ────────────────────────────────────────────────────────
export const budgetComments = pgTable("budget_comments", {
  id: serial("id").primaryKey(),

  budgetId: integer("budget_id")
    .notNull()
    .references(() => budgets.id),

  author: varchar("author", {
    length: 255,
  }).notNull(),

  body: text("body").notNull(),

  at: timestamp("at").defaultNow().notNull(),
});

// ── Budget documents ───────────────────────────────────────────────────────
export const budgetDocuments = pgTable("budget_documents", {
  id: serial("id").primaryKey(),

  budgetId: integer("budget_id")
    .notNull()
    .references(() => budgets.id),

  name: varchar("name", {
    length: 255,
  }).notNull(),

  kind: varchar("kind", {
    length: 64,
  }),

  size: varchar("size", {
    length: 32,
  }),

  uploadedBy: varchar("uploaded_by", {
    length: 255,
  }).notNull(),

  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),

  url: text("url"),
});

// ── Payroll batches ────────────────────────────────────────────────────────
export const payrollBatches = pgTable("payroll_batches", {
  id: varchar("id", { length: 32 }).primaryKey(), // e.g. "PAY-2048"

  // Optional project reference for project-based payroll
  projectCode: varchar("project_code", { length: 50 }),

  period: varchar("period", { length: 32 }).notNull(), // e.g. "Jul 20–26, 2026"

  group: varchar("group", { length: 128 }).notNull(), // Engineering, Site Crew A, etc.

  employees: integer("employees").notNull(),

  overtimeHours: numeric("overtime_hours", {
    precision: 10,
    scale: 2,
    mode: "number",
  })
    .default(0)
    .notNull(),

  grossPayroll: numeric("gross_payroll", {
    precision: 14,
    scale: 2,
    mode: "number",
  }).notNull(),

  deductions: numeric("deductions", {
    precision: 14,
    scale: 2,
    mode: "number",
  })
    .default(0)
    .notNull(),

  netPayroll: numeric("net_payroll", {
    precision: 14,
    scale: 2,
    mode: "number",
  }).notNull(),

  status: varchar("status", { length: 32 })
    .notNull()
    .default("pending"), // pending | approved | rejected | processing

  reviewedBy: varchar("reviewed_by", { length: 255 }),

  reviewedAt: timestamp("reviewed_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});