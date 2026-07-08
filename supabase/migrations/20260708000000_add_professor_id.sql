-- Migration: Add Professor ID and Update RLS
-- Version: 1.2

-- =========================================================================
-- 1. ALTER TABLES (ADD COLUMNS)
-- =========================================================================

ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS professor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS professor_auxiliar_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS professor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.aulas 
ADD COLUMN IF NOT EXISTS professor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- =========================================================================
-- 2. UPDATE RLS POLICIES
-- =========================================================================

-- CLASSES
DROP POLICY IF EXISTS "Admins podem gerenciar classes" ON public.classes;
CREATE POLICY "Admins podem gerenciar classes"
    ON public.classes FOR ALL TO authenticated USING (public.check_user_role('ADMIN'));

CREATE POLICY "Professores podem editar suas classes"
    ON public.classes FOR UPDATE TO authenticated 
    USING (public.check_user_role('TEACHER') AND professor_id = auth.uid())
    WITH CHECK (public.check_user_role('TEACHER') AND professor_id = auth.uid());

-- ALUNOS
DROP POLICY IF EXISTS "Admins e Professores podem criar/atualizar alunos" ON public.alunos;
DROP POLICY IF EXISTS "Admins e Professores podem atualizar alunos" ON public.alunos;

CREATE POLICY "Admins podem inserir alunos"
    ON public.alunos FOR INSERT TO authenticated 
    WITH CHECK (public.check_user_role('ADMIN'));

CREATE POLICY "Professores podem inserir alunos em suas turmas"
    ON public.alunos FOR INSERT TO authenticated 
    WITH CHECK (
        public.check_user_role('TEACHER') AND 
        EXISTS (SELECT 1 FROM public.classes c WHERE c.id = classe_id AND c.professor_id = auth.uid())
    );

CREATE POLICY "Admins podem atualizar alunos"
    ON public.alunos FOR UPDATE TO authenticated 
    USING (public.check_user_role('ADMIN'))
    WITH CHECK (public.check_user_role('ADMIN'));

CREATE POLICY "Professores podem atualizar alunos de suas turmas"
    ON public.alunos FOR UPDATE TO authenticated 
    USING (
        public.check_user_role('TEACHER') AND 
        EXISTS (SELECT 1 FROM public.classes c WHERE c.id = classe_id AND c.professor_id = auth.uid())
    )
    WITH CHECK (
        public.check_user_role('TEACHER') AND 
        EXISTS (SELECT 1 FROM public.classes c WHERE c.id = classe_id AND c.professor_id = auth.uid())
    );

-- COURSES
DROP POLICY IF EXISTS "Admins e Professores podem gerenciar cursos" ON public.courses;
CREATE POLICY "Admins podem gerenciar cursos"
    ON public.courses FOR ALL TO authenticated USING (public.check_user_role('ADMIN'));

CREATE POLICY "Professores podem atualizar seus cursos"
    ON public.courses FOR UPDATE TO authenticated 
    USING (public.check_user_role('TEACHER') AND professor_id = auth.uid())
    WITH CHECK (public.check_user_role('TEACHER') AND professor_id = auth.uid());

-- AULAS
DROP POLICY IF EXISTS "Admins e Professores podem gerenciar aulas" ON public.aulas;
CREATE POLICY "Admins podem gerenciar aulas"
    ON public.aulas FOR ALL TO authenticated USING (public.check_user_role('ADMIN'));

CREATE POLICY "Professores podem gerenciar aulas de suas turmas"
    ON public.aulas FOR ALL TO authenticated 
    USING (
        public.check_user_role('TEACHER') AND 
        EXISTS (SELECT 1 FROM public.classes c WHERE c.id = classe_id AND c.professor_id = auth.uid())
    );

-- PRESENCAS
DROP POLICY IF EXISTS "Admins e Professores podem gerenciar presenças" ON public.presencas;
CREATE POLICY "Admins podem gerenciar presenças"
    ON public.presencas FOR ALL TO authenticated USING (public.check_user_role('ADMIN'));

CREATE POLICY "Professores podem gerenciar presencas de suas aulas"
    ON public.presencas FOR ALL TO authenticated 
    USING (
        public.check_user_role('TEACHER') AND 
        EXISTS (
            SELECT 1 FROM public.aulas a 
            JOIN public.classes c ON a.classe_id = c.id
            WHERE a.id = aula_id AND c.professor_id = auth.uid()
        )
    );
