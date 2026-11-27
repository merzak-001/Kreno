-- ============================================================================
-- Kreno Auto-École — Multi-Tenant Supabase Schema & Row Level Security (RLS)
-- ============================================================================
-- Each auto-école has its own `schools` row (`school_id`), its own users in
-- `profiles`, and isolated business tables protected by Postgres RLS.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Schools (Auto-Écoles)
CREATE TABLE IF NOT EXISTS public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  agrement_number text,
  agrement_date date,
  owner_name text,
  commercial_name text,
  wilaya text,
  daira text,
  commune text,
  address text,
  phone text,
  email text,
  insurance_policy_number text,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. User Profiles (Links Supabase Auth users to a specific school + role)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'secretary')) DEFAULT 'secretary',
  full_name text,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON public.profiles(school_id);

-- 3. Mentors (Instructors)
CREATE TABLE IF NOT EXISTS public.mentors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  specialties text[] NOT NULL DEFAULT ARRAY['creneau', 'circulation'],
  license_categories text[] NOT NULL DEFAULT ARRAY['B'],
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mentors_school_id ON public.mentors(school_id);

-- 4. Vehicles
CREATE TABLE IF NOT EXISTS public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  brand text NOT NULL,
  model text NOT NULL,
  plate_number text NOT NULL,
  category text NOT NULL,
  technical_control_expiry date,
  insurance_expiry date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_school_id ON public.vehicles(school_id);

-- 5. Students (Candidates)
CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  dossier_number text NOT NULL,
  registration_number text,
  deposit_date date NOT NULL,
  nin text NOT NULL,
  blood_type text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  first_name_ar text,
  last_name_ar text,
  gender text NOT NULL CHECK (gender IN ('Homme', 'Femme')),
  birth_date date NOT NULL,
  birth_commune text,
  birth_wilaya text,
  father_name text,
  mother_full_name text,
  marital_status text NOT NULL DEFAULT 'Celibataire',
  address_wilaya text,
  address_commune text,
  address_details text,
  phone_number text NOT NULL,
  email text,
  requested_category text NOT NULL,
  total_package_price numeric(12, 2) NOT NULL DEFAULT 0,
  amount_paid numeric(12, 2) NOT NULL DEFAULT 0,
  contract_details jsonb DEFAULT '{}'::jsonb,
  held_licenses jsonb DEFAULT '[]'::jsonb,
  availability jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_students_school_id ON public.students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_nin ON public.students(school_id, nin);

-- 6. Schedule Slots (30h training + makeup sessions)
CREATE TABLE IF NOT EXISTS public.schedule_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  category text NOT NULL,
  date date NOT NULL,
  time_start text NOT NULL,
  time_end text NOT NULL,
  type text NOT NULL CHECK (type IN ('code', 'creneau', 'circulation')),
  instructor_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('scheduled', 'completed', 'absent', 'cancelled')) DEFAULT 'scheduled',
  fault text CHECK (fault IN ('student', 'school')),
  billing_type text CHECK (billing_type IN ('package', 'free_makeup', 'paid_extra')),
  extra_fee numeric(10, 2) DEFAULT 0,
  compensation_for_slot_id uuid,
  compensated_by_slot_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedule_school_date ON public.schedule_slots(school_id, date);
CREATE INDEX IF NOT EXISTS idx_schedule_student ON public.schedule_slots(student_id);

-- 7. Exam Records
CREATE TABLE IF NOT EXISTS public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  exam_type text NOT NULL CHECK (exam_type IN ('code', 'creneau', 'circulation')),
  attempt_number int NOT NULL DEFAULT 1,
  exam_date date,
  examiner_name text,
  exam_center text,
  result text NOT NULL CHECK (result IN ('pending', 'passed', 'failed', 'absent_excused', 'absent_unexcused')) DEFAULT 'pending',
  fee_amount numeric(10, 2) NOT NULL DEFAULT 2000,
  fee_paid boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exams_school_date ON public.exams(school_id, exam_date);

-- 8. Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount numeric(12, 2) NOT NULL,
  date date NOT NULL,
  type text NOT NULL CHECK (type IN ('initial_deposit', 'installment', 'exam_fee')),
  method text NOT NULL CHECK (method IN ('especes', 'virement', 'cheque')),
  receipt_number text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_school_id ON public.payments(school_id);

-- 9. Engineers (Examens / Inspecteurs d'État)
CREATE TABLE IF NOT EXISTS public.engineers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  title text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_engineers_school_id ON public.engineers(school_id);

-- 10. Audit Logs (Owner-only visibility)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_role text NOT NULL CHECK (user_role IN ('owner', 'secretary')),
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  target_name text NOT NULL,
  details text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_school_id ON public.audit_logs(school_id, created_at DESC);

-- ============================================================================
-- Helper Functions for RLS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_my_school_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- ============================================================================
-- Enable Row Level Security (RLS) on ALL tables
-- ============================================================================

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engineers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Schools: members can read their own school; ONLY owner can update it
CREATE POLICY "schools_select_own" ON public.schools
  FOR SELECT USING (id = public.get_my_school_id());

CREATE POLICY "schools_update_owner" ON public.schools
  FOR UPDATE USING (id = public.get_my_school_id() AND public.get_my_role() = 'owner')
  WITH CHECK (id = public.get_my_school_id() AND public.get_my_role() = 'owner');

-- Profiles: users can view profiles in their school; ONLY owner can manage profiles
CREATE POLICY "profiles_select_school" ON public.profiles
  FOR SELECT USING (school_id = public.get_my_school_id());

CREATE POLICY "profiles_manage_owner" ON public.profiles
  FOR ALL USING (school_id = public.get_my_school_id() AND public.get_my_role() = 'owner')
  WITH CHECK (school_id = public.get_my_school_id() AND public.get_my_role() = 'owner');

-- Mentors: school members can read; ONLY owner can insert/update/delete
CREATE POLICY "mentors_select_school" ON public.mentors
  FOR SELECT USING (school_id = public.get_my_school_id());

CREATE POLICY "mentors_write_owner" ON public.mentors
  FOR ALL USING (school_id = public.get_my_school_id() AND public.get_my_role() = 'owner')
  WITH CHECK (school_id = public.get_my_school_id() AND public.get_my_role() = 'owner');

-- Vehicles: school members can read; ONLY owner can insert/update/delete
CREATE POLICY "vehicles_select_school" ON public.vehicles
  FOR SELECT USING (school_id = public.get_my_school_id());

CREATE POLICY "vehicles_write_owner" ON public.vehicles
  FOR ALL USING (school_id = public.get_my_school_id() AND public.get_my_role() = 'owner')
  WITH CHECK (school_id = public.get_my_school_id() AND public.get_my_role() = 'owner');

-- Students: school members can read/insert/update; ONLY owner can delete
CREATE POLICY "students_select_school" ON public.students
  FOR SELECT USING (school_id = public.get_my_school_id());

CREATE POLICY "students_insert_school" ON public.students
  FOR INSERT WITH CHECK (school_id = public.get_my_school_id());

CREATE POLICY "students_update_school" ON public.students
  FOR UPDATE USING (school_id = public.get_my_school_id())
  WITH CHECK (school_id = public.get_my_school_id());

CREATE POLICY "students_delete_owner" ON public.students
  FOR DELETE USING (school_id = public.get_my_school_id() AND public.get_my_role() = 'owner');

-- Schedule Slots: school members can read/insert/update; ONLY owner can delete
CREATE POLICY "schedule_select_school" ON public.schedule_slots
  FOR SELECT USING (school_id = public.get_my_school_id());

CREATE POLICY "schedule_insert_school" ON public.schedule_slots
  FOR INSERT WITH CHECK (school_id = public.get_my_school_id());

CREATE POLICY "schedule_update_school" ON public.schedule_slots
  FOR UPDATE USING (school_id = public.get_my_school_id())
  WITH CHECK (school_id = public.get_my_school_id());

CREATE POLICY "schedule_delete_owner" ON public.schedule_slots
  FOR DELETE USING (school_id = public.get_my_school_id() AND public.get_my_role() = 'owner');

-- Exams: school members can read/insert/update; ONLY owner can delete
CREATE POLICY "exams_select_school" ON public.exams
  FOR SELECT USING (school_id = public.get_my_school_id());

CREATE POLICY "exams_insert_school" ON public.exams
  FOR INSERT WITH CHECK (school_id = public.get_my_school_id());

CREATE POLICY "exams_update_school" ON public.exams
  FOR UPDATE USING (school_id = public.get_my_school_id())
  WITH CHECK (school_id = public.get_my_school_id());

CREATE POLICY "exams_delete_owner" ON public.exams
  FOR DELETE USING (school_id = public.get_my_school_id() AND public.get_my_role() = 'owner');

-- Payments: school members can insert/select; ONLY owner can update/delete
CREATE POLICY "payments_select_school" ON public.payments
  FOR SELECT USING (school_id = public.get_my_school_id());

CREATE POLICY "payments_insert_school" ON public.payments
  FOR INSERT WITH CHECK (school_id = public.get_my_school_id());

CREATE POLICY "payments_modify_owner" ON public.payments
  FOR UPDATE USING (school_id = public.get_my_school_id() AND public.get_my_role() = 'owner')
  WITH CHECK (school_id = public.get_my_school_id() AND public.get_my_role() = 'owner');

CREATE POLICY "payments_delete_owner" ON public.payments
  FOR DELETE USING (school_id = public.get_my_school_id() AND public.get_my_role() = 'owner');

-- Engineers: school members can read; ONLY owner can insert/update/delete
CREATE POLICY "engineers_select_school" ON public.engineers
  FOR SELECT USING (school_id = public.get_my_school_id());

CREATE POLICY "engineers_write_owner" ON public.engineers
  FOR ALL USING (school_id = public.get_my_school_id() AND public.get_my_role() = 'owner')
  WITH CHECK (school_id = public.get_my_school_id() AND public.get_my_role() = 'owner');

-- Audit Logs: school members can insert; ONLY owner can read
CREATE POLICY "audit_insert_school" ON public.audit_logs
  FOR INSERT WITH CHECK (school_id = public.get_my_school_id());

CREATE POLICY "audit_select_owner" ON public.audit_logs
  FOR SELECT USING (school_id = public.get_my_school_id() AND public.get_my_role() = 'owner');
