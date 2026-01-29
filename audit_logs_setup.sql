-- ==============================================================================
-- GROFAST AUDIT LOGS SETUP (FIXED)
-- Run this script in Supabase SQL Editor to enable the "Invite User" logging.
-- ==============================================================================

-- 1. Create the audit_logs table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    target_user UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies

-- Policy A: Only admins can view audit logs (SELECT)
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
);

-- Policy B: Service role (Edge Functions) can insert logs (INSERT)
-- FIX: Changed USING to WITH CHECK for INSERT policy
DROP POLICY IF EXISTS "Service role can insert logs" ON public.audit_logs;
CREATE POLICY "Service role can insert logs"
ON public.audit_logs FOR INSERT
TO service_role
WITH CHECK (true);
