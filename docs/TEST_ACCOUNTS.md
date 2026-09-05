# EasyConstruct Development Test Accounts

> These credentials are for local development/testing only. Never use them as production credentials.

## Credentials

| Role | Email | Password | Backend role |
|---|---|---|---|
| Super Admin | `superadmin@easyconstruct.test` | `Test1234` | `super-admin` |
| Admin | `admin@easyconstruct.test` | `Test1234` | `admin` |
| Human Resources | `hr@easyconstruct.test` | `Test1234` | `human-resources` |
| Finance Manager | `finance@easyconstruct.test` | `Test1234` | `finance-manager` |
| Project Manager | `pm@easyconstruct.test` | `Test1234` | `project-manager` |
| Architect | `architect@easyconstruct.test` | `Test1234` | `architect` |
| Engineer | `engineer@easyconstruct.test` | `Test1234` | `engineer` |
| Site Personnel | `sitepersonnel@easyconstruct.test` | `Test1234` | `site-personnel` |
| Consultant | `consultant@easyconstruct.test` | `Test1234` | `consultant` |

## How to Seed

```bash
npm run db:seed
```

The existing `server/src/db/seed.ts` hashes the shared development password with bcrypt and upserts each account by email.

## How to Start

```bash
npm run dev
```

## Login

Open:

```text
/login
```

Enter any account above. The backend determines the role from the database user record; the login form does not accept or submit a role.

## Role Mapping and Destinations

All accounts navigate to the existing `/dashboard` route. The centralized frontend mapping is:

| Backend role | Frontend role | Dashboard behavior |
|---|---|---|
| `super-admin` | `super_admin` | Existing fallback dashboard |
| `admin` | `admin` | Existing fallback dashboard |
| `human-resources` | `human_resources` | HR dashboard |
| `finance-manager` | `finance_manager` | Finance dashboard |
| `project-manager` | `project_manager` | Project Manager dashboard |
| `architect` | `architect` | Architect dashboard |
| `engineer` | `engineer` | Existing fallback dashboard |
| `site-personnel` | `site_personnel` | Existing fallback dashboard |
| `consultant` | `consultant` | Existing fallback dashboard |

## Expected Behavior

Each account uses the same login page, `/api/auth/login` endpoint, database lookup, bcrypt verification, JWT response, and existing browser session storage. Clearing the session redirects protected routes to `/login`.

## Important

These accounts are strictly for development/testing and must never be used as production credentials.
