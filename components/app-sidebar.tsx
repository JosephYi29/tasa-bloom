"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Vote,
  User,
  ChevronLeft,
  ChevronRight,
  Users,
  BarChart3,
  Settings,
  Upload,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const memberLinks = [
  { href: "/protected", label: "Dashboard", icon: LayoutDashboard },
  { href: "/protected/vote", label: "Vote", icon: Vote },
  { href: "/protected/profile", label: "Profile", icon: User },
];

const adminLinks = [
  { href: "/protected/admin", label: "Overview", icon: Shield },
  { href: "/protected/admin/candidates", label: "Candidates", icon: Users },
  { href: "/protected/admin/import", label: "Import", icon: Upload },
  { href: "/protected/admin/results", label: "Results", icon: BarChart3 },
  { href: "/protected/admin/settings", label: "Settings", icon: Settings },
];

interface AppSidebarProps {
  isAdmin: boolean;
  userName: string | null;
  position: string | null;
}

export function AppSidebar({ isAdmin, userName, position }: AppSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const renderLink = (link: (typeof memberLinks)[0]) => {
    const isActive =
      link.href === "/protected"
        ? pathname === link.href
        : pathname.startsWith(link.href);
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
        <link.icon size={18} className="shrink-0" />
        {!collapsed && <span>{link.label}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen border-r border-border bg-card flex flex-col transition-all duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        {!collapsed && (
          <Link href="/protected" className="font-bold text-lg tracking-tight">
            🌸 Bloom
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Member links */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {memberLinks.map(renderLink)}

        {/* Admin section */}
        {isAdmin && (
          <>
            <div className="pt-4 pb-1">
              <div
                className={cn(
                  "px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                  collapsed && "sr-only"
                )}
              >
                Admin
              </div>
            </div>
            {adminLinks.map(renderLink)}
          </>
        )}
      </nav>

      {/* User info footer */}
      <div className="border-t border-border p-4">
        {!collapsed ? (
          <div className="text-sm">
            <p className="font-medium truncate">{userName ?? "Board Member"}</p>
            {position && (
              <p className="text-xs text-muted-foreground truncate">
                {position}
              </p>
            )}
          </div>
        ) : (
          <div className="flex justify-center">
            <User size={18} className="text-muted-foreground" />
          </div>
        )}
      </div>
    </aside>
  );
}
