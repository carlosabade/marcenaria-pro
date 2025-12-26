-- 🚨 RUN THIS IN SUPABASE SQL EDITOR 🚨
-- Remove a permissão de admin dos usuários especificados e volta para 'user' comum.

UPDATE public.profiles
SET role = 'user'
WHERE email IN ('test_plan_access@example.com', 'jmanoelsneto2018@gmail.com');

-- Confere o resultado
SELECT email, role FROM public.profiles;
