import { createFileRoute } from "@tanstack/react-router";
import { useEbdStore, addCurso, updateCurso, deleteCurso, Curso } from "@/lib/store";
import { useState } from "react";
import {
  GraduationCap,
  Plus,
  User,
  MoreVertical,
  Edit2,
  Trash2,
  AlertTriangle,
  Clock,
  Calendar,
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

export const Route = createFileRoute("/_app/cursos")({
  component: CursosPage,
});

function CursosPage() {
  const store = useEbdStore();

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [deletingCursoId, setDeletingCursoId] = useState<string | null>(null);

  // Form states
  const [nome, setNome] = useState("");
  const [professor, setProfessor] = useState("");
  const [status, setStatus] = useState<"PLANEJADO" | "EM_ANDAMENTO" | "CONCLUIDO" | "CANCELADO">("PLANEJADO");
  const [descricao, setDescricao] = useState("");
  const [cargaHoraria, setCargaHoraria] = useState<number | "">("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleOpenCreate = () => {
    setEditingCurso(null);
    setNome("");
    setProfessor("");
    setStatus("PLANEJADO");
    setDescricao("");
    setCargaHoraria("");
    setDataInicio("");
    setDataFim("");
    setErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (c: Curso) => {
    setEditingCurso(c);
    setNome(c.nome);
    setProfessor(c.professor || "");
    setStatus(c.status);
    setDescricao(c.descricao || "");
    setCargaHoraria(c.carga_horaria || "");
    setDataInicio(c.data_inicio || "");
    setDataFim(c.data_fim || "");
    setErrors({});
    setIsFormOpen(true);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!nome.trim()) newErrors.nome = "O nome do curso é obrigatório.";
    if (!professor.trim()) newErrors.professor = "O nome do professor é obrigatório.";
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
      const payload = {
        nome,
        professor: professor || null,
        status,
        descricao: descricao || null,
        carga_horaria: cargaHoraria === "" ? null : Number(cargaHoraria),
        data_inicio: dataInicio || null,
        data_fim: dataFim || null,
      };

      if (editingCurso) {
        updateCurso({
          id: editingCurso.id,
          ...payload,
        });
        toast.success("Curso atualizado com sucesso!");
      } else {
        addCurso(payload);
        toast.success("Curso cadastrado com sucesso!");
      }
      setIsFormOpen(false);
    } catch {
      toast.error("Ocorreu um erro ao salvar o curso.");
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingCursoId) {
      try {
        deleteCurso(deletingCursoId);
        toast.success("Curso excluído com sucesso.");
        setDeletingCursoId(null);
      } catch (error: any) {
        toast.error(error.message || "Erro ao excluir o curso.");
      }
    }
  };

  const getStatusBadgeStyle = (s: Curso["status"]) => {
    switch (s) {
      case "EM_ANDAMENTO":
        return "bg-emerald-50 text-emerald-600";
      case "PLANEJADO":
        return "bg-amber-50 text-amber-600";
      case "CONCLUIDO":
        return "bg-slate-100 text-slate-600";
      case "CANCELADO":
        return "bg-red-50 text-red-600";
      default:
        return "bg-slate-50 text-slate-500";
    }
  };

  const getStatusLabel = (s: Curso["status"]) => {
    switch (s) {
      case "EM_ANDAMENTO":
        return "Em Andamento";
      case "PLANEJADO":
        return "Planejado";
      case "CONCLUIDO":
        return "Concluído";
      case "CANCELADO":
        return "Cancelado";
      default:
        return s;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">Cursos</h3>
          <p className="text-xs text-slate-500 font-medium">Gestão de cursos de formação e capacitação teológica.</p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 h-9 px-4 cursor-pointer shadow-soft"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Curso</span>
        </Button>
      </div>

      {/* Cursos List */}
      {store.cursos.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-soft border border-slate-100 text-center py-16 animate-fade-in">
          <div className="h-14 w-14 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Nenhum curso cadastrado</h4>
          <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed font-medium">
            Registre os cursos bíblicos e treinamentos disponíveis para a liderança e alunos.
          </p>
          <Button
            onClick={handleOpenCreate}
            className="mt-5 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-xl px-5 py-2 cursor-pointer shadow-soft"
          >
            Cadastrar Primeiro Curso
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {store.cursos.map((c) => {
            const countAlunos = store.curso_aluno.filter((ca) => ca.curso_id === c.id).length;

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
                    <CardDescription className="text-[10px] font-semibold text-slate-400 mt-1 flex items-center gap-1">
                      <User className="h-3 w-3 text-slate-300" />
                      <span className="truncate max-w-[150px]">{c.professor || "Sem professor"}</span>
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.75 rounded-full ${getStatusBadgeStyle(c.status)}`}
                    >
                      {getStatusLabel(c.status)}
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
                          onClick={() => setDeletingCursoId(c.id)}
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
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-3 mb-4 flex-1">
                    {c.descricao || "Sem descrição disponível para este curso."}
                  </p>

                  <div className="border-t border-slate-50 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-300" />
                      <span>{c.carga_horaria ? `${c.carga_horaria}h` : "N/D"}</span>
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-primary lowercase tracking-normal font-semibold">
                      {countAlunos} {countAlunos === 1 ? "matriculado" : "matriculados"}
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
              {editingCurso ? "Editar Curso" : "Novo Curso"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 font-medium">
              Preencha os detalhes do curso bíblico ou de capacitação.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="nome" className="text-xs font-semibold text-slate-600">
                Nome do Curso *
              </Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Teologia Sistemática"
                className={`rounded-xl border-slate-200 text-xs py-5 ${errors.nome ? "border-red-400 focus-visible:ring-red-400" : ""}`}
              />
              {errors.nome && <p className="text-[10px] text-red-500 font-semibold">{errors.nome}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="professor" className="text-xs font-semibold text-slate-600">
                  Professor / Instrutor *
                </Label>
                <Input
                  id="professor"
                  value={professor}
                  onChange={(e) => setProfessor(e.target.value)}
                  placeholder="Ex: Pr. Marcos Silva"
                  className={`rounded-xl border-slate-200 text-xs py-5 ${errors.professor ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                />
                {errors.professor && (
                  <p className="text-[10px] text-red-500 font-semibold">{errors.professor}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-semibold text-slate-600">
                  Status
                </Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-white text-xs px-3 h-10 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="PLANEJADO">Planejado</option>
                  <option value="EM_ANDAMENTO">Em Andamento</option>
                  <option value="CONCLUIDO">Concluído</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="carga" className="text-xs font-semibold text-slate-600">
                  Carga Horária (h)
                </Label>
                <Input
                  id="carga"
                  type="number"
                  value={cargaHoraria}
                  onChange={(e) => setCargaHoraria(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Ex: 40"
                  className="rounded-xl border-slate-200 text-xs py-5"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inicio" className="text-xs font-semibold text-slate-600">
                  Data Início
                </Label>
                <Input
                  id="inicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="rounded-xl border-slate-200 text-xs py-5"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fim" className="text-xs font-semibold text-slate-600">
                  Data Fim
                </Label>
                <Input
                  id="fim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="rounded-xl border-slate-200 text-xs py-5"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descricao" className="text-xs font-semibold text-slate-600">
                Descrição do Curso
              </Label>
              <textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Detalhes sobre a grade curricular, pré-requisitos, etc..."
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

      {/* DELETE CONFIRM ALERT DIALOG */}
      <AlertDialog open={deletingCursoId !== null} onOpenChange={(open) => !open && setDeletingCursoId(null)}>
        <AlertDialogContent className="rounded-2xl border-none shadow-elevated sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Excluir Curso?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-400 leading-relaxed font-medium">
              Esta ação é permanente e apagará as informações deste curso. Cursos com alunos matriculados ativos não podem ser excluídos fisicamente (Regras de Integridade).
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
