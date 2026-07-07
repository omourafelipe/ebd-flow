import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  BarChart3,
  CalendarCheck,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

const pillars = [
  { title: "Simplicidade", desc: "Nenhuma tarefa frequente exige mais que três ações." },
  { title: "Velocidade", desc: "Registrar uma aula em menos de dois minutos." },
  { title: "Clareza", desc: "As informações essenciais visíveis de imediato." },
  { title: "Confiabilidade", desc: "Você nunca fica em dúvida se uma ação foi concluída." },
];

const modules = [
  { icon: Users, label: "Alunos", desc: "Cadastro e acompanhamento" },
  { icon: GraduationCap, label: "Professores", desc: "Equipe e responsabilidades" },
  { icon: BookOpen, label: "Turmas", desc: "Classes e trimestres" },
  { icon: CalendarCheck, label: "Aulas", desc: "Registro rápido de presença" },
  { icon: ClipboardList, label: "Chamadas", desc: "Frequência e visitantes" },
  { icon: BarChart3, label: "Relatórios", desc: "Indicadores da EBD" },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BookOpen className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-foreground">EBD Gestão</p>
              <p className="text-xs text-muted-foreground">Escola Bíblica Dominical</p>
            </div>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Fundação do produto — v1.0
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            A gestão da sua Escola Bíblica,
            <br className="hidden sm:block" />
            <span className="text-primary"> organizada no seu bolso.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Substitua planilhas e controles em papel por uma plataforma moderna,
            rápida e confiável — pensada para ser administrada por um smartphone,
            em poucos toques.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
            >
              Começar agora
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Conhecer o sistema
            </Link>
          </div>
        </div>
      </section>

      {/* Módulos */}
      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Módulos do sistema
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Tudo o que a administração da EBD precisa, em um só lugar.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="group rounded-xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-elevated"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pilares */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Nossos pilares
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Princípios que guiam cada tela, cada botão e cada interação do produto.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p, i) => (
            <div key={p.title} className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs font-medium text-muted-foreground">
                0{i + 1}
              </p>
              <h3 className="mt-2 text-base font-semibold text-foreground">{p.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-4 py-8 sm:flex-row sm:items-center sm:px-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} EBD Gestão. Sistema de Gestão da Escola Bíblica.
          </p>
          <p className="text-xs text-muted-foreground">Documento 0 — v1.0</p>
        </div>
      </footer>
    </div>
  );
}
