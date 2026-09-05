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
import { Calendar, Info, MapPin } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

const STEPS: Step[] = [
  {
    number: 1,
    title: "Project information",
    subtitle: "Basic details about the project",
  },
  {
    number: 2,
    title: "Scope & schedule",
    subtitle: "Define scope and timeline",
  },
  {
    number: 3,
    title: "Budget & financials",
    subtitle: "Set initial budget and financials",
  },
  {
    number: 4,
    title: "Team & stakeholders",
    subtitle: "Assign team and stakeholders",
  },
  {
    number: 5,
    title: "Review & confirm",
    subtitle: "Review and create project",
  },
];

interface ProjectFormData {
  name: string;
  code: string;
  client: string;
  location: string;
  risk: "Low" | "Medium" | "High";
  description: string;
  due: string;
  pm: string;
  // Collected for UX but not yet persisted — schema doesn't have these columns:
  type: string;
  contractType: string;
  currency: string;
  startDate: string;
}

const initialForm: ProjectFormData = {
  name: "",
  code: "",
  client: "",
  location: "",
  risk: "Low",
  description: "",
  due: "",
  pm: "",
  type: "",
  contractType: "",
  currency: "PHP",
  startDate: "",
};

export default function ProjectCreatePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ProjectFormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof ProjectFormData>(
    key: K,
    value: ProjectFormData[K],
  ) => setData((prev) => ({ ...prev, [key]: value }));

  const handleCancel = () => navigate("/projects");

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      // Mock-only creation — no network call, just simulates success.
      await new Promise((r) => setTimeout(r, 400));
      console.log("Mock project created:", data);
      navigate("/projects");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create project.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MultiStepPage
      title="New project"
      description="Create a new construction project and set up the foundation for success."
      steps={STEPS}
      currentStep={step}
      onNext={() => setStep((s) => Math.min(s + 1, STEPS.length))}
      onBack={() => setStep((s) => Math.max(s - 1, 1))}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
      isLastStep={step === STEPS.length}
      isFirstStep={step === 1}
      submitting={submitting}
      error={error}
      aiHint="Use AI to generate project timeline from a proposal or document."
    >
      {step === 1 && <StepProjectInfo data={data} set={set} />}
      {step === 2 && <StepScopeSchedule />}
      {step === 3 && <StepBudget />}
      {step === 4 && <StepTeam set={set} />}
      {step === 5 && <StepReview data={data} />}
    </MultiStepPage>
  );
}

// ── Step 1 — Project Information ─────────────────────────────────────────────

function StepProjectInfo({
  data,
  set,
}: {
  data: ProjectFormData;
  set: <K extends keyof ProjectFormData>(
    key: K,
    value: ProjectFormData[K],
  ) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-foreground">
          Project information
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Provide the basic details of your new project.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label>
            Project name <span className="text-destructive">*</span>
          </Label>
          <Input
            placeholder="e.g. Westgate Commercial Tower"
            value={data.name}
            onChange={(e) => set("name", e.target.value)}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <Label>
            Project code <span className="text-destructive">*</span>
          </Label>
          <Input
            placeholder="e.g. WGT-2025-001"
            value={data.code}
            onChange={(e) => set("code", e.target.value)}
            className="rounded-xl"
          />
        </div>

        {/* NOTE: value now matches the display string exactly, since Project.client
            is stored/rendered as free text, not a slug. */}
        <div className="space-y-1.5">
          <Label>
            Client / Owner <span className="text-destructive">*</span>
          </Label>
          <Select onValueChange={(v) => set("client", v)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Westgate Health Group">
                Westgate Health Group
              </SelectItem>
              <SelectItem value="Harbor Freight Corp">
                Harbor Freight Corp
              </SelectItem>
              <SelectItem value="City of Riverside">
                City of Riverside
              </SelectItem>
              <SelectItem value="NR Airport Authority">
                NR Airport Authority
              </SelectItem>
              <SelectItem value="GreenPower Inc.">GreenPower Inc.</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Project type</Label>
          <Select onValueChange={(v) => set("type", v)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select project type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Commercial">Commercial</SelectItem>
              <SelectItem value="Residential">Residential</SelectItem>
              <SelectItem value="Infrastructure">Infrastructure</SelectItem>
              <SelectItem value="Industrial">Industrial</SelectItem>
              <SelectItem value="Renewable Energy">Renewable Energy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>
            Location <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Enter project location"
              value={data.location}
              onChange={(e) => set("location", e.target.value)}
              className="rounded-xl pl-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>
            Risk level <span className="text-destructive">*</span>
          </Label>
          <Select
            defaultValue="Low"
            onValueChange={(v) => set("risk", v as ProjectFormData["risk"])}
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="High">🔴 High</SelectItem>
              <SelectItem value="Medium">🟡 Medium</SelectItem>
              <SelectItem value="Low">🟢 Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Contract type</Label>
          <Select onValueChange={(v) => set("contractType", v)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select contract type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Lump Sum">Lump Sum</SelectItem>
              <SelectItem value="Cost Plus">Cost Plus</SelectItem>
              <SelectItem value="Time & Material">Time & Material</SelectItem>
              <SelectItem value="Unit Price">Unit Price</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Currency</Label>
          <Select defaultValue="PHP" onValueChange={(v) => set("currency", v)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PHP">Philippine Peso (PHP)</SelectItem>
              <SelectItem value="USD">US Dollar (USD)</SelectItem>
              <SelectItem value="EUR">Euro (EUR)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea
          placeholder="Brief description of the project, objectives, and key deliverables..."
          value={data.description}
          onChange={(e) => set("description", e.target.value)}
          className="h-28 resize-none rounded-xl"
          maxLength={500}
        />
        <div className="text-right text-[11px] text-muted-foreground">
          {data.description.length}/500
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label>Planned start date</Label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="date"
              value={data.startDate}
              onChange={(e) => set("startDate", e.target.value)}
              className="rounded-xl pl-9"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>
            Due date <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="date"
              value={data.due}
              onChange={(e) => set("due", e.target.value)}
              className="rounded-xl pl-9"
            />
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-info/20 bg-info/5 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
        <p className="text-xs text-muted-foreground">
          You can always edit these details later. All fields marked with{" "}
          <span className="font-medium text-destructive">*</span> are required.
        </p>
      </div>
    </div>
  );
}

// ── Step 2 — Scope & Schedule ─────────────────────────────────────────────────

function StepScopeSchedule() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold">Scope & schedule</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Define the project scope and timeline milestones. (Not yet persisted —
          informational only.)
        </p>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Project scope summary</Label>
          <Textarea
            placeholder="Describe the full scope of work..."
            className="h-32 resize-none rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}

// ── Step 3 — Budget ───────────────────────────────────────────────────────────

function StepBudget() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold">Budget & financials</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Set the initial budget and financial parameters. (Not yet persisted —
          informational only.)
        </p>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label>Total contract value</Label>
          <Input type="number" placeholder="0.00" className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label>Contingency (%)</Label>
          <Input type="number" placeholder="10" className="rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ── Step 4 — Team ─────────────────────────────────────────────────────────────

function StepTeam({
  set,
}: {
  set: <K extends keyof ProjectFormData>(
    key: K,
    value: ProjectFormData[K],
  ) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold">Team & stakeholders</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Assign the project team and key stakeholders.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label>
            Project Manager <span className="text-destructive">*</span>
          </Label>
          <Select onValueChange={(v) => set("pm", v)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select PM" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="M. Rivera">M. Rivera</SelectItem>
              <SelectItem value="T. Okafor">T. Okafor</SelectItem>
              <SelectItem value="S. Aquino">S. Aquino</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// ── Step 5 — Review ───────────────────────────────────────────────────────────

function StepReview({ data }: { data: ProjectFormData }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold">Review & confirm</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirm project details before creating.
        </p>
      </div>
      <div className="divide-y divide-border rounded-xl border border-border bg-muted/30">
        {[
          { label: "Project name", value: data.name || "—" },
          { label: "Project code", value: data.code || "—" },
          { label: "Client", value: data.client || "—" },
          { label: "Location", value: data.location || "—" },
          { label: "Project Manager", value: data.pm || "—" },
          { label: "Risk", value: data.risk },
          { label: "Due date", value: data.due || "—" },
        ].map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between px-5 py-3 text-sm"
          >
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-medium text-foreground">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
