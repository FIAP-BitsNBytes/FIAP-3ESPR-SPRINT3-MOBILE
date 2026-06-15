-- Fix: add photo_path column to meal_logs
ALTER TABLE meal_logs ADD COLUMN IF NOT EXISTS photo_path text;

-- Fix: alter source column constraint (drop and recreate)
ALTER TABLE meal_logs DROP CONSTRAINT IF EXISTS meal_logs_source_check;
ALTER TABLE meal_logs ALTER COLUMN source SET DEFAULT 'MANUAL';
UPDATE meal_logs SET source = 'MANUAL' WHERE source = 'manual';
ALTER TABLE meal_logs ADD CONSTRAINT meal_logs_source_check CHECK (source IN ('MANUAL', 'IOT'));

-- Create private meal-photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('meal-photos', 'meal-photos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- RLS: patients can insert/read their own photos
DROP POLICY IF EXISTS "patient_insert_own_meal_photos" ON storage.objects;
CREATE POLICY "patient_insert_own_meal_photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'meal-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "patient_select_own_meal_photos" ON storage.objects;
CREATE POLICY "patient_select_own_meal_photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'meal-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS: nutritionists can read photos of their patients.
-- NOTE: clinic_members não existe neste schema; o vínculo paciente↔nutricionista
-- vive em patient_details.nutritionist_id. Esta policy é substituída pela versão
-- definitiva (own-patient) na migration 20260611150000.
DROP POLICY IF EXISTS "nutritionist_select_patient_meal_photos" ON storage.objects;
CREATE POLICY "nutritionist_select_patient_meal_photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'meal-photos' AND
    EXISTS (
      SELECT 1 FROM public.patient_details pd
      WHERE pd.nutritionist_id = auth.uid()
        AND pd.id::text = (storage.foldername(name))[1]
    )
  );
