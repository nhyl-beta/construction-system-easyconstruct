import {
  Activity,
  ChevronRight,
  Server,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComingSoonCard } from "@/components/refine-ui/views/coming-soon-card";
import { KpiStrip } from "@/components/ui/kpi-strip";
import { useRoleConfig } from "@/hooks/use-role-config";
import { useITDesignerDashboardController } from "@/features/dashboard/controllers/it-designer-dashboard.controller";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { useNavigate } from "react-router";

export default function ITDesignerDashboardPage() {
  const { identity } = useRoleConfig();
  const navigate = useNavigate();
  const c = useITDesignerDashboardController();
  const firstName = identity.name.split(" ")[0];

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8">
      {/* ── Hero header ── */}
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Badge
            variant="outline"
            className="rounded-full border-primary/30 bg-primary-soft/60 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-primary"
          >
            <Activity className="mr-1.5 h-3 w-3" />
            Live data
          </Badge>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            System overview, {firstName}.
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            {c.loading
              ? "Loading system data…"
              : `${c.totalUserCount} account${c.totalUserCount === 1 ? "" : "s"} across ${c.roleCount} role${c.roleCount === 1 ? "" : "s"} · ${c.auditEventCount} recorded action${c.auditEventCount === 1 ? "" : "s"}.`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => navigate("/it-designer/activity-logs")}
          >
            <ShieldCheck className="h-4 w-4" />
            Activity logs
          </Button>
          <Button className="rounded-xl" onClick={() => navigate("/it-designer/users")}>
            <UsersRound className="h-4 w-4" />
            User accounts
          </Button>
        </div>
      </section>

      {/* ── KPI grid ── */}
      <KpiStrip
        items={[
          { label: "Total accounts", value: `${c.totalUserCount}`, icon: UsersRound },
          { label: "Active", value: `${c.activeUserCount}`, icon: UserCheck, tone: "good" },
          {
            label: "Deactivated",
            value: `${c.deactivatedUserCount}`,
            icon: UserX,
            tone: c.deactivatedUserCount > 0 ? "warn" : "neutral",
          },
          {
            label: "Sensitive events",
            value: `${c.sensitiveEventCount}`,
            icon: ShieldAlert,
            tone: c.sensitiveEventCount > 0 ? "warn" : "good",
          },
        ]}
      />

      {/* ── Accounts by role + misconfiguration check ── */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="rounded-2xl border-border/70 shadow-sm xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg">Accounts by role</CardTitle>
              <p className="text-xs text-muted-foreground">
                Every configured role, including those nobody holds yet.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg text-muted-foreground"
              onClick={() => navigate("/it-designer/roles-permissions")}
            >
              Roles <ChevronRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {c.usersLoading || c.rolesLoading ? (
              <p className="p-5 text-sm text-muted-foreground">Loading…</p>
            ) : c.usersError || c.rolesError ? (
              <p className="p-5 text-sm text-destructive">
                Couldn't load accounts. {(c.usersError ?? c.rolesError)?.message}
              </p>
            ) : c.usersByRole.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No roles configured yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-border/70 bg-muted/40 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      <th className="px-5 py-2.5 font-medium">Role</th>
                      <th className="px-3 py-2.5 font-medium">Role string</th>
                      <th className="px-5 py-2.5 text-right font-medium">Accounts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.usersByRole.map((row) => (
                      <tr key={row.name} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                        <td className="px-5 py-3 font-medium">{row.label}</td>
                        <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{row.name}</td>
                        <td className="px-5 py-3 text-right tabular-nums">
                          <span className={row.count === 0 ? "text-muted-foreground" : ""}>{row.count}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Configuration check</CardTitle>
            <p className="text-xs text-muted-foreground">
              Accounts whose role matches no configured role can't pass any
              authorization check.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {c.loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : c.orphanedRoleUsers.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-success">
                <ShieldCheck className="h-4 w-4" />
                Every account maps to a configured role.
              </div>
            ) : (
              c.orphanedRoleUsers.map((user) => (
                <div key={user.id} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-medium leading-tight">{user.name}</p>
                  <p className="text-xs text-destructive">
                    Unknown role <span className="font-mono">{user.role}</span>
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Account changes + recent activity ── */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg">Account changes</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg text-muted-foreground"
              onClick={() => navigate("/it-designer/users")}
            >
              Manage <ChevronRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {c.auditLogsLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : c.accountEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No account creations, edits, or deactivations recorded yet.
              </p>
            ) : (
              c.accountEvents.map((log) => (
                <div key={log.id} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-medium leading-tight">{log.summary ?? log.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {log.actor} · {formatRelativeTime(log.createdAt)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg">System activity</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg text-muted-foreground"
              onClick={() => navigate("/it-designer/activity-logs")}
            >
              View all <ChevronRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {c.auditLogsLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : c.auditLogsError ? (
              <p className="text-sm text-destructive">
                Couldn't load the audit trail. {c.auditLogsError.message}
              </p>
            ) : c.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recorded activity yet.</p>
            ) : (
              c.recentActivity.map((log) => (
                <div key={log.id} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-medium leading-tight">
                    {log.actor} <span className="font-normal text-muted-foreground">{log.action}</span>{" "}
                    {log.entityType} {log.entityId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(log.createdAt)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <ComingSoonCard
        title="Infrastructure health & maintenance windows"
        description="Uptime, job queues, and backup status aren't recorded anywhere in the backend yet, so this panel stays empty rather than showing invented numbers. The account, role, and audit data above is live."
      />

      {/* ── Footer status ── */}
      <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
        <Server className="h-3 w-3" />
        Live system data{c.loading ? " · loading…" : ""}
      </div>
    </div>
  );
}

ITDesignerDashboardPage.displayName = "ITDesignerDashboardPage";
