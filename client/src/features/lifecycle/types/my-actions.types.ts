// K1
export interface MyActionItem {
  projectCode: string;
  projectName: string;
  kind: "gate" | "workflow" | "signal";
  title: string;
  detail: string;
  link: string;
  /** ai-signals E3: only present on kind "signal". */
  severity?: "warn" | "critical";
}
