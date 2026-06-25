// Gamified1.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import bgImage    from '../assets/back.jpg';


import abacus     from '../assets/abacus.jpg';
import napiers    from '../assets/napiers.jpg';
import pascaline  from '../assets/pascaline.jpg';
import stepped    from '../assets/stepped.jpg';
import difference from '../assets/difference.jpg';
import analytical from '../assets/analytical.jpg';
import tabulating from '../assets/tabulating.jpg';
import mark       from '../assets/mark.jpg';
import ibm        from '../assets/ibm.jpg';

const CORRECT_ORDER = [
  { id: 'abacus',     src: abacus,     label: 'Abacus' },
  { id: 'napiers',    src: napiers,    label: "Napier's Bones" },
  { id: 'pascaline',  src: pascaline,  label: 'Pascaline' },
  { id: 'stepped',    src: stepped,    label: 'Stepped Reckoner' },
  { id: 'difference', src: difference, label: 'Difference Engine' },
  { id: 'analytical', src: analytical, label: 'Analytical Engine' },
  { id: 'tabulating', src: tabulating, label: 'Tabulating Machine' },
  { id: 'mark',       src: mark,       label: 'Harvard Mark I' },
  { id: 'ibm',        src: ibm,        label: 'IBM PC' },
];

const TOTAL_SECONDS = 180;

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function formatTime(s) {
  const m   = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export default function Gamified1() {
  const navigate = useNavigate();

  const [bank,       setBank]       = useState(() => shuffle(CORRECT_ORDER));
  const [slots,      setSlots]      = useState(Array(9).fill(null));
  const [timeLeft,   setTimeLeft]   = useState(TOTAL_SECONDS);
  const [phase,      setPhase]      = useState('waiting'); // waiting | playing | gameover | congrats
  const [wrongSlots, setWrongSlots] = useState([]);
  const [dragging,   setDragging]   = useState(null);
  const [dragOver,   setDragOver]   = useState(null);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const [muted, setMuted] = useState(false);

  // Audio — only play after user starts
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.35;
    audio.loop = true;
    if (phase === 'playing') {
      audio.play().catch(() => {});
    } else if (phase === 'waiting') {
      audio.pause();
    }
  }, [phase]);

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(m => !m);
  };

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); setPhase('gameover'); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const timerColor = timeLeft <= 30 ? '#e74c3c' : timeLeft <= 60 ? '#f39c12' : '#fff';

  // Drag handlers
  const onDragStart = (e, item, from, index) => {
    setDragging({ item, from, index });
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e, zone, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver({ zone, index });
  };
  const onDragLeave = () => setDragOver(null);
  const onDrop = useCallback((e, zone, index) => {
    e.preventDefault();
    setDragOver(null);
    if (!dragging) return;
    const { item, from, index: fromIndex } = dragging;

    if (zone === 'slot') {
      const currentInSlot = slots[index];
      setSlots(prev => {
        const next = [...prev];
        next[index] = item;
        if (from === 'slot') next[fromIndex] = currentInSlot;
        return next;
      });
      if (from === 'bank') {
        setBank(b => b.filter(x => x.id !== item.id));
        if (currentInSlot) setBank(b => [...b, currentInSlot]);
      }
    }
    if (zone === 'bank' && from === 'slot') {
      setSlots(prev => { const n = [...prev]; n[fromIndex] = null; return n; });
      setBank(b => [...b, item]);
    }
    setDragging(null);
  }, [dragging, slots]);
  const onDragEnd = () => { setDragging(null); setDragOver(null); };

  // Validate
  const handleCheck = () => {
    if (slots.some(s => s === null)) return;
    const wrong = slots.reduce((acc, s, i) => {
      if (!s || s.id !== CORRECT_ORDER[i].id) acc.push(i);
      return acc;
    }, []);
    if (wrong.length === 0) {
      clearInterval(timerRef.current);
      setPhase('congrats');
    } else {
      setWrongSlots(wrong);
      setTimeout(() => { clearInterval(timerRef.current); setPhase('gameover'); }, 900);
    }
  };

  // Start game
  const handleStart = () => setPhase('playing');

  // Restart — go back to waiting screen
  const handleRestart = () => {
    setBank(shuffle(CORRECT_ORDER));
    setSlots(Array(9).fill(null));
    setTimeLeft(TOTAL_SECONDS);
    setWrongSlots([]);
    setPhase('waiting');
  };

  const allFilled = slots.every(s => s !== null);

  return (
    <div style={s.page}>

      {/* Background audio */}
      <audio ref={audioRef} src={bgMusic} />

      {/* Header — your original */}
      <div style={s.header}>
        <button onClick={() => navigate(-1)} style={s.backBtn}>← Back</button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          <span style={s.headerEyebrow}>GAMIFIED QUIZ</span>
          <h1 style={s.headerTitle}>Introduction to Computers and History of Computers</h1>
        </div>
      </div>

      {/* Outer centering area */}
      <div style={s.gamePanel}>

        {/* 1580×800 Panel */}
        <div style={s.panel}>

        {/* START SCREEN overlay */}
        {phase === 'waiting' && (
          <div style={s.startOverlay}>
            <div style={s.startCard}>
              <button style={s.startBtn} onClick={handleStart}>
                ▶ START GAME
              </button>
            </div>
          </div>
        )}

        {/* Game content — blurred when waiting */}
        <div style={{ ...s.gameContent, filter: phase === 'waiting' ? 'blur(4px)' : 'none', pointerEvents: phase === 'waiting' ? 'none' : 'auto' }}>

        {/* Top bar: timer + mute */}
        <div style={s.topBar}>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ ...s.timer, color: timerColor }}>⏱ {formatTime(timeLeft)}</span>
            <button onClick={toggleMute} style={s.muteBtn} title={muted ? 'Unmute' : 'Mute'}>
              {muted ? '🔇' : '🔊'}
            </button>
          </div>
        </div>

        {/* Drop Slots */}
        <div style={s.slotsRow}>
          {slots.map((item, i) => {
            const isWrong = wrongSlots.includes(i);
            const isOver  = dragOver?.zone === 'slot' && dragOver?.index === i;
            return (
              <div
                key={i}
                style={{
                  ...s.slot,
                  borderColor: isWrong ? '#e74c3c' : isOver ? '#f39c12' : item ? '#2ecc71' : '#bbb',
                  background:  isWrong ? 'rgba(231,76,60,0.15)' : isOver ? 'rgba(243,156,18,0.15)' : 'rgba(255,255,255,0.75)',
                  boxShadow:   isOver  ? '0 0 10px rgba(243,156,18,0.4)' : '0 2px 6px rgba(0,0,0,0.07)',
                }}
                onDragOver={e => onDragOver(e, 'slot', i)}
                onDragLeave={onDragLeave}
                onDrop={e    => onDrop(e, 'slot', i)}
              >
                <span style={s.slotNum}></span>
                {item
                  ? <img
                      src={item.src} alt={item.label} draggable
                      onDragStart={e => onDragStart(e, item, 'slot', i)}
                      onDragEnd={onDragEnd}
                      style={s.slotImg}
                    />
                  : <span style={s.slotQ}>{i + 1}</span>
                }
              </div>
            );
          })}
        </div>

        {/* Image Bank */}
        <div style={s.bankWrap}>
          <div
            style={{
              ...s.bankRow,
              borderColor: dragOver?.zone === 'bank' ? '#f39c12' : '#ddd',
            }}
            onDragOver={e => onDragOver(e, 'bank', -1)}
            onDragLeave={onDragLeave}
            onDrop={e    => onDrop(e, 'bank', -1)}
          >
            {bank.length === 0
              ? <span style={s.bankEmpty}>All images placed! ✔</span>
              : bank.map(item => (
                  <div
                    key={item.id} draggable
                    onDragStart={e => onDragStart(e, item, 'bank', null)}
                    onDragEnd={onDragEnd}
                    style={{
                      ...s.bankCard,
                      opacity: dragging?.item?.id === item.id ? 0.35 : 1,
                    }}
                  >
                    <img src={item.src} alt={item.label} style={s.bankImg} />
                  </div>
                ))
            }
          </div>
        </div>

        {/* Check button */}
        <div style={s.checkRow}>
          <button
            onClick={handleCheck}
            disabled={!allFilled}
            style={{ ...s.checkBtn, opacity: allFilled ? 1 : 0.45, cursor: allFilled ? 'pointer' : 'not-allowed' }}
          >
            ✅ Check My Answer
          </button>
        </div>

        </div> {/* end gameContent */}
        </div> {/* end panel */}
      </div>

      {/* Game Over Modal */}
      {phase === 'gameover' && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <span style={s.modalIcon}>💀</span>
            <h2 style={{ ...s.modalTitle, color: '#A50034' }}>Game Over!</h2>
            <p style={s.modalSub}>
              {timeLeft === 0
                ? "Time's up! Better luck next time."
                : 'Some images were in the wrong order. Try again!'}
            </p>
            <div style={s.modalBtns}>
              <button style={s.btnPrimary}   onClick={handleRestart}>🔄 Restart</button>
              <button style={s.btnSecondary} onClick={() => navigate(-1)}>✖ Quit</button>
            </div>
          </div>
        </div>
      )}

      {/* Congrats Modal */}
      {phase === 'congrats' && (
        <div style={s.overlay}>
          <div style={{ ...s.modal, borderColor: '#2ecc71' }}>
            <span style={s.modalIcon}>🎉</span>
            <h2 style={{ ...s.modalTitle, color: '#27ae60' }}>Congratulations!</h2>
            <p style={s.modalSub}>You arranged all 9 inventions in the correct order!</p>
            <div style={s.modalBtns}>
              <button style={s.btnPrimary}   onClick={handleRestart}>🔄 Retake</button>
              <button style={s.btnSecondary} onClick={() => navigate(-1)}>🚪 Exit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const s = {
  page: {
    width: '100vw', height: '100vh',
    display: 'flex', flexDirection: 'column',
    background: '#1a1a2e',
    fontFamily: 'Arial, sans-serif',
    overflow: 'hidden',
  },
  // Header — matches your original exactly
  header: {
    background: '#A50034',
    padding: '14px 20px',
    display: 'flex', alignItems: 'center', gap: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    flexShrink: 0,
  },
  backBtn: {
    padding: '7px 16px', borderRadius: 20, border: '2px solid #fff',
    background: 'transparent', color: '#fff', fontWeight: 600,
    cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap',
  },
  headerEyebrow: {
    fontSize: 10, fontWeight: 'bold', color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2, textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 16, fontWeight: 'bold', color: '#fff',
    margin: 0, lineHeight: 1.3,
  },
  // Outer centering wrapper
  gamePanel: {
    flex: 1, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    padding: '20px', overflow: 'auto',
    background: 'transparent',
  },
  // The 1580×800 game panel — with background image
  panel: {
    position: 'relative',
    width: 'min(1580px, calc(100vw - 40px))',
    height: 'min(800px, calc(100vh - 120px))',
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    borderRadius: 20,
    boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
    border: '2px solid rgba(255,255,255,0.3)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 14, padding: '24px 20px',
    overflow: 'auto',
  },
  topBar: {
    width: '100%', maxWidth: 1200,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  instruction: { fontSize: 14, color: '#555' },
  timer: { fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums', transition: 'color 0.4s' },
  // Slots
  slotsRow: {
    display: 'flex', gap: 10, flexWrap: 'wrap',
    justifyContent: 'center', width: '100%', maxWidth: 1400,
  },
  slot: {
    width: 120, height: 120,
    border: '2px dashed', borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative', transition: 'all 0.18s', flexShrink: 0,
    background: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(6px)',
  },
  slotNum: {
    position: 'absolute', top: 3, left: 6,
    fontSize: 11, color: '#999', fontWeight: 700,
  },
  slotImg: {
    width: '86%', height: '86%', objectFit: 'cover',
    borderRadius: 7, cursor: 'grab',
  },
  slotQ: { fontSize: 32, color: 'rgba(255,255,255,0.6)', fontWeight: 800 },
  // Bank
  bankWrap: {
    width: '100%', maxWidth: 1400,
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  bankLabel: {
    fontSize: 11, fontWeight: 700, color: '#999',
    letterSpacing: 2, textTransform: 'uppercase',
  },
  bankRow: {
    display: 'flex', flexWrap: 'wrap', gap: 8,
    justifyContent: 'center', alignItems: 'center',
    minHeight: 106,
    background: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(6px)',
    border: '2px dashed', borderRadius: 12,
    padding: '10px 14px', transition: 'border-color 0.18s',
  },
  bankCard: {
    width: 115, height: 115, borderRadius: 8,
    overflow: 'hidden', cursor: 'grab',
    border: '2px solid #ddd',
  },
  bankImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' },
  bankEmpty: { color: '#aaa', fontStyle: 'italic', fontSize: 14 },
  // Check
  checkRow: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  checkBtn: {
    padding: '12px 36px', fontSize: 15, fontWeight: 700,
    background: '#A50034', color: '#fff',
    border: 'none', borderRadius: 50,
    boxShadow: '0 4px 14px rgba(165,0,52,0.35)',
  },
  checkHint: { fontSize: 12, color: '#aaa' },
  // Game content wrapper (blurred before start)
  gameContent: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 14, transition: 'filter 0.3s',
  },
  // Start screen
  startOverlay: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 10, borderRadius: 20,
  },
  startCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startTitle: {
    margin: 0, fontSize: 32, fontWeight: 800,
    color: '#fff', letterSpacing: 1,
  },
  startSub: {
    margin: 0, fontSize: 15, color: 'rgba(255,255,255,0.75)',
    lineHeight: 1.7,
  },
  startBtn: {
    marginTop: 8,
    padding: '14px 48px', fontSize: 18, fontWeight: 800,
    background: 'linear-gradient(135deg, #A50034, #ff4d7d)',
    color: '#fff', border: 'none', borderRadius: 50,
    cursor: 'pointer', letterSpacing: 1,
    boxShadow: '0 4px 20px rgba(165,0,52,0.5)',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  muteBtn: {
    fontSize: 20, background: 'rgba(0,0,0,0.35)',
    border: '2px solid rgba(255,255,255,0.5)',
    borderRadius: '50%', width: 38, height: 38,
    cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, color: '#fff',
  },
  // Modal
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 999, backdropFilter: 'blur(4px)',
  },
  modal: {
    background: '#fff', border: '3px solid #A50034',
    borderRadius: 20, padding: '40px 48px',
    textAlign: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
    maxWidth: 380, width: '90%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
  },
  modalIcon:  { fontSize: 52 },
  modalTitle: { margin: 0, fontSize: 26, fontWeight: 800 },
  modalSub:   { margin: 0, color: '#666', fontSize: 14, lineHeight: 1.6 },
  modalBtns:  { display: 'flex', gap: 12, marginTop: 6 },
  btnPrimary: {
    padding: '11px 26px', fontSize: 14, fontWeight: 700,
    background: '#A50034', color: '#fff',
    border: 'none', borderRadius: 50, cursor: 'pointer',
  },
  btnSecondary: {
    padding: '11px 26px', fontSize: 14, fontWeight: 700,
    background: 'transparent', color: '#888',
    border: '2px solid #ccc', borderRadius: 50, cursor: 'pointer',
  },
};