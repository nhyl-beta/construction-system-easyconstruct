// client/src/components/shared/owner-department-picker.tsx
//
// Companion to project-picker.tsx, for the same class of bug: budget "owner /
// department" was free text, so "Structural Eng." and "Structural Engineering"
// became two different owners and no roll-up by department could ever be
// trusted.
//
// A datalist rather than a Select: the owning party is usually one of the
// departments already on the employee roster, but it is legitimately
// open-ended (an external consultancy, a joint venture), so the real values
// are offered as suggestions without forbidding a new one.
import { useMemo } from "react";

import { Input } from "@/components/ui/input";
import { useEmployees } from "@/features/hr/hooks/use-hr";

interface OwnerDepartmentPickerProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
}

const DATALIST_ID = "owner-department-suggestions";

export function OwnerDepartmentPicker({
  value,
  onChange,
  id,
  placeholder = "Structural Engineering",
  className,
}: OwnerDepartmentPickerProps) {
  const { data: employees, loading } = useEmployees();

  // Departments first (the common case), then individual people, so the list
  // reads coarse-to-fine. Both are de-duplicated and sorted.
  const suggestions = useMemo(() => {
    const departments = new Set<string>();
    const people = new Set<string>();

    for (const employee of employees) {
      if (employee.department) departments.add(employee.department);
      if (employee.name) people.add(employee.name);
    }

    return [
      ...Array.from(departments).sort(),
      ...Array.from(people).sort(),
    ];
  }, [employees]);

  return (
    <>
      <Input
        id={id}
        list={DATALIST_ID}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={loading ? "Loading departments…" : placeholder}
        className={className}
        autoComplete="off"
      />
      <datalist id={DATALIST_ID}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </>
  );
}

OwnerDepartmentPicker.displayName = "OwnerDepartmentPicker";
