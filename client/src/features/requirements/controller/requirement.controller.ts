import type {
  CreateRequirementInput,
  Requirement,
  RequirementAttachment,
  RequirementFilters,
} from "../types/requirements.types";
import { useEffect, useState } from "react";
import { RequirementRepository } from "../repositories/requirement.repository";

export const RequirementService = {
  async fetchAll(filters: RequirementFilters = {}): Promise<Requirement[]> {
    return RequirementRepository.list(filters);
  },

  async createRequirement(payload: CreateRequirementInput): Promise<Requirement> {
    return RequirementRepository.create(payload);
  },

  countByStatus(requirements: Requirement[], status: Requirement["status"]): number {
    return requirements.filter((r) => r.status === status).length;
  },

  groupByCategory(requirements: Requirement[]): { name: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const r of requirements) counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  },
};

export function useRequirementsController() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setRequirements(await RequirementService.fetchAll());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createRequirement = async (payload: CreateRequirementInput) => {
    const created = await RequirementService.createRequirement(payload);
    setRequirements((current) => [created, ...current]);
  };

  const replace = (updated: Requirement) =>
    setRequirements((current) => current.map((r) => (r.dbId === updated.dbId ? updated : r)));

  /** Draft → Under Review, i.e. into the Project Manager's approval queue. */
  const submitRequirement = async (dbId: number) => {
    replace(await RequirementRepository.submit(dbId));
  };

  const addAttachments = async (requirement: Requirement, added: RequirementAttachment[]) => {
    replace(await RequirementRepository.setAttachments(requirement.dbId, [...requirement.attachments, ...added]));
  };

  return { requirements, loading, createRequirement, submitRequirement, addAttachments, reload: load };
}