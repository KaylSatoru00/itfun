import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './select_type.css';

import choiceImg from '../assets/choice.png';
import tfImg      from '../assets/tf.png';
import identImg   from '../assets/identification.png';
import fillImg    from '../assets/fill.png';
import mixImg     from '../assets/mix.png';

const quizTypes = [
  { id: 'multiple-choice', label: 'Multiple Choice',    img: choiceImg },
  { id: 'true-or-false',   label: 'True or False',      img: tfImg     },
  { id: 'identification',  label: 'Identification',     img: identImg  },
  { id: 'fill-in-blank',   label: 'Fill-in-the-Blank',  img: fillImg   },
  { id: 'mixed',           label: 'Mixed Type',         img: mixImg    },
];

function SelectType() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedModule = location.state?.module ?? null;

  const [selected, setSelected] = useState(null);

  const handleGenerate = () => {
    if (!selected) return;
    navigate('/create-room', {
      state: { module: selectedModule, quizType: selected },
    });
  };

  return (
    <motion.div
      className="st-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="st-title">Select Quiz Type</h2>

      <div className="st-grid">
        {quizTypes.map((type) => {
          const isSelected = selected?.id === type.id;
          return (
            <motion.div
              key={type.id}
              className={`st-card ${isSelected ? 'st-card-selected' : ''} ${type.id === 'mixed' ? 'st-card-wide' : ''}`}
              onClick={() => setSelected(type)}
              animate={{ scale: isSelected ? 1.05 : 1, y: isSelected ? -3 : 0 }}
              whileHover={{ y: -3, boxShadow: '0 8px 20px rgba(0,0,0,0.2)' }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            >
              <img src={type.img} alt={type.label} className="st-card-img" />
              <span className="st-card-label">{type.label}</span>

              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    className="st-card-check"
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

      <div className="st-bottom">
        <button className="st-btn st-btn-back" onClick={() => navigate('/select-module')}>
          <span>«</span> BACK
        </button>
        <button
          className={`st-btn st-btn-generate ${!selected ? 'st-btn-disabled' : ''}`}
          onClick={handleGenerate}
          disabled={!selected}
        >
          GENERATE <span>»</span>
        </button>
      </div>
    </motion.div>
  );
}

export default SelectType;