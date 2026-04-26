DROP POLICY IF EXISTS "Public reads whitelisted settings" ON public.settings;
CREATE POLICY "Public reads whitelisted settings" ON public.settings
FOR SELECT
USING (
  cle = ANY (ARRAY['shop_name'::text, 'about_text'::text, 'currency'::text, 'free_delivery_threshold'::text, 'hero_banner'::text])
  OR is_staff(auth.uid())
);