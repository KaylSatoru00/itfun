// components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../user_context';
import { useBfcacheGuard } from '../hooks/useBfcacheGuard';

const STUDENT_LOGIN_PATH = '/student-login';
const FACULTY_LOGIN_PATH = '/faculty-login';
const STUDENT_HOME_PATH = '/learning-modules';
const FACULTY_HOME_PATH = '/faculty-modules';

/**
 * Bumabalot sa mga protected pages.
 *
 * Usage:
 *   <Route path="/learning-modules" element={
 *     <ProtectedRoute role="student"><LearningModules /></ProtectedRoute>
 *   } />
 *
 * `role` = "student" | "faculty". Pwedeng omitin kung basta "kailangan lang
 * naka-login, kahit anong role" ang gusto mong i-check.
 */
export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useUser();
  const location = useLocation();

  // Extra layer: kung nag-back/forward papunta sa pahinang ito galing sa
  // bfcache (browser back-forward cache) pagkatapos mag-logout, i-verify
  // laban sa totoong Firebase auth state sa halip na basta magtiwala sa
  // cached na UI.
  useBfcacheGuard();

  // Habang hindi pa tapos ang unang auth check, huwag munang mag-redirect —
  // ito yung dahilan kung bakit "nabalik sa login" kahit naka-login pa
  // naman: kapag walang loading gate, ang `user === null` habang naglo-load
  // pa lang ay nagre-redirect na agad papuntang login page.
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <div className="loading-spinner" aria-label="Loading" />
      </div>
    );
  }

  if (!user) {
    const loginPath = role === 'faculty' ? FACULTY_LOGIN_PATH : STUDENT_LOGIN_PATH;
    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }

  if (role && user.role !== role) {
    // Naka-login siya, pero mali ang role (e.g. student na sumusubok pumasok
    // sa faculty route) — ibalik sa sarili niyang dashboard, hindi sa login.
    const wrongRoleHome = user.role === 'faculty' ? FACULTY_HOME_PATH : STUDENT_HOME_PATH;
    return <Navigate to={wrongRoleHome} replace />;
  }

  return children;
}