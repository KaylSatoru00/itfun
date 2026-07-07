// select_type.jsx - COMPLETE FILE
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../firebase';
import './select_type.css';

import choiceImg from '../assets/choice.png';
import tfImg      from '../assets/tf.png';
import identImg   from '../assets/identification.png';
import fillImg    from '../assets/fill.png';
import mixImg     from '../assets/mix.png';

const quizTypes = [
  { id: 'multiple', label: 'Multiple Choice', img: choiceImg },
  { id: 'true-false', label: 'True or False', img: tfImg },
  { id: 'identification', label: 'Identification', img: identImg },
  { id: 'fill-in-blank', label: 'Fill-in-the-Blank', img: fillImg },
  { id: 'mixed', label: 'Mixed Type', img: mixImg },
];

function SelectType() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedModule = location.state?.module ?? null;

  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [remainingGenerates, setRemainingGenerates] = useState(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    fetch(`${API_URL}/api/generate-quiz/quota/${uid}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setRemainingGenerates(data.remaining);
      })
      .catch((err) => console.error('❌ Quota fetch error:', err));
  }, []);

  const handleGenerate = async () => {
    if (!selected) return;

    const uid = auth.currentUser?.uid;
    if (!uid) {
      setError('Please log in again to generate a quiz.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use the full URL with the backend port
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${API_URL}/api/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: selectedModule.id,
          lessonId: selectedModule.lesson || 'lesson1',
          quizType: selected.id,
          questionCount: 15,
          uid,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRemainingGenerates(data.remainingGenerates);
        const questionsParam = encodeURIComponent(JSON.stringify(data.questions));
        navigate('/waiting-lobby', {
          state: {
            module: selectedModule,
            quizType: selected,
            questions: data.questions,
            mode: 'host',
          }
        });
      } else if (data.limitReached) {
        setRemainingGenerates(0);
        setLoading(false);
      } else {
        setError(data.error || 'Failed to generate quiz. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ Generation error:', err);
      setError('Failed to generate quiz. Please try again.');
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="st-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="st-title">Select Quiz Type</h2>
      <p className="st-subtitle">
        Module: <strong>{selectedModule?.label || 'Selected'}</strong>
      </p>

      <div className="st-grid">
        {quizTypes.map((type) => {
          const isSelected = selected?.id === type.id;
          return (
            <motion.div
              key={type.id}
              className={`st-card ${isSelected ? 'st-card-selected' : ''} ${type.id === 'mixed' ? 'st-card-wide' : ''}`}
              onClick={() => {
                setSelected(type);
                setError('');
              }}
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

      {error && (
        <motion.p 
          className="st-error"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          ❌ {error}
        </motion.p>
      )}

      {remainingGenerates !== null && (
        <p className="st-quota-indicator">
          {remainingGenerates > 0
            ? `${remainingGenerates} generate${remainingGenerates === 1 ? '' : 's'} left today`
            : 'No generates left today — try again tomorrow'}
        </p>
      )}

      <div className="st-bottom">
        <button className="st-btn st-btn-back" onClick={() => navigate('/select-module')}>
          <span>«</span> BACK
        </button>
        <button
          className={`st-btn st-btn-generate ${!selected || loading || remainingGenerates === 0 ? 'st-btn-disabled' : ''}`}
          onClick={handleGenerate}
          disabled={!selected || loading || remainingGenerates === 0}
        >
          {loading ? '⏳ Generating...' : 'GENERATE QUIZ'}
          {!loading && <span>»</span>}
        </button>
      </div>
    </motion.div>
  );
}

export default SelectType;