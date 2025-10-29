import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type HealthAssessment = {
  id: string;
  user_id: string;
  symptoms: Array<{ name: string; severity: number }>;
  severity_level: 'mild' | 'moderate' | 'severe';
  created_at: string;
};

export type TreatmentRecommendation = {
  id: string;
  assessment_id: string;
  diagnosis: string;
  treatment_plan: string;
  medications: Array<{ name: string; dosage: string; frequency: string; duration: string }>;
  precautions: string;
  created_at: string;
};

export type MentalHealthConsultation = {
  id: string;
  user_id: string;
  consultation_type: 'anxiety' | 'depression' | 'stress' | 'general';
  description: string;
  preferred_date: string;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  therapist_notes: string;
  created_at: string;
  updated_at: string;
};

export type Hospital = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  specialties: string[];
  emergency_available: boolean;
  created_at: string;
};
