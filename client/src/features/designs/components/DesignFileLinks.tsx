import { Paperclip } from "lucide-react";
import { toast } from "sonner";
import { openFileUrl } from "@/lib/file-url";
import type { Design } from "../types/design.types";

/** Files the architect attached to a design, opened through the authenticated file route. */
export function DesignFileLinks({ files }: { files: Design["fileUrls"] }) {
  if (!files || files.length === 0) {
    return <p className="text-xs text-muted-foreground">No files attached to this design.</p>;
  }
  return (
    <ul className="flex flex-wrap gap-2">
      {files.map((f) => (
        <li key={f.url}>
          <button
            type="button"
            className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-primary hover:bg-muted/40"
            onClick={(e) => {
              e.stopPropagation();
              void openFileUrl(f.url).catch((err: Error) => toast.error(err.message));
            }}
          >
            <Paperclip className="h-3 w-3" /> {f.name}
          </button>
        </li>
      ))}
    </ul>
  );
}
