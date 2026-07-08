import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_auth")({
  beforeLoad: async () => {
    // If Supabase is configured, check if we have an active session
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        throw redirect({ to: "/dashboard" });
      }
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-primary/20 mb-3 animate-pulse">
            <BookOpen className="h-6 w-6" strokeWidth={2.25} />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight leading-none">EBD Flow</h2>
          <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase mt-1">Gestão da Escola Bíblica</p>
        </div>

        {/* Auth Content */}
        <main className="animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
