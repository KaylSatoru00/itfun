import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../socket_context';
import './quiz_arena.css';

function QuizArena() {
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useSocket();

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

  useEffect(() => {
    if (!pin) {
      navigate('/pvp-quiz');
      return;
    }
    if (!socket) return;

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
      socket.emit('rejoin-room', { pin, playerName: savedName }, (response) => {
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
    });

    socket.on('new-question', (data) => {
      console.log('📨 New question received:', data.questionIndex);
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
    };
  }, [socket, pin, navigate]);

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

  // Circular timer ring math
  const RADIUS = 52;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const dashOffset = CIRCUMFERENCE * (1 - timerPercent / 100);

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
        <div className="arena-loading">
          <p>Waiting for the quiz to start...</p>
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
            <p className="question-text">{currentQuestion.question}</p>
            {currentQuestion.type === 'fill-in-blank' && (
              <p className="blank-clue">
                {revealedAnswer
                  ? revealedAnswer.toUpperCase()
                  : currentQuestion.blankPattern}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        <div className={`options-grid ${currentQuestion.type === 'true-false' ? 'two-col' : 'one-col'}`}>

          {/* Multiple Choice */}
          {currentQuestion.type !== 'true-false' &&
           currentQuestion.type !== 'identification' &&
           currentQuestion.type !== 'fill-in-blank' &&
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
          {currentQuestion.type === 'true-false' && (
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
          {(currentQuestion.type === 'identification' ||
            currentQuestion.type === 'fill-in-blank') && (
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