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
