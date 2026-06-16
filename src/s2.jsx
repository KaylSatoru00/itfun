// s2.jsx — Language & Types of Computers with Their Uses
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import binaryImg from './assets/binary.webp';
import pcImg from './assets/pc.jpg';
import workstationImg from './assets/workstation.jpg';
import minicomputerImg from './assets/minicomputers.webp';
import mainframeImg from './assets/mainframe.jpg';
import supercomputerImg from './assets/supercomputers.jpg';
import './s2.css';

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

function FlipCard({ image, title, backText }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      className={`chap-flip-card ${flipped ? 'flipped' : ''}`}
      onClick={() => setFlipped(f => !f)}
    >
      <div className="chap-flip-card-inner">
        {/* Front */}
        <div className="chap-flip-card-front">
          {image
            ? <img src={image} alt={title} />
            : (
              <div className="chap-flip-card-front-placeholder">
                <span style={{ fontSize: 48 }}>🖥️</span>
                <span>{title}</span>
              </div>
            )
          }
          <div className="chap-flip-card-front-overlay">
            <span>Flip for description</span>
            <span>↩</span>
          </div>
        </div>
        {/* Back */}
        <div className="chap-flip-card-back">
          <span className="chap-flip-card-back-icon">💡</span>
          <p>{backText}</p>
          <span className="chap-flip-card-back-hint">Tap to flip back</span>
        </div>
      </div>
    </div>
  );
}

function CircleProgress({ percent = 0, active = false }) {
  const radius = 18;
  const stroke = 3;
  const normalizedRadius = radius - stroke;
  const circumference = 2 * Math.PI * normalizedRadius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <svg width={radius * 2} height={radius * 2} className="chap-circle-progress">
      <circle
        stroke={active ? 'rgba(255,255,255,0.3)' : '#f0d0d5'}
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        stroke={active ? '#fff' : '#A50034'}
        fill="transparent"
        strokeWidth={stroke}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        r={normalizedRadius}
        cx={radius}
        cy={radius}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="7"
        fontWeight="bold"
        fill={active ? '#fff' : '#A50034'}
      >
        {percent}%
      </text>
    </svg>
  );
}

const navItems = [
  { key: 'language',      label: 'Language of Computer' },
  { key: 'personal',      label: 'Personal Computers (PC)' },
  { key: 'workstation',   label: 'Workstation' },
  { key: 'minicomputer',  label: 'Minicomputer, Mainframe & Supercomputer' },
];

function Chapter2() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('language');
  const [langOpenIndex, setLangOpenIndex] = useState(null);
  const [wsOpenIndex, setWsOpenIndex] = useState(null);
  const [miniOpenIndex, setMiniOpenIndex] = useState(null);

  const progress = {
    language:     0,
    personal:     0,
    workstation:  0,
    minicomputer: 0,
  };

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
        <button className="chap-back-btn" onClick={() => navigate('/learning-modules')}>
          ← Back
        </button>
        <div className="chap-header-title">
          <span className="chap-chapter-label">LEARNING MODULE 2</span>
          <h1 className="chap-title">Language & Types of Computers with Their Uses</h1>
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
                <CircleProgress percent={progress[key]} active={activeSection === key} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Right Card */}
        <div className="chap-card-main">

          {/* ── Language of Computer ── */}
          {activeSection === 'language' && (
            <>
              {/* Section Header */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title">Language of Computer</h2>
                <p className="chap-section-subtitle">Binary System</p>
              </div>

              {/* Binary Image */}
              <div className="s2-img-wrapper">
                <img
                  src={binaryImg}
                  alt="Binary System"
                  className="s2-binary-img"
                />
              </div>

              {/* Body Text */}
              <div className="s2-body-block">
                <p className="s2-body-text">
                  Binary System is the language of the computer because it composed of 2 bits that is suited to electronic device.
                </p>
                <p className="s2-body-text">
                  This is because it has only two basic symbol which can represent the electrical state, it is either <strong>ON(1)</strong>, <strong>OFF(0)</strong>, either <strong>YES(1)</strong>, or <strong>NO(0)</strong>, High Low, True, False.
                </p>
              </div>

              {/* Dropdowns */}
              <div className="chap-accordion" style={{ marginTop: 24 }}>
                {[
                  {
                    title: 'Bit',
                    description: 'The smallest unit of measurement in a computer. Came from the word binary digit (0 to 1).',
                  },
                  {
                    title: 'Byte',
                    description: 'Unit of measurement that denotes one character.',
                  },
                ].map((item, i) => (
                  <AccordionItem
                    key={i}
                    title={item.title}
                    description={item.description}
                    isOpen={langOpenIndex === i}
                    onToggle={() => setLangOpenIndex(langOpenIndex === i ? null : i)}
                  />
                ))}
              </div>
            </>
          )}

          {/* ── Personal Computers (PC) ── */}
          {activeSection === 'personal' && (
            <>
              {/* Section Header */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title">Personal Computer</h2>
              </div>

              {/* Flip Card centered */}
              <div className="s2-img-wrapper" style={{ marginTop: 28 }}>
                <FlipCard
                  image={pcImg}
                  title="PC (Personal Computer)"
                  backText="It is a single user computer system having moderately powerful microprocessor."
                />
              </div>

              {/* Body Text */}
              <div className="s2-body-block" style={{ marginTop: 28 }}>
                <p className="s2-body-text">
                  A PC can be defined as a small, relatively inexpensive computer designed for an individual user.
                </p>
                <p className="s2-body-text">
                  PCs are based on the microprocessor technology that enables manufacturers to put an entire CPU on one chip.
                </p>
                <p className="s2-body-text">
                  Businesses use personal computers for word processing, accounting, desktop publishing, and for running spreadsheet and database management applications.
                </p>
              </div>
            </>
          )}

          {/* ── Workstation ── */}
          {activeSection === 'workstation' && (
            <>
              {/* Section Header */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title">Work Stations</h2>
              </div>

              {/* Flip Card */}
              <div className="s2-img-wrapper" style={{ marginTop: 28 }}>
                <FlipCard
                  image={workstationImg}
                  title="Workstation"
                  backText="Workstation is a computer used for engineering applications (CAD/CAM), desktop publishing, software development, and other such types of applications which require a moderate amount of computing power and relatively high quality graphics capabilities."
                />
              </div>

              {/* Dropdown */}
              <div className="chap-accordion" style={{ marginTop: 28 }}>
                <AccordionItem
                  title="WorkStation"
                  description="It is also a single user computer system which is similar to personal computer but have more powerful microprocessor."
                  isOpen={wsOpenIndex === 0}
                  onToggle={() => setWsOpenIndex(wsOpenIndex === 0 ? null : 0)}
                />
              </div>
            </>
          )}

          {/* ── Minicomputer, Mainframe & Supercomputer ── */}
          {activeSection === 'minicomputer' && (
            <>

              {/* ── Mini Computers ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title">Mini Computers</h2>
              </div>

              <div className="s2-img-wrapper" style={{ marginTop: 20 }}>
                <img src={minicomputerImg} alt="Mini Computer" className="s2-binary-img" />
              </div>

              <div className="s2-body-block" style={{ marginTop: 16, textAlign: 'center' }}>
                <p className="s2-body-text">
                  It is a midsize multi-processing system capable of supporting up to 250 users simultaneously.
                </p>
              </div>

              <div className="chap-accordion" style={{ marginTop: 16 }}>
                <AccordionItem
                  title="Mini Computer"
                  description="It is a multi-user computer system which is capable of supporting hundreds of users simultaneously."
                  isOpen={miniOpenIndex === 0}
                  onToggle={() => setMiniOpenIndex(miniOpenIndex === 0 ? null : 0)}
                />
              </div>

              {/* ── Divider ── */}
              <div className="s2-section-divider" />

              {/* ── Main Frame ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title">Main Frame</h2>
              </div>

              <div className="s2-img-wrapper" style={{ marginTop: 20 }}>
                <img src={mainframeImg} alt="Mainframe" className="s2-binary-img" />
              </div>

              <div className="s2-body-block" style={{ marginTop: 16, textAlign: 'center' }}>
                <p className="s2-body-text">
                  Mainframe is very large in size and is an expensive computer capable of supporting hundreds or even thousands of users simultaneously. Mainframe executes many programs concurrently and supports many simultaneous execution of programs.
                </p>
              </div>

              <div className="chap-accordion" style={{ marginTop: 16 }}>
                <AccordionItem
                  title="Main Frame"
                  description="It is a multi-user computer system which is capable of supporting hundreds of users simultaneously. Software technology is different from minicomputer."
                  isOpen={miniOpenIndex === 1}
                  onToggle={() => setMiniOpenIndex(miniOpenIndex === 1 ? null : 1)}
                />
              </div>

              {/* ── Divider ── */}
              <div className="s2-section-divider" />

              {/* ── Super Computer ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title">Super Computer</h2>
              </div>

              <div className="s2-img-wrapper" style={{ marginTop: 20 }}>
                <img src={supercomputerImg} alt="Supercomputer" className="s2-binary-img" />
              </div>

              <div className="s2-body-block" style={{ marginTop: 16, textAlign: 'center' }}>
                <p className="s2-body-text">
                  Supercomputers are one of the fastest computers currently available. Supercomputers are very expensive and are employed for specialized applications that require immense amount of mathematical calculations (number crunching).
                </p>
              </div>

              <div className="chap-accordion" style={{ marginTop: 16 }}>
                <AccordionItem
                  title="Supercomputer"
                  description="It is an extremely fast computer which can execute hundreds of millions of instructions per second."
                  isOpen={miniOpenIndex === 2}
                  onToggle={() => setMiniOpenIndex(miniOpenIndex === 2 ? null : 2)}
                />
              </div>

            </>
          )}

        </div>

      </div>

    </motion.div>
  );
}

export default Chapter2;