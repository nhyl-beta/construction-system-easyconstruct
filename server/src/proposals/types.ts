export interface ProposalRecord {
  id: number;
  proposalId: string;
  title: string;
  projectCode: string;
  submittedBy: string;
  status: string;
  amount: string | null;
  content: string | null;
  aiValidation: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateProposalInput {
  proposalId: string;
  title: string;
  projectCode: string;
  submittedBy: string;
  status?: string;
  amount?: string;
  content?: string;
  aiValidation?: string;
}

export interface UpdateProposalInput extends Partial<CreateProposalInput> {}

export interface ProposalFilters {
  status?: string;
  projectCode?: string;
  search?: string;
}