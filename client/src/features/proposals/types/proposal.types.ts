export interface Proposal {
  id: number;
  proposalId: string;
  title: string;
  projectCode: string;
  submittedBy: string;
  status: string;
  amount: string | null;
  content: string | null;
  aiValidation: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}