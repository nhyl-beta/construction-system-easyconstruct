import { useMemo } from "react";
import { ReimbursementRepository as repo } from "../repositories/purchasing.repository";
import type { CreateClaimInput, ReimbursementClaim } from "../types/purchasing.types";
import { useRemoteList } from "./use-remote-list";

/**
 * Claims. `scope: "all"` is Finance, Admin and PM (everything they may see);
 * `scope: "mine"` is the claimant's own list (My claims).
 */
export function useReimbursements(scope: "all" | "mine" = "all", enabled = true) {
  const list = useRemoteList<ReimbursementClaim>(() => (scope === "mine" ? repo.mine() : repo.list()), enabled);
  const toEndorse = useMemo(() => list.items.filter((c) => c.status === "pending-pm"), [list.items]);
  /** Money Finance still has to decide or pay. */
  const openAmount = useMemo(
    () => list.items.filter((c) => c.status === "pending-finance" || c.status === "approved").reduce((s, c) => s + c.amount, 0),
    [list.items],
  );

  return {
    ...list,
    claims: list.items,
    toEndorse,
    openAmount,
    create: (input: CreateClaimInput) => list.run(() => repo.create(input)),
    endorse: (id: string) => list.run(() => repo.endorse(id)),
    approve: (id: string, note?: string) => list.run(() => repo.approve(id, note)),
    reject: (id: string, note: string) => list.run(() => repo.reject(id, note)),
    pay: (id: string, reference: string) => list.run(() => repo.pay(id, reference)),
    cancel: (id: string) => list.run(() => repo.cancel(id)),
  };
}
