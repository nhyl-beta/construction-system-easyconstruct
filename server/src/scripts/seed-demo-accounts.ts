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
  // NOTE (EC-010): a "Subcontractor onboarding" template with a
  // human-resources stage already exists in workflow_templates (seeded
  // outside this script, predating it) — verified live rather than
  // duplicated here. See docs/issues-list.md EC-010 for details.
] as const;

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

async function main() {
  const password = await bcrypt.hash(PASSWORD, 10);
  let createdUsers = 0;
  let createdEmployees = 0;

  await db.transaction(async (tx) => {
    for (const [index, account] of ACCOUNTS.entries()) {
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

  console.log(`\nDone. Created ${createdUsers} users and ${createdEmployees} employees.`);
  console.log(`Password for demo accounts: ${PASSWORD}`);

  // Every demo login, printed together so the two newest roles (owner,
  // it-designer) are as easy to find as the nine that predate them.
  console.log("\nDemo logins:");
  for (const account of ACCOUNTS) {
    console.log(`  ${account.role.padEnd(16)} ${account.email}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
