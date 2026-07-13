import React from "react";
import { PageHeader } from "@/components/refine-ui/views/page-header";

export const ProjectsHeader: React.FC<{ subtitle?: string }> = ({ subtitle }) => {
  return <PageHeader title="Projects" description={subtitle ?? "Portfolio overview"} />;
};
