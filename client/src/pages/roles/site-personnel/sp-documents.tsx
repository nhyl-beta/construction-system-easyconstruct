// client/src/pages/roles/site-personnel/sp-documents.tsx — NEW
import { useRef, useState } from "react";
import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { SectionCard } from "@/components/ui/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText } from "lucide-react";
import { useFieldDocuments } from "@/features/documents/hooks/use-field-documents";

const DOC_TYPES = ["Field Report", "Site Photo", "Progress Evidence", "Supporting Document"] as const;

export default function SPDocumentsPage() {
  const { documents, loading, error, uploading, upload } = useFieldDocuments();
  const [title, setTitle] = useState("");
  const [project, setProject] = useState("");
  const [type, setType] = useState<(typeof DOC_TYPES)[number]>("Field Report");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!title || !project) return;
    const file = fileRef.current?.files?.[0];
    // TODO: no object storage provider configured — see Part 2 preamble.
    // Storing a placeholder reference until real upload infra exists.
    const fileUrl = file ? `local-upload-${Date.now()}-${file.name}` : undefined;
    await upload({
      documentId: `DOC-${Date.now()}`,
      title,
      project,
      type,
      fileUrl,
    });
    setTitle("");
    setProject("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <PageContainer>
      <PageHeader title="Field Documentation" description="Upload site photos, field reports, and progress evidence" />
      <PageContent className="p-6 md:p-8 space-y-6">
        <SectionCard title="Upload document">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Project code</Label>
              <Input value={project} onChange={(e) => setProject(e.target.value)} placeholder="e.g. PRJ-2024-01" />
            </div>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Foundation pour — Zone B" />
            </div>
            <div className="space-y-1.5">
              <Label>Document type</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={type}
                onChange={(e) => setType(e.target.value as (typeof DOC_TYPES)[number])}
              >
                {DOC_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>File</Label>
              <Input ref={fileRef} type="file" />
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <Button className="mt-4 rounded-xl" disabled={uploading || !title || !project} onClick={handleUpload}>
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Uploading…" : "Upload document"}
          </Button>
        </SectionCard>

        <SectionCard title="Recent uploads">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading documents…</p>
          ) : documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
          ) : (
            <div className="space-y-2">
              {documents.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-xl border p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{d.title}</div>
                      <div className="text-xs text-muted-foreground">{d.project} · {d.type} · {d.version}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </PageContent>
    </PageContainer>
  );
}

SPDocumentsPage.displayName = "SPDocumentsPage";