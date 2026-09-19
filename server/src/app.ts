import os from "node:os";
import path from "node:path";
import express from "express";
import designReviewsRoutes from "../src/designs/design-reviews/routes.js";
import designRevisionsRoutes from "../src/designs/design-revisions/routes.js";
import architectDocumentsRoutes from "./architect-documents/routes.js";
import blueprintsRoutes from "./blueprints/routes.js";
import designRoutes from "./designs/routes.js";
import { corsMiddleware } from "./middleware/cors.js";
import { errorMiddleware } from "./middleware/error.js";
import { logger } from "./middleware/logger.js";
import { requestId } from "./middleware/request-id.js";
import projectRoutes from "./projects/routes.js";
import proposalRoutes from "./proposals/routes.js";
import hrRoutes from "./hr/routes.js";
import { authRoutes } from "./validators/routes.js";
import employeeRoutes from "./employees/routes.js";
import attendanceRoutes from "./attendance/routes.js";
import payrollRoutes from "./payroll/routes.js";
import workforceReportRoutes from "./workforce-reports/routes.js";
import taskRoutes from "./tasks/routes.js";
import issueRoutes from "./issues/routes.js";
import documentRoutes from "./documents/routes.js";
import payrollReviewRoutes from "./finance/payroll-review/routes.js";
import {
  authenticate,
  requireRole,
} from "./middleware/auth.js";

import { financeRouter } from "./routes/finance.js";
import notificationRoutes from "./notifications/route.js";
import auditLogRoutes from "./audit-logs/routes.js";
import requirementRoutes from "./requirements/routes.js";
import engineeringReportRoutes from "./engineering-reports/routes.js";
import roleRoutes from "./roles/routes.js";
import userRoutes from "./users/routes.js";
import projectMemberRoutes from "./project-members/routes.js";

// ── workflows/approvals ──
import workflowRoutes from "./workflows/routes.js";

import uploadRoutes from "./uploads/routes.js";


const app = express();

// Uploads (design files, attendance photos, task completion evidence) POST a
// base64 data URL through this JSON body parser — see uploads/service.ts,
// which caps the *decoded* file at 8MB. Base64 inflates by ~4/3, so the
// request body can legitimately reach ~11MB. The default limit is 100kb, so
// every real file threw PayloadTooLargeError, which is neither a MulterError
// nor an AppError and fell through to the generic handler as a bare
// "Internal server error".
app.use(express.json({ limit: "12mb" }));
app.use(corsMiddleware);
app.use(requestId);
app.use(logger);

app.use(
  "/uploads",
  express.static(
    process.env.VERCEL
      ? path.join(os.tmpdir(), "uploads")
      : path.resolve(process.cwd(), "uploads"),
  ),
);

app.use("/api/projects", projectRoutes);
app.use("/api/designs", designRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/design-revisions", designRevisionsRoutes);
app.use("/api/design-reviews", designReviewsRoutes);
app.use("/api/architect-documents", architectDocumentsRoutes);
app.use("/api/blueprints", blueprintsRoutes)
app.use("/api/hr", hrRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/workforce-reports", workforceReportRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/documents", documentRoutes);

// Admin/IT Designer keep the same override they have on workflow-stage
// decisions, so a stuck payroll batch can still be cleared.
app.use(
  "/api/finance/payroll-review",
  authenticate,
  requireRole("finance-manager", "finance_manager", "admin", "it-designer"),
  payrollReviewRoutes,
);

app.use("/api/finance", financeRouter);
app.use("/api/notifications", notificationRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/requirements", requirementRoutes);
app.use("/api/engineering-reports", engineeringReportRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/users", userRoutes);
app.use("/api/project-members", projectMemberRoutes);
app.use("/api/workflows", workflowRoutes);
app.use("/api/uploads", uploadRoutes);


app.use(errorMiddleware);

export default app;