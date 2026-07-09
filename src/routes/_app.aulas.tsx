import { createFileRoute, Link } from "@tanstack/react-router";
import { useEbdStore, deleteAula, Aula, Classe } from "@/lib/store";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  CalendarCheck,
  Plus,
  BookOpen,
  Calendar,
  MoreVertical,
  Trash2,
  AlertTriangle,
  Users,
  Book,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export const Route = createFileRoute("/_app/aulas")({
  component: AulasPage,
});

function AulasPage() {
  const store = useEbdStore();
  const [deletingAulaId, setDeletingAulaId] = useState<string | null>(null);

  // Auth State
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>("STUDENT");

  useEffect(() => {
    async function loadAuth() {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUserId(session.user.id);
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id);
          const dbRole = roles && roles.length > 0 ? roles[0].role : null;
          let mappedRole = "STUDENT";
          if (dbRole === "ADMIN") mappedRole = "ADMIN";
          else if (dbRole === "PROFESSOR") mappedRole = "TEACHER";
          else if (dbRole === "ALUNO") mappedRole = "STUDENT";

          setCurrentUserRole(mappedRole || session.user.user_metadata?.role || "STUDENT");
        }
      } else {
        // Fallback para demo
        setCurrentUserRole("ADMIN");
      }
    }
    loadAuth();
  }, []);

  // Helper de Permissão
  const canManageAula = (aulaClass: Classe | undefined) => {
    if (currentUserRole === "ADMIN") return true;
    if (currentUserRole === "TEACHER" && aulaClass && aulaClass.professor_id === currentUserId) return true;
    return false;
  };

  const handleDeleteConfirm = () => {
    if (deletingAulaId) {
      try {
        deleteAula(deletingAulaId);
        toast.success("Histórico de aula excluído com sucesso.");
        setDeletingAulaId(null);
      } catch {
        toast.error("Erro ao excluir o registro de aula.");
      }
    }
  };

  // Sort lessons: newest date first
  const sortedAulas = [...store.aulas].sort(
    (a, b) => new Date(b.data_aula).getTime() - new Date(a.data_aula).getTime(),
  );

  return (
    <div className="space-y-6">
      {/* Header and Registrar Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">Histórico de Aulas</h3>
          <p className="text-xs text-slate-500 font-medium">Veja as aulas lecionadas e chamadas anteriores.</p>
        </div>
        {(currentUserRole === "ADMIN" || currentUserRole === "TEACHER") && (
          <Button
            asChild
            className="bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 h-9 px-4 cursor-pointer shadow-soft"
          >
            <Link to="/aulas/registrar">
              <Plus className="h-4 w-4" />
              <span>Registrar Aula</span>
            </Link>
          </Button>
        )}
      </div>

      {/* Aulas List */}
      {sortedAulas.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-soft border border-slate-100 text-center py-16 animate-fade-in">
          <div className="h-14 w-14 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Nenhuma aula registrada</h4>
          <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed font-medium">
            Registre sua primeira aula dominical e faça a chamada dos alunos.
          </p>
          {(currentUserRole === "ADMIN" || currentUserRole === "TEACHER") && (
            <Button
              asChild
              className="mt-5 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-xl px-5 py-2 cursor-pointer shadow-soft"
            >
              <Link to="/aulas/registrar">Registrar Primeira Aula</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedAulas.map((aula) => {
            const aulaClass = store.classes.find((c) => c.id === aula.classe_id);
            const presences = Object.values(aula.presencas);
            const presentCount = presences.filter((p) => p.presente).length;
            const bibleCount = presences.filter((p) => p.presente && p.trouxe_biblia).length;
            const totalCount = presences.length;

            const formattedDate = aula.data_aula.split("-").reverse().join("/");

            return (
              <Card
                key={aula.id}
                className="border-none shadow-soft bg-white rounded-2xl hover:shadow-elevated transition-shadow duration-150"
              >
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  {/* Left: Class details & Date */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 flex flex-col items-center justify-center flex-shrink-0 leading-none">
                      <Calendar className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-primary bg-primary-soft px-2 py-0.5 rounded-full tracking-wide">
                          {aulaClass ? aulaClass.nome.split("—")[0].trim() : "Sem Classe"}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          {formattedDate}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight leading-snug mt-1.5 truncate">
                        {aula.tema}
                      </h4>
                    </div>
                  </div>

                  {/* Right: Presence counts & actions */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="hidden sm:flex items-center gap-4 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                        <Users className="h-3.5 w-3.5 text-slate-300" />
                        <span className="text-slate-700">{presentCount}</span>/{totalCount} Presenças
                      </span>
                      <span className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                        <Book className="h-3.5 w-3.5 text-slate-300" />
                        <span className="text-slate-700">{bibleCount}</span> Bíblias
                      </span>
                    </div>

                    {/* Mobile status pill */}
                    <div className="sm:hidden flex flex-col items-end text-[10px] font-semibold text-slate-400">
                      <span>{presentCount}/{totalCount} Pres.</span>
                      <span>{bibleCount} Bíb.</span>
                    </div>

                    {canManageAula(aulaClass) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer"
                          >
                            <MoreVertical className="h-4.5 w-4.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border border-slate-100 shadow-elevated">
                          <DropdownMenuItem
                            onClick={() => setDeletingAulaId(aula.id)}
                            className="text-red-600 text-xs font-medium focus:bg-red-50/50 cursor-pointer py-2 rounded-lg flex items-center gap-2"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                            Excluir Registro
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* DELETE CONFIRM ALERT DIALOG */}
      <AlertDialog open={deletingAulaId !== null} onOpenChange={(open) => !open && setDeletingAulaId(null)}>
        <AlertDialogContent className="rounded-2xl border-none shadow-elevated sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Excluir Chamada de Aula?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-400 leading-relaxed font-medium">
              Esta ação removerá permanentemente o histórico de chamada desta aula. Os relatórios de frequência de todos os alunos da classe serão afetados.
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
