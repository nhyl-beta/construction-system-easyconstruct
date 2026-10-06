// server/src/scripts/demo-guard.ts
//
// The one guard every script that writes demo data calls before its first
// write (and the real-database tests, *.db-test.ts):
//   * assertDemoDatabase — prints the target host, then refuses unless
//     ALLOW_DEMO_RESET=true and the DATABASE_URL host is local or listed in
//     DEMO_RESET_ALLOWED_HOSTS;
//   * assertDemoApi — for seeds that write through the HTTP API: refuses any
//     base other than this machine on the dedicated demo port, so a dev server
//     started elsewhere (reading server/.env's database) cannot receive the
//     writes. Start the API from the same shell with PORT=8123.

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export const DEMO_API_PORT = process.env.DEMO_API_PORT ?? "8123";

export function assertDemoDatabase(): { host: string; db: string } {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  const u = new URL(url);
  const host = u.hostname;
  const db = u.pathname.replace(/^\//, "");
  console.log(`Target database: host=${host} db=${db}`);

  const allowed = (process.env.DEMO_RESET_ALLOWED_HOSTS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (process.env.ALLOW_DEMO_RESET !== "true") throw new Error("REFUSED: set ALLOW_DEMO_RESET=true to run this script.");
  if (!LOCAL_HOSTS.has(host) && !allowed.includes(host)) {
    throw new Error(`REFUSED: host ${host} is neither local nor listed in DEMO_RESET_ALLOWED_HOSTS.`);
  }
  return { host, db };
}

export function assertDemoApi(base: string): void {
  const u = new URL(base);
  console.log(`Target API: ${u.origin}${u.pathname}`);
  if (!LOCAL_HOSTS.has(u.hostname) || u.port !== DEMO_API_PORT) {
    throw new Error(
      `REFUSED: SMOKE_BASE_URL must be http://localhost:${DEMO_API_PORT}/api, a server started from this shell with PORT=${DEMO_API_PORT}; got ${u.origin}.`,
    );
  }
}
