import { UserAvatar } from "@/components/refine-ui/layout/user-avatar";
import { SignOutButton } from "@/components/ui/auth/sign-out-button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useGetIdentity } from "@refinedev/core";

type User = {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  avatar?: string;
};

export function UserInfo() {
  const { data: user, isLoading: userIsLoading } = useGetIdentity<User>();

  if (userIsLoading || !user) {
    return (
      <div className={cn("flex", "items-center", "gap-x-2")}>
        <Skeleton className={cn("h-10", "w-10", "rounded-full")} />
        <div className={cn("flex", "flex-col", "justify-between", "h-10")}>
          <Skeleton className={cn("h-4", "w-32")} />
          <Skeleton className={cn("h-4", "w-24")} />
        </div>
      </div>
    );
  }

  const { firstName, lastName, email } = user;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn("flex", "items-center", "gap-x-2", "text-left")}
        >
          <UserAvatar />
          <div className={cn("flex", "flex-col", "justify-between", "h-10")}>
            <span className={cn("text-sm", "font-medium", "text-muted-foreground")}>
              {firstName} {lastName}
            </span>
            <span className={cn("text-xs", "text-muted-foreground")}>{email}</span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <SignOutButton />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

UserInfo.displayName = "UserInfo";