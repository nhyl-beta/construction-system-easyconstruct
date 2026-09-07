import { LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "@/auth/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SignOutButtonProps {
  className?: string;
}

export function SignOutButton({ className }: SignOutButtonProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

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