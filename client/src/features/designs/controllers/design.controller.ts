import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/services/api.client";
import type { Design } from "../types/design.types";

export const useDesignsController = () => {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const [status, setStatus] = useState("all");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    const params = new URLSearchParams();
    if (debouncedQuery) params.set("search", debouncedQuery);
    if (status !== "all") params.set("status", status);

    apiClient
      .get(`/designs?${params.toString()}`, { signal: controller.signal })
      .then((json) => setDesigns(json?.data ?? []))
      .catch((err) => {
        if (err.name !== "AbortError") console.error(err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [debouncedQuery, status]);

  const kpis = useMemo(() => {
    const total = designs.length;
    const inReview = designs.filter((d) => d.status === "In Review").length;
    const approved = designs.filter((d) => d.status === "Approved").length;
    const revisionNeeded = designs.filter((d) => d.status === "Revision Needed").length;
    return { total, inReview, approved, revisionNeeded };
  }, [designs]);

  return { designs, loading, query, setQuery, status, setStatus, kpis };
};