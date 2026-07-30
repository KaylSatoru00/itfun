import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useSocket } from '../socket_context';
import { useUser } from '../user_context';
import './quiz_arena.css';

// Owl mascot perched on the chalkboard. Alternates its idle animation by
// round: odd rounds it blinks, even rounds it does a little hop. Both are
// disabled under prefers-reduced-motion.
function OwlMascot({ mode, reduce }) {
  const isJump = mode === 'jump' && !reduce;
  const isBlink = mode === 'blink' && !reduce;
  const eyeAnim = isBlink ? { scaleY: [1, 1, 0.12, 1] } : { scaleY: 1 };
  const eyeTrans = isBlink
    ? { duration: 3.4, repeat: Infinity, times: [0, 0.9, 0.95, 1], ease: 'easeInOut' }
    : { duration: 0 };
  const eyeStyle = { transformBox: 'fill-box', transformOrigin: 'center' };
  return (
    <motion.div
      className="arena-owl"
      aria-hidden="true"
      animate={isJump ? { y: [0, -15, 0] } : { y: 0 }}
      transition={isJump ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut', times: [0, 0.4, 1] } : { duration: 0 }}
    >
      <span className="arena-owl-bubble">Go for it! 💪</span>
      <svg viewBox="0 0 64 74" className="arena-owl-svg">
        <path d="M14 16 L24 8 L26 24 Z" fill="#7a5030" />
        <path d="M50 16 L40 8 L38 24 Z" fill="#7a5030" />
        <ellipse cx="32" cy="42" rx="24" ry="26" fill="#a4703f" />
        <ellipse cx="32" cy="49" rx="15.5" ry="17" fill="#e7c49b" />
        <motion.g style={eyeStyle} animate={eyeAnim} transition={eyeTrans}>
          <circle cx="24" cy="35" r="9" fill="#fff" stroke="#c98a4a" strokeWidth="2" />
          <circle cx="25" cy="36" r="4.4" fill="#241009" />
          <circle cx="26.6" cy="34.4" r="1.3" fill="#fff" />
        </motion.g>
        <motion.g style={eyeStyle} animate={eyeAnim} transition={eyeTrans}>
          <circle cx="40" cy="35" r="9" fill="#fff" stroke="#c98a4a" strokeWidth="2" />
          <circle cx="39" cy="36" r="4.4" fill="#241009" />
          <circle cx="40.6" cy="34.4" r="1.3" fill="#fff" />
        </motion.g>
        <path d="M32 41 L28 47 L36 47 Z" fill="#f0a12e" />
      </svg>
    </motion.div>
  );
}

// Room decor behind the question — a window, a wooden desk/floor strip,
// and a couple of props. Purely decorative.
function RoomDecor() {
  return (
    <>
      <div className="arena-room-window" aria-hidden="true" />
      <span className="arena-room-plant" aria-hidden="true">🪴</span>
      <span className="arena-room-books" aria-hidden="true">📚</span>
      <div className="arena-room-desk" aria-hidden="true" />
    </>
  );
}

// Deterministic avatar color + initials for leaderboard rows/podium.
function avatarColor(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 58%, 46%)`;
}
function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const str = parts.slice(0, 2).map((w) => w[0] || '').join('');
  return str.toUpperCase() || '?';
}

// 1 -> "1st", 2 -> "2nd", 11 -> "11th", etc.
function getOrdinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Tween a number from `from` to `to` over `duration` ms (ease-out cubic).
// Used on the leaderboard so each player's score visibly counts up while the
// rows re-sort. Snaps straight to `to` when reduced motion is preferred.
function AnimatedScore({ from, to, duration = 1100, delay = 0, reduce = false }) {
  const [val, setVal] = useState(reduce ? to : from);
  useEffect(() => {
    if (reduce || from === to) { setVal(to); return; }
    let raf;
    const start = performance.now() + delay;
    const tick = (now) => {
      const t = (now - start) / duration;
      if (t < 0) { raf = requestAnimationFrame(tick); return; }
      const p = t >= 1 ? 1 : 1 - Math.pow(1 - t, 3);
      setVal(Math.round(from + (to - from) * p));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, to, duration, delay, reduce]);
  return <>{val}</>;
}

// Quizizz/Quiz.com-style moving leaderboard. Rows first appear at their
// PREVIOUS standings, then slide up/down into their new positions (Framer
// `layout`) while the scores count up from the old total to the new one.
//   props: rankings   = new order, sorted by new score (each has id/name/score)
//          prevScores = { [id]: scoreAtEndOfPreviousRound }
function RankingBoard({ rankings, prevScores, socketId, reduce }) {
  // Order the rows by the PREVIOUS scores for the opening frame.
  const oldOrder = useMemo(
    () => rankings.slice().sort(
      (a, b) => (prevScores[b.id] || 0) - (prevScores[a.id] || 0)
    ),
    [rankings, prevScores]
  );
  const [order, setOrder] = useState(oldOrder);
  const [revealed, setRevealed] = useState(false);

  // Hold on the old standings for a beat, then flip to the new order so the
  // slide + count-up read as a deliberate "ranking change" moment.
  useEffect(() => {
    setOrder(oldOrder);
    setRevealed(false);
    const t = setTimeout(() => { setOrder(rankings); setRevealed(true); },
      reduce ? 0 : 750);
    return () => clearTimeout(t);
  }, [rankings, oldOrder, reduce]);

  return (
    <div className="rankings-list medal-rows">
      {order.map((player) => {
        const pos = order.findIndex((p) => p.id === player.id);
        const tier = pos === 0 ? 'gold' : pos === 1 ? 'silver' : pos === 2 ? 'bronze' : '';
        const medal = pos === 0 ? '🥇' : pos === 1 ? '🥈' : pos === 2 ? '🥉' : '';
        const prev = prevScores[player.id] || 0;
        return (
          <motion.div
            key={player.id}
            layout={reduce ? false : 'position'}
            transition={{ layout: { type: 'spring', stiffness: 520, damping: 34 } }}
            className={`rank-row ${tier ? `medal ${tier}` : ''} ${player.id === socketId ? 'is-you' : ''}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="rank-pos">{getOrdinal(pos + 1)}</span>
            {tier
              ? <span className="rank-medal" aria-hidden="true">{medal}</span>
              : <span className="rank-medal-spacer" aria-hidden="true" />}
            <span className="rank-av" style={{ background: avatarColor(player.id || player.name) }}>
              {initials(player.name)}
            </span>
            <span className="rank-name">
              {player.name}
              {player.id === socketId ? ' (You)' : ''}
            </span>
            <span className="rank-score">
              <AnimatedScore
                from={prev}
                to={player.score}
                delay={revealed ? 0 : 750}
                reduce={reduce}
              />
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

function QuizArena() {
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useSocket();
  const { user } = useUser();
  const reduce = useReducedMotion();

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
  // Player totals as they stood at the END of the previous round — the
  // leaderboard animates each row from here up to the new total.
  const [prevScores, setPrevScores] = useState({});
  const prevScoresRef = useRef({});
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

  // Server-client clock offset (server-authoritative sync). Kino-compute
  // ito isang beses sa pagdating ng 'quiz-started' (may kasamang
  // `serverTime` mula sa server clock). Ang offset na 'to ang ginagamit
  // pagtapos ng countdown para makuha yung tamang bgm loop position — iisang
  // "ground truth" (server clock) na lang ang reference ng lahat ng
  // players, hindi na yung kanya-kanyang device clock nila.
  const clockOffsetRef = useRef(0);

  // Reusable na "sync + play" function — dapat ITO LAGI ang gamitin sa
  // anumang pagtawag ng bgMusicRef.play(), kahit saan pa manggaling
  // (mount-time attempt, countdown-end attempt, o fallback click/touchstart
  // listener), dahil dito lang nangyayari yung pag-compute ng tamang loop
  // position gamit ang server-corrected time.
  //
  // Bakit importante 'to: sa mobile browsers (lalo na iOS Safari, strict
  // Chrome mobile), madalas ma-block ng autoplay policy yung play() call na
  // nasa loob ng setInterval countdown, kasi hindi ito itinuturing na
  // "direktang" konektado sa isang totoong click/tap. Dati, yung fallback
  // listener na nag-uunlock nito ay plain play() lang ang tinatawag — kaya
  // nagsisimula ang bgm sa maling posisyon (o sa 0) sa cellphone, samantalang
  // tuloy-tuloy na yung sa computer (na hindi na-block). Sa pag-gamit ng
  // parehong function sa lahat ng play attempts, kahit kailan talaga
  // ma-unlock sa cellphone, tama pa rin ang posisyon niya sa loop.
  const playSyncedBgm = () => {
    const music = bgMusicRef.current;
    if (!music) return;

    const syncPosition = () => {
      const duration = music.duration;
      if (duration && isFinite(duration) && duration > 0) {
        const serverNow = Date.now() + clockOffsetRef.current;
        music.currentTime = (serverNow / 1000) % duration;
      }
      // Kung wala pang available na duration (hal. mabagal ang metadata
      // load), i-skip na lang ang sync at mag-play mula sa kasalukuyang
      // posisyon — mas mabuti pa ring may tumugtog kaysa mag-error at
      // walang bgm.
    };

    syncPosition();
    music.play().catch(() => {
      // Naka-block ng autoplay policy. Huling safety net: hintayin ang
      // susunod na click/tap para i-unlock — pero sa oras na 'yon, i-sync
      // muna ULIT ang posisyon (server time na naman ang basehan) bago
      // mag-play, para hindi lumihis sa ibang players.
      const resumeOnInteraction = () => {
        syncPosition();
        music.play().catch(() => {});
      };
      window.addEventListener('click', resumeOnInteraction, { once: true });
      window.addEventListener('touchstart', resumeOnInteraction, { once: true });
    });
  };

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
  //
  // Async na ito ngayon, at sadyang in-await ang ctx.resume() bago mag-
  // connect/play — dati, hindi ito naka-await, kaya kung na-"suspend" ng
  // browser yung AudioContext (nangyayari ito kusa kapag matagal walang
  // tumutunog, part ng power-saving policy), pumapasok agad ang .play()
  // habang hindi pa talaga tapos ang pag-resume ng context, resulta:
  // tahimik lang — walang error, pero walang naririnig na tunog. Ito yung
  // dahilan ng random/paminsan-minsang "walang sound" na naeexperience.
  const playBoostedSfx = async (url, gain = 1.8) => {
    try {
      if (!sfxAudioCtxRef.current) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        sfxAudioCtxRef.current = new AudioContextClass();
      }
      const ctx = sfxAudioCtxRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const audioEl = new Audio(url);
      const source = ctx.createMediaElementSource(audioEl);
      const gainNode = ctx.createGain();
      gainNode.gain.value = gain;
      source.connect(gainNode).connect(ctx.destination);
      await audioEl.play();
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
      // Fresh game — everyone starts from 0 for the leaderboard animation.
      prevScoresRef.current = {};
      setPrevScores({});

      // Server-authoritative clock offset: kung magkano ang pagkakaiba ng
      // server clock (data.serverTime) sa sarili nating device clock sa
      // sandaling 'to. Ginagamit natin 'to mamaya para i-convert ang
      // sariling Date.now() papuntang "server time" — kaya kahit magkaiba
      // ang settings/timezone/drift ng bawat device, iisang ground-truth
      // clock na lang (server) ang pinagbabasehan ng lahat ng players.
      if (typeof data.serverTime === 'number') {
        clockOffsetRef.current = data.serverTime - Date.now();
      }

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
          // Gamitin ang reusable playSyncedBgm — kino-compute nito ang
          // tamang loop position gamit ang server-corrected time bago
          // mag-play, at kung ma-block ng mobile autoplay policy, may sarili
          // itong click/touchstart fallback na muling nag-sync bago mag-play
          // (tingnan yung definition ng function sa itaas).
          playSyncedBgm();
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
      // Snapshot the totals from the round that just ended (kept in a ref
      // across rounds) so the board can start each row at its old score and
      // count up; then remember the NEW totals for the next round.
      setPrevScores(prevScoresRef.current);
      const nextScores = {};
      data.rankings.forEach((r) => { nextScores[r.id] = r.score; });
      prevScoresRef.current = nextScores;
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
    // Siguraduhing maaga nang naka-load yung metadata (duration) — kailangan
    // ito bago matapos yung 3-segundong countdown, dahil doon natin
    // ginagamit yung duration para ma-compute yung synced loop position.
    music.preload = 'auto';
    // Nilagyan ko na lang ito ng mas mababang volume (dati 0.5) dahil
    // sobrang lakas pa rin siya kahit kasabay na ng ibang sounds ng laro —
    // 0.15 na lang para background ambiance lang ang dating, hindi
    // nangingibabaw sa sound effects.
    music.volume = 0.15;
    bgMusicRef.current = music;

    // Gamitin ang reusable playSyncedBgm dito rin (sa halip na hiwalay na
    // plain play()/fallback), para iisang pinagmumulan lang ng sync logic
    // ang meron tayo kahit saan pa mangaling ang play attempt. Sa mount
    // time, malamang 0 pa lang ang clockOffsetRef (hindi pa dumarating ang
    // 'quiz-started' sa ganitong point), kaya effectively same lang ito sa
    // dating behavior dito — pero kung sakaling ma-block ito ng autoplay
    // policy at ma-unlock lang sa fallback click pagkatapos na ng
    // 'quiz-started', tama pa rin ang gagamiting offset sa sync.
    playSyncedBgm();

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

  const timerPercent = (timer / maxTimer) * 100;
  const isUrgent = timer <= 5;

  // Live "points if you answer now" — mirrors the backend stepped scoring
  // (scoring.service.js): full marks in the first bucket, then −10 per bucket.
  // Shown inside the timer ring so it ticks 100 → 10 alongside the countdown.
  const livePoints = (() => {
    const mt = maxTimer || 30;
    const t = Math.min(Math.max(mt - timer, 0), mt);
    const stepSec = mt / 10;
    const p = 100 - 10 * Math.max(0, Math.ceil((t - stepSec) / stepSec));
    return Math.max(0, Math.min(100, p));
  })();

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
      className={`bgm-mute-btn ${bgMuted ? 'is-muted' : ''}`}
      onClick={toggleBgMute}
      aria-label={bgMuted ? 'Unmute background music' : 'Mute background music'}
      title={bgMuted ? 'Unmute background music' : 'Mute background music'}
    >
      <span className="mute-icon" aria-hidden="true">{bgMuted ? '🔇' : '🔊'}</span>
      <span className="mute-label">{bgMuted ? 'Muted' : 'Sound'}</span>
    </button>
  );

  const Wordmark = () => (
    <div className="arena-wordmark" aria-hidden="true">
      ITFun <b>⚔ Arena</b>
    </div>
  );

  const TimerRing = () => (
    <div className={`timer-ring-wrap ${isUrgent ? 'danger' : ''}`}>
      <svg className="timer-ring-svg" viewBox="0 0 120 120">
        <defs>
          <linearGradient id="timer-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#C8102E" />
            <stop offset="100%" stopColor="#A50034" />
          </linearGradient>
        </defs>
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
      <span className="timer-ring-label">
        <span className="timer-ring-sec">{timer}</span>
        <span className="timer-ring-pts">{livePoints} PTS</span>
      </span>
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
        <Wordmark />
        <div className="results-page results-big">
          <p className="round-label">FINAL RESULTS</p>

          {/* Podium: gold #1 (centre, crowned), silver #2, bronze #3 */}
          <div className="podium">
            {[1, 0, 2].map((rankIdx) => {
              const player = finalRankings[rankIdx];
              if (!player) return null;
              const tier = rankIdx === 0 ? 'gold' : rankIdx === 1 ? 'silver' : 'bronze';
              return (
                <motion.div
                  key={player.id}
                  className={`ped ped-${rankIdx + 1} ${tier}`}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: rankIdx === 0 ? 0.1 : 0.24, type: 'spring', stiffness: 220, damping: 22 }}
                >
                  {rankIdx === 0 && <div className="ped-crown">👑</div>}
                  <span className="ped-av" style={{ background: avatarColor(player.id || player.name) }}>
                    {initials(player.name)}
                  </span>
                  <span className="ped-name">
                    {player.name}{player.id === socket?.id ? ' (You)' : ''}
                  </span>
                  <span className="ped-score">{player.score}</span>
                  <div className="ped-block">{rankIdx + 1}</div>
                </motion.div>
              );
            })}
          </div>

          {/* Everyone from 4th place down */}
          {finalRankings.length > 3 && (
            <div className="rankings-list">
              {finalRankings.slice(3).map((player, i) => (
                <motion.div
                  key={player.id}
                  className="rank-row"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                >
                  <span className="rank-pos">{getOrdinal(i + 4)}</span>
                  <span className="rank-av" style={{ background: avatarColor(player.id || player.name) }}>
                    {initials(player.name)}
                  </span>
                  <span className="rank-name">
                    {player.name}
                    {player.id === socket?.id ? ' (You)' : ''}
                  </span>
                  <span className="rank-score">{player.score}</span>
                </motion.div>
              ))}
            </div>
          )}

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
        <Wordmark />
        <MuteButton />
        <div className="results-page results-big">
          <p className="round-label">{getOrdinal(currentRound).toUpperCase()} ROUND</p>

          <RankingBoard
            key={currentRound}
            rankings={rankings}
            prevScores={prevScores}
            socketId={socket?.id}
            reduce={reduce}
          />

          <p className="next-hint">Next question coming up...</p>
        </div>
      </motion.div>
    );
  }

  // SCREEN: Waiting
  if (!currentQuestion) {
    return (
      <div className="arena-panel">
        <Wordmark />
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
      <Wordmark />
      <TimerRing />
      <MuteButton />
      <RoomDecor />

      <div className="arena-body">

        <div className="arena-progress">
          <div className="progress-dots" aria-hidden="true">
            {Array.from({ length: totalQuestions || 0 }).map((_, i) => (
              <span key={i} className={`prog-dot ${i <= questionIndex ? 'on' : ''}`} />
            ))}
          </div>
          <span className="question-progress">
            Question {questionIndex + 1} of {totalQuestions}
          </span>
        </div>

        <div className="question-stage">
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
          <OwlMascot mode={currentRound % 2 === 1 ? 'blink' : 'jump'} reduce={reduce} />
        </div>

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
                  whileHover={!isAnswered ? { scale: 1.01 } : {}}
                  whileTap={!isAnswered ? { scale: 0.98 } : {}}
                >
                  <span className="option-radio" aria-hidden="true">
                    {isCorrectOption ? '✓' : isWrongSelected ? '✕' : String.fromCharCode(65 + index)}
                  </span>
                  <span className="option-text">{option}</span>
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
                <span className="tf-icon" aria-hidden="true">✓</span>
                <span className="tf-label">TRUE</span>
              </motion.button>
              <motion.button
                className={`option-btn ${selectedAnswer === 'False' ? 'selected' : ''} ${revealedAnswer === 'False' ? 'correct' : ''} ${revealedAnswer && selectedAnswer === 'False' && revealedAnswer !== 'False' ? 'incorrect' : ''}`}
                onClick={() => handleAnswer('False')}
                disabled={isAnswered}
                whileHover={!isAnswered ? { scale: 1.02 } : {}}
                whileTap={!isAnswered ? { scale: 0.98 } : {}}
              >
                <span className="tf-icon" aria-hidden="true">✕</span>
                <span className="tf-label">FALSE</span>
              </motion.button>
            </>
          )}

          {/* Identification / Fill in blank */}
          {(isIdentification || isFillBlank) && (
            <div className="ident-wrap">
              <span className="ident-label">Type your answer</span>
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
                className="ident-submit"
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