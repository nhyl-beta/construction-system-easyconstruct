import { LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "@/auth/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SignOutButtonProps {
  className?: string;
  iconOnly?: boolean;
}

export function SignOutButton({ className, iconOnly = false }: SignOutButtonProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  if (iconOnly) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Sign out"
        title="Sign out"
        className={cn("h-8 w-8 shrink-0", className)}
        onClick={handleSignOut}
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className={cn("w-full justify-start", className)}
      onClick={handleSignOut}
    >
      <LogOut className="size-4" aria-hidden="true" />
      Sign out
    </Button>
  );
}

SignOutButton.displayName = "SignOutButton";