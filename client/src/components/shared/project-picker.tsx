// client/src/components/shared/project-picker.tsx — NEW
//
// Root-causes a real, demonstrated bug: several forms across the app took a
// free-text "project code" string with no validation, so a typo silently
// produced a record that would never match a real project in any
// project-scoped query. This replaces free text with a picker backed by the
// same `/api/projects` list every other project-aware feature already uses.
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjects } from "@/features/projects/hooks/useProjects";

interface ProjectPickerProps {
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  className?: string;
}

export function ProjectPicker({
  value,
  onChange,
  placeholder = "Select a project",
  className,
}: ProjectPickerProps) {
  const { projects, loading } = useProjects();

  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={loading ? "Loading projects…" : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {projects.length === 0 && !loading && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            No projects on file
          </div>
        )}
        {projects.map((p) => (
          <SelectItem key={p.code} value={p.code}>
            {p.code} · {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
