import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  useEbdStore,
  addAluno,
  updateAluno,
  deleteAluno,
  Aluno,
  Classe,
} from "@/lib/store";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  Check,
  X,
  User,
  ArrowRightLeft,
  Mail,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  History,
  Eye
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const searchSchema = z.object({
  novo: z.string().optional(),
  detalhe: z.string().optional(),
  classeId: z.string().optional(),
});

export const Route = createFileRoute("/_app/alunos")({
  validateSearch: (search) => searchSchema.parse(search),
  component: AlunosPage,
});

const ROLES_OPTIONS = ["Aluno", "Visitante"];

function AlunosPage() {
  const store = useEbdStore();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  // Dialog & Drawer States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPessoa, setSelectedPessoa] = useState<Aluno | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingPessoa, setEditingPessoa] = useState<Aluno | null>(null);
  const [deletingPessoaId, setDeletingPessoaId] = useState<string | null>(null);

  // Filters State
  const [searchText, setSearchText] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [filterSex, setFilterSex] = useState("all");
  const [filterAgeGroup, setFilterAgeGroup] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Sorting and Pagination State
  const [sortBy, setSortBy] = useState<"nome" | "classe" | "status" | "ingresso">("nome");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Form State
  const [nome, setNome] = useState("");
  const [sexo, setSexo] = useState<"MASCULINO" | "FEMININO" | "">("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [classeId, setClasseId] = useState("");
  const [dataIngresso, setDataIngresso] = useState("");
  const [funcoes, setFuncoes] = useState<string[]>(["Aluno"]);
  const [status, setStatus] = useState<"ATIVO" | "VISITANTE" | "INATIVO">("ATIVO");
  const [observacoes, setObservacoes] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auth State
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>("STUDENT");

  useEffect(() => {
    async function loadAuth() {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUserId(session.user.id);
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .maybeSingle();
          setCurrentUserRole(profile?.role || session.user.user_metadata?.role || "STUDENT");
        }
      } else {
        // Fallback para demo
        setCurrentUserRole("ADMIN");
      }
    }
    loadAuth();
  }, []);

  // Helper de Permissão
  const canManageStudent = (aluno: Aluno | null = null) => {
    if (currentUserRole === "ADMIN") return true;
    if (currentUserRole === "TEACHER") {
      if (!aluno) return true; 
      const targetClass = store.classes.find(c => c.id === aluno.classe_id);
      if (targetClass && targetClass.professor_id === currentUserId) return true;
    }
    return false;
  };

  // Auto-filter by class if query param exists
  useEffect(() => {
    if (search.classeId) {
      setFilterClass(search.classeId);
      setShowFilters(true);
      navigate({ search: {} });
    }
  }, [search.classeId]);

  // Auto-open modal or details if query param exists
  useEffect(() => {
    if (search.novo === "true") {
      handleOpenCreate();
      navigate({ search: {} });
    }
  }, [search.novo]);

  useEffect(() => {
    if (search.detalhe) {
      const p = store.alunos.find((a) => a.id === search.detalhe);
      if (p) {
        setSelectedPessoa(p);
        setIsDetailsOpen(true);
      }
      navigate({ search: {} });
    }
  }, [search.detalhe, store.alunos]);

  // Keep selectedPessoa in sync
  useEffect(() => {
    if (selectedPessoa) {
      const updated = store.alunos.find((a) => a.id === selectedPessoa.id);
      if (updated) {
        setSelectedPessoa(updated);
      }
    }
  }, [store.alunos, selectedPessoa]);

  const handleOpenCreate = () => {
    setEditingPessoa(null);
    setNome("");
    setSexo("");
    setDataNascimento("");
    setTelefone("");
    setEmail("");
    setEndereco("");
    // Default to first active class
    const activeClasses = store.classes.filter((c) => c.status === "ATIVA");
    setClasseId(activeClasses.length > 0 ? activeClasses[0].id : "");
    setDataIngresso(new Date().toISOString().split("T")[0]);
    setFuncoes(["Aluno"]);
    setStatus("ATIVO");
    setObservacoes("");
    setErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: Aluno) => {
    setEditingPessoa(p);
    setNome(p.nome);
    setSexo(p.sexo || "");
    setDataNascimento(p.data_nascimento || "");
    setTelefone(p.telefone || "");
    setEmail(p.email || "");
    setEndereco(p.endereco || "");
    setClasseId(p.classe_id);
    setDataIngresso(p.data_ingresso || "");
    setFuncoes(p.funcoes || ["Aluno"]);
    setStatus(p.status);
    setObservacoes(p.observacoes || "");
    setErrors({});
    setIsFormOpen(true);
    setIsDetailsOpen(false);
  };

  const handleToggleStatus = (p: Aluno) => {
    try {
      const newStatus = p.status === "INATIVO" ? "ATIVO" : "INATIVO";
      updateAluno({
        ...p,
        status: newStatus,
      });
      toast.success(`Pessoa ${newStatus === "ATIVO" ? "reativada" : "inativada"} com sucesso.`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar o status.");
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!nome.trim()) newErrors.nome = "O nome completo é obrigatório.";
    
    // Classe obrigatória para alunos
    if (funcoes.includes("Aluno") && !classeId) {
      newErrors.classeId = "A classe é obrigatória para Alunos.";
    } else if (!classeId) {
      newErrors.classeId = "A classe é obrigatória.";
    }

    if (funcoes.length === 0) {
      newErrors.funcoes = "Selecione pelo menos uma função/papel.";
    }

    // Duplicate check: name and telephone
    if (nome.trim() && telefone.trim()) {
      const exists = store.alunos.some(
        (a) =>
          a.id !== editingPessoa?.id &&
          a.nome.trim().toLowerCase() === nome.trim().toLowerCase() &&
          a.telefone === telefone.trim()
      );
      if (exists) {
        newErrors.nome = "Duplicidade: Já existe alguém cadastrado com este nome e telefone.";
        newErrors.telefone = "Duplicidade: Já existe alguém cadastrado com este nome e telefone.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Preencha todos os campos obrigatórios corretamente.");
      return;
    }

    try {
      const payload = {
        nome: nome.trim(),
        sexo: (sexo as any) || null,
        data_nascimento: dataNascimento || null,
        telefone: telefone.trim() || null,
        email: email.trim() || null,
        endereco: endereco.trim() || null,
        classe_id: classeId,
        data_ingresso: dataIngresso || new Date().toISOString().split("T")[0],
        funcoes,
        status,
        observacoes: observacoes.trim() || null,
      };

      if (editingPessoa) {
        updateAluno({
          id: editingPessoa.id,
          ...payload,
        });
        toast.success("Cadastro atualizado com sucesso!");
      } else {
        addAluno(payload);
        toast.success("Pessoa cadastrada com sucesso!");
      }
      setIsFormOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar os dados.");
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingPessoaId) {
      try {
        deleteAluno(deletingPessoaId);
        toast.success("Pessoa excluída com sucesso.");
        setDeletingPessoaId(null);
        setIsDetailsOpen(false);
      } catch (err: any) {
        toast.error(err.message || "Erro ao excluir.");
        setDeletingPessoaId(null);
      }
    }
  };

  const handleRoleCheckboxChange = (role: string) => {
    if (funcoes.includes(role)) {
      setFuncoes(funcoes.filter((f) => f !== role));
    } else {
      setFuncoes([...funcoes, role]);
    }
  };

  // Helper: Calculate age and group
  const getAgeGroup = (birthDateStr: string | null) => {
    if (!birthDateStr) return "Não informado";
    try {
      const birth = new Date(birthDateStr);
      const age = new Date().getFullYear() - birth.getFullYear();
      if (age < 12) return "Infantil";
      if (age >= 12 && age <= 25) return "Juvenil/Jovem";
      return "Adulto";
    } catch {
      return "Não informado";
    }
  };

  // Filters logic
  const filteredPessoas = store.alunos.filter((a) => {
    // Only show students or visitors
    const isStudentOrVisitor = a.funcoes?.includes("Aluno") || a.funcoes?.includes("Visitante") || (!a.funcoes?.includes("Professor") && !a.funcoes?.includes("Professor Auxiliar") && !a.funcoes?.includes("Administrador"));
    if (!isStudentOrVisitor) return false;

    const matchSearch =
      a.nome.toLowerCase().includes(searchText.toLowerCase()) ||
      (a.email && a.email.toLowerCase().includes(searchText.toLowerCase())) ||
      (a.telefone && a.telefone.includes(searchText));

    const matchRole = filterRole === "all" || (a.funcoes && a.funcoes.includes(filterRole));
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    const matchClass = filterClass === "all" || a.classe_id === filterClass;
    const matchSex = filterSex === "all" || a.sexo === filterSex;

    let matchAge = true;
    if (filterAgeGroup !== "all") {
      const group = getAgeGroup(a.data_nascimento);
      matchAge = group === filterAgeGroup;
    }

    return matchSearch && matchRole && matchStatus && matchClass && matchSex && matchAge;
  });

  // Sorting
  const sortedPessoas = [...filteredPessoas].sort((a, b) => {
    let valA: any = a[sortBy === "classe" ? "classe_id" : sortBy === "ingresso" ? "data_ingresso" : sortBy];
    let valB: any = b[sortBy === "classe" ? "classe_id" : sortBy === "ingresso" ? "data_ingresso" : sortBy];

    if (sortBy === "classe") {
      valA = store.classes.find((c) => c.id === a.classe_id)?.nome || "";
      valB = store.classes.find((c) => c.id === b.classe_id)?.nome || "";
    }

    valA = (valA || "").toString().toLowerCase();
    valB = (valB || "").toString().toLowerCase();

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedPessoas.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPessoas = sortedPessoas.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const toggleSort = (field: "nome" | "classe" | "status" | "ingresso") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  // Details calculations
  const getPessoaStats = (p: Aluno) => {
    const classAulas = store.aulas.filter((aula) => aula.classe_id === p.classe_id);
    const totalAulas = classAulas.length;

    let presentCount = 0;
    let bibleCount = 0;

    classAulas.forEach((aula) => {
      const pres = aula.presencas[p.id];
      if (pres) {
        if (pres.presente) presentCount++;
        if (pres.presente && pres.trouxe_biblia) bibleCount++;
      }
    });

    const attendanceRate = totalAulas > 0 ? Math.round((presentCount / totalAulas) * 100) : 0;
    const bibleRate = presentCount > 0 ? Math.round((bibleCount / presentCount) * 100) : 0;

    return {
      attendanceRate,
      bibleRate,
      totalAulas,
      presentCount,
    };
  };

  const getPessoaTimeline = (p: Aluno) => {
    return store.historico_classes
      .filter((h) => h.aluno_id === p.id)
      .sort((a, b) => new Date(b.data_evento).getTime() - new Date(a.data_evento).getTime());
  };

  const getStatusColor = (s: Aluno["status"]) => {
    switch (s) {
      case "ATIVO":
        return "bg-emerald-50 text-emerald-600 border border-emerald-100";
      case "VISITANTE":
        return "bg-blue-50 text-blue-600 border border-blue-100";
      case "INATIVO":
        return "bg-slate-100 text-slate-500 border border-slate-200";
      default:
        return "bg-slate-50 text-slate-500";
    }
  };

  return (
    <div className="space-y-6 relative min-h-[calc(100vh-10rem)]">
      {/* Header and Action */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="h-5.5 w-5.5 text-primary" />
            Alunos
          </h3>
          <p className="text-xs text-slate-500 font-medium">Controle de matrículas de alunos e visitantes.</p>
        </div>
        {canManageStudent() && (
          <Button
            onClick={handleOpenCreate}
            className="bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 h-9 px-4 cursor-pointer shadow-soft"
          >
            <Plus className="h-4 w-4" />
            <span>Cadastrar Aluno</span>
          </Button>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="space-y-3 bg-white p-4 rounded-2xl shadow-soft border border-slate-50">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Pesquisar por nome, email ou telefone..."
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-slate-50 animate-fade-in">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Função</Label>
              <select
                value={filterRole}
                onChange={(e) => {
                  setFilterRole(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white text-xs px-3 h-9 font-medium text-slate-700 focus:outline-none"
              >
                <option value="all">Todas as Funções</option>
                {ROLES_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

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
                <option value="ATIVO">Ativo</option>
                <option value="VISITANTE">Visitante</option>
                <option value="INATIVO">Inativo</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Classe</Label>
              <select
                value={filterClass}
                onChange={(e) => {
                  setFilterClass(e.target.value);
                  setCurrentPage(1);
                }}
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
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sexo</Label>
              <select
                value={filterSex}
                onChange={(e) => {
                  setFilterSex(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white text-xs px-3 h-9 font-medium text-slate-700 focus:outline-none"
              >
                <option value="all">Todos</option>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMININO">Feminino</option>
              </select>
            </div>

            <div className="space-y-1 col-span-2 md:col-span-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Faixa Etária</Label>
              <select
                value={filterAgeGroup}
                onChange={(e) => {
                  setFilterAgeGroup(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white text-xs px-3 h-9 font-medium text-slate-700 focus:outline-none"
              >
                <option value="all">Todas</option>
                <option value="Infantil">Infantil (Menor de 12)</option>
                <option value="Juvenil/Jovem">Juvenil/Jovem (12 a 25)</option>
                <option value="Adulto">Adulto (Maior de 25)</option>
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
          onClick={() => toggleSort("classe")}
          className={`flex items-center gap-1 hover:text-slate-800 cursor-pointer ${
            sortBy === "classe" ? "text-primary font-bold" : ""
          }`}
        >
          Classe
          <ArrowUpDown className="h-3 w-3" />
        </button>
        <button
          onClick={() => toggleSort("status")}
          className={`flex items-center gap-1 hover:text-slate-800 cursor-pointer ${
            sortBy === "status" ? "text-primary font-bold" : ""
          }`}
        >
          Status
          <ArrowUpDown className="h-3 w-3" />
        </button>
        <button
          onClick={() => toggleSort("ingresso")}
          className={`flex items-center gap-1 hover:text-slate-800 cursor-pointer ${
            sortBy === "ingresso" ? "text-primary font-bold" : ""
          }`}
        >
          Data Ingresso
          <ArrowUpDown className="h-3 w-3" />
        </button>
      </div>

      {/* List content */}
      {sortedPessoas.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-soft border border-slate-100 text-center py-16">
          <div className="h-14 w-14 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
            <Users className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Nenhum aluno cadastrado</h4>
          <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed font-medium">
            Registre alunos ou visitantes para suas classes.
          </p>
          {canManageStudent() && (
            <Button
              onClick={handleOpenCreate}
              className="mt-5 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-xl px-5 py-2 cursor-pointer shadow-soft"
            >
              Cadastrar Primeira Pessoa
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl shadow-soft border border-slate-50 overflow-hidden">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4 pl-6">Nome</th>
                  <th className="p-4">Funções</th>
                  <th className="p-4">Classe</th>
                  <th className="p-4">Telefone</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4">Ingresso</th>
                  <th className="p-4 pr-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                {currentPessoas.map((p) => {
                  const targetClass = store.classes.find((c) => c.id === p.classe_id);
                  const formattedEntry = p.data_ingresso ? p.data_ingresso.split("-").reverse().join("/") : "N/D";

                  return (
                    <tr
                      key={p.id}
                      onClick={() => {
                        setSelectedPessoa(p);
                        setIsDetailsOpen(true);
                      }}
                      className="hover:bg-slate-50/50 cursor-pointer transition-colors duration-150"
                    >
                      <td className="p-4 pl-6 font-bold text-slate-800">{p.nome}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {p.funcoes?.map((f) => (
                            <span
                              key={f}
                              className={`text-[9px] font-bold px-1.75 py-0.5 rounded-full ${
                                f === "Professor"
                                  ? "bg-purple-50 text-purple-600"
                                  : f === "Visitante"
                                  ? "bg-blue-50 text-blue-600"
                                  : f === "Administrador"
                                  ? "bg-red-50 text-red-600"
                                  : "bg-emerald-50 text-emerald-600"
                              }`}
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">{targetClass ? targetClass.nome : "Sem classe"}</td>
                      <td className="p-4">{p.telefone || "Não informado"}</td>
                      <td className="p-4 text-center">
                        <span className={`text-[9px] font-bold px-2 py-0.75 rounded-full ${getStatusColor(p.status)}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4">{formattedEntry}</td>
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
                                setSelectedPessoa(p);
                                setIsDetailsOpen(true);
                              }}
                              className="text-slate-600 text-xs font-medium focus:bg-slate-50 cursor-pointer py-2 rounded-lg flex items-center gap-2"
                            >
                              <Eye className="h-3.5 w-3.5 text-slate-400" />
                              Visualizar
                            </DropdownMenuItem>
                            {canManageStudent(p) && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleOpenEdit(p)}
                                  className="text-slate-600 text-xs font-medium focus:bg-slate-50 cursor-pointer py-2 rounded-lg flex items-center gap-2"
                                >
                                  <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleToggleStatus(p)}
                                  className="text-slate-600 text-xs font-medium focus:bg-slate-50 cursor-pointer py-2 rounded-lg flex items-center gap-2"
                                >
                                  <User className="h-3.5 w-3.5 text-slate-400" />
                                  {p.status === "INATIVO" ? "Reativar" : "Inativar"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeletingPessoaId(p.id)}
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

          {/* Mobile Card List */}
          <div className="md:hidden grid grid-cols-1 gap-4">
            {currentPessoas.map((p) => {
              const targetClass = store.classes.find((c) => c.id === p.classe_id);
              const initials = p.nome
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <Card
                  key={p.id}
                  onClick={() => {
                    setSelectedPessoa(p);
                    setIsDetailsOpen(true);
                  }}
                  className="border-none shadow-soft bg-white rounded-2xl flex flex-col justify-between hover:shadow-elevated transition-shadow duration-200 cursor-pointer"
                >
                  <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center font-bold text-xs border border-slate-100 flex-shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800 leading-snug truncate">
                          {p.nome}
                        </h4>
                        <p className="text-[10px] sm:text-xs font-semibold text-slate-400 truncate mt-0.5">
                          {targetClass ? targetClass.nome : "Sem classe"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <span className={`text-[9px] font-bold px-2 py-0.75 rounded-full ${getStatusColor(p.status)}`}>
                        {p.status}
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
                              setSelectedPessoa(p);
                              setIsDetailsOpen(true);
                            }}
                            className="text-slate-600 text-xs font-medium focus:bg-slate-50 cursor-pointer py-2 rounded-lg flex items-center gap-2"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-400" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenEdit(p)}
                            className="text-slate-600 text-xs font-medium focus:bg-slate-50 cursor-pointer py-2 rounded-lg flex items-center gap-2"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(p)}
                            className="text-slate-600 text-xs font-medium focus:bg-slate-50 cursor-pointer py-2 rounded-lg flex items-center gap-2"
                          >
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            {p.status === "INATIVO" ? "Reativar" : "Inativar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingPessoaId(p.id)}
                            className="text-red-600 text-xs font-medium focus:bg-red-50/50 cursor-pointer py-2 rounded-lg flex items-center gap-2"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-2 flex flex-col gap-2">
                    <div className="flex flex-wrap gap-1 mb-1">
                      {p.funcoes?.map((f) => (
                        <span key={f} className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-500">
                          {f}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
                      <Phone className="h-3.5 w-3.5 text-slate-300" />
                      <span>{p.telefone || "Não informado"}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
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

      {/* FORM DIALOG (NEW/EDIT) */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-none shadow-elevated overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800 tracking-tight">
              {editingPessoa ? "Editar Cadastro" : "Cadastrar Pessoa"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 font-medium">
              Preencha todos os campos cadastrais obrigatórios do participante.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="nome" className="text-xs font-semibold text-slate-600">
                Nome Completo *
              </Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: João da Silva Santos"
                className={`rounded-xl border-slate-200 text-xs py-5 ${errors.nome ? "border-red-400 focus-visible:ring-red-400" : ""}`}
              />
              {errors.nome && <p className="text-[10px] text-red-500 font-semibold">{errors.nome}</p>}
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
                  className="w-full rounded-xl border border-slate-200 bg-white text-xs px-3 h-10 font-medium text-slate-700 focus:outline-none"
                >
                  <option value="">Não Informado</option>
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMININO">Feminino</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dataNasc" className="text-xs font-semibold text-slate-600">
                  Data de Nascimento
                </Label>
                <Input
                  id="dataNasc"
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className="rounded-xl border-slate-200 text-xs py-5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="tel" className="text-xs font-semibold text-slate-600">
                  Telefone / WhatsApp
                </Label>
                <Input
                  id="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="Ex: (11) 98888-8888"
                  className={`rounded-xl border-slate-200 text-xs py-5 ${errors.telefone ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                />
                {errors.telefone && <p className="text-[10px] text-red-500 font-semibold">{errors.telefone}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-600">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@dominio.com"
                  className="rounded-xl border-slate-200 text-xs py-5"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="endereco" className="text-xs font-semibold text-slate-600">
                Endereço Residencial
              </Label>
              <Input
                id="endereco"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Rua, Número, Bairro, Cidade..."
                className="rounded-xl border-slate-200 text-xs py-5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="classeId" className="text-xs font-semibold text-slate-600">
                  Classe Vinculada *
                </Label>
                <select
                  id="classeId"
                  value={classeId}
                  onChange={(e) => setClasseId(e.target.value)}
                  className={`w-full rounded-xl border bg-white text-xs px-3 h-10 font-medium text-slate-700 focus:outline-none ${
                    errors.classeId ? "border-red-400" : "border-slate-200"
                  }`}
                >
                  <option value="">Selecione uma Classe</option>
                  {store.classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
                {errors.classeId && <p className="text-[10px] text-red-500 font-semibold">{errors.classeId}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-semibold text-slate-600">
                  Status Inicial
                </Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-white text-xs px-3 h-10 font-medium text-slate-700 focus:outline-none"
                >
                  <option value="ATIVO">Ativo</option>
                  <option value="VISITANTE">Visitante</option>
                  <option value="INATIVO">Inativo</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Funções / Papéis *</Label>
              <div className="flex flex-wrap gap-2.5 pt-1">
                {ROLES_OPTIONS.map((role) => {
                  const checked = funcoes.includes(role);
                  return (
                    <label
                      key={role}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        checked
                          ? "bg-primary/5 text-primary border-primary"
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleRoleCheckboxChange(role)}
                        className="hidden"
                      />
                      {checked && <Check className="h-3.5 w-3.5" />}
                      {role}
                    </label>
                  );
                })}
              </div>
              {errors.funcoes && <p className="text-[10px] text-red-500 font-semibold">{errors.funcoes}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="observacoes" className="text-xs font-semibold text-slate-600">
                Observações
              </Label>
              <textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações complementares..."
                rows={2.5}
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
      <Sheet open={isDetailsOpen && selectedPessoa !== null} onOpenChange={setIsDetailsOpen}>
        {selectedPessoa && (
          <SheetContent className="w-full sm:max-w-md border-l border-slate-100 bg-slate-50 p-0 flex flex-col h-full overflow-hidden shadow-elevated">
            {/* Header profile info */}
            <div className="bg-white p-5 border-b border-slate-100 flex-shrink-0 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20 flex-shrink-0">
                  {selectedPessoa.nome
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-800 tracking-tight leading-tight truncate">
                    {selectedPessoa.nome}
                  </h4>
                  <p className="text-[11px] font-semibold text-slate-400 mt-0.5 truncate">
                    {store.classes.find((c) => c.id === selectedPessoa.classe_id)?.nome || "Sem classe"}
                  </p>
                </div>
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.75 rounded-full flex-shrink-0 ${getStatusColor(selectedPessoa.status)}`}>
                {selectedPessoa.status}
              </span>
            </div>

            {/* Scrollable body content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Detailed cadastral card */}
              <Card className="border-none shadow-soft bg-white rounded-xl">
                <CardContent className="p-4 space-y-3.5 text-xs font-semibold text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <History className="h-4.5 w-4.5 text-slate-300 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.75">Funções / Papéis</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedPessoa.funcoes?.map((f) => (
                          <span key={f} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100 text-slate-600">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {selectedPessoa.email && (
                    <div className="flex items-center gap-2.5 text-slate-500">
                      <Mail className="h-4.5 w-4.5 text-slate-300" />
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">E-mail</p>
                        <p className="text-xs font-bold text-slate-700 leading-normal truncate">{selectedPessoa.email}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 text-slate-500">
                    <Phone className="h-4.5 w-4.5 text-slate-300" />
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Telefone</p>
                      <p className="text-xs font-bold text-slate-700 leading-normal">{selectedPessoa.telefone || "Não cadastrado"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-slate-500">
                    <Calendar className="h-4.5 w-4.5 text-slate-300" />
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Aniversário</p>
                      <p className="text-xs font-bold text-slate-700 leading-normal">
                        {selectedPessoa.data_nascimento
                          ? selectedPessoa.data_nascimento.split("-").reverse().join("/")
                          : "Não cadastrado"}
                      </p>
                    </div>
                  </div>

                  {selectedPessoa.endereco && (
                    <div className="flex items-start gap-2.5 text-slate-500">
                      <MapPin className="h-4.5 w-4.5 text-slate-300 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Endereço</p>
                        <p className="text-xs font-bold text-slate-700 leading-relaxed font-sans">{selectedPessoa.endereco}</p>
                      </div>
                    </div>
                  )}

                  {selectedPessoa.observacoes && (
                    <div className="border-t border-slate-50 pt-3">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Observações</p>
                      <p className="text-[11px] font-medium text-slate-500 leading-relaxed font-sans">{selectedPessoa.observacoes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Attendance and bible stats cards */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="border-none shadow-soft bg-white rounded-xl">
                  <CardContent className="p-3.5 flex flex-col items-center text-center">
                    <div className="h-8 w-8 rounded-lg bg-green-50 text-emerald-600 flex items-center justify-center mb-2">
                      <Users className="h-4 w-4" />
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Frequência</span>
                    <h5 className="text-base font-bold text-slate-800 mt-0.5">
                      {getPessoaStats(selectedPessoa).attendanceRate}%
                    </h5>
                    <p className="text-[9px] text-slate-400 font-semibold mt-1">
                      {getPessoaStats(selectedPessoa).presentCount} de {getPessoaStats(selectedPessoa).totalAulas} aulas
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-soft bg-white rounded-xl">
                  <CardContent className="p-3.5 flex flex-col items-center text-center">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Uso de Bíblia</span>
                    <h5 className="text-base font-bold text-slate-800 mt-0.5">
                      {getPessoaStats(selectedPessoa).bibleRate}%
                    </h5>
                    <p className="text-[9px] text-slate-400 font-semibold mt-1">das vezes presente</p>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs for Timeline History logs */}
              <Tabs defaultValue="moves" className="w-full">
                <TabsList className="grid w-full grid-cols-1 bg-slate-100 rounded-xl p-1 h-10">
                  <TabsTrigger value="moves" className="rounded-lg text-[11px] font-semibold">Jornada & Movimentações</TabsTrigger>
                </TabsList>

                <TabsContent value="moves" className="mt-3">
                  {getPessoaTimeline(selectedPessoa).length === 0 ? (
                    <div className="bg-white p-6 rounded-xl shadow-soft text-center text-slate-400 text-xs font-semibold">
                      Sem registros de movimentações no sistema.
                    </div>
                  ) : (
                    <div className="bg-white p-4 rounded-xl shadow-soft space-y-4">
                      {getPessoaTimeline(selectedPessoa).map((h, i) => {
                        const orig = store.classes.find((c) => c.id === h.classe_origem_id);
                        const dest = store.classes.find((c) => c.id === h.classe_destino_id);
                        const formattedTime = new Date(h.data_evento).toLocaleDateString("pt-BR");

                        return (
                          <div key={h.id} className="relative flex gap-3 text-xs leading-none">
                            {i < getPessoaTimeline(selectedPessoa).length - 1 && (
                              <div className="absolute left-3.5 top-8 bottom-0 w-0.5 bg-slate-100 -mb-6" />
                            )}

                            <div className="h-7 w-7 rounded-full bg-slate-50 text-slate-500 border border-slate-100 flex items-center justify-center flex-shrink-0 z-10">
                              <ArrowRightLeft className="h-3.5 w-3.5 text-slate-400" />
                            </div>

                            <div className="flex-1 min-w-0 py-0.5 space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-slate-800">{h.tipo}</span>
                                <span className="text-[9px] font-semibold text-slate-400">{formattedTime}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">{h.motivo}</p>
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

            {/* Edit/delete operations footer */}
            <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0 grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleOpenEdit(selectedPessoa)}
                className="w-full bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 h-10 cursor-pointer shadow-soft"
              >
                <Edit2 className="h-3.5 w-3.5" />
                Editar Cadastro
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeletingPessoaId(selectedPessoa.id)}
                className="w-full border-red-100 hover:bg-red-50 text-red-600 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 h-10 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Excluir
              </Button>
            </div>
          </SheetContent>
        )}
      </Sheet>

      {/* DELETE CONFIRM ALERT DIALOG */}
      <AlertDialog open={deletingPessoaId !== null} onOpenChange={(open) => !open && setDeletingPessoaId(null)}>
        <AlertDialogContent className="rounded-2xl border-none shadow-elevated sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Remover Pessoa?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-400 leading-relaxed font-medium">
              Esta ação removerá permanentemente o participante do sistema. Note que pessoas que possuem histórico acadêmico de movimentação não podem ser removidas fisicamente. Prefira inativar.
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
