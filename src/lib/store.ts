import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "./supabase";

export interface Classe {
  id: string;
  nome: string;
  departamento: string | null;
  faixa_etaria: string | null;
  professor: string;
  professor_auxiliar: string | null;
  sala: string | null;
  cor: string | null;
  status: "ATIVA" | "INATIVA";
  observacoes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Aluno {
  id: string;
  classe_id: string;
  nome: string;
  sexo: "MASCULINO" | "FEMININO" | null;
  telefone: string | null;
  email: string | null;
  data_nascimento: string | null;
  data_ingresso: string | null;
  status: "ATIVO" | "VISITANTE" | "INATIVO";
  observacoes: string | null;
  funcoes?: string[];
  endereco?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Curso {
  id: string;
  nome: string;
  descricao: string | null;
  professor: string | null;
  carga_horaria: number | null;
  data_inicio: string | null;
  data_fim: string | null;
  status: "PLANEJADO" | "EM_ANDAMENTO" | "CONCLUIDO" | "CANCELADO";
  created_at?: string;
  updated_at?: string;
}

export interface CursoAluno {
  id: string;
  curso_id: string;
  aluno_id: string;
  data_matricula: string;
  created_at?: string;
}

export interface Presenca {
  presente: boolean;
  trouxe_biblia: boolean;
  observacoes?: string | null;
}

export interface Aula {
  id: string;
  classe_id: string;
  data_aula: string; // YYYY-MM-DD
  tema: string;
  numero_licao: number | null;
  professor: string | null;
  professor_substituto: string | null;
  observacoes: string | null;
  presencas: Record<string, Presenca>; // aluno_id -> Presenca
  created_at?: string;
  updated_at?: string;
}

export interface HistoricoClasse {
  id: string;
  aluno_id: string;
  classe_origem_id: string | null;
  classe_destino_id: string | null;
  tipo: "PROMOCAO" | "TRANSFERENCIA" | "INGRESSO" | "INATIVACAO" | "REATIVACAO";
  motivo: string | null;
  data_evento: string;
}

export interface Configuracoes {
  id: string;
  nome_igreja: string;
  ano_letivo: number;
  logo_url: string | null;
  tema: string;
}

export interface EbdStoreData {
  configuracoes: Configuracoes;
  classes: Classe[];
  alunos: Aluno[];
  cursos: Curso[];
  curso_aluno: CursoAluno[];
  aulas: Aula[];
  historico_classes: HistoricoClasse[];
}

export function deserializeAluno(a: any): Aluno {
  let parsedObs = a.observacoes;
  let funcoes: string[] = a.status === "VISITANTE" ? ["Visitante"] : ["Aluno"];
  let endereco: string | null = null;
  if (a.observacoes && a.observacoes.startsWith('{"__metadata":')) {
    try {
      const parsed = JSON.parse(a.observacoes);
      parsedObs = parsed.observacoes || null;
      funcoes = parsed.__metadata?.funcoes || funcoes;
      endereco = parsed.__metadata?.endereco || null;
    } catch (e) {
      console.error("Failed to parse metadata for aluno", a.id, e);
    }
  }
  return {
    ...a,
    observacoes: parsedObs,
    funcoes,
    endereco
  };
}

// Fixed UUIDs for Mock Data Consistency
const CLASSE_ADULTOS = "c1c1c1c1-1111-1111-1111-111111111111";
const CLASSE_JOVENS = "c2c2c2c2-2222-2222-2222-222222222222";
const CLASSE_JUNIORES = "c3c3c3c3-3333-3333-3333-333333333333";
const CLASSE_CASAIS = "c4c4c4c4-4444-4444-4444-444444444444";

const ALUNO_ANDRE = "a1a1a1a1-1111-1111-1111-111111111111";
const ALUNO_BEATRIZ = "a2a2a2a2-2222-2222-2222-222222222222";
const ALUNO_GABRIEL = "a3a3a3a3-3333-3333-3333-333333333333";
const ALUNO_CARLOS = "a4a4a4a4-4444-4444-4444-444444444444";
const ALUNO_DANIELA = "a5a5a5a5-5555-5555-5555-555555555555";
const ALUNO_FERNANDA = "a6a6a6a6-6666-6666-6666-666666666666";
const ALUNO_EDUARDO = "a7a7a7a7-7777-7777-7777-777711111111";
const ALUNO_LUCAS = "a8a8a8a8-8888-8888-8888-888888888888";

const CURSO_TEOLOGIA = "b1b1b1b1-1111-1111-1111-111111111111";
const CURSO_HISTORIA = "b2b2b2b2-2222-2222-2222-222222222222";
const CURSO_VIDACRISTA = "b3b3b3b3-3333-3333-3333-333333333333";

const DEFAULT_DATA: EbdStoreData = {
  configuracoes: {
    id: "00000000-0000-0000-0000-000000000001",
    nome_igreja: "Igreja Evangélica da EBD",
    ano_letivo: 2026,
    logo_url: null,
    tema: "default",
  },
  classes: [
    {
      id: CLASSE_ADULTOS,
      nome: "Adultos — Bereia",
      departamento: "Adultos",
      faixa_etaria: "Acima de 25 anos",
      professor: "Pr. Marcos Silva",
      professor_auxiliar: "Pb. Roberto Lima",
      sala: "Templo Principal",
      cor: "emerald",
      status: "ATIVA",
      observacoes: "Classe de estudo bíblico teológico aprofundado para adultos.",
    },
    {
      id: CLASSE_JOVENS,
      nome: "Jovens — Metanoia",
      departamento: "Jovens",
      faixa_etaria: "15 a 25 anos",
      professor: "Ev. Felipe Souza",
      professor_auxiliar: null,
      sala: "Sala 03 Anexo",
      cor: "blue",
      status: "ATIVA",
      observacoes: "Classe dinâmica voltada para jovens e adolescentes.",
    },
    {
      id: CLASSE_JUNIORES,
      nome: "Juniores — Pequenos Discípulos",
      departamento: "Infantil",
      faixa_etaria: "8 a 12 anos",
      professor: "Profa. Ana Costa",
      professor_auxiliar: "Sandra Almeida",
      sala: "Sala das Crianças",
      cor: "amber",
      status: "ATIVA",
      observacoes: "Ensino bíblico lúdico e interativo para os juniores.",
    },
    {
      id: CLASSE_CASAIS,
      nome: "Casais — Aliança",
      departamento: "Família",
      faixa_etaria: "Casados",
      professor: "Pb. Roberto Lima",
      professor_auxiliar: null,
      sala: "Sala 02 Anexo",
      cor: "slate",
      status: "INATIVA",
      observacoes: "Classe especial focada na edificação de casamentos e lares.",
    },
  ],
  alunos: [
    {
      id: ALUNO_ANDRE,
      classe_id: CLASSE_ADULTOS,
      nome: "André Santos",
      sexo: "MASCULINO",
      telefone: "(11) 98765-4321",
      email: "andre.santos@email.com",
      data_nascimento: "1985-05-12",
      data_ingresso: "2026-01-10",
      status: "ATIVO",
      observacoes: null,
    },
    {
      id: ALUNO_BEATRIZ,
      classe_id: CLASSE_ADULTOS,
      nome: "Beatriz Oliveira",
      sexo: "FEMININO",
      telefone: "(11) 97654-3210",
      email: "beatriz.o@email.com",
      data_nascimento: "1990-11-20",
      data_ingresso: "2026-01-15",
      status: "ATIVO",
      observacoes: null,
    },
    {
      id: ALUNO_GABRIEL,
      classe_id: CLASSE_ADULTOS,
      nome: "Gabriel Almeida",
      sexo: "MASCULINO",
      telefone: "(11) 92109-8765",
      email: "gabriel.almeida@email.com",
      data_nascimento: "1982-01-25",
      data_ingresso: "2026-02-01",
      status: "ATIVO",
      observacoes: null,
    },
    {
      id: ALUNO_CARLOS,
      classe_id: CLASSE_JOVENS,
      nome: "Carlos Souza",
      sexo: "MASCULINO",
      telefone: "(11) 96543-2109",
      email: "carlos.souza@email.com",
      data_nascimento: "2005-02-15",
      data_ingresso: "2026-01-11",
      status: "ATIVO",
      observacoes: null,
    },
    {
      id: ALUNO_DANIELA,
      classe_id: CLASSE_JOVENS,
      nome: "Daniela Lima",
      sexo: "FEMININO",
      telefone: "(11) 95432-1098",
      email: "daniela.lima@email.com",
      data_nascimento: "2006-08-30",
      data_ingresso: "2026-06-25",
      status: "VISITANTE",
      observacoes: "Visitante convidada por Carlos.",
    },
    {
      id: ALUNO_FERNANDA,
      classe_id: CLASSE_JUNIORES,
      nome: "Fernanda Costa",
      sexo: "FEMININO",
      telefone: "(11) 93210-9876",
      email: null,
      data_nascimento: "2016-09-05",
      data_ingresso: "2026-03-01",
      status: "ATIVO",
      observacoes: "Filha de Beatriz.",
    },
    {
      id: ALUNO_EDUARDO,
      classe_id: CLASSE_JUNIORES,
      nome: "Eduardo Rocha",
      sexo: "MASCULINO",
      telefone: "(11) 94321-0987",
      email: null,
      data_nascimento: "2015-04-10",
      data_ingresso: "2026-01-20",
      status: "INATIVO",
      observacoes: "Mudou-se de bairro.",
    },
    {
      id: ALUNO_LUCAS,
      classe_id: CLASSE_JOVENS,
      nome: "Lucas Mendes",
      sexo: "MASCULINO",
      telefone: "(11) 91234-5678",
      email: "lucas.mendes@email.com",
      data_nascimento: "2004-12-01",
      data_ingresso: "2026-04-10",
      status: "ATIVO",
      observacoes: null,
    },
  ],
  cursos: [
    {
      id: CURSO_TEOLOGIA,
      nome: "Teologia Sistemática",
      descricao: "Doutrinas da Graça, Trindade e Escatologia.",
      professor: "Pr. Marcos Silva",
      carga_horaria: 40,
      data_inicio: "2026-05-01",
      data_fim: "2026-08-30",
      status: "EM_ANDAMENTO",
    },
    {
      id: CURSO_HISTORIA,
      nome: "História da Igreja",
      descricao: "Os principais movimentos cristãos desde Atos dos Apóstolos.",
      professor: "Ev. Felipe Souza",
      carga_horaria: 20,
      data_inicio: "2026-06-01",
      data_fim: "2026-08-01",
      status: "EM_ANDAMENTO",
    },
    {
      id: CURSO_VIDACRISTA,
      nome: "Vida Cristã Prática",
      descricao: "Estudos práticos para o dia a dia do cristão.",
      professor: "Pb. Roberto Lima",
      carga_horaria: 12,
      data_inicio: "2026-02-01",
      data_fim: "2026-04-15",
      status: "CONCLUIDO",
    },
  ],
  curso_aluno: [
    { id: "ca1", curso_id: CURSO_TEOLOGIA, aluno_id: ALUNO_ANDRE, data_matricula: "2026-05-01" },
    { id: "ca2", curso_id: CURSO_TEOLOGIA, aluno_id: ALUNO_BEATRIZ, data_matricula: "2026-05-01" },
    { id: "ca3", curso_id: CURSO_HISTORIA, aluno_id: ALUNO_CARLOS, data_matricula: "2026-06-01" },
    { id: "ca4", curso_id: CURSO_HISTORIA, aluno_id: ALUNO_LUCAS, data_matricula: "2026-06-02" },
  ],
  aulas: [
    {
      id: "au1",
      classe_id: CLASSE_ADULTOS,
      data_aula: "2026-06-21",
      tema: "Introdução à Epístola aos Romanos",
      numero_licao: 1,
      professor: "Pr. Marcos Silva",
      professor_substituto: null,
      observacoes: null,
      presencas: {
        [ALUNO_ANDRE]: { presente: true, trouxe_biblia: true },
        [ALUNO_BEATRIZ]: { presente: true, trouxe_biblia: false },
        [ALUNO_GABRIEL]: { presente: true, trouxe_biblia: true },
      },
    },
    {
      id: "au2",
      classe_id: CLASSE_ADULTOS,
      data_aula: "2026-06-28",
      tema: "Romanos Cap. 1: A Ira de Deus",
      numero_licao: 2,
      professor: "Pr. Marcos Silva",
      professor_substituto: null,
      observacoes: null,
      presencas: {
        [ALUNO_ANDRE]: { presente: true, trouxe_biblia: true },
        [ALUNO_BEATRIZ]: { presente: false, trouxe_biblia: false },
        [ALUNO_GABRIEL]: { presente: true, trouxe_biblia: true },
      },
    },
    {
      id: "au3",
      classe_id: CLASSE_JOVENS,
      data_aula: "2026-06-28",
      tema: "Identidade em Cristo",
      numero_licao: 1,
      professor: "Ev. Felipe Souza",
      professor_substituto: null,
      observacoes: null,
      presencas: {
        [ALUNO_CARLOS]: { presente: true, trouxe_biblia: true },
        [ALUNO_DANIELA]: { presente: true, trouxe_biblia: true },
        [ALUNO_LUCAS]: { presente: true, trouxe_biblia: false },
      },
    },
    {
      id: "au4",
      classe_id: CLASSE_ADULTOS,
      data_aula: "2026-07-05",
      tema: "Romanos Cap. 2: A Justificação",
      numero_licao: 3,
      professor: "Pr. Marcos Silva",
      professor_substituto: null,
      observacoes: null,
      presencas: {
        [ALUNO_ANDRE]: { presente: true, trouxe_biblia: true },
        [ALUNO_BEATRIZ]: { presente: true, trouxe_biblia: true },
        [ALUNO_GABRIEL]: { presente: false, trouxe_biblia: false },
      },
    },
    {
      id: "au5",
      classe_id: CLASSE_JOVENS,
      data_aula: "2026-07-05",
      tema: "Vivendo no Mundo Sem Ser do Mundo",
      numero_licao: 2,
      professor: "Ev. Felipe Souza",
      professor_substituto: null,
      observacoes: null,
      presencas: {
        [ALUNO_CARLOS]: { presente: true, trouxe_biblia: true },
        [ALUNO_DANIELA]: { presente: false, trouxe_biblia: false },
        [ALUNO_LUCAS]: { presente: true, trouxe_biblia: true },
      },
    },
  ],
  historico_classes: [
    {
      id: "h1",
      aluno_id: ALUNO_ANDRE,
      classe_origem_id: null,
      classe_destino_id: CLASSE_ADULTOS,
      tipo: "INGRESSO",
      motivo: "Ingresso inicial do aluno no sistema.",
      data_evento: "2026-01-10T12:00:00Z",
    },
    {
      id: "h2",
      aluno_id: ALUNO_CARLOS,
      classe_origem_id: null,
      classe_destino_id: CLASSE_JOVENS,
      tipo: "INGRESSO",
      motivo: "Ingresso inicial do aluno no sistema.",
      data_evento: "2026-01-11T12:00:00Z",
    },
    {
      id: "h3",
      aluno_id: ALUNO_EDUARDO,
      classe_origem_id: CLASSE_JUNIORES,
      classe_destino_id: null,
      tipo: "INATIVACAO",
      motivo: "Aluno inativado no sistema. Mudou-se de bairro.",
      data_evento: "2026-05-15T15:00:00Z",
    },
  ],
};

function generateUUID() {
  try {
    if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
  } catch {}
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function syncFromSupabase() {
  if (!isSupabaseConfigured || !supabase) return;
  const isDemo = typeof window !== "undefined" && window.localStorage.getItem("ebd_demo_mode") === "true";
  if (isDemo) return;

  try {
    const { data: config } = await supabase.from("configuracoes").select("*").maybeSingle();
    const { data: classes } = await supabase.from("classes").select("*");
    const { data: alunos } = await supabase.from("alunos").select("*");
    const { data: courses } = await supabase.from("courses").select("*");
    const { data: enrollments } = await supabase.from("curso_aluno").select("*");
    const { data: aulas } = await supabase.from("aulas").select("*");
    const { data: presencas } = await supabase.from("presencas").select("*");
    const { data: historicos } = await supabase.from("historico_classes").select("*");

    const store = getEbdStore();

    if (config) {
      store.configuracoes = {
        id: config.id,
        nome_igreja: config.nome_igreja,
        ano_letivo: config.ano_letivo,
        logo_url: config.logo_url,
        tema: config.tema,
      };
    }

    if (classes) {
      store.classes = classes.map((c) => ({
        id: c.id,
        nome: c.nome,
        departamento: c.departamento,
        faixa_etaria: c.faixa_etaria,
        professor: c.professor,
        professor_auxiliar: c.professor_auxiliar,
        sala: c.sala,
        cor: c.cor,
        status: c.status,
        observacoes: c.observacoes,
      }));
    }

    if (alunos) {
      store.alunos = alunos.map((a) => deserializeAluno(a));
    }

    if (courses) {
      store.cursos = courses.map((c) => ({
        id: c.id,
        nome: c.nome,
        descricao: c.descricao,
        professor: c.professor,
        carga_horaria: c.carga_horaria,
        data_inicio: c.data_inicio,
        data_fim: c.data_fim,
        status: c.status,
      }));
    }

    if (enrollments) {
      store.curso_aluno = enrollments.map((e) => ({
        id: e.id,
        curso_id: e.curso_id,
        aluno_id: e.aluno_id,
        data_matricula: e.data_matricula,
      }));
    }

    if (aulas) {
      const presencasMap: Record<string, Record<string, Presenca>> = {};
      aulas.forEach((a) => {
        presencasMap[a.id] = {};
      });

      if (presencas) {
        presencas.forEach((p) => {
          if (presencasMap[p.aula_id]) {
            presencasMap[p.aula_id][p.aluno_id] = {
              presente: p.presente,
              trouxe_biblia: p.trouxe_biblia,
              observacoes: p.observacoes,
            };
          }
        });
      }

      store.aulas = aulas.map((a) => ({
        id: a.id,
        classe_id: a.classe_id,
        data_aula: a.data_aula,
        tema: a.tema,
        numero_licao: a.numero_licao,
        professor: a.professor,
        professor_substituto: a.professor_substituto,
        observacoes: a.observacoes,
        presencas: presencasMap[a.id] || {},
      }));
    }

    if (historicos) {
      store.historico_classes = historicos.map((h) => ({
        id: h.id,
        aluno_id: h.aluno_id,
        classe_origem_id: h.classe_origem_id,
        classe_destino_id: h.classe_destino_id,
        tipo: h.tipo,
        motivo: h.motivo,
        data_evento: h.data_evento,
      }));
    }

    saveEbdStore(store);
  } catch (err) {
    console.error("Failed to sync from Supabase", err);
  }
}

const STORAGE_KEY = "ebd_flow_data_v2";

const listeners = new Set<() => void>();

export function getEbdStore(): EbdStoreData {
  if (typeof window === "undefined") {
    return DEFAULT_DATA;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
    return DEFAULT_DATA;
  }
  try {
    const data = JSON.parse(raw) as EbdStoreData;
    if (data.alunos) {
      data.alunos = data.alunos.map(deserializeAluno);
    }
    return data;
  } catch (e) {
    console.error("Erro ao parsear dados do localStorage, resetando...", e);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
    return DEFAULT_DATA;
  }
}

export function saveEbdStore(data: EbdStoreData) {
  if (typeof window !== "undefined") {
    const serializedAlunos = data.alunos.map(a => {
      const { funcoes, endereco, ...rest } = a;
      let serializedObs = rest.observacoes;
      if (funcoes || endereco) {
        serializedObs = JSON.stringify({
          __metadata: { funcoes: funcoes || [], endereco: endereco || null },
          observacoes: rest.observacoes || null
        });
      }
      return { ...rest, observacoes: serializedObs } as Aluno;
    });
    const serializedData = { ...data, alunos: serializedAlunos };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializedData));
    listeners.forEach((listener) => listener());
  }
}

export function resetEbdStore() {
  saveEbdStore(DEFAULT_DATA);
}

export function clearEbdStore() {
  const empty: EbdStoreData = {
    configuracoes: {
      id: "00000000-0000-0000-0000-000000000001",
      nome_igreja: "Igreja Evangélica da EBD",
      ano_letivo: 2026,
      logo_url: null,
      tema: "default",
    },
    classes: [],
    alunos: [],
    cursos: [],
    curso_aluno: [],
    aulas: [],
    historico_classes: [],
  };
  saveEbdStore(empty);
}

// React Hook
export function useEbdStore() {
  const [data, setData] = useState<EbdStoreData>(() => getEbdStore());

  useEffect(() => {
    setData(getEbdStore());

    const handleUpdate = () => {
      setData(getEbdStore());
    };
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  return data;
}

// Helpers with Business and Database rules

// ALUNOS
export function addAluno(aluno: Omit<Aluno, "id">) {
  const store = getEbdStore();

  // Duplicity check: name and telephone coincide
  if (aluno.nome && aluno.telefone) {
    const exists = store.alunos.some(
      (a) => a.nome.trim().toLowerCase() === aluno.nome.trim().toLowerCase() && 
             a.telefone === aluno.telefone
    );
    if (exists) {
      throw new Error("Não é permitida duplicidade por nome e telefone quando ambos coincidirem.");
    }
  }

  // Business rule: "Classe inativa não poderá receber novos alunos."
  const targetClass = store.classes.find((c) => c.id === aluno.classe_id);
  if (targetClass?.status === "INATIVA") {
    throw new Error("Classe inativa não poderá receber novos alunos.");
  }

  const id = generateUUID();
  const newAluno: Aluno = {
    ...aluno,
    id,
    data_ingresso: aluno.data_ingresso || new Date().toISOString().split("T")[0],
  };
  
  store.alunos.push(newAluno);

  // Trigger: Insert history for INGRESSO
  const newHistory: HistoricoClasse = {
    id: generateUUID(),
    aluno_id: id,
    classe_origem_id: null,
    classe_destino_id: aluno.classe_id,
    tipo: "INGRESSO",
    motivo: "Ingresso inicial do aluno no sistema.",
    data_evento: new Date().toISOString(),
  };
  store.historico_classes.push(newHistory);

  saveEbdStore(store);

  // Sync to Supabase
  if (isSupabaseConfigured && supabase) {
    const isDemo = typeof window !== "undefined" && window.localStorage.getItem("ebd_demo_mode") === "true";
    if (!isDemo) {
      // Serialize observations for Supabase
      const { funcoes, endereco, ...rest } = newAluno;
      let serializedObs = rest.observacoes;
      if (funcoes || endereco) {
        serializedObs = JSON.stringify({
          __metadata: { funcoes: funcoes || [], endereco: endereco || null },
          observacoes: rest.observacoes || null
        });
      }

      supabase.from("alunos").insert({
        id,
        classe_id: aluno.classe_id,
        nome: aluno.nome,
        sexo: aluno.sexo,
        telefone: aluno.telefone,
        email: aluno.email,
        data_nascimento: aluno.data_nascimento,
        data_ingresso: newAluno.data_ingresso,
        status: aluno.status,
        observacoes: serializedObs,
      }).then(({ error }) => {
        if (error) console.error("Error syncing addAluno:", error);
      });
    }
  }

  return newAluno;
}

export function updateAluno(aluno: Aluno) {
  const store = getEbdStore();
  const oldAluno = store.alunos.find((a) => a.id === aluno.id);

  if (!oldAluno) return;

  // Duplicity check: name and telephone coincide
  if (aluno.nome && aluno.telefone) {
    const exists = store.alunos.some(
      (a) => a.id !== aluno.id &&
             a.nome.trim().toLowerCase() === aluno.nome.trim().toLowerCase() && 
             a.telefone === aluno.telefone
    );
    if (exists) {
      throw new Error("Não é permitida duplicidade por nome e telefone quando ambos coincidirem.");
    }
  }

  // Business rule: "Pessoa inativa não poderá ser vinculada a novas classes ou cursos."
  // And "Classe inativa não poderá receber novos alunos."
  if (oldAluno.classe_id !== aluno.classe_id) {
    if (aluno.status === "INATIVO") {
      throw new Error("Pessoa inativa não poderá ser vinculada a novas classes.");
    }
    const targetClass = store.classes.find((c) => c.id === aluno.classe_id);
    if (targetClass?.status === "INATIVA") {
      throw new Error("Classe inativa não poderá receber novos alunos.");
    }
  }

  store.alunos = store.alunos.map((a) => (a.id === aluno.id ? aluno : a));

  // Trigger: check if class changed
  if (oldAluno.classe_id !== aluno.classe_id) {
    const oldClass = store.classes.find((c) => c.id === oldAluno.classe_id);
    const newClass = store.classes.find((c) => c.id === aluno.classe_id);
    const isPromo = oldClass?.departamento !== newClass?.departamento;

    const newHistory: HistoricoClasse = {
      id: generateUUID(),
      aluno_id: aluno.id,
      classe_origem_id: oldAluno.classe_id || null,
      classe_destino_id: aluno.classe_id,
      tipo: isPromo ? "PROMOCAO" : "TRANSFERENCIA",
      motivo: `Mudança de classe da turma "${oldClass?.nome || "Sem classe"}" para "${newClass?.nome || "Sem classe"}".`,
      data_evento: new Date().toISOString(),
    };
    store.historico_classes.push(newHistory);
  }

  // Trigger: check if status changed
  if (oldAluno.status !== aluno.status) {
    let type: "INATIVACAO" | "REATIVACAO" | null = null;
    let desc = "";

    if (aluno.status === "INATIVO") {
      type = "INATIVACAO";
      desc = "Aluno inativado no sistema.";
    } else if (aluno.status === "ATIVO" && oldAluno.status === "INATIVO") {
      type = "REATIVACAO";
      desc = "Aluno reativado no sistema.";
    }

    if (type) {
      const newHistory: HistoricoClasse = {
        id: generateUUID(),
        aluno_id: aluno.id,
        classe_origem_id: aluno.classe_id,
        classe_destino_id: aluno.classe_id,
        tipo: type,
        motivo: desc,
        data_evento: new Date().toISOString(),
      };
      store.historico_classes.push(newHistory);
    }
  }

  saveEbdStore(store);

  // Sync to Supabase
  if (isSupabaseConfigured && supabase) {
    const isDemo = typeof window !== "undefined" && window.localStorage.getItem("ebd_demo_mode") === "true";
    if (!isDemo) {
      // Serialize observations for Supabase
      const { funcoes, endereco, ...rest } = aluno;
      let serializedObs = rest.observacoes;
      if (funcoes || endereco) {
        serializedObs = JSON.stringify({
          __metadata: { funcoes: funcoes || [], endereco: endereco || null },
          observacoes: rest.observacoes || null
        });
      }

      supabase.from("alunos").update({
        classe_id: aluno.classe_id,
        nome: aluno.nome,
        sexo: aluno.sexo,
        telefone: aluno.telefone,
        email: aluno.email,
        data_nascimento: aluno.data_nascimento,
        status: aluno.status,
        observacoes: serializedObs,
      }).eq("id", aluno.id).then(({ error }) => {
        if (error) console.error("Error syncing updateAluno:", error);
      });
    }
  }
}

export function deleteAluno(id: string) {
  const store = getEbdStore();

  // Rule: Não excluir aluno com histórico
  const hasHistory = store.historico_classes.some((h) => h.aluno_id === id && h.tipo !== "INGRESSO");
  if (hasHistory) {
    throw new Error("Não é possível excluir um aluno que possui histórico de movimentação. Prefira inativá-lo.");
  }

  // Clean histories linked to the aluno
  store.historico_classes = store.historico_classes.filter((h) => h.aluno_id !== id);
  // Clean matriculas in courses
  store.curso_aluno = store.curso_aluno.filter((ca) => ca.aluno_id !== id);
  // Clean student row
  store.alunos = store.alunos.filter((a) => a.id !== id);

  saveEbdStore(store);

  // Sync to Supabase
  if (isSupabaseConfigured && supabase) {
    const isDemo = typeof window !== "undefined" && window.localStorage.getItem("ebd_demo_mode") === "true";
    if (!isDemo) {
      supabase.from("alunos").delete().eq("id", id).then(({ error }) => {
        if (error) console.error("Error syncing deleteAluno:", error);
      });
    }
  }
}

// CLASSES
export function addClasse(classe: Omit<Classe, "id">) {
  const store = getEbdStore();
  const nameExists = store.classes.some((c) => c.nome.trim().toLowerCase() === classe.nome.trim().toLowerCase());
  if (nameExists) {
    throw new Error("Já existe uma classe cadastrada com este nome.");
  }
  const id = generateUUID();
  const newClasse: Classe = {
    ...classe,
    id,
  };
  store.classes.push(newClasse);
  saveEbdStore(store);

  // Sync to Supabase
  if (isSupabaseConfigured && supabase) {
    const isDemo = typeof window !== "undefined" && window.localStorage.getItem("ebd_demo_mode") === "true";
    if (!isDemo) {
      supabase.from("classes").insert({
        id,
        nome: classe.nome,
        departamento: classe.departamento,
        faixa_etaria: classe.faixa_etaria,
        professor: classe.professor,
        professor_auxiliar: classe.professor_auxiliar,
        sala: classe.sala,
        cor: classe.cor,
        status: classe.status,
        observacoes: classe.observacoes,
      }).then(({ error }) => {
        if (error) console.error("Error syncing addClasse:", error);
      });
    }
  }

  return newClasse;
}

export function updateClasse(classe: Classe) {
  const store = getEbdStore();
  const nameExists = store.classes.some(
    (c) => c.id !== classe.id && c.nome.trim().toLowerCase() === classe.nome.trim().toLowerCase()
  );
  if (nameExists) {
    throw new Error("Já existe uma classe cadastrada com este nome.");
  }
  store.classes = store.classes.map((c) => (c.id === classe.id ? classe : c));
  saveEbdStore(store);

  // Sync to Supabase
  if (isSupabaseConfigured && supabase) {
    const isDemo = typeof window !== "undefined" && window.localStorage.getItem("ebd_demo_mode") === "true";
    if (!isDemo) {
      supabase.from("classes").update({
        nome: classe.nome,
        departamento: classe.departamento,
        faixa_etaria: classe.faixa_etaria,
        professor: classe.professor,
        professor_auxiliar: classe.professor_auxiliar,
        sala: classe.sala,
        cor: classe.cor,
        status: classe.status,
        observacoes: classe.observacoes,
      }).eq("id", classe.id).then(({ error }) => {
        if (error) console.error("Error syncing updateClasse:", error);
      });
    }
  }
}

export function deleteClasse(id: string) {
  const store = getEbdStore();

  // Rule: Não excluir classe que possua alunos
  const hasStudents = store.alunos.some((a) => a.classe_id === id);
  if (hasStudents) {
    throw new Error("Não é possível excluir uma classe que possui alunos vinculados. Remova ou transfira os alunos primeiro.");
  }

  // Rule: Não excluir classe que possua aulas lecionadas
  const hasAulas = store.aulas.some((a) => a.classe_id === id);
  if (hasAulas) {
    throw new Error("Não é possível excluir uma classe que possui histórico de aulas lecionadas.");
  }

  store.classes = store.classes.filter((c) => c.id !== id);
  saveEbdStore(store);

  // Sync to Supabase
  if (isSupabaseConfigured && supabase) {
    const isDemo = typeof window !== "undefined" && window.localStorage.getItem("ebd_demo_mode") === "true";
    if (!isDemo) {
      supabase.from("classes").delete().eq("id", id).then(({ error }) => {
        if (error) console.error("Error syncing deleteClasse:", error);
      });
    }
  }
}

// CURSOS
export function addCurso(curso: Omit<Curso, "id">) {
  const store = getEbdStore();
  const id = generateUUID();
  const newCurso: Curso = {
    ...curso,
    id,
  };
  store.cursos.push(newCurso);
  saveEbdStore(store);

  // Sync to Supabase
  if (isSupabaseConfigured && supabase) {
    const isDemo = typeof window !== "undefined" && window.localStorage.getItem("ebd_demo_mode") === "true";
    if (!isDemo) {
      supabase.from("courses").insert({
        id,
        nome: curso.nome,
        descricao: curso.descricao,
        professor: curso.professor,
        carga_horaria: curso.carga_horaria,
        data_inicio: curso.data_inicio,
        data_fim: curso.data_fim,
        status: curso.status,
      }).then(({ error }) => {
        if (error) console.error("Error syncing addCurso:", error);
      });
    }
  }

  return newCurso;
}

export function updateCurso(curso: Curso) {
  const store = getEbdStore();
  store.cursos = store.cursos.map((c) => (c.id === curso.id ? curso : c));
  saveEbdStore(store);

  // Sync to Supabase
  if (isSupabaseConfigured && supabase) {
    const isDemo = typeof window !== "undefined" && window.localStorage.getItem("ebd_demo_mode") === "true";
    if (!isDemo) {
      supabase.from("courses").update({
        nome: curso.nome,
        descricao: curso.descricao,
        professor: curso.professor,
        carga_horaria: curso.carga_horaria,
        data_inicio: curso.data_inicio,
        data_fim: curso.data_fim,
        status: curso.status,
      }).eq("id", curso.id).then(({ error }) => {
        if (error) console.error("Error syncing updateCurso:", error);
      });
    }
  }
}

export function deleteCurso(id: string) {
  const store = getEbdStore();

  // Rule: Não excluir curso com matrículas
  const hasMatriculas = store.curso_aluno.some((ca) => ca.curso_id === id);
  if (hasMatriculas) {
    throw new Error("Não é possível excluir um curso que possui alunos matriculados.");
  }

  store.cursos = store.cursos.filter((c) => c.id !== id);
  saveEbdStore(store);

  // Sync to Supabase
  if (isSupabaseConfigured && supabase) {
    const isDemo = typeof window !== "undefined" && window.localStorage.getItem("ebd_demo_mode") === "true";
    if (!isDemo) {
      supabase.from("courses").delete().eq("id", id).then(({ error }) => {
        if (error) console.error("Error syncing deleteCurso:", error);
      });
    }
  }
}

// CURSO MATRICULAS (N:N)
export function matricularAlunoCurso(cursoId: string, alunoId: string) {
  const store = getEbdStore();

  // Rule: "Curso concluído não aceitará novas matrículas."
  const curso = store.cursos.find((c) => c.id === cursoId);
  if (curso?.status === "CONCLUIDO") {
    throw new Error("Curso concluído não aceita novas matrículas.");
  }

  // Rule: "Pessoa inativa não poderá ser vinculada a novas classes ou cursos."
  const aluno = store.alunos.find((a) => a.id === alunoId);
  if (aluno?.status === "INATIVO") {
    throw new Error("Pessoas inativas não podem ser vinculadas a novos cursos.");
  }

  // Prevents duplication constraint
  const alreadyEnrolled = store.curso_aluno.some((ca) => ca.curso_id === cursoId && ca.aluno_id === alunoId);
  if (alreadyEnrolled) {
    throw new Error("Aluno já matriculado neste curso.");
  }

  const id = generateUUID();
  const newMatricula: CursoAluno = {
    id,
    curso_id: cursoId,
    aluno_id: alunoId,
    data_matricula: new Date().toISOString().split("T")[0],
  };

  store.curso_aluno.push(newMatricula);
  saveEbdStore(store);

  // Sync to Supabase
  if (isSupabaseConfigured && supabase) {
    const isDemo = typeof window !== "undefined" && window.localStorage.getItem("ebd_demo_mode") === "true";
    if (!isDemo) {
      supabase.from("curso_aluno").insert({
        id,
        curso_id: cursoId,
        aluno_id: alunoId,
        data_matricula: newMatricula.data_matricula,
      }).then(({ error }) => {
        if (error) console.error("Error syncing matricularAlunoCurso:", error);
      });
    }
  }

  return newMatricula;
}

export function desmatricularAlunoCurso(cursoId: string, alunoId: string) {
  const store = getEbdStore();
  store.curso_aluno = store.curso_aluno.filter((ca) => !(ca.curso_id === cursoId && ca.aluno_id === alunoId));
  saveEbdStore(store);

  // Sync to Supabase
  if (isSupabaseConfigured && supabase) {
    const isDemo = typeof window !== "undefined" && window.localStorage.getItem("ebd_demo_mode") === "true";
    if (!isDemo) {
      supabase.from("curso_aluno").delete().eq("curso_id", cursoId).eq("aluno_id", alunoId).then(({ error }) => {
        if (error) console.error("Error syncing desmatricularAlunoCurso:", error);
      });
    }
  }
}

// AULAS AND PRESENCES
export function addAula(aula: Omit<Aula, "id">) {
  const store = getEbdStore();

  // Rule: Uma classe poderá possuir apenas uma aula por data
  const dateExists = store.aulas.some((a) => a.classe_id === aula.classe_id && a.data_aula === aula.data_aula);
  if (dateExists) {
    throw new Error("Esta classe já possui uma aula registrada para esta data.");
  }

  const id = generateUUID();
  const newAula: Aula = {
    ...aula,
    id,
  };

  // Rule checks: trouxe_biblia can only be true if presente is true
  Object.keys(newAula.presencas).forEach((studentId) => {
    const p = newAula.presencas[studentId];
    if (p && p.trouxe_biblia && !p.presente) {
      p.trouxe_biblia = false;
    }
  });

  store.aulas.push(newAula);
  saveEbdStore(store);

  // Sync to Supabase
  if (isSupabaseConfigured && supabase) {
    const isDemo = typeof window !== "undefined" && window.localStorage.getItem("ebd_demo_mode") === "true";
    if (!isDemo) {
      supabase.from("aulas").insert({
        id,
        classe_id: aula.classe_id,
        data_aula: aula.data_aula,
        tema: aula.tema,
        numero_licao: aula.numero_licao,
        professor: aula.professor,
        professor_substituto: aula.professor_substituto,
        observacoes: aula.observacoes,
      }).then(({ error }) => {
        if (error) {
          console.error("Error syncing addAula:", error);
          return;
        }
        // Sync presences
        const presencesToInsert = Object.entries(newAula.presencas).map(([alunoId, p]) => ({
          aula_id: id,
          aluno_id: alunoId,
          presente: p.presente,
          trouxe_biblia: p.trouxe_biblia,
          observacoes: p.observacoes || null,
        }));
        if (presencesToInsert.length > 0) {
          supabase.from("presencas").insert(presencesToInsert).then(({ error: pError }) => {
            if (pError) console.error("Error syncing presences to Supabase:", pError);
          });
        }
      });
    }
  }

  return newAula;
}

export function deleteAula(id: string) {
  const store = getEbdStore();
  store.aulas = store.aulas.filter((a) => a.id !== id);
  saveEbdStore(store);

  // Sync to Supabase
  if (isSupabaseConfigured && supabase) {
    const isDemo = typeof window !== "undefined" && window.localStorage.getItem("ebd_demo_mode") === "true";
    if (!isDemo) {
      supabase.from("aulas").delete().eq("id", id).then(({ error }) => {
        if (error) console.error("Error syncing deleteAula:", error);
      });
    }
  }
}

// CONFIGURACOES
export function updateConfiguracoes(igrejaNome: string, anoLetivo: number = 2026) {
  const store = getEbdStore();
  store.configuracoes.nome_igreja = igrejaNome;
  store.configuracoes.ano_letivo = anoLetivo;
  saveEbdStore(store);

  // Sync to Supabase
  if (isSupabaseConfigured && supabase) {
    const isDemo = typeof window !== "undefined" && window.localStorage.getItem("ebd_demo_mode") === "true";
    if (!isDemo) {
      supabase.from("configuracoes").update({
        nome_igreja: igrejaNome,
        ano_letivo: anoLetivo,
      }).eq("id", "00000000-0000-0000-0000-000000000001").then(({ error }) => {
        if (error) console.error("Error syncing updateConfiguracoes:", error);
      });
    }
  }
}
