import './login.css';
import { PiStudentThin } from "react-icons/pi";
import { GiTeacher } from "react-icons/gi";
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '../user_context';

function Login() {
  const navigate = useNavigate();
  const { user } = useUser();

  // Kung may existing valid session na (na-restore mula sa localStorage
  // o Firebase), huwag na ipakita 'tong role-selection page — diretso na
  // sa dating kinaroroonan (lastPath) o sa default modules page. Ito ang
  // nag-aayos kapag na-close mo lang yung tab/browser habang naka-login
  // ka, tapos binalikan mo ulit yung itfun sa root URL.
  if (user) {
    const lastPath = localStorage.getItem('itfun_lastPath');
    const fallback = user.role === 'faculty' ? '/faculty-modules' : '/learning-modules';
    return <Navigate to={lastPath || fallback} replace />;
  }

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
          <button className="btn1" onClick={() => navigate('/student-login')}>
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