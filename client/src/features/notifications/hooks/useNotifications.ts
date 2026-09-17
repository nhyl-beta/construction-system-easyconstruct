import { useCallback, useEffect, useState } from "react";
import { NotificationRepository } from "../repositories/notification.repository";
import type { Notification, NotificationsQuery } from "../types/notification.types";

export function useNotifications(query: NotificationsQuery = {}) {
  const { role, unreadOnly } = query;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await NotificationRepository.list({ role, unreadOnly });
      setNotifications(result);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to load notifications."),
      );
    } finally {
      setLoading(false);
    }
  }, [role, unreadOnly]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const markRead = useCallback(
    async (id: number) => {
      setMarking(id);
      setError(null);

      try {
        const updated = await NotificationRepository.markRead(id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? updated : n)),
        );
        return updated;
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to mark notification as read."),
        );
        return null;
      } finally {
        setMarking(null);
      }
    },
    [],
  );

  return {
    notifications,
    loading,
    marking,
    error,
    reload,
    markRead,
  } as const;
}
