// components/RedirectIfAuthed.jsx
import { Navigate } from 'react-router-dom';
import { useUser } from '../user_context';

const STUDENT_HOME_PATH = '/learning-modules';
const FACULTY_HOME_PATH = '/faculty-modules';

/**
 * Bumabalot sa Login / StudentLogin / FacultyLogin pages.
 *
 * Ito yung direktang fix sa "nag-signin na, umalis, bumalik, lumitaw ulit
 * login": kapag naka-login na pala si user (may valid session pa rin sa
 * Firebase — hindi ito nawawala kahit i-close ang buong browser), dapat
 * hindi na ipakita ang login form — dapos diretso na sa dashboard niya.
 *
 * DAGDAG NA CHECK: kung may naka-store na ongoing PVP session
 * (itfun_roomPin sa localStorage) mula bago pa man mag-brownout/close ang
 * browser, huwag munang ipadala sa dashboard — ibalik muna sa waiting
 * lobby (host o join, base sa itfun_isHost). Ang mismong lobby component
 * na ang bahalang mag-forward papuntang /quiz-arena kung nag-start na
 * pala ang quiz habang wala yung user — reuse lang natin yung existing
 * rejoin-room logic nila, walang duplicate dito.
 *
 * Usage:
 *   <Route path="/" element={<RedirectIfAuthed><Login /></RedirectIfAuthed>} />
 *   <Route path="/student-login" element={<RedirectIfAuthed><StudentLogin /></RedirectIfAuthed>} />
 *   <Route path="/faculty-login" element={<RedirectIfAuthed><FacultyLogin /></RedirectIfAuthed>} />
 */
export default function RedirectIfAuthed({ children }) {
  const { user, loading } = useUser();

  // Habang di pa confirmed, huwag munang mag-decide — pero huwag ding
  // ipakita agad ang login form (para walang flash ng login bago mag-redirect).
  if (loading) return null;

  if (user) {
    const savedPin = localStorage.getItem('itfun_roomPin');
    const savedIsHost = localStorage.getItem('itfun_isHost');

    if (savedPin) {
      const lobbyPath =
        savedIsHost === 'true'
          ? '/waiting-lobby'
          : `/waiting-lobby-join?pin=${savedPin}`;
      return <Navigate to={lobbyPath} replace />;
    }

    const home = user.role === 'faculty' ? FACULTY_HOME_PATH : STUDENT_HOME_PATH;
    return <Navigate to={home} replace />;
  }

  return children;
}