import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Activity,
  Users,
  Calendar,
  FileText,
  DollarSign,
  Settings,
  BarChart3,
  Stethoscope,
  Menu,
  X,
  Building2,
  ClipboardList,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Activity },
  { title: "Appointment Booking", url: "/appointments", icon: Calendar },
  { title: "Doctor Schedules", url: "/schedules", icon: ClipboardList },
  { title: "Patient Records", url: "/patients", icon: Users },
  { title: "Medical Records", url: "/records", icon: FileText },
  { title: "Billing", url: "/billing", icon: DollarSign },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Departments", url: "/departments", icon: Building2 },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div
      className={cn(
        "bg-card border-r border-border transition-all duration-300 flex flex-col shadow-soft",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-lg text-foreground">Srijoni</span>
              <p className="text-xs text-muted-foreground">Healing Home</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="hover:bg-secondary"
        >
          {collapsed ? (
            <Menu className="h-4 w-4" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.title}>
              <NavLink
                to={item.url}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
                  isActive(item.url)
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className={cn(
          "flex items-center gap-3",
          collapsed ? "justify-center" : ""
        )}>
          <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
            <span className="text-xs font-semibold text-accent-foreground">
              Dr
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                Dr. Admin
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Administrator
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}