import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './select_module.css';

import panel1 from '../assets/panel1.webp';
import panel2 from '../assets/panel2.jpg';
import panel3 from '../assets/panel3.webp';
import panel4 from '../assets/panel4.avif';
import panel5 from '../assets/panel5.webp';
import panel6 from '../assets/panel6.webp';
import panel7 from '../assets/panel7.webp';
import panel8 from '../assets/panel8.png';

const modules = [
  { id: 1, img: panel1, label: 'Introduction to Computers and History of Computers' },
  { id: 2, img: panel2, label: 'Types of Computer and Their Uses' },
  { id: 3, img: panel3, label: 'Number Systems and Conversions' },
  { id: 4, img: panel4, label: 'Hardware Components, Input and Output Devices, and Basic PC-Building' },
  { id: 5, img: panel5, label: 'Types of Software' },
  { id: 6, img: panel6, label: 'Networking Fundamentals' },
  { id: 7, img: panel7, label: 'Microsoft Office Applications' },
  { id: 8, img: panel8, label: 'Application of Computers in Different Fields' },
];

function SelectModule() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

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
    navigate('/select-type', { state: { module: selected } });
  };

  return (
    <motion.div
      className="sm-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="sm-title">Select Module</h2>

      <div className="sm-grid">
        {modules.map((mod) => {
          const isSelected = selected?.id === mod.id;
          return (
            <motion.div
              key={mod.id}
              className={`sm-card ${isSelected ? 'sm-card-selected' : ''}`}
              onClick={() => setSelected(mod)}
              animate={{
                scale: isSelected ? 1.05 : 1,
                y: isSelected ? -3 : 0,
              }}
              whileHover={{ y: -3, boxShadow: '0 8px 20px rgba(0,0,0,0.2)' }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            >
              <img
                src={mod.img}
                alt={mod.label}
                className="sm-card-img"
              />
              <span className="sm-card-label">{mod.label}</span>

              <AnimatePresence>
                {isSelected && (
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