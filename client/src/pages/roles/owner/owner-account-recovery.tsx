// client/src/pages/roles/owner/owner-account-recovery.tsx — NEW
//
// "Fail-Safe Account Recovery": Owner is otherwise read-only (see
// role-tab.ts), but if the IT Designer account itself is the one locked out,
// no other account-management role can fix that — IT Designer IS account
// management. This is a narrow, one-directional exception: Owner may recover
// the IT Designer account only, and the confirmation link is delivered to
// the OWNER's own registered email, never the IT Designer's.
import { useState } from "react";
import { KeyRound, Mail, ShieldAlert, UserCog } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { useAuth } from "@/auth/auth-context";
import { useAccountRecovery } from "@/features/account-recovery/hooks/use-account-recovery";
import { formatRelativeTime } from "@/lib/format-relative-time";

export default function OwnerAccountRecoveryPage() {
  const { user } = useAuth();
  const { targets, loading, sending, email, error, sendRecoveryEmail } = useAccountRecovery();
  const [sentFor, setSentFor] = useState<number | null>(null);

  return (
    <PageContainer>
      <PageHeader
        title="Fail-safe account recovery"
        description="Recover the IT Designer account if it becomes locked out. A confirmation link is sent to your own registered email — not the IT Designer's — so you can complete the reset yourself."
      />
      <PageContent className="space-y-6 p-6 md:p-8">
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p className="text-muted-foreground">
            This is a last-resort control, not a general password reset. It only ever targets IT
            Designer accounts, and every use is recorded in the{" "}
            <span className="font-medium text-foreground">Audit Trail</span>.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <UserCog className="h-4 w-4 text-muted-foreground" />
            IT Designer account
          </h3>

          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

          {!loading && targets.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No IT Designer account exists to recover.
            </p>
          )}

          {!loading &&
            targets.map((t) => (
              <Card key={t.id} className="rounded-2xl border-border/70 shadow-sm">
                <CardContent className="flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t.name}</span>
                      <Badge
                        variant="outline"
                        className={`rounded-full text-[10px] ${
                          t.isActive
                            ? "border-success/30 bg-success/10 text-success"
                            : "border-destructive/30 bg-destructive/10 text-destructive"
                        }`}
                      >
                        {t.isActive ? "Active" : "Deactivated"}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{t.email}</p>
                  </div>
                  <Button
                    size="sm"
                    className="rounded-xl"
                    disabled={sending}
                    onClick={async () => {
                      setSentFor(t.id);
                      await sendRecoveryEmail(t.id);
                    }}
                  >
                    <KeyRound className="h-4 w-4" />
                    {sending && sentFor === t.id ? "Sending…" : "Send recovery email"}
                  </Button>
                </CardContent>
              </Card>
            ))}
        </div>

        {email && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Your inbox — {email.to}
            </h3>
            <Card className="rounded-2xl border-primary/30 bg-primary-soft/30 shadow-sm">
              <CardContent className="space-y-3 p-5 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div>
                    <p className="font-medium">EasyConstruct account recovery</p>
                    <p className="text-xs text-muted-foreground">
                      To {email.to} · {formatRelativeTime(email.createdAt)}
                    </p>
                  </div>
                  <Badge variant="outline" className="rounded-full text-[10px]">
                    Simulated — no mail server configured
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {user?.name ?? "You"} requested access recovery for the IT Designer account{" "}
                  <span className="font-medium text-foreground">
                    {email.targetName} ({email.targetEmail})
                  </span>
                  . Use the link below to set a new password for that account. This link expires
                  in 30 minutes and can only be used once.
                </p>
                <Button asChild className="rounded-xl">
                  <a href={email.resetUrl}>Reset the IT Designer password</a>
                </Button>
                <p className="break-all text-[11px] text-muted-foreground">{email.resetUrl}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </PageContent>
    </PageContainer>
  );
}

OwnerAccountRecoveryPage.displayName = "OwnerAccountRecoveryPage";
