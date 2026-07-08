import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  useEbdStore,
  addCurso,
  updateCurso,
  deleteCurso,
  matricularAlunoCurso,
  desmatricularAlunoCurso,
  Curso,
  Aluno,
} from "@/lib/store";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
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
  Search,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  BookOpen,
  X,
  UserPlus,
  UserMinus,
  CheckCircle2
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
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { toast } from "sonner";

const searchSchema = z.object({
  nova: z.string().optional(),
  detalhe: z.string().optional(),
});

export const Route = createFileRoute("/_app/cursos")({
  validateSearch: (search) => searchSchema.parse(search),
  component: CursosPage,
});

function CursosPage() {
  const store = useEbdStore();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  // Dialog & Details States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCurso, setSelectedCurso] = useState<Curso | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [deletingCursoId, setDeletingCursoId] = useState<string | null>(null);

  // Filters State
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProf, setFilterProf] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Sorting and Pagination State
  const [sortBy, setSortBy] = useState<"nome" | "carga" | "participantes" | "status">("nome");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Enrollment management search inside Details
  const [enrollSearchText, setEnrollSearchText] = useState("");

  // Form states
  const [nome, setNome] = useState("");
  const [professor, setProfessor] = useState("");
  const [status, setStatus] = useState<Curso["status"]>("PLANEJADO");
  const [descricao, setDescricao] = useState("");
  const [cargaHoraria, setCargaHoraria] = useState<number | "">("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [diasSemana, setDiasSemana] = useState<string[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auth State
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("STUDENT");

  useEffect(() => {
    async function loadAuth() {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUserId(session.user.id);
          const { data: profile } = await supabase
            .from("profiles")
            .select("nome, role")
            .eq("id", session.user.id)
            .maybeSingle();
          setCurrentUserRole(profile?.role || session.user.user_metadata?.role || "STUDENT");
          setCurrentUserName(profile?.nome || session.user.user_metadata?.nome || session.user.user_metadata?.name || "");
        }
      } else {
        // Fallback para demo
        setCurrentUserRole("ADMIN");
        setCurrentUserName("Administrador Demo");
      }
    }
    loadAuth();
  }, []);

  // Helper de Permissão
  const canManageCourse = (curso: Curso | null = null) => {
    if (currentUserRole === "ADMIN") return true;
    if (currentUserRole === "TEACHER") {
      if (!curso) return true;
      return curso.professor_id === currentUserId || !curso.professor_id;
    }
    return false;
  };

  // Auto-open modal/details
  useEffect(() => {
    if (search.nova === "true") {
      handleOpenCreate();
      navigate({ search: {} });
    }
  }, [search.nova]);

  useEffect(() => {
    if (search.detalhe) {
      const cr = store.cursos.find((c) => c.id === search.detalhe);
      if (cr) {
        setSelectedCurso(cr);
        setIsDetailsOpen(true);
      }
      navigate({ search: {} });
    }
  }, [search.detalhe, store.cursos]);

  // Keep selectedCurso details in sync
  useEffect(() => {
    if (selectedCurso) {
      const updated = store.cursos.find((c) => c.id === selectedCurso.id);
      if (updated) {
        setSelectedCurso(updated);
      }
    }
  }, [store.cursos, selectedCurso]);

  const handleOpenCreate = () => {
    setEditingCurso(null);
    setNome("");
    setProfessor(currentUserRole === "TEACHER" ? currentUserName : "");
    setStatus("PLANEJADO");
    setDescricao("");
    setCargaHoraria("");
    setDataInicio("");
    setDataFim("");
    setDiasSemana([]);
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
    setDiasSemana(c.dias_semana || []);
    setErrors({});
    setIsFormOpen(true);
    setIsDetailsOpen(false);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!nome.trim()) newErrors.nome = "O nome do curso é obrigatório.";
    if (!professor.trim()) newErrors.professor = "O professor é obrigatório.";
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
        nome: nome.trim(),
        professor: professor.trim() || null,
        professor_id: editingCurso ? editingCurso.professor_id : (currentUserRole === "TEACHER" ? currentUserId : null),
        status,
        descricao: descricao.trim() || null,
        carga_horaria: cargaHoraria === "" ? null : Number(cargaHoraria),
        data_inicio: dataInicio || null,
        data_fim: dataFim || null,
        dias_semana: diasSemana.length > 0 ? diasSemana : null,
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
        setIsDetailsOpen(false);
      } catch (error: any) {
        toast.error(error.message || "Erro ao excluir o curso.");
        setDeletingCursoId(null);
      }
    }
  };

  const handleMatricular = (alunoId: string) => {
    if (!selectedCurso) return;
    try {
      matricularAlunoCurso(selectedCurso.id, alunoId);
      toast.success("Participante matriculado com sucesso.");
      setEnrollSearchText("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao matricular participante.");
    }
  };

  const handleDesmatricular = (alunoId: string) => {
    if (!selectedCurso) return;
    try {
      desmatricularAlunoCurso(selectedCurso.id, alunoId);
      toast.success("Participante removido do curso.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover participante.");
    }
  };

  // Unique filters data
  const uniqueProfessors = Array.from(
    new Set(store.cursos.map((c) => c.professor).filter(Boolean))
  ) as string[];

  const uniqueYears = Array.from(
    new Set(
      store.cursos
        .map((c) => (c.data_inicio ? c.data_inicio.split("-")[0] : ""))
        .filter(Boolean)
    )
  ) as string[];

  // Filter & Search Logic
  const filteredCursos = store.cursos.filter((c) => {
    const matchSearch =
      c.nome.toLowerCase().includes(searchText.toLowerCase()) ||
      (c.professor && c.professor.toLowerCase().includes(searchText.toLowerCase())) ||
      (c.descricao && c.descricao.toLowerCase().includes(searchText.toLowerCase()));

    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    const matchProf = filterProf === "all" || c.professor === filterProf;
    
    let matchYear = true;
    if (filterYear !== "all") {
      matchYear = c.data_inicio ? c.data_inicio.startsWith(filterYear) : false;
    }

    return matchSearch && matchStatus && matchProf && matchYear;
  });

  // Sorting
  const sortedCursos = [...filteredCursos].sort((a, b) => {
    let valA: any = a[sortBy === "carga" ? "carga_horaria" : sortBy === "participantes" ? "id" : sortBy];
    let valB: any = b[sortBy === "carga" ? "carga_horaria" : sortBy === "participantes" ? "id" : sortBy];

    if (sortBy === "participantes") {
      valA = store.curso_aluno.filter((ca) => ca.curso_id === a.id).length;
      valB = store.curso_aluno.filter((ca) => ca.curso_id === b.id).length;
    } else {
      valA = (valA || "").toString().toLowerCase();
      valB = (valB || "").toString().toLowerCase();
    }

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedCursos.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCursos = sortedCursos.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const toggleSort = (field: "nome" | "carga" | "participantes" | "status") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  // Get details information
  const getCursoDetails = (c: Curso) => {
    const matriculas = store.curso_aluno.filter((ca) => ca.curso_id === c.id);
    const totalParticipants = matriculas.length;

    // Resolve details of participants
    const participants = matriculas
      .map((ca) => {
        const aluno = store.alunos.find((a) => a.id === ca.aluno_id);
        return aluno ? { ...aluno, data_matricula: ca.data_matricula } : null;
      })
      .filter(Boolean) as (Aluno & { data_matricula: string })[];

    const period = c.data_inicio && c.data_fim
      ? `${c.data_inicio.split("-").reverse().join("/")} a ${c.data_fim.split("-").reverse().join("/")}`
      : c.data_inicio
      ? `Início: ${c.data_inicio.split("-").reverse().join("/")}`
      : "Período indefinido";

    return {
      totalParticipants,
      participants,
      period,
    };
  };

  // Search people to enroll
  const getEnrollCandidates = () => {
    if (!selectedCurso || !enrollSearchText.trim()) return [];
    
    const details = getCursoDetails(selectedCurso);
    const enrolledIds = details.participants.map((p) => p.id);

    return store.alunos.filter((a) => {
      const matchText = a.nome.toLowerCase().includes(enrollSearchText.toLowerCase());
      const notEnrolled = !enrolledIds.includes(a.id);
      // Pessoa inativa não poderá ser vinculada a novos cursos.
      const isActive = a.status !== "INATIVO";
      
      return matchText && notEnrolled && isActive;
    }).slice(0, 5);
  };

  const getStatusBadgeStyle = (s: Curso["status"]) => {
    switch (s) {
      case "EM_ANDAMENTO":
        return "bg-emerald-50 text-emerald-600 border border-emerald-100";
      case "PLANEJADO":
        return "bg-amber-50 text-amber-600 border border-amber-100";
      case "CONCLUIDO":
        return "bg-slate-100 text-slate-600 border border-slate-200";
      case "CANCELADO":
        return "bg-red-50 text-red-600 border border-red-100";
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
    <div className="space-y-6 relative min-h-[calc(100vh-10rem)]">
      {/* Page Header and Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <GraduationCap className="h-5.5 w-5.5 text-primary" />
            Cursos Especiais
          </h3>
          <p className="text-xs text-slate-500 font-medium">Gestão de cursos de formação e capacitação teológica.</p>
        </div>
        {canManageCourse() && (
          <Button
            onClick={handleOpenCreate}
            className="bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 h-9 px-4 cursor-pointer shadow-soft hidden sm:flex"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Curso</span>
          </Button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="space-y-3 bg-white p-4 rounded-2xl shadow-soft border border-slate-50">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Pesquisar por nome do curso, professor ou descrição..."
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 rounded-xl border-slate-100 text-xs py-5 focus-visible:ring-primary/20 bg-slate-50/50"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`border-slate-100 rounded-xl text-xs font-semibold px-3.5 h-10 flex items-center gap-1.5 cursor-pointer ${
              showFilters ? "bg-slate-100" : ""
            }`}
          >
            <Filter className="h-4 w-4 text-slate-500" />
            <span className="hidden sm:inline">Filtros</span>
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-50 animate-fade-in">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</Label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white text-xs px-3 h-9 font-medium text-slate-700 focus:outline-none"
              >
                <option value="all">Todos os Status</option>
                <option value="PLANEJADO">Planejado</option>
                <option value="EM_ANDAMENTO">Em Andamento</option>
                <option value="CONCLUIDO">Concluído</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Professor</Label>
              <select
                value={filterProf}
                onChange={(e) => {
                  setFilterProf(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white text-xs px-3 h-9 font-medium text-slate-700 focus:outline-none"
              >
                <option value="all">Todos</option>
                {uniqueProfessors.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ano de Início</Label>
              <select
                value={filterYear}
                onChange={(e) => {
                  setFilterYear(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white text-xs px-3 h-9 font-medium text-slate-700 focus:outline-none"
              >
                <option value="all">Todos os Anos</option>
                {uniqueYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Sorting bar */}
      <div className="hidden sm:flex items-center justify-end gap-4 text-xs font-semibold text-slate-500 bg-slate-50/50 p-2 px-4 rounded-xl border border-slate-100">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Ordenar por:</span>
        <button
          onClick={() => toggleSort("nome")}
          className={`flex items-center gap-1 hover:text-slate-800 cursor-pointer ${
            sortBy === "nome" ? "text-primary font-bold" : ""
          }`}
        >
          Nome
          <ArrowUpDown className="h-3 w-3" />
        </button>
        <button
          onClick={() => toggleSort("carga")}
          className={`flex items-center gap-1 hover:text-slate-800 cursor-pointer ${
            sortBy === "carga" ? "text-primary font-bold" : ""
          }`}
        >
          Carga Horária
          <ArrowUpDown className="h-3 w-3" />
        </button>
        <button
          onClick={() => toggleSort("participantes")}
          className={`flex items-center gap-1 hover:text-slate-800 cursor-pointer ${
            sortBy === "participantes" ? "text-primary font-bold" : ""
          }`}
        >
          Participantes
          <ArrowUpDown className="h-3 w-3" />
        </button>
      </div>

      {/* Cursos List */}
      {sortedCursos.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-soft border border-slate-100 text-center py-16 animate-fade-in">
          <div className="h-14 w-14 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Nenhum curso encontrado</h4>
          <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed font-medium">
            Tente alterar os filtros ou crie um novo curso de formação ministerial.
          </p>
          {canManageCourse() && (
            <Button
              onClick={handleOpenCreate}
              className="mt-5 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-xl px-5 py-2 cursor-pointer shadow-soft"
            >
              Cadastrar Curso
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl shadow-soft border border-slate-50 overflow-hidden">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4 pl-6">Nome</th>
                  <th className="p-4">Professor</th>
                  <th className="p-4 text-center">Carga Horária</th>
                  <th className="p-4">Período</th>
                  <th className="p-4 text-center">Participantes</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 pr-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                {currentCursos.map((c) => {
                  const details = getCursoDetails(c);
                  return (
                    <tr
                      key={c.id}
                      onClick={() => {
                        setSelectedCurso(c);
                        setIsDetailsOpen(true);
                      }}
                      className="hover:bg-slate-50/50 cursor-pointer transition-colors duration-150"
                    >
                      <td className="p-4 pl-6 font-bold text-slate-800">{c.nome}</td>
                      <td className="p-4">{c.professor || "Não atribuído"}</td>
                      <td className="p-4 text-center font-bold">{c.carga_horaria ? `${c.carga_horaria}h` : "N/D"}</td>
                      <td className="p-4 text-slate-500 font-normal">{details.period}</td>
                      <td className="p-4 text-center font-bold text-slate-800">{details.totalParticipants}</td>
                      <td className="p-4 text-center">
                        <span className={`text-[9px] font-bold px-2.5 py-0.75 rounded-full ${getStatusBadgeStyle(c.status)}`}>
                          {getStatusLabel(c.status)}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
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
                              onClick={() => {
                                setSelectedCurso(c);
                                setIsDetailsOpen(true);
                              }}
                              className="text-slate-600 text-xs font-medium focus:bg-slate-50 cursor-pointer py-2 rounded-lg flex items-center gap-2"
                            >
                              <Eye className="h-3.5 w-3.5 text-slate-400" />
                              Visualizar
                            </DropdownMenuItem>
                            {canManageCourse(c) && (
                              <>
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
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden grid grid-cols-1 gap-4">
            {currentCursos.map((c) => {
              const details = getCursoDetails(c);

              return (
                <Card
                  key={c.id}
                  onClick={() => {
                    setSelectedCurso(c);
                    setIsDetailsOpen(true);
                  }}
                  className="border-none shadow-soft bg-white rounded-2xl flex flex-col justify-between hover:shadow-elevated transition-shadow duration-200 cursor-pointer"
                >
                  <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                    <div className="min-w-0 pr-4">
                      <CardTitle className="text-sm font-bold text-slate-800 tracking-tight leading-snug truncate">
                        {c.nome}
                      </CardTitle>
                      <CardDescription className="text-[11px] font-semibold text-slate-400 mt-0.5">
                        {c.professor || "Sem professor"} • {details.totalParticipants} inscritos
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <span className={`text-[9px] font-bold px-2 py-0.75 rounded-full ${getStatusBadgeStyle(c.status)}`}>
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
                            onClick={() => {
                              setSelectedCurso(c);
                              setIsDetailsOpen(true);
                            }}
                            className="text-slate-600 text-xs font-medium focus:bg-slate-50 cursor-pointer py-2 rounded-lg flex items-center gap-2"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-400" />
                            Visualizar
                          </DropdownMenuItem>
                          {canManageCourse(c) && (
                            <>
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
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-2 flex-1 flex flex-col justify-between">
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2 mb-4">
                      {c.descricao || "Sem descrição disponível para este curso."}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mb-3 text-[11px] font-semibold text-slate-500">
                      <div className="flex items-center gap-1 truncate">
                        <Clock className="h-3 w-3" /> 
                        {c.carga_horaria ? `${c.carga_horaria}h` : "--"}
                      </div>
                      <div className="flex items-center gap-1 truncate">
                        <Calendar className="h-3 w-3" />
                        {c.dias_semana && c.dias_semana.length > 0 ? c.dias_semana.join(", ") : "Não definido"}
                      </div>
                    </div>
                    
                    <div className="border-t border-slate-50 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                      <span>
                        {c.data_inicio ? new Date(c.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR') : "--"} 
                        {c.data_fim ? ` até ${new Date(c.data_fim + 'T00:00:00').toLocaleDateString('pt-BR')}` : ""}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-4 py-3 border border-slate-100 rounded-2xl shadow-soft">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-xl border-slate-100 text-xs font-semibold cursor-pointer h-9"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <span className="text-xs font-bold text-slate-500">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded-xl border-slate-100 text-xs font-semibold cursor-pointer h-9"
              >
                Próxima
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* MOBILE FLOATING ACTION BUTTON (FAB) */}
      {canManageCourse() && (
        <Button
          onClick={handleOpenCreate}
          className="sm:hidden fixed right-4 bottom-20 h-12 w-12 rounded-full bg-primary hover:bg-primary/95 text-white shadow-[0_4px_12px_rgba(20,83,45,0.3)] z-40 flex items-center justify-center cursor-pointer border border-primary/20"
        >
          <Plus className="h-6 w-6 text-white" />
        </Button>
      )}

      {/* FORM DIALOG (NEW/EDIT) */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-none shadow-elevated max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800 tracking-tight">
              {editingCurso ? "Editar Curso" : "Novo Curso"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 font-medium">
              Preencha os campos cadastrais do curso teológico.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="nome" className="text-xs font-semibold text-slate-600">
                Nome do Curso *
              </Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Introdução à Teologia Sistemática"
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
                  placeholder="Nome do palestrante"
                  className={`rounded-xl border-slate-200 text-xs py-5 ${errors.professor ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                />
                {errors.professor && <p className="text-[10px] text-red-500 font-semibold">{errors.professor}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-semibold text-slate-600">
                  Status
                </Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-white text-xs px-3 h-10 font-medium text-slate-700 focus:outline-none"
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
                  placeholder="Carga em horas"
                  className="rounded-xl border-slate-200 text-xs py-5"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inicio" className="text-xs font-semibold text-slate-600">
                  Data Inicial
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
                  <Label htmlFor="dataFim" className="text-xs font-semibold text-slate-600">
                    Data Fim
                  </Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="rounded-xl border-slate-200 text-xs py-5"
                  />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Dias da Semana</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(dia => (
                  <Button
                    key={dia}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (diasSemana.includes(dia)) {
                        setDiasSemana(diasSemana.filter(d => d !== dia));
                      } else {
                        setDiasSemana([...diasSemana, dia]);
                      }
                    }}
                    className={`h-8 rounded-lg text-[10px] font-semibold cursor-pointer ${
                      diasSemana.includes(dia) 
                        ? 'bg-primary text-white border-primary hover:bg-primary/90 hover:text-white' 
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {dia}
                  </Button>
                ))}
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
                placeholder="Ementa do curso ou objetivos pedagógicos..."
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

      {/* DETAILS DRAWER / SHEET */}
      <Sheet open={isDetailsOpen && selectedCurso !== null} onOpenChange={setIsDetailsOpen}>
        {selectedCurso && (
          <SheetContent className="w-full sm:max-w-md border-l border-slate-100 bg-slate-50 p-0 flex flex-col h-full overflow-hidden shadow-elevated">
            {/* Header info */}
            <div className="bg-white p-5 border-b border-slate-100 flex-shrink-0 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 flex-shrink-0">
                  <GraduationCap className="h-5.5 w-5.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-800 tracking-tight leading-tight truncate">
                    {selectedCurso.nome}
                  </h4>
                  <p className="text-[11px] font-semibold text-slate-400 mt-0.5 truncate">
                    Prof: {selectedCurso.professor || "Não atribuído"}
                  </p>
                </div>
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.75 rounded-full flex-shrink-0 ${getStatusBadgeStyle(selectedCurso.status)}`}>
                {getStatusLabel(selectedCurso.status)}
              </span>
            </div>

            {/* Scrollable details and participants search */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Informações Gerais */}
              <Card className="border-none shadow-soft bg-white rounded-xl">
                <CardContent className="p-4 space-y-3.5 text-xs font-semibold text-slate-600">
                  <div className="flex items-center gap-2.5 text-slate-500">
                    <Clock className="h-4.5 w-4.5 text-slate-300" />
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Carga Horária</p>
                      <p className="text-xs font-bold text-slate-700 leading-normal">{selectedCurso.carga_horaria ? `${selectedCurso.carga_horaria} horas` : "Não cadastrado"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-slate-500">
                    <Calendar className="h-4.5 w-4.5 text-slate-300" />
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Período Letivo</p>
                      <div className="text-slate-800 font-bold text-xs">
                        {selectedCurso.data_inicio ? new Date(selectedCurso.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR') : "Não definida"} 
                        {selectedCurso.data_fim ? ` - ${new Date(selectedCurso.data_fim + 'T00:00:00').toLocaleDateString('pt-BR')}` : ""}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] uppercase tracking-widest font-bold text-slate-400 mb-0.5">Dias da Semana</div>
                    <div className="text-slate-700 font-bold text-xs">
                      {selectedCurso.dias_semana && selectedCurso.dias_semana.length > 0 
                        ? selectedCurso.dias_semana.join(", ") 
                        : "Não definidos"}
                    </div>
                  </div>

                  {selectedCurso.descricao && (
                    <div className="border-t border-slate-50 pt-3">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Descrição</p>
                      <p className="text-[11px] font-medium text-slate-500 leading-relaxed font-sans">{selectedCurso.descricao}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* PARTICIPANTES LIST & SELECTION */}
              <Card className="border-none shadow-soft bg-white rounded-xl">
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Participantes ({getCursoDetails(selectedCurso).totalParticipants})
                  </h5>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                  {/* Dynamic search and add field */}
                  {selectedCurso.status === "CONCLUIDO" ? (
                    <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-center flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Curso concluído não aceita novas matrículas.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input
                          type="text"
                          placeholder="Pesquisar participante ativo para matricular..."
                          value={enrollSearchText}
                          onChange={(e) => setEnrollSearchText(e.target.value)}
                          className="pl-8 rounded-xl border-slate-100 text-[11px] h-8 bg-slate-50/50"
                        />
                      </div>
                      
                      {/* Search candidate results dropdown */}
                      {getEnrollCandidates().length > 0 && (
                        <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white max-h-36 overflow-y-auto animate-fade-in shadow-sm">
                          {getEnrollCandidates().map((candidate) => (
                            <div
                              key={candidate.id}
                              onClick={() => handleMatricular(candidate.id)}
                              className="flex items-center justify-between p-2 hover:bg-slate-50 cursor-pointer text-xs"
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <p className="font-bold text-slate-700 truncate leading-snug">{candidate.nome}</p>
                                <p className="text-[9px] text-slate-400 font-semibold leading-none truncate mt-0.5">
                                  Classe: {store.classes.find((c) => c.id === candidate.classe_id)?.nome || "Sem classe"}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6.5 text-[10px] text-primary hover:text-primary hover:bg-primary/5 rounded-lg flex items-center gap-1 cursor-pointer font-bold"
                              >
                                <UserPlus className="h-3 w-3" />
                                Matricular
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Enrollments participants list */}
                  <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto pr-1">
                    {getCursoDetails(selectedCurso).participants.length === 0 ? (
                      <p className="text-[11px] text-slate-400 font-semibold text-center py-4">
                        Nenhum participante matriculado neste curso.
                      </p>
                    ) : (
                      getCursoDetails(selectedCurso).participants.map((participant) => (
                        <div key={participant.id} className="flex items-center justify-between py-2.5 text-xs">
                          <div className="min-w-0 flex-1 pr-3">
                            <p className="font-bold text-slate-700 truncate leading-snug">{participant.nome}</p>
                            <p className="text-[9px] text-slate-400 font-semibold mt-0.5 truncate leading-none">
                              Matrícula: {participant.data_matricula.split("-").reverse().join("/")}
                            </p>
                          </div>
                          {selectedCurso.status !== "CONCLUIDO" && (
                            <Button
                              onClick={() => handleDesmatricular(participant.id)}
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                              title="Remover matrícula"
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Edit / operations footer */}
            {canManageCourse(selectedCurso) && (
              <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0 grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleOpenEdit(selectedCurso)}
                  className="w-full bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 h-10 cursor-pointer shadow-soft"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Editar Curso
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDeletingCursoId(selectedCurso.id)}
                  className="w-full border-red-100 hover:bg-red-50 text-red-600 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 h-10 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir
                </Button>
              </div>
            )}
          </SheetContent>
        )}
      </Sheet>

      {/* DELETE CONFIRM ALERT DIALOG */}
      <AlertDialog open={deletingCursoId !== null} onOpenChange={(open) => !open && setDeletingCursoId(null)}>
        <AlertDialogContent className="rounded-2xl border-none shadow-elevated sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Excluir Curso?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-400 leading-relaxed font-medium">
              Esta ação removerá permanentemente este curso. Cursos com participantes matriculados ativos não podem ser excluídos devido a integridade de dados.
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
