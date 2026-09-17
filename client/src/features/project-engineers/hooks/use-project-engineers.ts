import { useCallback, useEffect, useState } from "react";
import {
  ProjectEngineerRepository,
  type ProjectEngineer,
} from "../repositories/project-engineer.repository";

export function useProjectEngineers(projectCode: string | null) {
  const [engineers, setEngineers] = useState<ProjectEngineer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    if (!projectCode) {
      setEngineers([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await ProjectEngineerRepository.listForProject(projectCode);
      setEngineers(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load engineers");
    } finally {
      setLoading(false);
    }
  }, [projectCode]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addEngineer = useCallback(
    async (userId: number, userName: string) => {
      if (!projectCode) return false;
      setSaving(true);
      setError(null);
      try {
        await ProjectEngineerRepository.create({ projectCode, userId, userName });
        await reload();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add engineer");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [projectCode, reload],
  );

  const removeEngineer = useCallback(
    async (id: number) => {
      setSaving(true);
      setError(null);
      try {
        await ProjectEngineerRepository.remove(id);
        await reload();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to remove engineer");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [reload],
  );

  return { engineers, loading, error, saving, addEngineer, removeEngineer, reload };
}
