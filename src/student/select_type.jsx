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

// `desc` is UI copy only (not sent to the server) — it powers the short
// sub-label on each row in the D4 list. IDs / labels are unchanged so all
// the backend calls (moduleId, quizType) behave exactly as before.
const quizTypes = [
  { id: 'multiple',       label: 'Multiple Choice',    img: choiceImg, desc: 'Pick one correct answer from four options' },
  { id: 'true-false',     label: 'True or False',      img: tfImg,     desc: 'Decide if each statement is true or false' },
  { id: 'identification', label: 'Identification',     img: identImg,  desc: 'Type the exact term being described' },
  { id: 'fill-in-blank',  label: 'Fill-in-the-Blank',  img: fillImg,   desc: 'Complete the sentence with the missing word' },
  { id: 'mixed',          label: 'Mixed Type',         img: mixImg,    desc: 'A blend of all question formats' },
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
      <div className="st-body">
        {/* ── Step timeline rail (desktop) ── */}
        <aside className="step-rail" aria-label="Progress">
          <div className="step-rail-item is-done">
            <div className="step-rail-col">
              <span className="step-rail-dot">✓</span>
              <span className="step-rail-bar" />
            </div>
            <div className="step-rail-text">
              <span className="step-rail-t1">Module</span>
              <span className="step-rail-t2">Pick a topic</span>
            </div>
          </div>
          <div className="step-rail-item is-active">
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
          {/* ── Mobile top progress bars — step 2 active ── */}
          <div className="step-mdots" aria-hidden="true">
            <span className="step-mdot is-active" />
            <span className="step-mdot is-active" />
            <span className="step-mdot" />
          </div>

          <h2 className="st-title">Select Quiz Type</h2>
          <p className="st-subtitle">
            Module: <strong>{selectedModule?.label || 'Selected'}</strong>
          </p>

          <ul className="st-list">
            {quizTypes.map((type) => {
              const isSelected = selected?.id === type.id;
              return (
                <motion.li
                  key={type.id}
                  className={`st-row ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => {
                    setSelected(type);
                    setError('');
                  }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                >
                  <img src={type.img} alt={type.label} className="st-row-thumb" />
                  <div className="st-row-meta">
                    <div className="st-row-name">{type.label}</div>
                    <div className="st-row-sub">{type.desc}</div>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={isSelected ? 'on' : 'off'}
                      className="st-row-radio"
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                      aria-hidden="true"
                    >
                      {isSelected ? '✓' : ''}
                    </motion.span>
                  </AnimatePresence>
                </motion.li>
              );
            })}
          </ul>

          {error && (
            <motion.p
              className="st-error"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              ❌ {error}
            </motion.p>
          )}

          <div className="st-actions">
            {remainingGenerates !== null && (
              <span className="st-quota-indicator">
                {remainingGenerates > 0
                  ? `${remainingGenerates} generate${remainingGenerates === 1 ? '' : 's'} left today`
                  : 'No generates left today — try again tomorrow'}
              </span>
            )}
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
        </section>
      </div>
    </motion.div>
  );
}

export default SelectType;