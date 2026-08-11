import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '../user_context';
import { useSocket } from '../socket_context';
import { moduleLabelFromId, quizTypeLabelFromId } from './quiz_meta';
import './waiting_lobby.css';

// Same multi-color avatar palette pattern used on the faculty-class page
// 24 distinct, saturated colors — all dark enough for the white initial to
// stay legible. A larger palette means far fewer color repeats overall and
// lets bigger same-name groups each keep a unique color.
const AVATAR_COLORS = [
  '#7c3aed', '#0891b2', '#16a34a', '#ea580c', '#A50034', '#2563eb',
  '#C8102E', '#db2777', '#0d9488', '#9333ea', '#d97706', '#4f46e5',
  '#059669', '#dc2626', '#0284c7', '#c026d3', '#4d7c0f', '#e11d48',
  '#7e22ce', '#b45309', '#1d4ed8', '#be123c', '#15803d', '#a16207',
];
const getAvatarColor = (id = '') => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// Assign each player a palette color, GUARANTEEING that players who share the
// exact same display name (e.g. two "Jezter Mangacu" on different accounts)
// still get different colors — otherwise their identical name + identical
// color makes them impossible to tell apart. Players with unique names keep a
// stable per-name hash color. Returns a Map keyed by player id (name fallback).
const buildAvatarColors = (players = []) => {
  const groups = new Map(); // nameKey -> [player keys]
  players.forEach((p) => {
    const nameKey = (p.name || '').trim().toLowerCase();
    const key = p.id || p.name || '';
    if (!groups.has(nameKey)) groups.set(nameKey, []);
    groups.get(nameKey).push(key);
  });

  const colorByKey = new Map();
  groups.forEach((keys, nameKey) => {
    let hash = 0;
    for (let i = 0; i < nameKey.length; i++) hash = nameKey.charCodeAt(i) + ((hash << 5) - hash);
    const base = Math.abs(hash);
    // Sort so each specific player keeps the same slot even if the list
    // reorders; +i within a same-name group walks the palette so duplicates
    // land on distinct colors (up to AVATAR_COLORS.length of them).
    [...keys].sort().forEach((key, i) => {
      colorByKey.set(key, AVATAR_COLORS[(base + i) % AVATAR_COLORS.length]);
    });
  });
  return colorByKey;
};

function WaitingLobbyJoin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, authLoading } = useUser();
  const socket = useSocket();

  const [players, setPlayers] = useState([]);
  const [hostName, setHostName] = useState('');
  const [moduleLabel, setModuleLabel] = useState('');
  const [quizTypeLabel, setQuizTypeLabel] = useState('');
  const [error, setError] = useState('');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Fill the sidebar card's Title / Quiz Type from the room the server sends
  // back (the joiner never carries the host's module/type picks in nav state).
  const applyRoomMeta = (room) => {
    if (!room) return;
    if (room.moduleId) setModuleLabel(moduleLabelFromId(room.moduleId));
    if (room.quizType) setQuizTypeLabel(quizTypeLabelFromId(room.quizType));
  };

  const roomPinRef = useRef('');

  // Get PIN from URL param
  const params = new URLSearchParams(location.search);
  const pin = params.get('pin') || '';

  useEffect(() => {
    // KRITIKAL: same guard as sa host lobby — hintayin munang matapos ang
    // Firebase auth restore (`authLoading`) bago mag-emit ng `join-room`/
    // `rejoin-room` na may `uid`. Kung hindi, posibleng mauna ang socket
    // connection kaysa sa async auth restore pagkatapos ng hard refresh,
    // kaya mapapadala ang `uid: undefined` at ma-reject tayo ng backend
    // ng "Missing uid — please log in again." kahit hindi naman totoong
    // naka-logout.
    if (!socket || authLoading) return;

    roomPinRef.current = pin;

    const playerDisplayName = user
      ? `${user.firstName} ${user.lastName}`
      : 'Player';

    const doJoinRoom = () => {
      socket.emit('join-room', {
        pin,
        playerName: playerDisplayName,
        uid: user?.uid,
      }, (response) => {
        console.log('👥 join-room response:', response);
        if (response.success) {
          // KRITIKAL: kung may `response.state`, ibig sabihin hindi 'to
          // fresh na pagsali — na-detect ng server na existing player na
          // pala tayo (uid match), kaya nire-reroute nito papunta sa
          // parehong rejoin logic (`performRejoin`) sa halip na gumawa ng
          // bagong slot. Kailangan din nating i-treat 'to bilang totoong
          // rejoin dito sa frontend — kung ongoing na o tapos na ang quiz,
          // dapat diretso tayong dalhin sa quiz-arena, hindi manatili sa
          // waiting lobby.
          if (response.state) {
            setPlayers(response.state.players);
            setHostName(response.room?.hostName || hostName);
            applyRoomMeta(response.room);

            localStorage.setItem('itfun_roomPin', pin);
            localStorage.setItem('itfun_playerName', playerDisplayName);
            localStorage.setItem('itfun_isHost', response.isHost ? 'true' : 'false');
            localStorage.setItem('itfun_sessionTime', Date.now().toString());

            // The server recognized this account as the room's HOST (e.g. the
            // host left and is rejoining by PIN). Send them to the host lobby,
            // which has the Start button — the join view does not.
            if (response.isHost) {
              navigate('/waiting-lobby');
              return;
            }

            if (response.state.finished || response.state.question) {
              navigate(`/quiz-arena?pin=${pin}`);
            }
            return;
          }

          setPlayers(response.room.players);
          setHostName(response.room.hostName);
          applyRoomMeta(response.room);

          localStorage.setItem('itfun_roomPin', pin);
          localStorage.setItem('itfun_playerName', playerDisplayName);
          localStorage.setItem('itfun_isHost', 'false');
          localStorage.setItem('itfun_sessionTime', Date.now().toString());
        } else {
          setError(response.error || 'Failed to join room');
          setTimeout(() => navigate('/pvp-quiz'), 2000);
        }
      });
    };

    // Kung may existing session na tumutugma sa pin na 'to (reload man,
    // bagong tab, o fresh navigation pagkatapos mag-exit — kahit matagal na
    // ang nakalipas), i-attempt munang mag-rejoin bago mag-join ulit as
    // bagong player. localStorage (hindi sessionStorage) para hindi mawala
    // kahit isara yung tab/browser. Ang backend na ang magde-decide kung
    // valid pa ba ang rejoin (base sa kung "finished" na ba ang quiz, hindi
    // sa oras) — kaya wala nang time-based na "isFresh" gate dito sa
    // frontend; kung wala nang mahanap na record sa backend, mabibigo lang
    // naman ang rejoin at babagsak sa normal na doJoinRoom() sa baba.
    //
    // KRITIKAL: palagi nating ipinapadala ang `user?.uid` ng KASALUKUYANG
    // naka-login na account (hindi galing sa localStorage) — ang server na
    // ang bahalang tumanggi kung hindi ito tumutugma sa naka-record na uid
    // ng slot, kahit magkatugma pa ang display name o may naiwang stale na
    // itfun_roomPin/itfun_playerName mula sa ibang account sa browser na 'to.
    const savedPin = localStorage.getItem('itfun_roomPin');
    const savedName = localStorage.getItem('itfun_playerName');

    if (savedPin === pin && savedName === playerDisplayName) {
      socket.emit('rejoin-room', { pin, playerName: playerDisplayName, uid: user?.uid }, (response) => {
        console.log('🔁 join rejoin-room response:', response);
        if (response?.success) {
          // Host rejoining by PIN → route to the host lobby (has Start button).
          if (response.isHost) {
            localStorage.setItem('itfun_roomPin', pin);
            localStorage.setItem('itfun_playerName', playerDisplayName);
            localStorage.setItem('itfun_isHost', 'true');
            localStorage.setItem('itfun_sessionTime', Date.now().toString());
            navigate('/waiting-lobby');
            return;
          }
          setPlayers(response.state.players);
          setHostName(response.room?.hostName || hostName);
          applyRoomMeta(response.room);

          if (response.state.finished || response.state.question) {
            navigate(`/quiz-arena?pin=${pin}`);
          }
        } else {
          localStorage.removeItem('itfun_roomPin');
          localStorage.removeItem('itfun_playerName');
          localStorage.removeItem('itfun_isHost');
          localStorage.removeItem('itfun_sessionTime');
          doJoinRoom();
        }
      });
    } else {
      doJoinRoom();
    }

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
      localStorage.removeItem('itfun_roomPin');
      localStorage.removeItem('itfun_playerName');
      localStorage.removeItem('itfun_isHost');
      localStorage.removeItem('itfun_sessionTime');
      alert('The room has been closed by the host.');
      navigate('/pvp-quiz');
    });

    // Host migration: the old host left and the server promoted a new one.
    socket.on('host-changed', (data) => {
      setHostName(data.newHostName);
      // If I'm the new host, move to the host lobby (which has the Start button).
      if (data.newHostId === socket.id) {
        localStorage.setItem('itfun_roomPin', pin);
        localStorage.setItem('itfun_playerName', playerDisplayName);
        localStorage.setItem('itfun_isHost', 'true');
        localStorage.setItem('itfun_sessionTime', Date.now().toString());
        navigate('/waiting-lobby');
      }
    });

    return () => {
      socket.off('room-update');
      socket.off('player-joined');
      socket.off('player-left');
      socket.off('quiz-started');
      socket.off('room-closed');
      socket.off('host-changed');
    };
  }, [socket, authLoading]);

  const doLeaveRoom = () => {
    // Tell the server so other players see us disappear in real time (our slot
    // is kept so we can still rejoin by PIN).
    if (socket) {
      socket.emit('leave-room', { pin, uid: user?.uid });
    }
    localStorage.removeItem('itfun_roomPin');
    localStorage.removeItem('itfun_playerName');
    localStorage.removeItem('itfun_isHost');
    localStorage.removeItem('itfun_sessionTime');
    navigate('/pvp-quiz');
  };

  // Intercept the browser Back/Return button. Without this, pressing Back
  // lands on /pvp-quiz, whose auto-rejoin effect reads the still-saved
  // session and bounces the user straight back into this lobby (the "bug").
  // Here we push a history entry and, on Back, show a "leave room?" confirm
  // instead. Confirming clears the saved session (so pvp-quiz won't
  // auto-rejoin) — the user can still rejoin by entering the PIN again,
  // since the server remembers them by uid.
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const onPopState = () => {
      window.history.pushState(null, '', window.location.href);
      setShowLeaveConfirm(true);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  if (authLoading) {
    return (
      <div className="waiting-lobby-panel">
        <div className="error-container">
          <p className="error-text">Restoring your session...</p>
        </div>
      </div>
    );
  }

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

  // Distinct-per-duplicate-name avatar colors, recomputed as the roster changes.
  const avatarColors = buildAvatarColors(players);

  return (
    <motion.div
      className="waiting-lobby-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="waiting-lobby-content">

        {/* Left sidebar: PIN display (read-only) + host info */}
        <div className="lobby-sidebar">
          <div className="pin-section">
            <span className="pin-label">PIN CODE:</span>
            <span className="pin-code">{pin}</span>
          </div>

          <div className="module-card">
            <div className="module-card-img">🖥️</div>
            <div className="lobby-meta">
              <div className="lobby-meta-row">
                <span className="lobby-meta-label">Title</span>
                <span className="lobby-meta-value">{moduleLabel || 'IT Fundamentals'}</span>
              </div>
              <div className="lobby-meta-row">
                <span className="lobby-meta-label">Quiz Type</span>
                <span className="lobby-meta-value">{quizTypeLabel || '—'}</span>
              </div>
              <div className="lobby-meta-row">
                <span className="lobby-meta-label">Host</span>
                <span className="lobby-meta-value">{hostName || '…'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right area: players list + waiting message */}
        <div className="lobby-main">
          <div className="lobby-main-head">
            <p className="waiting-text">Waiting for players...</p>
            <span className="player-count-pill">{players.length} joined</span>
          </div>

          <div className="players-grid">
            {players.map((player, index) => (
              <div key={player.id || index} className="player-avatar-wrap">
                <div
                  className="player-avatar"
                  style={{ background: avatarColors.get(player.id || player.name) || getAvatarColor(player.id || player.name) }}
                >
                  {player.name ? player.name.charAt(0).toUpperCase() : '?'}
                </div>
                <span className="player-avatar-name">
                  {player.id === socket?.id ? '(YOU)' : player.name}
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
            onClick={() => setShowLeaveConfirm(true)}
          >
            Leave Room
          </button>
        </div>

      </div>

      {showLeaveConfirm && (
        <div className="leave-modal-overlay" onClick={() => setShowLeaveConfirm(false)}>
          <motion.div
            className="leave-modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          >
            <div className="leave-modal-icon">🚪</div>
            <h3 className="leave-modal-title">Leave Room?</h3>
            <p className="leave-modal-text">
              Do you want to leave the room? You can rejoin anytime by entering the PIN code again.
            </p>
            <div className="leave-modal-actions">
              <button className="leave-modal-cancel" onClick={() => setShowLeaveConfirm(false)}>
                Stay
              </button>
              <button className="leave-modal-confirm" onClick={doLeaveRoom}>
                Yes, Leave
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

export default WaitingLobbyJoin;