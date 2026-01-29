-- ==============================================================================
-- GROFAST ADMIN ROLE GRANT
-- Run this script in Supabase SQL Editor to ensure you are an admin.
-- ==============================================================================

UPDATE public.user_profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email = 'grofastdigital@gmail.com'
);
