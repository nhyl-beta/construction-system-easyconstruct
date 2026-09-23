import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";

import { db } from "../db/connection.js";
import { employees } from "../db/schema/employees.js";
import { roles } from "../db/schema/roles.js";
import { users } from "../db/schema/users.js";
import { workflowTemplates } from "../db/schema/workflows.js";

const PASSWORD = "Demo@12345";

const ACCOUNTS = [
  // NOTE: the legacy platform-admin role was renamed/merged into IT Designer
  // — its old demo account (superadmin@easyconstruct.demo) is intentionally
  // gone. Every grant it held now belongs to it-designer below.
  { name: "Dana Reyes", email: "admin@easyconstruct.demo", role: "admin", employeeRole: "Admin", department: "Administration" },
  { name: "Miguel Santos", email: "pm@easyconstruct.demo", role: "project-manager", employeeRole: "Project Manager", department: "Project Management" },
  { name: "Liza Torres", email: "hr@easyconstruct.demo", role: "human-resources", employeeRole: "HR Officer", department: "Human Resources" },
  { name: "Carlo Ramos", email: "finance@easyconstruct.demo", role: "finance-manager", employeeRole: "Finance Manager", department: "Finance" },
  { name: "Ana Villanueva", email: "architect@easyconstruct.demo", role: "architect", employeeRole: "Architect", department: "Design" },
  { name: "Paolo Mendoza", email: "engineer@easyconstruct.demo", role: "engineer", employeeRole: "Site Engineer", department: "Engineering" },
  { name: "Rico Domingo", email: "site@easyconstruct.demo", role: "site-personnel", employeeRole: "Construction Worker", department: "Field Operations" },
  { name: "Elena Bautista", email: "consultant@easyconstruct.demo", role: "consultant", employeeRole: "Consultant", department: "Advisory" },
  { name: "Teresa Aquino", email: "owner@easyconstruct.demo", role: "owner", employeeRole: "Owner", department: "Executive" },
  { name: "Noel Garcia", email: "itdesigner@easyconstruct.demo", role: "it-designer", employeeRole: "IT Designer", department: "Information Technology" },
] as const;

// One row per role — the label/employeeRole/department a generated
// "<role-slug><n>@easyconstruct.demo" account below is built from. Must match
// the role strings requireRole() checks compare against (server/src/**/routes.ts),
// not a display label.
const ROLE_DEFS = [
  { role: "admin", label: "Admin", employeeRole: "Admin", department: "Administration" },
  { role: "it-designer", label: "IT Designer", employeeRole: "IT Designer", department: "Information Technology" },
  { role: "owner", label: "Owner", employeeRole: "Owner", department: "Executive" },
  { role: "project-manager", label: "Project Manager", employeeRole: "Project Manager", department: "Project Management" },
  { role: "architect", label: "Architect", employeeRole: "Architect", department: "Design" },
  { role: "engineer", label: "Engineer", employeeRole: "Site Engineer", department: "Engineering" },
  { role: "consultant", label: "Consultant", employeeRole: "Consultant", department: "Advisory" },
  { role: "finance-manager", label: "Finance Manager", employeeRole: "Finance Manager", department: "Finance" },
  { role: "human-resources", label: "Human Resources", employeeRole: "HR Officer", department: "Human Resources" },
  { role: "site-personnel", label: "Site Personnel", employeeRole: "Construction Worker", department: "Field Operations" },
] as const;

const ORDINAL_NAME = ["One", "Two", "Three", "Four"] as const;

// 4 accounts per role, email "<role-slug-without-hyphens><n>@easyconstruct.demo"
// (e.g. sitepersonnel1@easyconstruct.demo) — required by the demo seeding spec
// so every role can be exercised from a predictable, discoverable login set,
// independent of the hand-named ACCOUNTS above.
const GENERATED_ACCOUNTS = ROLE_DEFS.flatMap((def) => {
  const emailSlug = def.role.replace(/-/g, "");
  return ORDINAL_NAME.map((ordinal, i) => ({
    name: `${def.label} ${ordinal}`,
    email: `${emailSlug}${i + 1}@easyconstruct.demo`,
    role: def.role,
    employeeRole: def.employeeRole,
    department: def.department,
  }));
});

// Backs Admin's read-only Roles & Permissions screen. `name` must match the
// role string stored on users.role, since that's what every requireRole()
// check on the backend compares against.
const ROLES = [
  { name: "admin", label: "Admin", description: "Org-wide oversight: projects, workflows, documents, audit trail, and security." },
  { name: "project-manager", label: "Project Manager", description: "Creates projects, assigns engineers, initiates workflows, and signs off on approvals." },
  { name: "human-resources", label: "Human Resources", description: "Employee roster, attendance verification, and payroll generation." },
  { name: "finance-manager", label: "Finance Manager", description: "Budgets, expenses, and payroll batch review and approval." },
  { name: "architect", label: "Architect", description: "Designs, blueprints, proposals, reviews, and revisions." },
  { name: "engineer", label: "Engineer", description: "Technical requirements, progress reports, task creation, and issue resolution." },
  { name: "site-personnel", label: "Site Personnel", description: "Geofenced attendance, field task updates, documents, and issue reporting." },
  { name: "consultant", label: "Consultant", description: "Advisory review of design proposals and advisory documentation." },
  { name: "owner", label: "Owner", description: "Executive read-only oversight: org-wide performance, audit trail, and system activity." },
  { name: "it-designer", label: "IT Designer", description: "Platform administration: user accounts, roles, system configuration, monitoring, and maintenance." },
] as const;

const TEMPLATES = [
  {
    name: "Design Proposal Approval",
    description: "Architect submits a design; Consultant reviews it; PM signs off.",
    avgDurationHours: "48.0",
    defaultStages: [
      { role: "architect", roleLabel: "Architect Submission", iconKey: "FileSignature" },
      { role: "consultant", roleLabel: "Consultant Review", iconKey: "UserCheck" },
      { role: "project-manager", roleLabel: "PM Approval", iconKey: "ShieldCheck" },
    ],
  },
  {
    name: "Budget Change Request",
    description: "Engineer justifies a change; Finance reviews cost impact; PM and Admin sign off.",
    avgDurationHours: "72.0",
    defaultStages: [
      { role: "engineer", roleLabel: "Engineer Justification", iconKey: "FileSignature" },
      { role: "finance-manager", roleLabel: "Finance Review", iconKey: "Wallet" },
      { role: "project-manager", roleLabel: "PM Sign-off", iconKey: "ShieldCheck" },
      { role: "admin", roleLabel: "Admin Final Approval", iconKey: "ShieldCheck" },
    ],
  },
  // EC-010: previously lived outside this script (seeded manually, id 3),
  // so a full db:reset silently lost it — every fresh database had only the
  // two templates above. Seeded here now so it's a real default like them.
  // Stage sequence per docs/issues-list.md EC-010: HR Verification → Project
  // Manager → Admin Sign-off.
  {
    name: "Subcontractor onboarding",
    description: "HR verifies a subcontractor's documentation; PM and Admin sign off on engagement.",
    avgDurationHours: "36.0",
    defaultStages: [
      { role: "human-resources", roleLabel: "HR Verification", iconKey: "UserCheck" },
      { role: "project-manager", roleLabel: "Project Manager", iconKey: "FileSignature" },
      { role: "admin", roleLabel: "Admin Sign-off", iconKey: "ShieldCheck" },
    ],
  },
  // Name must be exactly "Public works compliance" — it's matched by string
  // (see client/src/components/workflows/workflow-initiation-actions.tsx's
  // PUBLIC_WORKS_COMPLIANCE_ACTION and the "only" filters on
  // architect-proposals.tsx / architect-reviews.tsx). A prior manually-
  // created row here was named "Public work compliance" (no "s"), which
  // matched none of those lookups and produced "No 'Public works compliance'
  // workflow template is configured."
  {
    name: "Public works compliance",
    description: "Architect review for a public-sector project; PM, Finance and Admin sign off.",
    avgDurationHours: "34.0",
    defaultStages: [
      { role: "architect", roleLabel: "Architect Review", iconKey: "FileSignature" },
      { role: "project-manager", roleLabel: "Project Manager", iconKey: "UserCheck" },
      { role: "finance-manager", roleLabel: "Finance Manager", iconKey: "Wallet" },
      { role: "admin", roleLabel: "Admin", iconKey: "ShieldCheck" },
    ],
  },
  // New: gives Consultant an initiation action of its own — it could already
  // decide on a stage (Design Proposal Approval's Consultant Review) and the
  // route already permits it to initiate (canInitiateWorkflow in
  // workflows/routes.ts), but no template ever put a Consultant-owned stage
  // first, so WORKFLOW_ACTIONS_BY_ROLE had no entry for it and the role had
  // no "start a workflow" button anywhere in the app.
  {
    name: "Document Compliance Review",
    description: "Consultant flags an advisory document for compliance review; Architect and Admin sign off.",
    avgDurationHours: "40.0",
    defaultStages: [
      { role: "consultant", roleLabel: "Consultant Review", iconKey: "UserCheck" },
      { role: "architect", roleLabel: "Architect Sign-off", iconKey: "FileSignature" },
      { role: "admin", roleLabel: "Admin Sign-off", iconKey: "ShieldCheck" },
    ],
  },
  // New: a PM-initiated chain distinct from Budget Change Request (which is
  // Engineer-initiated and framed as a cost justification) — this is a
  // scope/schedule change the PM raises directly, with Engineer weighing the
  // technical impact before Finance and Admin sign off on the cost.
  {
    name: "Change Order Request",
    description: "PM raises a scope or schedule change; Engineer assesses impact; Finance and Admin sign off.",
    avgDurationHours: "60.0",
    defaultStages: [
      { role: "project-manager", roleLabel: "PM Request", iconKey: "FileSignature" },
      { role: "engineer", roleLabel: "Engineer Impact Review", iconKey: "UserCheck" },
      { role: "finance-manager", roleLabel: "Finance Review", iconKey: "Wallet" },
      { role: "admin", roleLabel: "Admin Sign-off", iconKey: "ShieldCheck" },
    ],
  },
  // H3: name must be exactly "Project Closeout" — matched by string in
  // lifecycle/repository.ts's CLOSEOUT_TEMPLATE_NAME (gate X4 reads
  // closeoutTemplateId from this lookup) and in workflows/service.ts's
  // phase/role restriction on who may start one. Engineer initiates (the
  // Final Inspection is theirs, gate X1); Finance's stage is where H4 blocks
  // on pending expenses; PM and Admin sign off last.
  {
    name: "Project Closeout",
    description: "Engineer confirms final inspection; Finance clears outstanding expenses; PM and Admin sign off to complete the project.",
    avgDurationHours: "72.0",
    defaultStages: [
      { role: "engineer", roleLabel: "Final Inspection Sign-off", iconKey: "FileSignature" },
      { role: "finance-manager", roleLabel: "Finance Closeout Review", iconKey: "Wallet" },
      { role: "project-manager", roleLabel: "PM Sign-off", iconKey: "ShieldCheck" },
      { role: "admin", roleLabel: "Admin Final Approval", iconKey: "ShieldCheck" },
    ],
  },
] as const;

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const ALL_ACCOUNTS = [...ACCOUNTS, ...GENERATED_ACCOUNTS];

async function main() {
  const password = await bcrypt.hash(PASSWORD, 10);
  let createdUsers = 0;
  let createdEmployees = 0;

  await db.transaction(async (tx) => {
    for (const [index, account] of ALL_ACCOUNTS.entries()) {
      let [user] = await tx
        .select()
        .from(users)
        .where(eq(users.email, account.email));

      if (!user) {
        [user] = await tx
          .insert(users)
          .values({
            name: account.name,
            email: account.email,
            password,
            role: account.role,
          })
          .returning();
        createdUsers++;
        console.log(`created user: ${account.email}`);
      } else {
        console.log(`skip user (exists): ${account.email}`);
      }

      if (!user) throw new Error(`Failed to create or find ${account.email}`);

      const [employee] = await tx
        .select()
        .from(employees)
        .where(
          or(
            eq(employees.userId, user.id),
            eq(employees.email, account.email),
          ),
        );

      if (employee) {
        if (employee.userId !== user.id) {
          await tx
            .update(employees)
            .set({ userId: user.id, updatedAt: new Date() })
            .where(eq(employees.id, employee.id));
        }
        console.log(`skip employee (exists): ${account.email}`);
        continue;
      }

      await tx.insert(employees).values({
        employeeId: `EMP-DEMO-${String(index + 1).padStart(2, "0")}`,
        name: account.name,
        initials: initials(account.name),
        role: account.employeeRole,
        department: account.department,
        site: "Main Site",
        hiredOn: new Date().toISOString().slice(0, 10),
        email: account.email,
        userId: user.id,
      });
      createdEmployees++;
      console.log(`created employee: ${account.email}`);
    }

    for (const role of ROLES) {
      const [existing] = await tx
        .select()
        .from(roles)
        .where(eq(roles.name, role.name));

      if (existing) {
        console.log(`skip role (exists): ${role.name}`);
        continue;
      }

      await tx.insert(roles).values(role);
      console.log(`created role: ${role.name}`);
    }

    for (const template of TEMPLATES) {
      const [existing] = await tx
        .select()
        .from(workflowTemplates)
        .where(eq(workflowTemplates.name, template.name));

      if (existing) {
        console.log(`skip workflow template (exists): ${template.name}`);
        continue;
      }

      await tx.insert(workflowTemplates).values({
        ...template,
        defaultStages: template.defaultStages.map((s) => ({ ...s })),
      });
      console.log(`created workflow template: ${template.name}`);
    }
  });

  console.log(`\nDone. Created ${createdUsers} users and ${createdEmployees} employees (${ALL_ACCOUNTS.length} accounts total).`);
  console.log(`Password for demo accounts: ${PASSWORD}`);

  // Every demo login, printed together so the two newest roles (owner,
  // it-designer) are as easy to find as the nine that predate them.
  console.log("\nDemo logins:");
  for (const account of ALL_ACCOUNTS) {
    console.log(`  ${account.role.padEnd(16)} ${account.email}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
