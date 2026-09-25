// client/src/features/lifecycle/components/DecisionSupportSection.tsx — NEW (ai-signals E2)
//
// Purely informational — nothing in here calls advance/decide or any other
// mutation. Rendered beneath the gate checklist in ProjectLifecyclePanel,
// visibly separate (own heading, divider, muted background) so it can never
// be mistaken for part of the gate checks above it.
import { Link } from "react-router";
import { AlertTriangle, Info, Sparkles, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Signal, Severity } from "../types/lifecycle.types";

const SEVERITY_STYLE: Record<Severity, { className: string; icon: typeof Info; label: string }> = {
  critical: { className: "border-destructive/30 bg-destructive/10 text-destructive", icon: AlertTriangle, label: "Critical" },
  warn: { className: "border-warning/30 bg-warning/10 text-warning", icon: TriangleAlert, label: "Warning" },
  info: { className: "border-info/30 bg-info/10 text-info", icon: Info, label: "Info" },
};

function SignalRow({ signal }: { signal: Signal }) {
  const style = SEVERITY_STYLE[signal.severity];
  const Icon = style.icon;

  return (
    <li className="flex items-start gap-2 rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-sm">
      <Badge variant="outline" className={`mt-0.5 shrink-0 gap-1 rounded-full text-[10px] ${style.className}`}>
        <Icon className="h-3 w-3" />
        {style.label}
      </Badge>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-medium leading-snug">{signal.label}</p>
        <p className="text-xs text-muted-foreground">{signal.detail}</p>
        {signal.sources && signal.sources.length > 0 && (
          <p className="text-[11px] text-muted-foreground/80">
            {signal.sources
              .map((s) => `Cost reference: ${s.source}${s.fetchedAt ? `, fetched ${s.fetchedAt.slice(0, 10)}` : ""}`)
              .join(" · ")}
          </p>
        )}
        {signal.link && (
          <Link to={signal.link} className="inline-block text-xs font-medium text-primary hover:underline">
            Go to {signal.link.replace(/^\//, "")}
          </Link>
        )}
      </div>
    </li>
  );
}

export function DecisionSupportSection({ signals }: { signals: Signal[] }) {
  return (
    <div className="space-y-2 rounded-xl border border-ai/20 bg-ai-soft/30 p-3">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-1 rounded-full border-ai/30 bg-background/60 text-[10px] text-ai">
          <Sparkles className="h-3 w-3" />
          AI
        </Badge>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-foreground">Decision support</p>
          <p className="text-[11px] text-muted-foreground">Rule-based advisories — they never block approval.</p>
        </div>
      </div>

      {signals.length === 0 ? (
        <p className="text-xs text-muted-foreground">No advisories for this phase.</p>
      ) : (
        <ul className="space-y-1.5">
          {signals.map((signal) => (
            <SignalRow key={signal.key} signal={signal} />
          ))}
        </ul>
      )}
    </div>
  );
}

DecisionSupportSection.displayName = "DecisionSupportSection";
