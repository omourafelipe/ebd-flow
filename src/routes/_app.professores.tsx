import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  useEbdStore,
  addAluno,
  updateAluno,
  deleteAluno,
  Aluno,
} from "@/lib/store";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import {
  Users, Plus, Search, Filter, MoreVertical, Edit2, Trash2, Phone, Calendar, Check, Eye, User, ArrowRightLeft, Mail, MapPin, ChevronLeft, ChevronRight, ArrowUpDown, History
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const searchSchema = z.object({
  novo: z.string().optional(),
  detalhe: z.string().optional(),
  classeId: z.string().optional(),
});

export const Route = createFileRoute("/_app/professores")({
  validateSearch: (search) => searchSchema.parse(search),
  component: ProfessoresPage,
});

const ROLES_OPTIONS = ["Professor", "Professor Auxiliar", "Administrador"];

function ProfessoresPage() {
  const store = useEbdStore();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPessoa, setSelectedPessoa] = useState<Aluno | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingPessoa, setEditingPessoa] = useState<Aluno | null>(null);
  const [deletingPessoaId, setDeletingPessoaId] = useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [filterSex, setFilterSex] = useState("all");
  const [filterAgeGroup, setFilterAgeGroup] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const [sortBy, setSortBy] = useState<"nome" | "classe" | "status" | "ingresso">("nome");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [nome, setNome] = useState("");
  const [sexo, setSexo] = useState<"MASCULINO" | "FEMININO" | "">("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [classeId, setClasseId] = useState("");
  const [dataIngresso, setDataIngresso] = useState("");
  const [funcoes, setFuncoes] = useState<string[]>(["Professor"]);
  const [status, setStatus] = useState<"ATIVO" | "VISITANTE" | "INATIVO">("ATIVO");
  const [observacoes, setObservacoes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

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
        setCurrentUserRole("ADMIN");
      }
    }
    loadAuth();
  }, []);

  const canManageStudent = (aluno: Aluno | null = null) => {
    if (currentUserRole === "ADMIN") return true;
    if (currentUserRole === "TEACHER") return true;
    return false;
  };

  useEffect(() => {
    if (search.classeId) {
      setFilterClass(search.classeId);
      setShowFilters(true);
      navigate({ search: {} });
    }
  }, [search.classeId]);

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
    const activeClasses = store.classes.filter((c) => c.status === "ATIVA");
    setClasseId(activeClasses.length > 0 ? activeClasses[0].id : "");
    setDataIngresso(new Date().toISOString().split("T")[0]);
    setFuncoes(["Professor"]);
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
    setFuncoes(p.funcoes || ["Professor"]);
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
      toast.success(`Professor ${newStatus === "ATIVO" ? "reativado" : "inativado"} com sucesso.`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar o status.");
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!nome.trim()) newErrors.nome = "O nome completo é obrigatório.";
    if (funcoes.length === 0) newErrors.funcoes = "Selecione pelo menos uma função/papel.";
    if (!classeId) newErrors.classeId = "A classe é obrigatória.";

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
        updateAluno({ id: editingPessoa.id, ...payload });
        toast.success("Cadastro atualizado com sucesso!");
      } else {
        addAluno(payload);
        toast.success("Professor cadastrado com sucesso!");
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
        toast.success("Professor excluído com sucesso.");
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

  const filteredPessoas = store.alunos.filter((a) => {
    const isTeacher = a.funcoes?.includes("Professor") || a.funcoes?.includes("Professor Auxiliar") || a.funcoes?.includes("Administrador");
    if (!isTeacher) return false;

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

  const totalPages = Math.ceil(sortedPessoas.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPessoas = sortedPessoas.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
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

  const getStatusColor = (s: Aluno["status"]) => {
    switch (s) {
      case "ATIVO": return "bg-emerald-50 text-emerald-600 border border-emerald-100";
      case "VISITANTE": return "bg-blue-50 text-blue-600 border border-blue-100";
      case "INATIVO": return "bg-slate-100 text-slate-500 border border-slate-200";
      default: return "bg-slate-50 text-slate-500";
    }
  };

  return (
    <div className="space-y-6 relative min-h-[calc(100vh-10rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="h-5.5 w-5.5 text-primary" />
            Professores
          </h3>
          <p className="text-xs text-slate-500 font-medium">Controle de professores e equipe.</p>
        </div>
        {canManageStudent() && (
          <Button onClick={handleOpenCreate} className="bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 h-9 px-4 cursor-pointer shadow-soft hidden sm:flex">
            <Plus className="h-4 w-4" />
            <span>Cadastrar Professor</span>
          </Button>
        )}
      </div>

      <div className="space-y-3 bg-white p-4 rounded-2xl shadow-soft border border-slate-50">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input type="text" placeholder="Pesquisar..." value={searchText} onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }} className="pl-10 rounded-xl border-slate-100 text-xs py-5 focus-visible:ring-primary/20 bg-slate-50/50" />
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className={`border-slate-100 rounded-xl text-xs font-semibold px-3.5 h-10 flex items-center gap-1.5 cursor-pointer ${showFilters ? "bg-slate-100" : ""}`}>
            <Filter className="h-4 w-4 text-slate-500" />
            <span className="hidden sm:inline">Filtros</span>
          </Button>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-slate-50 animate-fade-in">
             <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Função</Label>
              <select value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }} className="w-full rounded-xl border border-slate-200 bg-white text-xs px-3 h-9 font-medium text-slate-700 focus:outline-none">
                <option value="all">Todas</option>
                {ROLES_OPTIONS.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="hidden md:flex items-center justify-end gap-4 text-xs font-semibold text-slate-500 bg-slate-50/50 p-2 px-4 rounded-xl border border-slate-100">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Ordenar por:</span>
        <button onClick={() => toggleSort("nome")} className={`flex items-center gap-1 hover:text-slate-800 cursor-pointer ${sortBy === "nome" ? "text-primary font-bold" : ""}`}>Nome<ArrowUpDown className="h-3 w-3" /></button>
        <button onClick={() => toggleSort("classe")} className={`flex items-center gap-1 hover:text-slate-800 cursor-pointer ${sortBy === "classe" ? "text-primary font-bold" : ""}`}>Classe<ArrowUpDown className="h-3 w-3" /></button>
      </div>

      {sortedPessoas.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-soft border border-slate-100 text-center py-16">
          <div className="h-14 w-14 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-4"><Users className="h-6 w-6" /></div>
          <h4 className="text-sm font-bold text-slate-800">Nenhum professor cadastrado</h4>
          <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed font-medium">Registre professores para suas classes.</p>
          {canManageStudent() && (
            <Button onClick={handleOpenCreate} className="mt-5 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-xl px-5 py-2 cursor-pointer shadow-soft">Cadastrar Professor</Button>
          )}
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-2xl shadow-soft border border-slate-50 overflow-hidden">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4 pl-6">Nome</th>
                  <th className="p-4">Funções</th>
                  <th className="p-4">Classe</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 pr-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                {currentPessoas.map((p) => {
                  const targetClass = store.classes.find((c) => c.id === p.classe_id);
                  return (
                    <tr key={p.id} onClick={() => { setSelectedPessoa(p); setIsDetailsOpen(true); }} className="hover:bg-slate-50/50 cursor-pointer transition-colors duration-150">
                      <td className="p-4 pl-6 font-bold text-slate-800">{p.nome}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {p.funcoes?.map((f) => (
                            <span key={f} className={`text-[9px] font-bold px-1.75 py-0.5 rounded-full ${f === "Professor" ? "bg-purple-50 text-purple-600" : "bg-red-50 text-red-600"}`}>
                              {f}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">{targetClass ? targetClass.nome : "Sem classe"}</td>
                      <td className="p-4 text-center"><span className={`text-[9px] font-bold px-2 py-0.75 rounded-full ${getStatusColor(p.status)}`}>{p.status}</span></td>
                      <td className="p-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(p)} className="h-7 w-7 text-slate-400 hover:text-slate-600"><Edit2 className="h-4.5 w-4.5" /></Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* FORM DIALOG */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-none shadow-elevated overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800 tracking-tight">{editingPessoa ? "Editar Professor" : "Cadastrar Professor"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="nome" className="text-xs font-semibold text-slate-600">Nome Completo *</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} className={`rounded-xl border-slate-200 text-xs py-5 ${errors.nome ? "border-red-400" : ""}`} />
              {errors.nome && <p className="text-[10px] text-red-500 font-semibold">{errors.nome}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="classeId" className="text-xs font-semibold text-slate-600">Classe Vinculada *</Label>
                <select id="classeId" value={classeId} onChange={(e) => setClasseId(e.target.value)} className={`w-full rounded-xl border bg-white text-xs px-3 h-10 font-medium text-slate-700 focus:outline-none ${errors.classeId ? "border-red-400" : "border-slate-200"}`}>
                  <option value="">Selecione uma Classe</option>
                  {store.classes.map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
                </select>
                {errors.classeId && <p className="text-[10px] text-red-500 font-semibold">{errors.classeId}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-semibold text-slate-600">Status Inicial</Label>
                <select id="status" value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full rounded-xl border border-slate-200 bg-white text-xs px-3 h-10 font-medium text-slate-700 focus:outline-none">
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
                    <label key={role} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${checked ? "bg-primary/5 text-primary border-primary" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}>
                      <input type="checkbox" checked={checked} onChange={() => handleRoleCheckboxChange(role)} className="hidden" />
                      {checked && <Check className="h-3.5 w-3.5" />}
                      {role}
                    </label>
                  );
                })}
              </div>
              {errors.funcoes && <p className="text-[10px] text-red-500 font-semibold">{errors.funcoes}</p>}
            </div>

            <DialogFooter className="pt-4 flex flex-row items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)} className="rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer h-9 px-4">Cancelar</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl text-xs cursor-pointer h-9 px-4">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
