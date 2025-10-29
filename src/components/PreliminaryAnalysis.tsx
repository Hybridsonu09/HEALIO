import { AlertTriangle, Activity, Clock, Stethoscope, CheckCircle, AlertCircle } from 'lucide-react';

interface PreliminaryAnalysisProps {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  urgency: 'routine' | 'urgent' | 'emergency';
  preliminaryDiagnosis: string;
  recommendedSpecialist: string;
  analysisSummary: string;
  keyFindings: string[];
  warningSigns: string[];
  onBookAppointment: () => void;
}

export default function PreliminaryAnalysis({
  riskLevel,
  urgency,
  preliminaryDiagnosis,
  recommendedSpecialist,
  analysisSummary,
  keyFindings,
  warningSigns,
  onBookAppointment
}: PreliminaryAnalysisProps) {
  const getRiskColor = () => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-100 border-red-500 text-red-800';
      case 'high': return 'bg-orange-100 border-orange-500 text-orange-800';
      case 'medium': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      default: return 'bg-green-100 border-green-500 text-green-800';
    }
  };

  const getUrgencyColor = () => {
    switch (urgency) {
      case 'emergency': return 'bg-red-600 text-white';
      case 'urgent': return 'bg-orange-600 text-white';
      default: return 'bg-blue-600 text-white';
    }
  };

  const getRiskIcon = () => {
    switch (riskLevel) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-8 h-8" />;
      case 'medium':
        return <AlertCircle className="w-8 h-8" />;
      default:
        return <CheckCircle className="w-8 h-8" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Preliminary Health Analysis</h2>
      </div>

      <div className={`border-l-4 rounded-lg p-6 mb-6 ${getRiskColor()}`}>
        <div className="flex items-start gap-4">
          {getRiskIcon()}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold">{preliminaryDiagnosis}</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getUrgencyColor()}`}>
                {urgency.toUpperCase()}
              </span>
            </div>
            <p className="text-base leading-relaxed">{analysisSummary}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Stethoscope className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-gray-800">Recommended Specialist</h4>
          </div>
          <p className="text-gray-700">{recommendedSpecialist}</p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold text-gray-800">Risk Assessment</h4>
          </div>
          <p className="text-gray-700 capitalize">
            <span className="font-semibold">{riskLevel}</span> risk level
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Key Findings
        </h4>
        <ul className="space-y-2">
          {keyFindings.map((finding, index) => (
            <li key={index} className="flex items-start gap-2 text-gray-700">
              <span className="text-green-600 mt-1">•</span>
              <span>{finding}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          Warning Signs to Monitor
        </h4>
        <ul className="space-y-2">
          {warningSigns.map((sign, index) => (
            <li key={index} className="flex items-start gap-2 text-gray-700">
              <span className="text-amber-600 mt-1">⚠</span>
              <span>{sign}</span>
            </li>
          ))}
        </ul>
      </div>

      {urgency !== 'emergency' && (
        <button
          onClick={onBookAppointment}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
        >
          Book Appointment with Nearest Hospital
        </button>
      )}

      {urgency === 'emergency' && (
        <div className="bg-red-600 text-white rounded-lg p-4 text-center">
          <p className="font-bold text-lg mb-2">⚠️ CALL 108 IMMEDIATELY ⚠️</p>
          <p className="text-sm">Do not book an appointment - seek emergency care now</p>
        </div>
      )}

      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-700">
          <strong>Disclaimer:</strong> This is a preliminary AI-generated analysis based on your reported symptoms.
          It is NOT a medical diagnosis. Always consult with qualified healthcare professionals for proper evaluation and treatment.
        </p>
      </div>
    </div>
  );
}
