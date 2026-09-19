import { useMemo } from "react";
import { AlertTriangle, KeyRound, ShieldAlert, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { useAuditLogs } from "@/features/audit-logs/hooks/useAuditLogs";
import { useSecurityOverview } from "@/features/audit-logs/hooks/useSecurityOverview";
import { formatRelativeTime } from "@/lib/format-relative-time";

// Sensitive actions worth surfacing prominently — the audit-logs table
// already records "rejected"/"deleted" across every module, so this filters
// the same real data rather than inventing a separate security-events table.
const SENSITIVE_ACTIONS = new Set(["rejected", "deleted"]);

export default function AdminSecurityPage() {
  const { logs, loading, error } = useAuditLogs();
  const security = useSecurityOverview();

  const sensitiveEvents = useMemo(
    () => logs.filter((log) => SENSITIVE_ACTIONS.has(log.action)).slice(0, 20),
    [logs],
  );

  return (
    <PageContainer>
      <PageHeader
        title="Security monitoring"
        description="Sensitive operational events (rejections, deletions) drawn from the audit trail."
      />
      <PageContent className="space-y-6 p-6 md:p-8">
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldAlert className="h-4 w-4 text-destructive" />
            Recent sensitive actions
          </h3>
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && error && (
            <p className="text-sm text-destructive">Couldn't load audit data. {error.message}</p>
          )}
          {!loading && !error && sensitiveEvents.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No rejections or deletions recorded — nothing sensitive to review right now.
            </p>
          )}
          {!loading && sensitiveEvents.length > 0 && (
            <div className="space-y-2">
              {sensitiveEvents.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                      {log.action === "deleted" ? (
                        <Trash2 className="h-4 w-4" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {log.actor} {log.action} {log.entityType} #{log.entityId}
                      </p>
                      {log.summary && <p className="text-xs text-muted-foreground">{log.summary}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="rounded-full border-destructive/30 text-[10px] capitalize text-destructive">
                      {log.action}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(log.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Login & session monitoring. The auth endpoint now records every
            sign-in attempt into the audit trail (server/src/auth/service.ts),
            so this panel reads real data instead of standing empty. "Active
            sessions" is derived from successful sign-ins inside the token's
            8h lifetime — the JWT is stateless, so there is no session table
            to enumerate. */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Users className="h-4 w-4 text-primary" />
              Active sessions
              {!security.loading && (
                <span className="text-xs font-normal text-muted-foreground">
                  ({security.sessions.length})
                </span>
              )}
            </h3>
            {security.loading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {!security.loading && security.error && (
              <p className="text-sm text-destructive">
                Couldn't load sign-in activity. {security.error.message}
              </p>
            )}
            {!security.loading && !security.error && security.sessions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nobody has signed in within the last 8 hours.
              </p>
            )}
            {security.sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{s.actor}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.entityId}
                    {s.summary ? ` · ${s.summary}` : ""}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(s.createdAt)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <KeyRound className="h-4 w-4 text-destructive" />
              Failed sign-in attempts
              {!security.loading && (
                <span className="text-xs font-normal text-muted-foreground">
                  ({security.failedLogins.length})
                </span>
              )}
            </h3>
            {security.loading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {!security.loading && !security.error && security.failedLogins.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No failed sign-in attempts recorded.
              </p>
            )}
            {security.failedLogins.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{f.entityId}</p>
                  {f.summary && (
                    <p className="text-xs text-muted-foreground">{f.summary}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(f.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </PageContent>
    </PageContainer>
  );
}

AdminSecurityPage.displayName = "AdminSecurityPage";
