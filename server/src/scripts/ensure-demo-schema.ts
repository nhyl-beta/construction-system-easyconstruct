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

    -- Super Admin was merged into IT Designer: every grant the role held is
    -- now an it-designer grant (see the requireRole calls across server/src).
    -- Existing rows have to move with it, or those accounts would hold a role
    -- string no requireRole() check matches any more and would be locked out
    -- of every guarded route.
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
  `);

  console.log("Demo schema tables and compatibility columns are ready.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
