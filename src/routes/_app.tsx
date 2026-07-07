import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEbdStore, syncFromSupabase } from "@/lib/store";
import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app/AppSidebar";
import { AppBottomNav } from "@/components/app/AppBottomNav";
import { AppHeader } from "@/components/app/AppHeader";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    const isDemo =
      typeof window !== "undefined" &&
      window.localStorage.getItem("ebd_demo_mode") === "true";

    // RF01 — Protect route: if no demo mode, require a valid Supabase session.
    // When Supabase is not configured at all, treat as demo-only environment:
    // allow access only if demo flag is set, otherwise redirect.
    if (!isDemo) {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          throw redirect({ to: "/login" });
        }
      } else {
        // Supabase not configured and not in demo mode → no access
        throw redirect({ to: "/login" });
      }
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const store = useEbdStore();
  const navigate = useNavigate();

  const [userName, setUserName] = useState("Administrador");
  const [userRole, setUserRole] = useState("ADMIN");

  useEffect(() => {
    // RF07 — Sync data in the background (non-blocking per RNF02).
    // Fire-and-forget: don't await — let the UI render immediately.
    syncFromSupabase().catch((err) =>
      console.error("Background sync failed:", err),
    );

    // RF06 — Load user profile (independent of sync).
    async function loadProfile() {
      if (isSupabaseConfigured && supabase) {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("nome, role")
              .eq("id", session.user.id)
              .maybeSingle();

            if (profile) {
              setUserName(profile.nome);
              setUserRole(profile.role);
            } else {
              // Fallback to session metadata
              setUserName(
                session.user.user_metadata?.nome ||
                  session.user.user_metadata?.name ||
                  "Usuário",
              );
              setUserRole(session.user.user_metadata?.role || "STUDENT");
            }
          }
        } catch (e) {
          // RNF05 — Graceful degradation: keep default values on error
          console.error("Error loading profile", e);
        }
      } else {
        // No Supabase configured — use defaults
        setUserName("Administrador");
        setUserRole("ADMIN");
      }
    }
    loadProfile();
  }, []);

  // RF08 — Logout
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

  return (
    <div className="min-h-screen bg-slate-50 text-foreground flex flex-col md:flex-row font-sans">
      {/* RF10 — Global Toaster */}
      <Toaster position="top-center" closeButton />

      {/* RF03 — Desktop sidebar */}
      <AppSidebar userName={userName} userRole={userRole} onLogout={handleLogout} />

      {/* Main wrapper */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* RF05 — Header */}
        <AppHeader
          churchName={store.configuracoes.nome_igreja}
          userName={userName}
          onLogout={handleLogout}
        />

        {/* RF09 — Page content area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-6xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* RF04 — Mobile bottom navigation */}
      <AppBottomNav />
    </div>
  );
}
