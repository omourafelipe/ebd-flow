import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEbdStore, addClasse, updateClasse, deleteClasse, Classe } from "@/lib/store";
import { useState, useEffect } from "react";
import { z } from "zod";
import {
  BookOpen,
  Plus,
  User,
  MoreVertical,
  Edit2,
  Trash2,
  AlertTriangle,
  FolderOpen,
  Copy,
  Eye,
  Users,
  Calendar,
  Layers,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown,
  BookMarked,
  Search,
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
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";

// Schema for URL search params
const searchSchema = z.object({
  nova: z.string().optional(),
  detalhe: z.string().optional(),
});

export const Route = createFileRoute("/_app/classes")({
  validateSearch: (search) => searchSchema.parse(search),
  component: ClassesPage,
});

function ClassesPage() {
  const store = useEbdStore();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  // Dialog & Detail States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClasse, setSelectedClasse] = useState<Classe | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingClasse, setEditingClasse] = useState<Classe | null>(null);
  const [deletingClasseId, setDeletingClasseId] = useState<string | null>(null);

  // Filters State
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [filterProf, setFilterProf] = useState("all");
  const [filterAge, setFilterAge] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Sorting and Pagination State
  const [sortBy, setSortBy] = useState<"nome" | "departamento" | "alunos">("nome");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Form States
  const [nome, setNome] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [faixaEtaria, setFaixaEtaria] = useState("");
  const [professor, setProfessor] = useState("");
  const [professorAuxiliar, setProfessorAuxiliar] = useState("");
  const [sala, setSala] = useState("");
  const [cor, setCor] = useState("emerald");
  const [status, setStatus] = useState<"ATIVA" | "INATIVA">("ATIVA");
  const [observacoes, setObservacoes] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-open modal or detail if query param exists
  useEffect(() => {
    if (search.nova === "true") {
      handleOpenCreate();
      navigate({ search: {} });
    }
  }, [search.nova]);

  useEffect(() => {
    if (search.detalhe) {
      const cls = store.classes.find((c) => c.id === search.detalhe);
      if (cls) {
        setSelectedClasse(cls);
        setIsDetailsOpen(true);
      }
      navigate({ search: {} });
    }
  }, [search.detalhe, store.classes]);

  // Sync selected class details
  useEffect(() => {
    if (selectedClasse) {
      const updated = store.classes.find((c) => c.id === selectedClasse.id);
      if (updated) {
        setSelectedClasse(updated);
      }
    }
  }, [store.classes, selectedClasse]);

  const handleOpenCreate = () => {
    setEditingClasse(null);
    setNome("");
    setDepartamento("");
    setFaixaEtaria("");
    setProfessor("");
    setProfessorAuxiliar("");
    setSala("");
    setCor("emerald");
    setStatus("ATIVA");
    setObservacoes("");
    setErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (c: Classe) => {
    setEditingClasse(c);
    setNome(c.nome);
    setDepartamento(c.departamento || "");
    setFaixaEtaria(c.faixa_etaria || "");
    setProfessor(c.professor);
    setProfessorAuxiliar(c.professor_auxiliar || "");
    setSala(c.sala || "");
    setCor(c.cor || "emerald");
    setStatus(c.status);
    setObservacoes(c.observacoes || "");
    setErrors({});
    setIsFormOpen(true);
    setIsDetailsOpen(false);
  };

  const handleDuplicate = (c: Classe) => {
    setEditingClasse(null);
    // Find unique name copy
    let baseName = `Cópia de ${c.nome}`;
    let copyName = baseName;
    let count = 1;
    while (store.classes.some((cl) => cl.nome.toLowerCase() === copyName.toLowerCase())) {
      copyName = `${baseName} (${count})`;
      count++;
    }

    setNome(copyName);
    setDepartamento(c.departamento || "");
    setFaixaEtaria(c.faixa_etaria || "");
    setProfessor(c.professor);
    setProfessorAuxiliar(c.professor_auxiliar || "");
    setSala(c.sala || "");
    setCor(c.cor || "emerald");
    setStatus("ATIVA"); // default to ATIVA
    setObservacoes(c.observacoes || "");
    setErrors({});
    setIsFormOpen(true);
    toast.success(`Campos copiados de ${c.nome}. Defina um nome único para salvar.`);
  };

  const handleToggleStatus = (c: Classe) => {
    try {
      const newStatus = c.status === "ATIVA" ? "INATIVA" : "ATIVA";
      updateClasse({
        ...c,
        status: newStatus,
      });
      toast.success(`Classe ${newStatus === "ATIVA" ? "reativada" : "inativada"} com sucesso!`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar o status.");
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!nome.trim()) newErrors.nome = "O nome da classe é obrigatório.";
    if (!professor.trim()) newErrors.professor = "O professor é obrigatório.";
    if (!faixaEtaria.trim()) newErrors.faixaEtaria = "A faixa etária é obrigatória.";
    if (!status) newErrors.status = "O status é obrigatório.";

    // Uniqueness check client-side
    const duplicate = store.classes.some(
      (c) =>
        c.nome.trim().toLowerCase() === nome.trim().toLowerCase() &&
        c.id !== editingClasse?.id
    );
    if (duplicate) {
      newErrors.nome = "Já existe uma classe com este nome.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Por favor, verifique os campos obrigatórios.");
      return;
    }

    try {
      const payload = {
        nome: nome.trim(),
        departamento: departamento.trim() || null,
        faixa_etaria: faixaEtaria.trim() || null,
        professor: professor.trim(),
        professor_auxiliar: professorAuxiliar.trim() || null,
        sala: sala.trim() || null,
        cor,
        status,
        observacoes: observacoes.trim() || null,
      };

      if (editingClasse) {
        updateClasse({
          id: editingClasse.id,
          ...payload,
        });
        toast.success("Classe atualizada com sucesso!");
      } else {
        addClasse(payload);
        toast.success("Classe cadastrada com sucesso!");
      }
      setIsFormOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Ocorreu um erro ao salvar a classe.");
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingClasseId) {
      try {
        deleteClasse(deletingClasseId);
        toast.success("Classe excluída com sucesso.");
        setDeletingClasseId(null);
        setIsDetailsOpen(false);
      } catch (error: any) {
        toast.error(error.message || "Erro ao excluir a classe.");
        setDeletingClasseId(null);
      }
    }
  };

  // Get unique lists for filtering
  const uniqueDepartments = Array.from(
    new Set(store.classes.map((c) => c.departamento).filter(Boolean))
  ) as string[];

  const uniqueProfessors = Array.from(
    new Set(store.classes.map((c) => c.professor).filter(Boolean))
  ) as string[];

  const uniqueAgeGroups = Array.from(
    new Set(store.classes.map((c) => c.faixa_etaria).filter(Boolean))
  ) as string[];

  // Filter & Search Logic
  const filteredClasses = store.classes.filter((c) => {
    const matchSearch =
      c.nome.toLowerCase().includes(searchText.toLowerCase()) ||
      (c.professor && c.professor.toLowerCase().includes(searchText.toLowerCase())) ||
      (c.departamento && c.departamento.toLowerCase().includes(searchText.toLowerCase())) ||
      (c.sala && c.sala.toLowerCase().includes(searchText.toLowerCase()));

    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    const matchDept = filterDept === "all" || c.departamento === filterDept;
    const matchProf = filterProf === "all" || c.professor === filterProf;
    const matchAge = filterAge === "all" || c.faixa_etaria === filterAge;

    return matchSearch && matchStatus && matchDept && matchProf && matchAge;
  });

  // Sorting Logic
  const sortedClasses = [...filteredClasses].sort((a, b) => {
    let valueA: any = a[sortBy === "alunos" ? "id" : sortBy];
    let valueB: any = b[sortBy === "alunos" ? "id" : sortBy];

    if (sortBy === "alunos") {
      valueA = store.alunos.filter((al) => al.classe_id === a.id).length;
      valueB = store.alunos.filter((al) => al.classe_id === b.id).length;
    } else {
      valueA = (valueA || "").toLowerCase();
      valueB = (valueB || "").toLowerCase();
    }

    if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
    if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination Logic
  const totalPages = Math.ceil(sortedClasses.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClasses = sortedClasses.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const getCorBackground = (colorName: string | null) => {
    switch (colorName) {
      case "emerald":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "blue":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "purple":
        return "bg-purple-50 text-purple-700 border-purple-100";
      case "amber":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "red":
        return "bg-red-50 text-red-700 border-red-100";
      case "pink":
        return "bg-pink-50 text-pink-700 border-pink-100";
      case "indigo":
        return "bg-indigo-50 text-indigo-700 border-indigo-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  const getCorIndicator = (colorName: string | null) => {
    switch (colorName) {
      case "emerald":
        return "bg-emerald-500";
      case "blue":
        return "bg-blue-500";
      case "purple":
        return "bg-purple-500";
      case "amber":
        return "bg-amber-500";
      case "red":
        return "bg-red-500";
      case "pink":
        return "bg-pink-500";
      case "indigo":
        return "bg-indigo-500";
      default:
        return "bg-slate-400";
    }
  };

  // Get details information
  const getClasseDetails = (c: Classe) => {
    const classStudents = store.alunos.filter((a) => a.classe_id === c.id);
    const totalStudents = classStudents.length;

    // Cursos vinculados: courses that have at least one student from this class enrolled
    const studentIds = classStudents.map((s) => s.id);
    const enrolledCourseIds = store.curso_aluno
      .filter((ca) => studentIds.includes(ca.aluno_id))
      .map((ca) => ca.curso_id);
    const linkedCourses = store.cursos.filter((course) =>
      enrolledCourseIds.includes(course.id) || course.professor === c.professor
    );

    // Última aula registrada
    const classLessons = store.aulas
      .filter((a) => a.classe_id === c.id)
      .sort((a, b) => new Date(b.data_aula).getTime() - new Date(a.data_aula).getTime());
    const lastLesson = classLessons[0] || null;

    return {
      totalStudents,
      linkedCourses,
      lastLesson,
    };
  };

  const toggleSort = (field: "nome" | "departamento" | "alunos") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 relative min-h-[calc(100vh-10rem)]">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <BookOpen className="h-5.5 w-5.5 text-primary" />
            Classes
          </h3>
          <p className="text-xs text-slate-500 font-medium">Cadastre e gerencie as turmas da Escola Bíblica.</p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 h-9 px-4 cursor-pointer shadow-soft hidden sm:flex"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Classe</span>
        </Button>
      </div>

      {/* Search and Filters Bar */}
      <div className="space-y-3 bg-white p-4 rounded-2xl shadow-soft border border-slate-50">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Pesquisar classe por nome, departamento, professor ou sala..."
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-50 animate-fade-in">
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
                <option value="ATIVA">Ativa</option>
                <option value="INATIVA">Inativa</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Departamento</Label>
              <select
                value={filterDept}
                onChange={(e) => {
                  setFilterDept(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white text-xs px-3 h-9 font-medium text-slate-700 focus:outline-none"
              >
                <option value="all">Todos</option>
                {uniqueDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
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
                {uniqueProfessors.map((prof) => (
                  <option key={prof} value={prof}>
                    {prof}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Faixa Etária</Label>
              <select
                value={filterAge}
                onChange={(e) => {
                  setFilterAge(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white text-xs px-3 h-9 font-medium text-slate-700 focus:outline-none"
              >
                <option value="all">Todas</option>
                {uniqueAgeGroups.map((age) => (
                  <option key={age} value={age}>
                    {age}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Sorting bar (desktop) */}
      <div className="hidden md:flex items-center justify-end gap-4 text-xs font-semibold text-slate-500 bg-slate-50/50 p-2 px-4 rounded-xl border border-slate-100">
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
          onClick={() => toggleSort("departamento")}
          className={`flex items-center gap-1 hover:text-slate-800 cursor-pointer ${
            sortBy === "departamento" ? "text-primary font-bold" : ""
          }`}
        >
          Departamento
          <ArrowUpDown className="h-3 w-3" />
        </button>
        <button
          onClick={() => toggleSort("alunos")}
          className={`flex items-center gap-1 hover:text-slate-800 cursor-pointer ${
            sortBy === "alunos" ? "text-primary font-bold" : ""
          }`}
        >
          Alunos
          <ArrowUpDown className="h-3 w-3" />
        </button>
      </div>

      {/* Classes List */}
      {sortedClasses.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-soft border border-slate-100 text-center animate-fade-in py-16">
          <div className="h-14 w-14 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
            <FolderOpen className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Nenhuma classe encontrada</h4>
          <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed font-medium">
            Tente alterar os filtros de busca ou crie uma nova classe do zero.
          </p>
          <Button
            onClick={handleOpenCreate}
            className="mt-5 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-xl px-5 py-2 cursor-pointer shadow-soft"
          >
            Cadastrar Classe
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl shadow-soft border border-slate-50 overflow-hidden">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4 pl-6">Cor</th>
                  <th className="p-4">Nome</th>
                  <th className="p-4">Departamento</th>
                  <th className="p-4">Faixa Etária</th>
                  <th className="p-4">Professor</th>
                  <th className="p-4">Sala</th>
                  <th className="p-4 text-center">Alunos</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 pr-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                {currentClasses.map((c) => {
                  const details = getClasseDetails(c);
                  const isAtiva = c.status === "ATIVA";

                  return (
                    <tr
                      key={c.id}
                      onClick={() => {
                        setSelectedClasse(c);
                        setIsDetailsOpen(true);
                      }}
                      className="hover:bg-slate-50/50 cursor-pointer transition-colors duration-150"
                    >
                      <td className="p-4 pl-6">
                        <div className={`h-3 w-3 rounded-full ${getCorIndicator(c.cor)}`} />
                      </td>
                      <td className="p-4 font-bold text-slate-800">{c.nome}</td>
                      <td className="p-4">{c.departamento || "Geral"}</td>
                      <td className="p-4">{c.faixa_etaria || "Livre"}</td>
                      <td className="p-4">{c.professor}</td>
                      <td className="p-4">{c.sala || "Sem sala"}</td>
                      <td className="p-4 text-center font-bold text-slate-800">{details.totalStudents}</td>
                      <td className="p-4 text-center">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(c);
                          }}
                          className={`text-[9px] font-bold px-2 py-0.75 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${
                            isAtiva ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {c.status}
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
                                setSelectedClasse(c);
                                setIsDetailsOpen(true);
                              }}
                              className="text-slate-600 text-xs font-medium focus:bg-slate-50 cursor-pointer py-2 rounded-lg flex items-center gap-2"
                            >
                              <Eye className="h-3.5 w-3.5 text-slate-400" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenEdit(c)}
                              className="text-slate-600 text-xs font-medium focus:bg-slate-50 cursor-pointer py-2 rounded-lg flex items-center gap-2"
                            >
                              <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDuplicate(c)}
                              className="text-slate-600 text-xs font-medium focus:bg-slate-50 cursor-pointer py-2 rounded-lg flex items-center gap-2"
                            >
                              <Copy className="h-3.5 w-3.5 text-slate-400" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(c)}
                              className="text-slate-600 text-xs font-medium focus:bg-slate-50 cursor-pointer py-2 rounded-lg flex items-center gap-2"
                            >
                              <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
                              {isAtiva ? "Inativar" : "Reativar"}
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden grid grid-cols-1 gap-4">
            {currentClasses.map((c) => {
              const details = getClasseDetails(c);
              const isAtiva = c.status === "ATIVA";

              return (
                <Card
                  key={c.id}
                  onClick={() => {
                    setSelectedClasse(c);
                    setIsDetailsOpen(true);
                  }}
                  className="border-none shadow-soft bg-white rounded-2xl flex flex-col justify-between hover:shadow-elevated transition-shadow duration-200 cursor-pointer relative overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${getCorIndicator(c.cor)}`} />
                  <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0 pl-6">
                    <div className="min-w-0 pr-4">
                      <CardTitle className="text-sm font-bold text-slate-800 tracking-tight leading-snug truncate">
                        {c.nome}
                      </CardTitle>
                      <CardDescription className="text-[11px] font-semibold text-slate-400 mt-0.5">
                        {details.totalStudents} {details.totalStudents === 1 ? "aluno" : "alunos"}
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <span
                        onClick={() => handleToggleStatus(c)}
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
                            onClick={() => {
                              setSelectedClasse(c);
                              setIsDetailsOpen(true);
                            }}
                            className="text-slate-600 text-xs font-medium focus:bg-slate-50 cursor-pointer py-2 rounded-lg flex items-center gap-2"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-400" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenEdit(c)}
                            className="text-slate-600 text-xs font-medium focus:bg-slate-50 cursor-pointer py-2 rounded-lg flex items-center gap-2"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDuplicate(c)}
                            className="text-slate-600 text-xs font-medium focus:bg-slate-50 cursor-pointer py-2 rounded-lg flex items-center gap-2"
                          >
                            <Copy className="h-3.5 w-3.5 text-slate-400" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(c)}
                            className="text-slate-600 text-xs font-medium focus:bg-slate-50 cursor-pointer py-2 rounded-lg flex items-center gap-2"
                          >
                            <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
                            {isAtiva ? "Inativar" : "Reativar"}
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

                  <CardContent className="p-4 pt-2 pl-6 flex-1 flex flex-col justify-between">
                    <div className="grid grid-cols-2 gap-2 mb-3 text-[11px] font-semibold text-slate-500">
                      <div>Depto: {c.departamento || "Geral"}</div>
                      <div>Idade: {c.faixa_etaria || "Livre"}</div>
                    </div>
                    
                    <div className="border-t border-slate-50 pt-3 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                      <span className="flex items-center gap-1 truncate max-w-[140px]">
                        <User className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
                        <span className="truncate">{c.professor}</span>
                      </span>
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <MapPin className="h-3.5 w-3.5 text-slate-300" />
                        <span>{c.sala || "Sem sala"}</span>
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
      <Button
        onClick={handleOpenCreate}
        className="sm:hidden fixed right-4 bottom-20 h-12 w-12 rounded-full bg-primary hover:bg-primary/95 text-white shadow-[0_4px_12px_rgba(20,83,45,0.3)] z-40 flex items-center justify-center cursor-pointer border border-primary/20"
      >
        <Plus className="h-6 w-6 text-white" />
      </Button>

      {/* FORM DIALOG (NEW/EDIT) */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-none shadow-elevated overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800 tracking-tight">
              {editingClasse ? "Editar Classe" : "Nova Classe"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 font-medium">
              Preencha os campos abaixo para salvar as informações da turma.
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
                className={`rounded-xl border-slate-200 text-xs py-5 ${
                  errors.nome ? "border-red-400 focus-visible:ring-red-400" : ""
                }`}
              />
              {errors.nome && <p className="text-[10px] text-red-500 font-semibold">{errors.nome}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="departamento" className="text-xs font-semibold text-slate-600">
                  Departamento
                </Label>
                <Input
                  id="departamento"
                  value={departamento}
                  onChange={(e) => setDepartamento(e.target.value)}
                  placeholder="Ex: Jovens"
                  className="rounded-xl border-slate-200 text-xs py-5"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="faixaEtaria" className="text-xs font-semibold text-slate-600">
                  Faixa Etária *
                </Label>
                <Input
                  id="faixaEtaria"
                  value={faixaEtaria}
                  onChange={(e) => setFaixaEtaria(e.target.value)}
                  placeholder="Ex: 15 a 25 anos"
                  className={`rounded-xl border-slate-200 text-xs py-5 ${
                    errors.faixaEtaria ? "border-red-400 focus-visible:ring-red-400" : ""
                  }`}
                />
                {errors.faixaEtaria && (
                  <p className="text-[10px] text-red-500 font-semibold">{errors.faixaEtaria}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="professor" className="text-xs font-semibold text-slate-600">
                  Professor Titular *
                </Label>
                <Input
                  id="professor"
                  value={professor}
                  onChange={(e) => setProfessor(e.target.value)}
                  placeholder="Nome do professor titular"
                  className={`rounded-xl border-slate-200 text-xs py-5 ${
                    errors.professor ? "border-red-400 focus-visible:ring-red-400" : ""
                  }`}
                />
                {errors.professor && (
                  <p className="text-[10px] text-red-500 font-semibold">{errors.professor}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="professorAuxiliar" className="text-xs font-semibold text-slate-600">
                  Professor Auxiliar
                </Label>
                <Input
                  id="professorAuxiliar"
                  value={professorAuxiliar}
                  onChange={(e) => setProfessorAuxiliar(e.target.value)}
                  placeholder="Nome do auxiliar (opcional)"
                  className="rounded-xl border-slate-200 text-xs py-5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="sala" className="text-xs font-semibold text-slate-600">
                  Sala de Aula
                </Label>
                <Input
                  id="sala"
                  value={sala}
                  onChange={(e) => setSala(e.target.value)}
                  placeholder="Ex: Sala 03 Anexo"
                  className="rounded-xl border-slate-200 text-xs py-5"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-semibold text-slate-600">
                  Status *
                </Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-white text-xs px-3 h-10 font-medium text-slate-700 focus:outline-none"
                >
                  <option value="ATIVA">Ativa</option>
                  <option value="INATIVA">Inativa</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Cor Temática</Label>
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {["emerald", "blue", "purple", "amber", "red", "pink", "indigo"].map((colorName) => (
                    <button
                      key={colorName}
                      type="button"
                      onClick={() => setCor(colorName)}
                      className={`h-6.5 w-6.5 rounded-full border flex items-center justify-center transition-all ${getCorIndicator(
                        colorName
                      )} ${cor === colorName ? "ring-2 ring-primary ring-offset-2 scale-110" : "opacity-80"}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="observacoes" className="text-xs font-semibold text-slate-600">
                Observações
              </Label>
              <textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Notas extras, objetivos ou histórico da classe..."
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
      <Sheet open={isDetailsOpen && selectedClasse !== null} onOpenChange={setIsDetailsOpen}>
        {selectedClasse && (
          <SheetContent className="w-full sm:max-w-md border-l border-slate-100 bg-slate-50 p-0 flex flex-col h-full overflow-hidden shadow-elevated">
            {/* Header section with theme color */}
            <div className="bg-white p-5 border-b border-slate-100 flex-shrink-0 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center border ${getCorBackground(selectedClasse.cor)}`}>
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-800 tracking-tight leading-tight truncate">
                    {selectedClasse.nome}
                  </h4>
                  <p className="text-[11px] font-semibold text-slate-400 mt-0.5 truncate">
                    Depto: {selectedClasse.departamento || "Geral"} • Faixa: {selectedClasse.faixa_etaria || "Livre"}
                  </p>
                </div>
              </div>
              <span
                onClick={() => handleToggleStatus(selectedClasse)}
                className={`text-[9px] font-bold px-2 py-0.75 rounded-full flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity ${
                  selectedClasse.status === "ATIVA"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {selectedClasse.status}
              </span>
            </div>

            {/* Scrollable details */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Informações Gerais */}
              <Card className="border-none shadow-soft bg-white rounded-xl">
                <CardHeader className="p-4 pb-2">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estrutura & Liderança</h5>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3.5 text-xs font-semibold text-slate-600">
                  <div className="flex items-center gap-2.5 text-slate-500">
                    <User className="h-4.5 w-4.5 text-slate-300" />
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Professor Titular</p>
                      <p className="text-xs font-bold text-slate-700 leading-normal">{selectedClasse.professor}</p>
                    </div>
                  </div>

                  {selectedClasse.professor_auxiliar && (
                    <div className="flex items-center gap-2.5 text-slate-500">
                      <User className="h-4.5 w-4.5 text-slate-300" />
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Professor Auxiliar</p>
                        <p className="text-xs font-bold text-slate-700 leading-normal">{selectedClasse.professor_auxiliar}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 text-slate-500">
                    <MapPin className="h-4.5 w-4.5 text-slate-300" />
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Local / Sala</p>
                      <p className="text-xs font-bold text-slate-700 leading-normal">{selectedClasse.sala || "Sem sala cadastrada"}</p>
                    </div>
                  </div>

                  {selectedClasse.observacoes && (
                    <div className="border-t border-slate-50 pt-3">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Observações</p>
                      <p className="text-[11px] font-medium text-slate-500 leading-relaxed font-sans">{selectedClasse.observacoes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Estatísticas e Participação */}
              <div className="grid grid-cols-1 gap-4">
                <Card className="border-none shadow-soft bg-white rounded-xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total de Alunos</h6>
                        <h5 className="text-base font-bold text-slate-800 mt-0.5">
                          {getClasseDetails(selectedClasse).totalStudents} Matriculados
                        </h5>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setIsDetailsOpen(false);
                        navigate({ to: "/alunos", search: { classeId: selectedClasse.id } });
                      }}
                      variant="outline"
                      className="rounded-xl text-[10px] font-bold border-slate-100 text-primary h-8 hover:bg-slate-50 cursor-pointer"
                    >
                      Ver Alunos
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Cursos Vinculados */}
              <Card className="border-none shadow-soft bg-white rounded-xl">
                <CardHeader className="p-4 pb-2">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cursos Vinculados</h5>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  {getClasseDetails(selectedClasse).linkedCourses.length === 0 ? (
                    <p className="text-[11px] text-slate-400 font-semibold text-center py-2">
                      Nenhum curso especial vinculado aos alunos desta classe.
                    </p>
                  ) : (
                    getClasseDetails(selectedClasse).linkedCourses.map((course) => (
                      <div
                        key={course.id}
                        onClick={() => {
                          setIsDetailsOpen(false);
                          navigate({ to: "/cursos", search: { detalhe: course.id } });
                        }}
                        className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg border border-slate-50 cursor-pointer transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-700 truncate leading-snug">{course.nome}</p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-none">Prof: {course.professor || "N/A"}</p>
                        </div>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                          course.status === "EM_ANDAMENTO" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                        }`}>
                          {course.status}
                        </span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Última Aula Registrada */}
              <Card className="border-none shadow-soft bg-white rounded-xl">
                <CardHeader className="p-4 pb-2">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Última Aula Registrada</h5>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {getClasseDetails(selectedClasse).lastLesson ? (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-300" />
                          {getClasseDetails(selectedClasse).lastLesson?.data_aula.split("-").reverse().join("/")}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">Lição #{getClasseDetails(selectedClasse).lastLesson?.numero_licao}</span>
                      </div>
                      <p className="font-semibold text-slate-600 leading-snug">Tema: {getClasseDetails(selectedClasse).lastLesson?.tema}</p>
                      {getClasseDetails(selectedClasse).lastLesson?.observacoes && (
                        <p className="text-[10px] text-slate-400 leading-relaxed italic">Obs: {getClasseDetails(selectedClasse).lastLesson?.observacoes}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 font-semibold text-center py-2">
                      Nenhuma aula registrada para esta classe ainda.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-2 gap-3 flex-shrink-0">
              <Button
                onClick={() => handleOpenEdit(selectedClasse)}
                className="w-full rounded-xl text-xs font-semibold bg-primary hover:bg-primary/95 text-white h-10 cursor-pointer shadow-soft"
              >
                Editar Classe
              </Button>
              <Button
                onClick={() => setDeletingClasseId(selectedClasse.id)}
                variant="outline"
                className="w-full rounded-xl text-xs font-semibold border-red-100 hover:bg-red-50 text-red-600 h-10 cursor-pointer"
              >
                Excluir Classe
              </Button>
            </div>
          </SheetContent>
        )}
      </Sheet>

      {/* DELETE CONFIRM ALERT DIALOG */}
      <AlertDialog open={deletingClasseId !== null} onOpenChange={(open) => !open && setDeletingClasseId(null)}>
        <AlertDialogContent className="rounded-2xl border-none shadow-elevated sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Excluir Classe?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-400 leading-relaxed font-medium">
              Esta ação é permanente e não poderá ser desfeita. A classe só será excluída se não possuir alunos matriculados ou aulas registradas (histórico acadêmico).
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

// Icon helper for refresh status (Import standard Lucide icon or fallback)
function RefreshCw(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}
