import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordInput } from "@/components/ui/auth/password-input";
import { AuthSecurityNotice } from "@/components/ui/auth/auth-security-notice";

// FLAG: same collision as the other two pages — confirm real path.

import { useLoginController } from "@/hooks/use-auth-controllers";
import { AUTH_MESSAGES } from "@/config/auth-message";

export function LoginForm() {
  const { status, errors, formError, submit } = useLoginController();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const busy = status === "loading" || status === "success";

  return (
    <Card className="border-border/70 shadow-lg">
      <CardHeader className="space-y-1.5">
        <CardTitle className="font-display text-2xl tracking-tight">
          Welcome back
        </CardTitle>
        <CardDescription>
          Sign in to continue to your EasyConstruct workspace.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {formError && (
          <Alert variant="destructive" role="alert">
            <AlertCircle className="size-4" aria-hidden="true" />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        {status === "success" && (
          <Alert role="status" className="border-success/40 text-success">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            <AlertDescription>{AUTH_MESSAGES.success}</AlertDescription>
          </Alert>
        )}

        <form
          noValidate
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit({ email, password, remember });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Mail
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="Enter your email address"
                className="h-11 pl-9"
                value={email}
                disabled={busy}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email || undefined}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
            </div>
            {errors.email && (
              <p id="email-error" role="alert" className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="size-3.5" aria-hidden="true" />
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a
                href="/forgot-password"
                className="text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:underline"
              >
                Forgot password?
              </a>
            </div>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              disabled={busy}
              invalid={!!errors.password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            {errors.password && (
              <p id="password-error" role="alert" className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="size-3.5" aria-hidden="true" />
                {errors.password}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={remember}
              disabled={busy}
              onCheckedChange={(v) => setRemember(v === true)}
            />
            <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
              Keep me signed in on this device
            </Label>
          </div>

          <Button type="submit" className="h-11 w-full" disabled={busy}>
            {status === "loading" ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {AUTH_MESSAGES.loading}
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <Separator />

        <div className="space-y-3">
          <AuthSecurityNotice />
          <p className="text-center text-xs text-muted-foreground">
            No account yet?{" "}
            <a
              href="mailto:admin@easyconstruct.app"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Contact administrator
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}