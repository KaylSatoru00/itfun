import './auth_shell.css';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import RippleBg from './ripple_bg.jsx';
import kidImg from '../assets/kid.png';
import previewModules from '../assets/first.png';
import previewArena from '../assets/second.png';
import game1 from '../assets/m1.png';
import game2 from '../assets/m3.png';
import game3 from '../assets/m5.png';
import game4 from '../assets/m7.png';
import game5 from '../assets/m8.png';
import game6 from '../assets/m2.png';
import game7 from '../assets/m4.png';
import game8 from '../assets/m6.png';

const GAME_PREVIEWS = [game1, game2, game3, game4, game5, game6, game7, game8];

/**
 * Shared split-screen auth layout: animated dark brand panel on the left,
 * page content (role cards / login forms) on the right. Stacks vertically
 * below 900px. Purely presentational — no auth logic lives here.
 */
function AuthShell({ children }) {
  // "Gamified Quizzes" chip: hovering auto-cycles through the game preview
  // screenshots (m1–m7). Cycling only runs while hovering and resets on leave.
  const [gameIdx, setGameIdx] = useState(0);
  const gameTimer = useRef(null);

  const startGameCycle = () => {
    if (gameTimer.current) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return; // honor reduced motion: show a single static frame
    gameTimer.current = setInterval(() => {
      setGameIdx((i) => (i + 1) % GAME_PREVIEWS.length);
    }, 1100);
  };
  const stopGameCycle = () => {
    clearInterval(gameTimer.current);
    gameTimer.current = null;
    setGameIdx(0);
  };
  useEffect(() => () => clearInterval(gameTimer.current), []);

  return (
    <motion.div
      className="as-wrapper"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeIn' }}
    >
      <div className="as-brand">
        <RippleBg />
        <div className="as-blob as-blob-1" />
        <div className="as-blob as-blob-2" />
        <div className="as-blob as-blob-3" />

        <motion.div
          className="as-brand-content"
          initial={{ opacity: 0, x: -32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h1 className="as-wordmark">
            IT<span className="as-accent">Fun</span>
            <img className="as-kid" src={kidImg} alt="" aria-hidden="true" />
          </h1>
          <p className="as-tagline">IT Fundamentals Made Fun</p>
          <div className="as-chips">
            <span className="as-chip as-chip-preview">
              9 Learning Modules
              <span className="as-chip-pop" aria-hidden="true">
                <img src={previewModules} alt="" />
              </span>
            </span>
            <span className="as-chip as-chip-preview">
              PVP Quiz Arena
              <span className="as-chip-pop" aria-hidden="true">
                <img src={previewArena} alt="" />
              </span>
            </span>
            <span
              className="as-chip as-chip-preview"
              onMouseEnter={startGameCycle}
              onMouseLeave={stopGameCycle}
            >
              Gamified Quizzes
              <span className="as-chip-pop as-chip-pop-game" aria-hidden="true">
                <span className="as-game-frame">
                  <img src={GAME_PREVIEWS[gameIdx]} alt="" />
                </span>
                <span className="as-game-meta">
                  <span className="as-game-dots">
                    {GAME_PREVIEWS.map((_, i) => (
                      <i key={i} className={i === gameIdx ? 'on' : ''} />
                    ))}
                  </span>
                </span>
              </span>
            </span>
          </div>
        </motion.div>
      </div>

      <div className="as-side">{children}</div>
    </motion.div>
  );
}

export default AuthShell;
