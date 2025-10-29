import { Link } from 'react-router-dom';
import MentalHealthConsultation from '../components/MentalHealthConsultation';

export default function MentalHealthPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Link
        to="/home"
        className="inline-block mb-6 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
      >
        ← Back to Home
      </Link>
      <MentalHealthConsultation />
    </div>
  );
}
