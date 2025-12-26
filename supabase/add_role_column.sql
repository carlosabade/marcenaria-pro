-- Add role column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Update the current user (you) to be an admin
-- Replace 'seu-email@exemplo.com' with the user's email if widely known, 
-- or we can provide a generic update since the user is in development.
-- Since I don't have the user's email, I will make all existing users admins for now to prevent lockout during dev, 
-- or better, just rely on the user manually updating via Supabase dashboard if they want specific control.
-- But for a "fix", let's update a specific email if we knew it. 
-- As a safe fallback for the "first user" scenario:

UPDATE profiles 
SET role = 'admin' 
WHERE id IN (
  SELECT id FROM profiles ORDER BY created_at ASC LIMIT 1
);

-- Alternatively, set specific known email if available in context (I don't have it).
