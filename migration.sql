-- 1. Create the unified businesses table
DROP TABLE IF EXISTS public.businesses CASCADE;
CREATE TABLE public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    code TEXT,
    pin TEXT,
    type TEXT NOT NULL, -- 'clinic', 'restaurant', 'salon', 'school'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Location
    address TEXT,
    city TEXT,
    area TEXT,
    location geography(Point, 4326),
    
    -- Billing
    plan_id TEXT,
    subscription_status TEXT,
    trial_ends_at TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    razorpay_subscription_id TEXT,
    
    -- Profile/Features
    queue_paused BOOLEAN DEFAULT false,
    welcome_message TEXT,
    logo_url TEXT,
    specialty TEXT,
    is_public BOOLEAN DEFAULT true,
    avg_rating NUMERIC(3, 2),
    photo_url TEXT,
    closed_today_date TEXT,
    smart_recall_enabled BOOLEAN DEFAULT false,
    smart_meds_enabled BOOLEAN DEFAULT false,
    upi_id TEXT
);

-- 2. Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Allow public read access (if is_public is true, or you can restrict this later)
CREATE POLICY "Allow public read access to businesses" ON public.businesses
    FOR SELECT USING (true);

-- Allow authenticated users (service role, etc) to insert/update
CREATE POLICY "Allow authenticated full access to businesses" ON public.businesses
    FOR ALL USING (auth.role() = 'authenticated');

-- 3. Migrate data from clinics
INSERT INTO public.businesses (
    id, name, phone, email, code, pin, type, created_at, 
    plan_id, subscription_status, trial_ends_at, current_period_end,
    address, queue_paused, welcome_message, logo_url, razorpay_subscription_id,
    specialty, city, area, is_public, avg_rating, photo_url, location,
    closed_today_date, smart_recall_enabled, smart_meds_enabled, upi_id
)
SELECT 
    id, name, phone, email, code, pin, 'clinic', created_at, 
    plan_id, subscription_status, trial_ends_at, current_period_end,
    address, queue_paused, welcome_message, logo_url, razorpay_subscription_id,
    specialty, city, area, is_public, avg_rating, photo_url, location,
    closed_today_date, smart_recall_enabled, smart_meds_enabled, upi_id
FROM public.clinics;

-- 4. Migrate data from restaurants
INSERT INTO public.businesses (
    id, name, phone, email, code, pin, type, created_at,
    plan_id, subscription_status, trial_ends_at,
    specialty, city, location, is_public
)
SELECT 
    id, name, phone, email, code, pin, 'restaurant', created_at,
    plan_id, subscription_status, trial_ends_at,
    specialty, city, location, is_public
FROM public.restaurants;

-- 5. Migrate data from salons
INSERT INTO public.businesses (
    id, name, phone, email, code, type, created_at,
    upi_id, address, city, area, is_public, photo_url,
    specialty, location, plan_id, subscription_status, trial_ends_at
)
SELECT 
    id, name, phone, email, code, 'salon', created_at,
    upi_id, address, city, area, is_public, photo_url,
    specialty, location, plan_id, subscription_status, trial_ends_at
FROM public.salons;

-- 6. Migrate data from schools
INSERT INTO public.businesses (
    id, name, phone, email, code, pin, type, created_at, updated_at,
    specialty, city, address, location, is_public, queue_paused,
    closed_today_date, plan_id, subscription_status, trial_ends_at
)
SELECT 
    id, name, phone, email, code, pin, 'school', created_at, updated_at,
    specialty, city, address, location, is_public, queue_paused,
    closed_today_date, plan_id, subscription_status, trial_ends_at
FROM public.schools;

-- (Optional) 7. Drop old tables once you verify the migration was successful!
-- DROP TABLE public.clinics;
-- DROP TABLE public.restaurants;
-- DROP TABLE public.salons;
-- DROP TABLE public.schools;
