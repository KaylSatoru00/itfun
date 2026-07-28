import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../user_context';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import './select_module.css';

import panel1 from '../assets/panel1.png';
import panel2 from '../assets/panel2.png';
import panel3 from '../assets/panel3.png';
import panel4 from '../assets/panel4.png';
import panel5 from '../assets/panel5.png';
import panel6 from '../assets/panel6.png';
import panel7 from '../assets/panel7.png';
import panel8 from '../assets/panel8.png';
import panel9 from '../assets/panel9.png';

const MODULES = [
  { id: 'module1', img: panel1, label: 'Introduction to Computers and History of Computers', lesson: 'lesson1' },
  { id: 'module2', img: panel2, label: 'Language & Types of Computers with Their Uses', lesson: 'lesson1' },
  { id: 'module3', img: panel3, label: 'Number System & Conversions', lesson: 'lesson1' },
  { id: 'module4', img: panel4, label: 'Hardware Components, Input and Output Devices & Basic PC-Building', lesson: 'parts' },
  { id: 'module5', img: panel5, label: 'Types of Software', lesson: 'software' },
  { id: 'module6', img: panel6, label: 'Networking Fundamentals', lesson: 'characteristics' },
  { id: 'module7', img: panel7, label: 'Microsoft Office Applications', lesson: 'intro' },
  { id: 'module8', img: panel8, label: 'Application of Computers in Different Fields', lesson: 'applications' },
  { id: 'module9', img: panel9, label: 'Keyboarding', lesson: 'keyboarding' },
];

function SelectModule() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [selected, setSelected] = useState(null);
  const [moduleStatus, setModuleStatus] = useState({});
  const [loading, setLoading] = useState(true);

  // ── Real-time listener for module unlock status ──
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const progressRef = doc(db, 'studentProgress', user.uid);
    const unsub = onSnapshot(progressRef, (snap) => {
      if (!snap.exists()) {
        // First-time student: only module1 unlocked
        const initialStatus = {};
        MODULES.forEach((mod, i) => {
          initialStatus[mod.id] = { unlocked: i === 0 };
        });
        setModuleStatus(initialStatus);
        setLoading(false);
        return;
      }

      const data = snap.data();
      const modules = data.modules || {};
      
      const status = {};
      MODULES.forEach((mod, i) => {
        const modData = modules[mod.id] || {};
        // Module 1 is always unlocked, others follow their stored status
        status[mod.id] = { 
          unlocked: i === 0 ? true : (modData.unlocked ?? false)
        };
      });
      
      setModuleStatus(status);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  useEffect(() => {
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = '#ffffff';
    return () => {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  const handleNext = () => {
    if (!selected) return;
    navigate('/select-type', { 
      state: { 
        module: {
          id: selected.id,
          label: selected.label,
          lesson: selected.lesson
        }
      } 
    });
  };

  // Show loading state
  if (loading) {
    return (
      <div className="sm-panel" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Loading modules...</div>
      </div>
    );
  }

  return (
    <motion.div
      className="sm-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="sm-body">
        {/* ── Step timeline rail (desktop) ── */}
        <aside className="step-rail" aria-label="Progress">
          <div className="step-rail-item is-active">
            <div className="step-rail-col">
              <span className="step-rail-dot">1</span>
              <span className="step-rail-bar" />
            </div>
            <div className="step-rail-text">
              <span className="step-rail-t1">Module</span>
              <span className="step-rail-t2">Pick a topic</span>
            </div>
          </div>
          <div className="step-rail-item">
            <div className="step-rail-col">
              <span className="step-rail-dot">2</span>
              <span className="step-rail-bar" />
            </div>
            <div className="step-rail-text">
              <span className="step-rail-t1">Quiz Type</span>
              <span className="step-rail-t2">Choose format</span>
            </div>
          </div>
          <div className="step-rail-item">
            <div className="step-rail-col">
              <span className="step-rail-dot">3</span>
            </div>
            <div className="step-rail-text">
              <span className="step-rail-t1">Start</span>
              <span className="step-rail-t2">Create room</span>
            </div>
          </div>
        </aside>

        <section className="step-content">
          {/* ── Mobile top progress bars ── */}
          <div className="step-mdots" aria-hidden="true">
            <span className="step-mdot is-active" />
            <span className="step-mdot" />
            <span className="step-mdot" />
          </div>

          <h2 className="sm-title">Select Module</h2>
          <p className="sm-subtitle">Choose a learning module to generate quiz questions from</p>

          <ul className="sm-list">
            {MODULES.map((mod, index) => {
              const isSelected = selected?.id === mod.id;
              const isUnlocked = moduleStatus[mod.id]?.unlocked ?? (mod.id === 'module1');
              const moduleNum = index + 1;

              return (
                <motion.li
                  key={mod.id}
                  className={`sm-row ${isSelected && isUnlocked ? 'is-selected' : ''} ${!isUnlocked ? 'is-locked' : ''}`}
                  onClick={() => {
                    if (!isUnlocked) {
                      alert(`Please complete all lessons in Module ${moduleNum - 1} to unlock "${mod.label}" in the Quiz Arena.`);
                      return;
                    }
                    setSelected(mod);
                  }}
                  whileTap={isUnlocked ? { scale: 0.99 } : {}}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                >
                  <img src={mod.img} alt={mod.label} className="sm-row-thumb" />
                  <div className="sm-row-meta">
                    <div className="sm-row-name">{mod.label}</div>
                    <div className="sm-row-sub">
                      {isUnlocked
                        ? `Module ${moduleNum}`
                        : `Module ${moduleNum} · Locked — finish Module ${moduleNum - 1}`}
                    </div>
                  </div>
                  {!isUnlocked ? (
                    <span className="sm-row-lock" aria-hidden="true">🔒</span>
                  ) : (
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={isSelected ? 'on' : 'off'}
                        className="sm-row-radio"
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.6, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                        aria-hidden="true"
                      >
                        {isSelected ? '✓' : ''}
                      </motion.span>
                    </AnimatePresence>
                  )}
                </motion.li>
              );
            })}
          </ul>

          <div className="sm-actions">
            <button className="sm-btn sm-btn-back" onClick={() => navigate('/pvp-quiz')}>
              <span>«</span> BACK
            </button>
            <div className="sm-actions-spacer" />
            <button
              className={`sm-btn sm-btn-next ${!selected ? 'sm-btn-disabled' : ''}`}
              onClick={handleNext}
              disabled={!selected}
            >
              NEXT <span>»</span>
            </button>
          </div>
        </section>
      </div>
    </motion.div>
  );
}

export default SelectModule;
