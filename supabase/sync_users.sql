-- 🚨 RUN THIS IN SUPABASE SQL EDITOR 🚨
-- Este script "puxa" os usuários escondidos do sistema de login e coloca na tabela visible do app.

-- 1. Insere usuários que estão no login mas não no perfil
INSERT INTO public.profiles (id, email, role, data)
SELECT 
    id, 
    email, 
    'admin', 
    jsonb_build_object(
        'name', COALESCE(raw_user_meta_data->>'full_name', 'Admin User'),
        'email', email,
        'plan', 'pro',
        'downloadCount', 0,
        'devices', '[]'::jsonb
    )
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- 2. Garante que todos sejam admin
UPDATE public.profiles SET role = 'admin';

-- 3. Mostra a lista completa agora
SELECT email, role FROM public.profiles;
