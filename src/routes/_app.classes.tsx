import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEbdStore, addClasse, updateClasse, deleteClasse, Classe } from "@/lib/store";
import { useState, useEffect } from "react";
import { z } from "zod";
import {
  BookOpen,
  Plus,
  Clock,
  User,
  MoreVertical,
  Edit2,
  Trash2,
  AlertTriangle,
  FolderOpen,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// Schema for URL search params to open add modal directly
const searchSchema = z.object({
  nova: z.string().optional(),
});

export const Route = createFileRoute("/_app/classes")({
  validateSearch: (search) => searchSchema.parse(search),
  component: ClassesPage,
});

function ClassesPage() {
  const store = useEbdStore();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClasse, setEditingClasse] = useState<Classe | null>(null);
  const [deletingClasseId, setDeletingClasseId] = useState<string | null>(null);

  // Form states
  const [nome, setNome] = useState("");
  const [professor, setProfessor] = useState("");
  const [horario, setHorario] = useState("09:00");
  const [descricao, setDescricao] = useState("");
  const [status, setStatus] = useState<"ATIVA" | "INATIVA">("ATIVA");

  // Real-time validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-open modal if ?nova=true is in URL
  useEffect(() => {
    if (search.nova === "true") {
      handleOpenCreate();
      // Clean query params so modal doesn't re-open on refresh
      navigate({ search: {} });
    }
  }, [search.nova]);

  const handleOpenCreate = () => {
    setEditingClasse(null);
    setNome("");
    setProfessor("");
    setHorario("09:00");
    setDescricao("");
    setStatus("ATIVA");
    setErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (c: Classe) => {
    setEditingClasse(c);
    setNome(c.nome);
    setProfessor(c.professor);
    setHorario(c.horario);
    setDescricao(c.descricao || "");
    setStatus(c.status);
    setErrors({});
    setIsFormOpen(true);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!nome.trim()) newErrors.nome = "O nome da classe é obrigatório.";
    if (!professor.trim()) newErrors.professor = "O nome do professor é obrigatório.";
    if (!horario.trim()) newErrors.horario = "O horário é obrigatório.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Por favor, preencha os campos obrigatórios.");
      return;
    }

    try {
      if (editingClasse) {
        updateClasse({
          id: editingClasse.id,
          nome,
          professor,
          horario,
          descricao,
          status,
          departamento: editingClasse.departamento,
          faixa_etaria: editingClasse.faixa_etaria,
          professor_auxiliar: editingClasse.professor_auxiliar,
          sala: editingClasse.sala,
          cor: editingClasse.cor,
          observacoes: editingClasse.observacoes,
        });
        toast.success("Classe atualizada com sucesso!");
      } else {
        addClasse({
          nome,
          professor,
          horario,
          descricao,
          status,
          departamento: "Geral",
          faixa_etaria: null,
          professor_auxiliar: null,
          sala: null,
          cor: "emerald",
          observacoes: null,
        });
        toast.success("Classe cadastrada com sucesso!");
      }
      setIsFormOpen(false);
    } catch {
      toast.error("Ocorreu um erro ao salvar a classe.");
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingClasseId) {
      try {
        deleteClasse(deletingClasseId);
        toast.success("Classe excluída com sucesso.");
        setDeletingClasseId(null);
      } catch (error: any) {
        toast.error(error.message || "Erro ao excluir a classe.");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">Classes</h3>
          <p className="text-xs text-slate-500 font-medium">Cadastre e gerencie as turmas da Escola Bíblica.</p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 h-9 px-4 cursor-pointer shadow-soft"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Classe</span>
        </Button>
      </div>

      {/* Classes List */}
      {store.classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-soft border border-slate-100 text-center animate-fade-in py-16">
          <div className="h-14 w-14 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
            <FolderOpen className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Nenhuma classe cadastrada</h4>
          <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed font-medium">
            Para começar a registrar presenças, crie a primeira classe da EBD.
          </p>
          <Button
            onClick={handleOpenCreate}
            className="mt-5 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-xl px-5 py-2 cursor-pointer shadow-soft"
          >
            Cadastrar Primeira Classe
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {store.classes.map((c) => {
            const countAlunos = store.alunos.filter((a) => a.classe_id === c.id).length;
            const isAtiva = c.status === "ATIVA";

            return (
              <Card
                key={c.id}
                className="border-none shadow-soft bg-white rounded-2xl flex flex-col justify-between hover:shadow-elevated transition-shadow duration-200"
              >
                <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                  <div className="min-w-0 pr-4">
                    <CardTitle className="text-sm font-bold text-slate-800 tracking-tight leading-snug truncate">
                      {c.nome}
                    </CardTitle>
                    <CardDescription className="text-[11px] font-medium text-slate-400 mt-0.5">
                      {countAlunos} {countAlunos === 1 ? "aluno matriculado" : "alunos matriculados"}
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.75 rounded-full ${
                        isAtiva ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {c.status}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer"
                        >
                          <MoreVertical className="h-4.5 w-4.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl border border-slate-100 shadow-elevated">
                        <DropdownMenuItem
                          onClick={() => handleOpenEdit(c)}
                          className="text-slate-600 text-xs font-medium focus:bg-slate-50 cursor-pointer py-2 rounded-lg flex items-center gap-2"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingClasseId(c.id)}
                          className="text-red-600 text-xs font-medium focus:bg-red-50/50 cursor-pointer py-2 rounded-lg flex items-center gap-2"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-2 flex-1 flex flex-col justify-between">
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2 mb-4 flex-1">
                    {c.descricao || "Sem descrição disponível para esta classe."}
                  </p>

                  <div className="border-t border-slate-50 pt-3 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-slate-300" />
                      <span className="truncate max-w-[120px]">{c.professor}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-300" />
                      <span>{c.horario}h</span>
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* FORM DIALOG (NEW/EDIT) */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-none shadow-elevated">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800 tracking-tight">
              {editingClasse ? "Editar Classe" : "Nova Classe"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 font-medium">
              Preencha as informações necessárias para cadastrar ou editar a turma.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="nome" className="text-xs font-semibold text-slate-600">
                Nome da Classe *
              </Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Jovens - Metanoia"
                className={`rounded-xl border-slate-200 text-xs py-5 ${errors.nome ? "border-red-400 focus-visible:ring-red-400" : ""}`}
              />
              {errors.nome && <p className="text-[10px] text-red-500 font-semibold">{errors.nome}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="professor" className="text-xs font-semibold text-slate-600">
                Professor Responsável *
              </Label>
              <Input
                id="professor"
                value={professor}
                onChange={(e) => setProfessor(e.target.value)}
                placeholder="Ex: Ev. Felipe Souza"
                className={`rounded-xl border-slate-200 text-xs py-5 ${errors.professor ? "border-red-400 focus-visible:ring-red-400" : ""}`}
              />
              {errors.professor && (
                <p className="text-[10px] text-red-500 font-semibold">{errors.professor}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="horario" className="text-xs font-semibold text-slate-600">
                  Horário de Início *
                </Label>
                <Input
                  id="horario"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  placeholder="Ex: 09:00"
                  className={`rounded-xl border-slate-200 text-xs py-5 ${errors.horario ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                />
                {errors.horario && (
                  <p className="text-[10px] text-red-500 font-semibold">{errors.horario}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-semibold text-slate-600">
                  Status
                </Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "ATIVA" | "INATIVA")}
                  className="w-full rounded-xl border border-slate-200 bg-white text-xs px-3 h-10 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="ATIVA">Ativa</option>
                  <option value="INATIVA">Inativa</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descricao" className="text-xs font-semibold text-slate-600">
                Descrição / Observações
              </Label>
              <textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Uma breve descrição sobre o objetivo ou público da classe..."
                rows={3}
                className="w-full rounded-xl border border-slate-200 text-xs p-3 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>

            <DialogFooter className="pt-4 flex flex-row items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsFormOpen(false)}
                className="rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer h-9 px-4"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl text-xs cursor-pointer h-9 px-4"
              >
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM DIALOG */}
      <AlertDialog open={deletingClasseId !== null} onOpenChange={(open) => !open && setDeletingClasseId(null)}>
        <AlertDialogContent className="rounded-2xl border-none shadow-elevated sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Excluir Classe?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-400 leading-relaxed font-medium">
              Esta ação é permanente. Ao excluir a classe, todos os alunos nela matriculados terão seu status atualizado para "Inativo" e serão desvinculados. As chamadas desta classe não serão apagadas, mas perderão a referência.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row items-center justify-end gap-2 pt-2">
            <AlertDialogCancel className="rounded-xl text-xs font-semibold border-slate-100 hover:bg-slate-50 text-slate-600 mt-0 cursor-pointer h-9 px-4">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white cursor-pointer h-9 px-4"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
