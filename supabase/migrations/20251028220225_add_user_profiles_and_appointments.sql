/*
  # Add User Profiles, Health Documents, and Appointments

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users, unique)
      - `full_name` (text)
      - `date_of_birth` (date)
      - `gender` (text)
      - `blood_group` (text)
      - `height_cm` (decimal)
      - `weight_kg` (decimal)
      - `allergies` (text[])
      - `chronic_conditions` (text[])
      - `emergency_contact_name` (text)
      - `emergency_contact_phone` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `health_documents`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `document_name` (text)
      - `document_type` (text) - prescription, lab_report, scan, other
      - `document_url` (text)
      - `upload_date` (timestamptz)
      - `notes` (text)
    
    - `preliminary_analyses`
      - `id` (uuid, primary key)
      - `assessment_id` (uuid, references health_assessments)
      - `risk_level` (text) - low, medium, high, critical
      - `urgency` (text) - routine, urgent, emergency
      - `preliminary_diagnosis` (text)
      - `recommended_specialist` (text)
      - `analysis_summary` (text)
      - `created_at` (timestamptz)
    
    - `appointments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `hospital_id` (uuid, references hospitals)
      - `assessment_id` (uuid, references health_assessments)
      - `appointment_date` (timestamptz)
      - `status` (text) - pending, confirmed, completed, cancelled
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all new tables
    - Users can read and update their own profiles
    - Users can create and read their own health documents
    - Users can read their own preliminary analyses
    - Users can create and read their own appointments

  3. Storage Bucket
    - Create storage bucket for health documents
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name text NOT NULL DEFAULT '',
  date_of_birth date,
  gender text DEFAULT '',
  blood_group text DEFAULT '',
  height_cm decimal(5, 2),
  weight_kg decimal(5, 2),
  allergies text[] DEFAULT ARRAY[]::text[],
  chronic_conditions text[] DEFAULT ARRAY[]::text[],
  emergency_contact_name text DEFAULT '',
  emergency_contact_phone text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create health_documents table
CREATE TABLE IF NOT EXISTS health_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_name text NOT NULL,
  document_type text NOT NULL DEFAULT 'other',
  document_url text NOT NULL,
  upload_date timestamptz DEFAULT now(),
  notes text DEFAULT ''
);

ALTER TABLE health_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health documents"
  ON health_documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own health documents"
  ON health_documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own health documents"
  ON health_documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create preliminary_analyses table
CREATE TABLE IF NOT EXISTS preliminary_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES health_assessments(id) ON DELETE CASCADE NOT NULL,
  risk_level text NOT NULL DEFAULT 'low',
  urgency text NOT NULL DEFAULT 'routine',
  preliminary_diagnosis text NOT NULL DEFAULT '',
  recommended_specialist text NOT NULL DEFAULT '',
  analysis_summary text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE preliminary_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preliminary analyses"
  ON preliminary_analyses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM health_assessments
      WHERE health_assessments.id = preliminary_analyses.assessment_id
      AND health_assessments.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create preliminary analyses"
  ON preliminary_analyses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM health_assessments
      WHERE health_assessments.id = preliminary_analyses.assessment_id
      AND health_assessments.user_id = auth.uid()
    )
  );

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  hospital_id uuid REFERENCES hospitals(id) NOT NULL,
  assessment_id uuid REFERENCES health_assessments(id),
  appointment_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for health documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('health-documents', 'health-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for health documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload own health documents'
  ) THEN
    CREATE POLICY "Users can upload own health documents"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'health-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can view own health documents'
  ) THEN
    CREATE POLICY "Users can view own health documents"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (bucket_id = 'health-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete own health documents'
  ) THEN
    CREATE POLICY "Users can delete own health documents"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'health-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;