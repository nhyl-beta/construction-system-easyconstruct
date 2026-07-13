// src/providers/mock-data.ts
import type { LucideIcon } from "lucide-react";
import {
  TrendingUp,
  CheckCircle2,
  Wallet,
  HardHat,
} from "lucide-react";

// ─── Interfaces ─────────────────────────────────────────────────────────────

export type Trend = "up" | "down" | "flat";

export type StatusTone = "success" | "info" | "warning" | "destructive" | "muted";

export type RiskLevel = "Low" | "Medium" | "High";

export type ImpactLevel = "Low" | "Medium" | "High";

export interface KPI {
  label: string;
  value: string;
  delta: string;
  trend: Trend;
  icon: LucideIcon;
  hint: string;
}

export interface Project {
  name: string;
  code: string;
  pm: string;
  status: string;
  statusTone: StatusTone;
  progress: number; // percentage complete, 0-100
  budget: number;   // percentage of budget consumed, can exceed 100
  due: string;
  risk: RiskLevel;
}

export interface AIInsight {
  title: string;
  summary: string;
  confidence: number; // percentage, 0-100
  impact: ImpactLevel;
  action: string;
}

export interface Approval {
  id: string;
  title: string;
  amount: string;
  owner: string;
  age: string;
}

export interface ActivityItem {
  who: string;
  what: string;
  when: string;
}

export interface WorkforceSummary {
  present: number;
  late: number;
  absent: number;
}

export interface SiteAdvisory {
  title: string;
  message: string;
}

// ─── Dashboard KPIs ───────────────────────────────────────────────────────────

export const dashboardKPIs: KPI[] = [
  { label: "Active projects",    value: "24",     delta: "+3 this month",     trend: "up",   icon: TrendingUp,   hint: "vs. last quarter" },
  { label: "On-time milestones", value: "87%",    delta: "+4.2%",             trend: "up",   icon: CheckCircle2, hint: "rolling 30d"      },
  { label: "Budget utilization", value: "$12.4M", delta: "62% of plan",       trend: "flat", icon: Wallet,       hint: "across portfolio" },
  { label: "Workforce on site",  value: "342",    delta: "-12 vs. yesterday", trend: "down", icon: HardHat,      hint: "9 sites"          },
];

// ─── Projects ─────────────────────────────────────────────────────────────────

export const activeProjects: Project[] = [
  { name: "Westgate Medical Tower", code: "WMT-204", pm: "M. Rivera", status: "In Progress",  statusTone: "info",        progress: 68, budget: 92,  due: "Aug 14", risk: "Low"    },
  { name: "Harbor Logistics Hub",   code: "HLH-118", pm: "T. Okafor", status: "Delayed",      statusTone: "destructive", progress: 41, budget: 104, due: "Jun 30", risk: "High"   },
  { name: "Riverside Civic Center", code: "RCC-077", pm: "S. Aquino", status: "Under Review", statusTone: "warning",     progress: 55, budget: 71,  due: "Sep 02", risk: "Medium" },
  { name: "North Ridge Terminal 2", code: "NRT-330", pm: "K. Singh",  status: "On Track",     statusTone: "success",     progress: 82, budget: 78,  due: "Jul 21", risk: "Low"    },
  { name: "Eastfield Solar Farm",   code: "ESF-051", pm: "L. Park",   status: "Planning",     statusTone: "muted",       progress: 12, budget: 18,  due: "Nov 10", risk: "Low"    },
];

// ─── AI Insights ──────────────────────────────────────────────────────────────

export const aiInsights: AIInsight[] = [
  {
    title: "Schedule slip risk on HLH-118",
    summary: "Concrete pour dependencies for Block C show a 9-day projected slip based on supplier lead times and weather.",
    confidence: 86,
    impact: "High",
    action: "Re-sequence Block C pour",
  },
  {
    title: "Proposal P-2041 ready for review",
    summary: "Validated against scope, pricing band, and 3 historical comparables. Two clauses flagged for legal.",
    confidence: 92,
    impact: "Medium",
    action: "Open validation report",
  },
  {
    title: "Crew reallocation opportunity",
    summary: "Shifting 6 electricians from RCC-077 (week 14) to NRT-330 saves ~$48k without milestone impact.",
    confidence: 74,
    impact: "Medium",
    action: "Simulate reallocation",
  },
];

// ─── Pending Approvals ──────────────────────────────────────────────────────

export const pendingApprovals: Approval[] = [
  { id: "PR-2041", title: "Subcontractor proposal — Steel erection", amount: "$1.24M", owner: "Finance",     age: "2d" },
  { id: "CO-118",  title: "Change order — Block C foundations",       amount: "$182k",  owner: "Engineering", age: "1d" },
  { id: "TS-009",  title: "Timesheet exception — Crew 14",            amount: "48 hrs", owner: "HR",          age: "4h" },
  { id: "DR-302",  title: "Drawing revision — Curtain wall",          amount: "Rev. C", owner: "Architect",   age: "6h" },
];

// ─── Activity Timeline ────────────────────────────────────────────────────────

export const activityTimeline: ActivityItem[] = [
  { who: "T. Okafor",    what: "uploaded RFI-208 to Harbor Logistics Hub", when: "12m" },
  { who: "AI Assistant", what: "flagged margin variance on PR-2041",       when: "38m" },
  { who: "S. Aquino",    what: "moved 'Roof framing' to Completed",        when: "1h"  },
  { who: "K. Singh",     what: "approved timesheet batch #228",            when: "2h"  },
  { who: "L. Park",      what: "drafted proposal P-2052",                  when: "3h"  },
];

// ─── Workforce Summary ────────────────────────────────────────────────────────

export const workforceSummary: WorkforceSummary = {
  present: 298,
  late: 31,
  absent: 13,
};

// ─── Site Advisories ──────────────────────────────────────────────────────────

export const siteAdvisories: SiteAdvisory[] = [
  {
    title: "Weather advisory",
    message: "Heavy rain expected at Harbor & Riverside sites Thursday. Consider rescheduling exterior pours.",
  },
];