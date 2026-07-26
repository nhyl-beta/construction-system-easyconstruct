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
// import userRoutes        from './modules/users/routes';     // uncomment as built

const app = express();

app.use(express.json());
app.use(corsMiddleware);
app.use(requestId);
app.use(logger);

// ── API Routes ──────────────────────────────────────────────────────────────
app.use("/api/projects", projectRoutes);
app.use("/api/designs", designRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/design-revisions", designRevisionsRoutes);
app.use("/api/design-reviews", designReviewsRoutes);
app.use("/api/architect-documents", architectDocumentsRoutes);
app.use("/api/blueprints", blueprintsRoutes);

// app.use('/api/users',    userRoutes);

// ── Error handler (must be last) ────────────────────────────────────────────
app.use(errorMiddleware);

export default app;
