ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS statut text NOT NULL DEFAULT 'publie';
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_statut_check;
ALTER TABLE public.categories ADD CONSTRAINT categories_statut_check CHECK (statut IN ('publie','brouillon'));