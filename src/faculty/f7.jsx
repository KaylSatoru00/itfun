// f7.jsx — Faculty: Microsoft Office Applications
import { useState } from 'react';
import { useModuleSection } from '../hooks/useModuleSection';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './f7.css';

const navItems = [
  { key: 'intro',       label: 'Introduction to MS Office' },
  { key: 'powerpoint',  label: 'Microsoft PowerPoint' },
  { key: 'word',        label: 'Microsoft Word' },
  { key: 'excel',       label: 'Microsoft Excel' },
];

function FacultyChapter7() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useModuleSection('intro', ['intro', 'powerpoint', 'word', 'excel']);

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
        <button className="chap-back-btn" onClick={() => navigate('/faculty-modules')}>
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
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Right Main Card ── */}
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

export default FacultyChapter7;
