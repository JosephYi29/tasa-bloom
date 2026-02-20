"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  BarChart3,
  Settings,
  Upload,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/protected/admin", label: "Overview", icon: Shield },
  { href: "/protected/admin/candidates", label: "Candidates", icon: Users },
  { href: "/protected/admin/import", label: "Import", icon: Upload },
  { href: "/protected/admin/oversight", label: "Oversight", icon: BarChart3 },
  { href: "/protected/admin/settings/cohorts", label: "Settings", icon: Settings },
];

interface AdminNavProps {
  collapsed?: boolean;
}

export function AdminNav({ collapsed = false }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <div className="px-2 space-y-1">
      <div
        className={cn(
          "px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
          collapsed && "sr-only"
        )}
      >
        Admin
      </div>
      {adminLinks.map((link) => {
        const isActive =
          pathname === link.href ||
          (link.href !== "/protected/admin" &&
            pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
            title={collapsed ? link.label : undefined}
          >
            <link.icon size={18} />
            {!collapsed && <span>{link.label}</span>}
          </Link>
        );
      })}
    </div>
  );
}
