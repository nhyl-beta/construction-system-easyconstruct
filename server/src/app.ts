import express from "express";
import { corsMiddleware } from "./middleware/cors.js";
import { errorMiddleware } from "./middleware/error.js";
import { logger } from "./middleware/logger.js";
import { requestId } from "./middleware/request-id.js";
import projectRoutes from "./projects/routes.js";
// import userRoutes        from './modules/users/routes';     // uncomment as built

const app = express();

app.use(express.json());
app.use(corsMiddleware);
app.use(requestId);
app.use(logger);

// ── API Routes ──────────────────────────────────────────────────────────────
app.use("/api/projects", projectRoutes);
// app.use('/api/users',    userRoutes);

// ── Error handler (must be last) ────────────────────────────────────────────
app.use(errorMiddleware);

export default app;
