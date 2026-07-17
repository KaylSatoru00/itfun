import './login.css';
import { useEffect } from 'react';
import { PiStudentBold } from "react-icons/pi";
import { GiTeacher } from "react-icons/gi";
import { HiArrowRight } from "react-icons/hi";
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '../user_context';

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
    <motion.div
      className="rp-wrapper"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeIn' }}
    >
      {/* ── Brand panel ── */}
      <div className="rp-brand">
        <div className="rp-blob rp-blob-1" />
        <div className="rp-blob rp-blob-2" />
        <div className="rp-blob rp-blob-3" />

        <motion.div
          className="rp-brand-content"
          initial={{ opacity: 0, x: -32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h1 className="rp-wordmark">
            IT<span className="rp-accent">Fun</span>
          </h1>
          <p className="rp-tagline">IT Fundamentals Made Fun</p>
          <div className="rp-chips">
            <span className="rp-chip">9 Learning Modules</span>
            <span className="rp-chip">PVP Quiz Arena</span>
            <span className="rp-chip">Gamified Quizzes</span>
          </div>
        </motion.div>
      </div>

      {/* ── Role selection ── */}
      <motion.div
        className="rp-side"
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
    </motion.div>
  );
}

export default Login;
