import { useState, useEffect } from 'react';
import { User, Save, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserProfileData {
  full_name: string;
  date_of_birth: string;
  gender: string;
  blood_group: string;
  height_cm: string;
  weight_kg: string;
  allergies: string[];
  chronic_conditions: string[];
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

interface UserProfileProps {
  onProfileComplete: () => void;
}

export default function UserProfile({ onProfileComplete }: UserProfileProps) {
  const [profileData, setProfileData] = useState<UserProfileData>({
    full_name: '',
    date_of_birth: '',
    gender: '',
    blood_group: '',
    height_cm: '',
    weight_kg: '',
    allergies: [],
    chronic_conditions: [],
    emergency_contact_name: '',
    emergency_contact_phone: ''
  });
  const [allergyInput, setAllergyInput] = useState('');
  const [conditionInput, setConditionInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setHasProfile(true);
      setProfileData({
        full_name: data.full_name || '',
        date_of_birth: data.date_of_birth || '',
        gender: data.gender || '',
        blood_group: data.blood_group || '',
        height_cm: data.height_cm?.toString() || '',
        weight_kg: data.weight_kg?.toString() || '',
        allergies: data.allergies || [],
        chronic_conditions: data.chronic_conditions || [],
        emergency_contact_name: data.emergency_contact_name || '',
        emergency_contact_phone: data.emergency_contact_phone || ''
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please sign in first');
      setLoading(false);
      return;
    }

    const profilePayload = {
      user_id: user.id,
      full_name: profileData.full_name,
      date_of_birth: profileData.date_of_birth || null,
      gender: profileData.gender,
      blood_group: profileData.blood_group,
      height_cm: profileData.height_cm ? parseFloat(profileData.height_cm) : null,
      weight_kg: profileData.weight_kg ? parseFloat(profileData.weight_kg) : null,
      allergies: profileData.allergies,
      chronic_conditions: profileData.chronic_conditions,
      emergency_contact_name: profileData.emergency_contact_name,
      emergency_contact_phone: profileData.emergency_contact_phone,
      updated_at: new Date().toISOString()
    };

    const { error } = hasProfile
      ? await supabase.from('user_profiles').update(profilePayload).eq('user_id', user.id)
      : await supabase.from('user_profiles').insert(profilePayload);

    setLoading(false);

    if (error) {
      alert('Failed to save profile. Please try again.');
    } else {
      alert('Profile saved successfully!');
      onProfileComplete();
    }
  };

  const addAllergy = () => {
    if (allergyInput.trim() && !profileData.allergies.includes(allergyInput.trim())) {
      setProfileData({
        ...profileData,
        allergies: [...profileData.allergies, allergyInput.trim()]
      });
      setAllergyInput('');
    }
  };

  const removeAllergy = (index: number) => {
    setProfileData({
      ...profileData,
      allergies: profileData.allergies.filter((_, i) => i !== index)
    });
  };

  const addCondition = () => {
    if (conditionInput.trim() && !profileData.chronic_conditions.includes(conditionInput.trim())) {
      setProfileData({
        ...profileData,
        chronic_conditions: [...profileData.chronic_conditions, conditionInput.trim()]
      });
      setConditionInput('');
    }
  };

  const removeCondition = (index: number) => {
    setProfileData({
      ...profileData,
      chronic_conditions: profileData.chronic_conditions.filter((_, i) => i !== index)
    });
  };

  const calculateBMI = () => {
    const height = parseFloat(profileData.height_cm);
    const weight = parseFloat(profileData.weight_kg);
    if (height && weight) {
      const bmi = weight / Math.pow(height / 100, 2);
      return bmi.toFixed(1);
    }
    return null;
  };

  const bmi = calculateBMI();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <User className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">
          {hasProfile ? 'Update Your Profile' : 'Create Your Health Profile'}
        </h2>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-6">
        <p className="text-blue-800 text-sm">
          Please provide accurate information. This will help us give you better health recommendations and connect you with appropriate medical care.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={profileData.full_name}
              onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              value={profileData.date_of_birth}
              onChange={(e) => setProfileData({ ...profileData, date_of_birth: e.target.value })}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender
            </label>
            <select
              value={profileData.gender}
              onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Blood Group
            </label>
            <select
              value={profileData.blood_group}
              onChange={(e) => setProfileData({ ...profileData, blood_group: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Blood Group</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height (cm)
            </label>
            <input
              type="number"
              step="0.1"
              value={profileData.height_cm}
              onChange={(e) => setProfileData({ ...profileData, height_cm: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={profileData.weight_kg}
              onChange={(e) => setProfileData({ ...profileData, weight_kg: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {bmi && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              <strong>BMI:</strong> {bmi} - {
                parseFloat(bmi) < 18.5 ? 'Underweight' :
                parseFloat(bmi) < 25 ? 'Normal' :
                parseFloat(bmi) < 30 ? 'Overweight' : 'Obese'
              }
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Allergies
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={allergyInput}
              onChange={(e) => setAllergyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
              placeholder="e.g., Penicillin, Peanuts"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={addAllergy}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {profileData.allergies.map((allergy, index) => (
              <span key={index} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm flex items-center gap-2">
                {allergy}
                <button type="button" onClick={() => removeAllergy(index)} className="hover:text-red-900">×</button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chronic Conditions
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={conditionInput}
              onChange={(e) => setConditionInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCondition())}
              placeholder="e.g., Diabetes, Hypertension"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={addCondition}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {profileData.chronic_conditions.map((condition, index) => (
              <span key={index} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm flex items-center gap-2">
                {condition}
                <button type="button" onClick={() => removeCondition(index)} className="hover:text-orange-900">×</button>
              </span>
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Emergency Contact
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Name
              </label>
              <input
                type="text"
                value={profileData.emergency_contact_name}
                onChange={(e) => setProfileData({ ...profileData, emergency_contact_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                value={profileData.emergency_contact_phone}
                onChange={(e) => setProfileData({ ...profileData, emergency_contact_phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Saving...' : hasProfile ? 'Update Profile' : 'Create Profile'}
        </button>
      </form>
    </div>
  );
}
