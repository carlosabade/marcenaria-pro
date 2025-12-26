-- 🚨 RUN THIS IN SUPABASE SQL EDITOR 🚨
-- Este script faz tudo: cria a coluna se não existir e dá permissão.

-- 1. Adiciona a coluna 'role' se ela não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role VARCHAR(20) DEFAULT 'user';
    END IF;
END $$;

-- 2. Transforma TODOS os usuários em ADMINISTRADORES
UPDATE profiles 
SET role = 'admin';

-- 3. Verifica o resultado
SELECT email, role FROM profiles;
