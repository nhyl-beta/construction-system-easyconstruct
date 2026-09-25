# EasyConstruct

EasyConstruct is a full-stack construction management platform built as a thesis project. It coordinates projects, employees, HR operations, finance, engineering workflows, and documents for construction firms, with role-based dashboards for everyone from site engineers to owners.

## Tech stack

**Frontend** — React 19, [Refine](https://refine.dev/) (`@refinedev/react-router`), React Router, Vite, TypeScript, Tailwind CSS, shadcn/ui, TanStack Table/Query (via Refine hooks), Recharts.

**Backend** — Node.js, Express 5, Drizzle ORM, PostgreSQL ([Neon serverless driver](https://neon.tech/)), JWT auth, Multer + Vercel Blob for file uploads.

## Project structure

```
.
├── client/          # React + Refine frontend (Vite)
├── server/          # Express + Drizzle REST API
│   ├── src/         # Feature modules (repository → service → controller → routes)
│   └── drizzle/     # SQL migrations and schema snapshots
└── scripts/dev.mjs  # Runs client and server dev servers together
```

Backend modules (projects, employees, HR, finance, engineering reports, documents, requirements, workflows, etc.) follow a consistent layering pattern: **schema → repository → service → controller → routes**. The frontend mirrors this with a **feature folder → hook → page** structure, using `projects` and `employees` as the canonical reference modules.

## Prerequisites

- Node.js 18+ (tested on Node 22)
- A PostgreSQL database (the project is built against [Neon](https://neon.tech/), but any Postgres instance works)

## Getting started

### 1. Clone and install dependencies

```bash
git clone https://github.com/nhyl-beta/construction-system-easyconstruct.git
cd construction-system-easyconstruct
npm --prefix client install
npm --prefix server install
```

### 2. Configure environment variables

Create a `.env` file inside `server/` with at least:

```bash
DATABASE_URL=postgresql://user:password@host/dbname
PORT=8000
JWT_SECRET=change-me-in-prod
CORS_ORIGIN=http://localhost:5173
# Optional — origin used in password-reset links; defaults to CORS_ORIGIN
APP_URL=http://localhost:5173
# Optional — enables Vercel Blob storage for uploads; falls back to local disk storage if unset
BLOB_READ_WRITE_TOKEN=
# Required for the AI-validation decision-support layer (proposal validation,
# cost-comparison, the five advisory signals under DecisionSupportSection) —
# set true for any demo/presentation environment. Defaults to false/off.
FEATURE_AI=true
```

The client reads `VITE_API_BASE` to decide whether to talk to the real API or use mock data; set it in a `.env` file inside `client/` (e.g. `VITE_API_BASE=http://localhost:8000` — **no `/api` suffix**: `client/src/services/api.client.ts`'s `apiUrl()` always appends `/api` itself, so a value ending in `/api` here produces a double `/api/api/...` and every request 404s) once the server is running. It also needs its own `VITE_FEATURE_AI=true` (separate flag, separate `.env`, same gate) to show the same AI-validation surfaces client-side — the server-side `FEATURE_AI` alone does not turn on the UI.

### 3. Set up the database

From `server/`:

```bash
npm run db:generate   # generate Drizzle migrations from the schema (if needed)
npm run db:migrate    # apply migrations to DATABASE_URL
npm run db:seed       # create demo roles, employees, and login accounts
```

The seed script prints a table of demo accounts on completion — one per role (admin, project manager, HR, finance, architect, engineer, site personnel, consultant, owner, IT designer), all sharing the password `Demo@12345`.

### 4. Run the app

From the repository root, run client and server together:

```bash
npm run dev
```

Or run them individually:

```bash
npm run dev:client   # Vite dev server, default http://localhost:5173
npm run dev:server   # Express API with hot reload (tsx watch), default http://localhost:8000
```

## Available scripts

**Root**

| Script | Description |
| --- | --- |
| `npm run dev` | Runs both client and server dev servers concurrently |
| `npm run dev:client` | Runs only the frontend dev server |
| `npm run dev:server` | Runs only the backend dev server |
| `npm run build:client` | Builds the frontend for production |
| `npm run build:server` | Builds the backend for production |
| `npm run db:seed` | Seeds demo accounts and roles (proxies to `server`) |

**`server/`**

| Script | Description |
| --- | --- |
| `npm run dev` | Starts the API with hot reload |
| `npm run build` | Compiles TypeScript to `dist/` |
| `npm start` | Runs the compiled server |
| `npm run db:generate` | Generates Drizzle migrations from the schema |
| `npm run db:migrate` | Applies migrations to the database |
| `npm run db:seed` | Seeds demo roles, employees, and user accounts |
| `npm run db:backfill-employee-links` | Backfills employee ↔ user links |
| `npm run ai:seed-references` | Pulls the EstimationPro.ai cost-reference catalog (idempotent upsert) |
| `npm run demo:seed` | Creates `DEMO-STAGE-0`..`6`, one demo project per lifecycle phase, via real API calls against a running `npm run dev` server. Idempotent — deletes and rebuilds its own rows on every run. Run `ai:seed-references` first for a full cost-reference catalog (falls back to a single seeded reference row otherwise — see `server/src/scripts/demo-seed-stages.ts`'s header comment). |
| `npm run demo:ai-signals` | The one bookmarkable place to see the AI-validation decision-support layer trip all five advisory signals at once (cost-variance, cumulative-change-impact, burn-vs-progress, issue-recurrence, stalled-stage) — see "AI-validation demo project" below. |

**AI-validation demo project.** `npm run demo:ai-signals` builds a single project at the stable
code **`AISIG-DEMO`** (overridable via `AISIG_PROJECT_CODE`), deliberately engineered to trip
all five advisory signals, then asserts the live API's gate checks are byte-for-byte identical
to a direct, signals-bypassing call — proving decision support never affects gating. The script
is idempotent (it clears out any previous `AISIG-DEMO` run before rebuilding), so **the 7
`DEMO-STAGE-0`..`6` projects from `demo:seed` deliberately don't carry this scenario
themselves** — the script's own console output prints the project's numeric id and
`/projects/:id` link on every run; open that link as Project Manager, Consultant, Finance
Manager or Engineer (the five signals' `ownerRoles`) to see `DecisionSupportSection` under the
gate checklist with all five signals live.

**`client/`**

| Script | Description |
| --- | --- |
| `npm run dev` | Starts the Refine/Vite dev server |
| `npm run build` | Type-checks and builds for production |
| `npm start` | Serves a production build with Refine's static server |

## Roles

The platform supports the following roles, each with its own dashboard and permissions: Admin, Owner, IT Designer, Human Resources, Finance Manager, Project Manager, Architect, Engineer, Site Personnel, and Consultant.

## License

No license has been specified for this project.
