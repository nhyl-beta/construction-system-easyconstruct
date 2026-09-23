import { useRef, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProjectPicker } from "@/components/shared/project-picker";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { UploadDocumentInput } from "@/features/documents/repositories/documents.repository";

const DOC_TYPES = [
  "Field Report",
  "Site Photo",
  "Progress Evidence",
  "Supporting Document",
  // Lifecycle gate documents (D5) — each one is what a specific gate check
  // reads: P5 (Notice of Award + Contract), C5 (Notice to Proceed), X2
  // (Certificate of Completion). Turnover Document and As-Built Drawing
  // aren't gate-checked but round out project closeout paperwork.
  "Notice of Award",
  "Contract",
  "Notice to Proceed",
  "Certificate of Completion",
  "Turnover Document",
  "As-Built Drawing",
] as const;

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uploading: boolean;
  onSubmit: (input: UploadDocumentInput) => Promise<unknown>;
}

export function UploadDocumentDialog({
  open,
  onOpenChange,
  uploading,
  onSubmit,
}: UploadDocumentDialogProps) {
  const [title, setTitle] = useState("");
  const [project, setProject] = useState("");
  const [type, setType] =
    useState<(typeof DOC_TYPES)[number]>("Field Report");

  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setTitle("");
    setProject("");
    setType("Field Report");

    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !project.trim()) {
      return;
    }

    const file = fileRef.current?.files?.[0];

    if (!file) {
      return;
    }

    try {
      await onSubmit({
        file,
        title: title.trim(),
        project: project.trim(),
        type,
      });

      reset();
      onOpenChange(false);
    } catch {
      // upload() already surfaces a toast + error state; keep the dialog
      // open so the user can retry without re-picking the file.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload document</DialogTitle>

          <DialogDescription>
            Upload a document and register it against a project. The
            selected file will be sent to the document upload endpoint.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="doc-title">Title</Label>

            <Input
              id="doc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Foundation pour — Zone B"
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Project</Label>

            {/* Was a free-text field: a typo or case mismatch here produced a
                `project` value that matched no real project code, which then
                silently failed the PM-scoped project filter in
                GET /documents (server/src/documents/controller.ts) — the
                document existed but could never appear in this PM's own
                repository view. A picker over real project codes makes that
                mismatch impossible. */}
            <ProjectPicker value={project} onChange={setProject} className="w-full" />
          </div>

          <div className="grid gap-1.5">
            <Label>Document type</Label>

            <Select
              value={type}
              onValueChange={(value) =>
                setType(value as (typeof DOC_TYPES)[number])
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {DOC_TYPES.map((documentType) => (
                  <SelectItem key={documentType} value={documentType}>
                    {documentType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="doc-file">File</Label>

            <Input
              id="doc-file"
              ref={fileRef}
              type="file"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
            disabled={uploading}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={
              uploading ||
              !title.trim() ||
              !project.trim()
            }
          >
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
