import { createFileRoute, Outlet, Link, useLocation, redirect, useNavigate } from "@tanstack/react-router";
import { useEbdStore, syncFromSupabase } from "@/lib/store";
import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  CalendarCheck,
  BarChart3,
  Settings,
  Menu,
  LogOut,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    if (isSupabaseConfigured && supabase) {
      const isDemo = typeof window !== "undefined" && window.localStorage.getItem("ebd_demo_mode") === "true";
      if (!isDemo) {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          throw redirect({ to: "/login" });
        }
      }
    }
  },
  component: AppLayout,
});

const menuItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/classes", label: "Classes", icon: BookOpen },
  { to: "/alunos", label: "Alunos", icon: Users },
  { to: "/cursos", label: "Cursos", icon: GraduationCap },
  { to: "/aulas", label: "Aulas", icon: CalendarCheck },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

function AppLayout() {
  const store = useEbdStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [userName, setUserName] = useState("Administrador");
  const [userRole, setUserRole] = useState("ADMIN");

  useEffect(() => {
    async function loadProfile() {
      // Sync from database first
      await syncFromSupabase();

      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: profile } = await supabase.from("profiles")
              .select("nome, role")
              .eq("id", session.user.id)
              .maybeSingle();
            
            if (profile) {
              setUserName(profile.nome);
              setUserRole(profile.role);
            } else {
              setUserName(session.user.user_metadata?.nome || session.user.user_metadata?.name || "Usuário");
              setUserRole(session.user.user_metadata?.role || "STUDENT");
            }
          }
        } catch (e) {
          console.error("Error loading profile", e);
        }
      } else {
        setUserName("Administrador");
        setUserRole("ADMIN");
      }
    }
    loadProfile();
  }, []);

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("ebd_demo_mode");
    }
    toast.success("Você saiu do sistema.");
    navigate({ to: "/login" });
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getRoleLabel = (role: string) => {
    if (role === "ADMIN") return "Administrador";
    if (role === "TEACHER") return "Professor";
    return "Aluno";
  };

  // Get current formatted date in Portuguese
  const getFormattedDate = () => {
    try {
      const today = new Date();
      // Format: Segunda-feira, 7 de julho de 2026
      const formatter = new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const formatted = formatter.format(today);
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch {
      return "Hoje";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-foreground flex flex-col md:flex-row font-sans">
      <Toaster position="top-center" closeButton />

      {/* DESKTOP SIDEBAR */}
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
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
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
            onClick={handleLogout}
            title="Sair"
            className="text-primary-foreground/60 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer flex-shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* MAIN WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* HEADER BAR */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile Logo Indicator */}
            <div className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft">
              <BookOpen className="h-4.5 w-4.5" strokeWidth={2.25} />
            </div>
            <div className="leading-tight">
              <h2 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight truncate max-w-[150px] sm:max-w-none">
                {store.configuracoes.nome_igreja}
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
              onClick={handleLogout}
              title="Sair"
              className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-6xl w-full mx-auto animate-fade-in">
          {/* Outlet is where the child route components will render */}
          <Outlet />
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-100 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] flex items-center justify-around px-1 z-40">
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all relative ${
                isActive ? "text-primary font-semibold" : "text-slate-400 hover:text-slate-600"
              }`}
              style={{ minWidth: "44px", minHeight: "44px" }}
            >
              {/* Highlight bar above active item */}
              {isActive && (
                <div className="absolute top-0 left-1/4 right-1/4 h-0.75 bg-primary rounded-full" />
              )}
              <item.icon
                className={`h-5 w-5 mb-0.5 transition-transform duration-200 ${
                  isActive ? "text-primary scale-110" : "text-slate-400"
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-[9px] tracking-tight truncate max-w-full font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
