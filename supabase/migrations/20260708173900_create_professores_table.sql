-- Migration: Create Professores Table
-- Description: Creates the professores table, configures RLS, permissions, and the update trigger.

CREATE TABLE public.professores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  telefone text,
  email text,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Usuários autenticados podem gerenciar professores"
ON public.professores
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professores TO authenticated;
GRANT ALL ON public.professores TO service_role;

-- Trigger to update updated_at
CREATE TRIGGER update_professores_updated_at BEFORE UPDATE ON public.professores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
