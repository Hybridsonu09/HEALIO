import { useState, useEffect } from 'react';
import { Calendar, MapPin, Building2, Navigation, CheckCircle } from 'lucide-react';
import { supabase, Hospital } from '../lib/supabase';

interface AppointmentBookingProps {
  assessmentId?: string;
  onBookingComplete: () => void;
}

export default function AppointmentBooking({ assessmentId, onBookingComplete }: AppointmentBookingProps) {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [notes, setNotes] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    loadHospitals();
    getUserLocation();
  }, []);

  const loadHospitals = async () => {
    const { data } = await supabase
      .from('hospitals')
      .select('*')
      .order('name');

    if (data) {
      setHospitals(data);
    }
  };

  const getUserLocation = () => {
    setGettingLocation(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
          setGettingLocation(false);
        },
        () => {
          setGettingLocation(false);
        }
      );
    } else {
      setGettingLocation(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const sortedHospitals = userLocation
    ? [...hospitals].sort((a, b) => {
        const distA = calculateDistance(userLocation.lat, userLocation.lon, a.latitude, a.longitude);
        const distB = calculateDistance(userLocation.lat, userLocation.lon, b.latitude, b.longitude);
        return distA - distB;
      })
    : hospitals;

  const handleBookAppointment = async () => {
    if (!selectedHospital || !appointmentDate) {
      alert('Please select a hospital and appointment date');
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please sign in to book an appointment');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('appointments').insert({
      user_id: user.id,
      hospital_id: selectedHospital.id,
      assessment_id: assessmentId || null,
      appointment_date: appointmentDate,
      status: 'pending',
      notes: notes
    });

    setLoading(false);

    if (error) {
      alert('Failed to book appointment. Please try again.');
    } else {
      setSuccess(true);
      setTimeout(() => {
        onBookingComplete();
      }, 2000);
    }
  };

  const getDistance = (hospital: Hospital): number | null => {
    if (!userLocation) return null;
    return calculateDistance(userLocation.lat, userLocation.lon, hospital.latitude, hospital.longitude);
  };

  const minDateTime = new Date();
  minDateTime.setHours(minDateTime.getHours() + 1);
  const minDateTimeString = minDateTime.toISOString().slice(0, 16);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Book Hospital Appointment</h2>
      </div>

      {gettingLocation && (
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-6">
          <p className="text-blue-800 text-sm flex items-center gap-2">
            <Navigation className="w-4 h-4 animate-spin" />
            Getting your location to find nearest hospitals...
          </p>
        </div>
      )}

      {userLocation && (
        <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 mb-6">
          <p className="text-green-800 text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Location detected - Hospitals sorted by distance
          </p>
        </div>
      )}

      {success ? (
        <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-800 mb-2">Appointment Booked Successfully!</h3>
          <p className="text-green-700 mb-4">
            Your appointment has been scheduled at {selectedHospital?.name}
          </p>
          <p className="text-sm text-green-600">
            You will receive a confirmation call from the hospital shortly.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Hospital {userLocation && '(sorted by distance)'}
            </label>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sortedHospitals.map((hospital) => {
                const distance = getDistance(hospital);
                return (
                  <label
                    key={hospital.id}
                    className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedHospital?.id === hospital.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="hospital"
                      checked={selectedHospital?.id === hospital.id}
                      onChange={() => setSelectedHospital(hospital)}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-gray-600" />
                        <span className="font-semibold text-gray-800">{hospital.name}</span>
                      </div>
                      {hospital.emergency_available && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                          24/7 Emergency
                        </span>
                      )}
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{hospital.address}</span>
                    </div>
                    {hospital.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {hospital.specialties.slice(0, 3).map((specialty, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    )}
                    {distance !== null && (
                      <div className="text-sm font-medium text-green-700">
                        {distance.toFixed(1)} km away
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Appointment Date & Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              min={minDateTimeString}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Note: This is a booking request. The hospital will confirm your actual appointment time.
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional information you'd like to share with the hospital..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <button
            onClick={handleBookAppointment}
            disabled={loading || !selectedHospital || !appointmentDate}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Booking Appointment...' : 'Confirm Appointment Booking'}
          </button>

          <div className="mt-4 bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Important:</strong> After booking, the hospital will contact you to confirm your appointment.
              Please ensure your contact information is up to date in your profile.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
