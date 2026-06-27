// student_modules.jsx - Add this useEffect for route protection
import { useState, useEffect } from 'react';
import './student_modules.css';
import { motion, AnimatePresence } from 'framer-motion';
import { MdAccountCircle } from 'react-icons/md';
import { IoSearchCircle } from 'react-icons/io5';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../user_context';
import { db } from '../firebase';
import {
  collection, query, where, getDocs, addDoc, doc, getDoc,
  serverTimestamp, onSnapshot,
} from 'firebase/firestore';
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
   Module metadata
──────────────────────────────────────────────*/
const MODULES = [
  { id: 'module1', num: 1, route: '/student-chapter-1', label: 'Introduction to Computers and History of Computers', img: img1 },
  { id: 'module2', num: 2, route: '/student-chapter-2', label: 'Language & Types of Computers with Their Uses',       img: img2 },
  { id: 'module3', num: 3, route: '/student-chapter-3', label: 'Number System & Conversions',                         img: img3 },
  { id: 'module4', num: 4, route: '/student-chapter-4', label: 'Hardware Components, Input and Output Devices & Basic PC-Building', img: img4 },
  { id: 'module5', num: 5, route: '/student-chapter-5', label: 'Types of Software',                                   img: img5 },
  { id: 'module6', num: 6, route: '/student-chapter-6', label: 'Networking Fundamentals',                             img: img6 },
  { id: 'module7', num: 7, route: '/student-chapter-7', label: 'Microsoft Office Applications',                       img: img7 },
  { id: 'module8', num: 8, route: '/student-chapter-8', label: 'Application of Computers in Different Fields',        img: img8 },
  { id: 'module9', num: 9, route: '/student-chapter-9', label: 'Keyboarding',                                         img: img9 },
];

function toPascalCase(str = '') {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

/* ════════════════════════════════════════════
   Main Component
═════════════════════════════════════════════*/
function LearningModules() {
  const [showLogoutModal, setShowLogoutModal]   = useState(false);
  const [showMyCourse, setShowMyCourse]         = useState(false);
  const [myCourses, setMyCourses]               = useState([]);

  // ── Join Course modal states ──
  const [joinStep, setJoinStep]       = useState('input');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [accessCode, setAccessCode]   = useState('');
  const [joinError, setJoinError]     = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [foundClass, setFoundClass]   = useState(null);

  // ── Module unlock/progress state ──
  // moduleStates[moduleId] = { unlocked: bool, completed: bool, overallPercent: number }
  const [moduleStates, setModuleStates] = useState(() =>
    Object.fromEntries(MODULES.map((m, i) => [
      m.id,
      { unlocked: i === 0, completed: false, overallPercent: 0 },
    ]))
  );
  const [progressLoading, setProgressLoading] = useState(true);

  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = useUser();
  const initials  = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '?';

  /* ── Body background ── */
  useEffect(() => {
    document.body.style.backgroundImage  = 'none';
    document.body.style.backgroundColor = '#ffffff';
    return () => {
      document.body.style.backgroundImage  = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  /* ── Real-time listener for enrollments ── */
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'enrollments'), where('studentId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setMyCourses(snap.docs.map(d => ({ enrollmentDocId: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  /* ── Real-time listener for module progress ──
     Listens to the student's progress doc and rebuilds moduleStates.
     Doc path: studentProgress/{uid}
     Structure mirrors the spec:
       modules.module1.unlocked / completed / lessons.lessonKey.progress
  ── */
  useEffect(() => {
    if (!user) return;
    setProgressLoading(true);

    const progressRef = doc(db, 'studentProgress', user.uid);
    const unsub = onSnapshot(progressRef, (snap) => {
      if (!snap.exists()) {
        // First-time student: only module1 unlocked, rest locked
        setModuleStates(
          Object.fromEntries(MODULES.map((m, i) => [
            m.id,
            { unlocked: i === 0, completed: false, overallPercent: 0 },
          ]))
        );
        setProgressLoading(false);
        return;
      }

      const data = snap.data();
      const modules = data.modules || {};

      const newStates = {};
      MODULES.forEach((m, i) => {
        const mData = modules[m.id] || {};
        const unlocked = i === 0 ? true : (mData.unlocked ?? false);
        const completed = mData.completed ?? false;

        // Calculate average lesson progress for display
        const lessons = mData.lessons || {};
        const lessonValues = Object.values(lessons).map(l => l.progress ?? 0);
        const overallPercent = lessonValues.length > 0
          ? Math.round(lessonValues.reduce((a, b) => a + b, 0) / lessonValues.length)
          : 0;

        newStates[m.id] = { unlocked, completed, overallPercent };
      });

      setModuleStates(newStates);
      setProgressLoading(false);
    });

    return () => unsub();
  }, [user]);

  /* ── Navigation guard: only allow access if unlocked ── */
  const handleModuleClick = (module) => {
    const state = moduleStates[module.id];
    if (!state?.unlocked) {
      // Show a toast or alert message
      alert(`Please complete all lessons in the previous module to unlock "${module.label}".`);
      return;
    }
    navigate(module.route);
  };

  /* ── Route Protection: Prevent direct URL access to locked modules ── */
  useEffect(() => {
    // Check if the current path is a student chapter route
    const path = location.pathname;
    const chapterMatch = path.match(/\/student-chapter-(\d+)/);
    
    if (chapterMatch) {
      const chapterNum = parseInt(chapterMatch[1]);
      const moduleId = `module${chapterNum}`;
      const state = moduleStates[moduleId];
      
      // If the module is locked, redirect back to learning modules
      if (state && !state.unlocked) {
        alert(`Module ${chapterNum} is locked. Please complete all lessons in Module ${chapterNum - 1} first.`);
        navigate('/learning-modules');
      }
    }
  }, [location.pathname, moduleStates, navigate]);

  /* ── Join Course handlers ── */
  const handleCloseModal = () => {
    setShowJoinModal(false);
    setAccessCode('');
    setJoinError('');
    setJoinStep('input');
    setFoundClass(null);
  };

  const handleLookupCode = async () => {
    const code = accessCode.trim().toUpperCase();
    if (!code) { setJoinError('Please enter an access code.'); return; }
    setJoinError('');
    setJoinLoading(true);
    try {
      const existingEnrollQ = query(
        collection(db, 'enrollments'),
        where('studentId', '==', user.uid)
      );
      const existingEnrollSnap = await getDocs(existingEnrollQ);
      if (!existingEnrollSnap.empty) {
        setJoinError('You are already enrolled in a course. You can only join one course at a time.');
        setJoinLoading(false);
        return;
      }
      const q = query(collection(db, 'classes'), where('accessCode', '==', code));
      const snap = await getDocs(q);
      if (snap.empty) {
        setJoinError('Access code not found. Please check and try again.');
        setJoinLoading(false);
        return;
      }
      const classDoc = snap.docs[0];
      setFoundClass({ firestoreId: classDoc.id, ...classDoc.data() });
      setJoinStep('confirm');
    } catch (err) {
      console.error('Error looking up class:', err);
      setJoinError('Something went wrong. Please try again.');
    }
    setJoinLoading(false);
  };

  const handleConfirmJoin = async () => {
    if (!foundClass || !user) return;
    setJoinLoading(true);
    try {
      await addDoc(collection(db, 'enrollments'), {
        classId:          foundClass.firestoreId,
        className:        foundClass.name,
        subject:          foundClass.subject,
        facultyId:        foundClass.facultyId,
        facultyName:      foundClass.facultyName,
        studentId:        user.uid,
        studentName:      `${user.firstName} ${user.lastName}`,
        studentFirstName: user.firstName,
        studentLastName:  user.lastName,
        studentEmail:     user.email,
        joinedAt:         serverTimestamp(),
      });
      setJoinStep('success');
    } catch (err) {
      console.error('Error enrolling:', err);
      setJoinError('Failed to join. Please try again.');
      setJoinStep('confirm');
    }
    setJoinLoading(false);
  };

  /* ── Avatar color ── */
  function avatarColor(str = '') {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${Math.abs(hash) % 360}, 60%, 45%)`;
  }

  /* ── Panel CSS class names (unchanged from original) ── */
  const panelClass = (num) => `sub-panel-${num}`;

  return (
    <motion.div
      className="lm-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Top Navbar ── */}
      <div className="top-navbar">
        <div className="search-bar">
          <IoSearchCircle className="search-icon" />
          <input type="text" className="search-input" placeholder="Search" />
        </div>
        <div className="navbar-spacer" />
        <div className="top-center-btns">
          <button className="top-btn" onClick={() => setShowMyCourse(true)}>
            Class Instructor {myCourses.length > 0 && (
              <span style={{
                background: '#c8102e', color: '#fff', borderRadius: '50%',
                fontSize: '10px', padding: '1px 5px', marginLeft: '4px', fontWeight: 'bold',
              }}>{myCourses.length}</span>
            )}
          </button>
          <button className="top-btn" onClick={() => { setShowJoinModal(true); setJoinStep('input'); }}>
            Join Instructor
          </button>
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
      <div className="lm-scroll-body">
        <div className="modules-grid">
          {MODULES.map((module) => {
            const state    = moduleStates[module.id] ?? { unlocked: false, completed: false, overallPercent: 0 };
            const locked   = !state.unlocked;
            const cssClass = panelClass(module.num);

            return (
              <div
                key={module.id}
                className={cssClass}
                onClick={() => handleModuleClick(module)}
                style={{
                  cursor: locked ? 'not-allowed' : 'pointer',
                  filter: locked ? 'grayscale(100%) brightness(0.5)' : 'none',
                  transition: 'filter 0.3s ease',
                  userSelect: 'none',
                  position: 'relative',
                }}
              >
                {/* ── Lock overlay ── */}
                {locked && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.4)',
                    borderRadius: '12px',
                    zIndex: 2,
                    pointerEvents: 'none',
                  }}>
                    <span style={{
                      fontSize: '48px',
                      color: 'white',
                      textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                    }}>🔒</span>
                  </div>
                )}
                
                <div className="panel-content">
                  <h3 className="panel-title">
                    {module.label}
                    {!locked && state.completed && (
                      <span style={{
                        marginLeft: '8px',
                        fontSize: '14px',
                        color: '#2e7d32',
                      }}>✅</span>
                    )}
                  </h3>
                  <div className="panel-image-wrapper">
                    <img src={module.img} alt={`Module ${module.num}`} className="panel-image" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <div className="bottom-nav-btn active" onClick={() => navigate('/learning-modules')}>
          <span className="bottom-nav-icon">📚</span>
          <span className="bottom-nav-label">LEARNING MODULES</span>
        </div>
        <div className="bottom-nav-btn" onClick={() => navigate('/pvp-quiz')}>
          <span className="bottom-nav-icon">⚔️</span>
          <span className="bottom-nav-label">PVP QUIZ ARENA</span>
        </div>
      </div>

      {/* ── LOGOUT CONFIRMATION MODAL ── */}
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

      {/* ── MY COURSE MODAL ── */}
      <AnimatePresence>
        {showMyCourse && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowMyCourse(false)}
          >
            <motion.div
              className="modal-box"
              style={{ width: '460px' }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header" style={{ justifyContent: 'center', position: 'relative' }}>
                <h3 className="modal-title" style={{ margin: '0 auto', textAlign: 'center' }}>My Instructor</h3>
                <button
                  className="modal-close"
                  style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}
                  onClick={() => setShowMyCourse(false)}
                >✕</button>
              </div>

              <div style={{ padding: '16px 20px', maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {myCourses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '40px' }}>📭</span>
                    <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#aaa', margin: 0 }}>
                      You haven't joined any course yet.
                    </p>
                    <button
                      className="modal-join-btn"
                      style={{ marginTop: '8px' }}
                      onClick={() => { setShowMyCourse(false); setShowJoinModal(true); setJoinStep('input'); }}
                    >
                      Join Instructor
                    </button>
                  </div>
                ) : (
                  myCourses.map(course => (
                    <div key={course.enrollmentDocId} style={{
                      border: '1px solid #f0d0d5', borderRadius: '10px', padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: '14px',
                      background: '#fff', boxShadow: '0 2px 8px rgba(200,16,46,0.06)',
                    }}>
                      <div style={{
                        width: '46px', height: '46px', borderRadius: '12px', flexShrink: 0,
                        background: avatarColor(course.facultyId),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 'bold', fontSize: '16px', fontFamily: 'Arial, sans-serif',
                      }}>
                        {(course.facultyName || 'F').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'Arial, sans-serif', fontWeight: 'bold', fontSize: '14px', color: '#222', marginBottom: '2px' }}>
                          {toPascalCase(course.className || '')}
                        </div>
                        <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                          {course.subject}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '13px' }}>👩‍🏫</span>
                          <span style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#555' }}>
                            {toPascalCase(course.facultyName || '')}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'left', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#aaa', marginBottom: '2px' }}>Joined</div>
                        <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#555', textAlign: 'right' }}>
                          {course.joinedAt?.toDate
                            ? course.joinedAt.toDate().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                            : '—'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {myCourses.length > 0 && (
                <div className="modal-footer">
                  <button className="modal-cancel-btn" onClick={() => setShowMyCourse(false)}>Close</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── JOIN COURSE MODAL ── */}
      <AnimatePresence>
        {showJoinModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleCloseModal}
          >
            <motion.div
              className="modal-box"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              onClick={e => e.stopPropagation()}
            >
              {/* ── STEP: INPUT CODE ── */}
              {joinStep === 'input' && (
                <>
                  <div className="modal-header">
                    <h3 className="modal-title" style={{ margin: '0 auto', textAlign: 'center' }}>Join Instructor</h3>
                    <button className="modal-close" onClick={handleCloseModal}>✕</button>
                  </div>
                  <div className="modal-body" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                    <label className="modal-label">
                      Access Code <span className="modal-required">*</span>
                    </label>
                    <input
                      type="text"
                      className="modal-input"
                      placeholder="Enter code (e.g. AB1234)"
                      value={accessCode}
                      onChange={e => { setAccessCode(e.target.value.toUpperCase()); setJoinError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleLookupCode()}
                      autoFocus
                      style={{ width: '100%', letterSpacing: '2px', textTransform: 'uppercase' }}
                    />
                    {joinError && (
                      <p style={{ color: '#c8102e', fontSize: '12px', fontFamily: 'Arial, sans-serif', margin: 0 }}>
                        {joinError}
                      </p>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button className="modal-join-btn" onClick={handleLookupCode} disabled={joinLoading}>
                      {joinLoading ? 'Looking up...' : 'Next'}
                    </button>
                    <button className="modal-cancel-btn" onClick={handleCloseModal}>Cancel</button>
                  </div>
                </>
              )}

              {/* ── STEP: CONFIRM ── */}
              {joinStep === 'confirm' && foundClass && (
                <>
                  <div className="modal-header">
                    <h3 className="modal-title">Confirm Join</h3>
                    <button className="modal-close" onClick={handleCloseModal}>✕</button>
                  </div>
                  <div className="modal-body" style={{ flexDirection: 'column', gap: '16px' }}>
                    <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#555', margin: 0 }}>
                      You are about to join:
                    </p>
                    <div style={{
                      background: '#fdecea', border: '1px solid #f0d0d5',
                      borderRadius: '8px', padding: '14px 16px',
                      display: 'flex', flexDirection: 'column', gap: '6px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '28px' }}>🏫</span>
                        <div>
                          <div style={{ fontFamily: 'Arial, sans-serif', fontWeight: 'bold', fontSize: '15px', color: '#222' }}>
                            {foundClass.name}
                          </div>
                          <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#888' }}>
                            {foundClass.subject}
                          </div>
                        </div>
                      </div>
                      <div style={{ borderTop: '1px solid #f0d0d5', paddingTop: '8px', marginTop: '4px' }}>
                        <span style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#555' }}>
                          👩‍🏫 Faculty: <strong>{foundClass.facultyName}</strong>
                        </span>
                      </div>
                    </div>
                    {joinError && (
                      <p style={{ color: '#c8102e', fontSize: '12px', fontFamily: 'Arial, sans-serif', margin: 0 }}>
                        {joinError}
                      </p>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button className="modal-join-btn" onClick={handleConfirmJoin} disabled={joinLoading}>
                      {joinLoading ? 'Joining...' : 'Confirm Join'}
                    </button>
                    <button className="modal-cancel-btn" onClick={() => setJoinStep('input')}>Back</button>
                  </div>
                </>
              )}

              {/* ── STEP: SUCCESS ── */}
              {joinStep === 'success' && foundClass && (
                <>
                  <div className="modal-header">
                    <h3 className="modal-title">Joined Successfully!</h3>
                    <button className="modal-close" onClick={handleCloseModal}>✕</button>
                  </div>
                  <div className="modal-body" style={{ flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '28px 20px 20px' }}>
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '50%',
                      background: '#e8f5e9', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '32px',
                    }}>✅</div>
                    <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#333', margin: 0, textAlign: 'center' }}>
                      You have successfully joined <strong>{foundClass.name}</strong>
                    </p>
                    <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#888', margin: 0, textAlign: 'center' }}>
                      Faculty: {foundClass.facultyName}
                    </p>
                  </div>
                  <div className="modal-footer">
                    <button className="modal-join-btn" onClick={handleCloseModal}>Done</button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

export default LearningModules;