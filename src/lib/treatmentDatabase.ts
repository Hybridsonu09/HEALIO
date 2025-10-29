interface Symptom {
  name: string;
  severity: number;
}

interface TreatmentData {
  diagnosis: string;
  treatmentPlan: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  precautions: string;
}

export function generateTreatment(symptoms: Symptom[], severityLevel: string): TreatmentData {
  const symptomNames = symptoms.map(s => s.name.toLowerCase());
  const avgSeverity = symptoms.reduce((sum, s) => sum + s.severity, 0) / symptoms.length;

  if (symptomNames.some(s => s.includes('fever') || s.includes('cough') || s.includes('sore throat'))) {
    return generateRespiratoryTreatment(symptoms, severityLevel, avgSeverity);
  }

  if (symptomNames.some(s => s.includes('headache') || s.includes('migraine'))) {
    return generateHeadacheTreatment(symptoms, severityLevel, avgSeverity);
  }

  if (symptomNames.some(s => s.includes('nausea') || s.includes('vomit') || s.includes('diarrhea'))) {
    return generateGastrointestinalTreatment(symptoms, severityLevel, avgSeverity);
  }

  if (symptomNames.some(s => s.includes('chest pain') || s.includes('heart'))) {
    return {
      diagnosis: 'Potential Cardiac Concern - Immediate Medical Attention Required',
      treatmentPlan: 'Chest pain requires immediate evaluation by a healthcare professional. Please proceed to the nearest emergency room or call emergency services immediately.',
      medications: [],
      precautions: '⚠️ SEEK IMMEDIATE MEDICAL ATTENTION\n\nChest pain can indicate serious cardiac conditions. Do not delay seeking emergency care.'
    };
  }

  return generateGeneralTreatment(symptoms, severityLevel, avgSeverity);
}

function generateRespiratoryTreatment(symptoms: Symptom[], severityLevel: string, avgSeverity: number): TreatmentData {
  const hasFever = symptoms.some(s => s.name.toLowerCase().includes('fever'));
  const hasCough = symptoms.some(s => s.name.toLowerCase().includes('cough'));

  let diagnosis = 'Upper Respiratory Tract Infection';
  if (severityLevel === 'severe') {
    diagnosis = 'Severe Respiratory Infection - Medical Evaluation Recommended';
  }

  const medications = [];

  if (hasFever && avgSeverity >= 5) {
    medications.push({
      name: 'Acetaminophen (Tylenol)',
      dosage: '500-1000mg',
      frequency: 'Every 4-6 hours as needed',
      duration: '3-5 days'
    });
  }

  if (hasCough) {
    medications.push({
      name: 'Dextromethorphan (Robitussin)',
      dosage: '10-20mg',
      frequency: 'Every 4 hours as needed',
      duration: '7-10 days'
    });
  }

  medications.push({
    name: 'Vitamin C',
    dosage: '500mg',
    frequency: 'Once daily',
    duration: '7 days'
  });

  return {
    diagnosis,
    treatmentPlan: `Rest and hydration are essential for recovery.\n\n• Get plenty of rest (7-9 hours of sleep)\n• Drink at least 8-10 glasses of water daily\n• Use a humidifier to ease breathing\n• Gargle with warm salt water for sore throat\n• Avoid smoking and secondhand smoke\n\n${severityLevel === 'severe' ? 'Given the severity of symptoms, please consult a healthcare provider within 24 hours.' : 'Monitor symptoms closely. If they worsen or persist beyond 7 days, consult a healthcare provider.'}`,
    medications,
    precautions: `• Do not exceed recommended medication dosages\n• Avoid alcohol while taking medications\n• If fever exceeds 103°F (39.4°C), seek immediate medical care\n• Watch for difficulty breathing or chest pain\n• Isolate from others to prevent spread of infection\n• Wash hands frequently`
  };
}

function generateHeadacheTreatment(symptoms: Symptom[], severityLevel: string, avgSeverity: number): TreatmentData {
  let diagnosis = 'Tension Headache';
  if (avgSeverity >= 7) {
    diagnosis = 'Severe Headache - Possible Migraine';
  }

  const medications = [
    {
      name: 'Ibuprofen (Advil)',
      dosage: '400-600mg',
      frequency: 'Every 6-8 hours as needed',
      duration: 'As needed, max 3 days'
    }
  ];

  if (avgSeverity >= 7) {
    medications.push({
      name: 'Sumatriptan',
      dosage: '50-100mg',
      frequency: 'At onset of migraine',
      duration: 'As needed (prescription required)'
    });
  }

  return {
    diagnosis,
    treatmentPlan: `Focus on pain relief and identifying triggers.\n\n• Rest in a quiet, dark room\n• Apply cold or warm compress to head/neck\n• Stay well hydrated\n• Practice relaxation techniques\n• Avoid bright lights and loud noises\n• Maintain regular sleep schedule\n\n${severityLevel === 'severe' ? 'For severe or persistent headaches, neurological evaluation is recommended.' : 'Track headache patterns to identify potential triggers.'}`,
    medications,
    precautions: `• Avoid overuse of pain medications (can cause rebound headaches)\n• Limit caffeine intake\n• If headache is sudden and severe ("thunderclap"), seek emergency care\n• Watch for vision changes, confusion, or weakness\n• Keep a headache diary to track patterns`
  };
}

function generateGastrointestinalTreatment(symptoms: Symptom[], severityLevel: string, avgSeverity: number): TreatmentData {
  const diagnosis = severityLevel === 'severe'
    ? 'Acute Gastroenteritis - Severe'
    : 'Mild Gastroenteritis';

  const medications = [
    {
      name: 'Oral Rehydration Solution (Pedialyte)',
      dosage: '8 oz',
      frequency: 'Every hour',
      duration: 'Until symptoms improve'
    }
  ];

  if (avgSeverity >= 5) {
    medications.push({
      name: 'Loperamide (Imodium)',
      dosage: '2mg',
      frequency: 'After each loose stool, max 8mg/day',
      duration: '2 days maximum'
    });
  }

  medications.push({
    name: 'Probiotics',
    dosage: '1 capsule',
    frequency: 'Once daily',
    duration: '7-10 days'
  });

  return {
    diagnosis,
    treatmentPlan: `Focus on preventing dehydration and gentle recovery.\n\n• Clear liquid diet for first 24 hours\n• Gradually introduce bland foods (BRAT diet: bananas, rice, applesauce, toast)\n• Avoid dairy, fatty, and spicy foods\n• Rest and allow your body to recover\n• Wash hands frequently\n\n${severityLevel === 'severe' ? 'If unable to keep fluids down or showing signs of severe dehydration, seek immediate medical care.' : 'Most cases resolve within 2-3 days with supportive care.'}`,
    medications,
    precautions: `• Watch for signs of dehydration (dark urine, dizziness, dry mouth)\n• Seek immediate care if blood in stool or vomit\n• Avoid anti-diarrheal medication if fever is present\n• Do not prepare food for others while symptomatic\n• Maintain strict hygiene practices`
  };
}

function generateGeneralTreatment(symptoms: Symptom[], severityLevel: string, avgSeverity: number): TreatmentData {
  const diagnosis = 'General Malaise - Multiple Symptoms';

  const medications = [
    {
      name: 'Multivitamin',
      dosage: '1 tablet',
      frequency: 'Once daily with food',
      duration: '30 days'
    }
  ];

  if (avgSeverity >= 5) {
    medications.push({
      name: 'Acetaminophen (Tylenol)',
      dosage: '500mg',
      frequency: 'Every 6 hours as needed',
      duration: 'As needed for pain/discomfort'
    });
  }

  return {
    diagnosis,
    treatmentPlan: `General supportive care and symptom monitoring.\n\n• Ensure adequate rest (7-9 hours nightly)\n• Maintain balanced nutrition\n• Stay well hydrated (8-10 glasses water daily)\n• Light exercise if tolerated\n• Stress management techniques\n• Monitor symptoms daily\n\n${severityLevel === 'severe' ? 'Given multiple severe symptoms, a comprehensive medical evaluation is recommended.' : 'If symptoms persist beyond 5-7 days or worsen, consult a healthcare provider.'}`,
    medications,
    precautions: `• Do not ignore persistent or worsening symptoms\n• Maintain a symptom journal\n• Avoid self-diagnosing serious conditions\n• Seek immediate care for severe or sudden symptoms\n• Follow up with healthcare provider if no improvement\n• Consider underlying stress or lifestyle factors`
  };
}
