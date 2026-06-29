// faculty_modules.jsx
import { useState, useEffect, useRef } from 'react';
import './faculty_modules.css';
import { motion, AnimatePresence } from 'framer-motion';
import { MdAccountCircle } from 'react-icons/md';
import { IoSearchCircle } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../user_context';
import img1 from '../assets/panel1.webp';
import img2 from '../assets/panel2.jpg';
import img3 from '../assets/panel3.webp';
import img4 from '../assets/panel4.avif';
import img5 from '../assets/panel5.webp';
import img6 from '../assets/panel6.webp';
import img7 from '../assets/panel7.webp';
import img8 from '../assets/panel8.png';
import img9 from '../assets/panel9.jpg';

/* ─────────────────────────────────────────────
   Module + Lesson search index
   Faculty side — all modules unlocked, all searchable
──────────────────────────────────────────────*/
const MODULES = [
  { num: 1, route: '/faculty-chapter-1', label: 'Introduction to Computers and History of Computers' },
  { num: 2, route: '/faculty-chapter-2', label: 'Language & Types of Computers with Their Uses' },
  { num: 3, route: '/faculty-chapter-3', label: 'Number System & Conversions' },
  { num: 4, route: '/faculty-chapter-4', label: 'Hardware Components, Input and Output Devices & Basic PC-Building' },
  { num: 5, route: '/faculty-chapter-5', label: 'Types of Software' },
  { num: 6, route: '/faculty-chapter-6', label: 'Networking Fundamentals' },
  { num: 7, route: '/faculty-chapter-7', label: 'Microsoft Office Applications' },
  { num: 8, route: '/faculty-chapter-8', label: 'Application of Computers in Different Fields' },
  { num: 9, route: '/faculty-chapter-9', label: 'Keyboarding' },
];

const MODULE_LESSONS = {
  1: [
    { key: 'introduction',    label: 'Introduction of Computer' },
    { key: 'functionalities', label: 'Functionalities of a Computer' },
    { key: 'history',         label: 'History of Computers' },
  ],
  2: [
    { key: 'language',     label: 'Language of Computer' },
    { key: 'personal',     label: 'Personal Computers (PC)' },
    { key: 'workstation',  label: 'Workstation' },
    { key: 'minicomputer', label: 'Minicomputer, Mainframe & Supercomputer' },
  ],
  3: [
    { key: 'numbersystem', label: 'Decimal & Binary Number System' },
    { key: 'conversions',  label: 'Number System Conversions (Binary, Decimal)' },
  ],
  4: [
    { key: 'parts',     label: 'Parts of Computer' },
    { key: 'iodevices', label: 'Input and Output Devices' },
  ],
  5: [
    { key: 'software', label: 'Types of Software (System, Application and Operating System)' },
  ],
  6: [
    { key: 'characteristics', label: 'Characteristics of a Computer Network' },
    { key: 'internet',        label: 'Internet and Intranet' },
    { key: 'areas',           label: 'Areas of Network' },
  ],
  7: [
    { key: 'intro',      label: 'Introduction to MS Office' },
    { key: 'powerpoint', label: 'Microsoft PowerPoint' },
    { key: 'word',       label: 'Microsoft Word' },
    { key: 'excel',      label: 'Microsoft Excel' },
  ],
  8: [
    { key: 'applications', label: 'Application of Computers in Different Fields' },
  ],
  9: [
    { key: 'keyboarding', label: 'Keyboarding' },
  ],
};

function buildSearchIndex() {
  const index = [];
  MODULES.forEach((mod) => {
    index.push({
      type: 'module',
      num: mod.num,
      route: mod.route,
      label: mod.label,
      sublabel: `Learning Module ${mod.num}`,
    });
    (MODULE_LESSONS[mod.num] || []).forEach((lesson) => {
      index.push({
        type: 'lesson',
        num: mod.num,
        route: `${mod.route}?section=${lesson.key}`,
        label: lesson.label,
        sublabel: `Module ${mod.num} › Lesson`,
      });
    });
  });
  return index;
}

const SEARCH_INDEX = buildSearchIndex();

/* ════════════════════════════════════════════
   Main Component
═════════════════════════════════════════════*/
function FacultyModules() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchQuery, setSearchQuery]         = useState('');
  const [showDropdown, setShowDropdown]       = useState(false);
  const searchRef                             = useRef(null);

  const navigate = useNavigate();
  const { user } = useUser();
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '?';

  useEffect(() => {
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = '#ffffff';
    return () => {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  /* ── Search results ── */
  const searchResults = (() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return SEARCH_INDEX.filter(item =>
      item.label.toLowerCase().includes(q) ||
      item.sublabel.toLowerCase().includes(q)
    ).slice(0, 8);
  })();

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowDropdown(true);
  };

  const handleResultClick = (item) => {
    setSearchQuery('');
    setShowDropdown(false);
    navigate(item.route);
  };

  const IMAGES = [img1, img2, img3, img4, img5, img6, img7, img8, img9];

  return (
    <motion.div
      className="lm-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Top Navbar ── */}
      <div className="top-navbar">

        {/* ── Search Bar ── */}
        <div className="search-bar" ref={searchRef}>
          <IoSearchCircle className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search modules or lessons..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery.trim() && setShowDropdown(true)}
          />

          {/* ── Dropdown ── */}
          <AnimatePresence>
            {showDropdown && searchQuery.trim() && (
              <motion.div
                className="search-dropdown"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                {searchResults.length === 0 ? (
                  <div className="search-dropdown-empty">
                    No modules or lessons found for "<strong>{searchQuery}</strong>"
                  </div>
                ) : (
                  searchResults.map((item, idx) => (
                    <div
                      key={idx}
                      className="search-dropdown-item unlocked"
                      onClick={() => handleResultClick(item)}
                    >
                      <div className="search-dropdown-icon unlocked">
                        {item.type === 'module' ? '📚' : '📖'}
                      </div>
                      <div className="search-dropdown-text">
                        <div className="search-dropdown-label unlocked">{item.label}</div>
                        <div className="search-dropdown-sublabel unlocked">{item.sublabel}</div>
                      </div>
                      <span className="search-dropdown-arrow">›</span>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="navbar-spacer" />

        <div className="top-center-btns">
          <button className="top-btn active-btn">Modules</button>
          <button className="top-btn" onClick={() => navigate('/faculty-class')}>Class</button>
          <div
            className="avatar-circle"
            onClick={() => setShowLogoutModal(true)}
            title={user ? `${user.firstName} ${user.lastName}` : 'Account'}
          >
            {user ? initials : <MdAccountCircle style={{ fontSize: 22 }} />}
          </div>
        </div>
      </div>

      {/* ── Module panels ── */}
      <div className="modules-grid">
        {MODULES.map((mod) => (
          <div
            key={mod.num}
            className={`sub-panel-${mod.num}`}
            onClick={() => navigate(mod.route)}
            style={{ cursor: 'pointer' }}
          >
            <div className="panel-content">
              <h3 className="panel-title">{mod.label}</h3>
              <div className="panel-image-wrapper">
                <img src={IMAGES[mod.num - 1]} alt={`Module ${mod.num}`} className="panel-image" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── LOGOUT MODAL ── */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowLogoutModal(false)}
          >
            <motion.div
              className="modal-box"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3 className="modal-title" style={{ margin: '0 auto', textAlign: 'center' }}>Confirm Logout</h3>
                <button className="modal-close" onClick={() => setShowLogoutModal(false)}>✕</button>
              </div>
              <div className="modal-body" style={{ flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '28px 20px 20px' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: '#fdecea', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '32px',
                }}>🚪</div>
                <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '15px', color: '#333', margin: 0, textAlign: 'center', fontWeight: 'bold' }}>
                  Are you sure you want to exit?
                </p>
              </div>
              <div className="modal-footer">
                <button className="modal-join-btn" onClick={() => navigate('/')}>Yes, Logout</button>
                <button className="modal-cancel-btn" onClick={() => setShowLogoutModal(false)}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

export default FacultyModules;