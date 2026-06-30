import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '../user_context';
import { useSocket } from '../socket_context';
import './waiting_lobby.css';

// Same multi-color avatar palette pattern used on the faculty-class page
const AVATAR_COLORS = ['#7c3aed', '#0891b2', '#16a34a', '#ea580c', '#A50034', '#2563eb'];
const getAvatarColor = (id = '') => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

function WaitingLobby() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const socket = useSocket();

  const [roomPin, setRoomPin] = useState('');
  const [players, setPlayers] = useState([]);
  const [hostName, setHostName] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const roomPinRef = useRef('');
  const roomCreated = useRef(false); // prevent double emit

  const state = location.state || {};
  const moduleId = state.module?.id || '';
  const quizType = state.quizType?.id || '';
  const questions = state.questions || [];

  useEffect(() => {
    if (!socket || roomCreated.current) return;
    roomCreated.current = true;

    const playerDisplayName = user
      ? `${user.firstName} ${user.lastName}`
      : 'Player';

    console.log('🏠 Creating room with', questions.length, 'questions');

    socket.emit('create-room', {
      hostName: playerDisplayName,
      moduleId,
      quizType,
      questions,
    }, (response) => {
      console.log('🏠 create-room response:', response);
      if (response.success) {
        const pin = response.room.pin;
        setRoomPin(pin);
        roomPinRef.current = pin;
        setPlayers(response.room.players);
        setHostName(response.room.hostName);
      } else {
        setError(response.error || 'Failed to create room');
      }
    });

    socket.on('room-update', (data) => {
      setPlayers(data.players);
      setHostName(data.hostName);
    });

    socket.on('player-joined', (data) => {
      setPlayers(prev => {
        const exists = prev.find(p => p.id === data.player.id);
        if (exists) return prev;
        return [...prev, { id: data.player.id, name: data.player.name, score: 0 }];
      });
    });

    socket.on('player-left', (data) => {
      setPlayers(prev => prev.filter(p => p.id !== data.playerId));
    });

    socket.on('quiz-started', () => {
      navigate(`/quiz-arena?pin=${roomPinRef.current}`);
    });

    socket.on('room-closed', () => {
      alert('The room has been closed.');
      navigate('/pvp-quiz');
    });

    return () => {
      socket.off('room-update');
      socket.off('player-joined');
      socket.off('player-left');
      socket.off('quiz-started');
      socket.off('room-closed');
    };
  }, [socket]);

  const handleCopyPin = () => {
    navigator.clipboard.writeText(roomPin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartQuiz = () => {
    if (players.length < 2) return;
    socket.emit('start-quiz', { pin: roomPin }, (response) => {
      if (!response.success) {
        setError(response.error || 'Failed to start quiz');
      }
    });
  };

  if (error) {
    return (
      <div className="waiting-lobby-panel">
        <div className="error-container">
          <span className="error-icon">❌</span>
          <p className="error-text">{error}</p>
          <button className="back-btn" onClick={() => navigate('/pvp-quiz')}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="waiting-lobby-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="waiting-lobby-content">

        {/* Left sidebar: PIN + module card */}
        <div className="lobby-sidebar">
          <div className="pin-section">
            <span className="pin-label">PIN CODE:</span>
            <span className="pin-code">{roomPin || '------'}</span>
            <button className="copy-btn" onClick={handleCopyPin}>
              {copied ? '✅ Copied!' : '📋 Copy'}
            </button>
          </div>

          <div className="module-card">
            <div className="module-card-img">🖥️</div>
            <p className="module-card-text">
              {state.module?.label || 'Test Your Knowledge in IT Fundamentals'}
            </p>
          </div>
        </div>

        {/* Right area: players + start button */}
        <div className="lobby-main">
          <p className="waiting-text">Waiting for players...</p>

          <div className="players-grid">
            {players.map((player, index) => (
              <div key={player.id || index} className="player-avatar-wrap">
                <div
                  className="player-avatar"
                  style={{ background: getAvatarColor(player.id || player.name) }}
                >
                  {player.name ? player.name.charAt(0).toUpperCase() : '?'}
                </div>
                <span className="player-avatar-name">
                  {player.name}
                  {player.id === socket?.id && ' (You)'}
                </span>
              </div>
            ))}
          </div>

          <div className="lobby-actions">
            <button
              className="start-quiz-btn"
              onClick={handleStartQuiz}
              disabled={players.length < 2}
            >
              {players.length < 2
                ? `Waiting for ${2 - players.length} more player${players.length === 1 ? '' : 's'}...`
                : '▶ Start Quiz'}
            </button>
          </div>

          <button
            className="leave-btn"
            onClick={() => {
              if (window.confirm('Are you sure you want to leave?')) {
                navigate('/pvp-quiz');
              }
            }}
          >
            Leave Room
          </button>
        </div>

      </div>
    </motion.div>
  );
}

export default WaitingLobby;