import './login.css';
import { PiStudentThin } from "react-icons/pi";
import { GiTeacher } from "react-icons/gi";
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

function Login() {
  const navigate = useNavigate();

  return (
    <motion.div
      className="panel"
      initial={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3, ease: 'easeIn' }}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        translateX: '-50%',
        translateY: '-50%',
      }}
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
  );
}

export default Login;
