// src/pages/project-manager/pm-documents.tsx
import { useMemo, useState } from "react";
import {
  FileText,
  Upload,
  FolderTree,
  Search,
  Eye,
  FileSignature,
  Image as ImageIcon,
  FileSpreadsheet,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge }   from "@/components/ui/badge";
import { Button }  from "@/components/ui/button";
import { Input }   from "@/components/ui/input";
import { UploadDocumentDialog } from "@/components/documents/upload-document-dialog";
import { FilePreviewDialog } from "@/components/shared/file-preview-dialog";
import { useFieldDocuments } from "@/features/documents/hooks/use-field-documents";
import type { DocumentRecord } from "@/features/documents/repositories/documents.repository";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { DataTablePagination } from "@/components/refine-ui/data-table/data-table-pagination";
import { usePagination } from "@/hooks/use-pagination";

// Icon resolver — mapped from real `type` values (the schema's enum), not
// a separate iconKey field that doesn't exist on this table.
const TYPE_ICONS: Record<string, LucideIcon> = {
  "Field Report": FileText,
  "Site Photo": ImageIcon,
  "Progress Evidence": FileSpreadsheet,
  "Supporting Document": FileSignature,
};


export default function DocumentsPage() {
  const { documents, loading, uploading, upload } = useFieldDocuments();
  const [uploadOpen, setUploadOpen] = useState(false);
  // Same viewer Consultant's advisory register uses — both read the same
  // `documents` table, so both hit the same missing-file and legacy-path
  // rows, and both now report that instead of opening a blank tab.
  const [previewing, setPreviewing] = useState<DocumentRecord | null>(null);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<string | null>(null);

  // Real categories, grouped from the actual data — not a hardcoded folder
  // list with invented counts.
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of documents) counts.set(d.type, (counts.get(d.type) ?? 0) + 1);
    return Array.from(counts.entries()).map(([type, count]) => ({ type, count }));
  }, [documents]);

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      if (activeType && d.type !== activeType) return false;
      if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [documents, activeType, search]);

  // Was the full filtered list rendered in one pass — a repository that
  // grows past a page or two of records had no way to page through it.
  const pagination = usePagination(filtered, 10);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Document repository</h2>
          <p className="text-sm text-muted-foreground">
            {documents.length} document{documents.length === 1 ? "" : "s"} on file
          </p>
        </div>
        <Button className="rounded-xl" onClick={() => setUploadOpen(true)}>
          <Upload className="h-4 w-4" /> Upload
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {categories.map((c) => (
          <Card
            key={c.type}
            onClick={() => setActiveType(activeType === c.type ? null : c.type)}
            className={`cursor-pointer rounded-2xl border-border/70 shadow-sm transition hover:border-primary/40 ${
              activeType === c.type ? "border-primary" : ""
            }`}
          >
            <CardContent className="space-y-1 p-4">
              <FolderTree className="h-5 w-5 text-primary" />
              <div className="text-sm font-medium">{c.type}</div>
              <div className="text-xs tabular-nums text-muted-foreground">{c.count} files</div>
            </CardContent>
          </Card>
        ))}
        {!loading && categories.length === 0 && (
          <p className="col-span-full text-sm text-muted-foreground">No documents yet.</p>
        )}
      </div>

      <Card className="rounded-2xl border-border/70 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base">{activeType ?? "All documents"}</CardTitle>
          <div className="relative w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search documents…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 rounded-xl border-border bg-muted/40 pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading && <p className="p-5 text-sm text-muted-foreground">Loading documents…</p>}
          {!loading && filtered.length === 0 && (
            <p className="p-5 text-sm text-muted-foreground">No matching documents.</p>
          )}
          {!loading && filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-border/70 bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-2.5">Document</th>
                    <th className="px-3 py-2.5">Project</th>
                    <th className="px-3 py-2.5">Type</th>
                    <th className="px-3 py-2.5">Version</th>
                    <th className="px-3 py-2.5">Size</th>
                    <th className="px-3 py-2.5">Updated</th>
                    <th className="px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {pagination.pageItems.map((d) => {
                    const Icon = TYPE_ICONS[d.type] ?? FileText;
                    return (
                      <tr key={d.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/60 text-secondary-foreground">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-medium">{d.title}</div>
                              <div className="text-xs text-muted-foreground">{d.documentId} · by {d.uploadedBy}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 font-mono text-xs text-muted-foreground">{d.project}</td>
                        <td className="px-3 py-3.5">
                          <Badge variant="outline" className="rounded-full text-[10px]">{d.type}</Badge>
                        </td>
                        <td className="px-3 py-3.5"><span className="font-mono text-xs">{d.version}</span></td>
                        <td className="px-3 py-3.5 text-xs tabular-nums text-muted-foreground">{d.size ?? "—"}</td>
                        <td className="px-3 py-3.5 text-xs text-muted-foreground">
                          {formatRelativeTime(d.createdAt)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg"
                              title="View document"
                              onClick={() => setPreviewing(d)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="border-t border-border/70 px-4 py-3">
                <DataTablePagination {...pagination} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <UploadDocumentDialog open={uploadOpen} onOpenChange={setUploadOpen} uploading={uploading} onSubmit={upload} />

      <FilePreviewDialog
        open={previewing !== null}
        onOpenChange={(open) => !open && setPreviewing(null)}
        url={previewing?.fileUrl}
        title={previewing?.title ?? ""}
        description={
          previewing
            ? `${previewing.documentId} · ${previewing.project} · ${previewing.type}`
            : undefined
        }
      />
    </div>
  );
}