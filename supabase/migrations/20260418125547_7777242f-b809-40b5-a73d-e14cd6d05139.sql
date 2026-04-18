-- Buckets publics
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images','product-images',true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('category-images','category-images',true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars','avatars',true) ON CONFLICT (id) DO NOTHING;

-- Lecture publique
CREATE POLICY "Public read product-images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Public read category-images" ON storage.objects FOR SELECT USING (bucket_id = 'category-images');
CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- Staff manage product-images
CREATE POLICY "Staff insert product-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff update product-images" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff delete product-images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND public.is_staff(auth.uid()));

-- Staff manage category-images
CREATE POLICY "Staff insert category-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'category-images' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff update category-images" ON storage.objects FOR UPDATE USING (bucket_id = 'category-images' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff delete category-images" ON storage.objects FOR DELETE USING (bucket_id = 'category-images' AND public.is_staff(auth.uid()));

-- Avatars: chaque user gère son propre dossier {user_id}/...
CREATE POLICY "Users insert own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);