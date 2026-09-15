// client/src/pages/roles/site-personnel/sp-dashboard.tsx — NEW
import { useNavigate } from "react-router";
import { KpiStrip } from "@/components/ui/kpi-strip";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { useRoleConfig } from "@/hooks/use-role-config";
import { useAuth } from "@/auth/auth-context";
import { useMemo } from "react";
import {
  UserCheck,
  CheckSquare,
  ClipboardList,
  ShieldAlert,
  MapPin,
  Camera,
  FileText,
} from "lucide-react";
import { useAttendance } from "@/features/attendance/hooks/use-attendance";
import { useMyTasks } from "@/features/tasks/hooks/use-my-tasks";
import { useMyIssues } from "@/features/issues/hooks/use-my-issues";
import { useFieldDocuments } from "@/features/documents/hooks/use-field-documents";

function useMyEmployeeId(): string | null {
  const { user } = useAuth();
  return useMemo(() => (user ? user.email.split("@")[0] : null), [user]);
}

export default function SPDashboardPage() {
  const { identity } = useRoleConfig();
  const navigate = useNavigate();
  const employeeId = useMyEmployeeId();

  const attendance = useAttendance(employeeId);
  const myTasks = useMyTasks();
  const myIssues = useMyIssues();
  const myDocs = useFieldDocuments();

  const firstName = identity.name.split(" ")[0];

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8">
      <section className="space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Good shift, {firstName}.</h2>
        <p className="max-w-xl text-sm text-muted-foreground">
          {attendance.today
            ? `You clocked in at ${attendance.today.clockIn}${attendance.today.clockOut ? ` and out at ${attendance.today.clockOut}` : ""} today.`
            : "You haven't logged attendance yet today."}
        </p>
      </section>

      <KpiStrip
        items={[
          {
            label: "Attendance",
            value: attendance.today ? attendance.today.geofence : "Not logged",
            hint: attendance.today ? attendance.today.clockIn : "Log attendance to start your shift",
            icon: UserCheck,
            tone: attendance.today?.geofence === "Inside" ? "good" : attendance.today ? "bad" : "neutral",
          },
          { label: "Tasks today", value: String(myTasks.counts.total), hint: `${myTasks.counts.pending} pending`, icon: CheckSquare },
          { label: "Field documents", value: String(myDocs.documents.length), hint: "Recent uploads", icon: FileText },
          { label: "Open issues", value: String(myIssues.counts.open), icon: ShieldAlert, tone: myIssues.counts.open > 0 ? "warn" : "neutral" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Quick actions">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-auto flex-col items-start gap-1 rounded-xl p-4" onClick={() => navigate("/attendance")}>
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">Log attendance</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start gap-1 rounded-xl p-4" onClick={() => navigate("/tasks")}>
              <CheckSquare className="h-4 w-4" />
              <span className="text-sm font-medium">View tasks</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start gap-1 rounded-xl p-4" onClick={() => navigate("/documents")}>
              <Camera className="h-4 w-4" />
              <span className="text-sm font-medium">Upload document</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start gap-1 rounded-xl p-4" onClick={() => navigate("/issues")}>
              <ClipboardList className="h-4 w-4" />
              <span className="text-sm font-medium">Report issue</span>
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="Today's tasks">
          {myTasks.loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : myTasks.tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks assigned.</p>
          ) : (
            <div className="space-y-2">
              {myTasks.tasks.slice(0, 4).map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-xl border p-3">
                  <div className="text-sm font-medium">{t.title}</div>
                  <StatusBadge status={t.status} />
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

SPDashboardPage.displayName = "SPDashboardPage";