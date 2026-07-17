import './login.css';
import { useEffect } from 'react';
import { PiStudentBold } from "react-icons/pi";
import { GiTeacher } from "react-icons/gi";
import { HiArrowRight } from "react-icons/hi";
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '../user_context';
import AuthShell from './auth_shell.jsx';

const sideVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 24 } },
};

function RoleCard({ icon, name, desc, onClick }) {
  return (
    <motion.button
      className="rp-role-card"
      variants={itemVariants}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
    >
      <span className="rp-role-icon">{icon}</span>
      <span>
        <p className="rp-role-name">{name}</p>
        <p className="rp-role-desc">{desc}</p>
      </span>
      <HiArrowRight size={22} className="rp-role-arrow" />
    </motion.button>
  );
}

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
    <AuthShell>
      <motion.div
        className="d-flex flex-column align-items-center gap-3 w-100"
        variants={sideVariants}
        initial="hidden"
        animate="show"
      >
        <motion.h2 className="rp-side-title" variants={itemVariants}>
          Welcome!
        </motion.h2>
        <motion.p className="rp-side-sub" variants={itemVariants}>
          Choose your role to sign in or sign up
        </motion.p>

        <div className="rp-cards">
          <RoleCard
            icon={<PiStudentBold size={34} />}
            name="Student"
            desc="Learn, play, and battle in the quiz arena"
            onClick={handleStudentClick}
          />
          <RoleCard
            icon={<GiTeacher size={34} />}
            name="Faculty"
            desc="Manage classes and track student progress"
            onClick={() => navigate('/faculty-login')}
          />
        </div>
      </motion.div>
    </AuthShell>
  );
}

export default Login;
