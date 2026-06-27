import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '../user_context';
import { useSocket } from '../socket_context';
import './waiting_lobby.css';

function WaitingLobbyJoin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const socket = useSocket();

  const [players, setPlayers] = useState([]);
  const [hostName, setHostName] = useState('');
  const [error, setError] = useState('');

  const roomPinRef = useRef('');

  // Get PIN from URL param
  const params = new URLSearchParams(location.search);
  const pin = params.get('pin') || '';

  useEffect(() => {
    if (!socket) return;

    roomPinRef.current = pin;

    const playerDisplayName = user
      ? `${user.firstName} ${user.lastName}`
      : 'Player';

    socket.emit('join-room', {
      pin,
      playerName: playerDisplayName,
    }, (response) => {
      console.log('👥 join-room response:', response);
      if (response.success) {
        setPlayers(response.room.players);
        setHostName(response.room.hostName);
      } else {
        setError(response.error || 'Failed to join room');
        setTimeout(() => navigate('/pvp-quiz'), 2000);
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
      alert('The room has been closed by the host.');
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
      <div className="lobby-topbar">
        <span className="lobby-brand">ITFun</span>
      </div>

      <div className="waiting-lobby-content">

        {/* Left sidebar: PIN display (read-only) + host info */}
        <div className="lobby-sidebar">
          <div className="pin-section">
            <span className="pin-label">PIN CODE:</span>
            <span className="pin-code">{pin}</span>
          </div>

          <div className="module-card">
            <div className="module-card-img">🖥️</div>
            <p className="module-card-text">
              Host: <strong>{hostName || '...'}</strong>
            </p>
          </div>
        </div>

        {/* Right area: players list + waiting message */}
        <div className="lobby-main">
          <p className="waiting-text">Waiting for players...</p>

          <div className="players-grid">
            {players.map((player, index) => (
              <div key={player.id || index} className="player-avatar-wrap">
                <div className="player-avatar">
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
            <p className="host-waiting-text">
              Waiting for host to start the quiz...
            </p>
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

export default WaitingLobbyJoin;