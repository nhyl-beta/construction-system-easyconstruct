// client/src/features/documents/hooks/use-field-documents.ts — NEW
import { useCallback, useEffect, useState } from "react";
import { documentsRepository, type CreateDocumentInput, type DocumentRecord } from "../repositories/documents.repository";

export function useFieldDocuments() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await documentsRepository.listByProject();
      setDocuments(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const upload = useCallback(
    async (input: CreateDocumentInput) => {
      setUploading(true);
      setError(null);
      try {
        await documentsRepository.upload(input);
        await refresh();
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to upload document";
        setError(message);
        throw new Error(message);
      } finally {
        setUploading(false);
      }
    },
    [refresh],
  );

  return { documents, loading, error, uploading, upload, refresh };
}