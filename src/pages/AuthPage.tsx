import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import AuthForm from '../components/AuthForm';

export default function AuthPage() {
  const navigate = useNavigate();

  const handleAuthSuccess = () => {
    navigate('/profile');
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Heart className="w-16 h-16 text-red-500" />
          <h1 className="text-5xl font-bold text-gray-900"> Healio-The AI Health Assistant</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Your personal healthcare companion with AI-powered symptom analysis, treatment recommendations, and appointment booking
        </p>
      </div>
      <AuthForm onAuthSuccess={handleAuthSuccess} />
    </div>
  );
}
