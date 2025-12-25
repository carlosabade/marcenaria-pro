-- Add status column to profiles for user management
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Update existing records to match default
UPDATE profiles SET status = 'active' WHERE status IS NULL;
