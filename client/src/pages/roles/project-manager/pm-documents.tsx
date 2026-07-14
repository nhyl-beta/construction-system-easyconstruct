// src/pages/project-manager/pm-documents.tsx
import {
  FileText,
  Upload,
  FolderTree,
  Search,
  Filter,
  History,
  Download,
  ChevronRight,
  FileSignature,
  Image as ImageIcon,
  FileSpreadsheet,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge }   from "@/components/ui/badge";
import { Button }  from "@/components/ui/button";
import { Input }   from "@/components/ui/input";
import {
  documentFolders,
  documentItems,
  type DocumentIconKey,
} from "@/providers/mock-data";

// ─────────────────────────────────────────────────────────────────────────────
// Icon resolver — keeps icons out of mock-data.ts
// ─────────────────────────────────────────────────────────────────────────────

const DOCUMENT_ICONS: Record<DocumentIconKey, LucideIcon> = {
  FileText:        FileText,
  FileSignature:   FileSignature,
  FileSpreadsheet: FileSpreadsheet,
  Image:           ImageIcon,
};

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">

      {/* ── Page header ── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Document repository</h2>
          <p className="text-sm text-muted-foreground">
            2,689 documents across 24 projects · version-controlled
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl">
            <FolderTree className="h-4 w-4" /> Browse all
          </Button>
          <Button className="rounded-xl">
            <Upload className="h-4 w-4" /> Upload
          </Button>
        </div>
      </div>

      {/* ── Folder grid ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {documentFolders.map((f) => (
          <Card
            key={f.name}
            className="cursor-pointer rounded-2xl border-border/70 shadow-sm transition hover:border-primary/40"
          >
            <CardContent className="space-y-1 p-4">
              <FolderTree className="h-5 w-5 text-primary" />
              <div className="text-sm font-medium">{f.name}</div>
              <div className="text-xs tabular-nums text-muted-foreground">{f.count} files</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Recent activity table ── */}
      <Card className="rounded-2xl border-border/70 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base">Recent activity</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search documents…"
                className="h-9 rounded-xl border-border bg-muted/40 pl-9"
              />
            </div>
            <Button variant="outline" size="sm" className="rounded-xl">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
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
                {documentItems.map((d) => {
                  const Icon = DOCUMENT_ICONS[d.iconKey];
                  return (
                    <tr
                      key={d.id}
                      className="border-b border-border/60 last:border-0 hover:bg-muted/30"
                    >
                      {/* Document name + meta */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/60 text-secondary-foreground">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">{d.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {d.id} · by {d.by}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Project */}
                      <td className="px-3 py-3.5 font-mono text-xs text-muted-foreground">
                        {d.project}
                      </td>

                      {/* Type badge */}
                      <td className="px-3 py-3.5">
                        <Badge variant="outline" className="rounded-full text-[10px]">
                          {d.type}
                        </Badge>
                      </td>

                      {/* Version */}
                      <td className="px-3 py-3.5">
                        <span className="font-mono text-xs">{d.version}</span>
                      </td>

                      {/* Size */}
                      <td className="px-3 py-3.5 text-xs tabular-nums text-muted-foreground">
                        {d.size}
                      </td>

                      {/* Updated */}
                      <td className="px-3 py-3.5 text-xs text-muted-foreground">
                        {d.updated}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <History className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}