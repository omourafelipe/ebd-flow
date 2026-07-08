Lovable Cloud foi ativado e conectado ao projeto. Agora todos os dados cadastrados podem ser persistidos em um banco PostgreSQL gerenciado, com autenticação, storage e funções serverless integradas.

Hoje o app usa `src/lib/store.ts` com dados em memória/localStorage e um `src/lib/supabase.ts` apontando para variáveis manuais. Para tornar o salvamento real, vou migrar a persistência para o Lovable Cloud seguindo a arquitetura do projeto.

## Plano de implementação

### 1. Diagnóstico do estado atual
- Mapear todas as entidades do `useEbdStore` (classes, alunos, visitantes, cursos especiais, aulas, presenças, configurações, histórico).
- Revisar dependências atuais: `src/lib/supabase.ts`, autenticação em `src/routes/_auth.login.tsx`, `src/routes/_auth.cadastro.tsx` e gate em `src/routes/_app.tsx`.
- Verificar se `src/integrations/supabase/client.ts` foi gerado pelo Lovable Cloud e quais variáveis de ambiente estão disponíveis.

### 2. Modelagem do banco de dados (migrations)
Criar migrations para as tabelas do MVP, obedecendo às regras do projeto:
- `classes` (id, nome, professor, professor_id, status, faixa_etaria, created_at, updated_at, deleted_at)
- `alunos` (id, nome, classe_id, status, data_nascimento, contato, created_at, updated_at, deleted_at)
- `visitantes` (id, nome, classe_id, data_visita, status, created_at, updated_at, deleted_at)
- `cursos_especiais` ou extensão de `classes` conforme regra de negócio
- `aulas` (id, classe_id, data_aula, tema, numero_licao, professor, professor_substituto, observacoes, created_at, updated_at)
- `presencas` (id, aula_id, aluno_id, presente, trouxe_biblia, created_at, updated_at)
- `configuracoes` (id, nome_igreja, trimestre_atual, etc.)
- `profiles` (vinculado ao auth.users do Lovable Cloud)

Cada migration seguirá o padrão obrigatório:
1. `CREATE TABLE public.<nome>`
2. `GRANT SELECT/INSERT/UPDATE/DELETE` para `authenticated` e `ALL` para `service_role`
3. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
4. `CREATE POLICY` escopada por `auth.uid()`

### 3. Services e regras de negócio
Criar services em `src/services/` (uma por entidade) contendo toda a lógica de negócio:
- `classes.service.ts`, `alunos.service.ts`, `aulas.service.ts`, `presencas.service.ts`, `configuracoes.service.ts`, `dashboard.service.ts`
- Usar `@/integrations/supabase/client` nos componentes e `createServerFn` com `requireSupabaseAuth` para operações que precisam de privilégio ou lógica server-side.
- Garantir regras do Documento 1: um aluno por classe, presença implícita, "trouxe Bíblia" só para presentes, visitante → aluno, histórico preservado.

### 4. Migração do store para TanStack Query + Supabase
- Substituir `useEbdStore` como fonte primária de dados: passar a usar `useQuery`/`useMutation` com `queryClient`.
- Manter o store apenas como cache local/estado UI quando fizer sentido (ex: wizard de registrar aula).
- Invalidar queries após create/update/delete/promoção.
- Implementar estados de loading, erro e empty em todas as listagens.

### 5. Ajuste de autenticação
- Migrar `src/lib/supabase.ts` para usar o client gerado em `src/integrations/supabase/client` (não editar arquivo auto-gerado).
- Atualizar `src/routes/_auth.login.tsx` e `src/routes/_auth.cadastro.tsx` para usarem `lovable.auth` (Google) e email/senha via Supabase/Lovable Cloud.
- Garantir que `src/start.ts` tenha middleware `attachSupabaseAuth` para `createServerFn` autenticados.
- Criar seed de perfil administrador inicial.

### 6. Migração de dados existentes
- Se houver dados no localStorage do modo demo, oferecer um script de exportação/importação para o banco.
- Caso contrário, iniciar com banco vazio.

### 7. Verificação
- Testar cadastro de classe, aluno, aula e presença no preview.
- Verificar console/network para erros de permissão (RLS/GRANT).
- Rodar build para garantir que não há imports de `src/server/` ou `.server.ts` em componentes.

## Critérios de sucesso
- Dados cadastrados no app persistem entre recarregamentos e sessões.
- Autenticação funciona com email/senha e Google.
- Regras de negócio continuam funcionando (ex: validações de presença/Bíblia).
- Nenhuma cor ou componente hardcoded fora do design system.

## Entregáveis
- Migrations aprovadas e executadas no Lovable Cloud.
- Services tipados em `src/services/`.
- Store refatorado para TanStack Query.
- Rotas de auth atualizadas.
- App testado no preview.