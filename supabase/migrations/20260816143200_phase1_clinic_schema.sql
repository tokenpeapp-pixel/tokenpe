-- PHASE 1: Create the new Clinic database schema.

CREATE TABLE clinics (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code                  text UNIQUE NOT NULL,
  name                  text NOT NULL,
  email                 text NOT NULL,
  phone                 text NOT NULL,
  pin_hash              text NOT NULL,
  google_id             text,
  specialty             text,
  welcome_message       text,
  active_notice         text,
  logo_url              text,
  banner_url            text,           -- Added: Hero image for public profile
  address               text,
  city                  text,
  area                  text,
  lat                   double precision,
  lng                   double precision,
  location              geography(Point, 4326),
  google_maps_url       text,           -- Added: Google Maps link
  google_reviews_url    text,           -- Added: Google Review feedback link
  website_url           text,           -- Added: Official website
  whatsapp_number       text,           -- Added: Support WhatsApp if different from main phone
  operating_hours       jsonb DEFAULT '{}', -- Added: Store daily timings (Mon-Sun)
  is_open               boolean DEFAULT true,
  closed_today_date     date,           -- Added: Easy flag for temporary closures
  queue_paused          boolean DEFAULT false,
  is_public             boolean DEFAULT true,
  is_verified           boolean DEFAULT false, -- Added: Trust badge for verified clinics
  current_token_number  int DEFAULT 0,
  smart_recall_enabled  boolean DEFAULT false,
  smart_meds_enabled    boolean DEFAULT false,
  voice_alerts_enabled  boolean DEFAULT true,
  voice_language        text DEFAULT 'hi',
  upi_id                text,
  plan_id               text DEFAULT 'trial',
  subscription_status   text DEFAULT 'trialing',
  trial_ends_at         timestamptz,
  razorpay_customer_id  text,           
  razorpay_subscription_id text,        
  razorpay_key_id             text,     
  razorpay_key_secret_encrypted text,   
  razorpay_connected          boolean DEFAULT false,
  razorpay_connected_at       timestamptz,
  parent_clinic_id      uuid REFERENCES clinics(id),
  avg_rating            numeric(2,1) DEFAULT 0,
  rating_count           int DEFAULT 0,
  metadata               jsonb DEFAULT '{}',
  consultation_fee       numeric(10,2),  -- Added: Baseline consultation fee
  registration_number    text,           -- Added: Official medical registration ID
  about_text             text,           -- Added: Long-form description for profile
  social_links           jsonb DEFAULT '{}', -- Added: Instagram, Facebook, etc.
  languages_spoken       text[],         -- Added: e.g., ['English', 'Hindi', 'Marathi']
  amenities              text[],         -- Added: e.g., ['Parking', 'Pharmacy', 'Wheelchair']
  max_daily_tokens       int,            -- Added: Cap on daily walk-ins/bookings
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);
CREATE INDEX idx_clinics_code ON clinics(code);
CREATE INDEX idx_clinics_email_phone ON clinics(email, phone);
CREATE INDEX idx_clinics_location ON clinics USING GIST(location);
CREATE INDEX idx_clinics_public ON clinics(is_public) WHERE is_public = true;

CREATE TABLE patient_entries (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id         uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name              text NOT NULL,
  phone             text NOT NULL,
  age               int,            -- Added: Patient age
  gender            text,           -- Added: Patient gender (M/F/O)
  token_number      int NOT NULL,
  status            text NOT NULL DEFAULT 'waiting',
  source            text DEFAULT 'walkin',
  entry_date        date NOT NULL DEFAULT CURRENT_DATE,
  created_at        timestamptz DEFAULT now(),
  checked_in_at     timestamptz,    -- Added: When patient physically arrived
  expected_time     timestamptz,    -- Added: AI/Calculated expected turn time
  called_at         timestamptz,
  completed_at      timestamptz,
  cancelled_at      timestamptz,
  wait_time_minutes int,
  internal_notes    text,           -- Added: Private clinic notes about the visit
  payment_status    text DEFAULT 'unpaid',
  payment_amount    numeric(10,2),
  rating            int CHECK (rating BETWEEN 1 AND 5),
  feedback          text,
  whatsapp_notified boolean DEFAULT false,
  reminder_sent_at  timestamptz,
  assigned_staff_id uuid,
  is_prebooked      boolean DEFAULT false, -- Added: True if booked via Find Clinic
  appointment_time  timestamptz            -- Added: The specific time slot booked
);
CREATE INDEX idx_patient_entries_clinic_date ON patient_entries(clinic_id, entry_date);
CREATE INDEX idx_patient_entries_status ON patient_entries(clinic_id, status);
CREATE INDEX idx_patient_entries_phone ON patient_entries(clinic_id, phone);

CREATE TABLE appointment_schedules (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id               uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  day_of_week             int CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 1 = Monday, etc.
  start_time              time NOT NULL,
  end_time                time NOT NULL,
  slot_duration_minutes   int NOT NULL DEFAULT 15,
  max_patients_per_slot   int NOT NULL DEFAULT 1,
  booking_fee             numeric(10,2), -- Overrides clinic.consultation_fee if set
  is_active               boolean DEFAULT true,
  created_at              timestamptz DEFAULT now()
);
CREATE INDEX idx_appointment_schedules_clinic ON appointment_schedules(clinic_id, day_of_week);

CREATE TABLE patient_transactions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id               uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_entry_id        uuid REFERENCES patient_entries(id),
  amount                  numeric(10,2) NOT NULL,
  status                  text NOT NULL DEFAULT 'created',
  razorpay_order_id       text,
  razorpay_payment_id     text,
  razorpay_signature      text,
  payment_method           text,
  refund_amount           numeric(10,2) DEFAULT 0,
  refund_reason            text,
  created_at              timestamptz DEFAULT now(),
  captured_at              timestamptz,
  refunded_at              timestamptz
);
CREATE INDEX idx_patient_txn_clinic ON patient_transactions(clinic_id, created_at);
CREATE INDEX idx_patient_txn_razorpay_order ON patient_transactions(razorpay_order_id);

CREATE TABLE clinic_staff (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name          text NOT NULL,
  role          text DEFAULT 'doctor',
  specialty     text,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE patient_entries ADD CONSTRAINT fk_assigned_staff
  FOREIGN KEY (assigned_staff_id) REFERENCES clinic_staff(id);

-- RLS: enable on all 5, NO permissive "true" policies. Only the service role
-- (used server-side via supabaseAdmin) can read/write. Anon gets nothing directly.
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_staff ENABLE ROW LEVEL SECURITY;
-- Intentionally NO policies added for anon/authenticated — all access goes through
-- authenticated API routes using the service role key, server-side only.
