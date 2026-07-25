import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  subtitle,
  badge,
  actions,
  children,
  className,
}: SectionCardProps) {
  return (
    <Card
      className={`rounded-2xl border-border/70 shadow-sm ${className ?? ""}`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <Badge
              variant="outline"
              className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            >
              {badge}
            </Badge>
          )}
          {actions}
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}
