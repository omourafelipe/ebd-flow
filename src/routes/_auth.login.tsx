import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Play } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_auth/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("ebd_demo_mode");
        }
        toast.success("Login efetuado com sucesso!");
        navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      toast.error("Erro inesperado durante o login.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ebd_demo_mode", "true");
    }
    toast.success("Acessando painel no modo de demonstração local.");
    navigate({ to: "/dashboard" });
  };

  return (
    <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-elevated rounded-2xl overflow-hidden">
      <CardHeader className="space-y-1 p-6">
        <CardTitle className="text-lg font-bold text-white tracking-tight">Acesse sua conta</CardTitle>
        <CardDescription className="text-xs text-slate-400 font-medium">
          Entre com as credenciais da sua Escola Bíblica.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-4">
        <form onSubmit={handleLogin} className="space-y-3.5">
          {/* Email field */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-slate-300">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="email"
                type="email"
                placeholder="exemplo@igreja.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-slate-950/40 border-slate-800 focus:border-primary/50 text-xs text-white rounded-xl py-5"
                required
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-300">Senha</Label>
              <Link
                to="/login" // For demo fallback, just reload/mock
                className="text-[10px] text-primary hover:underline font-bold"
                onClick={() => toast.info("Funcionalidade de recuperação será configurada com o servidor SMTP do Supabase.")}
              >
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Sua senha secreta"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-slate-950/40 border-slate-800 focus:border-primary/50 text-xs text-white rounded-xl py-5"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 h-10 mt-2 cursor-pointer shadow-soft"
          >
            {loading ? "Entrando..." : "Entrar"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
            <span className="bg-slate-900 px-2 text-slate-500">ou</span>
          </div>
        </div>

        {/* Local Demo Fallback Button */}
        <Button
          onClick={handleDemoLogin}
          variant="outline"
          className="w-full border-slate-800 hover:bg-slate-850 hover:text-white bg-slate-950/20 text-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 h-10 cursor-pointer"
        >
          <Play className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500" />
          Modo de Demonstração (Local)
        </Button>
      </CardContent>
      <CardFooter className="flex justify-center p-6 pt-0 border-t border-slate-850 bg-slate-950/20">
        <p className="text-[11px] text-slate-400 font-medium mt-4">
          Não tem uma conta?{" "}
          <Link to="/cadastro" className="text-primary hover:underline font-bold">
            Cadastre-se
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
