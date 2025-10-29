import { useState } from 'react';
import { Activity, Plus, X } from 'lucide-react';

interface Symptom {
  name: string;
  severity: number;
}

interface SymptomAssessmentProps {
  onAssessmentComplete: (symptoms: Symptom[], severityLevel: string) => void;
}

export default function SymptomAssessment({ onAssessmentComplete }: SymptomAssessmentProps) {
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [currentSymptom, setCurrentSymptom] = useState('');
  const [currentSeverity, setCurrentSeverity] = useState(5);

  const commonSymptoms = [
    'Headache', 'Fever', 'Cough', 'Fatigue', 'Nausea',
    'Body ache', 'Sore throat', 'Runny nose', 'Dizziness', 'Chest pain'
  ];

  const addSymptom = (symptomName?: string) => {
    const name = symptomName || currentSymptom.trim();
    if (name && !symptoms.find(s => s.name.toLowerCase() === name.toLowerCase())) {
      setSymptoms([...symptoms, { name, severity: currentSeverity }]);
      setCurrentSymptom('');
      setCurrentSeverity(5);
    }
  };

  const removeSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  const updateSeverity = (index: number, severity: number) => {
    const updated = [...symptoms];
    updated[index].severity = severity;
    setSymptoms(updated);
  };

  const calculateOverallSeverity = (): string => {
    if (symptoms.length === 0) return 'mild';
    const avgSeverity = symptoms.reduce((sum, s) => sum + s.severity, 0) / symptoms.length;
    if (avgSeverity >= 7) return 'severe';
    if (avgSeverity >= 4) return 'moderate';
    return 'mild';
  };

  const handleSubmit = () => {
    if (symptoms.length > 0) {
      onAssessmentComplete(symptoms, calculateOverallSeverity());
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Symptom Assessment</h2>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Common Symptoms
        </label>
        <div className="flex flex-wrap gap-2">
          {commonSymptoms.map((symptom) => (
            <button
              key={symptom}
              onClick={() => addSymptom(symptom)}
              disabled={symptoms.some(s => s.name === symptom)}
              className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {symptom}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add Custom Symptom
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={currentSymptom}
            onChange={(e) => setCurrentSymptom(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSymptom()}
            placeholder="Enter symptom..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => addSymptom()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add
          </button>
        </div>
      </div>

      {symptoms.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Symptoms</h3>
          <div className="space-y-3">
            {symptoms.map((symptom, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">{symptom.name}</span>
                  <button
                    onClick={() => removeSymptom(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600 min-w-[100px]">
                    Severity: {symptom.severity}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={symptom.severity}
                    onChange={(e) => updateSeverity(index, parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className={`text-sm font-medium px-2 py-1 rounded ${
                    symptom.severity >= 7 ? 'bg-red-100 text-red-700' :
                    symptom.severity >= 4 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {symptom.severity >= 7 ? 'Severe' : symptom.severity >= 4 ? 'Moderate' : 'Mild'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={symptoms.length === 0}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
      >
        Get Treatment Recommendations
      </button>
    </div>
  );
}
