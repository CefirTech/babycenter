/*
  # Création du compte administrateur initial

  Crée un utilisateur admin avec :
  - Email : admin@babycenter.ci
  - Mot de passe : Admin2024!
  - Rôle : admin
*/

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Créer l'utilisateur si inexistant
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@babycenter.ci') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password,
      email_confirmed_at, raw_user_meta_data, raw_app_meta_data,
      aud, role, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'admin@babycenter.ci',
      crypt('Admin2024!', gen_salt('bf')),
      now(),
      '{"display_name": "Administrateur"}'::jsonb,
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      'authenticated', 'authenticated',
      now(), now(), '', '', '', ''
    );
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@babycenter.ci';

  -- Rôle admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Profil
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (v_user_id, 'Administrateur', 'admin@babycenter.ci')
  ON CONFLICT (user_id) DO UPDATE SET display_name = 'Administrateur';
END $$;
