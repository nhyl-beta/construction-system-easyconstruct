// src/pages/roles/human-resources/hr-attendance.tsx
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  KpiMini,
  PageHeader,
  StatusBadge,
} from "@/pages/roles/shared/shared-hr";
import { attendanceLogs } from "@/providers/mock-data";
import { Camera, CheckCircle2, Clock, MapPin, ShieldCheck } from "lucide-react";

export default function HRAttendancePage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      <PageHeader
        title="Attendance"
        subtitle="Clock-ins, geofence verification, and photo authentication"
      />

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
    </div>
  );
}
