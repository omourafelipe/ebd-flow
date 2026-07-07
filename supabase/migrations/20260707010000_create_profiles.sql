-- Migration: Create Profiles and Configure RLS
-- Database: PostgreSQL (Supabase)
-- Version: 1.1

-- =========================================================================
-- 1. PROFILES TABLE CREATION
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'STUDENT' CHECK (role IN ('ADMIN', 'TEACHER', 'STUDENT')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for roles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Attach update_updated_at trigger to profiles
CREATE TRIGGER update_profiles_updated_at 
BEFORE UPDATE ON public.profiles 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- 2. AUTOMATIC PROFILE CREATION TRIGGER
-- =========================================================================

-- Trigger function to create profile on user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, role)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'nome', 
      new.raw_user_meta_data->>'name', 
      new.raw_user_meta_data->>'full_name', 
      'Novo Usuário'
    ),
    COALESCE(new.raw_user_meta_data->>'role', 'STUDENT')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- 3. SECURITY HELPER FUNCTIONS
-- =========================================================================

-- Helper to check user role securely
CREATE OR REPLACE FUNCTION public.check_user_role(role_to_check text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = role_to_check
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper to get user email from auth
CREATE OR REPLACE FUNCTION public.get_auth_email()
RETURNS text AS $$
BEGIN
  RETURN auth.jwt()->>'email';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curso_aluno ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_classes ENABLE ROW LEVEL SECURITY;

-- 4.1 PROFILES POLICIES
CREATE POLICY "Permitir leitura de perfis por qualquer usuário autenticado"
    ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir atualização do próprio perfil"
    ON public.profiles FOR UPDATE TO authenticated 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins possuem controle total sobre perfis"
    ON public.profiles FOR ALL TO authenticated USING (public.check_user_role('ADMIN'));

-- 4.2 CONFIGURACOES POLICIES
CREATE POLICY "Permitir leitura das configurações por qualquer autenticado"
    ON public.configuracoes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins podem atualizar configurações"
    ON public.configuracoes FOR ALL TO authenticated USING (public.check_user_role('ADMIN'));

-- 4.3 CLASSES POLICIES
CREATE POLICY "Permitir leitura de classes por qualquer autenticado"
    ON public.classes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins podem gerenciar classes"
    ON public.classes FOR ALL TO authenticated USING (public.check_user_role('ADMIN'));

-- 4.4 ALUNOS POLICIES
CREATE POLICY "Admins e Professores podem ver todos os alunos"
    ON public.alunos FOR SELECT TO authenticated 
    USING (public.check_user_role('ADMIN') OR public.check_user_role('TEACHER'));

CREATE POLICY "Alunos podem ver seu próprio registro de aluno"
    ON public.alunos FOR SELECT TO authenticated 
    USING (email IS NOT DISTINCT FROM public.get_auth_email());

CREATE POLICY "Admins e Professores podem criar/atualizar alunos"
    ON public.alunos FOR INSERT WITH CHECK (public.check_user_role('ADMIN') OR public.check_user_role('TEACHER'));

CREATE POLICY "Admins e Professores podem atualizar alunos"
    ON public.alunos FOR UPDATE TO authenticated 
    USING (public.check_user_role('ADMIN') OR public.check_user_role('TEACHER'))
    WITH CHECK (public.check_user_role('ADMIN') OR public.check_user_role('TEACHER'));

CREATE POLICY "Admins podem deletar alunos"
    ON public.alunos FOR DELETE TO authenticated USING (public.check_user_role('ADMIN'));

-- 4.5 COURSES & CURSO_ALUNO POLICIES
CREATE POLICY "Permitir leitura de cursos para qualquer autenticado"
    ON public.courses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins e Professores podem gerenciar cursos"
    ON public.courses FOR ALL TO authenticated 
    USING (public.check_user_role('ADMIN') OR public.check_user_role('TEACHER'));

CREATE POLICY "Permitir leitura de matrículas para qualquer autenticado"
    ON public.curso_aluno FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins e Professores podem gerenciar matrículas de cursos"
    ON public.curso_aluno FOR ALL TO authenticated 
    USING (public.check_user_role('ADMIN') OR public.check_user_role('TEACHER'));

-- 4.6 AULAS & PRESENCAS POLICIES
CREATE POLICY "Admins e Professores podem gerenciar aulas"
    ON public.aulas FOR ALL TO authenticated 
    USING (public.check_user_role('ADMIN') OR public.check_user_role('TEACHER'));

CREATE POLICY "Alunos podem ver aulas cadastradas"
    ON public.aulas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins e Professores podem gerenciar presenças"
    ON public.presencas FOR ALL TO authenticated 
    USING (public.check_user_role('ADMIN') OR public.check_user_role('TEACHER'));

CREATE POLICY "Alunos podem ver suas próprias presenças"
    ON public.presencas FOR SELECT TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.alunos a 
            WHERE a.id = aluno_id AND a.email IS NOT DISTINCT FROM public.get_auth_email()
        )
    );

-- 4.7 HISTORICO_CLASSES POLICIES
CREATE POLICY "Admins e Professores podem ver históricos"
    ON public.historico_classes FOR SELECT TO authenticated 
    USING (public.check_user_role('ADMIN') OR public.check_user_role('TEACHER'));

CREATE POLICY "Alunos podem ver seu próprio histórico de classes"
    ON public.historico_classes FOR SELECT TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.alunos a 
            WHERE a.id = aluno_id AND a.email IS NOT DISTINCT FROM public.get_auth_email()
        )
    );

CREATE POLICY "Admins podem inserir histórico"
    ON public.historico_classes FOR ALL TO authenticated USING (public.check_user_role('ADMIN'));
