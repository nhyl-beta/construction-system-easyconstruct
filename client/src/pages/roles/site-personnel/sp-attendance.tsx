// client/src/pages/roles/site-personnel/sp-attendance.tsx — NEW
import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, MapPin, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { SectionCard } from "@/components/ui/section-card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/auth/auth-context";
import { useAttendance } from "@/features/attendance/hooks/use-attendance";
import { useUploadFile} from "@/features/uploads/hooks/use-upload-file";
import { useMyEmployee } from "@/features/employees/hooks/use-my-employee";
import { useProjects } from "@/features/projects/hooks/useProjects";
import { ProjectMemberRepository } from "@/features/project-members/repositories/project-member.repository";



function useMyEmployeeId(): string | null {
  const { user } = useAuth();
  return useMemo(() => (user ? user.email.split("@")[0] : null), [user]);
}

/** G1: attendance can only be logged against a project this worker is
 * actually staffed on as site personnel — the server enforces this too,
 * but without a scoped picker the page had no way to pick a project at all. */
function useMyStaffedProjectCodes(): string[] {
  const { user } = useAuth();
  const [codes, setCodes] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    ProjectMemberRepository.listForUser(user.id)
      .then((members) => {
        if (cancelled) return;
        setCodes(members.filter((m) => m.role === "site-personnel").map((m) => m.projectCode));
      })
      .catch(() => setCodes([]));
    return () => {
      cancelled = true;
    };
  }, [user]);

  return codes;
}

type GeoState = "idle" | "requesting" | "granted" | "denied";

export default function SPAttendancePage() {
  const { employeeId, loading: employeeLoading, error: employeeError } = useMyEmployee();
  const { today, loading, error, submitting, clockIn, clockOut } = useAttendance(employeeId);

  const { projects } = useProjects();
  const staffedCodes = useMyStaffedProjectCodes();
  const staffedProjects = useMemo(
    () => projects.filter((p) => staffedCodes.includes(p.code)),
    [projects, staffedCodes],
  );
  const [projectCode, setProjectCode] = useState("");

  const {uploadDataUrl, uploading: uploadingPhoto} = useUploadFile();
  const [geoState, setGeoState] = useState<GeoState>("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGeoState("denied");
      return;
    }
    setGeoState("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoState("granted");
      },
      () => setGeoState("denied"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handlePhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const canSubmit = geoState === "granted" && !!photoDataUrl && !!projectCode && !submitting;

  const handleSubmit = async () => {
    if (!coords || !photoDataUrl || !projectCode) return;
    const [, mimeMatch] = /^data:([^;]+);base64,/.exec(photoDataUrl) ?? [];
    const photoUrl = await uploadDataUrl(`attendance-${Date.now()}.jpg`, mimeMatch ?? "image/jpeg", photoDataUrl);
    await clockIn({
      site: "Assigned Site",
      projectCode,
      latitude: coords.lat,
      longitude: coords.lng,
      photoUrl,
    });
    setPhotoDataUrl(null);
    setGeoState("idle");
    setCoords(null);
  };

  return (
    <PageContainer>
      <PageHeader title="Attendance" description="Geofenced, photo-verified attendance for your assigned site" />
      <PageContent className="p-6 md:p-8 space-y-6">
        {!employeeLoading && (!employeeId || employeeError) && (
          <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
            {employeeError ?? "No employee profile is linked to your account yet."}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading today's attendance…</p>
        ) : today ? (
          <SectionCard title="Today's attendance" subtitle={today.logDate}>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Clocked in at {today.clockIn}
              </div>
              {today.clockOut && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Clocked out at {today.clockOut}
                </div>
              )}
              <StatusBadge status={today.geofence} />
              <StatusBadge status={today.photo === "Verified" ? "Verified" : "Pending"} />
            </div>
            {!today.clockOut && (
              <Button className="mt-4 rounded-xl" onClick={() => clockOut()} disabled={submitting}>
                Clock out
              </Button>
            )}
          </SectionCard>
        ) : (
          <SectionCard title="Log attendance" subtitle="Verify your location and identity to clock in">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Select value={projectCode || undefined} onValueChange={setProjectCode}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffedProjects.length === 0 && (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">
                        You are not staffed on any project as site personnel
                      </div>
                    )}
                    {staffedProjects.map((p) => (
                      <SelectItem key={p.code} value={p.code}>
                        {p.code} · {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant={geoState === "granted" ? "outline" : "default"}
                  className="rounded-xl"
                  onClick={requestLocation}
                  disabled={geoState === "requesting"}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  {geoState === "granted" ? "Location verified" : "Verify location"}
                </Button>
                {geoState === "granted" && <CheckCircle2 className="h-5 w-5 text-success" />}
                {geoState === "denied" && (
                  <span className="flex items-center gap-1 text-xs text-destructive">
                    <AlertTriangle className="h-4 w-4" /> Location permission denied — attendance cannot be verified without it.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoSelected}
                />
                <Button
                  variant={photoDataUrl ? "outline" : "default"}
                  className="rounded-xl"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {photoDataUrl ? "Retake photo" : "Take verification photo"}
                </Button>
                {photoDataUrl && <CheckCircle2 className="h-5 w-5 text-success" />}
              </div>

              {photoDataUrl && (
                <img
                  src={photoDataUrl}
                  alt="Attendance verification preview"
                  className="h-40 w-40 rounded-lg border object-cover"
                />
              )}

              <Button className="rounded-xl" disabled={!canSubmit || uploadingPhoto} onClick={handleSubmit}>
                {uploadingPhoto ? "Uploading photo…" : submitting ? "Submitting…" : "Confirm attendance"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Attendance already recorded today can't be duplicated — the server rejects a second clock-in for the same date.
              </p>
            </div>
          </SectionCard>
        )}
      </PageContent>
    </PageContainer>
  );
}

SPAttendancePage.displayName = "SPAttendancePage";