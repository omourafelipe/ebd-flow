CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem gerenciar seu próprio perfil"
ON public.profiles
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE TABLE public.configuracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_igreja text NOT NULL,
  ano_letivo integer NOT NULL DEFAULT 2026,
  logo_url text,
  tema text NOT NULL DEFAULT 'default',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracoes TO authenticated;
GRANT ALL ON public.configuracoes TO service_role;

ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem gerenciar configurações"
ON public.configuracoes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  departamento text,
  faixa_etaria text,
  professor text NOT NULL,
  professor_id uuid,
  professor_auxiliar text,
  professor_auxiliar_id uuid,
  sala text,
  cor text,
  status text NOT NULL DEFAULT 'ATIVA',
  observacoes text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem gerenciar classes"
ON public.classes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE TABLE public.alunos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classe_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
  nome text NOT NULL,
  sexo text,
  telefone text,
  email text,
  data_nascimento text,
  data_ingresso text,
  status text NOT NULL DEFAULT 'ATIVO',
  observacoes text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.alunos TO authenticated;
GRANT ALL ON public.alunos TO service_role;

ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem gerenciar alunos"
ON public.alunos
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  professor text,
  professor_id uuid,
  carga_horaria integer,
  data_inicio text,
  data_fim text,
  status text NOT NULL DEFAULT 'PLANEJADO',
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem gerenciar cursos"
ON public.courses
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE TABLE public.curso_aluno (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  data_matricula text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (curso_id, aluno_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.curso_aluno TO authenticated;
GRANT ALL ON public.curso_aluno TO service_role;

ALTER TABLE public.curso_aluno ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem gerenciar matrículas"
ON public.curso_aluno
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE TABLE public.aulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classe_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
  data_aula text NOT NULL,
  tema text NOT NULL,
  numero_licao integer,
  professor text,
  professor_id uuid,
  professor_substituto text,
  observacoes text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.aulas TO authenticated;
GRANT ALL ON public.aulas TO service_role;

ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem gerenciar aulas"
ON public.aulas
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE TABLE public.presencas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id uuid NOT NULL REFERENCES public.aulas(id) ON DELETE CASCADE,
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  presente boolean NOT NULL DEFAULT false,
  trouxe_biblia boolean NOT NULL DEFAULT false,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (aula_id, aluno_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.presencas TO authenticated;
GRANT ALL ON public.presencas TO service_role;

ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem gerenciar presenças"
ON public.presencas
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE TABLE public.historico_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  classe_origem_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  classe_destino_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  tipo text NOT NULL,
  motivo text,
  data_evento text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.historico_classes TO authenticated;
GRANT ALL ON public.historico_classes TO service_role;

ALTER TABLE public.historico_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem gerenciar histórico"
ON public.historico_classes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_configuracoes_updated_at BEFORE UPDATE ON public.configuracoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alunos_updated_at BEFORE UPDATE ON public.alunos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_curso_aluno_updated_at BEFORE UPDATE ON public.curso_aluno
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_aulas_updated_at BEFORE UPDATE ON public.aulas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_presencas_updated_at BEFORE UPDATE ON public.presencas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_historico_classes_updated_at BEFORE UPDATE ON public.historico_classes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
