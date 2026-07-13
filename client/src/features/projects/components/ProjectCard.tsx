import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MapPin, Users } from "lucide-react";
import { Link } from "react-router";
import { Project } from "../types/project.types";
import { STATUS_TONE_CLASS, RISK_CLASS } from "../constants/project-status";

export const ProjectCard: React.FC<{ p: Project }> = ({ p }) => {
  return (
    <Link to={`/projects/${encodeURIComponent(p.code)}`} className="group">
      <Card className="h-full rounded-2xl border-border/70 shadow-sm transition hover:border-primary/40 hover:shadow-md">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs font-mono text-muted-foreground">{p.code}</div>
              <div className="mt-0.5 font-medium leading-tight group-hover:text-primary">{p.name}</div>
            </div>
            <Badge variant="outline" className={`rounded-full px-2 py-0.5 text-[10px] ${STATUS_TONE_CLASS[p.statusTone]}`}>
              {p.status}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.location}</span>
            <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {p.workforce}</span>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Progress</span>
              <span className="tabular-nums">{p.progress}%</span>
            </div>
            <Progress value={p.progress} className="h-1.5" />
          </div>
          <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs">
            <span className="text-muted-foreground">Due {p.due}</span>
            <span className={`font-medium ${RISK_CLASS[p.risk]}`}>{p.risk} risk</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
