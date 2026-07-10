import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../socket_context';
import { useUser } from '../user_context';
import './quiz_arena.css';

function QuizArena() {
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useSocket();
  const { user } = useUser();

  const params = new URLSearchParams(location.search);
  const pin = params.get('pin');

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timer, setTimer] = useState(30);
  const [maxTimer, setMaxTimer] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [identInput, setIdentInput] = useState('');
  const [players, setPlayers] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [showRoundResults, setShowRoundResults] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [finalRankings, setFinalRankings] = useState([]);
  // Dati, wala nang gagawin dito dahil kasama na yung correctAnswer sa
  // currentQuestion mula pa sa simula (security issue na inayos na sa
  // backend). Ngayon, dumarating lang ito pagdating ng `round-results`,
  // kaya kailangan nating i-store nang hiwalay para magamit sa reveal UI
  // (highlight sa options, reveal sa input/blank).
  const [revealedAnswer, setRevealedAnswer] = useState(null);

  // 3-2-1 countdown na ipinapakita pagka-start ng quiz (pagdating ng
  // 'quiz-started'), bago pa lumabas yung unang tanong. Ang autoplay ng
  // bgm ay sinasabay natin sa pagtapos ng countdown na ito (pagdating sa
  // "1"), dahil ito na yung pinaka-malamang na oras na may user activation
  // na sa tab (mula sa pag-click ng host/player sa "Start"/"Ready" bago
  // pumasok dito), kaysa umasa na lang sa random click sa unang sagot.
  const [countdown, setCountdown] = useState(null);
  const countdownIntervalRef = useRef(null);

  // ── Background music (Quiz Arena ambiance) ──
  // Ref, hindi state — para hindi ito ma-recreate sa bawat re-render (kahit
  // ilang beses mag-re-render ang component dahil sa ibang state changes
  // tulad ng timer tick, currentQuestion, atbp.). Iisang Audio object lang
  // ito, buong buhay ng session.
  const bgMusicRef = useRef(null);

  // Isang beses lang gagawa ng AudioContext, re-use sa dalawang sound
  // effect (correct/wrong) — kailangan ito para ma-"boost" pa natin ang
  // lakas ng tunog lampas sa normal na max (1.0) ng <audio volume>, dahil
  // hanggang 1.0 lang ang kaya ng plain volume property kahit anong laki
  // pa ilagay natin dito.
  const sfxAudioCtxRef = useRef(null);

  // Pinapatugtog ang isang sound effect na naka-boost ang lakas gamit ang
  // Web Audio API (GainNode > 1.0 = mas malakas pa sa "normal max").
  // May fallback sa plain <audio> kung sakaling hindi supported ng browser
  // ang Web Audio API, o kung na-block ang MediaElementSource dahil sa
  // CORS/autoplay restrictions.
  const playBoostedSfx = (url, gain = 1.8) => {
    try {
      if (!sfxAudioCtxRef.current) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        sfxAudioCtxRef.current = new AudioContextClass();
      }
      const ctx = sfxAudioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const audioEl = new Audio(url);
      const source = ctx.createMediaElementSource(audioEl);
      const gainNode = ctx.createGain();
      gainNode.gain.value = gain;
      source.connect(gainNode).connect(ctx.destination);
      audioEl.play().catch(() => {});
    } catch (err) {
      const fallback = new Audio(url);
      fallback.play().catch(() => {});
    }
  };

  useEffect(() => {
    if (!pin) {
      navigate('/pvp-quiz');
      return;
    }
    if (!socket) return;
    // Hintayin munang ma-load ang authenticated user bago mag-attempt ng
    // rejoin-room — kailangan na ng server ang uid ngayon (hindi na sapat
    // ang playerName lang), kaya kung wala pa itong available, i-rerun na
    // lang ang effect na ito once na naka-set na si user (nasa deps array).
    if (!user?.uid) return;

    console.log('🔌 QuizArena socket connected:', socket.id);

    // Dati, "reload-only" ang check dito (performance navigation type === 'reload')
    // dahil akala noon ay yun ang dahilan ng rejoin crash. Yung totoong dahilan
    // pala noon ay circular reference sa serialization (na-fix na sa backend),
    // kaya safe na ngayon na i-attempt ang rejoin-room sa tuwing may match na
    // saved session — reload man, bagong tab, o fresh navigation (hal. binuksan
    // ulit ng user yung /quiz-arena?pin=... galing sa ibang tab/window), kahit
    // matagal na ang nakalipas. Ang backend na ang magde-decide kung valid pa
    // ba ang rejoin (base sa kung "finished" na ba ang quiz) — kaya wala nang
    // time-based na "isFresh" gate dito sa frontend.
    const savedPin = localStorage.getItem('itfun_roomPin');
    const savedName = localStorage.getItem('itfun_playerName');

    if (savedPin === pin && savedName) {
      socket.emit('rejoin-room', { pin, playerName: savedName, uid: user.uid }, (response) => {
        console.log('🔁 Rejoin response:', response);
        if (!response?.success) {
          // Room no longer exists o hindi na-verify — balik sa lobby
          localStorage.removeItem('itfun_roomPin');
          localStorage.removeItem('itfun_playerName');
          localStorage.removeItem('itfun_isHost');
          localStorage.removeItem('itfun_sessionTime');
          alert('Hindi na-resume yung room. Baka natapos na o expired na.');
          navigate('/pvp-quiz');
          return;
        }

        const state = response.state;
        if (state.finished) {
          setFinalRankings(state.players);
          setGameFinished(true);
          return;
        }

        setTotalQuestions(state.totalQuestions);
        setPlayers(state.players);
        setQuestionIndex(state.questionIndex);
        setTimer(state.timeLeft);
        setMaxTimer(state.maxTime);

        if (state.resultsShown) {
          setRankings(state.players);
          setShowRoundResults(true);
          setCurrentRound(state.questionIndex + 1);
        } else if (state.question) {
          setCurrentQuestion(state.question);
          setCurrentRound(state.questionIndex + 1);
          setIsAnswered(!!state.hasAnswered);
        }
      });
    }

    socket.on('quiz-started', (data) => {
      console.log('🎮 Quiz started:', data);
      setTotalQuestions(data.totalQuestions);
      setPlayers(data.players);

      // Simulan yung 3-2-1 countdown. Pagdating sa 0 (tapos na ang "1"),
      // saka pa lang natin susubukang i-play ang bgm — sadyang hiwalay ito
      // sa mount-time play() attempt sa itaas, dahil mas malamang na sa
      // sandaling ito ay confirmed na yung timing na aabot na ang unang
      // tanong, kaya sabay-sabay silang mararamdaman ng player.
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      let n = 3;
      setCountdown(n);
      countdownIntervalRef.current = setInterval(() => {
        n -= 1;
        if (n <= 0) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          setCountdown(null);
          if (bgMusicRef.current) {
            bgMusicRef.current.play().catch(() => {});
          }
        } else {
          setCountdown(n);
        }
      }, 1000);
    });

    socket.on('new-question', (data) => {
      console.log('📨 New question received:', data.questionIndex);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      setCountdown(null);
      setCurrentQuestion(data.question);
      setQuestionIndex(data.questionIndex);
      setTotalQuestions(data.totalQuestions);
      setTimer(data.timer || 30);
      setMaxTimer(data.timer || 30);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setIdentInput('');
      setShowRoundResults(false);
      setCurrentRound(data.questionIndex + 1);
      setRevealedAnswer(null);
    });

    socket.on('timer-update', (data) => {
      setTimer(data.timeLeft);
    });

    socket.on('round-results', (data) => {
      console.log('📊 Round results received:', data);
      setPlayers(prev => {
        const updated = prev.map(p => {
          const ranked = data.rankings.find(r => r.id === p.id);
          return ranked ? { ...p, score: ranked.score } : p;
        });
        return updated;
      });
      setRankings(data.rankings);
      setRevealedAnswer(data.correctAnswer ?? null);
      // Bigyan muna ng ilang segundo bago lumipat sa rankings screen, para
      // makita ng player yung highlight (True/False, Multiple Choice) o
      // reveal (Identification, Fill-in-Blank) sa loob mismo ng question
      // screen — kung diretso agad sa rankings, mawawalan ng saysay yung
      // buong reveal UI dahil hindi na ito makikita.
      setTimeout(() => setShowRoundResults(true), 2200);
    });

    socket.on('quiz-finished', (data) => {
      console.log('🏁 Quiz finished:', data);
      setFinalRankings(data.rankings);
      setPlayers(data.players || []);
      setGameFinished(true);
      setShowRoundResults(false);
    });

    socket.on('room-closed', () => {
      localStorage.removeItem('itfun_roomPin');
      localStorage.removeItem('itfun_playerName');
      localStorage.removeItem('itfun_isHost');
      localStorage.removeItem('itfun_sessionTime');
      alert('The room has been closed.');
      navigate('/pvp-quiz');
    });

    return () => {
      socket.off('quiz-started');
      socket.off('new-question');
      socket.off('timer-update');
      socket.off('round-results');
      socket.off('quiz-finished');
      socket.off('room-closed');
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [socket, pin, navigate, user]);

  // ── Background music: start + loop + cleanup ──
  // Isang beses lang tumatakbo ito (empty deps) — sa sandaling ma-mount
  // ang QuizArena, kaagad na gagawa ng IISANG Audio instance (naka-store
  // sa ref, hindi state) at agad na patutugtugin ito, naka-loop, sa 50%
  // volume. Dahil sa empty dependency array, hindi ito mababago o
  // madu-duplicate kahit ilang beses pang mag-re-render ang component
  // dahil sa ibang state (timer, currentQuestion, atbp.) — iisa lang ang
  // instance sa buong buhay ng component, mula mount hanggang unmount.
  useEffect(() => {
    const music = new Audio('/sounds/quiz-arena-bgm.mp3');
    music.loop = true;
    // Nilagyan ko na lang ito ng mas mababang volume (dati 0.5) dahil
    // sobrang lakas pa rin siya kahit kasabay na ng ibang sounds ng laro —
    // 0.15 na lang para background ambiance lang ang dating, hindi
    // nangingibabaw sa sound effects.
    music.volume = 0.15;
    bgMusicRef.current = music;

    music.play().catch(() => {
      // Posibleng ma-block ng browser autoplay policy kung walang direct
      // user gesture na naunang naganap bago pumasok sa page na ito (hal.
      // direktang pag-type ng URL, o auto-rejoin pagkatapos ng refresh).
      // Bilang huling safety net lang ito (tahimik, walang UI) — ang
      // pangunahing paraan na ngayon para mapatugtog ang bgm ay sa
      // pagtapos ng 3-2-1 countdown (tingnan yung 'quiz-started' handler).
      const resumeOnInteraction = () => {
        music.play().catch(() => {});
      };
      window.addEventListener('click', resumeOnInteraction, { once: true });
      window.addEventListener('touchstart', resumeOnInteraction, { once: true });
    });

    // Cleanup: sa unmount ng QuizArena (Exit button, room-closed,
    // anumang navigation palayo) — ito ang huling linya ng depensa para
    // hindi na patuloy na tumugtog ang music kahit umalis na ang player
    // sa page.
    return () => {
      music.pause();
      music.currentTime = 0;
      bgMusicRef.current = null;
    };
  }, []);

  // ── Background music: itigil agad pagkatapos ng quiz ──
  // Hiwalay na effect ito sa itaas dahil dapat itong tumakbo AGAD sa
  // mismong sandaling maging `true` ang `gameFinished` — hindi pwedeng
  // hintayin pa ang unmount, dahil nananatili pa ang player sa Final
  // Results screen (may Exit button pa) matapos matapos ang quiz. Kung
  // aasa lang tayo sa cleanup ng effect sa itaas, patuloy pa ring
  // tutunog ang music habang nakatingin ang player sa results — mali
  // 'yon base sa expected behavior (dapat tumigil "immediately" sa
  // sandaling matapos ang session, hindi lang sa sandaling umalis siya).
  useEffect(() => {
    if (gameFinished && bgMusicRef.current) {
      bgMusicRef.current.pause();
      bgMusicRef.current.currentTime = 0;
    }
  }, [gameFinished]);

  // ── Sound effects: correct/wrong ──
  // Tumutunog base lang sa SARILING sagot ng player (selectedAnswer), hindi
  // sa pangkalahatang resulta ng buong round — kaya bawat player, iisa lang
  // sa dalawang tunog (tama o mali) ang maririnig niya, hindi pareho.
  // Isang beses lang tumutunog kada round, sa oras na dumating ang
  // revealedAnswer mula sa `round-results` (dito lang available ang totoong
  // sagot — tugma ito sa security fix na tinanggal na ang correctAnswer sa
  // `new-question`).
  useEffect(() => {
    if (!revealedAnswer || !currentQuestion) return;

    const typeStr = String(currentQuestion.type || '').toLowerCase();
    const isTypedAnswer = typeStr.includes('ident') || typeStr.includes('fill');

    // Kung walang sagot ang player (timeout, walang na-click/na-type),
    // itinuturing itong "mali" — walang sagot ay hindi maaaring maging tama.
    const isUserCorrect = isTypedAnswer
      ? typeof selectedAnswer === 'string' &&
        selectedAnswer.trim().toUpperCase() === String(revealedAnswer).trim().toUpperCase()
      : selectedAnswer === revealedAnswer;

    playBoostedSfx(
      isUserCorrect
        ? '/sounds/mixkit-correct-answer-reward-952.wav'
        : '/sounds/fahhh_KcgAXfs.wav',
      1.8
    );
    // Sadyang [revealedAnswer] lang ang dependency — gusto lang natin itong
    // tumakbo nang isang beses bawat pagdating ng bagong revealedAnswer,
    // hindi sa bawat re-render dahil sa ibang state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealedAnswer]);

  const handleAnswer = (answer) => {
    if (isAnswered || !currentQuestion || !socket) return;
    setSelectedAnswer(answer);
    setIsAnswered(true);

    console.log('📤 Submitting answer:', { pin, questionIndex, answer });

    // Sadya nang hindi na nagpapadala ng client-computed na timeTaken — ang
    // server (via quizEngine.timeLeft) na ang bahalang mag-compute nito,
    // para hindi na maabuso kahit sa reload o sa direktang pag-edit ng
    // payload sa browser console.
    socket.emit('submit-answer', {
      pin,
      questionIndex,
      answer,
    }, (response) => {
      console.log('📥 Submit response:', response);
      if (!response?.success) {
        setIsAnswered(false);
        setSelectedAnswer(null);
      }
    });
  };

  const getOrdinal = (n) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const timerPercent = (timer / maxTimer) * 100;
  const isUrgent = timer <= 5;

  // Loose/defensive type matching — hindi lang exact `=== 'fill-in-blank'`.
  // Kahit na-normalize na natin ang type sa backend (gemini.service.js),
  // extra safety net ito kung sakaling may room pa ring gumagamit ng hindi
  // pa na-normalize na questions (hal. dating naka-cache sa memory).
  const questionType = String(currentQuestion?.type || '').toLowerCase();
  const isFillBlank = questionType.includes('fill');
  const isIdentification = questionType.includes('ident');
  const isTrueFalse = questionType.includes('true') && questionType.includes('false');

  // Habang nagtype pa lang ang player sa Identification/Fill-in-Blank
  // (hindi pa niya na-click ang Submit Answer), ipinapadala natin ang
  // latest typed value sa server bilang "draft" (debounced, 300ms after
  // last keystroke) — hindi pa ito counted/scored. Pero kung maubusan ng
  // oras bago pa siya mag-click, gagamitin ng server ang huling draft na
  // natanggap niya bilang totoong huling sagot, sa halip na agad ituring
  // na blangko. Walang epekto kung hindi Identification/Fill-in-Blank, o
  // kung nasagot na (`isAnswered`).
  useEffect(() => {
    if (!socket || !pin) return;
    if (!(isIdentification || isFillBlank)) return;
    if (isAnswered) return;

    const timeoutId = setTimeout(() => {
      socket.emit('answer-draft', { pin, questionIndex, answer: identInput });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [identInput, isIdentification, isFillBlank, isAnswered, socket, pin, questionIndex]);

  // Para sa fill-in-the-blank, naka-embed na yung "_____" placeholder sa
  // loob mismo ng question text (galing sa AI generation) — kaya dito na
  // lang natin ito papalitan ng totoong sagot pagdating ng revealedAnswer,
  // sa halip na maglagay ng hiwalay na "clue" na text sa ibaba.
  const displayQuestionText = (() => {
    if (isFillBlank && revealedAnswer) {
      return currentQuestion?.question?.replace(/_{3,}/g, revealedAnswer);
    }
    return currentQuestion?.question;
  })();

  // Circular timer ring math
  const RADIUS = 52;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const dashOffset = CIRCUMFERENCE * (1 - timerPercent / 100);

  // Mute/unmute lang ng BACKGROUND MUSIC — hindi kasama dito ang correct/
  // wrong sound effects, sadya, dahil sabi ni Kei background audio lang
  // ang gusto niyang ma-mute/unmute.
  const [bgMuted, setBgMuted] = useState(false);
  const toggleBgMute = () => {
    if (!bgMusicRef.current) return;
    bgMusicRef.current.muted = !bgMusicRef.current.muted;
    setBgMuted(bgMusicRef.current.muted);
  };

  const MuteButton = () => (
    <button
      type="button"
      className="bgm-mute-btn"
      onClick={toggleBgMute}
      aria-label={bgMuted ? 'Unmute background music' : 'Mute background music'}
      title={bgMuted ? 'Unmute background music' : 'Mute background music'}
    >
      {bgMuted ? '🔇' : '🔊'}
    </button>
  );

  const TimerRing = () => (
    <div className={`timer-ring-wrap ${isUrgent ? 'danger' : ''}`}>
      <svg className="timer-ring-svg" viewBox="0 0 120 120">
        <circle className="timer-ring-bg" cx="60" cy="60" r={RADIUS} />
        <circle
          className="timer-ring-fill"
          cx="60"
          cy="60"
          r={RADIUS}
          style={{
            strokeDasharray: CIRCUMFERENCE,
            strokeDashoffset: dashOffset,
          }}
        />
      </svg>
      <span className="timer-ring-label">{timer}</span>
    </div>
  );

  // SCREEN: Game Finished
  if (gameFinished) {
    return (
      <motion.div
        className="arena-panel"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="results-page">
          <p className="round-label">FINAL RESULTS</p>

          <div className="rankings-list">
            {finalRankings.map((player, index) => (
              <motion.div
                key={player.id}
                className={`rank-row ${index === 0 ? 'first-place' : ''}`}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <span className="rank-pos">{getOrdinal(index + 1)}</span>
                <span className="rank-name">
                  {player.name}
                  {player.id === socket?.id ? ' (You)' : ''}
                </span>
                <span className="rank-score">{player.score}</span>
              </motion.div>
            ))}
          </div>

          <button
            className="exit-btn"
            onClick={() => {
              localStorage.removeItem('itfun_roomPin');
              localStorage.removeItem('itfun_playerName');
              localStorage.removeItem('itfun_isHost');
              localStorage.removeItem('itfun_sessionTime');
              navigate('/pvp-quiz');
            }}
          >
            Exit
          </button>
        </div>
      </motion.div>
    );
  }

  // SCREEN: Round Results
  if (showRoundResults) {
    return (
      <motion.div
        className="arena-panel"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <MuteButton />
        <div className="results-page">
          <p className="round-label">{getOrdinal(currentRound).toUpperCase()} ROUND</p>

          <div className="rankings-list">
            {rankings.map((player, index) => (
              <motion.div
                key={player.id}
                className={`rank-row ${index === 0 ? 'first-place' : ''}`}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <span className="rank-pos">{getOrdinal(index + 1)}</span>
                <span className="rank-name">
                  {player.name}
                  {player.id === socket?.id ? ' (You)' : ''}
                </span>
                <span className="rank-score">{player.score}</span>
              </motion.div>
            ))}
          </div>

          <p className="next-hint">Next question coming up...</p>
        </div>
      </motion.div>
    );
  }

  // SCREEN: Waiting
  if (!currentQuestion) {
    return (
      <div className="arena-panel">
        <MuteButton />
        <div className="arena-loading">
          <AnimatePresence mode="wait">
            {countdown ? (
              <motion.p
                key={countdown}
                className="countdown-number"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.4 }}
                transition={{ duration: 0.3 }}
              >
                {countdown}
              </motion.p>
            ) : (
              <motion.p key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                Waiting for the quiz to start...
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // SCREEN: Question
  return (
    <motion.div
      className="arena-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <TimerRing />
      <MuteButton />

      <div className="arena-body">

        <span className="question-progress">
          Question {questionIndex + 1} of {totalQuestions}
        </span>

        <AnimatePresence mode="wait">
          <motion.div
            key={questionIndex}
            className="question-box"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p className="question-text">{displayQuestionText}</p>
          </motion.div>
        </AnimatePresence>

        <div className={`options-grid ${isTrueFalse ? 'two-col' : 'one-col'}`}>

          {/* Multiple Choice */}
          {!isTrueFalse && !isIdentification && !isFillBlank &&
            currentQuestion.options?.map((option, index) => {
              const isRevealed = !!revealedAnswer;
              const isCorrectOption = isRevealed && option === revealedAnswer;
              const isWrongSelected = isRevealed && selectedAnswer === option && option !== revealedAnswer;
              return (
                <motion.button
                  key={index}
                  className={`option-btn ${selectedAnswer === option ? 'selected' : ''} ${isCorrectOption ? 'correct' : ''} ${isWrongSelected ? 'incorrect' : ''}`}
                  onClick={() => handleAnswer(option)}
                  disabled={isAnswered}
                  whileHover={!isAnswered ? { scale: 1.02 } : {}}
                  whileTap={!isAnswered ? { scale: 0.98 } : {}}
                >
                  {option}
                </motion.button>
              );
            })
          }

          {/* True / False */}
          {isTrueFalse && (
            <>
              <motion.button
                className={`option-btn ${selectedAnswer === 'True' ? 'selected' : ''} ${revealedAnswer === 'True' ? 'correct' : ''} ${revealedAnswer && selectedAnswer === 'True' && revealedAnswer !== 'True' ? 'incorrect' : ''}`}
                onClick={() => handleAnswer('True')}
                disabled={isAnswered}
                whileHover={!isAnswered ? { scale: 1.02 } : {}}
                whileTap={!isAnswered ? { scale: 0.98 } : {}}
              >
                True
              </motion.button>
              <motion.button
                className={`option-btn ${selectedAnswer === 'False' ? 'selected' : ''} ${revealedAnswer === 'False' ? 'correct' : ''} ${revealedAnswer && selectedAnswer === 'False' && revealedAnswer !== 'False' ? 'incorrect' : ''}`}
                onClick={() => handleAnswer('False')}
                disabled={isAnswered}
                whileHover={!isAnswered ? { scale: 1.02 } : {}}
                whileTap={!isAnswered ? { scale: 0.98 } : {}}
              >
                False
              </motion.button>
            </>
          )}

          {/* Identification / Fill in blank */}
          {(isIdentification || isFillBlank) && (
            <div className="ident-wrap">
              <input
                className={`ident-input ${
                  revealedAnswer
                    ? (selectedAnswer || '').trim().toUpperCase() === revealedAnswer.trim().toUpperCase()
                      ? 'correct'
                      : 'incorrect'
                    : ''
                }`}
                type="text"
                placeholder="Type your answer here..."
                value={
                  revealedAnswer
                    ? revealedAnswer.toUpperCase()
                    : identInput.toUpperCase()
                }
                onChange={(e) => setIdentInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && identInput.trim() && !isAnswered) {
                    handleAnswer(identInput.trim());
                  }
                }}
                disabled={isAnswered}
                autoFocus
              />
              <button
                className="option-btn"
                onClick={() => {
                  if (identInput.trim() && !isAnswered) handleAnswer(identInput.trim());
                }}
                disabled={isAnswered || !identInput.trim()}
              >
                Submit Answer
              </button>
            </div>
          )}
        </div>

        {isAnswered && (
          <motion.p
            className="answered-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            ✅ Answer submitted! Waiting for others...
          </motion.p>
        )}

      </div>
    </motion.div>
  );
}

export default QuizArena;