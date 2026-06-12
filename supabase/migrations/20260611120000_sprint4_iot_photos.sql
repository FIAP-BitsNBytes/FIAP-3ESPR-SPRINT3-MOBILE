-- Sprint 4: IoT SmartBottle Integration + Photo Storage
-- Adds: smart_bottle_logs, photo_storage, hydration tracking, and RLS policies

-- Create smart_bottle_logs table
CREATE TABLE IF NOT EXISTS smart_bottle_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bottle_mac_address TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  hydration_ml NUMERIC(6,2) NOT NULL CHECK (hydration_ml > 0),
  battery_level SMALLINT CHECK (battery_level >= 0 AND battery_level <= 100),
  signal_strength SMALLINT,
  source TEXT NOT NULL DEFAULT 'mqtt',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_smart_bottle_logs_patient_id ON smart_bottle_logs(patient_id);
CREATE INDEX idx_smart_bottle_logs_timestamp ON smart_bottle_logs(timestamp DESC);
CREATE INDEX idx_smart_bottle_logs_patient_timestamp ON smart_bottle_logs(patient_id, timestamp DESC);

-- Create photos table for nutrition tracking
CREATE TABLE IF NOT EXISTS nutrition_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_log_id UUID,
  file_path TEXT NOT NULL,
  bucket TEXT NOT NULL DEFAULT 'nutrition-photos',
  file_size BIGINT,
  mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nutrition_photos_patient_id ON nutrition_photos(patient_id);
CREATE INDEX idx_nutrition_photos_meal_log_id ON nutrition_photos(meal_log_id);

-- Add source column to meal_logs if not exists
ALTER TABLE meal_logs ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';

-- Enable RLS on smart_bottle_logs
ALTER TABLE smart_bottle_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Patients can view only their own smart bottle logs
CREATE POLICY "Patients can view own smart_bottle_logs" ON smart_bottle_logs
  FOR SELECT
  USING (
    auth.uid() = patient_id OR
    EXISTS (
      SELECT 1 FROM patient_relations
      WHERE nutritionist_id = auth.uid() AND patient_id = smart_bottle_logs.patient_id
    ) OR
    EXISTS (
      SELECT 1 FROM users_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'clinic_manager')
    )
  );

-- RLS Policy: Only patients and authorized nutritionists can insert smart_bottle_logs
CREATE POLICY "Smart bottle logs insert policy" ON smart_bottle_logs
  FOR INSERT
  WITH CHECK (
    auth.uid() = patient_id OR
    EXISTS (
      SELECT 1 FROM patient_relations
      WHERE nutritionist_id = auth.uid() AND patient_id = smart_bottle_logs.patient_id
    ) OR
    EXISTS (
      SELECT 1 FROM users_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'clinic_manager')
    )
  );

-- Enable RLS on nutrition_photos
ALTER TABLE nutrition_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Patients can view only their own photos
CREATE POLICY "Patients can view own nutrition_photos" ON nutrition_photos
  FOR SELECT
  USING (
    auth.uid() = patient_id OR
    EXISTS (
      SELECT 1 FROM patient_relations
      WHERE nutritionist_id = auth.uid() AND patient_id = nutrition_photos.patient_id
    ) OR
    EXISTS (
      SELECT 1 FROM users_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'clinic_manager')
    )
  );

-- RLS Policy: Patients can insert their own photos
CREATE POLICY "Patients can insert own nutrition_photos" ON nutrition_photos
  FOR INSERT
  WITH CHECK (
    auth.uid() = patient_id
  );

-- RLS Policy: Patients can update their own photos
CREATE POLICY "Patients can update own nutrition_photos" ON nutrition_photos
  FOR UPDATE
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- RLS Policy: Patients can delete their own photos
CREATE POLICY "Patients can delete own nutrition_photos" ON nutrition_photos
  FOR DELETE
  USING (auth.uid() = patient_id);

-- Create storage bucket for nutrition photos (if using Supabase Storage)
-- Note: This requires manual setup via Supabase Dashboard or direct SQL if bucket management is available
-- INSERT INTO storage.buckets (id, name, public) VALUES ('nutrition-photos', 'nutrition-photos', false) ON CONFLICT DO NOTHING;
