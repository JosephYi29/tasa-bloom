import { LogoutButton } from "@/components/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { CurrentUser } from "@/types/app";
import { Badge } from "@/components/ui/badge";

interface TopBarProps {
  user: CurrentUser;
}

export function TopBar({ user }: TopBarProps) {
  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-medium text-muted-foreground">
          TASA Bloom
        </h1>
        {user?.isAdmin && (
          <Badge variant="secondary" className="text-xs">
            Admin
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground hidden sm:block">
          {user?.email}
        </span>
        <ThemeSwitcher />
        <LogoutButton />
      </div>
    </header>
  );
}
