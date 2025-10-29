interface Symptom {
  name: string;
  severity: number;
}

interface UserProfile {
  age?: number;
  chronic_conditions?: string[];
  allergies?: string[];
}

interface PreliminaryAnalysis {
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  urgency: 'routine' | 'urgent' | 'emergency';
  preliminary_diagnosis: string;
  recommended_specialist: string;
  analysis_summary: string;
  key_findings: string[];
  warning_signs: string[];
}

export function generatePreliminaryAnalysis(
  symptoms: Symptom[],
  userProfile?: UserProfile
): PreliminaryAnalysis {
  const symptomNames = symptoms.map(s => s.name.toLowerCase());
  const avgSeverity = symptoms.reduce((sum, s) => sum + s.severity, 0) / symptoms.length;
  const maxSeverity = Math.max(...symptoms.map(s => s.severity));

  const criticalSymptoms = [
    'chest pain', 'severe chest pain', 'heart attack', 'stroke',
    'difficulty breathing', 'cannot breathe', 'choking',
    'severe bleeding', 'unconscious', 'seizure', 'paralysis'
  ];

  const hasCriticalSymptom = symptomNames.some(s =>
    criticalSymptoms.some(critical => s.includes(critical))
  );

  if (hasCriticalSymptom || maxSeverity >= 9) {
    return generateEmergencyAnalysis(symptoms, userProfile);
  }

  if (symptomNames.some(s => s.includes('chest pain') || s.includes('heart'))) {
    return generateCardiacAnalysis(symptoms, userProfile);
  }

  if (symptomNames.some(s =>
    s.includes('fever') || s.includes('cough') || s.includes('sore throat')
  )) {
    return generateRespiratoryAnalysis(symptoms, avgSeverity, userProfile);
  }

  if (symptomNames.some(s =>
    s.includes('headache') || s.includes('migraine') || s.includes('dizziness')
  )) {
    return generateNeurologicalAnalysis(symptoms, avgSeverity, userProfile);
  }

  if (symptomNames.some(s =>
    s.includes('nausea') || s.includes('vomit') || s.includes('diarrhea') || s.includes('stomach')
  )) {
    return generateGastrointestinalAnalysis(symptoms, avgSeverity, userProfile);
  }

  if (symptomNames.some(s =>
    s.includes('body ache') || s.includes('joint') || s.includes('muscle')
  )) {
    return generateMusculoskeletalAnalysis(symptoms, avgSeverity, userProfile);
  }

  return generateGeneralAnalysis(symptoms, avgSeverity, userProfile);
}

function generateEmergencyAnalysis(symptoms: Symptom[], profile?: UserProfile): PreliminaryAnalysis {
  return {
    risk_level: 'critical',
    urgency: 'emergency',
    preliminary_diagnosis: 'MEDICAL EMERGENCY - Immediate Attention Required',
    recommended_specialist: 'Emergency Medicine',
    analysis_summary: `Your symptoms indicate a potentially life-threatening condition that requires immediate medical attention. DO NOT DELAY - proceed to the nearest emergency room or call emergency services (108) immediately. ${profile?.chronic_conditions?.length ? 'Your pre-existing conditions increase the urgency.' : ''}`,
    key_findings: [
      'Critical symptoms detected requiring immediate intervention',
      'High severity level indicates serious medical concern',
      'Emergency medical evaluation essential',
      profile?.chronic_conditions?.length ? 'Pre-existing conditions may complicate situation' : 'Urgent assessment needed'
    ],
    warning_signs: [
      '⚠️ CALL 108 IMMEDIATELY',
      'Do not drive yourself to the hospital',
      'Time is critical - every minute counts',
      'Have someone stay with you while waiting for help'
    ]
  };
}

function generateCardiacAnalysis(symptoms: Symptom[], profile?: UserProfile): PreliminaryAnalysis {
  const maxSeverity = Math.max(...symptoms.map(s => s.severity));

  if (maxSeverity >= 7) {
    return {
      risk_level: 'critical',
      urgency: 'emergency',
      preliminary_diagnosis: 'Possible Acute Cardiac Event',
      recommended_specialist: 'Cardiologist / Emergency Medicine',
      analysis_summary: `Your chest pain symptoms require immediate medical evaluation to rule out heart attack or other serious cardiac conditions. ${profile?.age && profile.age > 45 ? 'Your age increases cardiac risk.' : ''} Proceed to emergency room immediately.`,
      key_findings: [
        'Chest pain with high severity level',
        'Cardiac event cannot be ruled out',
        'Immediate medical evaluation required',
        profile?.chronic_conditions?.includes('hypertension') ? 'Hypertension increases cardiac risk' : 'Cardiac assessment essential'
      ],
      warning_signs: [
        'Seek emergency care immediately',
        'Do not delay evaluation',
        'Cardiac events are time-sensitive',
        'Call 108 if symptoms worsen'
      ]
    };
  }

  return {
    risk_level: 'high',
    urgency: 'urgent',
    preliminary_diagnosis: 'Cardiac Symptoms - Evaluation Needed',
    recommended_specialist: 'Cardiologist',
    analysis_summary: `Chest-related symptoms should be evaluated by a cardiologist within 24 hours. While not immediately life-threatening, cardiac issues require prompt attention.`,
    key_findings: [
      'Cardiac symptoms present',
      'Medical evaluation recommended within 24 hours',
      'Further diagnostic tests may be needed',
      'Monitor for worsening symptoms'
    ],
    warning_signs: [
      'Seek immediate care if pain worsens',
      'Watch for shortness of breath',
      'Note any radiating pain',
      'Do not ignore persistent symptoms'
    ]
  };
}

function generateRespiratoryAnalysis(symptoms: Symptom[], avgSeverity: number, profile?: UserProfile): PreliminaryAnalysis {
  const hasChronic = profile?.chronic_conditions?.some(c =>
    c.toLowerCase().includes('asthma') || c.toLowerCase().includes('copd')
  );

  if (avgSeverity >= 7 || hasChronic) {
    return {
      risk_level: 'high',
      urgency: 'urgent',
      preliminary_diagnosis: 'Severe Respiratory Infection',
      recommended_specialist: 'Pulmonologist / Internal Medicine',
      analysis_summary: `Your respiratory symptoms are severe${hasChronic ? ' and complicated by your chronic condition' : ''}. Medical evaluation within 24 hours is strongly recommended to prevent complications such as pneumonia.`,
      key_findings: [
        'Significant respiratory symptoms present',
        hasChronic ? 'Pre-existing lung condition increases risk' : 'High severity respiratory symptoms',
        'Risk of lower respiratory tract infection',
        'May require prescription medication'
      ],
      warning_signs: [
        'Seek immediate care if breathing becomes difficult',
        'Watch for high fever (>103°F)',
        'Monitor for chest pain',
        'Note any changes in consciousness'
      ]
    };
  }

  return {
    risk_level: avgSeverity >= 5 ? 'medium' : 'low',
    urgency: avgSeverity >= 5 ? 'urgent' : 'routine',
    preliminary_diagnosis: 'Upper Respiratory Tract Infection',
    recommended_specialist: 'General Practitioner / Family Medicine',
    analysis_summary: `Likely upper respiratory infection (common cold or flu). Most cases resolve with supportive care. ${avgSeverity >= 5 ? 'Consider medical consultation if symptoms persist beyond 5 days.' : 'Home care should be sufficient for most symptoms.'}`,
    key_findings: [
      'Common respiratory infection symptoms',
      'Usually self-limiting condition',
      'Supportive care recommended',
      'Monitor for complications'
    ],
    warning_signs: [
      'Seek care if symptoms worsen after 5 days',
      'Watch for difficulty breathing',
      'Monitor fever closely',
      'Stay hydrated and rest'
    ]
  };
}

function generateNeurologicalAnalysis(symptoms: Symptom[], avgSeverity: number, profile?: UserProfile): PreliminaryAnalysis {
  if (avgSeverity >= 8) {
    return {
      risk_level: 'high',
      urgency: 'urgent',
      preliminary_diagnosis: 'Severe Headache / Neurological Concern',
      recommended_specialist: 'Neurologist',
      analysis_summary: `Severe headache symptoms require medical evaluation to rule out serious neurological conditions such as migraine, meningitis, or intracranial issues. Medical consultation within 24 hours recommended.`,
      key_findings: [
        'High severity headache symptoms',
        'Neurological evaluation needed',
        'Possible migraine or secondary headache',
        'Diagnostic imaging may be required'
      ],
      warning_signs: [
        'Seek emergency care for sudden severe headache',
        'Watch for vision changes',
        'Note any confusion or weakness',
        'Monitor for neck stiffness'
      ]
    };
  }

  return {
    risk_level: 'medium',
    urgency: 'routine',
    preliminary_diagnosis: 'Tension Headache / Primary Headache Disorder',
    recommended_specialist: 'General Practitioner / Neurologist',
    analysis_summary: `Likely tension-type headache or primary headache disorder. Can usually be managed with over-the-counter medications and lifestyle modifications. If frequent or severe, consult a healthcare provider.`,
    key_findings: [
      'Common headache presentation',
      'Often stress or tension-related',
      'Usually responds to OTC pain relievers',
      'Lifestyle factors may contribute'
    ],
    warning_signs: [
      'Seek care if headaches become frequent',
      'Watch for pattern changes',
      'Note any associated symptoms',
      'Keep headache diary for tracking'
    ]
  };
}

function generateGastrointestinalAnalysis(symptoms: Symptom[], avgSeverity: number, profile?: UserProfile): PreliminaryAnalysis {
  if (avgSeverity >= 7) {
    return {
      risk_level: 'high',
      urgency: 'urgent',
      preliminary_diagnosis: 'Severe Gastroenteritis / Acute Abdomen',
      recommended_specialist: 'Gastroenterologist / General Surgery',
      analysis_summary: `Severe gastrointestinal symptoms require medical evaluation to rule out serious conditions requiring intervention. Risk of dehydration is significant. Seek medical care within 24 hours.`,
      key_findings: [
        'Severe GI symptoms present',
        'Risk of dehydration',
        'May require IV fluids',
        'Possible need for diagnostic tests'
      ],
      warning_signs: [
        'Seek emergency care for severe abdominal pain',
        'Watch for signs of dehydration',
        'Note any blood in vomit or stool',
        'Monitor for fever and weakness'
      ]
    };
  }

  return {
    risk_level: avgSeverity >= 4 ? 'medium' : 'low',
    urgency: 'routine',
    preliminary_diagnosis: 'Acute Gastroenteritis',
    recommended_specialist: 'General Practitioner',
    analysis_summary: `Likely viral or bacterial gastroenteritis. Most cases resolve within 2-3 days with supportive care. Focus on hydration and rest. Consult healthcare provider if symptoms persist beyond 3 days.`,
    key_findings: [
      'Common GI infection symptoms',
      'Usually self-limiting',
      'Hydration is key priority',
      'Bland diet recommended'
    ],
    warning_signs: [
      'Seek care if unable to keep fluids down',
      'Watch for signs of dehydration',
      'Monitor for blood in stool',
      'Note persistent high fever'
    ]
  };
}

function generateMusculoskeletalAnalysis(symptoms: Symptom[], avgSeverity: number, profile?: UserProfile): PreliminaryAnalysis {
  return {
    risk_level: avgSeverity >= 6 ? 'medium' : 'low',
    urgency: 'routine',
    preliminary_diagnosis: 'Musculoskeletal Pain / Myalgia',
    recommended_specialist: 'Orthopedist / Physical Medicine',
    analysis_summary: `Musculoskeletal pain is common and often related to overuse, strain, or viral illness. Rest, ice/heat therapy, and OTC pain relievers usually help. If severe or persistent, consult healthcare provider.`,
    key_findings: [
      'Musculoskeletal symptoms present',
      'Often related to strain or overuse',
      'Usually responds to conservative treatment',
      'Physical therapy may be beneficial'
    ],
    warning_signs: [
      'Seek care for severe joint swelling',
      'Watch for loss of function',
      'Note any trauma history',
      'Monitor for fever with joint pain'
    ]
  };
}

function generateGeneralAnalysis(symptoms: Symptom[], avgSeverity: number, profile?: UserProfile): PreliminaryAnalysis {
  return {
    risk_level: avgSeverity >= 6 ? 'medium' : 'low',
    urgency: avgSeverity >= 6 ? 'urgent' : 'routine',
    preliminary_diagnosis: 'General Malaise / Non-Specific Symptoms',
    recommended_specialist: 'General Practitioner / Family Medicine',
    analysis_summary: `Multiple non-specific symptoms present. ${avgSeverity >= 6 ? 'Medical evaluation recommended to identify underlying cause.' : 'Often related to viral illness or stress. Monitor symptoms and seek care if they worsen or persist.'}`,
    key_findings: [
      'Multiple symptoms present',
      'Comprehensive evaluation may be needed',
      'Could indicate various conditions',
      'Symptom tracking recommended'
    ],
    warning_signs: [
      'Seek care if symptoms persist beyond 7 days',
      'Watch for worsening conditions',
      'Note any new symptoms',
      'Monitor overall wellness'
    ]
  };
}
