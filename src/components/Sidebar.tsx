import { NavLink } from "react-router-dom";
import { Home, Users, Calendar, Stethoscope, FileText, DollarSign, BarChart3, ClipboardList, Building2 } from "lucide-react";

const allMenuItems = [
    { title: "Dashboard", url: "/", icon: Home },
    { title: "Admissions", url: "/patients", icon: Users },
    { title: "Appointments", url: "/appointments", icon: Calendar },
    { title: "Doctor Schedules", url: "/schedules", icon: ClipboardList },
    { title: "Doctors & Depts", url: "/doctors", icon: Stethoscope },
    { title: "Medical Records", url: "/records", icon: FileText },
    { title: "Billing", url: "/billing", icon: DollarSign },
    { title: "Reports", url: "/reports", icon: BarChart3 },
    { title: "Departments", url: "/departments", icon: Building2 },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-card border-r p-4 flex-col hidden lg:flex">
      <div className="mb-8">
        <h1 className="font-bold text-2xl">Srijoni HMS</h1>
      </div>
      <nav>
        <ul className="space-y-1">
          {allMenuItems.map((item) => (
            <li key={item.title}>
              <NavLink
                to={item.url}
                end={item.url === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary"
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}