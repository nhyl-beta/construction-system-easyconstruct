// controllers/design-reviews.controller.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DesignReview } from "../types/design-review.types";

export const useDesignReviewsController = () => {
  const [reviews, setReviews] = useState<DesignReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");

  const fetchReviews = useCallback(() => {
    setLoading(true);
    fetch("/api/design-reviews")
      .then((res) => res.json())
      .then((json) => setReviews(json.data ?? []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const decide = async (id: number, decision: "Approved" | "Rejected" | "Changes Requested") => {
    await fetch(`/api/design-reviews/${id}/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    fetchReviews();
  };

  const filtered = useMemo(() => {
    if (tab === "pending") return reviews.filter((r) => r.status === "Pending" || r.status === "Changes Requested");
    if (tab === "approved") return reviews.filter((r) => r.status === "Approved");
    return reviews.filter((r) => r.status === "Rejected");
  }, [reviews, tab]);

  return { reviews, filtered, loading, tab, setTab, decide };
};