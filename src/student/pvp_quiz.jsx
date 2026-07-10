import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '../user_context';
import { useSocket } from '../socket_context';
import './pvp_quiz.css';

function PvpQuiz() {
  const navigate = useNavigate();
  const { user } = useUser();
  const socket = useSocket();
  const [joinPin, setJoinPin] = useState('');
  const [joinError, setJoinError] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [checkingJoin, setCheckingJoin] = useState(false);

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
    if (!socket) return;

    // KRITIKAL: dahil ang `itfun_roomPin`/`itfun_playerName` sa localStorage
    // ay SHARED sa buong browser (hindi tab/account-scoped), posibleng may
    // naiwang stale na room session dito galing sa IBANG account na dating
    // gumamit ng browser na ito (hal. nag-disconnect nang hindi nag-"Leave
    // Room"). Kaya HINDI natin basta pinagkakatiwalaan ang `savedName` para
    // mag-auto-rejoin — palagi nating ipinapadala ang `user?.uid` ng
    // KASALUKUYANG naka-login na account, at ang server (`rejoin-room`
    // handler) mismo ang bahalang tumanggi kung hindi ito tumutugma sa
    // uid na naka-record sa slot — kahit magkatugma ang pin/playerName.
    const savedPin = localStorage.getItem('itfun_roomPin');
    const savedName = localStorage.getItem('itfun_playerName');
    const savedIsHost = localStorage.getItem('itfun_isHost') === 'true';

    if (!savedPin || !savedName) {
      setCheckingSession(false);
      return;
    }

    socket.emit('rejoin-room', { pin: savedPin, playerName: savedName, uid: user?.uid }, (response) => {
      console.log('🔁 landing-page auto-rejoin response:', response);

      if (response?.success) {
        // Nasa gitna pa ng laro (may kasalukuyang tanong) o tapos na —
        // deretso na sa quiz-arena, tama namang tinutumbasan ng
        // quiz-arena.jsx page ang "finished" state gamit ang leaderboard.
        if (response.state?.question || response.state?.finished) {
          navigate(`/quiz-arena?pin=${savedPin}`);
          return;
        }

        // Naka-'waiting' pa lang ang room — bumalik sa tamang lobby depende
        // kung host o regular player siya. Uulitin ng lobby page mismo yung
        // rejoin-room emit nito (harmless/idempotent — same socket.id na
        // parin sa parehong tab), pero ito na ang nag-e-ensure na hindi na
        // sila makakarating sa "Join Room" modal path.
        if (savedIsHost) {
          navigate('/waiting-lobby-host');
        } else {
          navigate(`/waiting-lobby-join?pin=${savedPin}`);
        }
        return;
      }

      // Wala nang mahanap na room/player (natapos na talaga, o na-clear na
      // ng ibang session) — i-clear na yung stale localStorage at ituloy
      // na lang ang normal na landing page.
      localStorage.removeItem('itfun_roomPin');
      localStorage.removeItem('itfun_playerName');
      localStorage.removeItem('itfun_isHost');
      localStorage.removeItem('itfun_sessionTime');
      setCheckingSession(false);
    });
  }, [socket]);

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
                disabled={joinPin.length !== 6 || checkingJoin}
              >
                {checkingJoin ? 'Checking...' : 'Join'}
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