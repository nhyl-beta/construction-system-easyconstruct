import { useState } from "react";
import { useNavigate } from "react-router";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiStepPage, type Step } from "@/components/ui/multi-step-page";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useDesignCreate,
  type DesignFormData,
} from "@/features/designs/hooks/useDesignCreate.ts";

const STEPS: Step[] = [
  {
    number: 1,
    title: "Basic information",
    subtitle: "Design name & discipline",
  },
  {
    number: 2,
    title: "Project information",
    subtitle: "Linked project & location",
  },
  {
    number: 3,
    title: "Version information",
    subtitle: "Version, phase & status",
  },
  { number: 4, title: "Team", subtitle: "Lead architect" },
  { number: 5, title: "Files", subtitle: "Expected drawing count" },
  {
    number: 6,
    title: "AI analysis",
    subtitle: "Advisory scores (manual for now)",
  },
  {
    number: 7,
    title: "Review & submit",
    subtitle: "Confirm and create design",
  },
];

export default function ArchitectDesignCreate() {
  const navigate = useNavigate();
  const c = useDesignCreate();
  const [stepError, setStepError] = useState<string | null>(null);

  const handleNext = () => {
    const advanced = c.next();
    setStepError(advanced ? null : c.stepErrors[c.step].join(" · "));
  };
  
  const handleBack = () => {
    setStepError(null);
    c.back();
  };
  return (
    <MultiStepPage
      title="New design"
      description="Register a new design and link it to a project."
      steps={STEPS}
      currentStep={c.step}
      onNext={handleNext}
      onBack={handleBack}
      onCancel={() => navigate(-1)}
      onSubmit={c.submit}
      isLastStep={c.step === STEPS.length}
      isFirstStep={c.step === 1}
      submitting={c.submitting}
      submitLabel="Create Design"
      error = {stepError ?? c.error}
    >
      {c.step === 1 && (
        <StepBasics
          data={c.data}
          set={c.set}
          errors={c.stepErrors[1]}
          code={c.data.code}
          onRegenerate={c.regenerateCode}
        />
      )}
      {c.step === 2 && (
        <StepProject data={c.data} set={c.set} errors={c.stepErrors[2]} />
      )}
      {c.step === 3 && (
        <StepVersion data={c.data} set={c.set} errors={c.stepErrors[3]} />
      )}
      {c.step === 4 && (
        <StepTeam data={c.data} set={c.set} errors={c.stepErrors[4]} />
      )}
      {c.step === 5 && <StepFiles data={c.data} set={c.set} />}
      {c.step === 6 && <StepAi data={c.data} set={c.set} />}
      {c.step === 7 && <StepReview data={c.data} />}
    </MultiStepPage>
  );
}

type SetFn = <K extends keyof DesignFormData>(
  key: K,
  value: DesignFormData[K],
) => void;

function ErrorList({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return (
    <ul className="text-xs text-destructive">
      {errors.map((e) => (
        <li key={e}>{e}</li>
      ))}
    </ul>
  );
}

function StepBasics({
  data,
  set,
  errors,
  code,
  onRegenerate,
}: {
  data: DesignFormData;
  set: SetFn;
  errors: string[];
  code: string;
  onRegenerate: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold">Basic information</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Auto-generated code <span className="font-mono">{code}</span>{" "}
          <button
            type="button"
            className="text-primary underline-offset-2 hover:underline"
            onClick={onRegenerate}
          >
            regenerate
          </button>
        </p>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="col-span-2 space-y-1.5">
          <Label>
            Design name <span className="text-destructive">*</span>
          </Label>
          <Input
            value={data.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Westgate Tower · Floor 14"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label>
            Discipline <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.discipline}
            onValueChange={(v) => set("discipline", v)}
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select discipline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Architectural">Architectural</SelectItem>
              <SelectItem value="Structural">Structural</SelectItem>
              <SelectItem value="MEP">MEP</SelectItem>
              <SelectItem value="Civil">Civil</SelectItem>
              <SelectItem value="Interior">Interior</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>
            Category <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.category}
            onValueChange={(v) => set("category", v)}
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Floor Plan">Floor Plan</SelectItem>
              <SelectItem value="Elevation">Elevation</SelectItem>
              <SelectItem value="Section">Section</SelectItem>
              <SelectItem value="Detail">Detail</SelectItem>
              <SelectItem value="Facade">Facade</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Description</Label>
          <Textarea
            value={data.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Design intent, scope, notes…"
            className="h-28 resize-none rounded-xl"
            maxLength={500}
          />
        </div>
      </div>
      <ErrorList errors={errors} />
    </div>
  );
}

function StepProject({
  data,
  set,
  errors,
}: {
  data: DesignFormData;
  set: SetFn;
  errors: string[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold">Project information</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Which project and location this design belongs to.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label>
            Project code <span className="text-destructive">*</span>
          </Label>
          <Input
            value={data.projectCode}
            onChange={(e) => set("projectCode", e.target.value)}
            placeholder="e.g. WGT-2025-001"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Client</Label>
          <Input
            value={data.client}
            onChange={(e) => set("client", e.target.value)}
            placeholder="Client name"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Building</Label>
          <Input
            value={data.building}
            onChange={(e) => set("building", e.target.value)}
            placeholder="Tower A"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Floor</Label>
          <Input
            value={data.floor}
            onChange={(e) => set("floor", e.target.value)}
            placeholder="14"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Zone</Label>
          <Input
            value={data.zone}
            onChange={(e) => set("zone", e.target.value)}
            placeholder="North"
            className="rounded-xl"
          />
        </div>
      </div>
      <ErrorList errors={errors} />
    </div>
  );
}

function StepVersion({
  data,
  set,
  errors,
}: {
  data: DesignFormData;
  set: SetFn;
  errors: string[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold">Version information</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Version, construction phase, and current status.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label>
            Version <span className="text-destructive">*</span>
          </Label>
          <Input
            value={data.version}
            onChange={(e) => set("version", e.target.value)}
            placeholder="v0.1"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Revision number</Label>
          <Input
            type="number"
            min={0}
            value={data.revision}
            onChange={(e) => set("revision", Number(e.target.value) || 0)}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Phase</Label>
          <Select value={data.phase} onValueChange={(v) => set("phase", v)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Schematic Design">Schematic Design</SelectItem>
              <SelectItem value="Design Development">
                Design Development
              </SelectItem>
              <SelectItem value="Construction Documents">
                Construction Documents
              </SelectItem>
              <SelectItem value="Construction">Construction</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={data.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="In Review">In Review</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Revision Needed">Revision Needed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <ErrorList errors={errors} />
    </div>
  );
}

function StepTeam({
  data,
  set,
  errors,
}: {
  data: DesignFormData;
  set: SetFn;
  errors: string[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold">Team</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Only the lead architect is captured today — the schema doesn't yet
          support additional reviewers/consultants.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label>
            Lead architect <span className="text-destructive">*</span>
          </Label>
          <Input
            value={data.leadArchitect}
            onChange={(e) => set("leadArchitect", e.target.value)}
            placeholder="e.g. M. Rivera"
            className="rounded-xl"
          />
        </div>
      </div>
      <ErrorList errors={errors} />
    </div>
  );
}

function StepFiles({ data, set }: { data: DesignFormData; set: SetFn }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold">Files</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Actual file upload isn't wired to storage yet — record the expected
          sheet count for now.
        </p>
      </div>
      <div className="w-48 space-y-1.5">
        <Label>File count</Label>
        <Input
          type="number"
          min={0}
          value={data.fileCount}
          onChange={(e) => set("fileCount", Number(e.target.value) || 0)}
          className="rounded-xl"
        />
      </div>
    </div>
  );
}

function StepAi({ data, set }: { data: DesignFormData; set: SetFn }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold">AI analysis</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          No live AI pipeline is connected yet — these are manually entered
          placeholder scores.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label>Completeness (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={data.aiCompleteness}
            onChange={(e) => set("aiCompleteness", Number(e.target.value) || 0)}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Confidence (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={data.aiConfidence}
            onChange={(e) => set("aiConfidence", Number(e.target.value) || 0)}
            className="rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}

function StepReview({ data }: { data: DesignFormData }) {
  const rows: [string, string][] = [
    ["Design name", data.name || "—"],
    ["Code", data.code],
    ["Project code", data.projectCode || "—"],
    ["Discipline", data.discipline || "—"],
    ["Category", data.category || "—"],
    ["Version", `${data.version} · rev ${data.revision}`],
    ["Phase", data.phase],
    ["Status", data.status],
    ["Lead architect", data.leadArchitect || "—"],
    ["File count", `${data.fileCount}`],
  ];
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold">Review & confirm</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          This will create a real design record via the API.
        </p>
      </div>
      <div className="divide-y divide-border rounded-xl border border-border bg-muted/30">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between px-5 py-3 text-sm"
          >
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-foreground">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

ArchitectDesignCreate.displayName = "ArchitectDesignCreate";
