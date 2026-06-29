// f3.jsx — Decimal & Binary Number System (Faculty)
import { useEffect, useState } from 'react';
import { useModuleSection } from '../hooks/useModuleSection';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import numberImg from '../assets/number.jpg';
import numbersystemImg from '../assets/numbersystem.webp';
import decimalImg from '../assets/dec.png';
import binaryImg from '../assets/binary.jpg';
import b1Img from '../assets/b1.png';
import b2Img from '../assets/b2.png';
import d1Img from '../assets/d1.png';
import './f3.css';

/* ── Accordion ── */
function AccordionItem({ title, description, isOpen, onToggle }) {
  return (
    <div className="chap-accordion-item">
      <button
        className={`chap-accordion-header ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
      >
        <span>{title}</span>
        <span className="chap-accordion-chevron">{isOpen ? '∧' : '∨'}</span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            className="chap-accordion-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div style={{ padding: '16px 20px', background: '#fff' }}>
              <p style={{ fontSize: 15, color: '#333', lineHeight: 1.7, margin: 0 }}>
                {description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Flip Card — image front, text back ── */
function FlipCard({ frontImage, frontLabel, backText, backIcon = '💡' }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      className={`chap-flip-card ${flipped ? 'flipped' : ''}`}
      onClick={() => setFlipped(f => !f)}
    >
      <div className="chap-flip-card-inner">
        <div className="chap-flip-card-front">
          {frontImage
            ? <img src={frontImage} alt={frontLabel} />
            : (
              <div className="chap-flip-card-front-placeholder">
                <span style={{ fontSize: 48 }}>🔢</span>
                <span>{frontLabel}</span>
              </div>
            )
          }
          <div className="chap-flip-card-front-overlay">
            <span>Flip for description</span>
            <span>↩</span>
          </div>
        </div>
        <div className="chap-flip-card-back">
          <span className="chap-flip-card-back-icon">{backIcon}</span>
          <p>{backText}</p>
          <span className="chap-flip-card-back-hint">Tap to flip back</span>
        </div>
      </div>
    </div>
  );
}

/* ── Flip Card — text front, image back ── */
function FlipCardImageBack({ frontLabel, backImage, backAlt }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      className={`chap-flip-card ${flipped ? 'flipped' : ''}`}
      onClick={() => setFlipped(f => !f)}
    >
      <div className="chap-flip-card-inner">
        <div className="chap-flip-card-front" style={{
          background: 'linear-gradient(160deg,#A50034 0%,#c8102e 100%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '24px 28px', textAlign: 'center'
        }}>
          <p style={{
            fontSize: 22, fontWeight: 'bold', color: '#fff',
            lineHeight: 1.5, margin: 0,
            textTransform: 'uppercase', letterSpacing: '1.5px'
          }}>{frontLabel}</p>
          <div className="chap-flip-card-front-overlay" style={{ background: 'linear-gradient(to top, rgba(80,0,20,0.7) 0%, transparent 100%)' }}>
            <span>Flip to see</span>
            <span>↩</span>
          </div>
        </div>
        <div className="chap-flip-card-back" style={{ padding: 8, background: '#111' }}>
          <img src={backImage} alt={backAlt} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 12 }} />
        </div>
      </div>
    </div>
  );
}

const navItems = [
  { key: 'numbersystem', label: 'Decimal & Binary Number System' },
  { key: 'conversions',  label: 'Number System Conversions (Binary, Decimal)' },
];

function FacultyChapter3() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useModuleSection('numbersystem', ['numbersystem', 'conversions']);
  const [nsOpenIndex, setNsOpenIndex] = useState(null);

  useEffect(() => {
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = '#ffffff';
    return () => {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  return (
    <motion.div
      className="chap-panel"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Header ── */}
      <div className="chap-header">
        <button className="chap-back-btn" onClick={() => navigate('/faculty-modules')}>
          ← Back
        </button>
        <div className="chap-header-title">
          <span className="chap-chapter-label">LEARNING MODULE 3</span>
          <h1 className="chap-title">Number System & Conversions</h1>
        </div>
      </div>

      {/* ── Layout ── */}
      <div className="chap-layout">

        {/* Small Left Card */}
        <div className="chap-card-small">
          <nav className="chap-nav-buttons">
            {navItems.map(({ key, label }) => (
              <button
                key={key}
                className={`chap-nav-btn ${activeSection === key ? 'active' : ''}`}
                onClick={() => setActiveSection(key)}
              >
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Right Card */}
        <div className="chap-card-main">

          {/* ══════════════════════════════════════════
              BUTTON 1 — Decimal & Binary Number System
          ══════════════════════════════════════════ */}
          {activeSection === 'numbersystem' && (
            <>
              {/* ── Number System ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title">Number System</h2>
              </div>

              <div className="s2-img-wrapper">
                <img src={numberImg} alt="Number System" className="s2-binary-img" />
              </div>

              <div className="s2-body-block">
                <p className="s2-body-text">
                  When we type some letters or words, the computer translates them into numbers as computers can understand only numbers.
                </p>
              </div>

              <div className="s2-img-wrapper" style={{ marginTop: 24 }}>
                <FlipCard
                  frontImage={numbersystemImg}
                  frontLabel="Number System"
                  backIcon="🔢"
                  backText="A computer can understand positional number system where there are only a few symbols called digits and these symbols represent different values depending on the position they occupy in the number."
                />
              </div>

              <div className="s2-body-block" style={{ marginTop: 20 }}>
                <p className="s2-body-text" style={{ fontWeight: 'bold', marginBottom: 4 }}>
                  A number system is defined by three factors:
                </p>
                <ul className="s3-bullet-list">
                  <li>The digit</li>
                  <li>The position of the digit in the number</li>
                  <li>The base of the number system (where base is defined as the total number of digits available in the number system).</li>
                </ul>
              </div>

              <div className="chap-accordion" style={{ marginTop: 20 }}>
                {[
                  { title: 'Base 10 — Decimal System',    description: 'This is what we use every day (also called the decimal system). It uses 10 digits: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9.' },
                  { title: 'Base 2 — Binary System',       description: 'This is what computers use (called the binary system). It uses only 2 digits: 0 and 1.' },
                  { title: 'Base 16 — Hexadecimal System', description: 'Often used in programming (called hexadecimal). It uses 16 symbols: 0 to 9 and A to F.' },
                ].map((item, i) => (
                  <AccordionItem
                    key={i}
                    title={item.title}
                    description={item.description}
                    isOpen={nsOpenIndex === i}
                    onToggle={() => setNsOpenIndex(nsOpenIndex === i ? null : i)}
                  />
                ))}
              </div>

              {/* ── Divider ── */}
              <div className="s2-section-divider" />

              {/* ── Decimal Number System ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title">Decimal Number System</h2>
              </div>

              <div className="s2-img-wrapper">
                <img src={decimalImg} alt="Decimal Number System" className="s2-binary-img" />
              </div>

              <div className="s2-body-block">
                <p className="s2-body-text">
                  The number system that we use in our day-to-day life is the decimal number system. Decimal number system has base 10 as it uses 10 digits from 0 to 9.
                </p>
              </div>

              <div className="s2-img-wrapper" style={{ marginTop: 24 }}>
                <FlipCard
                  frontImage={decimalImg}
                  frontLabel="Decimal Number System"
                  backIcon="🔟"
                  backText="In decimal number system, the successive positions to the left of the decimal point represent units, tens, hundreds, thousands and so on."
                />
              </div>

              {/* ── Divider ── */}
              <div className="s2-section-divider" />

              {/* ── Binary Number System ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title">Binary Number System</h2>
              </div>

              <div className="s2-img-wrapper">
                <img src={binaryImg} alt="Binary Number System" className="s2-binary-img" />
              </div>

              <div className="s2-body-block" style={{ marginTop: 8 }}>
                <p className="s2-body-text" style={{ fontWeight: 'bold' }}>
                  Characteristics of binary number system are as follows:
                </p>
                <ul className="s3-bullet-list">
                  <li>Uses two digits, 0 and 1.</li>
                  <li>Also called base 2 number system.</li>
                  <li>Each position in a binary number represents a 0 power of the base (2). Example: 2⁰</li>
                  <li>Last position in a binary number represents a x power of the base (2). Example: 2ˣ where x represents the last position − 1.</li>
                </ul>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════
              BUTTON 2 — Number System Conversions
          ══════════════════════════════════════════ */}
          {activeSection === 'conversions' && (
            <>
              {/* ── Binary to Decimal ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title">Binary to Decimal Number Conversion</h2>
              </div>

              <div className="s2-body-block" style={{ marginTop: 16 }}>
                <p className="s2-body-text">
                  Binary Numbers can be converted into decimal number using an expanded notation in base 2 instead of base 10.
                </p>
                <p className="s2-body-text">
                  <strong>Example:</strong> Binary Number: 10101₂
                </p>
              </div>

              <div className="s3-flipcard-row">
                <FlipCardImageBack
                  frontLabel="BINARY TO DECIMAL NUMBER CONVERSION"
                  backImage={b1Img}
                  backAlt="Binary to Decimal Example 1"
                />
                <FlipCardImageBack
                  frontLabel="BINARY TO DECIMAL NUMBER CONVERSION"
                  backImage={b2Img}
                  backAlt="Binary to Decimal Example 2"
                />
              </div>

              {/* ── Divider ── */}
              <div className="s2-section-divider" />

              {/* ── Decimal to Binary ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title">Decimal to Binary Number Conversion</h2>
              </div>

              <div className="s2-body-block" style={{ marginTop: 16 }}>
                <p className="s2-body-text">
                  Decimal numbers can be converted into binary numbers by dividing it by 2. The remainders are considered as its binary equivalent by reading it upward or the last remainder is the first to be read. You have to neglect the numbers after the decimal point in the quotient.
                </p>
              </div>

              <div className="s3-flipcard-single">
                <FlipCardImageBack
                  frontLabel="DECIMAL TO BINARY NUMBER CONVERSION"
                  backImage={d1Img}
                  backAlt="Decimal to Binary Example"
                />
              </div>
            </>
          )}

        </div>
      </div>
    </motion.div>
  );
}

export default FacultyChapter3;
