import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { Project } from "../types/project.types";
import { STATUS_TONE_CLASS, RISK_CLASS } from "../constants/project-status";

export const ProjectsTable: React.FC<{ projects: Project[] }> = ({ projects }) => {
  return (
    <Card className="rounded-2xl border-border/70 shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/70 bg-muted/40 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-2.5">Project</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Progress</th>
                <th className="px-3 py-2.5">Budget</th>
                <th className="px-3 py-2.5">Workforce</th>
                <th className="px-3 py-2.5">Due</th>
                <th className="px-3 py-2.5">Risk</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.code} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                  <td className="px-5 py-3.5">
                    <Link to={`/projects/${encodeURIComponent(p.code)}`} className="font-medium leading-tight hover:underline">{p.name}</Link>
                    <div className="text-xs text-muted-foreground">{p.code} · {p.client}</div>
                  </td>
                  <td className="px-3 py-3.5">
                    <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_TONE_CLASS[p.statusTone]}`}>{p.status}</Badge>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-2">
                      <Progress value={p.progress} className="h-1.5 w-24" />
                      <span className="w-9 text-xs tabular-nums text-muted-foreground">{p.progress}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <span className={p.budget > 100 ? "text-sm font-medium tabular-nums text-destructive" : "text-sm tabular-nums"}>{p.budget}%</span>
                  </td>
                  <td className="px-3 py-3.5 text-sm tabular-nums">{p.workforce}</td>
                  <td className="px-3 py-3.5 text-sm tabular-nums text-muted-foreground">{p.due}</td>
                  <td className="px-3 py-3.5">
                    <span className={`text-xs font-medium ${RISK_CLASS[p.risk]}`}>{p.risk}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Button asChild variant="ghost" size="sm" className="rounded-lg">
                      <Link to={`/projects/${encodeURIComponent(p.code)}`}>Open <ChevronRight className="h-3.5 w-3.5" /></Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
