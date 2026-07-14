// src/pages/human-resources/hr-dashboard.tsx
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  attendanceLogs,
  attendanceWeek,
  departments,
  employees,
  hrAIInsights,
  hrActivity,
  hrNotifications,
  hrReports,
  payrollRows,
  workforceSites,
  type Employee,
  type ToneBg,
} from "@/providers/mock-data";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  CalendarCheck,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileBarChart2,
  Filter,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserX,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function toneBg(tone: ToneBg) {
  switch (tone) {
    case "success":
      return "bg-success/10 text-success";
    case "warning":
      return "bg-warning/15 text-warning";
    case "destructive":
      return "bg-destructive/10 text-destructive";
    case "info":
      return "bg-info/10 text-info";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: "bg-success/10 text-success border-success/20",
    "On Leave": "bg-warning/15 text-warning border-warning/30",
    Suspended: "bg-destructive/10 text-destructive border-destructive/20",
    Archived: "bg-muted text-muted-foreground border-border",
    Verified: "bg-success/10 text-success border-success/20",
    Pending: "bg-warning/15 text-warning border-warning/30",
    Flagged: "bg-destructive/10 text-destructive border-destructive/20",
    Approved: "bg-success/10 text-success border-success/20",
    Review: "bg-destructive/10 text-destructive border-destructive/20",
  };
  return (
    <Badge
      variant="outline"
      className={`rounded-full text-[10px] ${map[status] ?? ""}`}
    >
      {status}
    </Badge>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-sm ${dot}`} />
      <span>{label}</span>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "destructive";
}) {
  const color =
    tone === "success"
      ? "text-success"
      : tone === "warning"
      ? "text-warning"
      : "text-destructive";
  return (
    <div className="rounded-lg border bg-muted/20 p-2">
      <div className={`text-lg font-semibold ${color}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function KpiMini({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "destructive" | "info";
  icon: LucideIcon;
}) {
  const bg =
    tone === "success"
      ? "bg-success/10 text-success"
      : tone === "warning"
      ? "bg-warning/15 text-warning"
      : tone === "destructive"
      ? "bg-destructive/10 text-destructive"
      : "bg-info/10 text-info";
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="mt-3 text-xl font-semibold tracking-tight">{value}</div>
        <div className="text-[11px] text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function Checkpoint({ label, done }: { label: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-4 w-4 items-center justify-center rounded-full border ${
          done
            ? "border-success bg-success/15 text-success"
            : "border-border text-muted-foreground"
        }`}
      >
        {done && <CheckCircle2 className="h-3 w-3" />}
      </div>
      <span className={done ? "text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
    </div>
  );
}

function Capacity({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: "primary" | "info" | "warning";
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const bg =
    tone === "primary"
      ? "bg-primary"
      : tone === "info"
      ? "bg-info"
      : "bg-warning";
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${bg}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Insights Card
// ─────────────────────────────────────────────────────────────────────────────

function AIInsightsCard() {
  return (
    <Card className="rounded-2xl border-ai/20 bg-gradient-to-b from-ai-soft/60 to-transparent">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ai text-ai-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base">AI HR assistant</CardTitle>
            <p className="text-xs text-muted-foreground">
              Advisory — review before acting
            </p>
          </div>
        </div>
        <Badge variant="outline" className="rounded-full border-ai/30 text-ai">
          Live
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {hrAIInsights.map((i) => (
          <div
            key={i.title}
            className="rounded-xl border border-ai/15 bg-background/60 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm font-medium leading-snug">{i.title}</div>
              <Badge variant="outline" className="rounded-full text-[10px]">
                {Math.round(i.confidence * 100)}% conf.
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{i.detail}</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">Impact:</span>{" "}
                {i.impact}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 rounded-lg px-2 text-xs text-ai hover:bg-ai-soft"
              >
                {i.action} <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sections
// ─────────────────────────────────────────────────────────────────────────────

function OverviewSection() {
  const kpis = [
    {
      label: "Total employees",
      value: "518",
      delta: "+12 this month",
      up: true,
      icon: Users,
    },
    {
      label: "Active today",
      value: "478",
      delta: "92.3% attendance",
      up: true,
      icon: UserCheck,
    },
    {
      label: "Absent / on leave",
      value: "40",
      delta: "-6 vs yesterday",
      up: true,
      icon: UserX,
    },
    {
      label: "Open attendance issues",
      value: "14",
      delta: "+3 needs review",
      up: false,
      icon: AlertTriangle,
    },
    {
      label: "Payroll cycle",
      value: "73%",
      delta: "Cut-off in 2 days",
      up: true,
      icon: Wallet,
    },
    {
      label: "Avg attendance rate",
      value: "94.8%",
      delta: "+1.2 pts MoM",
      up: true,
      icon: CalendarCheck,
    },
  ];

  return (
    <>
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <Card key={k.label} className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <k.icon className="h-4 w-4" />
                </div>
                {k.up ? (
                  <TrendingUp className="h-3.5 w-3.5 text-success" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-warning" />
                )}
              </div>
              <div className="mt-3 text-2xl font-semibold tracking-tight">
                {k.value}
              </div>
              <div className="text-[11px] text-muted-foreground">{k.label}</div>
              <div className="mt-1 text-[11px] text-muted-foreground/80">
                {k.delta}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + AI */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="rounded-2xl xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Weekly attendance</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Present · late · absent across all active sites
              </p>
            </div>
            <Badge variant="outline" className="rounded-full">
              This week
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="flex h-56 items-end gap-3">
              {attendanceWeek.map((d) => {
                const max = 530;
                return (
                  <div
                    key={d.day}
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    <div className="flex h-44 w-full flex-col-reverse overflow-hidden rounded-lg border bg-muted/30">
                      <div
                        className="bg-primary"
                        style={{ height: `${(d.present / max) * 100}%` }}
                        title={`Present ${d.present}`}
                      />
                      <div
                        className="bg-warning/80"
                        style={{ height: `${(d.late / max) * 100}%` }}
                        title={`Late ${d.late}`}
                      />
                      <div
                        className="bg-destructive/70"
                        style={{ height: `${(d.absent / max) * 100}%` }}
                        title={`Absent ${d.absent}`}
                      />
                    </div>
                    <div className="text-[11px] font-medium text-muted-foreground">
                      {d.day}
                    </div>
                    <div className="text-[10px] text-muted-foreground/70">
                      {d.present + d.late + d.absent}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
              <Legend dot="bg-primary" label="Present" />
              <Legend dot="bg-warning/80" label="Late" />
              <Legend dot="bg-destructive/70" label="Absent" />
            </div>
          </CardContent>
        </Card>
        <AIInsightsCard />
      </div>

      {/* Department + Payroll + Activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Department allocation */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Department allocation</CardTitle>
            <p className="text-xs text-muted-foreground">
              Headcount by department
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {departments.map((d) => {
              const total = departments.reduce((s, x) => s + x.count, 0);
              const pct = Math.round((d.count / total) * 100);
              return (
                <div key={d.name}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{d.name}</span>
                    <span className="text-muted-foreground">
                      {d.count} · {pct}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full ${d.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Payroll status */}
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Payroll status</CardTitle>
            <Badge variant="secondary" className="rounded-full">
              Period · Jun 1–15
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-semibold tracking-tight">
                    $2.84M
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Gross labor (period)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-success">+4.1%</div>
                  <div className="text-[11px] text-muted-foreground">
                    vs last period
                  </div>
                </div>
              </div>
              <Progress value={73} className="mt-3 h-2" />
              <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>73% reviewed</span>
                <span>Cut-off in 2d 6h</span>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-3 gap-3 text-center">
              <MiniStat label="Approved" value="378" tone="success" />
              <MiniStat label="Pending" value="124" tone="warning" />
              <MiniStat label="Review" value="16" tone="destructive" />
            </div>
          </CardContent>
        </Card>

        {/* Recent HR activity */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Recent HR activity</CardTitle>
            <p className="text-xs text-muted-foreground">
              Latest changes across people ops
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {hrActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg ${toneBg(
                    a.tone,
                  )}`}
                >
                  <Activity className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{a.text}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {a.time} ago
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function EmployeesSection() {
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("all");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(
    () =>
      employees.filter((e) => {
        const q = query.toLowerCase();
        const matchQ =
          !query ||
          e.name.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q) ||
          e.role.toLowerCase().includes(q);
        const matchD = dept === "all" || e.department === dept;
        const matchS = status === "all" || e.status === status;
        return matchQ && matchD && matchS;
      }),
    [query, dept, status],
  );

  return (
    <>
      <Card className="rounded-2xl">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, ID, or role…"
              className="h-9 rounded-xl border-border bg-muted/40 pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger className="h-9 w-[170px] rounded-xl">
                <Filter className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.name} value={d.name}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-[140px] rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="rounded-xl">
              <Download className="h-4 w-4" /> CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Employee directory</CardTitle>
            <p className="text-xs text-muted-foreground">
              {filtered.length} of {employees.length} employees · bulk actions
              available
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-xl">
              Archive
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl">
              Reassign
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[260px]">Employee</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Attendance</TableHead>
                <TableHead className="text-right">Perf.</TableHead>
                <TableHead className="w-[40px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => (
                <EmployeeRow key={e.id} e={e} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

function EmployeeRow({ e }: { e: Employee }) {
  return (
    <TableRow className="hover:bg-muted/40">
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary-soft text-xs font-semibold text-primary">
              {e.initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{e.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">
              Hired {e.hiredOn}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">
        {e.id}
      </TableCell>
      <TableCell className="text-sm">{e.role}</TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {e.department}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{e.site}</TableCell>
      <TableCell>
        <StatusBadge status={e.status} />
      </TableCell>
      <TableCell className="text-right">
        <span
          className={
            e.attendanceRate >= 95
              ? "text-success"
              : e.attendanceRate >= 85
              ? "text-warning"
              : "text-destructive"
          }
        >
          {e.attendanceRate}%
        </span>
      </TableCell>
      <TableCell className="text-right text-sm">
        {e.performance.toFixed(1)}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View profile</DropdownMenuItem>
            <DropdownMenuItem>Edit record</DropdownMenuItem>
            <DropdownMenuItem>Employment history</DropdownMenuItem>
            <DropdownMenuItem>Documents</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function AttendanceSection() {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiMini
          label="Verified today"
          value="436"
          tone="success"
          icon={CheckCircle2}
        />
        <KpiMini
          label="Pending verification"
          value="28"
          tone="warning"
          icon={Clock}
        />
        <KpiMini
          label="Geofence flags"
          value="9"
          tone="destructive"
          icon={MapPin}
        />
        <KpiMini
          label="Photo auth failures"
          value="5"
          tone="destructive"
          icon={Camera}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="rounded-2xl xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">
                Today's attendance log
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Clock-ins, geofence and photo authentication results
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="rounded-xl">
                Bulk verify
              </Button>
              <Button size="sm" className="rounded-xl">
                <ShieldCheck className="h-4 w-4" /> Resolve flags
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Clock in</TableHead>
                  <TableHead>Clock out</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead>Geofence</TableHead>
                  <TableHead>Photo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceLogs.map((l) => (
                  <TableRow key={l.empId} className="hover:bg-muted/40">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-primary-soft text-[10px] font-semibold text-primary">
                            {l.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{l.name}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">
                            {l.empId}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {l.site}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {l.clockIn}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {l.clockOut}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {l.hours.toFixed(1)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`rounded-full text-[10px] ${
                          l.geofence === "Inside"
                            ? "border-success/30 text-success"
                            : l.geofence === "Edge"
                            ? "border-warning/30 text-warning"
                            : "border-destructive/30 text-destructive"
                        }`}
                      >
                        <MapPin className="mr-1 h-3 w-3" /> {l.geofence}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`rounded-full text-[10px] ${
                          l.photo === "Verified"
                            ? "border-success/30 text-success"
                            : l.photo === "Pending"
                            ? "border-warning/30 text-warning"
                            : "border-destructive/30 text-destructive"
                        }`}
                      >
                        <Camera className="mr-1 h-3 w-3" /> {l.photo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={l.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Site heatmap</CardTitle>
            <p className="text-xs text-muted-foreground">
              Attendance density · last 14 days
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                "Westgate Tower",
                "Harborline Hub",
                "Northgate Plaza",
                "Phoenix HQ",
              ].map((site) => (
                <div key={site}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium">{site}</span>
                    <span className="text-muted-foreground">14d</span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 14 }).map((_, i) => {
                      const intensity = Math.round(40 + Math.random() * 60);
                      return (
                        <div
                          key={i}
                          className="h-5 flex-1 rounded-sm"
                          style={{
                            backgroundColor: `color-mix(in oklch, var(--color-primary) ${intensity}%, transparent)`,
                          }}
                          title={`Day ${i + 1}: ${intensity}%`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">On-time rate</span>
                <span className="font-medium text-success">91.4%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Late arrivals (avg)
                </span>
                <span className="font-medium">18 / day</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Avg shift length</span>
                <span className="font-medium">9.4 h</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function PayrollSection() {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiMini
          label="Gross labor (period)"
          value="$2.84M"
          tone="info"
          icon={Wallet}
        />
        <KpiMini
          label="Net payable"
          value="$2.28M"
          tone="success"
          icon={CheckCircle2}
        />
        <KpiMini
          label="Overtime cost"
          value="$184K"
          tone="warning"
          icon={Clock}
        />
        <KpiMini
          label="Awaiting approval"
          value="124"
          tone="warning"
          icon={AlertTriangle}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="rounded-2xl xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Payroll batch B-118</CardTitle>
              <p className="text-xs text-muted-foreground">
                Pay period Jun 1 – Jun 15 · 518 employees
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="rounded-xl">
                <Download className="h-4 w-4" /> Export
              </Button>
              <Button size="sm" className="rounded-xl">
                Approve batch <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead className="text-right">OT</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollRows.map((p) => (
                  <TableRow key={p.empId} className="hover:bg-muted/40">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-primary-soft text-[10px] font-semibold text-primary">
                            {p.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{p.name}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">
                            {p.empId}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.role}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {p.hours}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {p.overtime}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      ${p.gross.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      −${p.deductions.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold">
                      ${p.net.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Period summary</CardTitle>
            <p className="text-xs text-muted-foreground">
              Distribution & checkpoints
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="text-xs text-muted-foreground">Total payable</div>
              <div className="mt-1 text-2xl font-semibold tracking-tight">
                $2,284,910
              </div>
              <div className="mt-2 text-[11px] text-success">
                +4.1% vs prev period
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: "Base wages", value: 78, amount: "$2.21M" },
                { label: "Overtime", value: 6, amount: "$184K" },
                { label: "Bonuses", value: 4, amount: "$112K" },
                { label: "Deductions", value: 12, amount: "$336K" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="flex items-center justify-between text-xs">
                    <span>{s.label}</span>
                    <span className="text-muted-foreground">{s.amount}</span>
                  </div>
                  <Progress value={s.value} className="mt-1 h-1.5" />
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-2 text-xs">
              <Checkpoint label="Attendance reconciled" done />
              <Checkpoint label="Gross labor verified" done />
              <Checkpoint label="Manager approvals" />
              <Checkpoint label="Disbursement initiated" />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function WorkforceSection() {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiMini label="Total capacity" value="480" tone="info" icon={Users} />
        <KpiMini
          label="Assigned today"
          value="418"
          tone="success"
          icon={UserCheck}
        />
        <KpiMini label="Available" value="62" tone="warning" icon={Activity} />
        <KpiMini
          label="Overtime crews"
          value="17"
          tone="destructive"
          icon={Clock}
        />
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">
            Workforce allocation board
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Per-site utilization, availability & overtime exposure
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {workforceSites.map((s) => {
            const util = Math.round((s.assigned / s.capacity) * 100);
            return (
              <div key={s.name} className="rounded-xl border p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-semibold">{s.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.assigned} assigned · {s.available} available · {s.ot}{" "}
                      on overtime
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={`rounded-full ${
                        util > 90
                          ? "border-warning/40 text-warning"
                          : "border-success/30 text-success"
                      }`}
                    >
                      {util}% utilization
                    </Badge>
                    <Button variant="outline" size="sm" className="rounded-xl">
                      Rebalance <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                  <Capacity
                    label="Assigned"
                    value={s.assigned}
                    max={s.capacity}
                    tone="primary"
                  />
                  <Capacity
                    label="Available"
                    value={s.available}
                    max={s.capacity}
                    tone="info"
                  />
                  <Capacity
                    label="Overtime"
                    value={s.ot}
                    max={20}
                    tone="warning"
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </>
  );
}

function ReportsSection() {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {hrReports.map((r) => (
          <Card key={r.title} className="rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <FileBarChart2 className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="rounded-full text-[10px]">
                  {r.tag}
                </Badge>
              </div>
              <h3 className="mt-3 text-sm font-semibold">{r.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{r.desc}</p>
              <div className="mt-4 flex items-center gap-2">
                <Button size="sm" variant="outline" className="rounded-xl">
                  <Download className="h-4 w-4" /> Export
                </Button>
                <Button size="sm" variant="ghost" className="rounded-xl">
                  Open <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Notifications center</CardTitle>
          <p className="text-xs text-muted-foreground">
            HR alerts requiring action
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {hrNotifications.map((n, i) => (
            <div
              key={i}
              className="flex items-start justify-between rounded-xl border bg-muted/20 px-4 py-3"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneBg(
                    n.tone,
                  )}`}
                >
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">{n.title}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {n.time}
                  </div>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="rounded-lg">
                Review
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function HRDashboardPage() {
  const [tab, setTab] = useState("overview");

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-muted-foreground">
            Current section ·{" "}
            <span className="font-medium text-foreground">{tab}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-xl">
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button size="sm" className="rounded-xl" asChild>
              <Link to="/employees/new">
                <Plus className="h-4 w-4" /> Add employee
              </Link>
            </Button>
          </div>
        </div>

        <TabsList className="h-10 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg">
            Overview
          </TabsTrigger>
          <TabsTrigger value="employees" className="rounded-lg">
            Employees
          </TabsTrigger>
          <TabsTrigger value="attendance" className="rounded-lg">
            Attendance
          </TabsTrigger>
          <TabsTrigger value="payroll" className="rounded-lg">
            Payroll
          </TabsTrigger>
          <TabsTrigger value="workforce" className="rounded-lg">
            Workforce
          </TabsTrigger>
          <TabsTrigger value="reports" className="rounded-lg">
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewSection />
        </TabsContent>
        <TabsContent value="employees" className="space-y-6">
          <EmployeesSection />
        </TabsContent>
        <TabsContent value="attendance" className="space-y-6">
          <AttendanceSection />
        </TabsContent>
        <TabsContent value="payroll" className="space-y-6">
          <PayrollSection />
        </TabsContent>
        <TabsContent value="workforce" className="space-y-6">
          <WorkforceSection />
        </TabsContent>
        <TabsContent value="reports" className="space-y-6">
          <ReportsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
