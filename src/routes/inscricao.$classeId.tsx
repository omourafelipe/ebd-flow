import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { BookOpen, User, Calendar, Phone } from "lucide-react";

export const Route = createFileRoute("/inscricao/$classeId")({
  component: PublicRegistrationPage,
});

function generateUUID() {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function PublicRegistrationPage() {
  const { classeId } = Route.useParams();
  
  const [classeNome, setClasseNome] = useState<string>("Carregando...");
  const [loadingClasse, setLoadingClasse] = useState(true);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [sexo, setSexo] = useState<"MASCULINO" | "FEMININO" | "">("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadClasse() {
      if (!supabase) {
        setClasseNome("Modo Offline");
        setLoadingClasse(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("classes")
          .select("nome")
          .eq("id", classeId)
          .maybeSingle();

        if (error || !data) {
          setClasseNome("Classe não encontrada");
        } else {
          setClasseNome(data.nome);
        }
      } catch (e) {
        setClasseNome("Erro ao carregar");
      }
      setLoadingClasse(false);
    }
    loadClasse();
  }, [classeId]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!nome.trim()) newErrors.nome = "O nome é obrigatório.";
    if (!telefone.trim()) newErrors.telefone = "O telefone é obrigatório.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      if (!supabase) {
        toast.error("Servidor indisponível (Modo Demo).");
        setIsSubmitting(false);
        return;
      }

      const newId = generateUUID();
      const hoje = new Date().toISOString().split("T")[0];
      const observacoes = JSON.stringify({
        __metadata: { funcoes: ["Aluno"], endereco: null },
        observacoes: "Inscrito via link público"
      });

      const { error } = await supabase.from("alunos").insert({
        id: newId,
        classe_id: classeId,
        nome: nome.trim(),
        telefone: telefone.trim(),
        data_nascimento: dataNascimento || null,
        sexo: sexo || null,
        status: "ATIVO",
        data_ingresso: hoje,
        observacoes: observacoes
      });

      if (error) {
        console.error("Supabase Insert Error:", error);
        throw new Error(error.message);
      }

      // Tenta criar o histórico, ignora se falhar
      await supabase.from("historico_classes").insert({
        id: generateUUID(),
        aluno_id: newId,
        classe_origem_id: null,
        classe_destino_id: classeId,
        tipo: "INGRESSO",
        motivo: "Inscrição via link público.",
        data_evento: new Date().toISOString()
      });

      setIsSuccess(true);
      toast.success("Inscrição realizada com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao enviar a inscrição. Verifique as permissões do sistema.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-none shadow-elevated rounded-2xl overflow-hidden text-center p-8">
          <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Inscrição Concluída!</h2>
          <p className="text-slate-500 font-medium text-sm">
            Sua inscrição na classe <strong className="text-slate-700">{classeNome}</strong> foi recebida com sucesso.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-elevated rounded-2xl overflow-hidden">
        <div className="h-2 bg-primary w-full"></div>
        <CardHeader className="text-center pb-2 pt-8">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800 tracking-tight">Ficha de Inscrição</CardTitle>
          <CardDescription className="text-sm font-medium text-slate-500 mt-2">
            Preencha seus dados para se matricular na classe:
          </CardDescription>
          {loadingClasse ? (
            <div className="mt-4 h-8 w-3/4 mx-auto bg-slate-100 rounded-lg animate-pulse"></div>
          ) : (
            <div className="mt-4 inline-flex items-center gap-2 bg-primary/5 text-primary px-4 py-2 rounded-xl font-bold border border-primary/10">
              {classeNome}
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Nome Completo *
              </Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: João da Silva"
                className={`rounded-xl h-11 text-sm bg-slate-50/50 ${errors.nome ? "border-red-400 focus-visible:ring-red-400" : ""}`}
              />
              {errors.nome && <p className="text-[10px] text-red-500 font-semibold">{errors.nome}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Celular / WhatsApp *
              </Label>
              <Input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 90000-0000"
                className={`rounded-xl h-11 text-sm bg-slate-50/50 ${errors.telefone ? "border-red-400 focus-visible:ring-red-400" : ""}`}
              />
              {errors.telefone && <p className="text-[10px] text-red-500 font-semibold">{errors.telefone}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Nascimento
                </Label>
                <Input
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className="rounded-xl h-11 text-sm bg-slate-50/50"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Sexo</Label>
                <select
                  value={sexo}
                  onChange={(e) => setSexo(e.target.value as any)}
                  className="w-full rounded-xl border border-input bg-slate-50/50 text-sm px-3 h-11 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Selecione</option>
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMININO">Feminino</option>
                </select>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || loadingClasse}
              className="w-full h-12 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl shadow-soft mt-6 text-sm"
            >
              {isSubmitting ? "Enviando..." : "Confirmar Inscrição"}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <p className="mt-8 text-xs text-slate-400 font-medium">
        Desenvolvido com EBD Gestão
      </p>
    </div>
  );
}
