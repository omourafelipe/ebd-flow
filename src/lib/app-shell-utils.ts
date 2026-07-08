import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  CalendarCheck,
  BarChart3,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── Menu items (shared between Sidebar and BottomNav) ──────────────────────
export interface MenuItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const menuItems: MenuItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/classes", label: "Classes", icon: BookOpen },
  { to: "/alunos", label: "Pessoas", icon: Users },
  { to: "/cursos", label: "Cursos", icon: GraduationCap },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

// ── Utility helpers ────────────────────────────────────────────────────────

/** Generate 2-letter initials from a full name. */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/** Map an internal role code to a user-facing Portuguese label. */
export function getRoleLabel(role: string): string {
  if (role === "ADMIN") return "Administrador";
  if (role === "TEACHER") return "Professor";
  return "Aluno";
}

/** Current date formatted in pt-BR, e.g. "Segunda-feira, 7 de julho de 2026". */
export function getFormattedDate(): string {
  try {
    const today = new Date();
    const formatter = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const formatted = formatter.format(today);
    // Capitalize first letter (Intl returns lowercase weekday in pt-BR)
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch {
    return "Hoje";
  }
}
