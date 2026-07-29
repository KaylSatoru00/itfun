import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '../user_context';
import { useSocket } from '../socket_context';
import { LuSwords } from 'react-icons/lu';
import { SiBookstack } from 'react-icons/si';
import './pvp_quiz.css';

function PvpQuiz() {
  const navigate = useNavigate();
  const { user } = useUser();
  const socket = useSocket();
  const [joinPin, setJoinPin] = useState('');
  const [joinError, setJoinError] = useState('');
  const [checkingJoin, setCheckingJoin] = useState(false);
  const [pinFocused, setPinFocused] = useState(false);
  const pinInputRef = useRef(null);

  // Kung may saved session tayo (host man o joiner) galing sa localStorage,
  // ibig sabihin may room pa siyang binalikan — kaya bago pa man ipakita
  // itong landing page (na may "Join Room" modal na dumadaan sa
  // check-join-eligibility), subukan muna nating i-auto-rejoin siya papunta
  // sa tamang lobby/quiz page.
  //
  // Bakit dito pa ito idinagdag, hindi lang umasa sa localStorage check na
  // nasa loob na ng waiting_lobby_host.jsx/waiting_lobby_join.jsx? Dahil
  // pareho lang nagtatrigger yung mga check na 'yon kapag naka-land na ang
  // user sa page na 'yon mismo. Pero kung nag-close ng buong tab si host o
  // joiner tapos bumalik sa root (`/pvp-quiz`), hindi sila mapupunta doon
  // nang otomatiko — mapipilitan silang gamitin yung "Join Room" modal dito,
  // na dumadaan sa `check-join-eligibility` -> `validateRoomJoin()`, na
  // basta na lang nagre-reject ng "Game already in progress" kapag
  // `room.status === 'playing'`, kahit existing player/host na pala sila.
  // Yung `rejoin-room` handler (tinatawag sa loob ng lobby pages) ang may
  // tamang eksepsyon para dito — kaya ito ang gusto nating tamaan, hindi
  // yung "Join Room" modal path.
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = '#ffffff';
    return () => {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  useEffect(() => {
    // Design decision: the PvP landing page NEVER auto-rejoins a saved room.
    // A leftover session (e.g. an old room you didn't formally "Leave") must
    // not hijack you and pull you into the wrong lobby. We simply clear any
    // stale session here and show Create / Join. To return to an active room,
    // enter its PIN — the server recognizes you by uid and restores you to the
    // right lobby (or straight to the arena if the quiz already started).
    localStorage.removeItem('itfun_roomPin');
    localStorage.removeItem('itfun_playerName');
    localStorage.removeItem('itfun_isHost');
    localStorage.removeItem('itfun_sessionTime');
    setCheckingSession(false);
  }, []);

  const handleCreateRoom = () => {
    navigate('/select-module');
  };

  const handleJoinRoom = () => {
    if (joinPin.length !== 6) {
      setJoinError('Please enter a valid 6-digit PIN');
      return;
    }

    if (!socket) {
      setJoinError('Not connected to server. Please try again.');
      return;
    }

    setJoinError('');
    setCheckingJoin(true);

    socket.emit('check-join-eligibility', { pin: joinPin, uid: user?.uid }, (response) => {
      setCheckingJoin(false);
      if (response.success) {
        navigate(`/waiting-lobby-join?pin=${joinPin}`);
      } else {
        setJoinError(response.error || 'Unable to join this room.');
      }
    });
  };

  // Habang chinecheck pa natin kung may dating room na dapat balikan,
  // huwag munang ipakita yung landing page (lalo na yung mga cards) —
  // maiiwasan yung flash-then-redirect kapag may auto-rejoin palang mangyayari.
  if (checkingSession) {
    return (
      <div className="pvp-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <p style={{ color: '#A50034', fontStyle: 'italic' }}>Checking for an existing game...</p>
      </div>
    );
  }

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

      {/* Create / Join panels */}
      <div className="pvp-cards">
        {/* Create Room */}
        <div className="pvp-panel-card create">
          <div className="pvp-panel-head">
            <div className="pvp-panel-titles">
              <h3 className="pvp-panel-title">Create Room</h3>
              <p className="pvp-panel-sub">Host a quiz battle and invite players</p>
            </div>
            <div className="pvp-panel-badge"><LuSwords /></div>
          </div>
          <button className="pvp-panel-btn" onClick={handleCreateRoom}>Create Room</button>
        </div>

        {/* Join Room */}
        <div className="pvp-panel-card join">
          <div className="pvp-panel-head">
            <div className="pvp-panel-titles">
              <h3 className="pvp-panel-title">Join Room</h3>
              <p className="pvp-panel-sub">Enter a room code to join others</p>
            </div>
          </div>

          <div className="pvp-pin-boxes" onClick={() => pinInputRef.current?.focus()}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={
                  'pvp-pin-box' +
                  (joinPin[i] ? ' filled' : '') +
                  (pinFocused && i === joinPin.length ? ' focus' : '')
                }
              >
                {joinPin[i] || ''}
              </div>
            ))}
            <input
              ref={pinInputRef}
              type="text"
              inputMode="numeric"
              className="pvp-pin-hidden"
              value={joinPin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setJoinPin(val);
                setJoinError('');
              }}
              onFocus={() => setPinFocused(true)}
              onBlur={() => setPinFocused(false)}
              maxLength={6}
              autoComplete="off"
            />
          </div>

          {joinError && <p className="pvp-pin-error">{joinError}</p>}

          <button
            className="pvp-panel-btn"
            onClick={handleJoinRoom}
            disabled={joinPin.length !== 6 || checkingJoin}
          >
            {checkingJoin ? 'Checking...' : 'Join Room'}
          </button>
        </div>
      </div>

      {/* Bottom Navigation — Sliding Pill */}
      <div className="bottom-nav">
        <div className="bottom-nav-pill" />
        <div className="bottom-nav-btn" onClick={() => navigate('/learning-modules')}>
          <span className="bottom-nav-icon"><SiBookstack /></span>
          <span className="bottom-nav-label">Learning Modules</span>
        </div>
        <div className="bottom-nav-btn active" onClick={() => navigate('/pvp-quiz')}>
          <span className="bottom-nav-icon"><LuSwords /></span>
          <span className="bottom-nav-label">PVP Quiz Arena</span>
        </div>
      </div>
    </motion.div>
  );
}

export default PvpQuiz;