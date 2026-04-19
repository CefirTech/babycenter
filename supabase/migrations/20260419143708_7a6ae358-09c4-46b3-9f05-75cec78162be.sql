ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_genre_check;
UPDATE public.categories SET genre = 'unisexe' WHERE genre IN ('mixte');
UPDATE public.categories SET genre = 'garcon' WHERE genre IN ('garçon');
ALTER TABLE public.categories ADD CONSTRAINT categories_genre_check CHECK (genre IS NULL OR genre IN ('fille','garcon','unisexe'));