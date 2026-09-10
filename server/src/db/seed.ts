import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";

import { db } from "./connection.js";
import { attendance } from "./schema/attendance.js";
import { employees } from "./schema/employees.js";
import { payroll } from "./schema/payroll.js";
import { projects } from "./schema/projects.js";
import { users } from "./schema/users.js";

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

const mockEmployees = [
  {
    employeeId: "EMP-001",
    name: "Adaeze Nwosu",
    initials: "AN",
    role: "Site Engineer",
    department: "Engineering",
    site: "Westgate Tower",
    status: "Active",
    attendanceRate: 97,
    performance: "4.6",
    hiredOn: "2022-01-10",
    email: "adaeze.nwosu@easyconstruct.test",
    phone: "+63 917 000 0001",
    payRate: "45000.00",
    rateType: "Monthly",
  },
  {
    employeeId: "EMP-002",
    name: "Marcus Bell",
    initials: "MB",
    role: "Field Supervisor",
    department: "Field Ops",
    site: "Harborline Hub",
    status: "Active",
    attendanceRate: 88,
    performance: "3.9",
    hiredOn: "2021-03-15",
    email: "marcus.bell@easyconstruct.test",
    phone: "+63 917 000 0002",
    payRate: "1800.00",
    rateType: "Daily",
  },
  {
    employeeId: "EMP-003",
    name: "Lena Park",
    initials: "LP",
    role: "Finance Analyst",
    department: "Finance",
    site: "HQ",
    status: "Active",
    attendanceRate: 99,
    performance: "4.8",
    hiredOn: "2020-06-01",
    email: "lena.park@easyconstruct.test",
    phone: "+63 917 000 0003",
    payRate: "52000.00",
    rateType: "Monthly",
  },
  {
    employeeId: "EMP-004",
    name: "Jordan Wells",
    initials: "JW",
    role: "Compliance Officer",
    department: "Legal",
    site: "HQ",
    status: "On Leave",
    attendanceRate: 91,
    performance: "4.2",
    hiredOn: "2019-09-20",
    email: "jordan.wells@easyconstruct.test",
    phone: "+63 917 000 0004",
    payRate: "48000.00",
    rateType: "Monthly",
  },
  {
    employeeId: "EMP-005",
    name: "Sofia Reyes",
    initials: "SR",
    role: "HR Coordinator",
    department: "HR",
    site: "HQ",
    status: "Active",
    attendanceRate: 95,
    performance: "4.4",
    hiredOn: "2023-02-05",
    email: "sofia.reyes@easyconstruct.test",
    phone: "+63 917 000 0005",
    payRate: "38000.00",
    rateType: "Monthly",
  },
  {
    employeeId: "EMP-008",
    name: "Derek Santos",
    initials: "DS",
    role: "Safety Officer",
    department: "Safety",
    site: "Harborline Hub",
    status: "Suspended",
    attendanceRate: 72,
    performance: "2.8",
    hiredOn: "2022-07-18",
    email: "derek.santos@easyconstruct.test",
    phone: "+63 917 000 0006",
    payRate: "1200.00",
    rateType: "Daily",
  },
];

const mockAttendance = [
  {
    employeeId: "EMP-001",
    site: "Westgate Tower",
    clockIn: "06:58",
    clockOut: "16:02",
    hours: "9.1",
    geofence: "Inside",
    photo: "Verified",
    status: "Verified",
    attendanceStatus: "Present",
    logDate: "2026-09-08",
  },
  {
    employeeId: "EMP-002",
    site: "Harborline Hub",
    clockIn: "07:34",
    clockOut: "17:10",
    hours: "9.6",
    geofence: "Outside",
    photo: "Failed",
    status: "Flagged",
    attendanceStatus: "Late",
    logDate: "2026-09-08",
  },
  {
    employeeId: "EMP-003",
    site: "HQ",
    clockIn: "08:01",
    clockOut: "17:00",
    hours: "8.9",
    geofence: "Inside",
    photo: "Verified",
    status: "Verified",
    attendanceStatus: "Present",
    logDate: "2026-09-08",
  },
  {
    employeeId: "EMP-004",
    site: "HQ",
    clockIn: "00:00",
    clockOut: "00:00",
    hours: "0.0",
    geofence: "Inside",
    photo: "Pending",
    status: "Pending",
    attendanceStatus: "On Leave",
    logDate: "2026-09-08",
    remarks: "Approved leave",
  },
  {
    employeeId: "EMP-005",
    site: "HQ",
    clockIn: "07:55",
    clockOut: "12:00",
    hours: "4.1",
    geofence: "Inside",
    photo: "Verified",
    status: "Verified",
    attendanceStatus: "Half Day",
    logDate: "2026-09-08",
  },
  {
    employeeId: "EMP-008",
    site: "Harborline Hub",
    clockIn: "00:00",
    clockOut: "00:00",
    hours: "0.0",
    geofence: "Inside",
    photo: "Pending",
    status: "Pending",
    attendanceStatus: "Absent",
    logDate: "2026-09-08",
    remarks: "No call, no show",
  },
];

const mockPayroll = [
  {
    empId: "EMP-001",
    name: "Adaeze Nwosu",
    initials: "AN",
    role: "Site Engineer",
    hours: 176,
    overtime: 6,
    gross: "48534.09",
    deductions: "5824.09",
    net: "42710.00",
    status: "Completed",
    period: "Aug 25 – Sep 07, 2026",
  },
  {
    empId: "EMP-002",
    name: "Marcus Bell",
    initials: "MB",
    role: "Field Supervisor",
    hours: 88,
    overtime: 10,
    gross: "23625.00",
    deductions: "2835.00",
    net: "20790.00",
    status: "Processing",
    period: "Aug 25 – Sep 07, 2026",
  },
  {
    empId: "EMP-003",
    name: "Lena Park",
    initials: "LP",
    role: "Finance Analyst",
    hours: 176,
    overtime: 0,
    gross: "52000.00",
    deductions: "6240.00",
    net: "45760.00",
    status: "Completed",
    period: "Aug 25 – Sep 07, 2026",
  },
];

const developmentUsers = [
  {
    email: "superadmin@easyconstruct.test",
    name: "Super Admin Test",
    role: "super-admin",
  },
  {
    email: "admin@easyconstruct.test",
    name: "Admin Test",
    role: "admin",
  },
  {
    email: "hr@easyconstruct.test",
    name: "HR Test",
    role: "human-resources",
  },
  {
    email: "finance@easyconstruct.test",
    name: "Finance Manager Test",
    role: "finance-manager",
  },
  {
    email: "pm@easyconstruct.test",
    name: "Test Project Manager",
    role: "project-manager",
  },
  {
    email: "architect@easyconstruct.test",
    name: "Architect Test",
    role: "architect",
  },
  {
    email: "engineer@easyconstruct.test",
    name: "Engineer Test",
    role: "engineer",
  },
  {
    email: "sitepersonnel@easyconstruct.test",
    name: "Site Personnel Test",
    role: "site-personnel",
  },
  {
    email: "consultant@easyconstruct.test",
    name: "Consultant Test",
    role: "consultant",
  },
] as const;

export const seedTestUsers = async () => {
  const password = await bcrypt.hash("Test1234", 10);

  for (const user of developmentUsers) {
    await db
      .insert(users)
      .values({
        ...user,
        password,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          password,
          name: user.name,
          role: user.role,
        },
      });
  }
};

async function seed() {
  console.log("🌱 Seeding development user and projects...");

  await seedTestUsers();

  await db
    .insert(projects)
    .values(mockProjects)
    .onConflictDoNothing();

  await db
    .insert(employees)
    .values(mockEmployees)
    .onConflictDoNothing({
      target: employees.employeeId,
    });

  const attendanceResult = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(attendance);

  const attendanceCount = attendanceResult[0]?.count ?? 0;

  if (attendanceCount === 0) {
    await db.insert(attendance).values(mockAttendance);
  }

  const payrollResult = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(payroll);

  const payrollCount = payrollResult[0]?.count ?? 0;

  if (payrollCount === 0) {
    await db.insert(payroll).values(mockPayroll);
  }

  console.log("✅ Done.");

  process.exit(0);
}

seed().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});