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
// ── Added for Site Personnel ──
import taskRoutes from "./tasks/routes.js";
import issueRoutes from "./issues/routes.js";
import documentRoutes from "./documents/routes.js";
import payrollReviewRoutes from "./finance/payroll-review/routes.js";
import {
  authenticate,
  requireRole,
} from "./middleware/auth.js";

const app = express();

app.use(express.json());
app.use(corsMiddleware);
app.use(requestId);
app.use(logger);

app.use(
  "/uploads",
  express.static(
    path.resolve(
      process.cwd(),
      "uploads",
    ),
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
// ── Added for Site Personnel ──
app.use("/api/tasks", taskRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/documents", documentRoutes);
app.use(
  "/api/finance/payroll-review",
  authenticate,
  requireRole("finance-manager", "finance_manager"),
  payrollReviewRoutes,
);

app.use(errorMiddleware);

export default app;