import { useNavigate } from "react-router";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { useArchitectProjects } from "@/features/designs/hooks/useArchitectProjects";

export default function ArchitectProjects() {
  const navigate = useNavigate();
  const c = useArchitectProjects();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <PageHeader
        title="Projects"
        description="Projects with active design work. Read-only — project setup and edits stay with Project Management."
      />

      <div className="relative w-64">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={c.query}
          onChange={(e) => c.setQuery(e.target.value)}
          placeholder="Search projects…"
          className="h-8 rounded-lg pl-8 text-xs"
        />
      </div>

      {c.loading ? (
        <div className="text-sm text-muted-foreground">Loading projects…</div>
      ) : c.projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No projects have linked designs yet.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead className="w-40">Progress</TableHead>
              <TableHead>Due</TableHead>
              <TableHead className="text-right">Designs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {c.projects.map((p) => (
              <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/designs?projectCode=${p.code}`)}>
                <TableCell>
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{p.code}</div>
                </TableCell>
                <TableCell><StatusBadge status={p.status} /></TableCell>
                <TableCell><StatusBadge status={p.risk} /></TableCell>
                <TableCell>
                  <Progress value={p.progress} className="h-1.5" />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{p.due}</TableCell>
                <TableCell className="text-right text-sm">{p.designCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

ArchitectProjects.displayName = "ArchitectProjects";