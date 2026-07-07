import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  useEbdStore,
  addAluno,
  updateAluno,
  deleteAluno,
  Aluno,
  Classe,
  Aula,
  HistoricoClasse,
} from "@/lib/store";
import { useState, useEffect } from "react";
import { z } from "zod";
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  Phone,
  Calendar,
  BookOpen,
  Check,
  X,
  History,
  Book,
  UserCheck,
  Mail,
  User,
  ArrowRightLeft,
  Sparkles,
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
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const searchSchema = z.object({
  novo: z.string().optional(),
});

export const Route = createFileRoute("/_app/alunos")({
  validateSearch: (search) => searchSchema.parse(search),
  component: AlunosPage,
});

function AlunosPage() {
  const store = useEbdStore();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  // Dialog & Sheet States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [deletingAlunoId, setDeletingAlunoId] = useState<string | null>(null);

  // Filters State
  const [searchText, setSearchText] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Form State
  const [nome, setNome] = useState("");
  const [status, setStatus] = useState<"ATIVO" | "VISITANTE" | "INATIVO">("ATIVO");
  const [classeId, setClasseId] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [sexo, setSexo] = useState<"MASCULINO" | "FEMININO" | "">("");
  const [email, setEmail] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-open modal if ?novo=true in URL
  useEffect(() => {
    if (search.novo === "true") {
      handleOpenCreate();
      navigate({ search: {} });
    }
  }, [search.novo]);

  // Keep selectedAluno in sync when store updates (e.g. status changes, classes change)
  useEffect(() => {
    if (selectedAluno) {
      const updated = store.alunos.find((a) => a.id === selectedAluno.id);
      if (updated) {
        setSelectedAluno(updated);
      }
    }
  }, [store.alunos, selectedAluno]);

  const handleOpenCreate = () => {
    setEditingAluno(null);
    setNome("");
    setStatus("ATIVO");
    // Default to first active class if available
    const activeClasses = store.classes.filter((c) => c.status === "ATIVA");
    setClasseId(activeClasses.length > 0 ? activeClasses[0].id : "");
    setDataNascimento("");
    setTelefone("");
    setSexo("");
    setEmail("");
    setErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (a: Aluno) => {
    setEditingAluno(a);
    setNome(a.nome);
    setStatus(a.status);
    setClasseId(a.classe_id);
    setDataNascimento(a.data_nascimento || "");
    setTelefone(a.telefone || "");
    setSexo(a.sexo || "");
    setEmail(a.email || "");
    setErrors({});
    setIsFormOpen(true);
    setIsHistoryOpen(false); // Close sheet to focus on modal
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!nome.trim()) newErrors.nome = "O nome do aluno é obrigatório.";
    if (!classeId) newErrors.classeId = "A classe é obrigatória.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }

    try {
      const payload = {
        nome,
        status,
        classe_id: classeId,
        data_nascimento: dataNascimento || null,
        telefone: telefone || null,
        sexo: (sexo as any) || null,
        email: email || null,
        data_ingresso: editingAluno ? editingAluno.data_ingresso : new Date().toISOString().split("T")[0],
        observacoes: editingAluno ? editingAluno.observacoes : null,
      };

      if (editingAluno) {
        updateAluno({
          id: editingAluno.id,
          ...payload,
        });
        toast.success("Aluno atualizado com sucesso!");
      } else {
        addAluno(payload);
        toast.success("Aluno cadastrado com sucesso!");
      }
      setIsFormOpen(false);
    } catch {
      toast.error("Ocorreu um erro ao salvar o aluno.");
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingAlunoId) {
      try {
        deleteAluno(deletingAlunoId);
        toast.success("Aluno removido do cadastro.");
        setDeletingAlunoId(null);
        setIsHistoryOpen(false);
      } catch (error: any) {
        toast.error(error.message || "Erro ao excluir o aluno.");
      }
    }
  };

  // Filter logic
  const filteredAlunos = store.alunos.filter((a) => {
    const matchSearch = a.nome.toLowerCase().includes(searchText.toLowerCase());
    const matchClass = filterClass === "all" || a.classe_id === filterClass;
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchClass && matchStatus;
  });

  // Calculate attendance & bible stats
  const getAlunoStats = (aluno: Aluno) => {
    const classAulas = store.aulas.filter((aula) => aula.classe_id === aluno.classe_id);
    const totalAulas = classAulas.length;

    if (totalAulas === 0) {
      return { attendanceRate: 0, bibleRate: 0, totalAulas: 0, presentCount: 0 };
    }

    let presentCount = 0;
    let bibleCount = 0;

    classAulas.forEach((aula) => {
      const pres = aula.presencas[aluno.id];
      if (pres) {
        if (pres.presente) presentCount++;
        if (pres.presente && pres.trouxe_biblia) bibleCount++;
      }
    });

    const attendanceRate = Math.round((presentCount / totalAulas) * 100);
    const bibleRate = presentCount > 0 ? Math.round((bibleCount / presentCount) * 100) : 0;

    return {
      attendanceRate,
      bibleRate,
      totalAulas,
      presentCount,
    };
  };

  // Get attendance timeline
  const getAlunoTimeline = (aluno: Aluno) => {
    const classAulas = store.aulas
      .filter((aula) => aula.classe_id === aluno.classe_id)
      .sort((a, b) => new Date(b.data_aula).getTime() - new Date(a.data_aula).getTime());

    return classAulas.map((aula) => {
      const pres = aula.presencas[aluno.id];
      return {
        id: aula.id,
        data: aula.data_aula.split("-").reverse().join("/"),
        tema: aula.tema,
        presente: pres ? pres.presente : false,
        bible: pres ? pres.trouxe_biblia : false,
      };
    });
  };

  // Get class transfers/status changes log
  const getAlunoClassHistory = (alunoId: string) => {
    return store.historico_classes
      .filter((h) => h.aluno_id === alunoId)
      .sort((a, b) => new Date(b.data_evento).getTime() - new Date(a.data_evento).getTime());
  };

  // Status colors
  const getStatusColor = (s: "ATIVO" | "INATIVO" | "VISITANTE") => {
    switch (s) {
      case "ATIVO":
        return "bg-emerald-50 text-emerald-600";
      case "VISITANTE":
        return "bg-blue-50 text-blue-600";
      case "INATIVO":
        return "bg-slate-100 text-slate-500";
      default:
        return "bg-slate-50 text-slate-500";
    }
  };

  return (
    <div className="space-y-6 relative min-h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">Alunos</h3>
          <p className="text-xs text-slate-500 font-medium">Controle de matrículas, chamadas e visitantes.</p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 h-9 px-4 cursor-pointer shadow-soft hidden sm:flex"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Aluno</span>
        </Button>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="space-y-3 bg-white p-4 rounded-2xl shadow-soft border border-slate-50">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Pesquisar aluno por nome..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10 rounded-xl border-slate-100 text-xs py-5 focus-visible:ring-primary/20 bg-slate-50/50"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`border-slate-100 rounded-xl text-xs font-semibold px-3.5 h-10 flex items-center gap-1.5 cursor-pointer ${showFilters ? "bg-slate-100" : ""}`}
          >
            <Filter className="h-4 w-4 text-slate-500" />
            <span className="hidden sm:inline">Filtros</span>
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-50 animate-fade-in">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filtrar por Classe</Label>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white text-xs px-3 h-9 font-medium text-slate-700 focus:outline-none"
              >
                <option value="all">Todas as Classes</option>
                {store.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filtrar por Status</Label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white text-xs px-3 h-9 font-medium text-slate-700 focus:outline-none"
              >
                <option value="all">Todos os Status</option>
                <option value="ATIVO">Ativo</option>
                <option value="VISITANTE">Visitante</option>
                <option value="INATIVO">Inativo</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* STUDENT LIST */}
      {filteredAlunos.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-soft border border-slate-50 text-center py-16">
          <div className="h-14 w-14 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
            <Users className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Nenhum aluno encontrado</h4>
          <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed font-medium">
            Tente mudar os filtros de classe e status ou digite outro nome para buscar.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-soft border border-slate-50 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredAlunos.map((a) => {
              const studentClass = store.classes.find((c) => c.id === a.classe_id);
              const initials = a.nome
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <div
                  key={a.id}
                  onClick={() => {
                    setSelectedAluno(a);
                    setIsHistoryOpen(true);
                  }}
                  className="flex items-center justify-between p-4 hover:bg-slate-50/50 cursor-pointer transition-colors duration-150"
                  style={{ minHeight: "64px" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-100 flex-shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 leading-snug truncate">
                        {a.nome}
                      </h4>
                      <p className="text-[10px] sm:text-xs font-semibold text-slate-400 truncate mt-0.5">
                        {studentClass ? studentClass.nome : "Sem classe vinculada"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <span className={`text-[9px] font-bold px-2 py-0.75 rounded-full ${getStatusColor(a.status)}`}>
                      {a.status}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(a);
                          }}
                          className="text-slate-600 text-xs font-medium focus:bg-slate-50 cursor-pointer py-2 rounded-lg flex items-center gap-2"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingAlunoId(a.id);
                          }}
                          className="text-red-600 text-xs font-medium focus:bg-red-50/50 cursor-pointer py-2 rounded-lg flex items-center gap-2"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="bg-slate-50/50 p-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Total Encontrado</span>
            <span>{filteredAlunos.length} Alunos</span>
          </div>
        </div>
      )}

      {/* MOBILE FLOATING ACTION BUTTON (FAB) */}
      <Button
        onClick={handleOpenCreate}
        className="sm:hidden fixed right-4 bottom-20 h-12 w-12 rounded-full bg-primary hover:bg-primary/95 text-white shadow-[0_4px_12px_rgba(20,83,45,0.3)] z-40 flex items-center justify-center cursor-pointer border border-primary/20"
      >
        <Plus className="h-6 w-6 text-white" />
      </Button>

      {/* NEW/EDIT DIALOG */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-none shadow-elevated">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800 tracking-tight">
              {editingAluno ? "Editar Aluno" : "Novo Aluno"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 font-medium">
              Preencha os dados cadastrais do aluno.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="nome" className="text-xs font-semibold text-slate-600">
                Nome do Aluno *
              </Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome completo do aluno"
                className={`rounded-xl border-slate-200 text-xs py-5 ${errors.nome ? "border-red-400 focus-visible:ring-red-400" : ""}`}
              />
              {errors.nome && <p className="text-[10px] text-red-500 font-semibold">{errors.nome}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                  <option value="ATIVO">Ativo</option>
                  <option value="VISITANTE">Visitante</option>
                  <option value="INATIVO">Inativo</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="classeId" className="text-xs font-semibold text-slate-600">
                  Classe *
                </Label>
                <select
                  id="classeId"
                  value={classeId}
                  onChange={(e) => setClasseId(e.target.value)}
                  className={`w-full rounded-xl border bg-white text-xs px-3 h-10 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-ring ${errors.classeId ? "border-red-400" : "border-slate-200"}`}
                >
                  <option value="">Selecione uma Classe</option>
                  {store.classes
                    .filter((c) => c.status === "ATIVA" || c.id === classeId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                </select>
                {errors.classeId && (
                  <p className="text-[10px] text-red-500 font-semibold">{errors.classeId}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="sexo" className="text-xs font-semibold text-slate-600">
                  Sexo
                </Label>
                <select
                  id="sexo"
                  value={sexo}
                  onChange={(e) => setSexo(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-white text-xs px-3 h-10 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Não Especificado</option>
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMININO">Feminino</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-600">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: aluno@email.com"
                  className="rounded-xl border-slate-200 text-xs py-5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="dataNascimento" className="text-xs font-semibold text-slate-600">
                  Data de Nascimento
                </Label>
                <Input
                  id="dataNascimento"
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className="rounded-xl border-slate-200 text-xs py-5"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="telefone" className="text-xs font-semibold text-slate-600">
                  Telefone / WhatsApp
                </Label>
                <Input
                  id="telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="Ex: (11) 99999-9999"
                  className="rounded-xl border-slate-200 text-xs py-5"
                />
              </div>
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

      {/* STUDENT DETAILS & HISTORY DRAWER/SHEET */}
      <Sheet open={isHistoryOpen && selectedAluno !== null} onOpenChange={setIsHistoryOpen}>
        {selectedAluno && (
          <SheetContent className="w-full sm:max-w-md border-l border-slate-100 bg-slate-50 p-0 flex flex-col h-full overflow-hidden shadow-elevated">
            {/* Drawer Header Profile */}
            <div className="bg-white p-5 border-b border-slate-100 flex-shrink-0 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm border border-emerald-200 flex-shrink-0">
                  {selectedAluno.nome
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-800 tracking-tight leading-tight truncate">
                    {selectedAluno.nome}
                  </h4>
                  <p className="text-[11px] font-semibold text-slate-400 mt-0.5 truncate">
                    {store.classes.find((c) => c.id === selectedAluno.classe_id)?.nome || "Sem classe"}
                  </p>
                </div>
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.75 rounded-full flex-shrink-0 ${getStatusColor(selectedAluno.status)}`}>
                {selectedAluno.status}
              </span>
            </div>

            {/* Scrollable details */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Contatos / Info cadastral */}
              <Card className="border-none shadow-soft bg-white rounded-xl">
                <CardContent className="p-4 space-y-2 text-xs font-semibold text-slate-600">
                  {selectedAluno.email && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail className="h-4 w-4 text-slate-300" />
                      <span className="truncate">{selectedAluno.email}</span>
                    </div>
                  )}
                  {selectedAluno.sexo && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <User className="h-4 w-4 text-slate-300" />
                      <span>Gênero: {selectedAluno.sexo === "MASCULINO" ? "Masculino" : "Feminino"}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-500">
                    <Phone className="h-4 w-4 text-slate-300" />
                    <span>Telefone: {selectedAluno.telefone || "Não cadastrado"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar className="h-4 w-4 text-slate-300" />
                    <span>
                      Aniversário:{" "}
                      {selectedAluno.data_nascimento
                        ? selectedAluno.data_nascimento.split("-").reverse().join("/")
                        : "Não cadastrado"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Attendance & Bible stats indicators */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="border-none shadow-soft bg-white rounded-xl">
                  <CardContent className="p-3 flex flex-col items-center text-center">
                    <div className="h-8 w-8 rounded-lg bg-green-50 text-emerald-600 flex items-center justify-center mb-2">
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Frequência
                    </span>
                    <h5 className="text-base font-bold text-slate-800 mt-0.5">
                      {getAlunoStats(selectedAluno).attendanceRate}%
                    </h5>
                    <p className="text-[9px] text-slate-400 font-semibold mt-1">
                      {getAlunoStats(selectedAluno).presentCount} de{" "}
                      {getAlunoStats(selectedAluno).totalAulas} aulas
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-soft bg-white rounded-xl">
                  <CardContent className="p-3 flex flex-col items-center text-center">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                      <Book className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Uso de Bíblia
                    </span>
                    <h5 className="text-base font-bold text-slate-800 mt-0.5">
                      {getAlunoStats(selectedAluno).bibleRate}%
                    </h5>
                    <p className="text-[9px] text-slate-400 font-semibold mt-1">
                      das vezes presente
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* TABBED HISTORY TIMELINE */}
              <Tabs defaultValue="attendance" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-100 rounded-xl p-1 h-10">
                  <TabsTrigger value="attendance" className="rounded-lg text-[11px] font-semibold">Presenças</TabsTrigger>
                  <TabsTrigger value="moves" className="rounded-lg text-[11px] font-semibold">Movimentações</TabsTrigger>
                </TabsList>

                {/* Tab 1: Attendance Timeline */}
                <TabsContent value="attendance" className="mt-3">
                  {getAlunoTimeline(selectedAluno).length === 0 ? (
                    <div className="bg-white p-6 rounded-xl shadow-soft text-center text-slate-400 text-xs font-semibold">
                      Nenhuma aula registrada para esta classe.
                    </div>
                  ) : (
                    <div className="bg-white p-4 rounded-xl shadow-soft space-y-4">
                      {getAlunoTimeline(selectedAluno).map((aula, i) => (
                        <div key={aula.id} className="relative flex gap-3 text-xs leading-none">
                          {i < getAlunoTimeline(selectedAluno).length - 1 && (
                            <div className="absolute left-3.5 top-8 bottom-0 w-0.5 bg-slate-100 -mb-6" />
                          )}

                          <div
                            className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 border ${
                              aula.presente
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : "bg-red-50 text-red-600 border-red-100"
                            }`}
                          >
                            {aula.presente ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                          </div>

                          <div className="flex-1 min-w-0 py-0.5 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-slate-800">{aula.data}</span>
                              {aula.presente && aula.bible && (
                                <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                  <Book className="h-2 w-2" /> Bíblia
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 font-semibold truncate leading-normal">
                              {aula.tema}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Tab 2: Promotions & Moves History */}
                <TabsContent value="moves" className="mt-3">
                  {getAlunoClassHistory(selectedAluno.id).length === 0 ? (
                    <div className="bg-white p-6 rounded-xl shadow-soft text-center text-slate-400 text-xs font-semibold">
                      Nenhum registro de movimentação disponível.
                    </div>
                  ) : (
                    <div className="bg-white p-4 rounded-xl shadow-soft space-y-4">
                      {getAlunoClassHistory(selectedAluno.id).map((h, i) => {
                        const orig = store.classes.find((c) => c.id === h.classe_origem_id);
                        const dest = store.classes.find((c) => c.id === h.classe_destino_id);
                        const formattedTime = new Date(h.data_evento).toLocaleDateString("pt-BR");

                        return (
                          <div key={h.id} className="relative flex gap-3 text-xs leading-none">
                            {i < getAlunoClassHistory(selectedAluno.id).length - 1 && (
                              <div className="absolute left-3.5 top-8 bottom-0 w-0.5 bg-slate-100 -mb-6" />
                            )}

                            <div className="h-7 w-7 rounded-full bg-slate-50 text-slate-500 border border-slate-100 flex items-center justify-center flex-shrink-0 z-10">
                              <ArrowRightLeft className="h-3.5 w-3.5 text-slate-400" />
                            </div>

                            <div className="flex-1 min-w-0 py-0.5 space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-slate-800">
                                  {h.tipo}
                                </span>
                                <span className="text-[9px] font-semibold text-slate-400">
                                  {formattedTime}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                                {h.motivo}
                              </p>
                              {orig && dest && (
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                  {orig.nome.split("—")[0].trim()} ➔ {dest.nome.split("—")[0].trim()}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Footer edit/delete operations */}
            <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0 grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => handleOpenEdit(selectedAluno)}
                className="w-full border-slate-100 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 h-10 cursor-pointer"
              >
                <Edit2 className="h-3.5 w-3.5" />
                Editar Aluno
              </Button>
              <Button
                variant="destructive"
                onClick={() => setDeletingAlunoId(selectedAluno.id)}
                className="w-full bg-red-50 hover:bg-red-100/70 text-red-600 border-none font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 h-10 cursor-pointer shadow-none"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                Excluir
              </Button>
            </div>
          </SheetContent>
        )}
      </Sheet>

      {/* DELETE CONFIRM ALERT DIALOG */}
      <AlertDialog open={deletingAlunoId !== null} onOpenChange={(open) => !open && setDeletingAlunoId(null)}>
        <AlertDialogContent className="rounded-2xl border-none shadow-elevated sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Remover Aluno?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-400 leading-relaxed font-medium">
              Esta ação removerá o aluno do cadastro. Seus registros de chamada passados serão preservados no histórico de presença das aulas. Alunos que mudaram de turma possuem histórico e não podem ser excluídos fisicamente (Regras de Integridade).
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
