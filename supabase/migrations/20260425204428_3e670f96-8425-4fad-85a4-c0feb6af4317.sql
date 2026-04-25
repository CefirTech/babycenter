-- La vue security_invoker=on a besoin des droits SELECT sur les colonnes sous-jacentes
-- mais comme on a fait un REVOKE ALL puis GRANT partiel, on doit ajouter les colonnes manquantes
-- utilisées en interne par la vue (stock pour le calcul en_stock)

GRANT SELECT (stock) ON public.product_variants TO anon;

-- Note: la policy RLS empêche toujours anon de SELECT directement product_variants,
-- mais les grants colonnes permettent à la vue (qui hérite des droits invoker) de lire stock.
-- Le filtre RLS reste actif et laisse passer uniquement les variants de produits actifs.