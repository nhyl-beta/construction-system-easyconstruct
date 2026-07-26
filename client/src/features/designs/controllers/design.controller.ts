import { useEffect, useMemo, useState } from "react";
import type { Design } from "../types/design.types";

export const useDesignsController = () => {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    const params = new URLSearchParams();
    if (query) params.set("search", query);
    if (status !== "all") params.set("status", status);

    fetch(`/api/designs?${params.toString()}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => setDesigns(json.data ?? []))
      .catch((err) => {
        if (err.name !== "AbortError") console.error(err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [query, status]);

  const kpis = useMemo(() => {
    const total = designs.length;
    const inReview = designs.filter((d) => d.status === "In Review").length;
    const approved = designs.filter((d) => d.status === "Approved").length;
    const revisionNeeded = designs.filter((d) => d.status === "Revision Needed").length;
    return { total, inReview, approved, revisionNeeded };
  }, [designs]);

  return { designs, loading, query, setQuery, status, setStatus, kpis };
};