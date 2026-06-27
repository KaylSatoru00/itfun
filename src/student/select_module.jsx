import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../user_context';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import './select_module.css';

import panel1 from '../assets/panel1.webp';
import panel2 from '../assets/panel2.jpg';
import panel3 from '../assets/panel3.webp';
import panel4 from '../assets/panel4.avif';
import panel5 from '../assets/panel5.webp';
import panel6 from '../assets/panel6.webp';
import panel7 from '../assets/panel7.webp';
import panel8 from '../assets/panel8.png';
import panel9 from '../assets/panel9.jpg';

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
      <h2 className="sm-title">Select Module</h2>
      <p className="sm-subtitle">Choose a learning module to generate quiz questions from</p>

      <div className="sm-grid">
        {MODULES.map((mod) => {
          const isSelected = selected?.id === mod.id;
          const isUnlocked = moduleStatus[mod.id]?.unlocked ?? (mod.id === 'module1');
          
          return (
            <motion.div
              key={mod.id}
              className={`sm-card ${isSelected && isUnlocked ? 'sm-card-selected' : ''} ${!isUnlocked ? 'sm-card-locked' : ''}`}
              onClick={() => {
                if (!isUnlocked) {
                  // Show a friendly alert when trying to select a locked module
                  const moduleNum = parseInt(mod.id.replace('module', ''));
                  alert(`Please complete all lessons in Module ${moduleNum - 1} to unlock "${mod.label}" in the Quiz Arena.`);
                  return;
                }
                setSelected(mod);
              }}
              animate={{
                scale: isSelected && isUnlocked ? 1.05 : 1,
                y: isSelected && isUnlocked ? -3 : 0,
              }}
              whileHover={isUnlocked ? { y: -3, boxShadow: '0 8px 20px rgba(0,0,0,0.2)' } : {}}
              whileTap={isUnlocked ? { scale: 0.95 } : {}}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              style={{
                cursor: isUnlocked ? 'pointer' : 'not-allowed',
                opacity: isUnlocked ? 1 : 0.6,
                filter: isUnlocked ? 'none' : 'grayscale(0.7) brightness(0.8)',
                position: 'relative',
              }}
            >
              <img
                src={mod.img}
                alt={mod.label}
                className="sm-card-img"
                style={{
                  filter: !isUnlocked ? 'brightness(0.6)' : 'none',
                }}
              />
              <span className="sm-card-label">{mod.label}</span>

              <AnimatePresence>
                {isSelected && isUnlocked && (
                  <motion.div
                    className="sm-card-check"
                    initial={{ scale: 0, opacity: 0, rotate: -90 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  >
                    ✓
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Locked label ── */}
              {!isUnlocked && (
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  background: 'rgba(200, 16, 46, 0.85)',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  zIndex: 3,
                  letterSpacing: '0.5px',
                }}>
                  LOCKED
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="sm-bottom">
        <button className="sm-btn sm-btn-back" onClick={() => navigate('/pvp-quiz')}>
          <span>«</span> BACK
        </button>
        <button
          className={`sm-btn sm-btn-next ${!selected ? 'sm-btn-disabled' : ''}`}
          onClick={handleNext}
          disabled={!selected}
        >
          NEXT <span>»</span>
        </button>
      </div>
    </motion.div>
  );
}

export default SelectModule;