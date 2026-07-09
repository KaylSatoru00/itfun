import './login.css';
import { useEffect } from 'react';
import { PiStudentThin } from "react-icons/pi";
import { GiTeacher } from "react-icons/gi";
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '../user_context';

function Login() {
  const navigate = useNavigate();
  const { user, logout } = useUser();

  // Bug fix: kapag Back lang ang ginamit papunta dito (walang click sa
  // Student/Faculty button), hindi natin na-clear yung session dati —
  // nakatago lang sa context, buhay pa rin. Kaya kapag dumating dito ang
  // user habang may existing session, i-clear na agad (role-aware na ang
  // logout() sa user_context.jsx) para hindi na maka-Forward pabalik sa
  // protected page nang naka-login pa rin.
  useEffect(() => {
    if (user) {
      logout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Kapag pinindot ang "Student" mula sa root page (hal. pagkatapos mag-Back
  // galing sa /learning-modules), gusto nating i-force ang re-login — kahit
  // may existing session pa sa memory/localStorage. Kaya i-clear muna natin
  // ang buong session (Firebase Auth + localStorage + sessionStorage + RTDB
  // offline write) BAGO mag-navigate — para pagdating sa /student-login,
  // wala nang session na ma-detect ang RedirectIfAuthed, kaya lalabas talaga
  // ang login form sa halip na mag-auto-redirect.
  const handleStudentClick = async () => {
    await logout();
    navigate('/student-login');
  };

  return (
    <div className="login-wrapper">
      <motion.div
        className="panel"
        initial={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3, ease: 'easeIn' }}
      >
        <h1 className="title">ITFun</h1>
        <p className="subtitle">IT Fundamentals Made Fun</p>

        <div className="buttons">
          <button className="btn1" onClick={handleStudentClick}>
            <PiStudentThin size={60} />
            Student
          </button>
          <button className="btn2" onClick={() => navigate('/faculty-login')}>
            <GiTeacher size={60} />
            Faculty
          </button>
        </div>

        <p className="role-text">Choose your role to sign in or sign up</p>
      </motion.div>
    </div>
  );
}

export default Login;