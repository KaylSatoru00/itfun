// faculty_modules.jsx
import { useState, useEffect } from 'react';
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

function FacultyModules() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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


  return (
    <motion.div
      className="lm-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Top Navbar ── */}
      <div className="top-navbar">
        {/* Search bar */}
        <div className="search-bar">
          <IoSearchCircle className="search-icon" />
          <input type="text" className="search-input" placeholder="Search" />
        </div>

        {/* Spacer */}
        <div className="navbar-spacer" />

        {/* Modules + Class + Avatar buttons */}
        <div className="top-center-btns">
          <button className="top-btn active-btn">
            Modules
          </button>
          <button className="top-btn" onClick={() => navigate('/faculty-class')}>
            Class
          </button>
          {/* Avatar — beside Class, opens logout modal */}
          <div
            className="avatar-circle"
            onClick={() => setShowLogoutModal(true)}
            title={user ? `${user.firstName} ${user.lastName}` : 'Account'}
            style={{ cursor: 'pointer', flexShrink: 0 }}
          >
            {user ? initials : <MdAccountCircle style={{ fontSize: 22 }} />}
          </div>
        </div>
      </div>

      {/* ── Module panels ── */}
      <div className="modules-grid">

        <div className="sub-panel-1" onClick={() => navigate('/faculty-chapter-1')} style={{ cursor: 'pointer' }}>
          <div className="panel-content">
            <h3 className="panel-title">Introduction to Computers and History of Computers</h3>
            <div className="panel-image-wrapper">
              <img src={img1} alt="Module 1" className="panel-image" />
            </div>
          </div>
        </div>

        <div className="sub-panel-2" onClick={() => navigate('/faculty-chapter-2')} style={{ cursor: 'pointer' }}>
          <div className="panel-content">
            <h3 className="panel-title">Language & Types of Computers with Their Uses</h3>
            <div className="panel-image-wrapper">
              <img src={img2} alt="Module 2" className="panel-image" />
            </div>
          </div>
        </div>

        <div className="sub-panel-3" onClick={() => navigate('/faculty-chapter-3')} style={{ cursor: 'pointer' }}>
          <div className="panel-content">
            <h3 className="panel-title">Number System & Conversions</h3>
            <div className="panel-image-wrapper">
              <img src={img3} alt="Module 3" className="panel-image" />
            </div>
          </div>
        </div>

        <div className="sub-panel-4" onClick={() => navigate('/faculty-chapter-4')} style={{ cursor: 'pointer' }}>
          <div className="panel-content">
            <h3 className="panel-title">Hardware Components, Input and Output Devices & Basic PC-Building</h3>
            <div className="panel-image-wrapper">
              <img src={img4} alt="Module 4" className="panel-image" />
            </div>
          </div>
        </div>

        <div className="sub-panel-5" onClick={() => navigate('/faculty-chapter-5')} style={{ cursor: 'pointer' }}>
          <div className="panel-content">
            <h3 className="panel-title">Types of Software</h3>
            <div className="panel-image-wrapper">
              <img src={img5} alt="Module 5" className="panel-image" />
            </div>
          </div>
        </div>

        <div className="sub-panel-6" onClick={() => navigate('/faculty-chapter-6')} style={{ cursor: 'pointer' }}>
          <div className="panel-content">
            <h3 className="panel-title">Networking Fundamentals</h3>
            <div className="panel-image-wrapper">
              <img src={img6} alt="Module 6" className="panel-image" />
            </div>
          </div>
        </div>

        <div className="sub-panel-7" onClick={() => navigate('/faculty-chapter-7')} style={{ cursor: 'pointer' }}>
          <div className="panel-content">
            <h3 className="panel-title">Microsoft Office Applications</h3>
            <div className="panel-image-wrapper">
              <img src={img7} alt="Module 7" className="panel-image" />
            </div>
          </div>
        </div>

        <div className="sub-panel-8" onClick={() => navigate('/faculty-chapter-8')} style={{ cursor: 'pointer' }}>
          <div className="panel-content">
            <h3 className="panel-title">Application of Computers in Different Fields</h3>
            <div className="panel-image-wrapper">
              <img src={img8} alt="Module 8" className="panel-image" />
            </div>
          </div>
        </div>

        <div className="sub-panel-9" onClick={() => navigate('/faculty-chapter-9')} style={{ cursor: 'pointer' }}>
          <div className="panel-content">
            <h3 className="panel-title">Keyboarding</h3>
            <div className="panel-image-wrapper">
              <img src={img9} alt="Module 9" className="panel-image" />
            </div>
          </div>
        </div>

      </div>

      {/* ── LOGOUT CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
                <h3 className="modal-title">Confirm Logout</h3>
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



