import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from './user_context';

// Bumabalot sa mga pages na kailangan ng aktibong session (learning-modules,
// chapters, pvp-quiz, etc). Kung walang `user`, itulak papunta sa
// student-login — `replace` para hindi na siya idagdag sa history bilang
// bagong entry (kung hindi, magkakaroon din ito ng sarili niyang
// "bounce-back" problem sa Back button).
export default function ProtectedRoute({ children, redirectTo = '/student-login' }) {
  const { user } = useUser();
  const location = useLocation();

  if (!user?.uid) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return children;
}