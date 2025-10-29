import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SymptomAssessment from '../components/SymptomAssessment';
import PreliminaryAnalysis from '../components/PreliminaryAnalysis';
import TreatmentRecommendation from '../components/TreatmentRecommendation';
import AppointmentBooking from '../components/AppointmentBooking';
import { supabase } from '../lib/supabase';
import { generateTreatment } from '../lib/treatmentDatabase';
import { generatePreliminaryAnalysis } from '../lib/preliminaryAnalysis';

type AssessmentStep = 'symptoms' | 'analysis' | 'treatment' | 'booking';

interface Symptom {
  name: string;
  severity: number;
}

interface UserProfile {
  age?: number;
  chronic_conditions?: string[];
  allergies?: string[];
}

interface Analysis {
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  urgency: 'routine' | 'urgent' | 'emergency';
  preliminary_diagnosis: string;
  recommended_specialist: string;
  analysis_summary: string;
  key_findings: string[];
  warning_signs: string[];
}

interface Treatment {
  diagnosis: string;
  treatmentPlan: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  precautions: string;
  severityLevel: string;
}

export default function AssessmentPage() {
  const navigate = useNavigate();
  const [assessmentStep, setAssessmentStep] = useState<AssessmentStep>('symptoms');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      const age = data.date_of_birth
        ? new Date().getFullYear() - new Date(data.date_of_birth).getFullYear()
        : undefined;
      setUserProfile({
        age,
        chronic_conditions: data.chronic_conditions || [],
        allergies: data.allergies || []
      });
    }
  };

  const handleAssessmentComplete = async (symptoms: Symptom[], severityLevel: string) => {
    const preliminaryAnalysis = generatePreliminaryAnalysis(symptoms, userProfile || undefined);
    setAnalysis(preliminaryAnalysis);

    const treatmentData = generateTreatment(symptoms, severityLevel);
    setTreatment({
      ...treatmentData,
      severityLevel
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: assessment } = await supabase
        .from('health_assessments')
        .insert({
          user_id: user.id,
          symptoms,
          severity_level: severityLevel
        })
        .select()
        .single();

      if (assessment) {
        setCurrentAssessmentId(assessment.id);

        await supabase
          .from('preliminary_analyses')
          .insert({
            assessment_id: assessment.id,
            risk_level: preliminaryAnalysis.risk_level,
            urgency: preliminaryAnalysis.urgency,
            preliminary_diagnosis: preliminaryAnalysis.preliminary_diagnosis,
            recommended_specialist: preliminaryAnalysis.recommended_specialist,
            analysis_summary: preliminaryAnalysis.analysis_summary
          });

        await supabase
          .from('treatment_recommendations')
          .insert({
            assessment_id: assessment.id,
            diagnosis: treatmentData.diagnosis,
            treatment_plan: treatmentData.treatmentPlan,
            medications: treatmentData.medications,
            precautions: treatmentData.precautions
          });
      }
    }

    setAssessmentStep('analysis');
  };

  const handleViewTreatment = () => {
    setAssessmentStep('treatment');
  };

  const handleBookAppointment = () => {
    setAssessmentStep('booking');
  };

  const handleBookingComplete = () => {
    navigate('/home');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        to="/home"
        className="inline-block mb-6 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
      >
        ← Back to Home
      </Link>

      {assessmentStep === 'symptoms' && (
        <SymptomAssessment onAssessmentComplete={handleAssessmentComplete} />
      )}

      {assessmentStep === 'analysis' && analysis && (
        <div className="space-y-6">
          <PreliminaryAnalysis
            riskLevel={analysis.risk_level}
            urgency={analysis.urgency}
            preliminaryDiagnosis={analysis.preliminary_diagnosis}
            recommendedSpecialist={analysis.recommended_specialist}
            analysisSummary={analysis.analysis_summary}
            keyFindings={analysis.key_findings}
            warningSigns={analysis.warning_signs}
            onBookAppointment={handleBookAppointment}
          />
          <button
            onClick={handleViewTreatment}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            View Detailed Treatment Recommendations
          </button>
        </div>
      )}

      {assessmentStep === 'treatment' && treatment && (
        <div className="space-y-6">
          <TreatmentRecommendation {...treatment} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setAssessmentStep('analysis')}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Back to Analysis
            </button>
            <button
              onClick={handleBookAppointment}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Book Hospital Appointment
            </button>
          </div>
        </div>
      )}

      {assessmentStep === 'booking' && (
        <AppointmentBooking
          assessmentId={currentAssessmentId || undefined}
          onBookingComplete={handleBookingComplete}
        />
      )}
    </div>
  );
}
