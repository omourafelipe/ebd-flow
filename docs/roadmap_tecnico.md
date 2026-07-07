# DOCUMENTO 5 — ROADMAP TÉCNICO
**Projeto:** Gestão Escola Bíblica  
**Versão:** 1.0  
**Objetivo:** Definir a sequência técnica de desenvolvimento do sistema, organizando entregas, prioridades, dependências e evolução da plataforma.

---

## 1. VISÃO GERAL DO ROADMAP

O desenvolvimento do Gestão Escola Bíblica será conduzido em fases incrementais, priorizando inicialmente a validação da proposta de valor, experiência do usuário e estrutura funcional mínima.

A estratégia técnica seguirá o princípio:
* Construir primeiro a base arquitetural.
* Validar os principais fluxos de uso.
* Implementar módulos essenciais.
* Expandir recursos administrativos e analíticos.
* Preparar a plataforma para crescimento futuro.

O projeto será dividido em:
* **FASE 0** — Fundação e Arquitetura
* **FASE 1** — MVP Operacional
* **FASE 2** — Gestão Acadêmica Completa
* **FASE 3** — Engajamento e Discipulado
* **FASE 4** — Inteligência e Escalabilidade

---

## 2. FASE 0 — FUNDAÇÃO E ARQUITETURA

**Objetivo:** Criar a base técnica e visual do sistema garantindo escalabilidade, organização do código e experiência consistente.  
**Duração estimada:** 1 a 2 semanas

### ENTREGAS PRINCIPAIS:

#### 2.1 Design System
Implementar:
* Identidade visual do sistema.
* Paleta de cores.
* Tipografia.
* Componentes reutilizáveis.
* Biblioteca de elementos UI.

Componentes iniciais:
* Botões, Cards, Tabelas, Modais, Formulários, Menus, Alertas, Badges, Indicadores.

#### 2.2 Arquitetura Frontend
Estrutura:
* **Framework:** React + Next.js (Adaptado para TanStack Start / Vite no nosso setup atual)
* **Estilização:** Tailwind CSS
* **Componentização:** Atomic Design adaptado.

Organização de pastas:
* `/app` or `/src`
* `/components`
* `/features`
* `/hooks`
* `/lib`
* `/services`
* `/types`
* `/utils`

#### 2.3 Configuração Backend
Preparar arquitetura:
* **Banco de dados:** PostgreSQL
* **Backend:** Supabase
* **Serviços:** Database, Authentication, Storage, API.

#### 2.4 Modelagem Inicial do Banco
Criar estrutura inicial (Tabelas):
* `churches` (mapeada como `configuracoes` no banco real)
* `users`
* `students` (mapeada como `alunos` no banco real)
* `teachers` (mapeada como parte de `classes` e `courses` no banco real)
* `classes`
* `courses`
* `lessons` (mapeada como `aulas` no banco real)
* `attendance` (mapeada como `presencas` no banco real)
* `enrollments` (mapeada como `curso_aluno` no banco real)

#### 2.5 Controle de Versão
Configurar:
* Git, Branch principal, Branch desenvolvimento, Controle de alterações, Documentação técnica.

---

## 3. FASE 1 — MVP OPERACIONAL

**Objetivo:** Disponibilizar uma primeira versão funcional para utilização real da Escola Bíblica.  
**Duração estimada:** 4 a 6 semanas

### MÓDULOS:

#### 3.1 Autenticação e Usuários
Implementar:
* Login, Cadastro, Recuperação de senha, Controle de sessão.
* **Perfis:** Administrador, Professor, Aluno.
* **Permissões:**
  * *Administrador:* Gerenciar toda estrutura.
  * *Professor:* Gerenciar suas turmas.
  * *Aluno:* Visualizar seus dados.

#### 3.2 Cadastro da Escola Bíblica
Implementar gestão de:
* Turmas, Professores, Cursos, Ciclos, Salas.
* *Exemplo:* Escola Bíblica 2026 -> Curso: Introdução à Teologia Bíblica -> Professor: Nome -> Turma: Adultos.

#### 3.3 Cadastro de Alunos
Funcionalidades:
* Cadastro individual, dados pessoais, histórico de participação, turma vinculada.
* **Campos:** Nome, Telefone, Email, Data nascimento, Classe, Status (Ativo, Inativo, Visitante).

#### 3.4 Controle de Frequência
Implementar:
* Registro semanal, lista de chamada, histórico, relatórios.
* **Fluxo:** Professor abre aula -> Seleciona turma -> Marca presença -> Sistema salva histórico.

#### 3.5 Dashboard Inicial
Criar visão administrativa com indicadores:
* Total de alunos, Total de turmas, Frequência média, Novos alunos, Professores ativos.

---

## 4. FASE 2 — GESTÃO ACADÊMICA COMPLETA

**Objetivo:** Transformar o sistema em uma plataforma completa de administração da Escola Bíblica.  
**Duração estimada:** 6 a 8 semanas

### MÓDULOS:
* **4.1 Gestão de Cursos:** Cadastro de cursos, ementas, professores, materiais, cronograma.
* **4.2 Planejamento de Aulas:** Criar aulas, registrar temas, anexar materiais, registrar observações (Estrutura: Curso -> Módulo -> Aula -> Material).
* **4.3 Biblioteca de Conteúdo:** PDFs, links, vídeos, documentos. Controle público/restrito por turma.
* **4.4 Avaliações e Atividades:** Questionários, atividades, comentários, feedback.

---

## 5. FASE 3 — ENGAJAMENTO E DISCIPULADO

**Objetivo:** Aumentar relacionamento, acompanhamento e crescimento espiritual dos alunos.  
**Duração estimada:** 8 semanas

### MÓDULOS:
* **5.1 Perfil Espiritual do Aluno:** Cursos concluídos, participação, frequência, atividades realizadas.
* **5.2 Trilhas de Formação:** Jornadas como *Trilha Novo Membro*, *Trilha Fundamentos da Fé*, *Trilha Liderança Cristã*.
* **5.3 Comunicação:** Avisos, notificações, mensagens, lembretes. Integrações futuras (WhatsApp, Email, Push Notification).
* **5.4 Gamificação Opcional:** Progresso, badges, certificados, conquistas.

---

## 6. FASE 4 — INTELIGÊNCIA E ESCALABILIDADE

**Objetivo:** Transformar dados da Escola Bíblica em inteligência estratégica.  
**Duração estimada:** Contínua.

### MÓDULOS:
* **6.1 Analytics:** Dashboards para Gestão pastoral, Gestão pedagógica, Engajamento. Indicadores de retenção, frequência histórica, crescimento, participação.
* **6.2 Inteligência Artificial:** Assistente para professores, sugestão de conteúdos, resumo automático de aulas, análise de participação.
* **6.3 Multi-Igrejas:** Preparação para SaaS (Multi-tenancy, organização por igreja, planos de assinatura, controle financeiro).

---

## 7. PRIORIDADE DE DESENVOLVIMENTO

* **Prioridade 1:** Base técnica, Autenticação, Cadastro, Turmas, Alunos, Frequência. (MVP / Fases 0 e 1)
* **Prioridade 2:** Cursos, Aulas, Materiais, Relatórios. (Fase 2)
* **Prioridade 3:** Engajamento, Comunicação, Trilhas. (Fase 3)
* **Prioridade 4:** IA, Analytics avançado, Escalabilidade SaaS. (Fase 4)

---

## 8. CRITÉRIOS DE SUCESSO POR FASE

* **FASE 0:** Sistema estruturado tecnicamente, arquitetura documentada, banco preparado.
* **FASE 1:** Escola Bíblica consegue utilizar o sistema no dia a dia.
* **FASE 2:** Professores conseguem administrar seus cursos completos.
* **FASE 3:** Alunos possuem acompanhamento contínuo.
* **FASE 4:** Igreja possui inteligência sobre formação e discipulado.

---

## 9. PRINCÍPIOS TÉCNICOS DO PROJETO

* Código limpo, componentização, baixo acoplamento, alta escalabilidade.
* Segurança desde o início.
* Experiência mobile-first.
* Interface simples para usuários não técnicos.
* Evolução incremental.

---

## 10. VISÃO FINAL DO PRODUTO

O Gestão Escola Bíblica deve evoluir de uma ferramenta administrativa para uma plataforma completa de formação cristã, conectando: Gestão, Ensino, Relacionamento, Discipulado, Dados e Inteligência. A plataforma deve permitir que igrejas organizem sua Escola Bíblica com eficiência administrativa e promovam crescimento espiritual contínuo dos seus membros.
