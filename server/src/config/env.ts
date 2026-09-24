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
  // Origin the password-reset link points at. Defaults to the CORS origin,
  // which is already the browser app's address in every environment.
  APP_URL:      process.env.APP_URL ?? process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  // Decision-support cost comparisons (server/src/ai-validation/cost.ts)
  // convert catalog USD prices to PHP with this dated constant rather than a
  // live FX API — S-2. Every stored comparison records both fields so the
  // rate used is always visible, not just the current default.
  FX_RATE_USD_PHP: parseFloat(process.env.FX_RATE_USD_PHP ?? '62.73'),
  FX_RATE_AS_OF:   process.env.FX_RATE_AS_OF ?? '2026-09-22',
} as const;