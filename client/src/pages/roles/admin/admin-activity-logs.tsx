import { useMemo, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { DataTablePagination } from "@/components/refine-ui/data-table/data-table-pagination";
import { usePagination } from "@/hooks/use-pagination";
import { useAuditLogs } from "@/features/audit-logs/hooks/useAuditLogs";
import { formatRelativeTime } from "@/lib/format-relative-time";

const ACTION_TONE: Record<string, string> = {
  created: "bg-primary/10 text-primary border-primary/20",
  approved: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  deleted: "bg-destructive/10 text-destructive border-destructive/20",
  updated: "bg-warning/15 text-warning border-warning/30",
};

export default function AdminActivityLogsPage() {
  const { logs, loading, error, reload } = useAuditLogs();
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState<string | null>(null);
  // K3: filter by project code — audit_logs.project_code is nullable
  // (many entries, e.g. auth/user admin, have no single project).
  const [projectCode, setProjectCode] = useState<string | null>(null);

  const entityTypes = useMemo(() => {
    const set = new Set<string>();
    for (const log of logs) set.add(log.entityType);
    return Array.from(set);
  }, [logs]);

  const projectCodes = useMemo(() => {
    const set = new Set<string>();
    for (const log of logs) if (log.projectCode) set.add(log.projectCode);
    return Array.from(set).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (entityType && log.entityType !== entityType) return false;
      if (projectCode && log.projectCode !== projectCode) return false;
      if (search) {
        const term = search.toLowerCase();
        const haystack = `${log.actor} ${log.action} ${log.entityType} ${log.entityId} ${log.summary ?? ""}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [logs, entityType, search]);

  const pagination = usePagination(filtered, 10);

  return (
    <PageContainer>
      <PageHeader
        title="Activity logs"
        description="System-wide audit trail of create, approve, reject, and delete actions across every module."
      />
      <PageContent className="p-6 md:p-8">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={`cursor-pointer rounded-full text-[11px] ${entityType === null ? "border-primary text-primary" : ""}`}
              onClick={() => setEntityType(null)}
            >
              All ({logs.length})
            </Badge>
            {entityTypes.map((type) => (
              <Badge
                key={type}
                variant="outline"
                className={`cursor-pointer rounded-full text-[11px] capitalize ${entityType === type ? "border-primary text-primary" : ""}`}
                onClick={() => setEntityType(entityType === type ? null : type)}
              >
                {type}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Select value={projectCode ?? "all"} onValueChange={(v) => setProjectCode(v === "all" ? null : v)}>
              <SelectTrigger className="h-9 w-44 rounded-xl text-xs">
                <SelectValue placeholder="All projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projectCodes.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative w-full md:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search activity…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 rounded-xl border-border bg-muted/40 pl-9"
              />
            </div>
          </div>
        </div>

        {loading && <p className="p-5 text-sm text-muted-foreground">Loading activity…</p>}
        {!loading && error && (
          <div className="flex flex-col items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Couldn't load activity logs. {error.message}
            <button className="underline underline-offset-2" onClick={() => reload()}>
              Retry
            </button>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/50 px-6 py-12 text-center">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {logs.length === 0 ? "No activity recorded yet." : "No activity matches your filters."}
            </p>
          </div>
        )}
        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-2.5">Actor</th>
                  <th className="px-3 py-2.5">Action</th>
                  <th className="px-3 py-2.5">Entity</th>
                  <th className="px-3 py-2.5">Project</th>
                  <th className="px-3 py-2.5">Summary</th>
                  <th className="px-5 py-2.5">When</th>
                </tr>
              </thead>
              <tbody>
                {pagination.pageItems.map((log) => (
                  <tr key={log.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-3.5 font-medium">{log.actor}</td>
                    <td className="px-3 py-3.5">
                      <Badge variant="outline" className={`rounded-full text-[10px] capitalize ${ACTION_TONE[log.action] ?? ""}`}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-3 py-3.5 font-mono text-xs text-muted-foreground">
                      {log.entityType} #{log.entityId}
                    </td>
                    <td className="px-3 py-3.5 font-mono text-xs text-muted-foreground">
                      {log.projectCode ?? "—"}
                    </td>
                    <td className="px-3 py-3.5 text-muted-foreground">{log.summary ?? "—"}</td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {formatRelativeTime(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-border/70 px-2 py-3">
              <DataTablePagination {...pagination} />
            </div>
          </div>
        )}
      </PageContent>
    </PageContainer>
  );
}

AdminActivityLogsPage.displayName = "AdminActivityLogsPage";
