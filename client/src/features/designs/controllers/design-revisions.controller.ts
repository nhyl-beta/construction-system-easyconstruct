import { useEffect, useState } from "react";
import type { DesignRevision } from "../types/design-revision.types";

export const useDesignRevisionsController = () => {
  const [revisions, setRevisions] = useState<DesignRevision[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/design-revisions")
      .then((res) => res.json())
      .then((json) => setRevisions(json.data ?? []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return { revisions, loading };
};