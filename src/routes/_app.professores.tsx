import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  useEbdStore,
  addProfessor,
  updateProfessor,
  deleteProfessor,
  updateClasse,
  Professor,
} from "@/lib/store";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import {
  Users, Plus, Search, Filter, Edit2, Trash2, Check, ArrowUpDown
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

function ProfessoresPage() {
  const store = useEbdStore();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPessoa, setEditingPessoa] = useState<Professor | null>(null);
  const [deletingPessoaId, setDeletingPessoaId] = useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const [sortBy, setSortBy] = useState<"nome" | "classe" | "status">("nome");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Form states
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [classeId, setClasseId] = useState("");
  const [status, setStatus] = useState<"ATIVO" | "INATIVO">("ATIVO");
  const [observacoes, setObservacoes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const [currentUserRole, setCurrentUserRole] = useState<string>("STUDENT");

  useEffect(() => {
    async function loadAuth() {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
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

  const canManage = () => {
    return currentUserRole === "ADMIN" || currentUserRole === "TEACHER";
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

  const handleOpenCreate = () => {
    setEditingPessoa(null);
    setNome("");
    setTelefone("");
    setEmail("");
    const activeClasses = store.classes.filter((c) => c.status === "ATIVA");
    setClasseId(activeClasses.length > 0 ? activeClasses[0].id : "");
    setStatus("ATIVO");
    setObservacoes("");
    setErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: Professor) => {
    setEditingPessoa(p);
    setNome(p.nome);
    setTelefone(p.telefone || "");
    setEmail(p.email || "");
    
    // Find class associated with this professor
    const associatedClass = store.classes.find(
      (c) => c.professor_id === p.id || c.professor_auxiliar_id === p.id
    );
    setClasseId(associatedClass ? associatedClass.id : "");
    setStatus(p.ativo ? "ATIVO" : "INATIVO");
    setObservacoes(p.observacoes || "");
    setErrors({});
    setIsFormOpen(true);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!nome.trim()) newErrors.nome = "O nome completo é obrigatório.";

    if (nome.trim()) {
      const exists = store.professores.some(
        (p) =>
          p.id !== editingPessoa?.id &&
          p.nome.trim().toLowerCase() === nome.trim().toLowerCase()
      );
      if (exists) {
        newErrors.nome = "Já existe um professor cadastrado com este nome.";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Preencha todos os campos obrigatórios corretamente.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        nome: nome.trim(),
        telefone: telefone.trim() || null,
        email: email.trim() || null,
        observacoes: observacoes.trim() || null,
        ativo: status === "ATIVO",
      };

      let savedProf: Professor;
      if (editingPessoa) {
        const updated = { id: editingPessoa.id, ...payload };
        updateProfessor(updated);
        savedProf = updated;
        toast.success("Cadastro atualizado com sucesso!");
      } else {
        savedProf = addProfessor(payload);
        toast.success("Professor cadastrado com sucesso!");
      }

      // If a class is linked, associate the professor to it
      if (classeId && savedProf) {
        const targetClass = store.classes.find((c) => c.id === classeId);
        if (targetClass) {
          updateClasse({
            ...targetClass,
            professor_id: savedProf.id,
            professor: savedProf.nome,
          });
        }
      }

      setIsFormOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar os dados.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingPessoaId) {
      try {
        deleteProfessor(deletingPessoaId);
        toast.success("Professor excluído com sucesso.");
        setDeletingPessoaId(null);
      } catch (err: any) {
        toast.error(err.message || "Erro ao excluir.");
        setDeletingPessoaId(null);
      }
    }
  };

  const getProfessorRoles = (pId: string) => {
    const roles: string[] = [];
    const isMain = store.classes.some((c) => c.professor_id === pId);
    const isAux = store.classes.some((c) => c.professor_auxiliar_id === pId);
    if (isMain) roles.push("Professor");
    if (isAux) roles.push("Professor Auxiliar");
    if (roles.length === 0) roles.push("Professor");
    return roles;
  };

  const filteredPessoas = store.professores.filter((p) => {
    const matchSearch =
      p.nome.toLowerCase().includes(searchText.toLowerCase()) ||
      (p.email && p.email.toLowerCase().includes(searchText.toLowerCase())) ||
      (p.telefone && p.telefone.includes(searchText));

    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "ATIVO" && p.ativo) ||
      (filterStatus === "INATIVO" && !p.ativo);

    const matchClass =
      filterClass === "all" ||
      store.classes.some(
        (c) =>
          c.id === filterClass &&
          (c.professor_id === p.id || c.professor_auxiliar_id === p.id)
      );

    return matchSearch && matchStatus && matchClass;
  });

  const sortedPessoas = [...filteredPessoas].sort((a, b) => {
    let valA: any = a[sortBy === "classe" ? "id" : sortBy];
    let valB: any = b[sortBy === "classe" ? "id" : sortBy];

    if (sortBy === "classe") {
      const classA = store.classes.find(
        (c) => c.professor_id === a.id || c.professor_auxiliar_id === a.id
      );
      const classB = store.classes.find(
        (c) => c.professor_id === b.id || c.professor_auxiliar_id === b.id
      );
      valA = classA ? classA.nome : "";
      valB = classB ? classB.nome : "";
    } else if (sortBy === "status") {
      valA = a.ativo ? "ativo" : "inativo";
      valB = b.ativo ? "ativo" : "inativo";
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

  const toggleSort = (field: "nome" | "classe" | "status") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const getStatusColor = (active: boolean) => {
    return active
      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
      : "bg-slate-100 text-slate-500 border border-slate-200";
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
        {canManage() && (
          <Button onClick={handleOpenCreate} className="bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 h-9 px-4 cursor-pointer shadow-soft">
            <Plus className="h-4 w-4" />
            <span>Cadastrar Professor</span>
          </Button>
        )}
      </div>

      <div className="space-y-3 bg-white p-4 rounded-2xl shadow-soft border border-slate-50">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input type="text" placeholder="Pesquisar por nome, email ou telefone..." value={searchText} onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }} className="pl-10 rounded-xl border-slate-100 text-xs py-5 focus-visible:ring-primary/20 bg-slate-50/50" />
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className={`border-slate-100 rounded-xl text-xs font-semibold px-3.5 h-10 flex items-center gap-1.5 cursor-pointer ${showFilters ? "bg-slate-100" : ""}`}>
            <Filter className="h-4 w-4 text-slate-500" />
            <span className="hidden sm:inline">Filtros</span>
          </Button>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-slate-50 animate-fade-in">
             <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Situação</Label>
              <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }} className="w-full rounded-xl border border-slate-200 bg-white text-xs px-3 h-9 font-medium text-slate-700 focus:outline-none">
                <option value="all">Todos</option>
                <option value="ATIVO">Ativos</option>
                <option value="INATIVO">Inativos</option>
              </select>
            </div>
             <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Classe</Label>
              <select value={filterClass} onChange={(e) => { setFilterClass(e.target.value); setCurrentPage(1); }} className="w-full rounded-xl border border-slate-200 bg-white text-xs px-3 h-9 font-medium text-slate-700 focus:outline-none">
                <option value="all">Todas</option>
                {store.classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
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
        <button onClick={() => toggleSort("status")} className={`flex items-center gap-1 hover:text-slate-800 cursor-pointer ${sortBy === "status" ? "text-primary font-bold" : ""}`}>Situação<ArrowUpDown className="h-3 w-3" /></button>
      </div>

      {sortedPessoas.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-soft border border-slate-100 text-center py-16">
          <div className="h-14 w-14 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-4"><Users className="h-6 w-6" /></div>
          <h4 className="text-sm font-bold text-slate-800">Nenhum professor cadastrado</h4>
          <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed font-medium">Registre professores para suas classes.</p>
          {canManage() && (
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
                  <th className="p-4">Contato</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 pr-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                {currentPessoas.map((p) => {
                  const targetClass = store.classes.find(
                    (c) => c.professor_id === p.id || c.professor_auxiliar_id === p.id
                  );
                  const roles = getProfessorRoles(p.id);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                      <td className="p-4 pl-6 font-bold text-slate-800">{p.nome}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {roles.map((f) => (
                            <span key={f} className={`text-[9px] font-bold px-1.75 py-0.5 rounded-full ${f === "Professor" ? "bg-purple-50 text-purple-600" : "bg-red-50 text-red-600"}`}>
                              {f}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">{targetClass ? targetClass.nome : "Sem classe"}</td>
                      <td className="p-4">
                        <div className="text-[10px] text-slate-400">
                          {p.email && <div>{p.email}</div>}
                          {p.telefone && <div>{p.telefone}</div>}
                        </div>
                      </td>
                      <td className="p-4 text-center"><span className={`text-[9px] font-bold px-2 py-0.75 rounded-full ${getStatusColor(p.ativo)}`}>{p.ativo ? "ATIVO" : "INATIVO"}</span></td>
                      <td className="p-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(p)} className="h-7 w-7 text-slate-400 hover:text-slate-600 cursor-pointer"><Edit2 className="h-4.5 w-4.5" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeletingPessoaId(p.id)} className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"><Trash2 className="h-4.5 w-4.5" /></Button>
                        </div>
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
                <Label htmlFor="telefone" className="text-xs font-semibold text-slate-600">Telefone</Label>
                <Input id="telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-9999" className="rounded-xl border-slate-200 text-xs py-5" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-600">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" className="rounded-xl border-slate-200 text-xs py-5" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="classeId" className="text-xs font-semibold text-slate-600">Classe Vinculada *</Label>
                <select id="classeId" value={classeId} onChange={(e) => setClasseId(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white text-xs px-3 h-10 font-medium text-slate-700 focus:outline-none">
                  <option value="">Selecione uma Classe</option>
                  {store.classes.map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-semibold text-slate-600">Situação</Label>
                <select id="status" value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full rounded-xl border border-slate-200 bg-white text-xs px-3 h-10 font-medium text-slate-700 focus:outline-none">
                  <option value="ATIVO">Ativo</option>
                  <option value="INATIVO">Inativo</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="observacoes" className="text-xs font-semibold text-slate-600">Observações</Label>
              <Textarea id="observacoes" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Informações adicionais..." className="rounded-xl border-slate-200 text-xs min-h-[80px]" />
            </div>

            <DialogFooter className="pt-4 flex flex-row items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)} className="rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer h-9 px-4">Cancelar</Button>
              <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl text-xs cursor-pointer h-9 px-4">
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <AlertDialog open={deletingPessoaId !== null} onOpenChange={(open) => !open && setDeletingPessoaId(null)}>
        <AlertDialogContent className="rounded-2xl border-none shadow-elevated">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold text-slate-800">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500 font-medium">
              Tem certeza que deseja excluir este professor? Esta ação não pode ser desfeita e removerá permanentemente o cadastro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row items-center justify-end gap-2">
            <AlertDialogCancel className="rounded-xl text-xs font-semibold hover:bg-slate-50 border-slate-200 h-9 cursor-pointer">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-xs h-9 cursor-pointer">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
