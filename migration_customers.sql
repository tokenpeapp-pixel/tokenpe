-- ============================================================
-- TokenPe: Customer & Queue Migration
-- This script creates the unified queue_entries and crm_customers 
-- tables and migrates all data from the old `patients` table.
-- ============================================================

-- The business_type column determines the UI label automatically:
-- 'clinic'     -> "Patient"
-- 'restaurant' -> "Customer"
-- 'salon'      -> "Client"
-- 'school'     -> "Student"

-- 1. Create unified queue_entries table
DROP TABLE IF EXISTS public.queue_entries CASCADE;
CREATE TABLE public.queue_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    business_type TEXT NOT NULL,           -- 'clinic', 'restaurant', 'salon', 'school'
    token TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    language TEXT DEFAULT 'hi',
    status TEXT DEFAULT 'waiting',         -- 'waiting', 'completed', 'skipped'
    date TEXT NOT NULL,                    -- IST date string e.g. '2026-08-04'
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    done_at TIMESTAMPTZ,
    amount_paid NUMERIC(10, 2),
    rating INTEGER,
    feedback_text TEXT,
    feedback_at TIMESTAMPTZ,
    fee_total NUMERIC(10, 2),
    fee_paid NUMERIC(10, 2),
    payment_status TEXT
);

-- Enable RLS
ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "queue_entries_all" ON public.queue_entries FOR ALL USING (true);

-- 2. Create unified crm_customers table
DROP TABLE IF EXISTS public.crm_customers CASCADE;
CREATE TABLE public.crm_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    business_type TEXT NOT NULL,           -- 'clinic', 'restaurant', 'salon', 'school'
    name TEXT,
    phone TEXT,
    first_visit TEXT,
    last_visit TEXT,
    total_visits INTEGER DEFAULT 1,
    avg_rating NUMERIC(3, 2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.crm_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_customers_all" ON public.crm_customers FOR ALL USING (true);

-- 3. Migrate data from old patients table into queue_entries
-- (old patients.clinic_id maps to businesses.id where type = 'clinic')
INSERT INTO public.queue_entries (
    business_id, business_type, token, name, phone, language, status, date,
    joined_at, done_at, amount_paid, rating, feedback_text, feedback_at,
    fee_total, fee_paid, payment_status
)
SELECT
    p.clinic_id,            -- maps to businesses.id (the clinic business)
    'clinic',               -- business_type for all migrated patients
    p.token,
    p.name,
    p.phone,
    p.language,
    p.status,
    p.date,
    p.joined_at,
    p.completed_at,
    p.amount_paid,
    p.rating,
    p.feedback_text,
    p.feedback_at,
    p.fee_total,
    p.fee_paid,
    p.payment_status
FROM public.patients p
WHERE p.clinic_id IN (SELECT id FROM public.businesses WHERE type = 'clinic');

-- 4. Populate crm_customers from migrated queue_entries
-- (one customer per unique phone per business)
INSERT INTO public.crm_customers (business_id, business_type, name, phone, first_visit, last_visit, total_visits)
SELECT
    business_id,
    business_type,
    name,
    phone,
    MIN(date) AS first_visit,
    MAX(date) AS last_visit,
    COUNT(*) AS total_visits
FROM public.queue_entries
WHERE phone IS NOT NULL AND phone != '0000000000'
GROUP BY business_id, business_type, name, phone;

-- Done! Old patients table can be dropped after verification:
-- DROP TABLE public.patients;
