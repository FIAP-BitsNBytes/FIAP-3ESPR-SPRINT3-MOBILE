-- 1. Setup Extensions & Enums
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('PATIENT', 'NUTRITIONIST', 'ADMIN');
CREATE TYPE nutritionist_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE appointment_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- 2. Base Identity Table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role user_role NOT NULL,
    
    -- Audit Columns
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 3. Domain Specific Details
CREATE TABLE nutritionist_details (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    crm_crn TEXT UNIQUE NOT NULL,
    status nutritionist_status DEFAULT 'PENDING' NOT NULL,
    
    -- Audit Columns
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE TABLE patient_details (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    nutritionist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    birth_date DATE,
    initial_weight DECIMAL(5,2),
    height DECIMAL(3,2),
    goal TEXT,
    
    -- Audit Columns
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 4. Clinical & Monitoring Data
CREATE TABLE meal_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    nutritionist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    food_name TEXT NOT NULL,
    quantity TEXT NOT NULL,
    calories INTEGER,
    logged_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Audit Columns
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE TABLE evolution_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    nutritionist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    fat_percentage DECIMAL(4,2),
    muscle_mass DECIMAL(4,2),
    notes TEXT,
    
    -- Audit Columns
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 5. Management & Gamification
CREATE TABLE gamification_stats (
    patient_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    nutritionist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    points INTEGER DEFAULT 0 NOT NULL,
    experience INTEGER DEFAULT 0 NOT NULL,
    level INTEGER DEFAULT 1 NOT NULL,
    streak_days INTEGER DEFAULT 0 NOT NULL,
    
    -- Audit Columns
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    nutritionist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status appointment_status DEFAULT 'PENDING' NOT NULL,
    type TEXT,
    
    -- Audit Columns
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 6. Performance Indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_patient_details_nutritionist ON patient_details(nutritionist_id);
CREATE INDEX idx_meal_logs_patient_nutri ON meal_logs(patient_id, nutritionist_id);
CREATE INDEX idx_meal_logs_logged_at ON meal_logs(logged_at DESC);
CREATE INDEX idx_evolution_logs_patient_date ON evolution_logs(patient_id, date DESC);
CREATE INDEX idx_appointments_patient_nutri ON appointments(patient_id, nutritionist_id);
CREATE INDEX idx_appointments_scheduled_at ON appointments(scheduled_at);

-- 7. Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutritionist_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are readable by authenticated" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Clinical Access (Nutritionist-Patient Link)
CREATE POLICY "Patients view own logs" ON meal_logs FOR ALL USING (auth.uid() = patient_id);
CREATE POLICY "Patients view own evolution" ON evolution_logs FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Patients view own details" ON patient_details FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Nutritionists view linked patient logs" ON meal_logs FOR SELECT USING (auth.uid() = nutritionist_id);
CREATE POLICY "Nutritionists manage linked patient evolution" ON evolution_logs FOR ALL USING (auth.uid() = nutritionist_id);
CREATE POLICY "Nutritionists manage linked patient details" ON patient_details FOR ALL USING (auth.uid() = nutritionist_id);

-- Admin Policies
CREATE POLICY "Admins manage nutritionist accounts" ON nutritionist_details FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- 8. Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_meal_logs_modtime BEFORE UPDATE ON meal_logs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_evolution_logs_modtime BEFORE UPDATE ON evolution_logs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_appointments_modtime BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();;
