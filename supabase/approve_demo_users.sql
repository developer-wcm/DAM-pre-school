-- ============================================================
-- APPROVE ALL DEMO USERS
-- ============================================================

-- Approve admin
UPDATE public.profiles
SET approved = true
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'admin@dampreschool.com'
);

-- Approve principal
UPDATE public.profiles
SET approved = true
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'principal@dampreschool.com'
);

-- Approve parent
UPDATE public.profiles
SET approved = true
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'parent@dampreschool.com'
);

-- Approve teacher
UPDATE public.profiles
SET approved = true
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'teacher@dampreschool.com'
);

-- Verify all are approved
SELECT 
  u.email, 
  p.full_name, 
  p.role, 
  p.approved,
  p.verification_code
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email IN (
  'admin@dampreschool.com',
  'principal@dampreschool.com', 
  'parent@dampreschool.com',
  'teacher@dampreschool.com'
)
ORDER BY p.role;
