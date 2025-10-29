import { Link } from 'react-router-dom';
import { Heart, Stethoscope, User, FileText } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Heart className="w-12 h-12 text-red-500" />
          <h1 className="text-5xl font-bold text-gray-900">Welcome Back!</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          How can we help you today?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link
          to="/profile"
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:-translate-y-1"
        >
          <User className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800 mb-2">My Profile</h3>
          <p className="text-sm text-gray-600">
            Update your health information
          </p>
        </Link>

        <Link
          to="/documents"
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:-translate-y-1"
        >
          <FileText className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800 mb-2">Health Documents</h3>
          <p className="text-sm text-gray-600">
            Manage your medical records
          </p>
        </Link>

        <Link
          to="/assessment"
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:-translate-y-1"
        >
          <Stethoscope className="w-12 h-12 text-red-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800 mb-2">Health Assessment</h3>
          <p className="text-sm text-gray-600">
            Get AI-powered analysis
          </p>
        </Link>

        <Link
          to="/mental-health"
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:-translate-y-1"
        >
          <Heart className="w-12 h-12 text-teal-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800 mb-2">Mental Health</h3>
          <p className="text-sm text-gray-600">
            Book therapy consultation
          </p>
        </Link>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-6 border-2 border-blue-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Important Notice</h3>
        <p className="text-gray-700 text-sm">
          This AI Health Assistant provides general health information and preliminary analysis. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers for proper evaluation and care. In case of emergency, call 108 immediately.
        </p>
      </div>
    </div>
  );
}
