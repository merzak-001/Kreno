-- ================================================================
-- KRENO - Auto-École Management System
-- Database Schema for Supabase (PostgreSQL with Row Level Security)
-- ================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. SCHOOLS (Tenants)
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    agrement_number VARCHAR(100), -- رقم الاعتماد
    agrement_date DATE,           -- تاريخ الاعتماد
    owner_name VARCHAR(255),       -- اسم المالك
    commercial_name VARCHAR(255),  -- اسم الشركة / التسمية التجارية
    wilaya VARCHAR(100) NOT NULL DEFAULT 'سطيف',
    daira VARCHAR(100),
    commune VARCHAR(100),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(100),
    insurance_policy_number VARCHAR(100), -- رقم التأمين على الحوادث للمترشحين
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROFILES (Users & Roles linked to Supabase Auth)
CREATE TYPE user_role AS ENUM ('owner', 'secretary');

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'secretary',
    phone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. VEHICLES (Fleet)
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    brand VARCHAR(100) NOT NULL,          -- ماركة (e.g., Renault, Peugeot)
    model VARCHAR(100) NOT NULL,          -- موديل (e.g., Clio, 208)
    plate_number VARCHAR(100) NOT NULL,   -- رقم التسجيل / الترقيم
    category VARCHAR(20) NOT NULL DEFAULT 'B', -- الصنف
    technical_control_expiry DATE,        -- تاريخ انتهاء المراقبة التقنية
    insurance_expiry DATE,                -- تاريخ انتهاء التأمين
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. INSTRUCTORS (الممرنين)
CREATE TABLE IF NOT EXISTS public.instructors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    license_number VARCHAR(100),
    categories_qualified VARCHAR(100) DEFAULT 'B',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CANDIDATES / STUDENTS (المترشحين)
CREATE TYPE license_category AS ENUM ('A1', 'A', 'B', 'BE', 'C1', 'C1E', 'C', 'CE', 'D', 'DE', 'F');
CREATE TYPE marital_status_type AS ENUM ('single', 'married', 'divorced', 'widowed');
CREATE TYPE candidate_status AS ENUM ('registered', 'in_training', 'exam_ready', 'graduated', 'archived');

CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    dossier_number VARCHAR(50),           -- رقم الملف
    registration_number VARCHAR(50),      -- رقم التسجيل بالمندوبية
    deposit_date DATE DEFAULT CURRENT_DATE,-- تاريخ إيداع الملف
    
    -- Identification
    nin VARCHAR(18) NOT NULL,             -- رقم التعريف الوطني (18 رقم)
    blood_type VARCHAR(10),               -- فصيلة الدم (A+, O+, B-, ...)
    first_name_ar VARCHAR(100) NOT NULL,  -- الاسم بالعربية
    last_name_ar VARCHAR(100) NOT NULL,   -- اللقب بالعربية
    first_name_fr VARCHAR(100),           -- Prénom
    last_name_fr VARCHAR(100),            -- Nom
    gender VARCHAR(10) NOT NULL,          -- ذكر / أنثى
    birth_date DATE NOT NULL,             -- تاريخ الميلاد
    birth_commune VARCHAR(100),           -- بلدية الميلاد
    birth_wilaya VARCHAR(100),            -- ولاية الميلاد
    
    -- Family info
    father_name VARCHAR(100),             -- اسم الأب
    mother_full_name VARCHAR(150),        -- اسم ولقب الأم
    marital_status marital_status_type DEFAULT 'single', -- الحالة العائلية
    
    -- Contact & Address
    address_wilaya VARCHAR(100),
    address_commune VARCHAR(100),
    address_details TEXT,
    phone_number VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    
    -- License Target & Package
    requested_category license_category NOT NULL DEFAULT 'B',
    total_package_price NUMERIC(10, 2) NOT NULL DEFAULT 40000.00,
    amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status candidate_status DEFAULT 'registered',
    
    -- Minor Guardian Info (for A1 or under legal age)
    guardian_name VARCHAR(150),
    guardian_relationship VARCHAR(100),
    guardian_phone VARCHAR(50),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. EXAMS (3-Step Pipeline: Code -> Creneau -> Circulation)
CREATE TYPE exam_type AS ENUM ('code', 'creneau', 'circulation');
CREATE TYPE exam_result AS ENUM ('pending', 'passed', 'failed', 'absent_excused', 'absent_unexcused');

CREATE TABLE IF NOT EXISTS public.student_exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    exam_type exam_type NOT NULL,         -- code (قانون المرور), creneau (المناورات), circulation (السياقة)
    attempt_number INT NOT NULL DEFAULT 1,-- محاولة 1 إلى 15
    exam_date DATE,
    exam_center VARCHAR(150),             -- مركز الامتحان
    examiner_name VARCHAR(150),           -- اسم المفتش / الممتحن
    result exam_result NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PAYMENTS (مستحقات الملف والدفعات)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) DEFAULT 'cash', -- كاش / شيك / تحويل
    receipt_number VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Multi-tenancy: Isolate schools completely
-- ================================================================

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's school_id
CREATE OR REPLACE FUNCTION public.get_current_school_id()
RETURNS UUID AS $$
    SELECT school_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function to check if current user is owner
CREATE OR REPLACE FUNCTION public.is_school_owner()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'owner'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1. Schools Policy: users can view only their own school
CREATE POLICY "Users can view their own school" ON public.schools
    FOR SELECT USING (id = public.get_current_school_id());

CREATE POLICY "Owners can update their own school" ON public.schools
    FOR UPDATE USING (id = public.get_current_school_id() AND public.is_school_owner());

-- 2. Students Policy: staff from same school can read and write
CREATE POLICY "Staff can view students from their school" ON public.students
    FOR SELECT USING (school_id = public.get_current_school_id());

CREATE POLICY "Staff can insert students for their school" ON public.students
    FOR INSERT WITH CHECK (school_id = public.get_current_school_id());

CREATE POLICY "Staff can update students for their school" ON public.students
    FOR UPDATE USING (school_id = public.get_current_school_id());

-- Only Owner can delete students
CREATE POLICY "Only owners can delete students" ON public.students
    FOR DELETE USING (school_id = public.get_current_school_id() AND public.is_school_owner());

-- 3. Exams Policy
CREATE POLICY "Staff can view exams" ON public.student_exams
    FOR SELECT USING (school_id = public.get_current_school_id());

CREATE POLICY "Staff can manage exams" ON public.student_exams
    FOR ALL USING (school_id = public.get_current_school_id());

-- 4. Payments Policy: Staff can view, but only Owners can see all detailed financial profit reports
CREATE POLICY "Staff can view payments" ON public.payments
    FOR SELECT USING (school_id = public.get_current_school_id());

CREATE POLICY "Staff can insert payments" ON public.payments
    FOR INSERT WITH CHECK (school_id = public.get_current_school_id());

CREATE POLICY "Only owners can modify payments" ON public.payments
    FOR UPDATE USING (school_id = public.get_current_school_id() AND public.is_school_owner());

CREATE POLICY "Only owners can delete payments" ON public.payments
    FOR DELETE USING (school_id = public.get_current_school_id() AND public.is_school_owner());
