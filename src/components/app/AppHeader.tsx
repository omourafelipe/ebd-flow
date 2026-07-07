import { BookOpen, LogOut } from "lucide-react";
import { getInitials, getFormattedDate } from "@/lib/app-shell-utils";

interface AppHeaderProps {
  churchName: string;
  userName: string;
  onLogout: () => void;
}

export function AppHeader({ churchName, userName, onLogout }: AppHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 shadow-sm sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Mobile Logo Indicator */}
        <div className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft">
          <BookOpen className="h-4.5 w-4.5" strokeWidth={2.25} />
        </div>
        <div className="leading-tight">
          <h2 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight truncate max-w-[150px] sm:max-w-none">
            {churchName}
          </h2>
          <p className="text-[11px] text-slate-400 font-medium">Escola Bíblica Dominical</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 hidden sm:inline-block">
          {getFormattedDate()}
        </span>
        <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs border border-slate-200">
          {getInitials(userName)}
        </div>
        <button
          onClick={onLogout}
          title="Sair"
          aria-label="Sair do sistema"
          className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
