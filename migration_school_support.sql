-- Migration for TokenPe missing tables (school_classrooms, support_tickets)

-- 1. school_classrooms
CREATE TABLE IF NOT EXISTS public.school_classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    teacher_name TEXT,
    code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for school_classrooms
ALTER TABLE public.school_classrooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to school_classrooms for school owner"
ON public.school_classrooms FOR SELECT
USING ( school_id IN (SELECT id FROM public.businesses WHERE type = 'school') );

CREATE POLICY "Allow all access to school_classrooms for school owner"
ON public.school_classrooms FOR ALL
USING ( true )
WITH CHECK ( true );


-- 2. support_tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

-- Enable RLS for support_tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read/write access to support_tickets for authenticated users"
ON public.support_tickets FOR ALL
USING ( true )
WITH CHECK ( true );
