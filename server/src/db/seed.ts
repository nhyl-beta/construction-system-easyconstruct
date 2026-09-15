import bcrypt from "bcryptjs";
import { db } from "./connection.js";
import { projects } from "./schema/projects.js";
import { users } from "./schema/users.js";
import { documents } from "./schema/documents.js";
import { engineeringReports } from "./schema/engineering-reports.js";
import { requirements } from "./schema/requirements.js";

const mockProjects = [
  {
    name: "Westgate Medical Tower",
    code: "WMT-204",
    pm: "M. Rivera",
    assignedEngineer: "K. Okafor",
    status: "In Progress",
    statusTone: "info",
    progress: 68,
    budget: 92,
    due: "Aug 14",
    risk: "Low",
    location: "Westgate District",
    client: "Westgate Health Group",
    workforce: 142,
    description: "12-floor medical tower with full MEP integration.",
  },
  {
    name: "Harbor Logistics Hub",
    code: "HLH-118",
    pm: "T. Okafor",
    assignedEngineer: "L. Mendes",
    status: "Delayed",
    statusTone: "destructive",
    progress: 41,
    budget: 104,
    due: "Jun 30",
    risk: "High",
    location: "Harbor District",
    client: "Harbor Freight Corp",
    workforce: 118,
    description: "Large-scale logistics hub with automated sorting.",
  },
  {
    name: "Riverside Civic Center",
    code: "RCC-077",
    pm: "S. Aquino",
    status: "Under Review",
    statusTone: "warning",
    progress: 55,
    budget: 71,
    due: "Sep 02",
    risk: "Medium",
    location: "Riverside",
    client: "City of Riverside",
    workforce: 96,
    description: "Multi-purpose civic center with auditorium.",
  },
  {
    name: "North Ridge Terminal 2",
    code: "NRT-330",
    pm: "K. Singh",
    status: "On Track",
    statusTone: "success",
    progress: 82,
    budget: 78,
    due: "Jul 21",
    risk: "Low",
    location: "North Ridge",
    client: "NR Airport Authority",
    workforce: 88,
    description: "Airport terminal expansion with new gates.",
  },
  {
    name: "Eastfield Solar Farm",
    code: "ESF-051",
    pm: "L. Park",
    status: "Planning",
    statusTone: "muted",
    progress: 12,
    budget: 18,
    due: "Nov 10",
    risk: "Low",
    location: "Eastfield",
    client: "GreenPower Inc.",
    workforce: 24,
    description: "Utility-scale solar installation across 340 acres.",
  },
];

const mockDocuments = [
  {
    documentId: "DR-302",
    title: "Curtain wall — Rev C",
    project: "WMT-204",
    type: "Drawing",
    version: "v3",
    size: "12.4 MB",
    uploadedBy: "P. Anand",
  },
  {
    documentId: "PR-2041",
    title: "Steel erection proposal",
    project: "WMT-204",
    type: "Proposal",
    version: "v2",
    size: "1.8 MB",
    uploadedBy: "L. Park",
  },
  {
    documentId: "CT-1187",
    title: "General contractor agreement",
    project: "HLH-118",
    type: "Contract",
    version: "v1",
    size: "640 KB",
    uploadedBy: "T. Okafor",
  },
  {
    documentId: "PM-556",
    title: "Fire safety permit",
    project: "RCC-077",
    type: "Permit",
    version: "v1",
    size: "310 KB",
    uploadedBy: "S. Aquino",
  },
  {
    documentId: "RF-874",
    title: "RFI — foundation rebar spacing",
    project: "HLH-118",
    type: "RFI",
    version: "v1",
    size: "220 KB",
    uploadedBy: "M. Rivera",
  },
  {
    documentId: "RP-441",
    title: "Monthly progress report — June",
    project: "NRT-330",
    type: "Report",
    version: "v1",
    size: "4.1 MB",
    uploadedBy: "K. Singh",
  },
];

const mockEngineeringReports = [
  {
    reportId: "SR-2218",
    title: "Foundation cure inspection — zone B",
    type: "Site Inspection",
    project: "WMT-204",
    location: "Zone B, Level 3",
    date: "2026-08-20",
    engineer: "K. Okafor",
    priority: "Medium",
    description: "Routine cure-window inspection following the zone B pour.",
    findings: "Cure progressing on schedule; humidity slightly elevated.",
    recommendations: "Re-check in 6 hours before proceeding to next pour.",
    status: "Submitted",
  },
  {
    reportId: "SR-2219",
    title: "Rebar spacing verification",
    type: "Structural Assessment",
    project: "HLH-118",
    location: "Basement, Level -1",
    date: "2026-08-19",
    engineer: "L. Mendes",
    priority: "High",
    description: "Verification of rebar spacing against revised structural drawings.",
    findings: "Spacing within tolerance across all inspected bays.",
    recommendations: "Approved to proceed with formwork.",
    status: "Approved",
  },
  {
    reportId: "SR-2220",
    title: "Electrical basement inspection",
    type: "Non-Conformance Report",
    project: "RCC-077",
    location: "Basement, Electrical room",
    date: "2026-08-18",
    engineer: "T. Nakamura",
    priority: "Critical",
    description: "Inspection flagged a conduit routing conflict blocking downstream trades.",
    findings: "Conduit run clashes with structural beam at grid C4.",
    recommendations: "Reroute conduit; escalate to structural engineer for sign-off.",
    requiredActions: "Coordinate with structural team before next inspection window.",
    status: "Revision Required",
  },
];

const mockRequirements = [
  {
    requirementId: "REQ-101",
    title: "Curtain wall thermal performance",
    project: "WMT-204",
    category: "Specifications",
    description:
      "Curtain wall assembly must achieve a U-value ≤ 0.28 W/m²K across all glazed elevations.",
    status: "Approved",
    createdBy: "K. Okafor",
  },
  {
    requirementId: "REQ-102",
    title: "Rebar grade for transfer beams",
    project: "HLH-118",
    category: "Materials",
    description:
      "All transfer beam reinforcement must use Grade 60 rebar per the revised structural schedule.",
    status: "Under Review",
    createdBy: "L. Mendes",
  },
  {
    requirementId: "REQ-103",
    title: "Site access constraint — Zone C",
    project: "RCC-077",
    category: "Constraints",
    description:
      "Heavy equipment access to Zone C is restricted to 6am–10am due to adjacent school traffic.",
    status: "Draft",
    createdBy: "T. Nakamura",
  },
];

const developmentUsers = [
  { email: "superadmin@easyconstruct.test", name: "Super Admin Test", role: "super-admin" },
  { email: "admin@easyconstruct.test", name: "Admin Test", role: "admin" },
  { email: "hr@easyconstruct.test", name: "HR Test", role: "human-resources" },
  { email: "finance@easyconstruct.test", name: "Finance Manager Test", role: "finance-manager" },
  { email: "pm@easyconstruct.test", name: "Test Project Manager", role: "project-manager" },
  { email: "architect@easyconstruct.test", name: "Architect Test", role: "architect" },
  { email: "engineer@easyconstruct.test", name: "Engineer Test", role: "engineer" },
  { email: "sitepersonnel@easyconstruct.test", name: "Site Personnel Test", role: "site-personnel" },
  { email: "consultant@easyconstruct.test", name: "Consultant Test", role: "consultant" },
] as const;

export const seedTestUsers = async () => {
  const password = await bcrypt.hash("Test1234", 10);
  for (const user of developmentUsers) {
    await db.insert(users).values({ ...user, password }).onConflictDoUpdate({
      target: users.email,
      set: { password, name: user.name, role: user.role },
    });
  }
};

async function seed() {
  console.log("🌱 Seeding development user and projects...");
  await seedTestUsers();
  await db.insert(projects).values(mockProjects).onConflictDoNothing();
  await db.insert(documents).values(mockDocuments).onConflictDoNothing();
  await db.insert(engineeringReports).values(mockEngineeringReports).onConflictDoNothing();
  await db.insert(requirements).values(mockRequirements).onConflictDoNothing();
  console.log("✅ Done.");
  process.exit(0);
}

seed().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});