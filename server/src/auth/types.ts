export interface LoginInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface OwnerRecoveryInitiateInput {
  targetUserId: number;
}

// The simulated "email" an Owner's fail-safe recovery request produces — see
// auth/service.ts. No mail transport exists in this repo, so this record
// stands in for an inbox: the reset link that would have been emailed.
export interface OwnerRecoveryEmail {
  to: string;
  targetUserId: number;
  targetName: string;
  targetEmail: string;
  resetUrl: string;
  createdAt: string;
}
