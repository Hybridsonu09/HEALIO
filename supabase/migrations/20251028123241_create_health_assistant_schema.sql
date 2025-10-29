/*
  # AI Health Assistant Database Schema

  1. New Tables
    - `health_assessments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `symptoms` (jsonb) - array of symptoms with severity
      - `severity_level` (text) - mild, moderate, severe
      - `created_at` (timestamptz)
    
    - `treatment_recommendations`
      - `id` (uuid, primary key)
      - `assessment_id` (uuid, references health_assessments)
      - `diagnosis` (text)
      - `treatment_plan` (text)
      - `medications` (jsonb) - array of medications with dosage
      - `precautions` (text)
      - `created_at` (timestamptz)
    
    - `mental_health_consultations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `consultation_type` (text) - anxiety, depression, stress, general
      - `description` (text)
      - `preferred_date` (timestamptz)
      - `status` (text) - pending, scheduled, completed, cancelled
      - `therapist_notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `hospitals`
      - `id` (uuid, primary key)
      - `name` (text)
      - `address` (text)
      - `latitude` (decimal)
      - `longitude` (decimal)
      - `phone` (text)
      - `specialties` (text[])
      - `emergency_available` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can read their own health assessments and consultations
    - Users can create their own health assessments and consultations
    - Users can update their own consultation requests
    - All users can read hospital information
*/

-- Create health_assessments table
CREATE TABLE IF NOT EXISTS health_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  symptoms jsonb NOT NULL DEFAULT '[]'::jsonb,
  severity_level text NOT NULL DEFAULT 'mild',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE health_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health assessments"
  ON health_assessments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own health assessments"
  ON health_assessments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create treatment_recommendations table
CREATE TABLE IF NOT EXISTS treatment_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES health_assessments(id) ON DELETE CASCADE,
  diagnosis text NOT NULL DEFAULT '',
  treatment_plan text NOT NULL DEFAULT '',
  medications jsonb NOT NULL DEFAULT '[]'::jsonb,
  precautions text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE treatment_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own treatment recommendations"
  ON treatment_recommendations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM health_assessments
      WHERE health_assessments.id = treatment_recommendations.assessment_id
      AND health_assessments.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create treatment recommendations"
  ON treatment_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM health_assessments
      WHERE health_assessments.id = treatment_recommendations.assessment_id
      AND health_assessments.user_id = auth.uid()
    )
  );

-- Create mental_health_consultations table
CREATE TABLE IF NOT EXISTS mental_health_consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  consultation_type text NOT NULL DEFAULT 'general',
  description text NOT NULL DEFAULT '',
  preferred_date timestamptz,
  status text NOT NULL DEFAULT 'pending',
  therapist_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE mental_health_consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consultations"
  ON mental_health_consultations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own consultations"
  ON mental_health_consultations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own consultations"
  ON mental_health_consultations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  phone text NOT NULL DEFAULT '',
  specialties text[] DEFAULT ARRAY[]::text[],
  emergency_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hospitals"
  ON hospitals FOR SELECT
  TO authenticated
  USING (true);

-- Insert sample hospital data
INSERT INTO hospitals (name, address, latitude, longitude, phone, specialties, emergency_available)
VALUES
  ('City General Hospital', '123 Main St, Downtown', 40.7128, -74.0060, '+1-555-0101', ARRAY['Emergency', 'General Medicine', 'Surgery'], true),
  ('St. Mary Medical Center', '456 Oak Ave, Midtown', 40.7580, -73.9855, '+1-555-0102', ARRAY['Cardiology', 'Pediatrics', 'Oncology'], true),
  ('Riverside Community Hospital', '789 River Rd, Westside', 40.7489, -73.9680, '+1-555-0103', ARRAY['Emergency', 'Orthopedics', 'Neurology'], true),
  ('Mental Wellness Center', '321 Peace Ln, Uptown', 40.7829, -73.9654, '+1-555-0104', ARRAY['Psychiatry', 'Psychology', 'Counseling'], false),
  ('Hope Medical Institute', '555 Care Blvd, Eastside', 40.7282, -73.9942, '+1-555-0105', ARRAY['General Medicine', 'Mental Health', 'Family Care'], true)
ON CONFLICT DO NOTHING;