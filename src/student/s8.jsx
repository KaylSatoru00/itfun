// s8.jsx — Application of Computers in Different Fields
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import businessImg   from '../assets/business.jpg';
import bankingImg    from '../assets/banking.jpg';
import educationImg  from '../assets/education.jpg';
import marketingImg  from '../assets/marketing.jpg';
import militaryImg   from '../assets/military.jpg';
import healthcareImg from '../assets/healthcare.jpg';

import './s8.css';

import { useProgressTracker } from '../hooks/useProgressTracker';

/* ─────────────────────────────────────────────
   Module / Lesson config for Chapter 8
   lesson "applications" has 6 FlipCards
──────────────────────────────────────────────*/
const MODULE_ID = 'module8';
const LESSON_CONFIGS = {
  applications: { totalItems: 6 },
};

/* ────────────────────────────────────────────
   Flip Card — image front, text back
   Calls onFirstFlip(id) once on first flip
─────────────────────────────────────────────*/
function FlipCard({ id, frontImage, frontLabel, backText, backIcon = '💡', frontIcon = '🖥️', onFirstFlip }) {
  const [flipped, setFlipped] = useState(false);
  const [counted, setCounted] = useState(false);

  const handleClick = () => {
    const next = !flipped;
    setFlipped(next);
    if (next && !counted) {
      setCounted(true);
      onFirstFlip?.(id);
    }
  };

  return (
    <div
      className={`chap-flip-card ${flipped ? 'flipped' : ''}`}
      onClick={handleClick}
    >
      <div className="chap-flip-card-inner">
        <div className="chap-flip-card-front">
          {frontImage
            ? <img src={frontImage} alt={frontLabel} />
            : (
              <div className="chap-flip-card-front-placeholder">
                <span style={{ fontSize: 48 }}>{frontIcon}</span>
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

/* ────────────────────────────────────────────
   Circle Progress
─────────────────────────────────────────────*/
function CircleProgress({ percent = 0, active = false }) {
  const radius = 18;
  const stroke = 3;
  const normalizedRadius = radius - stroke;
  const circumference = 2 * Math.PI * normalizedRadius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  return (
    <svg width={radius * 2} height={radius * 2} className="chap-circle-progress">
      <circle stroke={active ? 'rgba(255,255,255,0.3)' : '#f0d0d5'} fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
      <circle stroke={active ? '#fff' : '#A50034'} fill="transparent" strokeWidth={stroke}
        strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={strokeDashoffset}
        strokeLinecap="round" r={normalizedRadius} cx={radius} cy={radius}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize="7" fontWeight="bold" fill={active ? '#fff' : '#A50034'}>{percent}%</text>
    </svg>
  );
}

/* ────────────────────────────────────────────
   Lesson Progress Bar
─────────────────────────────────────────────*/
function LessonProgressBar({ percent }) {
  return (
    <div style={{ marginTop: 6, width: '100%' }}>
      <div style={{
        height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.3)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 4, background: '#fff',
          width: `${percent}%`, transition: 'width 0.4s ease',
        }} />
      </div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)', textAlign: 'right', marginTop: 2 }}>
        {percent}%
      </div>
    </div>
  );
}

const navItems = [
  { key: 'applications', label: 'Application of Computers in Different Fields' },
];

/* ════════════════════════════════════════════
   Chapter 8 — Main Component
═════════════════════════════════════════════*/
function Chapter8() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('applications');

  /* ── Progress tracking hook ── */
  const { lessonProgress, recordInteraction } = useProgressTracker(
    MODULE_ID,
    LESSON_CONFIGS
  );

  const appPct = Math.round(lessonProgress?.applications?.progress ?? 0);

  return (
    <motion.div
      className="chap-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="chap-header">
        <button className="chap-back-btn" onClick={() => navigate('/learning-modules')}>
          ← Back
        </button>
        <div className="chap-header-title">
          <span className="chap-chapter-label">Chapter 8</span>
          <h1 className="chap-title">Application of Computers in Different Fields</h1>
        </div>
      </div>

      <div className="chap-layout">

        {/* ── Left Nav ── */}
        <div className="chap-card-small">
          <div className="chap-nav-buttons">
            {navItems.map(item => {
              const pct = item.key === 'applications' ? appPct : 0;
              return (
                <button
                  key={item.key}
                  className={`chap-nav-btn ${activeSection === item.key ? 'active' : ''}`}
                  onClick={() => setActiveSection(item.key)}
                >
                  <CircleProgress percent={pct} active={activeSection === item.key} />
                  <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                  {activeSection === item.key && (
                    <LessonProgressBar percent={pct} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="chap-card-main">

          {activeSection === 'applications' && (
            <>
              {/* ── Title ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title">Application of Computers in Different Fields</h2>
              </div>

              {/* ════ BUSINESS ════ */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0, marginTop: 20 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 18 }}>In Business</h3>
              </div>

              <div className="s3-flipcard-single" style={{ marginTop: 12 }}>
                <FlipCard
                  id="s8-flip-business"
                  frontImage={businessImg}
                  frontLabel="In Business"
                  backIcon="💼"
                  backText="Computers are widely used in businesses to help manage daily operations and important records. Because computers are fast, accurate, and reliable, they have become an essential tool in business organizations."
                  onFirstFlip={(id) => recordInteraction('applications', id)}
                />
              </div>

              <div className="s2-body-block" style={{ marginTop: 14 }}>
                <p className="s2-body-text">
                  Computers are widely used in businesses to help manage daily operations and important records.
                  Because computers are fast, accurate, and reliable, they have become an essential tool in business organizations.
                </p>
                <p className="s2-body-text" style={{ fontWeight: 600, color: '#A50034' }}>Uses of Computers in Business:</p>
                <ul className="s3-bullet-list">
                  <li>Payroll calculations (employee salaries)</li>
                  <li>Budget preparation</li>
                  <li>Sales analysis</li>
                  <li>Financial forecasting</li>
                  <li>Employee database management</li>
                  <li>Inventory or stock management</li>
                </ul>
                <p className="s2-body-text">
                  <strong>Example:</strong> A company uses a computer to calculate employee salaries and keep track of products in stock.
                </p>
              </div>

              <div className="s2-section-divider" />

              {/* ════ BANKING ════ */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 18 }}>In Banking</h3>
              </div>

              <div className="s3-flipcard-single" style={{ marginTop: 12 }}>
                <FlipCard
                  id="s8-flip-banking"
                  frontImage={bankingImg}
                  frontLabel="In Banking"
                  backIcon="🏦"
                  backText="Banks depend heavily on computers to manage customer accounts and process financial transactions quickly and accurately. From ATM operations to online banking, computers are at the core of modern banking."
                  onFirstFlip={(id) => recordInteraction('applications', id)}
                />
              </div>

              <div className="s2-body-block" style={{ marginTop: 14 }}>
                <p className="s2-body-text">
                  Banks depend heavily on computers to manage customer accounts and process financial transactions quickly and accurately.
                </p>
                <p className="s2-body-text" style={{ fontWeight: 600, color: '#A50034' }}>Uses of Computers in Banking:</p>
                <ul className="s3-bullet-list">
                  <li>Online banking services</li>
                  <li>Account management</li>
                  <li>Recording deposits and withdrawals</li>
                  <li>Calculating interest</li>
                  <li>ATM operations</li>
                </ul>
                <p className="s2-body-text">
                  <strong>Example:</strong> When you withdraw money from an ATM or check your balance through a banking app, a computer processes the transaction.
                </p>
              </div>

              <div className="s2-section-divider" />

              {/* ════ EDUCATION ════ */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 18 }}>In Education</h3>
              </div>

              <div className="s3-flipcard-single" style={{ marginTop: 12 }}>
                <FlipCard
                  id="s8-flip-education"
                  frontImage={educationImg}
                  frontLabel="In Education"
                  backIcon="🎓"
                  backText="Computers have improved education by making learning more interactive and accessible. They are used for teaching, learning, testing, and managing student records — also known as Computer-Based Education (CBE)."
                  onFirstFlip={(id) => recordInteraction('applications', id)}
                />
              </div>

              <div className="s2-body-block" style={{ marginTop: 14 }}>
                <p className="s2-body-text">
                  Computers have improved education by making learning more interactive and accessible.
                  They are used for teaching, learning, testing, and managing student records.
                  The module refers to this as <strong>Computer-Based Education (CBE)</strong>.
                </p>
                <p className="s2-body-text" style={{ fontWeight: 600, color: '#A50034' }}>Uses of Computers in Education:</p>
                <ul className="s3-bullet-list">
                  <li>Online learning</li>
                  <li>Research and assignments</li>
                  <li>Computer-based tests</li>
                  <li>Student performance tracking</li>
                  <li>Educational software</li>
                </ul>
                <p className="s2-body-text">
                  <strong>Example:</strong> Teachers use PowerPoint presentations, while students use computers to research information and submit assignments.
                </p>
              </div>

              <div className="s2-section-divider" />

              {/* ════ MARKETING ════ */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 18 }}>In Marketing</h3>
              </div>

              <div className="s3-flipcard-single" style={{ marginTop: 12 }}>
                <FlipCard
                  id="s8-flip-marketing"
                  frontImage={marketingImg}
                  frontLabel="In Marketing"
                  backIcon="📢"
                  backText="In marketing, computers are used to create advertisements, manage campaigns, and enable home shopping through computerized catalogues that let customers browse products and place orders directly."
                  onFirstFlip={(id) => recordInteraction('applications', id)}
                />
              </div>

              <div className="s2-body-block" style={{ marginTop: 14 }}>
                <p className="s2-body-text" style={{ fontWeight: 600, color: '#A50034' }}>Uses of Computers in Marketing:</p>
                <ul className="s3-bullet-list">
                  <li>
                    <strong>Advertising</strong> — With computers, advertising professionals create art and graphics, write and revise copy,
                    and print and disseminate ads with the goal of selling more products.
                  </li>
                  <li>
                    <strong>At Home Shopping</strong> — Home shopping has been made possible through use of computerised catalogues that
                    provide access to product information and permit direct entry of orders to be filled by the customers.
                  </li>
                </ul>
              </div>

              <div className="s2-section-divider" />

              {/* ════ MILITARY ════ */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 18 }}>In Military</h3>
              </div>

              <div className="s3-flipcard-single" style={{ marginTop: 12 }}>
                <FlipCard
                  id="s8-flip-military"
                  frontImage={militaryImg}
                  frontLabel="In Military"
                  backIcon="🪖"
                  backText="Computers are largely used in defence. Modern tanks, missiles, and weapons employ computerised control systems for precision and coordination."
                  onFirstFlip={(id) => recordInteraction('applications', id)}
                />
              </div>

              <div className="s2-body-block" style={{ marginTop: 14 }}>
                <p className="s2-body-text">
                  Computers are largely used in defence. Modern tanks, missiles, weapons etc. Military also employs computerised control systems.
                </p>
                <p className="s2-body-text" style={{ fontWeight: 600, color: '#A50034' }}>Some military areas where computers are used:</p>
                <ul className="s3-bullet-list">
                  <li>Missile Control</li>
                  <li>Military Communication</li>
                  <li>Military Operation and Planning</li>
                  <li>Smart Weapons</li>
                </ul>
              </div>

              <div className="s2-section-divider" />

              {/* ════ HEALTHCARE ════ */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 18 }}>In Healthcare</h3>
              </div>

              <div className="s3-flipcard-single" style={{ marginTop: 12 }}>
                <FlipCard
                  id="s8-flip-healthcare"
                  frontImage={healthcareImg}
                  frontLabel="In Healthcare"
                  backIcon="🏥"
                  backText="Computers have become an important part in hospitals, labs, and dispensaries — used to keep records of patients and medicines, and in scanning and diagnosing different diseases."
                  onFirstFlip={(id) => recordInteraction('applications', id)}
                />
              </div>

              <div className="s2-body-block" style={{ marginTop: 14 }}>
                <p className="s2-body-text">
                  Computers have become important part in hospitals, labs, and dispensaries. The computers are being used in hospitals
                  to keep the record of patients and medicines. It is also used in scanning and diagnosing different diseases.
                  ECG, EEG, Ultrasounds and CT Scans etc. are also done by computerised machines.
                </p>
                <p className="s2-body-text" style={{ fontWeight: 600, color: '#A50034' }}>Major fields of health care where computers are used:</p>
                <ul className="s3-bullet-list">
                  <li>
                    <strong>Diagnostic System</strong> — Computers are used to collect data and identify cause of illness.
                  </li>
                  <li>
                    <strong>Lab-diagnostic System</strong> — All tests can be done and reports are prepared by computer.
                  </li>
                  <li>
                    <strong>Patient Monitoring System</strong> — These are used to check patient's signs for abnormality such as in Cardiac Arrest, ECG etc.
                  </li>
                  <li>
                    <strong>Pharma Information System</strong> — Computer checks Drug-Labels, Expiry dates, harmful drug's side effects etc.
                  </li>
                  <li>
                    <strong>Surgery</strong> — Nowadays, computers are also used in performing surgery.
                  </li>
                </ul>
              </div>

            </>
          )}

        </div>
      </div>
    </motion.div>
  );
}

export default Chapter8;