import { useProjectsController } from "../controllers/project.controller";

export const useProjects = (initial = "") => {
  // Thin alias so future Refine integration can swap implementations in one place.
  return useProjectsController(initial);
};
