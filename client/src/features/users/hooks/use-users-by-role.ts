import { useEffect, useState } from "react";
import { UserRepository, type PublicUser } from "../repositories/user.repository";

export function useUsersByRole(role: string | null) {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!role) {
      setUsers([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    UserRepository.listByRole(role)
      .then((result) => {
        if (!cancelled) setUsers(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load users");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [role]);

  return { users, loading, error };
}
