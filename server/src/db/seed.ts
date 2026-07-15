import { db } from "./connection.js";
import { projects } from "./schema/projects.js";

const mockProjects = [
  {
    name: "Westgate Medical Tower",
    code: "WMT-204",
    pm: "M. Rivera",
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

async function seed() {
  console.log("🌱 Seeding projects...");
  await db.insert(projects).values(mockProjects).onConflictDoNothing();
  console.log("✅ Done.");
  process.exit(0);
}

seed().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
