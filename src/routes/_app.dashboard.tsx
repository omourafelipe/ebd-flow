import { createFileRoute, Link } from "@tanstack/react-router";
import { useEbdStore } from "@/lib/store";
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
  TrendingUp,
  BookOpenCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

// ─── Types ─────────────────────────────────────────────────────────────────
type StatTone = "primary" | "success" | "info" | "warning";

interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  tone: StatTone;
}

interface AlertItem {
  type: "info" | "warning" | "success";
  title: string;
  message: string;
}

// ─── Tone maps (semantic tokens only) ──────────────────────────────────────
const toneIconBg: Record<StatTone, string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success/10 text-success",
  info: "bg-info/10 text-info",
  warning: "bg-warning/15 text-warning-foreground",
};

const alertToneMap: Record<AlertItem["type"], { bg: string; text: string; Icon: React.ComponentType<{ className?: string }> }> = {
  info: { bg: "bg-info/10", text: "text-info", Icon: Info },
  warning: { bg: "bg-destructive/10", text: "text-destructive", Icon: AlertTriangle },
  success: { bg: "bg-success/10", text: "text-success", Icon: CheckCircle2 },
};

// ─── Presentational components ─────────────────────────────────────────────
function StatCard({ label, value, hint, icon: Icon, tone }: StatCardProps) {
  return (
    <Card className="border-border/60 shadow-soft">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${toneIconBg[tone]}`}>
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <h4 className="text-xl font-bold text-foreground leading-tight">{value}</h4>
          {hint ? <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.08em] px-1">
      {children}
    </h4>
  );
}

// ─── Main component ───────────────────────────────────────────────────────
function Dashboard() {
  const store = useEbdStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const totalAlunos = store.matriculas.filter((m) => m.situacao === "ATIVO").length;
  const visitantes = store.alunos.filter((a) => a.status === "VISITANTE").length;
  const cursosAtivos = store.cursos.filter((c) => c.status === "EM_ANDAMENTO").length;
  const classesAtivas = store.classes.filter((c) => c.status === "ATIVA").length;

  // Última aula registrada
  const sortedAulas = [...store.aulas].sort(
    (a, b) => new Date(b.data_aula).getTime() - new Date(a.data_aula).getTime(),
  );
  const lastAula = sortedAulas[0];
  const lastAulaPresentes = lastAula
    ? Object.values(lastAula.presencas).filter((p) => p.presente).length
    : 0;
  const lastAulaTotal = lastAula ? Object.values(lastAula.presencas).length : 0;
  const lastAulaTaxa =
    lastAulaTotal > 0 ? Math.round((lastAulaPresentes / lastAulaTotal) * 100) : 0;

  // Alertas
  const alerts: AlertItem[] = (() => {
    const list: AlertItem[] = [];

    const inactive = store.classes.filter((c) => c.status === "INATIVA");
    if (inactive.length > 0) {
      list.push({
        type: "info",
        title: "Classes inativas",
        message: `A classe "${inactive[0].nome}" está inativa no momento.`,
      });
    }

    store.classes.forEach((c) => {
      if (c.status !== "ATIVA") return;
      const count = store.matriculas.filter((m) => m.classe_id === c.id && m.situacao === "ATIVO").length;
      if (count === 0) {
        list.push({
          type: "warning",
          title: "Classe sem alunos",
          message: `A classe "${c.nome}" está ativa mas ainda não possui alunos matriculados.`,
        });
      }
    });

    if (lastAula) {
      const classActiveStudentIds = store.matriculas
        .filter((m) => m.classe_id === lastAula.classe_id && m.situacao === "ATIVO")
        .map((m) => m.aluno_id);

      const faltosos = store.alunos.filter(
        (a) =>
          classActiveStudentIds.includes(a.id) &&
          lastAula.presencas[a.id] &&
          !lastAula.presencas[a.id].presente,
      );
      if (faltosos.length > 0) {
        const nomes = faltosos.slice(0, 2).map((a) => a.nome).join(" e ");
        const resto = faltosos.length > 2 ? ` e outros ${faltosos.length - 2}` : "";
        list.push({
          type: "warning",
          title: "Alunos faltosos",
          message: `${nomes}${resto} não compareceram na última aula.`,
        });
      }
    }

    if (list.length === 0) {
      list.push({
        type: "success",
        title: "Tudo em ordem",
        message: "Todas as classes ativas possuem alunos e os registros estão em dia.",
      });
    }

    return list;
  })();

  // Alunos por classe
  const classData = store.classes
    .filter((c) => c.status === "ATIVA")
    .map((c) => ({
      name: c.nome.split(/[—–-]/)[0].trim(),
      Alunos: store.matriculas.filter((m) => m.classe_id === c.id && m.situacao === "ATIVO").length,
    }));

  // Frequência histórica (últimas 5 aulas por data)
  const attendanceByDate: Record<string, { presents: number; total: number }> = {};
  store.aulas.forEach((aula) => {
    const values = Object.values(aula.presencas);
    const presents = values.filter((p) => p.presente).length;
    if (!attendanceByDate[aula.data_aula]) {
      attendanceByDate[aula.data_aula] = { presents: 0, total: 0 };
    }
    attendanceByDate[aula.data_aula].presents += presents;
    attendanceByDate[aula.data_aula].total += values.length;
  });
  const historyData = Object.keys(attendanceByDate)
    .sort()
    .slice(-5)
    .map((date) => {
      const val = attendanceByDate[date];
      const rate = val.total > 0 ? Math.round((val.presents / val.total) * 100) : 0;
      const [, m, d] = date.split("-");
      return { data: `${d}/${m}`, Frequência: rate };
    });

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-foreground tracking-tight">Visão geral</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Indicadores rápidos da Escola Bíblica Dominical.
          </p>
        </div>
        {lastAula ? (
          <Badge
            variant="secondary"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full text-[10px] font-semibold"
          >
            <TrendingUp className="h-3 w-3" />
            Última aula: {lastAulaTaxa}% presentes
          </Badge>
        ) : null}
      </div>

      {/* Cards de estatística */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Alunos"
          value={totalAlunos}
          hint={`${classesAtivas} ${classesAtivas === 1 ? "classe ativa" : "classes ativas"}`}
          icon={Users}
          tone="primary"
        />
        <StatCard
          label="Presentes"
          value={lastAulaPresentes}
          hint={lastAula ? `de ${lastAulaTotal} na última aula` : "sem aula registrada"}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Visitantes"
          value={visitantes}
          hint="Cadastro em aberto"
          icon={UserPlus}
          tone="info"
        />
        <StatCard
          label="Cursos"
          value={cursosAtivos}
          hint="em andamento"
          icon={GraduationCap}
          tone="warning"
        />
      </div>

      {/* Ações rápidas */}
      <Card className="border-border/60 shadow-soft">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.08em]">
            Ações rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Button
            asChild
            className="w-full rounded-xl h-auto py-4 text-xs font-semibold flex flex-col items-center gap-1.5 shadow-soft"
          >
            <Link to="/aulas/registrar">
              <CalendarPlus className="h-5 w-5" />
              <span>Registrar aula</span>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full rounded-xl h-auto py-4 text-xs font-semibold flex flex-col items-center gap-1.5"
          >
            <Link to="/alunos" search={{ novo: "true" }}>
              <UserPlus className="h-5 w-5 text-muted-foreground" />
              <span>Novo aluno</span>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full rounded-xl h-auto py-4 text-xs font-semibold flex flex-col items-center gap-1.5"
          >
            <Link to="/classes" search={{ nova: "true" }}>
              <Plus className="h-5 w-5 text-muted-foreground" />
              <span>Nova classe</span>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full rounded-xl h-auto py-4 text-xs font-semibold flex flex-col items-center gap-1.5"
          >
            <Link to="/relatorios">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span>Relatórios</span>
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60 shadow-soft">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold text-foreground tracking-tight">
              Frequência da EBD
            </CardTitle>
            <p className="text-[11px] text-muted-foreground font-medium">
              Percentual de presença nas últimas aulas.
            </p>
          </CardHeader>
          <CardContent className="p-4 pt-0 h-56">
            {isMounted && historyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="data"
                    tickLine={false}
                    axisLine={false}
                    style={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    style={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-popover)",
                      color: "var(--color-popover-foreground)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      boxShadow: "var(--shadow-elevated)",
                      fontSize: 11,
                    }}
                    formatter={(value) => [`${value}%`, "Frequência"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="Frequência"
                    stroke="var(--color-primary)"
                    strokeWidth={2.5}
                    dot={{ fill: "var(--color-primary)", r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: "var(--color-primary)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart
                icon={TrendingUp}
                message="Aguardando registro de aulas para exibir a frequência."
              />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-soft">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold text-foreground tracking-tight">
              Alunos por classe
            </CardTitle>
            <p className="text-[11px] text-muted-foreground font-medium">
              Distribuição atual das classes ativas.
            </p>
          </CardHeader>
          <CardContent className="p-4 pt-0 h-56">
            {isMounted && classData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    style={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    style={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--color-muted)" }}
                    contentStyle={{
                      backgroundColor: "var(--color-popover)",
                      color: "var(--color-popover-foreground)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      boxShadow: "var(--shadow-elevated)",
                      fontSize: 11,
                    }}
                  />
                  <Bar dataKey="Alunos" fill="var(--color-primary)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart
                icon={BookOpenCheck}
                message="Nenhuma classe ativa. Cadastre uma classe para começar."
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      <div className="space-y-3">
        <SectionTitle>Alertas e avisos</SectionTitle>
        <div className="space-y-2">
          {alerts.map((alert, index) => {
            const { bg, text, Icon } = alertToneMap[alert.type];
            return (
              <Card key={index} className="border-border/60 shadow-soft">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${bg} ${text}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="text-xs font-bold text-foreground mb-0.5">{alert.title}</p>
                    <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                      {alert.message}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EmptyChart({
  icon: Icon,
  message,
}: {
  icon: React.ComponentType<{ className?: string }>;
  message: string;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-[11px] font-medium text-center max-w-[220px]">{message}</p>
    </div>
  );
}
