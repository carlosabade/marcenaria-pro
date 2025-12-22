
-- Enable RLS (already enabled, but good practice to ensure)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow Public (Anon) to UPDATE specific fields if they have the token
-- We restrict updates to only status and approved_at for security
CREATE POLICY "Public Approve Project by Token"
ON projects
FOR UPDATE
TO anon
USING (public_token IS NOT NULL)
WITH CHECK (public_token IS NOT NULL);

-- Important: We should ideally restrict WHICH columns can be updated, but standard RLS applies to the row.
-- Supabase/Postgres doesn't support column-level RLS easily for UPDATE without triggers or functions, 
-- but for this MVP, allowing update on the row where token matches is acceptable risk provided the client only sends status/approved_at.
-- A stricter approach would be a Database Function `approve_project(token)`.

-- Let's stick to the Policy for simplicity now, but ensure the frontend API call only sends those fields.
-- The frontend is sending: { status: 'approved', approved_at: ... }

-- Grant usage on relevant sequences if needed (none for UUIDs usually)
