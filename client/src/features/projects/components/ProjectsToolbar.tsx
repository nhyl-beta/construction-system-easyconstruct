import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search } from "lucide-react";
import React from "react";
import { Link } from "react-router";

export const ProjectsToolbar: React.FC<{
  query: string;
  setQuery: (q: string) => void;
  view: "table" | "grid";
  setView: (v: "table" | "grid") => void;
  /**
   * Defaults to true so every existing caller keeps the button. Read-only
   * roles (Owner) pass false — they have no create grant on /api/projects,
   * so the link would only ever lead to a form that 403s on submit.
   */
  showCreate?: boolean;
  /** Archived is hidden by default (C12) — omitted callers just don't get the toggle. */
  showArchived?: boolean;
  onToggleArchived?: (next: boolean) => void;
}> = ({ query, setQuery, view, setView, showCreate = true, showArchived, onToggleArchived }) => {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">All projects</h2>
        <p className="text-sm text-muted-foreground">
          Filter, triage, and drill into project performance.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or code…"
            value={query}
            onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
            className="h-9 rounded-xl border-border bg-muted/40 pl-9"
          />
        </div>

        {showCreate && (
          <Button asChild className="rounded-xl">
            <Link to="/projects/new">
              <Plus className="h-4 w-4" /> New project
            </Link>
          </Button>
        )}

        {onToggleArchived && (
          <Button
            size="sm"
            variant={showArchived ? "secondary" : "outline"}
            className="h-9 rounded-xl text-xs"
            onClick={() => onToggleArchived(!showArchived)}
          >
            {showArchived ? "Hide archived" : "Show archived"}
          </Button>
        )}

        <Tabs
          value={view}
          onValueChange={(v) => setView(v as "table" | "grid")}
        >
          <TabsList className="h-9 rounded-xl">
            <TabsTrigger value="table" className="gap-1.5 rounded-lg text-xs">
              Table
            </TabsTrigger>
            <TabsTrigger value="grid" className="gap-1.5 rounded-lg text-xs">
              Grid
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};
