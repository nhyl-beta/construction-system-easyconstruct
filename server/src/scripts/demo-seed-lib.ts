// server/src/scripts/demo-seed-lib.ts
//
// Shared plumbing for the demo seeders (demo-seed-stages.ts, demo-seed-roles.ts):
// login, a tiny API client, the cast of existing accounts (read only — we log
// in as them, we never write to the users table), and which account is staffed
// on which of the seven projects.
import "dotenv/config";

export const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:8000/api";
export const PASSWORD = "Demo@12345";

/** Existing demo accounts. Passwords/emails come from seed-demo-accounts.ts and are never changed. */
export const EMAILS = {
  pm: "pm@easyconstruct.demo",
  pm1: "projectmanager1@easyconstruct.demo",
  architect: "architect@easyconstruct.demo",
  architect1: "architect1@easyconstruct.demo",
  consultant: "consultant@easyconstruct.demo",
  consultant1: "consultant1@easyconstruct.demo",
  engineer: "engineer@easyconstruct.demo",
  engineer1: "engineer1@easyconstruct.demo",
  site: "site@easyconstruct.demo",
  site1: "sitepersonnel1@easyconstruct.demo",
  finance: "finance@easyconstruct.demo",
  hr: "hr@easyconstruct.demo",
  admin: "admin@easyconstruct.demo",
  owner: "owner@easyconstruct.demo",
  itdesigner: "itdesigner@easyconstruct.demo",
} as const;
export type AccountKey = keyof typeof EMAILS;

/** Employee row (employees.employee_id) each field account is linked to. */
export const EMPLOYEE_OF: Partial<Record<AccountKey, string>> = {
  site: "EMP-DEMO-07",
  site1: "EMP-DEMO-47",
  engineer: "EMP-DEMO-06",
  engineer1: "EMP-DEMO-31",
};

export async function login(email: string): Promise<string> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  const json = (await res.json()) as { data?: { token?: string }; message?: string };
  if (!res.ok) throw new Error(`Login failed for ${email}: ${json.message}`);
  return json.data!.token!;
}

export async function api<T = any>(
  path: string,
  token: string,
  opts: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? "GET",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as { data?: T; message?: string };
  if (!res.ok) {
    throw new Error(`${opts.method ?? "GET"} ${path} -> ${res.status}: ${json.message ?? JSON.stringify(json)}`);
  }
  return json.data as T;
}

/** Like api(), but returns the HTTP status and never throws — for scoping / rejection proofs. */
export async function raw(path: string, token: string, opts: { method?: string; body?: unknown } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? "GET",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as { data?: any; message?: string };
  return { status: res.status, data: json.data, message: json.message };
}

export interface Account {
  key: AccountKey;
  id: number;
  name: string;
  email: string;
  token: string;
  employeeId?: string;
}
export type Session = Record<AccountKey, Account>;

export async function openSession(): Promise<Session> {
  const entries = await Promise.all(
    (Object.keys(EMAILS) as AccountKey[]).map(async (key) => {
      try {
        return [key, await login(EMAILS[key])] as const;
      } catch (e) {
        console.warn(`  (skipping ${EMAILS[key]}: ${(e as Error).message})`);
        return [key, ""] as const;
      }
    }),
  );
  const tokens = Object.fromEntries(entries) as Record<AccountKey, string>;
  const users = await api<{ id: number; name: string; email: string }[]>("/users", tokens.admin);
  const out = {} as Session;
  for (const key of Object.keys(EMAILS) as AccountKey[]) {
    if (!tokens[key]) continue;
    const u = users.find((x) => x.email === EMAILS[key]);
    if (!u) throw new Error(`Account ${EMAILS[key]} not found`);
    out[key] = { key, id: u.id, name: u.name, email: u.email, token: tokens[key], employeeId: EMPLOYEE_OF[key] };
  }
  return out;
}

/** Who is staffed on which demo project (accounts only; scoping is visible because nobody is on all seven). */
export interface Team {
  pm: AccountKey;
  architect: AccountKey;
  consultant: AccountKey;
  engineer?: AccountKey;
  site?: AccountKey;
}
export const TEAMS: Record<string, Team> = {
  "DEMO-S1": { pm: "pm", architect: "architect", consultant: "consultant" },
  "DEMO-S2": { pm: "pm", architect: "architect", consultant: "consultant", engineer: "engineer" },
  "DEMO-S3": { pm: "pm", architect: "architect", consultant: "consultant", engineer: "engineer", site: "site" },
  "DEMO-S4": { pm: "pm", architect: "architect", consultant: "consultant", engineer: "engineer", site: "site" },
  "DEMO-S5": { pm: "pm", architect: "architect1", consultant: "consultant1", engineer: "engineer", site: "site" },
  "DEMO-S6": { pm: "pm1", architect: "architect1", consultant: "consultant", engineer: "engineer1", site: "site" },
  "DEMO-S7": { pm: "pm1", architect: "architect1", consultant: "consultant1", engineer: "engineer1", site: "site1" },
};

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** YYYY-MM-DD, n days from an ISO date. */
export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export const TODAY = "2026-10-04";
