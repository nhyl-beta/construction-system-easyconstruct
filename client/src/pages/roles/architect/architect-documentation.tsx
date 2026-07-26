import { PageHeader } from "@/components/refine-ui/views/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FileText, Search } from "lucide-react";
import { useArchitectDocuments } from "@/features/architect-documents/hooks/useArchitectDocuments";

export default function ArchitectDocumentation() {
  const c = useArchitectDocuments();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <PageHeader title="Documentation" description="Specifications, permits, and supporting documents." />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={c.query} onChange={(e) => c.setQuery(e.target.value)} placeholder="Search documents…" className="h-8 rounded-lg pl-8 text-xs" />
        </div>
        <Select value={c.category} onValueChange={c.setCategory}>
          <SelectTrigger className="h-8 w-40 rounded-lg text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {c.categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {c.loading ? (
        <div className="text-sm text-muted-foreground">Loading documents…</div>
      ) : c.docs.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No documents yet.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {c.docs.map((d) => (
            <div key={d.id} className="rounded-2xl border p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{d.title}</div>
                    <div className="text-[11px] text-muted-foreground">{d.category} · {d.version}</div>
                  </div>
                </div>
                <StatusBadge status={d.status} />
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{d.owner}</span>
                <span>{d.updatedAt ? new Date(d.updatedAt).toLocaleDateString() : "—"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

ArchitectDocumentation.displayName = "ArchitectDocumentation";