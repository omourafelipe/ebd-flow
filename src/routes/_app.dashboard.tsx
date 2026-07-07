import { createFileRoute, Link } from "@tanstack/react-router";
import { useEbdStore, Aula, Aluno, Classe } from "@/lib/store";
import { useState, useEffect } from "react";
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  CalendarPlus,
  UserPlus,
  Plus,
  FileText,
  Info,
  CalendarCheck,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const store = useEbdStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const totalAlunos = store.alunos.length;
  const visitantes = store.alunos.filter((a) => a.status === "VISITANTE").length;
  const cursosAtivos = store.cursos.filter((c) => c.status === "EM_ANDAMENTO").length;

  // Calculate presence in the last registered class session
  const getLastClassPresence = () => {
    if (store.aulas.length === 0) return 0;
    // Sort classes by date descending
    const sortedAulas = [...store.aulas].sort(
      (a, b) => new Date(b.data_aula).getTime() - new Date(a.data_aula).getTime(),
    );
    const lastAula = sortedAulas[0];
    const presenceValues = Object.values(lastAula.presencas);
    const presents = presenceValues.filter((p) => p.presente).length;
    return presents;
  };

  const presentesHoje = getLastClassPresence();

  // Alert generation logic
  const getAlerts = () => {
    const alertsList: { type: "info" | "warning"; message: string; title: string }[] = [];

    // Inactive classes alert
    const inactiveClasses = store.classes.filter((c) => c.status === "INATIVA");
    if (inactiveClasses.length > 0) {
      alertsList.push({
        type: "info",
        title: "Classes Inativas",
        message: `A classe "${inactiveClasses[0].nome}" está atualmente inativa.`,
      });
    }

    // Class with zero students alert
    store.classes.forEach((c) => {
      const studentsInClass = store.alunos.filter((a) => a.classe_id === c.id);
      if (studentsInClass.length === 0 && c.status === "ATIVA") {
        alertsList.push({
          type: "warning",
          title: "Classe Sem Alunos",
          message: `A classe ativa "${c.nome}" não possui nenhum aluno matriculado.`,
        });
      }
    });

    // Absent students in last class alert
    if (store.aulas.length > 0) {
      const sortedAulas = [...store.aulas].sort(
        (a, b) => new Date(b.data_aula).getTime() - new Date(a.data_aula).getTime(),
      );
      const lastAula = sortedAulas[0];
      const absentees = store.alunos.filter(
        (a) =>
          a.classe_id === lastAula.classe_id &&
          lastAula.presencas[a.id] &&
          !lastAula.presencas[a.id].presente,
      );

      if (absentees.length > 0) {
        alertsList.push({
          type: "warning",
          title: "Alunos Faltosos",
          message: `${absentees.map((a) => a.nome).slice(0, 2).join(" e ")} ${absentees.length > 2 ? `e outros ${absentees.length - 2}` : ""} faltaram na última aula.`,
        });
      }
    }

    // Default alert if nothing else
    if (alertsList.length === 0) {
      alertsList.push({
        type: "info",
        title: "Tudo em ordem!",
        message: "As estatísticas de frequência estão em dia e todas as classes ativas possuem alunos.",
      });
    }

    return alertsList;
  };

  const alerts = getAlerts();

  // Data prep for class distribution data
  const getClassDistributionData = () => {
    return store.classes
      .filter((c) => c.status === "ATIVA")
      .map((c) => {
        const count = store.alunos.filter((a) => a.classe_id === c.id).length;
        // Truncate name before any kind of dash (em-dash, en-dash, hyphen)
        const name = c.nome.split(/[—–-]/)[0].trim();
        return {
          name,
          Alunos: count,
        };
      });
  };

  // Data prep for historical attendance chart (last 5 lessons)
  const getHistoricalAttendanceData = () => {
    // Group all lessons by date
    const attendanceByDate: Record<string, { presents: number; total: number }> = {};

    store.aulas.forEach((aula) => {
      const presValues = Object.values(aula.presencas);
      const presentsCount = presValues.filter((p) => p.presente).length;
      const totalCount = presValues.length;

      if (!attendanceByDate[aula.data_aula]) {
        attendanceByDate[aula.data_aula] = { presents: 0, total: 0 };
      }
      attendanceByDate[aula.data_aula].presents += presentsCount;
      attendanceByDate[aula.data_aula].total += totalCount;
    });

    const sortedDates = Object.keys(attendanceByDate).sort();
    return sortedDates.slice(-5).map((date) => {
      const formattedDate = date.split("-").reverse().slice(0, 2).join("/"); // DD/MM
      const val = attendanceByDate[date];
      const rate = val.total > 0 ? Math.round((val.presents / val.total) * 100) : 0;
      return {
        data: formattedDate,
        Frequência: rate,
      };
    });
  };

  const classData = getClassDistributionData();
  const historyData = getHistoricalAttendanceData();

  return (
    <div className="space-y-6">
      {/* Welcome & Stats Grid */}
      <div>
        <h3 className="text-xl font-bold text-slate-800 tracking-tight">Visão Geral</h3>
        <p className="text-xs text-slate-500">Métricas e relatórios rápidos da Escola Bíblica.</p>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-soft bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Alunos</p>
              <h4 className="text-lg font-bold text-slate-800">{totalAlunos}</h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-soft bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Presentes</p>
              <h4 className="text-lg font-bold text-slate-800">{presentesHoje}</h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-soft bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Visitantes</p>
              <h4 className="text-lg font-bold text-slate-800">{visitantes}</h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-soft bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Cursos</p>
              <h4 className="text-lg font-bold text-slate-800">{cursosAtivos}</h4>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QUICK ACTIONS */}
      <Card className="border-none shadow-soft bg-white">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Button
            asChild
            className="w-full bg-primary hover:bg-primary/95 text-white rounded-xl py-5 h-auto text-xs font-semibold flex flex-col items-center gap-1.5 cursor-pointer shadow-soft"
          >
            <Link to="/aulas/registrar">
              <CalendarPlus className="h-4.5 w-4.5" />
              <span>Registrar Aula</span>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full border-slate-100 hover:bg-slate-50 text-slate-700 rounded-xl py-5 h-auto text-xs font-semibold flex flex-col items-center gap-1.5 cursor-pointer"
          >
            <Link to="/alunos" search={{ novo: "true" }}>
              <UserPlus className="h-4.5 w-4.5 text-slate-400" />
              <span>Novo Aluno</span>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full border-slate-100 hover:bg-slate-50 text-slate-700 rounded-xl py-5 h-auto text-xs font-semibold flex flex-col items-center gap-1.5 cursor-pointer"
          >
            <Link to="/classes" search={{ nova: "true" }}>
              <Plus className="h-4.5 w-4.5 text-slate-400" />
              <span>Nova Classe</span>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full border-slate-100 hover:bg-slate-50 text-slate-700 rounded-xl py-5 h-auto text-xs font-semibold flex flex-col items-center gap-1.5 cursor-pointer"
          >
            <Link to="/relatorios">
              <FileText className="h-4.5 w-4.5 text-slate-400" />
              <span>Relatórios</span>
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* CHARTS CONTAINER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Attendance frequency */}
        <Card className="border-none shadow-soft bg-white">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold text-slate-800 tracking-tight">Frequência da EBD (%)</CardTitle>
            <p className="text-[11px] text-slate-400 font-medium">Percentual de presença nos últimos domingos.</p>
          </CardHeader>
          <CardContent className="p-4 pt-0 h-48">
            {isMounted && historyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="data" tickLine={false} axisLine={false} style={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} style={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "none",
                      borderRadius: 12,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      fontSize: 11,
                    }}
                    formatter={(value) => [`${value}%`, "Frequência"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="Frequência"
                    stroke="var(--color-primary)"
                    strokeWidth={3}
                    dot={{ fill: "var(--color-primary)", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Aguardando registro de aulas...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Students per class */}
        <Card className="border-none shadow-soft bg-white">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold text-slate-800 tracking-tight">Alunos por Classe</CardTitle>
            <p className="text-[11px] text-slate-400 font-medium">Quantidade de alunos matriculados por turma.</p>
          </CardHeader>
          <CardContent className="p-4 pt-0 h-48">
            {isMounted && classData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} style={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis tickLine={false} axisLine={false} style={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "none",
                      borderRadius: 12,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      fontSize: 11,
                    }}
                  />
                  <Bar dataKey="Alunos" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Aguardando classes ativas...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ALERTS */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Alertas e Avisos</h4>
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert
              key={index}
              className={`border-none shadow-soft rounded-xl flex items-start gap-3 p-4 bg-white`}
            >
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  alert.type === "warning" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                }`}
              >
                {alert.type === "warning" ? (
                  <AlertTriangle className="h-4.5 w-4.5" />
                ) : (
                  <Info className="h-4.5 w-4.5" />
                )}
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <AlertTitle className="text-xs font-bold text-slate-800 mb-0.5">
                  {alert.title}
                </AlertTitle>
                <AlertDescription className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  {alert.message}
                </AlertDescription>
              </div>
            </Alert>
          ))}
        </div>
      </div>
    </div>
  );
}
