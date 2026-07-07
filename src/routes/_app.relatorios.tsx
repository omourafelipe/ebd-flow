import { createFileRoute } from "@tanstack/react-router";
import { useEbdStore, Aluno, Classe, Aula } from "@/lib/store";
import { useState, useEffect } from "react";
import {
  BarChart3,
  Users,
  Book,
  CalendarCheck,
  TrendingUp,
  Award,
  BookOpen,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/_app/relatorios")({
  component: RelatoriosPage,
});

function RelatoriosPage() {
  const store = useEbdStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Compute Overall Stats
  const getOverallStats = () => {
    const totalAulas = store.aulas.length;
    const activeAlunos = store.alunos.filter((a) => a.status === "ATIVO" || a.status === "VISITANTE");

    if (totalAulas === 0) {
      return { avgAttendance: 0, avgBible: 0, totalAulas, activeAlunosCount: activeAlunos.length };
    }

    let totalPresentsPossible = 0;
    let totalPresentsActual = 0;
    let totalBiblesCount = 0;

    store.aulas.forEach((aula) => {
      const presences = Object.values(aula.presencas);
      totalPresentsPossible += presences.length;
      totalPresentsActual += presences.filter((p) => p.presente).length;
      totalBiblesCount += presences.filter((p) => p.presente && p.trouxe_biblia).length;
    });

    const avgAttendance = totalPresentsPossible > 0 ? Math.round((totalPresentsActual / totalPresentsPossible) * 100) : 0;
    const avgBible = totalPresentsActual > 0 ? Math.round((totalBiblesCount / totalPresentsActual) * 100) : 0;

    return {
      avgAttendance,
      avgBible,
      totalAulas,
      activeAlunosCount: activeAlunos.length,
    };
  };

  const stats = getOverallStats();

  // Compute stats per class for charts
  const getClassStatsData = () => {
    return store.classes
      .filter((c) => c.status === "ATIVA")
      .map((c) => {
        const classAulas = store.aulas.filter((aula) => aula.classe_id === c.id);
        if (classAulas.length === 0) {
          return { name: c.nome.split("—")[0].trim(), Frequência: 0, Bíblia: 0 };
        }

        let totalPresentsPossible = 0;
        let totalPresentsActual = 0;
        let totalBiblesActual = 0;

        classAulas.forEach((aula) => {
          const presences = Object.values(aula.presencas);
          totalPresentsPossible += presences.length;
          totalPresentsActual += presences.filter((p) => p.presente).length;
          totalBiblesActual += presences.filter((p) => p.presente && p.trouxe_biblia).length;
        });

        const freq = totalPresentsPossible > 0 ? Math.round((totalPresentsActual / totalPresentsPossible) * 100) : 0;
        const bib = totalPresentsActual > 0 ? Math.round((totalBiblesActual / totalPresentsActual) * 100) : 0;

        return {
          name: c.nome.split("—")[0].trim(),
          Frequência: freq,
          Bíblia: bib,
        };
      });
  };

  const classStatsData = getClassStatsData();

  // Compute student ranking by attendance
  const getStudentRanking = () => {
    const activeAlunos = store.alunos.filter((a) => a.status === "ATIVO");

    const ranking = activeAlunos.map((student) => {
      const studentClass = store.classes.find((c) => c.id === student.classe_id);
      const classAulas = store.aulas.filter((aula) => aula.classe_id === student.classe_id);
      const totalLessons = classAulas.length;

      if (totalLessons === 0) {
        return { student, className: studentClass?.nome || "Sem classe", rate: 0, bibles: 0, total: 0 };
      }

      let presents = 0;
      let bibles = 0;

      classAulas.forEach((aula) => {
        const pres = aula.presencas[student.id];
        if (pres) {
          if (pres.presente) presents++;
          if (pres.presente && pres.trouxe_biblia) bibles++;
        }
      });

      const rate = Math.round((presents / totalLessons) * 100);
      return {
        student,
        className: studentClass ? studentClass.nome.split("—")[0].trim() : "Sem Classe",
        rate,
        bibles,
        total: totalLessons,
      };
    });

    // Sort by rate descending, then bibles descending
    return ranking.sort((a, b) => b.rate - a.rate || b.bibles - a.bibles).slice(0, 5);
  };

  const studentRankings = getStudentRanking();

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h3 className="text-xl font-bold text-slate-800 tracking-tight">Relatórios e Estatísticas</h3>
        <p className="text-xs text-slate-500 font-medium">Veja a frequência geral e ranking de engajamento da EBD.</p>
      </div>

      {/* OVERALL METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-soft bg-white rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center flex-shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Alunos Ativos</p>
              <h4 className="text-lg font-bold text-slate-800">{stats.activeAlunosCount}</h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-soft bg-white rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Frequência Geral</p>
              <h4 className="text-lg font-bold text-slate-800">{stats.avgAttendance}%</h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-soft bg-white rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Book className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Média Bíblia</p>
              <h4 className="text-lg font-bold text-slate-800">{stats.avgBible}%</h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-soft bg-white rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Aulas</p>
              <h4 className="text-lg font-bold text-slate-800">{stats.totalAulas}</h4>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Frequency Comparison */}
        <Card className="border-none shadow-soft bg-white rounded-2xl">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold text-slate-800 tracking-tight">Frequência por Classe (%)</CardTitle>
            <p className="text-[11px] text-slate-400 font-medium">Percentual médio de presença dos alunos matriculados.</p>
          </CardHeader>
          <CardContent className="p-4 pt-0 h-48">
            {isMounted && classStatsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classStatsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} style={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} style={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "none",
                      borderRadius: 12,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      fontSize: 11,
                    }}
                    formatter={(value) => [`${value}%`, "Frequência"]}
                  />
                  <Bar dataKey="Frequência" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Aguardando registro de dados...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bible Brings Comparison */}
        <Card className="border-none shadow-soft bg-white rounded-2xl">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold text-slate-800 tracking-tight">Média de Bíblias por Classe (%)</CardTitle>
            <p className="text-[11px] text-slate-400 font-medium">Percentual de alunos presentes que trouxeram Bíblia física/digital.</p>
          </CardHeader>
          <CardContent className="p-4 pt-0 h-48">
            {isMounted && classStatsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classStatsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} style={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} style={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "none",
                      borderRadius: 12,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      fontSize: 11,
                    }}
                    formatter={(value) => [`${value}%`, "Média Bíblia"]}
                  />
                  <Bar dataKey="Bíblia" fill="var(--color-info)" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Aguardando registro de dados...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* STUDENT RANKING */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 mb-3 flex items-center gap-1.5">
          <Award className="h-4.5 w-4.5 text-amber-500" />
          Ranking de Alunos Bereias (Maior Engajamento)
        </h4>

        {studentRankings.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-soft text-center text-slate-400 text-xs py-12 border border-slate-100 font-semibold">
            Sem dados de frequência suficientes para gerar o ranking.
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-soft border border-slate-50 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {studentRankings.map((rank, index) => {
                const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}º`;
                return (
                  <div key={rank.student.id} className="flex items-center justify-between p-4 flex-wrap sm:flex-nowrap gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Rank Indicator */}
                      <span className="text-sm font-bold text-slate-500 w-6 text-center leading-none">
                        {medal}
                      </span>
                      <div className="min-w-0 leading-tight">
                        <h5 className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                          {rank.student.nome}
                        </h5>
                        <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                          Classe: {rank.className}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <span className="flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                        <BookOpen className="h-3.5 w-3.5 text-slate-300" />
                        Presenças: {rank.bibles}/{rank.total} com Bíblia
                      </span>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                        {rank.rate}% Freq.
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
