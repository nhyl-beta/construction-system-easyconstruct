import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { STATUS_CONFIG } from "@/config/status-config";
import { STATUS_TONES } from "@/config/status-tone";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({
  status,
  className,
}: StatusBadgeProps) {
  const tone = STATUS_CONFIG[status] ?? "neutral";

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full text-[10px] font-medium",
        STATUS_TONES[tone],
        className
      )}
    >
      {status}
    </Badge>
  );
}