import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './pvp_quiz.css';

function PvpQuiz() {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = '#ffffff';
    return () => {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  return (
    <motion.div
      className="pvp-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >

      {/* Header */}
      <div className="pvp-header">
        <div className="pvp-header-icon">⚔️</div>
        <h2 className="pvp-header-title">QUIZ ARENA</h2>
        <p className="pvp-header-subtitle">Challenge your classmates in real-time quiz battles!</p>
      </div>

      {/* Cards */}
      <div className="pvp-cards">

        <div className="pvp-card" onClick={() => navigate('/select-module')}>
          <div className="pvp-icon-box light">
            <span className="pvp-icon">⚔️</span>
          </div>
          <div className="pvp-card-text">
            <h3 className="pvp-card-title">Create Room</h3>
            <p className="pvp-card-subtitle">Host a quiz battle and invite players</p>
          </div>
        </div>

        <div className="pvp-card">
          <div className="pvp-icon-box dark">
            <span className="pvp-icon">👥</span>
          </div>
          <div className="pvp-card-text">
            <h3 className="pvp-card-title">Join Room</h3>
            <p className="pvp-card-subtitle">Enter an access code to join others</p>
          </div>
        </div>

      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <div className="bottom-nav-btn" onClick={() => navigate('/learning-modules')}>
          <span className="bottom-nav-icon">📚</span>
          <span className="bottom-nav-label">LEARNING MODULES</span>
        </div>
        <div className="bottom-nav-btn active" onClick={() => navigate('/pvp-quiz')}>
          <span className="bottom-nav-icon">⚔️</span>
          <span className="bottom-nav-label">PVP QUIZ ARENA</span>
        </div>
      </div>

    </motion.div>
  );
}

export default PvpQuiz;