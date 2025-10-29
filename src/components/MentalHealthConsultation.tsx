import { useState, useEffect } from 'react';
import { Brain, Calendar, MessageSquare, CheckCircle } from 'lucide-react';
import { supabase, MentalHealthConsultation as ConsultationType } from '../lib/supabase';

export default function MentalHealthConsultation() {
  const [consultationType, setConsultationType] = useState<'anxiety' | 'depression' | 'stress' | 'general'>('general');
  const [description, setDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [consultations, setConsultations] = useState<ConsultationType[]>([]);
  const [showForm, setShowForm] = useState(true);

  const consultationTypes = [
    { value: 'anxiety', label: 'Anxiety Support', description: 'Help with worry, panic, or nervousness' },
    { value: 'depression', label: 'Depression Support', description: 'Support for low mood or lack of motivation' },
    { value: 'stress', label: 'Stress Management', description: 'Coping with overwhelming stress' },
    { value: 'general', label: 'General Consultation', description: 'General mental wellness discussion' }
  ];

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('mental_health_consultations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setConsultations(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please sign in to book a consultation');
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('mental_health_consultations')
      .insert({
        user_id: user.id,
        consultation_type: consultationType,
        description,
        preferred_date: preferredDate,
        status: 'pending'
      });

    setLoading(false);

    if (error) {
      alert('Failed to book consultation. Please try again.');
    } else {
      setSuccess(true);
      setDescription('');
      setPreferredDate('');
      fetchConsultations();
      setTimeout(() => {
        setSuccess(false);
        setShowForm(false);
      }, 2000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-8 h-8 text-teal-600" />
        <h2 className="text-2xl font-bold text-gray-800">Mental Health Consultation</h2>
      </div>

      <div className="bg-teal-50 border-l-4 border-teal-500 rounded-lg p-4 mb-6">
        <p className="text-teal-800 text-sm">
          Our licensed therapists are here to support you. Book a confidential consultation to discuss your mental health concerns in a safe, judgment-free environment.
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
        >
          {showForm ? 'View My Consultations' : 'Book New Consultation'}
        </button>
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Consultation Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {consultationTypes.map((type) => (
                <label
                  key={type.value}
                  className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    consultationType === type.value
                      ? 'border-teal-600 bg-teal-50'
                      : 'border-gray-200 hover:border-teal-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="consultationType"
                    value={type.value}
                    checked={consultationType === type.value}
                    onChange={(e) => setConsultationType(e.target.value as any)}
                    className="sr-only"
                  />
                  <span className="font-semibold text-gray-800">{type.label}</span>
                  <span className="text-sm text-gray-600 mt-1">{type.description}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe Your Concerns
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              placeholder="Share what you'd like to discuss in this consultation..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Preferred Date & Time
            </label>
            <input
              type="datetime-local"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              required
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <p className="text-green-800 font-medium">
                Consultation request submitted successfully! We'll contact you soon.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-400 transition-colors font-medium"
          >
            {loading ? 'Booking...' : 'Book Consultation'}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Consultations</h3>
          {consultations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No consultations booked yet</p>
            </div>
          ) : (
            consultations.map((consultation) => (
              <div key={consultation.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-800 capitalize">
                      {consultation.consultation_type.replace('_', ' ')} Consultation
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(consultation.preferred_date).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(consultation.status)}`}>
                    {consultation.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-700 text-sm">{consultation.description}</p>
                {consultation.therapist_notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600 font-medium">Therapist Notes:</p>
                    <p className="text-sm text-gray-700 mt-1">{consultation.therapist_notes}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Crisis Support:</strong> If you're experiencing a mental health emergency, please call the National Suicide Prevention Lifeline at 988 or go to your nearest emergency room.
        </p>
      </div>
    </div>
  );
}
