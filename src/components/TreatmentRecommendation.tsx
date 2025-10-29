import { FileText, Pill, AlertCircle } from 'lucide-react';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface TreatmentRecommendationProps {
  diagnosis: string;
  treatmentPlan: string;
  medications: Medication[];
  precautions: string;
  severityLevel: string;
}

export default function TreatmentRecommendation({
  diagnosis,
  treatmentPlan,
  medications,
  precautions,
  severityLevel
}: TreatmentRecommendationProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-800">Treatment Recommendations</h2>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
          severityLevel === 'severe' ? 'bg-red-100 text-red-700' :
          severityLevel === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
          'bg-green-100 text-green-700'
        }`}>
          {severityLevel.toUpperCase()}
        </span>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Diagnosis</h3>
          <p className="text-gray-700 bg-blue-50 p-4 rounded-lg">{diagnosis}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Treatment Plan</h3>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{treatmentPlan}</p>
        </div>

        {medications.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Pill className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-800">Prescribed Medications</h3>
            </div>
            <div className="space-y-3">
              {medications.map((med, index) => (
                <div key={index} className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-600">
                  <h4 className="font-semibold text-gray-800 mb-2">{med.name}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-700">
                    <div>
                      <span className="font-medium">Dosage:</span> {med.dosage}
                    </div>
                    <div>
                      <span className="font-medium">Frequency:</span> {med.frequency}
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span> {med.duration}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Precautions</h3>
              <p className="text-gray-700 whitespace-pre-line">{precautions}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
          <p className="text-sm text-red-800">
            <strong>Disclaimer:</strong> This is an AI-generated recommendation for informational purposes only.
            Please consult with a qualified healthcare professional for proper diagnosis and treatment.
            If symptoms are severe or worsening, seek immediate medical attention.
          </p>
        </div>
      </div>
    </div>
  );
}
