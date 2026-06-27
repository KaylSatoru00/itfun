import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '../user_context';
import './pvp_quiz.css';

function PvpQuiz() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [joinPin, setJoinPin] = useState('');
  const [joinError, setJoinError] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = '#ffffff';
    return () => {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  const handleCreateRoom = () => {
    navigate('/select-module');
  };

  const handleJoinRoom = () => {
    if (joinPin.length !== 6) {
      setJoinError('Please enter a valid 6-digit PIN');
      return;
    }
    navigate(`/waiting-lobby-join?pin=${joinPin}`);
  };

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
        <div className="pvp-card" onClick={handleCreateRoom}>
          <div className="pvp-icon-box light">
            <span className="pvp-icon">🏠</span>
          </div>
          <div className="pvp-card-text">
            <h3 className="pvp-card-title">Create Room</h3>
            <p className="pvp-card-subtitle">Host a quiz battle and invite players</p>
          </div>
        </div>

        <div className="pvp-card" onClick={() => setShowJoinModal(true)}>
          <div className="pvp-icon-box dark">
            <span className="pvp-icon">👥</span>
          </div>
          <div className="pvp-card-text">
            <h3 className="pvp-card-title">Join Room</h3>
            <p className="pvp-card-subtitle">Enter a PIN to join others</p>
          </div>
        </div>
      </div>

      {/* Join Modal */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Join Room</h3>
              <button className="modal-close" onClick={() => setShowJoinModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ flexDirection: 'column', gap: '16px' }}>
              <div style={{ width: '100%' }}>
                <label className="modal-label">Room PIN</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="Enter 6-digit PIN"
                  value={joinPin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setJoinPin(val);
                    setJoinError('');
                  }}
                  style={{ width: '100%', textAlign: 'center', fontSize: '20px', letterSpacing: '4px' }}
                  maxLength={6}
                  autoFocus
                />
                {joinError && (
                  <p style={{ color: '#c8102e', fontSize: '12px', marginTop: '4px' }}>{joinError}</p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="modal-join-btn"
                onClick={handleJoinRoom}
                disabled={joinPin.length !== 6}
              >
                Join
              </button>
              <button className="modal-cancel-btn" onClick={() => setShowJoinModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

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