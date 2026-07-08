import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEbdStore, addAula, Aula, Aluno } from "@/lib/store";
import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  BookOpen,
  Calendar,
  Book,
  Check,
  ChevronLeft,
  CalendarCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/aulas/registrar")({
  component: RegistrarAulaPage,
});

function RegistrarAulaPage() {
  const store = useEbdStore();
  const navigate = useNavigate();

  // Wizard state: 1 = Choose Class, 2 = Fill details & Attendance
  const [step, setStep] = useState(1);
  const [selectedClassId, setSelectedClassId] = useState("");

  // Lesson details states
  const [data, setData] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [tema, setTema] = useState("");

  // Attendance lists: Record of studentId -> { presente: boolean; trouxe_biblia: boolean }
  const [attendance, setAttendance] = useState<Record<string, { presente: boolean; trouxe_biblia: boolean }>>({});

  // Auth State
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>("STUDENT");

  useEffect(() => {
    async function loadAuth() {
      if (isSupabaseConfigured && supabase) {
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

  const activeClasses = store.classes.filter((c) => {
    if (c.status !== "ATIVA") return false;
    if (currentUserRole === "ADMIN") return true;
    if (currentUserRole === "TEACHER" && c.professor_id === currentUserId) return true;
    return false;
  });

  const handleSelectClass = (classId: string) => {
    setSelectedClassId(classId);

    // Filter students for this class and initialize attendance state
    const classStudents = store.alunos.filter(
      (a) => a.classe_id === classId && (a.status === "ATIVO" || a.status === "VISITANTE"),
    );

    const initialAttendance: Record<string, { presente: boolean; trouxe_biblia: boolean }> = {};
    classStudents.forEach((student) => {
      initialAttendance[student.id] = { presente: false, trouxe_biblia: false };
    });

    setAttendance(initialAttendance);
    setStep(2);
  };

  const handleTogglePresent = (studentId: string) => {
    setAttendance((prev) => {
      const current = prev[studentId] || { presente: false, trouxe_biblia: false };
      const nextPresent = !current.presente;
      return {
        ...prev,
        [studentId]: {
          presente: nextPresent,
          // Auto-disable or turn off bible if student is marked absent
          trouxe_biblia: nextPresent ? current.trouxe_biblia : false,
        },
      };
    });
  };

  const handleToggleBible = (studentId: string) => {
    setAttendance((prev) => {
      const current = prev[studentId] || { presente: false, trouxe_biblia: false };
      // Can only toggle bible if present
      if (!current.presente) {
        toast.info("Marque a presença do aluno antes de indicar se ele trouxe a Bíblia.");
        return prev;
      }
      return {
        ...prev,
        [studentId]: {
          ...current,
          trouxe_biblia: !current.trouxe_biblia,
        },
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClassId) {
      toast.error("Nenhuma classe selecionada.");
      return;
    }
    if (!tema.trim()) {
      toast.error("Digite o tema/assunto da aula lecionada.");
      return;
    }

    try {
      const selectedClass = store.classes.find((c) => c.id === selectedClassId);
      addAula({
        classe_id: selectedClassId,
        data_aula: data,
        tema,
        numero_licao: null,
        professor: selectedClass ? selectedClass.professor : null,
        professor_substituto: null,
        observacoes: null,
        presencas: attendance,
      });

      toast.success("Aula e chamada registradas com sucesso!");
      navigate({ to: "/dashboard" });
    } catch (error: any) {
      toast.error(error.message || "Ocorreu um erro ao salvar o registro da aula.");
    }
  };

  // Get active class object
  const selectedClass = store.classes.find((c) => c.id === selectedClassId);

  // Get class students (Active and Visitors)
  const classStudents = store.alunos
    .filter((a) => a.classe_id === selectedClassId && (a.status === "ATIVO" || a.status === "VISITANTE"))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <div className="space-y-6">
      {/* Top Back Navigation */}
      <div className="flex items-center gap-3">
        {step === 2 ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setStep(1)}
            className="h-9 w-9 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5 text-slate-500" />
          </Button>
        ) : (
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 cursor-pointer"
          >
            <Link to="/dashboard">
              <ChevronLeft className="h-5 w-5 text-slate-500" />
            </Link>
          </Button>
        )}
        <div>
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">Registrar Aula</h3>
          <p className="text-xs text-slate-500 font-medium">
            {step === 1 ? "Selecione a classe que terá aula hoje." : `Chamada da classe ${selectedClass?.nome}`}
          </p>
        </div>
      </div>

      {/* STEP 1: CHOOSE CLASS */}
      {step === 1 && (
        <div className="space-y-4">
          {activeClasses.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-soft border border-slate-100 text-center py-16">
              <div className="h-14 w-14 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Nenhuma classe ativa encontrada</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed font-medium">
                Você precisa ativar ou cadastrar uma classe antes de registrar aulas.
              </p>
              <Button asChild className="mt-5 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-xl px-5 py-2 cursor-pointer shadow-soft">
                <Link to="/classes">Cadastrar Classe</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeClasses.map((c) => {
                const count = store.alunos.filter(
                  (a) => a.classe_id === c.id && (a.status === "ATIVO" || a.status === "VISITANTE"),
                ).length;
                return (
                  <Card
                    key={c.id}
                    onClick={() => handleSelectClass(c.id)}
                    className="border-none shadow-soft bg-white rounded-2xl cursor-pointer hover:shadow-elevated hover:bg-slate-50/20 transition-all duration-200"
                  >
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-bold text-slate-800 tracking-tight leading-snug">
                        {c.nome}
                      </CardTitle>
                      <CardDescription className="text-[10px] font-semibold text-slate-400 mt-0.5">
                        Professor: {c.professor}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>{count} Alunos ativos</span>
                      <span className="text-primary font-semibold flex items-center gap-1">
                        Selecionar
                      </span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STEP 2: DETAILS & ATTENDANCE CHECKLIST */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Details Card */}
          <Card className="border-none shadow-soft bg-white rounded-2xl">
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="data" className="text-xs font-semibold text-slate-600">
                  Data da Aula *
                </Label>
                <Input
                  id="data"
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="rounded-xl border-slate-200 text-xs py-5"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tema" className="text-xs font-semibold text-slate-600">
                  Tema da Lição / Assunto *
                </Label>
                <Input
                  id="tema"
                  type="text"
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                  placeholder="Ex: Lição 12 - A Família Cristã"
                  className="rounded-xl border-slate-200 text-xs py-5"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Checklist header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Alunos Matriculados ({classStudents.length})
              </h4>
              <p className="text-[10px] text-slate-400 font-semibold">Tocar para marcar</p>
            </div>

            {/* Checklist */}
            {classStudents.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl shadow-soft text-center text-slate-400 text-xs py-12 border border-slate-100">
                Nenhum aluno matriculado nesta classe. Adicione alunos para poder fazer a chamada.
              </div>
            ) : (
              <div className="space-y-2">
                {classStudents.map((student) => {
                  const att = attendance[student.id] || { presente: false, trouxe_biblia: false };
                  const isVisitor = student.status === "VISITANTE";

                  return (
                    <Card
                      key={student.id}
                      className={`border-none shadow-soft rounded-xl transition-all duration-150 ${
                        att.presente ? "bg-white" : "bg-white/80"
                      }`}
                    >
                      <CardContent className="p-3 flex items-center justify-between gap-4">
                        {/* Name & status info */}
                        <div className="min-w-0">
                          <h5 className={`text-xs sm:text-sm font-bold text-slate-800 truncate leading-snug ${!att.presente ? "text-slate-700/80" : ""}`}>
                            {student.nome}
                          </h5>
                          {isVisitor && (
                            <span className="inline-block text-[8px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full uppercase tracking-wider mt-0.5">
                              Visitante
                            </span>
                          )}
                        </div>

                        {/* Large Touch Targets */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Present button */}
                          <button
                            type="button"
                            onClick={() => handleTogglePresent(student.id)}
                            className={`h-11 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer select-none border ${
                              att.presente
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-soft"
                                : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100"
                            }`}
                            style={{ minWidth: "90px" }}
                          >
                            <div className={`h-4.5 w-4.5 rounded-full flex items-center justify-center ${
                              att.presente ? "bg-white text-emerald-600" : "border border-slate-300 text-transparent"
                            }`}>
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                            <span>Presença</span>
                          </button>

                          {/* Bible button */}
                          <button
                            type="button"
                            onClick={() => handleToggleBible(student.id)}
                            className={`h-11 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer select-none border ${
                              !att.presente
                                ? "opacity-40 bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                                : att.trouxe_biblia
                                  ? "bg-blue-600 text-white border-blue-600 shadow-soft"
                                  : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100"
                            }`}
                            style={{ minWidth: "80px" }}
                          >
                            <Book className="h-4.5 w-4.5" />
                            <span>Bíblia</span>
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Form Actions */}
          {classStudents.length > 0 && (
            <div className="pt-2 flex flex-col gap-2">
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/95 text-white font-bold rounded-xl py-6 h-auto text-xs cursor-pointer shadow-soft flex items-center justify-center gap-2"
              >
                <CalendarCheck className="h-5 w-5" />
                Salvar Registro de Aula
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(1)}
                className="w-full text-slate-500 font-semibold rounded-xl py-4 h-auto text-xs cursor-pointer"
              >
                Voltar para seleção de classe
              </Button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
