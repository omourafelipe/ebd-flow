import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Lock, Mail, User, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_auth/cadastro")({
  component: CadastroPage,
});

function CadastroPage() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "TEACHER" | "STUDENT">("ADMIN");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !password.trim()) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            nome: nome.trim(),
            role: role,
          },
        },
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Conta criada! Confirme seu e-mail ou faça login.");
        navigate({ to: "/login" });
      }
    } catch (err: any) {
      toast.error("Erro inesperado durante o cadastro.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-elevated rounded-2xl overflow-hidden">
      <CardHeader className="space-y-1 p-6">
        <CardTitle className="text-lg font-bold text-white tracking-tight">Criar Conta</CardTitle>
        <CardDescription className="text-xs text-slate-400 font-medium">
          Cadastre sua igreja ou entre como professor / aluno.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <form onSubmit={handleCadastro} className="space-y-3.5">
          {/* Nome completo */}
          <div className="space-y-1.5">
            <Label htmlFor="nome" className="text-xs font-semibold text-slate-300">Nome Completo</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="nome"
                type="text"
                placeholder="Seu nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="pl-10 bg-slate-950/40 border-slate-800 focus:border-primary/50 text-xs text-white rounded-xl py-5"
                required
              />
            </div>
          </div>

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
            <Label htmlFor="password" className="text-xs font-semibold text-slate-300">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
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

          {/* Role selection */}
          <div className="space-y-1.5">
            <Label htmlFor="role" className="text-xs font-semibold text-slate-300">Perfil de Acesso</Label>
            <Select value={role} onValueChange={(val: any) => setRole(val)}>
              <SelectTrigger className="bg-slate-950/40 border-slate-800 focus:border-primary/50 text-xs text-white rounded-xl py-5">
                <SelectValue placeholder="Selecione o perfil" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-white rounded-xl">
                <SelectItem value="ADMIN" className="text-xs focus:bg-primary focus:text-white cursor-pointer rounded-lg">Administrador (Gestão Geral)</SelectItem>
                <SelectItem value="TEACHER" className="text-xs focus:bg-primary focus:text-white cursor-pointer rounded-lg">Professor (Gestão de Turmas)</SelectItem>
                <SelectItem value="STUDENT" className="text-xs focus:bg-primary focus:text-white cursor-pointer rounded-lg">Aluno (Frequência e Cursos)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 h-10 mt-2 cursor-pointer shadow-soft"
          >
            {loading ? "Cadastrando..." : "Cadastrar"}
            {!loading && <UserPlus className="h-4.5 w-4.5" />}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center p-6 pt-0 border-t border-slate-850 bg-slate-950/20">
        <p className="text-[11px] text-slate-400 font-medium mt-4">
          Já possui uma conta?{" "}
          <Link to="/login" className="text-primary hover:underline font-bold">
            Faça Login
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
