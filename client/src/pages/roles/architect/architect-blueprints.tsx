import { PageHeader } from "@/components/refine-ui/views/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FileText, Search, Star } from "lucide-react";
import { useBlueprints } from "@/features/blueprint/hooks/useBlueprints";

export default function ArchitectBlueprints() {
  const c = useBlueprints();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <PageHeader title="Blueprint library" description="Every drawing across projects, grouped by folder." />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={c.query} onChange={(e) => c.setQuery(e.target.value)} placeholder="Search blueprints…" className="h-8 rounded-lg pl-8 text-xs" />
        </div>
        <Select value={c.folder} onValueChange={c.setFolder}>
          <SelectTrigger className="h-8 w-40 rounded-lg text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All folders</SelectItem>
            {c.folders.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {c.loading ? (
        <div className="text-sm text-muted-foreground">Loading blueprints…</div>
      ) : c.blueprints.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No blueprints match this view.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {c.blueprints.map((b) => (
            <div key={b.id} className="rounded-2xl border p-4">
              <div className="flex aspect-[4/3] items-center justify-center rounded-xl border-2 border-dashed bg-muted/40 text-xs text-muted-foreground">
                <FileText className="mr-1 h-3.5 w-3.5" /> {b.fileType}
              </div>
              <div className="mt-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{b.drawingNumber} · {b.title}</div>
                  <div className="text-[11px] text-muted-foreground">{b.folder}</div>
                </div>
                {b.favorite && <Star className="h-4 w-4 shrink-0 fill-warning text-warning-foreground" />}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                <StatusBadge status={b.status} />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{b.author}</span>
                <span>Rev {b.revision}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

ArchitectBlueprints.displayName = "ArchitectBlueprints";