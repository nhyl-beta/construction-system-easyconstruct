import { useEngineeringReportsController } from "../controllers/engineering-report.controller";

export const useEngineeringReports = (scope: "progress" | "issues" | "all" = "all") => {
  // Thin alias so future Refine integration can swap implementations in one place.
  return useEngineeringReportsController(scope);
};