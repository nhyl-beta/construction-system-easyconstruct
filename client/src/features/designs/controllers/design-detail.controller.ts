import { useCallback, useEffect, useState } from "react";
import type { Design } from "../types/design.types";

export const useDesignDetailController = (id: string) => {
  const [design, setDesign] = useState<Design | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDesign = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/designs/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Design not found");
        return res.json();
      })
      .then((json) => setDesign(json.data ?? null))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load design"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchDesign();
  }, [fetchDesign]);

  const remove = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/designs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete design");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete design");
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return { design, loading, error, deleting, remove, refetch: fetchDesign };
};