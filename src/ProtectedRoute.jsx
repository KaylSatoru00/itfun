import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from './user_context';

// Bumabalot sa mga pages na kailangan ng aktibong session (learning-modules,
// chapters, pvp-quiz, etc). Kung walang `user`, itulak papunta sa
// student-login — `replace` para hindi na siya idagdag sa history bilang
// bagong entry (kung hindi, magkakaroon din ito ng sarili niyang
// "bounce-back" problem sa Back button).
export default function ProtectedRoute({ children, redirectTo = '/student-login' }) {
  const { user, authLoading } = useUser();
  const location = useLocation();

  // Habang hindi pa kumpleto ang unang restore-gate pass (authReady →
  // onAuthStateChanged → getDocFromServer → session-match check), HUWAG
  // munang magpasya. Sa puntong ito, ang `user` ay pwedeng `null` pa rin
  // kahit legit at aktibo pala ang session (naghihintay lang ng Firestore
  // round-trip) — kung tuturingan nating "walang session" ito agad, doon
  // mismo nangyayari 'yung login-page flash bago ma-correct pabalik. Sa
  // halip, hintayin muna nating matapos ang `authLoading` (kahit isang
  // frame man lang), para sigurado tayong FINAL na ang basehan ng
  // desisyon, hindi lang optimistic/in-flight na estado.
  if (authLoading) {
    return null;
  }

  if (!user?.uid) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return children;
}