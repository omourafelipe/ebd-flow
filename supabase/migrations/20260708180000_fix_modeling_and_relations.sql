-- Migration: Fix Modeling and Relations
-- Version: 1.3

-- =========================================================================
-- 1. ADD COURSE LINK AND CAPACITY TO CLASSES
-- =========================================================================
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS curso_id UUID REFERENCES public.courses(id) ON DELETE SET NULL;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS capacidade INTEGER DEFAULT 30;

-- =========================================================================
-- 2. CORRECT PROFESSOR FOREIGN KEYS
-- =========================================================================
-- Drop old foreign key constraints if they exist (pointing to profiles)
ALTER TABLE public.classes DROP CONSTRAINT IF EXISTS classes_professor_id_fkey;
ALTER TABLE public.classes DROP CONSTRAINT IF EXISTS classes_professor_auxiliar_id_fkey;
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_professor_id_fkey;
ALTER TABLE public.aulas DROP CONSTRAINT IF EXISTS aulas_professor_id_fkey;

-- Add new constraints pointing to public.professores(id)
ALTER TABLE public.classes ADD CONSTRAINT classes_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES public.professores(id) ON DELETE SET NULL;
ALTER TABLE public.classes ADD CONSTRAINT classes_professor_auxiliar_id_fkey FOREIGN KEY (professor_auxiliar_id) REFERENCES public.professores(id) ON DELETE SET NULL;
ALTER TABLE public.courses ADD CONSTRAINT courses_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES public.professores(id) ON DELETE SET NULL;
ALTER TABLE public.aulas ADD CONSTRAINT aulas_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES public.professores(id) ON DELETE SET NULL;

-- =========================================================================
-- 3. CREATE MATRICULAS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.matriculas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    classe_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    data_matricula text NOT NULL,
    situacao text NOT NULL DEFAULT 'ATIVO' CHECK (situacao IN ('ATIVO', 'INATIVO', 'TRANSFERIDO', 'CONCLUIDO', 'FALECIDO')),
    data_saida text,
    motivo_saida text,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS and Policies for matriculas
ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar matrículas" ON public.matriculas;
CREATE POLICY "Usuários autenticados podem gerenciar matrículas"
ON public.matriculas
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matriculas TO authenticated;
GRANT ALL ON public.matriculas TO service_role;

-- Update trigger
DROP TRIGGER IF EXISTS update_matriculas_updated_at ON public.matriculas;
CREATE TRIGGER update_matriculas_updated_at BEFORE UPDATE ON public.matriculas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- 4. MIGRATE EXISTING STUDENTS AND MAKE ALUNOS.CLASSE_ID NULLABLE
-- =========================================================================
INSERT INTO public.matriculas (aluno_id, classe_id, data_matricula, situacao)
SELECT id, classe_id, COALESCE(data_ingresso, to_char(CURRENT_DATE, 'YYYY-MM-DD')), 'ATIVO'
FROM public.alunos
ON CONFLICT DO NOTHING;

ALTER TABLE public.alunos ALTER COLUMN classe_id DROP NOT NULL;

-- =========================================================================
-- 5. AUTOMATIC ATTENDANCE CALL GENERATION TRIGGER
-- =========================================================================
CREATE OR REPLACE FUNCTION public.gerar_presencas_automatica()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.presencas (aula_id, aluno_id, presente, trouxe_biblia)
  SELECT NEW.id, m.aluno_id, false, false
  FROM public.matriculas m
  WHERE m.classe_id = NEW.classe_id AND m.situacao = 'ATIVO';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gerar_presencas_aula ON public.aulas;
CREATE TRIGGER trg_gerar_presencas_aula
AFTER INSERT ON public.aulas
FOR EACH ROW
EXECUTE FUNCTION public.gerar_presencas_automatica();

-- =========================================================================
-- 6. UPDATE VIEWS
-- =========================================================================
CREATE OR REPLACE VIEW public.vw_dashboard AS
SELECT 
    (SELECT COUNT(*) FROM public.alunos WHERE status = 'ATIVO') AS total_alunos,
    (
        -- Presentes na última data registrada de aula
        SELECT COUNT(*) 
        FROM public.presencas p
        JOIN public.aulas a ON p.aula_id = a.id
        WHERE p.presente = TRUE 
          AND a.data_aula = (SELECT MAX(data_aula) FROM public.aulas)
    ) AS presentes_ultima_aula,
    (SELECT COUNT(*) FROM public.alunos WHERE status = 'VISITANTE') AS total_visitantes,
    (SELECT COUNT(*) FROM public.courses WHERE status = 'EM_ANDAMENTO') AS cursos_ativos;

CREATE OR REPLACE VIEW public.vw_frequencia_por_classe AS
SELECT 
    c.id AS classe_id,
    c.nome AS classe_nome,
    COUNT(DISTINCT a.id) AS total_aulas,
    CASE 
        WHEN COUNT(p.id) = 0 THEN 0
        ELSE ROUND((SUM(CASE WHEN p.presente = TRUE THEN 1 ELSE 0 END)::numeric / COUNT(p.id)::numeric) * 100)
    END AS frequencia_media
FROM public.classes c
LEFT JOIN public.aulas a ON c.id = a.classe_id
LEFT JOIN public.presencas p ON a.id = p.aula_id
GROUP BY c.id, c.nome;

CREATE OR REPLACE VIEW public.vw_frequencia_alunos AS
SELECT 
    al.id AS aluno_id,
    al.nome AS aluno_nome,
    c.nome AS classe_nome,
    COUNT(p.id) AS total_chamadas,
    SUM(CASE WHEN p.presente = TRUE THEN 1 ELSE 0 END) AS presencas_total,
    SUM(CASE WHEN p.presente = TRUE AND p.trouxe_biblia = TRUE THEN 1 ELSE 0 END) AS biblias_total,
    CASE 
        WHEN COUNT(p.id) = 0 THEN 0
        ELSE ROUND((SUM(CASE WHEN p.presente = TRUE THEN 1 ELSE 0 END)::numeric / COUNT(p.id)::numeric) * 100)
    END AS frequencia_rate,
    CASE 
        WHEN SUM(CASE WHEN p.presente = TRUE THEN 1 ELSE 0 END) = 0 THEN 0
        ELSE ROUND((SUM(CASE WHEN p.presente = TRUE AND p.trouxe_biblia = TRUE THEN 1 ELSE 0 END)::numeric / SUM(CASE WHEN p.presente = TRUE THEN 1 ELSE 0 END)::numeric) * 100)
    END AS biblia_rate
FROM public.alunos al
LEFT JOIN public.matriculas m ON al.id = m.aluno_id AND m.situacao = 'ATIVO'
LEFT JOIN public.classes c ON m.classe_id = c.id
LEFT JOIN public.presencas p ON al.id = p.aluno_id
GROUP BY al.id, al.nome, c.nome;
