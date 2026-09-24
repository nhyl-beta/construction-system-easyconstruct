import "dotenv/config";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS requirements (
      id serial PRIMARY KEY,
      requirement_id varchar(20) NOT NULL UNIQUE,
      title varchar(255) NOT NULL,
      project varchar(50) NOT NULL,
      category varchar(50) NOT NULL,
      description text NOT NULL,
      status varchar(30) NOT NULL DEFAULT 'Draft',
      created_by varchar(100) NOT NULL,
      created_at timestamp DEFAULT now(),
      updated_at timestamp DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS engineering_reports (
      id serial PRIMARY KEY,
      report_id varchar(20) NOT NULL UNIQUE,
      title varchar(255) NOT NULL,
      type varchar(50) NOT NULL,
      project varchar(50) NOT NULL,
      location varchar(255) NOT NULL,
      date varchar(20) NOT NULL,
      engineer varchar(100) NOT NULL,
      priority varchar(20) NOT NULL DEFAULT 'Medium',
      description text NOT NULL,
      findings text NOT NULL,
      measurements text,
      observations text,
      recommendations text NOT NULL,
      required_actions text,
      status varchar(30) NOT NULL DEFAULT 'Submitted',
      created_at timestamp DEFAULT now(),
      updated_at timestamp DEFAULT now()
    );

    ALTER TABLE attendance
      ADD COLUMN IF NOT EXISTS project_code varchar(50),
      ADD COLUMN IF NOT EXISTS attendance_status varchar(20) NOT NULL DEFAULT 'Present',
      ADD COLUMN IF NOT EXISTS latitude numeric(10, 7),
      ADD COLUMN IF NOT EXISTS longitude numeric(10, 7),
      ADD COLUMN IF NOT EXISTS distance_from_site_m integer,
      ADD COLUMN IF NOT EXISTS photo_url varchar(500),
      ADD COLUMN IF NOT EXISTS remarks text;

    -- projects.budget is budget UTILISATION (a percentage). The contract value
    -- the New Project form collects had nowhere to go, so it either wasn't
    -- saved or was written into budget, which then rendered as e.g. "25000000%".
    ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS contract_value numeric(14, 2);

    -- Move any amount that was written into the percentage column across.
    UPDATE projects
       SET contract_value = budget,
           budget = 0
     WHERE contract_value IS NULL
       AND budget > 1000;

    -- EC-013/017/018/024: generalize the engineer-only "project_engineers"
    -- table into "project_members" (PM can staff Architect/Engineer/Site
    -- Personnel/Consultant on a project, not just Engineer). Table rename is
    -- metadata-only in Postgres — existing rows and the FK on user_id are
    -- untouched. Every row that already exists predates this generalization
    -- and was always an engineer, hence the backfilled default below.
    ALTER TABLE IF EXISTS project_engineers RENAME TO project_members;

    ALTER TABLE project_members
      ADD COLUMN IF NOT EXISTS role varchar(40) NOT NULL DEFAULT 'engineer';

    ALTER TABLE project_members
      ALTER COLUMN role DROP DEFAULT;

    ALTER TABLE project_members
      DROP CONSTRAINT IF EXISTS project_engineers_project_user_unique;

    -- IT Designer's "deactivate accounts" scope needs a soft-disable flag.
    -- Defaults to true so every pre-existing account keeps working; login
    -- rejects users whose flag is false (see auth/service.ts).
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

    -- Task completion evidence: a status flip recorded that work finished
    -- but nothing about what was done or any proof of it.
    ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS completion_note text,
      ADD COLUMN IF NOT EXISTS completion_file_url varchar(500),
      ADD COLUMN IF NOT EXISTS completed_at timestamp;

    -- Designs are reviewed by more than one engineer in practice, but the
    -- designs table only had a single assigned_engineer_id. This join table
    -- carries the real many-to-many; the old column stays as a denormalized
    -- first engineer so existing reads keep working.
    CREATE TABLE IF NOT EXISTS design_engineers (
      id serial PRIMARY KEY,
      design_id integer NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
      user_id integer NOT NULL REFERENCES users(id),
      user_name varchar(100) NOT NULL,
      created_at timestamp DEFAULT now(),
      CONSTRAINT design_engineers_design_user_unique UNIQUE (design_id, user_id)
    );

    -- Backfill: every design that already names one engineer becomes a
    -- single-row membership, so the join table is authoritative from day one.
    INSERT INTO design_engineers (design_id, user_id, user_name)
    SELECT d.id, d.assigned_engineer_id, COALESCE(d.assigned_engineer_name, u.name)
      FROM designs d
      JOIN users u ON u.id = d.assigned_engineer_id
     WHERE d.assigned_engineer_id IS NOT NULL
    ON CONFLICT (design_id, user_id) DO NOTHING;

    -- The legacy platform-admin role ('super-admin') was renamed/merged into
    -- IT Designer: every grant it held is now an it-designer grant (see the
    -- requireRole calls across server/src). Existing rows have to move with
    -- it, or those accounts would hold a role string no requireRole() check
    -- matches any more and would be locked out of every guarded route.
    UPDATE users SET role = 'it-designer' WHERE role = 'super-admin';
    UPDATE project_members SET role = 'it-designer' WHERE role = 'super-admin';
    DELETE FROM roles WHERE name = 'super-admin';

    -- Clock-ins recorded before attendance/service.ts distinguished "the
    -- fence was not evaluated" from "the fence was breached" all carry
    -- geofence = 'Outside' with no distance behind it, because 'Outside' was
    -- the default the code fell through to. Relabel the ones that were never
    -- measured, and return the automatic 'Flagged' verdict to 'Pending' where
    -- no human has since recorded a note on the record.
    UPDATE attendance
       SET status = 'Pending'
     WHERE geofence = 'Outside'
       AND distance_from_site_m IS NULL
       AND status = 'Flagged'
       AND (remarks IS NULL OR remarks = '');

    UPDATE attendance
       SET geofence = 'Unverified'
     WHERE geofence = 'Outside'
       AND distance_from_site_m IS NULL;

    -- Advisory/field documents uploaded before documents/service.ts started
    -- writing the "/uploads/documents/" prefix were stored as
    -- "/uploads/<file>", while multer has always written the file itself into
    -- uploads/documents/. express.static serves uploads/ at /uploads, so those
    -- rows resolved to a path with no file behind it and every "View Document"
    -- on them 404'd. Rewrite the stored prefix to match where the bytes are.
    UPDATE documents
       SET file_url = '/uploads/documents/' || substring(file_url from 10)
     WHERE file_url LIKE '/uploads/%'
       AND file_url NOT LIKE '/uploads/%/%';

    -- The New Project form has always collected a currency, but there was no
    -- column to put it in, so the control was frozen at PHP. Amounts are
    -- stored as plain numerics with no currency of their own, so the project's
    -- currency is what every amount on that project is denominated in.
    ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS currency varchar(3) NOT NULL DEFAULT 'PHP';

    -- A workflow moved through its stages carrying nothing but a title and an
    -- amount: whatever was submitted at each stage (the architect's design,
    -- the engineer's justification, HR's subcontracting document) lived
    -- outside the workflow entirely, so every later approver — Consultant, PM,
    -- Admin — decided blind. One table holds both files and written
    -- submissions, tagged with the stage they were filed against, so the full
    -- trail is readable at any later stage.
    CREATE TABLE IF NOT EXISTS workflow_attachments (
      id serial PRIMARY KEY,
      workflow_id integer NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
      stage_id integer REFERENCES workflow_stages(id) ON DELETE SET NULL,
      kind varchar(20) NOT NULL DEFAULT 'document',
      label varchar(255) NOT NULL,
      content text,
      file_url varchar(500),
      file_name varchar(255),
      file_size varchar(20),
      uploaded_by varchar(100) NOT NULL,
      created_at timestamp DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS workflow_attachments_workflow_idx
      ON workflow_attachments (workflow_id);

    -- Budget-change requests are argued line by line (materials, labour, other
    -- costs); a single workflows.amount told Finance the total and nothing
    -- about what moved. These are the line items behind that total.
    CREATE TABLE IF NOT EXISTS workflow_line_items (
      id serial PRIMARY KEY,
      workflow_id integer NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
      category varchar(30) NOT NULL,
      description varchar(255) NOT NULL,
      current_amount numeric(14, 2) NOT NULL DEFAULT 0,
      requested_amount numeric(14, 2) NOT NULL DEFAULT 0,
      created_at timestamp DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS workflow_line_items_workflow_idx
      ON workflow_line_items (workflow_id);

    -- G4: links a "Budget Change Request" workflow to the budget row it
    -- targets, so a final approval can sync budgets.planned and record a
    -- budget_adjustments row instead of the change living only in the
    -- workflow's line items. Nullable — no other template has a budget.
    ALTER TABLE workflows
      ADD COLUMN IF NOT EXISTS budget_id integer REFERENCES budgets(id);

    -- J2: lets a workflow decision notify the initiator directly — createdBy
    -- is a denormalized display name, not a usable notification recipient.
    ALTER TABLE workflows
      ADD COLUMN IF NOT EXISTS created_by_user_id integer REFERENCES users(id);

    -- Payroll deductions were one flat 12% figure standing in for every
    -- statutory contribution at once. Philippine payroll is four separate
    -- computations (SSS, PhilHealth, Pag-IBIG, BIR withholding tax) on
    -- different bases, and a payslip has to show each one — so each gets its
    -- own column and the deductions column becomes their sum.
    ALTER TABLE payroll
      ADD COLUMN IF NOT EXISTS sss numeric(10, 2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS philhealth numeric(10, 2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS pagibig numeric(10, 2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS withholding_tax numeric(10, 2) NOT NULL DEFAULT 0;

    -- duplicate_table, not just duplicate_object: on a re-run Postgres fails
    -- on the *index* backing the constraint (42P07), which duplicate_object
    -- doesn't catch — that aborted the whole script on every run after the
    -- first, taking the statements above down with it.
    DO $$ BEGIN
      ALTER TABLE project_members
        ADD CONSTRAINT project_members_project_user_role_unique
        UNIQUE (project_code, user_id, role);
    EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
    END $$;

    -- Draft milestones: a Project Manager staking out an estimated
    -- completion date for a chunk of the project before it's a firm
    -- commitment. No table for this existed at all.
    CREATE TABLE IF NOT EXISTS milestones (
      id serial PRIMARY KEY,
      project_code varchar(50) NOT NULL,
      title varchar(255) NOT NULL,
      description text,
      status varchar(20) NOT NULL DEFAULT 'draft',
      estimated_completion_date varchar(20),
      created_by varchar(100) NOT NULL,
      created_at timestamp DEFAULT now(),
      updated_at timestamp DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS milestones_project_code_idx
      ON milestones (project_code);

    -- Generic (link_type, link_id) association so a milestone can later gate
    -- on requirements/documents/budget items/tasks without a schema change
    -- per relationship — see db/schema/milestones.ts. Nothing reads these
    -- yet; the table exists so that gating logic is additive later, not a
    -- migration on top of a migration.
    CREATE TABLE IF NOT EXISTS milestone_links (
      id serial PRIMARY KEY,
      milestone_id integer NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
      link_type varchar(20) NOT NULL,
      link_id integer NOT NULL,
      created_at timestamp DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS milestone_links_milestone_idx
      ON milestone_links (milestone_id);

    -- notifications/service.create has always accepted
    -- { recipientRole, title, body, link }, but the table only had
    -- (title, message, type, role, is_read) — recipientRole (as "role")
    -- was the only field that actually landed, body/link were silently
    -- dropped on every insert. Add the missing columns and a specific-user
    -- target (recipient_user_id), so a notification can be aimed at one
    -- person instead of only ever "every holder of this role".
    ALTER TABLE notifications
      ADD COLUMN IF NOT EXISTS recipient_user_id integer REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS project_code varchar(50),
      ADD COLUMN IF NOT EXISTS link varchar(500);

    -- ── Project lifecycle (see lifecycle/phases.ts) ──
    ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS previous_status varchar(50),
      ADD COLUMN IF NOT EXISTS hold_reason text,
      ADD COLUMN IF NOT EXISTS completed_at timestamp,
      ADD COLUMN IF NOT EXISTS archived_at timestamp,
      ADD COLUMN IF NOT EXISTS pm_user_id integer REFERENCES users(id);

    -- Backfill pm_user_id by exact name match against a project-manager
    -- account. Only a starting point — projects.pm (the free-text name) stays
    -- authoritative wherever pm_user_id is still null (see
    -- lifecycle/service.ts assertCanAdvance).
    UPDATE projects p
       SET pm_user_id = u.id
      FROM users u
     WHERE p.pm_user_id IS NULL
       AND u.role = 'project-manager'
       AND u.name = p.pm;

    CREATE TABLE IF NOT EXISTS project_phase_history (
      id serial PRIMARY KEY,
      project_code varchar(50) NOT NULL,
      from_status varchar(50) NOT NULL,
      to_status varchar(50) NOT NULL,
      changed_by varchar(100) NOT NULL,
      changed_by_user_id integer REFERENCES users(id),
      reason text,
      override boolean NOT NULL DEFAULT false,
      gate_snapshot jsonb,
      created_at timestamp DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS project_phase_history_project_code_idx
      ON project_phase_history (project_code);

    -- D-7: migrate free-text statuses to the phase list, case-insensitively.
    -- Idempotent: only rewrites a row whose status ISN'T already one of the
    -- eight phase names, so re-running this after the app has started
    -- advancing real projects through the lifecycle never stomps on them.
    UPDATE projects
       SET previous_status = 'Construction',
           status = 'On Hold'
     WHERE status NOT IN ('Proposal','Design','Pre-Construction','Construction','Closeout','Completed','Archived','On Hold','Cancelled')
       AND status ILIKE '%hold%';

    UPDATE projects
       SET status = 'Cancelled'
     WHERE status NOT IN ('Proposal','Design','Pre-Construction','Construction','Closeout','Completed','Archived','On Hold','Cancelled')
       AND status ILIKE '%cancel%';

    UPDATE projects
       SET status = 'Completed'
     WHERE status NOT IN ('Proposal','Design','Pre-Construction','Construction','Closeout','Completed','Archived','On Hold','Cancelled')
       AND (status ILIKE '%complete%' OR status ILIKE '%done%');

    UPDATE projects
       SET status = 'Construction'
     WHERE status NOT IN ('Proposal','Design','Pre-Construction','Construction','Closeout','Completed','Archived','On Hold','Cancelled')
       AND (status ILIKE '%progress%' OR status ILIKE '%active%' OR status ILIKE '%ongoing%');

    -- Everything else, including 'Planning' and empty string, becomes Proposal.
    UPDATE projects
       SET status = 'Proposal'
     WHERE status NOT IN ('Proposal','Design','Pre-Construction','Construction','Closeout','Completed','Archived','On Hold','Cancelled')
        OR status = '' OR status IS NULL;

    -- ── E3 / gate D3 ──
    ALTER TABLE blueprints
      ADD COLUMN IF NOT EXISTS project_code varchar(50),
      ADD COLUMN IF NOT EXISTS design_id integer REFERENCES designs(id);

    -- ── D2 ──
    ALTER TABLE proposals
      ADD COLUMN IF NOT EXISTS workflow_id integer REFERENCES workflows(id);

    -- K3: nullable — many audit entries (auth, user/role/template admin) have
    -- no single project to attach to. Lets the audit-log screen filter by
    -- project code reliably instead of substring-matching free-text summary.
    ALTER TABLE audit_logs
      ADD COLUMN IF NOT EXISTS project_code varchar(50);

    -- ai-signals B1: cached EstimationPro.ai catalog rows (retrieve, don't
    -- generate — nothing here is written except by reference-client.ts's
    -- upsert). Unique on (source, source_item_id) so re-fetching the same
    -- catalog item updates it in place instead of duplicating rows.
    CREATE TABLE IF NOT EXISTS reference_snapshots (
      id serial PRIMARY KEY,
      source varchar(50) NOT NULL DEFAULT 'estimationpro',
      source_item_id varchar(100) NOT NULL,
      trade varchar(50) NOT NULL,
      description text NOT NULL,
      unit varchar(30) NOT NULL,
      low_usd numeric(12, 2) NOT NULL,
      typical_usd numeric(12, 2) NOT NULL,
      high_usd numeric(12, 2) NOT NULL,
      region_multiplier numeric(6, 3),
      volatility varchar(20),
      currency varchar(10) NOT NULL DEFAULT 'USD',
      source_url varchar(500),
      raw_payload jsonb,
      fetched_at timestamp NOT NULL DEFAULT now(),
      CONSTRAINT reference_snapshots_source_item_unique UNIQUE (source, source_item_id)
    );

    -- ai-signals B1: one row per workflow line item per comparison run.
    -- "no-match" rows are kept (basis_summary always says why) so a UI
    -- badge can show "No comparable reference" with a reason.
    CREATE TABLE IF NOT EXISTS validation_results (
      id serial PRIMARY KEY,
      entity_type varchar(30) NOT NULL DEFAULT 'workflow_line_item',
      entity_id integer NOT NULL,
      workflow_id integer NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
      project_code varchar(50) NOT NULL,
      line_description varchar(255) NOT NULL,
      line_quantity numeric(14, 3),
      line_unit varchar(20),
      project_value_php numeric(14, 2) NOT NULL,
      matched_snapshot_id integer REFERENCES reference_snapshots(id) ON DELETE SET NULL,
      match_score numeric(4, 3),
      reference_unit varchar(30),
      unit_factor numeric(14, 6),
      reference_low_usd numeric(14, 2),
      reference_mid_usd numeric(14, 2),
      reference_high_usd numeric(14, 2),
      reference_low_php numeric(14, 2),
      reference_mid_php numeric(14, 2),
      reference_high_php numeric(14, 2),
      fx_rate_used numeric(8, 4) NOT NULL,
      fx_rate_as_of varchar(20) NOT NULL,
      variance_pct numeric(8, 4),
      verdict varchar(20) NOT NULL,
      basis_summary text NOT NULL,
      sources jsonb,
      created_at timestamp NOT NULL DEFAULT now()
    );

    -- ai-signals B2: quantity/unit inputs a line item needs before its cost
    -- can be compared against the reference catalog at all — nullable since
    -- most existing line items (and any without a sensible unit) simply
    -- can't be compared, which cost.ts treats as a "no-match" reason, not
    -- an error.
    ALTER TABLE workflow_line_items
      ADD COLUMN IF NOT EXISTS quantity numeric(14, 3),
      ADD COLUMN IF NOT EXISTS unit varchar(20);

    -- ai-signals B3: found live while seeding — some EstimationPro.ai
    -- descriptions run past 500 characters, well beyond the varchar(255)
    -- this table was first created with. Widen it if an earlier run of this
    -- script already created the table with the narrower type.
    ALTER TABLE reference_snapshots
      ALTER COLUMN description TYPE text;
  `);

  console.log("Demo schema tables and compatibility columns are ready.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
