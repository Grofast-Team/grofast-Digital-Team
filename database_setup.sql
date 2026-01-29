-- ==============================================================================
-- GROFAST TEAM DATABASE SETUP SCRIPT
-- Run this script in the Supabase SQL Editor to fix the "Error loading profile" issues.
-- ==============================================================================

-- 1. Create the user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'team', -- 'admin', 'manager', 'team'
  department TEXT DEFAULT 'General',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies

-- Policy 1: Allow all authenticated users to view all profiles (Needed for Team Directory)
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.user_profiles;
CREATE POLICY "Enable read access for all authenticated users"
ON public.user_profiles FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Policy 3: Allow "admin" users to update any profile
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
CREATE POLICY "Admins can update all profiles"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
);

-- 4. Create a Trigger to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role, department)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 
    'team',
    'General'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. DATA REPAIR: Insert profiles for existing users who might have signed up before the table existed
INSERT INTO public.user_profiles (id, email, full_name, role, department, created_at)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), 
    'team',
    'General',
    created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_profiles);

-- 6. MAKE YOURSELF ADMIN
-- Be sure to replace 'your_email@example.com' with the email you used to login.
-- This part updates the first user found or a specific user to be admin.
UPDATE public.user_profiles
SET role = 'admin'
WHERE email LIKE 'grofastdigital%'; 
-- ^ This attempts to auto-promote the user from your screenshot.
