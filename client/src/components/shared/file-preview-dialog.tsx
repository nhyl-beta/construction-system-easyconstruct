// client/src/components/shared/file-preview-dialog.tsx
//
// "View Document" used to be a bare <a target="_blank"> around a stored file
// URL. Handing the file straight to the browser means the app can say nothing
// at all about it: a moved or missing upload produced a raw 404 in a new tab,
// and an office document silently turned into a download. Neither is "showing
// the document" to a reviewer who is trying to confirm what was submitted.
//
// This renders the file in place instead — inline for the formats a browser
// can actually display, with an explicit, readable state for everything else
// and for files that are no longer on the server. Opening in a new tab and
// downloading stay available, they are just no longer the only outcome.
import { useEffect, useState } from "react";
import { Download, ExternalLink, FileWarning, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isRealFileUrl, resolveFileUrl } from "@/lib/file-url";

type PreviewKind = "image" | "pdf" | "other";

/** What the browser can render inline, keyed off the stored file extension. */
function previewKind(url: string): PreviewKind {
  const path = url.split(/[?#]/)[0]?.toLowerCase() ?? "";
  if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(path)) return "image";
  if (/\.pdf$/.test(path)) return "pdf";
  return "other";
}

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Stored URL — absolute (Vercel Blob) or API-relative ("/uploads/..."). */
  url: string | null | undefined;
  title: string;
  /** Optional line under the title: project, version, uploader, date… */
  description?: string;
}

export function FilePreviewDialog({
  open,
  onOpenChange,
  url,
  title,
  description,
}: FilePreviewDialogProps) {
  const resolved = isRealFileUrl(url) ? resolveFileUrl(url as string) : null;
  const kind = resolved ? previewKind(resolved) : "other";

  // "available" is checked rather than assumed: rows survive their files (an
  // upload written to a container's local disk is gone on the next deploy),
  // and a reviewer needs to be told that rather than shown an empty frame.
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!open || !resolved) {
      setAvailable(null);
      return;
    }

    let active = true;
    setAvailable(null);

    fetch(resolved, { method: "HEAD" })
      .then((response) => {
        if (active) setAvailable(response.ok);
      })
      .catch(() => {
        if (active) setAvailable(false);
      });

    return () => {
      active = false;
    };
  }, [open, resolved]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="whitespace-normal break-words">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="whitespace-normal break-words">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex min-h-72 items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-muted/30">
          {!resolved && (
            <PreviewNotice
              title="No file was attached"
              body="This record was created without an uploaded file, so there is nothing to display."
            />
          )}

          {resolved && available === null && (
            <p className="flex items-center gap-2 px-6 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading document…
            </p>
          )}

          {resolved && available === false && (
            <PreviewNotice
              title="This file is no longer on the server"
              body="The record still references it, but the stored file cannot be found. Ask the uploader to attach it again."
            />
          )}

          {resolved && available === true && kind === "image" && (
            <img
              src={resolved}
              alt={title}
              className="max-h-[70vh] w-full object-contain"
            />
          )}

          {resolved && available === true && kind === "pdf" && (
            <iframe
              src={resolved}
              title={title}
              className="h-[70vh] w-full border-0 bg-white"
            />
          )}

          {resolved && available === true && kind === "other" && (
            <PreviewNotice
              title="This format cannot be shown in the browser"
              body="Word, Excel and CAD files have no in-browser viewer. Download it to open in the matching application."
            />
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {resolved && available === true && (
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a href={resolved} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Open in new tab
                </a>
              </Button>
              <Button asChild>
                <a href={resolved} download>
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewNotice({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex max-w-sm flex-col items-center gap-2 px-6 py-12 text-center">
      <FileWarning className="h-5 w-5 text-muted-foreground" />
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{body}</p>
    </div>
  );
}

FilePreviewDialog.displayName = "FilePreviewDialog";
