import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Plus } from "lucide-react";
import { Link } from "react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const ProjectsToolbar: React.FC<{
  query: string;
  setQuery: (q: string) => void;
  view: "table" | "grid";
  setView: (v: "table" | "grid") => void;
}> = ({ query, setQuery, view, setView }) => {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">All projects</h2>
        <p className="text-sm text-muted-foreground">Filter, triage, and drill into project performance.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name or code…" value={query} onChange={(e) => setQuery((e.target as HTMLInputElement).value)} className="h-9 rounded-xl border-border bg-muted/40 pl-9" />
        </div>
        
        <Button variant="outline" size="sm" className="rounded-xl"><Filter className="h-4 w-4" /> Filters</Button>
        <Button asChild className="rounded-xl"><Link to="/projects/new"><Plus className="h-4 w-4" /> New project</Link></Button>

        <Tabs value={view} onValueChange={(v) => setView(v as "table" | "grid") }>
          <TabsList className="h-9 rounded-xl">
            <TabsTrigger value="table" className="gap-1.5 rounded-lg text-xs">Table</TabsTrigger>
            <TabsTrigger value="grid" className="gap-1.5 rounded-lg text-xs">Grid</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};
