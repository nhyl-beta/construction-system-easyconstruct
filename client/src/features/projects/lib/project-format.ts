// Seeded projects store `due` as an already-human string ("Jun 30"), while the
// API-backed create flow stores an ISO date ("2027-12-31"). Rendering both raw
// made one column show two formats side by side.
export function formatDue(due: string | null | undefined): string {
  if (!due) return "—";
  const iso = /^\d{4}-\d{2}-\d{2}/.exec(due);
  if (!iso) return due;
  const parsed = new Date(`${iso[0]}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return due;
  const now = new Date();
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(parsed.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  });
}

export function formatContractValue(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  });
}
