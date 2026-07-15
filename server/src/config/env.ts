import 'dotenv/config';

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

export const env = {
  PORT:         parseInt(process.env.PORT ?? '8000', 10),
  DATABASE_URL: required('DATABASE_URL'),
  NODE_ENV:     process.env.NODE_ENV ?? 'development',
  JWT_SECRET:   process.env.JWT_SECRET ?? 'dev-secret-change-in-prod',
  CORS_ORIGIN:  process.env.CORS_ORIGIN ?? 'http://localhost:5173',
} as const;