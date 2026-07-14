// src/pages/roles/human-resources/hr-employees.tsx
import { Download, Filter, MoreHorizontal, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader, StatusBadge } from "@/pages/roles/shared/shared-hr";
import { departments, employees, type Employee } from "@/providers/mock-data";

function EmployeeRow({ e }: { e: Employee }) {
  return (
    <TableRow className="hover:bg-muted/40">
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary-soft text-xs font-semibold text-primary">
              {e.initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{e.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">
              Hired {e.hiredOn}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">
        {e.id}
      </TableCell>
      <TableCell className="text-sm">{e.role}</TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {e.department}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{e.site}</TableCell>
      <TableCell>
        <StatusBadge status={e.status} />
      </TableCell>
      <TableCell className="text-right">
        <span
          className={
            e.attendanceRate >= 95
              ? "text-success"
              : e.attendanceRate >= 85
              ? "text-warning"
              : "text-destructive"
          }
        >
          {e.attendanceRate}%
        </span>
      </TableCell>
      <TableCell className="text-right text-sm">
        {e.performance.toFixed(1)}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View profile</DropdownMenuItem>
            <DropdownMenuItem>Edit record</DropdownMenuItem>
            <DropdownMenuItem>Employment history</DropdownMenuItem>
            <DropdownMenuItem>Documents</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export default function HREmployeesPage() {
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("all");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(
    () =>
      employees.filter((e) => {
        const q = query.toLowerCase();
        const matchQ =
          !query ||
          e.name.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q) ||
          e.role.toLowerCase().includes(q);
        const matchD = dept === "all" || e.department === dept;
        const matchS = status === "all" || e.status === status;
        return matchQ && matchD && matchS;
      }),
    [query, dept, status],
  );

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      <PageHeader
        title="Employees"
        subtitle="Directory, roles, and workforce records"
        actions={
          <>
            <Button variant="outline" size="sm" className="rounded-xl">
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button size="sm" className="rounded-xl" asChild>
              <Link to="/employees/create">
                <Plus className="h-4 w-4" /> Add employee
              </Link>
            </Button>
          </>
        }
      />

      <Card className="rounded-2xl">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, ID, or role…"
              className="h-9 rounded-xl border-border bg-muted/40 pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger className="h-9 w-[170px] rounded-xl">
                <Filter className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.name} value={d.name}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-[140px] rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="rounded-xl">
              <Download className="h-4 w-4" /> CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Employee directory</CardTitle>
            <p className="text-xs text-muted-foreground">
              {filtered.length} of {employees.length} employees · bulk actions
              available
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-xl">
              Archive
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl">
              Reassign
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[260px]">Employee</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Attendance</TableHead>
                <TableHead className="text-right">Perf.</TableHead>
                <TableHead className="w-[40px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => (
                <EmployeeRow key={e.id} e={e} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
