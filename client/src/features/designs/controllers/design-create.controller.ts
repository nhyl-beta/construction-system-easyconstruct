import { useMemo, useState } from "react";
import { useNavigate } from "react-router";

export interface DesignFormData {
  name: string;
  code: string;
  projectCode: string;
  discipline: string;
  category: string;
  client: string;
  building: string;
  floor: string;
  zone: string;
  version: string;
  revision: number;
  phase: string;
  status: string;
  leadArchitect: string;
  fileCount: number;
  aiCompleteness: number;
  aiConfidence: number;
  description: string;
}

const initialForm: DesignFormData = {
  name: "",
  code: "",
  projectCode: "",
  discipline: "",
  category: "",
  client: "",
  building: "",
  floor: "",
  zone: "",
  version: "v0.1",
  revision: 0,
  phase: "Design Development",
  status: "Draft",
  leadArchitect: "",
  fileCount: 0,
  aiCompleteness: 0,
  aiConfidence: 0,
  description: "",
};

const generateDesignCode = () => {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `DSN-${new Date().getFullYear()}-${rand}`;
};

export const useDesignCreateController = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<DesignFormData>({ ...initialForm, code: generateDesignCode() });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof DesignFormData>(key: K, value: DesignFormData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const regenerateCode = () => set("code", generateDesignCode());

  const stepErrors = useMemo(() => {
    const e: Record<number, string[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
    if (!data.name.trim() || data.name.trim().length < 2) e[1].push("Design name is required");
    if (!data.discipline) e[1].push("Select a discipline");
    if (!data.category) e[1].push("Select a category");
    if (!data.projectCode.trim()) e[2].push("Project code is required");
    if (!data.version.trim()) e[3].push("Version is required");
    if (!data.leadArchitect.trim()) e[4].push("Lead architect is required");
    return e;
  }, [data]);

  const canAdvance = stepErrors[step].length === 0;

  const next = () => {
    if (!canAdvance) return false;
    setStep((s) => Math.min(s + 1, 7));
    return true;
  };
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? "Failed to create design");
      navigate(`/designs/${json.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create design.");
    } finally {
      setSubmitting(false);
    }
  };

  return { step, setStep, data, set, regenerateCode, submitting, error, stepErrors, canAdvance, next, back, submit };
};