import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import itfunLogo from '../assets/LOGO_NAMEN.png';

// splash_screen.jsx — water-fill ITFun logo loader.
// Ilagay sa: src/login/splash_screen.jsx
//
// Paano gumagana ang pagpuno: ang LOGO_NAMEN.png mismo ang hugis (CSS mask
// gamit ang alpha ng PNG), kaya kailangang transparent ang background ng logo.
// Tumataas ang tubig sa loob ng hugis, tapos lumalabas ang totoong kulay ng logo.
//
// Timeline (seconds):
//   0.0 – 0.6   lumalabas ang puting bilog (avatar) at ang malabong silhouette ng logo
//   0.6 – 3.4   tumataas ang tubig sa loob ng logo (loader) + ripples
//   3.4         SABAY: pop/pulse + glow + totoong kulay ng logo + burst ripple
//   3.4 – 4.6   lumalawak ang burst habang nakikita ang tapos na logo
//   4.7         onDone() -> fade out ang overlay (exit ng AnimatePresence sa parent)

const CRIMSON = '#c8102e';
const CRIMSON_DEEP = '#a50034';
const PINK = '#ff2929';
const BG = '#0d0d10';

const AVATAR_SIZE = 'min(30vw, 200px)'; // diameter ng puting bilog
const LOGO_INSET = '1%'; // espasyo sa pagitan ng gilid ng bilog at ng logo

const FILL_DELAY = 0.6;
const FILL_DURATION = 2.8;
const SETTLE_AT = FILL_DELAY + FILL_DURATION; // 3.4 — puno na, lumalabas ang kulay
const BURST_AT = SETTLE_AT; // sabay ang burst ripple at ang pop ng logo
const HOLD = 1.3; // gaano katagal nakikita ang pop + burst bago mag-fade ang overlay
const DONE_AT_MS = Math.round((SETTLE_AT + HOLD) * 1000);
const DONE_AT_MS_REDUCED = 900;

// Alon: 12 segments, 100 units bawat isa. Ang pattern ay umuulit kada 200
// units, kaya ang x-drift na -200 ay seamless kapag loop.
const WAVE_PATH = (() => {
  let d = 'M -400 0 Q -350 -14 -300 0';
  for (let x = -200; x <= 800; x += 100) d += ` T ${x} 0`;
  return `${d} V 900 H -400 Z`;
})();

function Logo({ reduce }) {
  if (reduce) {
    return (
      <div style={styles.avatarWrap}>
        <div style={styles.avatar}>
          <div style={styles.logoBox}>
            <img src={itfunLogo} alt="" style={styles.logoImg} draggable={false} />
          </div>
        </div>
      </div>
    );
  }

  return (
    // Panlabas: pasok ng bilog. Panloob: pulse + glow (hiwalay para hindi mag-agawan ang scale).
    <motion.div
      style={styles.avatarWrap}
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <motion.div
        style={styles.avatar}
        animate={{
          scale: [1, 1.05, 1],
          filter: [
            'drop-shadow(0 0 0px rgba(255,90,138,0))',
            'drop-shadow(0 0 26px rgba(255,90,138,0.8))',
            'drop-shadow(0 0 12px rgba(255,90,138,0.4))',
          ],
        }}
        transition={{ delay: SETTLE_AT, duration: 0.8, times: [0, 0.5, 1], ease: 'easeOut' }}
      >
        <div style={styles.logoBox}>
          {/* Silhouette — madilim na anino ng logo sa puting bilog, malabo */}
          <motion.img
            src={itfunLogo}
            alt=""
            draggable={false}
            style={{ ...styles.logoImg, filter: 'brightness(0)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.12 }}
            transition={{ duration: 0.6 }}
          />

          {/* Tubig — naka-mask sa hugis ng logo */}
          <div style={styles.waterMask}>
            <svg
              viewBox="0 0 400 400"
              preserveAspectRatio="none"
              style={{ width: '100%', height: '100%', display: 'block' }}
            >
              <defs>
                <linearGradient
                  id="itfun-water"
                  gradientUnits="userSpaceOnUse"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="420"
                >
                  <stop offset="0%" stopColor={PINK} />
                  <stop offset="100%" stopColor={CRIMSON_DEEP} />
                </linearGradient>
              </defs>

              {/* likod na alon: mas mahinang kulay, kabaligtaran ang direksyon */}
              <motion.g
                initial={{ y: 430 }}
                animate={{ y: -6 }}
                transition={{ delay: FILL_DELAY + 0.1, duration: FILL_DURATION, ease: [0.3, 0.05, 0.3, 1] }}
              >
                <motion.g
                  initial={{ x: -200 }}
                  animate={{ x: 0 }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
                >
                  <path d={WAVE_PATH} fill={CRIMSON} opacity="0.55" />
                </motion.g>
              </motion.g>

              {/* harap na alon */}
              <motion.g
                initial={{ y: 420 }}
                animate={{ y: -12 }}
                transition={{ delay: FILL_DELAY, duration: FILL_DURATION, ease: [0.3, 0.05, 0.3, 1] }}
              >
                <motion.g
                  initial={{ x: 0 }}
                  animate={{ x: -200 }}
                  transition={{ duration: 2.1, repeat: Infinity, ease: 'linear' }}
                >
                  <path d={WAVE_PATH} fill="url(#itfun-water)" />
                </motion.g>
              </motion.g>
            </svg>
          </div>

          {/* Totoong kulay ng logo — lumalabas pagkapuno */}
          <motion.img
            src={itfunLogo}
            alt=""
            draggable={false}
            style={styles.logoImg}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: SETTLE_AT, duration: 0.5 }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

function Ripples({ reduce }) {
  if (reduce) return null;
  return (
    <>
      {[0, 1, 2].map((delay) => (
        <motion.span
          key={delay}
          style={styles.ring}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 4, opacity: [0, 0.6, 0] }}
          transition={{ delay: FILL_DELAY + delay, duration: 3, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
      {/* burst pagkapuno — ito ang "swipe" papunta sa role picker */}
      <motion.span
        style={{ ...styles.ring, borderWidth: 2, borderColor: PINK }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 28, opacity: [0, 0.85, 0] }}
        transition={{ delay: BURST_AT, duration: 1.2, ease: [0.2, 0.7, 0.3, 1] }}
      />
    </>
  );
}

function SplashScreen({ onDone }) {
  const reduce = useReducedMotion();
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const t = setTimeout(
      () => onDoneRef.current?.(),
      reduce ? DONE_AT_MS_REDUCED : DONE_AT_MS
    );
    return () => clearTimeout(t);
  }, [reduce]);

  return (
    <motion.div
      style={styles.root}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: 'easeInOut' } }}
      onClick={() => onDoneRef.current?.()}
      role="status"
      aria-label="Loading ITFun"
    >
      <div style={styles.center}>
        <Ripples reduce={reduce} />
        <Logo reduce={reduce} />
      </div>

      <motion.p
        style={styles.skip}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        Tap to skip
      </motion.p>
    </motion.div>
  );
}

const styles = {
  root: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    cursor: 'pointer',
    background: `radial-gradient(60% 50% at 0% 0%, rgba(200,16,46,0.38), transparent 70%),
      radial-gradient(55% 50% at 100% 100%, rgba(165,0,52,0.35), transparent 70%),
      ${BG}`,
  },
  center: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  avatarWrap: {
    position: 'relative',
    width: AVATAR_SIZE,
    aspectRatio: '1 / 1',
  },
  avatar: {
    position: 'relative',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    background: '#fff',
    boxShadow: '0 10px 36px rgba(0,0,0,0.4)',
  },
  logoBox: {
    position: 'absolute',
    inset: LOGO_INSET,
  },
  logoImg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    userSelect: 'none',
    pointerEvents: 'none',
  },
  // Parehong "contain" at "center" ang img at ang mask, kaya eksaktong
  // magkapatong ang tubig at ang logo kahit anong aspect ratio ng PNG.
  waterMask: {
    position: 'absolute',
    inset: 0,
    WebkitMaskImage: `url("${itfunLogo}")`,
    maskImage: `url("${itfunLogo}")`,
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
  },
  ring: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 120,
    height: 120,
    marginLeft: -60,
    marginTop: -60,
    borderRadius: '50%',
    border: `2px solid ${CRIMSON}`,
    pointerEvents: 'none',
  },
  skip: {
    position: 'absolute',
    bottom: '2rem',
    left: 0,
    right: 0,
    margin: 0,
    textAlign: 'center',
    fontFamily: "'Montserrat', sans-serif",
    fontSize: '0.8rem',
    color: 'rgba(255,255,255,0.4)',
  },
};

export default SplashScreen;