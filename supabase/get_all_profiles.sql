-- Returns all non-admin profiles for user management (bypasses RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_all_profiles()
RETURNS TABLE (
  id           UUID,
  full_name    TEXT,
  email        TEXT,
  role         TEXT,
  approved     BOOLEAN,
  created_at   TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.approved,
    p.created_at
  FROM public.profiles p
  WHERE p.role <> 'admin'
  ORDER BY p.approved ASC, p.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_profiles() TO authenticated;
