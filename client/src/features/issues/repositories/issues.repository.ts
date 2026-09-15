// client/src/features/issues/repositories/issues.repository.ts — NEW
import { apiClient } from "@/services/api.client";

export interface IssueRecord {
  id: number;
  issueCode: string;
  projectCode: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  siteContext: string | null;
  createdAt: string | null;
}

export interface CreateIssueInput {
  issueCode: string;
  projectCode: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  siteContext?: string;
  attachmentUrl?: string;
}

export const issuesRepository = {
  listMine: (): Promise<{ data: IssueRecord[] }> => apiClient.get("/issues"),
  create: (input: CreateIssueInput): Promise<{ data: IssueRecord }> =>
    apiClient.post("/issues", input),
};