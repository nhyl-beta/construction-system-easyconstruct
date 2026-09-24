// K1
export interface MyActionItem {
  projectCode: string;
  projectName: string;
  kind: "gate" | "workflow";
  title: string;
  detail: string;
  link: string;
}
