import { useEffect, useMemo, useState } from "react";
import type { Proposal } from "../types/proposal.types";

export const useProposalsController = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    const params = new URLSearchParams();
    if (query) params.set("search", query);
    if (status !== "all") params.set("status", status);

    fetch(`/api/proposals?${params.toString()}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => setProposals(json.data ?? []))
      .catch((err) => {
        if (err.name !== "AbortError") console.error(err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [query, status]);

  const kpis = useMemo(() => {
    const total = proposals.length;
    const pending = proposals.filter((p) => p.status === "Pending").length;
    return { total, pending };
  }, [proposals]);

  return { proposals, loading, query, setQuery, status, setStatus, kpis };
};