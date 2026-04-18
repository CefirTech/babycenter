-- Politiques RLS pour permettre au staff d'uploader/gérer les fichiers dans avatars, product-images, category-images
DO $$ BEGIN
  -- Avatars
  DROP POLICY IF EXISTS "Public reads avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Staff manages avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Public reads product images" ON storage.objects;
  DROP POLICY IF EXISTS "Staff manages product images" ON storage.objects;
  DROP POLICY IF EXISTS "Public reads category images" ON storage.objects;
  DROP POLICY IF EXISTS "Staff manages category images" ON storage.objects;
END $$;

CREATE POLICY "Public reads avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Staff manages avatars" ON storage.objects
  FOR ALL USING (bucket_id = 'avatars' AND public.is_staff(auth.uid()))
  WITH CHECK (bucket_id = 'avatars' AND public.is_staff(auth.uid()));

CREATE POLICY "Public reads product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Staff manages product images" ON storage.objects
  FOR ALL USING (bucket_id = 'product-images' AND public.is_staff(auth.uid()))
  WITH CHECK (bucket_id = 'product-images' AND public.is_staff(auth.uid()));

CREATE POLICY "Public reads category images" ON storage.objects
  FOR SELECT USING (bucket_id = 'category-images');
CREATE POLICY "Staff manages category images" ON storage.objects
  FOR ALL USING (bucket_id = 'category-images' AND public.is_staff(auth.uid()))
  WITH CHECK (bucket_id = 'category-images' AND public.is_staff(auth.uid()));