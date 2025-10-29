import { useNavigate } from 'react-router-dom';
import UserProfile from '../components/UserProfile';

export default function ProfilePage() {
  const navigate = useNavigate();

  const handleProfileComplete = () => {
    navigate('/home');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <UserProfile onProfileComplete={handleProfileComplete} />
    </div>
  );
}
