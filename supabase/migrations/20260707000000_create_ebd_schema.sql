-- Migration: Create EBD Flow Schema
-- Database: PostgreSQL (Supabase)
-- Version: 1.0

-- =========================================================================
-- 1. ENUMS CREATION
-- =========================================================================

CREATE TYPE status_aluno AS ENUM ('ATIVO', 'VISITANTE', 'INATIVO');
CREATE TYPE status_classe AS ENUM ('ATIVA', 'INATIVA');
CREATE TYPE status_curso AS ENUM ('PLANEJADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO');
CREATE TYPE sexo AS ENUM ('MASCULINO', 'FEMININO');
CREATE TYPE tipo_historico AS ENUM ('PROMOCAO', 'TRANSFERENCIA', 'INGRESSO', 'INATIVACAO', 'REATIVACAO');

-- =========================================================================
-- 2. TABLES CREATION
-- =========================================================================

-- CLASSES
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL UNIQUE,
    departamento VARCHAR(255),
    faixa_etaria VARCHAR(100),
    professor VARCHAR(255) NOT NULL,
    professor_auxiliar VARCHAR(255),
    sala VARCHAR(100),
    cor VARCHAR(50),
    status status_classe NOT NULL DEFAULT 'ATIVA',
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ALUNOS
CREATE TABLE alunos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classe_id UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    nome VARCHAR(255) NOT NULL,
    sexo sexo,
    telefone VARCHAR(50),
    email VARCHAR(255),
    data_nascimento DATE,
    data_ingresso DATE DEFAULT CURRENT_DATE,
    status status_aluno NOT NULL DEFAULT 'ATIVO',
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CURSOS
CREATE TABLE courses ( -- curso em inglês para plural e padronização (ou cursos se preferir manter literal)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    professor VARCHAR(255),
    carga_horaria INTEGER,
    data_inicio DATE,
    data_fim DATE,
    status status_curso NOT NULL DEFAULT 'PLANEJADO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CURSO_ALUNO (N:N)
CREATE TABLE curso_aluno (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curso_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    data_matricula DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_curso_aluno UNIQUE (curso_id, aluno_id)
);

-- AULAS
CREATE TABLE aulas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classe_id UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    data_aula DATE NOT NULL DEFAULT CURRENT_DATE,
    tema VARCHAR(255) NOT NULL,
    numero_licao INTEGER,
    professor VARCHAR(255),
    professor_substituto VARCHAR(255),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_classe_data UNIQUE (classe_id, data_aula)
);

-- PRESENCAS
CREATE TABLE presencas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aula_id UUID NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
    aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    presente BOOLEAN NOT NULL DEFAULT FALSE,
    trouxe_biblia BOOLEAN NOT NULL DEFAULT FALSE,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_aula_aluno UNIQUE (aula_id, aluno_id),
    CONSTRAINT check_biblia_presence CHECK (
        (trouxe_biblia = FALSE) OR (presente = TRUE)
    )
);

-- HISTORICO_CLASSES
CREATE TABLE historico_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    classe_origem_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    classe_destino_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    tipo tipo_historico NOT NULL,
    motivo TEXT,
    data_evento TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CONFIGURACOES (Garante apenas uma linha)
CREATE TABLE configuracoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_igreja VARCHAR(255) NOT NULL DEFAULT 'Igreja Evangélica da EBD',
    ano_letivo INTEGER DEFAULT extract(year from CURRENT_DATE),
    logo_url VARCHAR(255),
    tema VARCHAR(100) DEFAULT 'default',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT single_row CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

-- Inserir a configuração padrão única
INSERT INTO configuracoes (id, nome_igreja) 
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'Igreja Evangélica da EBD')
ON CONFLICT DO NOTHING;

-- =========================================================================
-- 3. INDEXES
-- =========================================================================

-- Classes Indexes
CREATE INDEX idx_classes_nome ON classes (nome);
CREATE INDEX idx_classes_status ON classes (status);
CREATE INDEX idx_classes_dept ON classes (departamento);

-- Alunos Indexes
CREATE INDEX idx_alunos_nome ON alunos (nome);
CREATE INDEX idx_alunos_classe ON alunos (classe_id);
CREATE INDEX idx_alunos_status ON alunos (status);
CREATE INDEX idx_alunos_telefone ON alunos (telefone);

-- Courses Indexes
CREATE INDEX idx_courses_nome ON courses (nome);
CREATE INDEX idx_courses_status ON courses (status);

-- Course_Aluno compound index
CREATE INDEX idx_curso_aluno_comp ON curso_aluno (curso_id, aluno_id);

-- Aulas Indexes
CREATE INDEX idx_aulas_classe ON aulas (classe_id);
CREATE INDEX idx_aulas_data ON aulas (data_aula);

-- Presencas Indexes
CREATE INDEX idx_presencas_aula_aluno ON presencas (aula_id, aluno_id);
CREATE INDEX idx_presencas_presente ON presencas (presente);

-- Historico Indexes
CREATE INDEX idx_historico_aluno ON historico_classes (aluno_id);
CREATE INDEX idx_historico_data ON historico_classes (data_evento);

-- =========================================================================
-- 4. VIEWS CREATION
-- =========================================================================

-- vw_dashboard
CREATE VIEW vw_dashboard AS
SELECT 
    (SELECT COUNT(*) FROM alunos) AS total_alunos,
    (
        -- Presentes na última data registrada de aula
        SELECT COUNT(*) 
        FROM presencas p
        JOIN aulas a ON p.aula_id = a.id
        WHERE p.presente = TRUE 
          AND a.data_aula = (SELECT MAX(data_aula) FROM aulas)
    ) AS presentes_ultima_aula,
    (SELECT COUNT(*) FROM alunos WHERE status = 'VISITANTE') AS total_visitantes,
    (SELECT COUNT(*) FROM courses WHERE status = 'EM_ANDAMENTO') AS cursos_ativos;

-- vw_frequencia_por_classe
CREATE VIEW vw_frequencia_por_classe AS
SELECT 
    c.id AS classe_id,
    c.nome AS classe_nome,
    COUNT(a.id) AS total_aulas,
    CASE 
        WHEN COUNT(p.id) = 0 THEN 0
        ELSE ROUND((SUM(CASE WHEN p.presente = TRUE THEN 1 ELSE 0 END)::numeric / COUNT(p.id)::numeric) * 100)
    END AS frequencia_media
FROM classes c
LEFT JOIN aulas a ON c.id = a.classe_id
LEFT JOIN presencas p ON a.id = p.aula_id
GROUP BY c.id, c.nome;

-- vw_frequencia_alunos
CREATE VIEW vw_frequencia_alunos AS
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
FROM alunos al
LEFT JOIN classes c ON al.classe_id = c.id
LEFT JOIN presencas p ON al.id = p.aluno_id
GROUP BY al.id, al.nome, c.nome;

-- vw_visitantes
CREATE VIEW vw_visitantes AS
SELECT id, nome, classe_id, telefone, email, created_at
FROM alunos
WHERE status = 'VISITANTE';

-- vw_cursos
CREATE VIEW vw_cursos AS
SELECT 
    c.id AS curso_id,
    c.nome AS curso_nome,
    c.status AS curso_status,
    c.professor AS curso_professor,
    COUNT(ca.id) AS total_alunos_matriculados
FROM courses c
LEFT JOIN curso_aluno ca ON c.id = ca.curso_id
GROUP BY c.id, c.nome, c.status, c.professor;

-- =========================================================================
-- 5. PL/pgSQL TRIGGERS AND FUNCTIONS
-- =========================================================================

-- Trigger to update updated_at columns automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach update_updated_at trigger to tables
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alunos_updated_at BEFORE UPDATE ON alunos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_aulas_updated_at BEFORE UPDATE ON aulas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_presencas_updated_at BEFORE UPDATE ON presencas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracoes_updated_at BEFORE UPDATE ON configuracoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Aluno Promotion and Status Change logger trigger function
CREATE OR REPLACE FUNCTION log_aluno_events()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle Insertion (INGRESSO)
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO historico_classes (aluno_id, classe_destino_id, tipo, motivo, data_evento)
        VALUES (NEW.id, NEW.classe_id, 'INGRESSO', 'Ingresso inicial do aluno no sistema.', now());
    
    -- Handle Update (PROMOCAO, TRANSFERENCIA, INATIVACAO, REATIVACAO)
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Case 1: Classe changed
        IF (NEW.classe_id IS DISTINCT FROM OLD.classe_id) THEN
            -- Check if it's a promotion (usually age-based/departmental) or simple transfer
            -- For simplicity, if the new class has a different department, log as PROMOCAO. Otherwise TRANSFERENCIA.
            DECLARE
                origem_dept VARCHAR;
                destino_dept VARCHAR;
                event_type tipo_historico := 'TRANSFERENCIA';
            BEGIN
                SELECT departamento INTO origem_dept FROM classes WHERE id = OLD.classe_id;
                SELECT departamento INTO destino_dept FROM classes WHERE id = NEW.classe_id;
                
                IF (origem_dept IS DISTINCT FROM destino_dept) THEN
                    event_type := 'PROMOCAO';
                END IF;
                
                INSERT INTO historico_classes (aluno_id, classe_origem_id, classe_destino_id, tipo, motivo, data_evento)
                VALUES (NEW.id, OLD.classe_id, NEW.classe_id, event_type, 'Mudança de classe efetuada pela administração.', now());
            END;
        END IF;

        -- Case 2: Status changed
        IF (NEW.status IS DISTINCT FROM OLD.status) THEN
            IF (NEW.status = 'INATIVO') THEN
                INSERT INTO historico_classes (aluno_id, classe_origem_id, tipo, motivo, data_evento)
                VALUES (NEW.id, NEW.classe_id, 'INATIVACAO', 'Aluno inativado no sistema.', now());
            ELSIF (NEW.status = 'ATIVO' AND OLD.status = 'INATIVO') THEN
                INSERT INTO historico_classes (aluno_id, classe_destino_id, tipo, motivo, data_evento)
                VALUES (NEW.id, NEW.classe_id, 'REATIVACAO', 'Aluno reativado no sistema.', now());
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach log triggers to alunos
CREATE TRIGGER trg_alunos_insert AFTER INSERT ON alunos FOR EACH ROW EXECUTE FUNCTION log_aluno_events();
CREATE TRIGGER trg_alunos_update AFTER UPDATE ON alunos FOR EACH ROW EXECUTE FUNCTION log_aluno_events();
