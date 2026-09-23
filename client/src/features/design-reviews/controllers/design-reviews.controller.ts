// controllers/design-reviews.controller.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient } from "@/services/api.client";
import type { DesignReview } from "../types/design-review.types";

export const useDesignReviewsController = () => {
  const [reviews, setReviews] = useState<DesignReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");

  // Was raw fetch() with no Authorization header — authenticate() has always
  // required a Bearer token (server/src/middleware/auth.ts), so this 401'd
  // on every call and the page silently showed "No reviews in this bucket."
  const fetchReviews = useCallback(() => {
    setLoading(true);
    apiClient
      .get("/design-reviews")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((json: any) => setReviews(json.data ?? []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const decide = async (id: number, decision: "Approved" | "Rejected" | "Changes Requested") => {
    await apiClient.post(`/design-reviews/${id}/decide`, { decision });
    fetchReviews();
  };

  const filtered = useMemo(() => {
    if (tab === "pending") return reviews.filter((r) => r.status === "Pending" || r.status === "Changes Requested");
    if (tab === "approved") return reviews.filter((r) => r.status === "Approved");
    return reviews.filter((r) => r.status === "Rejected");
  }, [reviews, tab]);

  return { reviews, filtered, loading, tab, setTab, decide };
};