// client/src/features/account-recovery/hooks/use-account-recovery.ts — NEW
import { useCallback, useEffect, useState } from "react";
import { UserRepository, type PublicUser } from "@/features/users/repositories/user.repository";
import {
  AccountRecoveryRepository,
  type OwnerRecoveryEmail,
} from "../repositories/account-recovery.repository";

export function useAccountRecovery() {
  const [targets, setTargets] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState<OwnerRecoveryEmail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [itDesigners, inboxEmail] = await Promise.all([
        UserRepository.listByRole("it-designer"),
        AccountRecoveryRepository.inbox(),
      ]);
      setTargets(itDesigners);
      setEmail(inboxEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load account recovery.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const sendRecoveryEmail = useCallback(async (targetUserId: number) => {
    setSending(true);
    setError(null);
    try {
      const sent = await AccountRecoveryRepository.initiate(targetUserId);
      setEmail(sent);
      return sent;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send the recovery email.");
      return null;
    } finally {
      setSending(false);
    }
  }, []);

  return { targets, loading, sending, email, error, reload, sendRecoveryEmail } as const;
}
