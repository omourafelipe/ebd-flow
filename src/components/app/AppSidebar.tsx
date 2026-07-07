import { Link, useLocation } from "@tanstack/react-router";
import { BookOpen, LogOut } from "lucide-react";
import { menuItems, getInitials, getRoleLabel } from "@/lib/app-shell-utils";

interface AppSidebarProps {
  userName: string;
  userRole: string;
  onLogout: () => void;
}

export function AppSidebar({ userName, userRole, onLogout }: AppSidebarProps) {
  const location = useLocation();

  return (
    <aside className="hidden md:flex md:w-64 bg-primary text-primary-foreground flex-shrink-0 flex-col border-r border-primary/20">
      {/* Sidebar Header */}
      <div className="h-16 px-6 border-b border-primary/10 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground text-primary shadow-soft">
          <BookOpen className="h-5 w-5" strokeWidth={2.25} />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white leading-tight">EBD Flow</h1>
          <p className="text-[10px] text-primary-foreground/75 font-medium tracking-wider uppercase">Gestão Dominical</p>
        </div>
      </div>

      {/* Sidebar Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" role="navigation" aria-label="Menu principal">
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-white/10 text-white shadow-soft font-semibold"
                  : "text-primary-foreground/75 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon
                className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-105 ${
                  isActive ? "text-white" : "text-primary-foreground/60"
                }`}
                strokeWidth={2}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-primary/10 bg-primary/20 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-full bg-primary-foreground/20 text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
            {getInitials(userName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{userName}</p>
            <p className="text-[10px] text-primary-foreground/75 truncate">{getRoleLabel(userRole)}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          title="Sair"
          aria-label="Sair do sistema"
          className="text-primary-foreground/60 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer flex-shrink-0"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
