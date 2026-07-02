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
  const [startTime, setStartTime] = useState(Date.now());

  useEffect(() => {
    if (!pin) {
      navigate('/pvp-quiz');
      return;
    }
    if (!socket) return;

    console.log('🔌 QuizArena socket connected:', socket.id);

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
      setStartTime(Date.now());
      setCurrentRound(data.questionIndex + 1);
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
      setShowRoundResults(true);
    });

    socket.on('quiz-finished', (data) => {
      console.log('🏁 Quiz finished:', data);
      setFinalRankings(data.rankings);
      setPlayers(data.players || []);
      setGameFinished(true);
      setShowRoundResults(false);
    });

    socket.on('room-closed', () => {
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
    const timeTaken = (Date.now() - startTime) / 1000;
    setSelectedAnswer(answer);
    setIsAnswered(true);

    console.log('📤 Submitting answer:', { pin, questionIndex, answer });

    socket.emit('submit-answer', {
      pin,
      questionIndex,
      answer,
      timeTaken: Math.min(timeTaken, 30),
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

          <button className="exit-btn" onClick={() => navigate('/pvp-quiz')}>
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
          </motion.div>
        </AnimatePresence>

        <div className={`options-grid ${currentQuestion.type === 'true-false' ? 'two-col' : 'one-col'}`}>

          {/* Multiple Choice */}
          {currentQuestion.type !== 'true-false' &&
           currentQuestion.type !== 'identification' &&
           currentQuestion.type !== 'fill-in-blank' &&
            currentQuestion.options?.map((option, index) => (
              <motion.button
                key={index}
                className={`option-btn ${selectedAnswer === option ? 'selected' : ''}`}
                onClick={() => handleAnswer(option)}
                disabled={isAnswered}
                whileHover={!isAnswered ? { scale: 1.02 } : {}}
                whileTap={!isAnswered ? { scale: 0.98 } : {}}
              >
                {option}
              </motion.button>
            ))
          }

          {/* True / False */}
          {currentQuestion.type === 'true-false' && (
            <>
              <motion.button
                className={`option-btn ${selectedAnswer === 'True' ? 'selected' : ''}`}
                onClick={() => handleAnswer('True')}
                disabled={isAnswered}
                whileHover={!isAnswered ? { scale: 1.02 } : {}}
                whileTap={!isAnswered ? { scale: 0.98 } : {}}
              >
                True
              </motion.button>
              <motion.button
                className={`option-btn ${selectedAnswer === 'False' ? 'selected' : ''}`}
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
                className="ident-input"
                type="text"
                placeholder="Type your answer here..."
                value={identInput}
                onChange={(e) => setIdentInput(e.target.value)}
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