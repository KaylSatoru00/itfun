// s7.jsx — Microsoft Office Applications
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './s7.css';

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
   Nav items
─────────────────────────────────────────────*/
const navItems = [
  { key: 'intro',       label: 'Introduction to MS Office' },
  { key: 'powerpoint',  label: 'Microsoft PowerPoint' },
  { key: 'word',        label: 'Microsoft Word' },
  { key: 'excel',       label: 'Microsoft Excel' },
];

/* ════════════════════════════════════════════
   Chapter 7 — Main Component
═════════════════════════════════════════════*/
function Chapter7() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('intro');

  return (
    <motion.div
      className="chap-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Header ── */}
      <div className="chap-header">
        <button className="chap-back-btn" onClick={() => navigate('/learning-modules')}>
          ← Back
        </button>
        <div className="chap-header-title">
          <span className="chap-chapter-label">Chapter 7</span>
          <h1 className="chap-title">Microsoft Office Applications</h1>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="chap-layout">

        {/* ── Left Nav Card ── */}
        <div className="chap-card-small">
          <div className="chap-nav-buttons">
            {navItems.map(item => (
              <button
                key={item.key}
                className={`chap-nav-btn ${activeSection === item.key ? 'active' : ''}`}
                onClick={() => setActiveSection(item.key)}
              >
                <CircleProgress percent={0} active={activeSection === item.key} />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Right Main Card (empty) ── */}
        <div className="chap-card-main">
          <div className="s6-coming-soon">
            <span style={{ fontSize: 48 }}>🚧</span>
            <span>Content coming soon…</span>
          </div>
        </div>

      </div>
    </motion.div>
  );
}

export default Chapter7;



