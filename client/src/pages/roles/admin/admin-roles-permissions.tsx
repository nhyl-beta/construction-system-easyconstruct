import { Info, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";
import { useRoles } from "@/features/roles/hooks/useRoles";

export default function AdminRolesPermissionsPage() {
  const { roles, loading, error } = useRoles();

  return (
    <PageContainer>
      <PageHeader
        title="Roles & permissions"
        description="The roles configured across EasyConstruct and what they represent."
      />
      <PageContent className="space-y-4 p-6 md:p-8">
        <div className="flex items-start gap-2 rounded-xl border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            This is a read-only view. Role assignment and permission changes
            are a Super Admin responsibility and aren't performed from this
            screen.
          </p>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading roles…</p>}
        {!loading && error && (
          <p className="text-sm text-destructive">Couldn't load roles. {error.message}</p>
        )}
        {!loading && !error && roles.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/50 px-6 py-12 text-center">
            <UserCheck className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No roles configured yet.</p>
          </div>
        )}
        {!loading && !error && roles.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {roles.map((role) => (
              <Card key={role.id} className="rounded-2xl border-border/70 shadow-sm">
                <CardContent className="space-y-2 p-5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-medium leading-tight">{role.label}</h3>
                      <p className="font-mono text-[11px] text-muted-foreground">{role.name}</p>
                    </div>
                  </div>
                  {role.description && (
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </PageContent>
    </PageContainer>
  );
}

AdminRolesPermissionsPage.displayName = "AdminRolesPermissionsPage";
