-- Migration: Roles and Granular RLS
-- Version: 1.4

-- 1. Create Enum for App Roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('ADMIN', 'PROFESSOR', 'ALUNO');
  END IF;
END
$$;

-- 2. Create User Roles Table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_role UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- 3. Create helper function for role check
CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, role public.app_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = has_role.user_id AND user_roles.role = has_role.role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Migrate existing roles from profiles.role to user_roles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    SELECT 
      id,
      CASE 
        WHEN role = 'ADMIN' THEN 'ADMIN'::public.app_role
        WHEN role = 'TEACHER' THEN 'PROFESSOR'::public.app_role
        ELSE 'ALUNO'::public.app_role
      END
    FROM public.profiles
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END
$$;

-- 5. Drop role column from profiles and old helper check_user_role
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;
DROP FUNCTION IF EXISTS public.check_user_role(text);

-- 6. Adjust handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.app_role;
  v_meta_role text;
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE
  SET nome = EXCLUDED.nome, email = EXCLUDED.email;

  -- Determine role
  v_meta_role := NEW.raw_user_meta_data->>'role';
  IF v_meta_role = 'ADMIN' THEN
    v_role := 'ADMIN';
  ELSIF v_meta_role = 'TEACHER' OR v_meta_role = 'PROFESSOR' THEN
    v_role := 'PROFESSOR';
  ELSE
    v_role := 'ALUNO';
  END IF;

  -- Insert role into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 7. Add user_id reference to alunos
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 8. Enable / Re-enable RLS Policies

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Permitir leitura de perfis por qualquer usuário autenticado" ON public.profiles;
DROP POLICY IF EXISTS "Permitir atualização do próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Admins possuem controle total sobre perfis" ON public.profiles;

CREATE POLICY "Profiles read authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Profiles self update" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles admin manage" ON public.profiles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'ADMIN'));

-- USER_ROLES POLICIES
DROP POLICY IF EXISTS "Allow users to read their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow admins to manage all user roles" ON public.user_roles;

CREATE POLICY "User roles self read" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "User roles admin manage" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'ADMIN'));

-- CONFIGURACOES POLICIES
DROP POLICY IF EXISTS "Permitir leitura das configurações por qualquer autenticado" ON public.configuracoes;
DROP POLICY IF EXISTS "Admins podem atualizar configurações" ON public.configuracoes;

CREATE POLICY "Configuracoes select authenticated" ON public.configuracoes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Configuracoes admin manage" ON public.configuracoes
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'ADMIN'));

-- CLASSES POLICIES
DROP POLICY IF EXISTS "Permitir leitura de classes por qualquer autenticado" ON public.classes;
DROP POLICY IF EXISTS "Admins podem gerenciar classes" ON public.classes;

CREATE POLICY "Classes select authenticated" ON public.classes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Classes admin manage" ON public.classes
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'ADMIN'));

-- ALUNOS POLICIES
DROP POLICY IF EXISTS "Admins e Professores podem ver todos os alunos" ON public.alunos;
DROP POLICY IF EXISTS "Alunos podem ver seu próprio registro de aluno" ON public.alunos;
DROP POLICY IF EXISTS "Admins e Professores podem criar/atualizar alunos" ON public.alunos;
DROP POLICY IF EXISTS "Admins e Professores podem atualizar alunos" ON public.alunos;
DROP POLICY IF EXISTS "Admins podem deletar alunos" ON public.alunos;
DROP POLICY IF EXISTS "Admins podem inserir alunos" ON public.alunos;
DROP POLICY IF EXISTS "Admins podem atualizar alunos" ON public.alunos;

CREATE POLICY "Alunos admin manage" ON public.alunos
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Alunos student view" ON public.alunos
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR email IS NOT DISTINCT FROM auth.jwt()->>'email');

CREATE POLICY "Alunos student update" ON public.alunos
  FOR UPDATE TO authenticated USING (user_id = auth.uid() OR email IS NOT DISTINCT FROM auth.jwt()->>'email')
  WITH CHECK (user_id = auth.uid() OR email IS NOT DISTINCT FROM auth.jwt()->>'email');

CREATE POLICY "Alunos teacher view" ON public.alunos
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.professores prof
      JOIN public.classes cl ON (cl.professor_id = prof.id OR cl.professor_auxiliar_id = prof.id)
      JOIN public.matriculas m ON m.classe_id = cl.id
      WHERE prof.email IS NOT DISTINCT FROM auth.jwt()->>'email'
        AND m.aluno_id = alunos.id
        AND m.situacao = 'ATIVO'
    )
  );

-- COURSES POLICIES
DROP POLICY IF EXISTS "Permitir leitura de cursos para qualquer autenticado" ON public.courses;
DROP POLICY IF EXISTS "Admins e Professores podem gerenciar cursos" ON public.courses;
DROP POLICY IF EXISTS "Admins podem gerenciar cursos" ON public.courses;

CREATE POLICY "Courses select authenticated" ON public.courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Courses admin manage" ON public.courses
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'ADMIN'));

-- CURSO_ALUNO POLICIES
DROP POLICY IF EXISTS "Permitir leitura de matrículas para qualquer autenticado" ON public.curso_aluno;
DROP POLICY IF EXISTS "Admins e Professores podem gerenciar matrículas de cursos" ON public.curso_aluno;

CREATE POLICY "Curso aluno admin manage" ON public.curso_aluno
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Curso aluno student view" ON public.curso_aluno
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.alunos al
      WHERE al.id = aluno_id AND (al.user_id = auth.uid() OR al.email IS NOT DISTINCT FROM auth.jwt()->>'email')
    )
  );

CREATE POLICY "Curso aluno student insert" ON public.curso_aluno
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.alunos al
      WHERE al.id = aluno_id AND (al.user_id = auth.uid() OR al.email IS NOT DISTINCT FROM auth.jwt()->>'email')
    )
  );

-- AULAS POLICIES
DROP POLICY IF EXISTS "Admins e Professores podem gerenciar aulas" ON public.aulas;
DROP POLICY IF EXISTS "Alunos podem ver aulas cadastradas" ON public.aulas;
DROP POLICY IF EXISTS "Admins podem gerenciar aulas" ON public.aulas;

CREATE POLICY "Aulas admin manage" ON public.aulas
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Aulas teacher manage" ON public.aulas
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.professores prof
      JOIN public.classes cl ON (cl.professor_id = prof.id OR cl.professor_auxiliar_id = prof.id)
      WHERE prof.email IS NOT DISTINCT FROM auth.jwt()->>'email'
        AND cl.id = aulas.classe_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.professores prof
      JOIN public.classes cl ON (cl.professor_id = prof.id OR cl.professor_auxiliar_id = prof.id)
      WHERE prof.email IS NOT DISTINCT FROM auth.jwt()->>'email'
        AND cl.id = aulas.classe_id
    )
  );

CREATE POLICY "Aulas student view" ON public.aulas
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.alunos al
      JOIN public.matriculas m ON m.aluno_id = al.id
      WHERE m.classe_id = aulas.classe_id
        AND (al.user_id = auth.uid() OR al.email IS NOT DISTINCT FROM auth.jwt()->>'email')
        AND m.situacao = 'ATIVO'
    )
  );

-- PRESENCAS POLICIES
DROP POLICY IF EXISTS "Admins e Professores podem gerenciar presenças" ON public.presencas;
DROP POLICY IF EXISTS "Alunos podem ver suas próprias presenças" ON public.presencas;
DROP POLICY IF EXISTS "Admins podem gerenciar presenças" ON public.presencas;

CREATE POLICY "Presencas admin manage" ON public.presencas
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Presencas teacher manage" ON public.presencas
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.professores prof
      JOIN public.classes cl ON (cl.professor_id = prof.id OR cl.professor_auxiliar_id = prof.id)
      JOIN public.aulas au ON au.classe_id = cl.id
      WHERE prof.email IS NOT DISTINCT FROM auth.jwt()->>'email'
        AND au.id = presencas.aula_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.professores prof
      JOIN public.classes cl ON (cl.professor_id = prof.id OR cl.professor_auxiliar_id = prof.id)
      JOIN public.aulas au ON au.classe_id = cl.id
      WHERE prof.email IS NOT DISTINCT FROM auth.jwt()->>'email'
        AND au.id = presencas.aula_id
    )
  );

CREATE POLICY "Presencas student view" ON public.presencas
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.alunos al
      WHERE al.id = aluno_id AND (al.user_id = auth.uid() OR al.email IS NOT DISTINCT FROM auth.jwt()->>'email')
    )
  );

-- HISTORICO_CLASSES POLICIES
DROP POLICY IF EXISTS "Admins e Professores podem ver históricos" ON public.historico_classes;
DROP POLICY IF EXISTS "Alunos podem ver seu próprio histórico de classes" ON public.historico_classes;
DROP POLICY IF EXISTS "Admins podem inserir histórico" ON public.historico_classes;

CREATE POLICY "Historico admin manage" ON public.historico_classes
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Historico student view" ON public.historico_classes
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.alunos al
      WHERE al.id = aluno_id AND (al.user_id = auth.uid() OR al.email IS NOT DISTINCT FROM auth.jwt()->>'email')
    )
  );

-- MATRICULAS POLICIES
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar matrículas" ON public.matriculas;

CREATE POLICY "Matriculas admin manage" ON public.matriculas
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Matriculas student view" ON public.matriculas
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.alunos al
      WHERE al.id = aluno_id AND (al.user_id = auth.uid() OR al.email IS NOT DISTINCT FROM auth.jwt()->>'email')
    )
  );
