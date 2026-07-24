// faculty_modules.jsx
import { useState, useEffect, useRef } from 'react';
import './faculty_modules.css';
import { motion, AnimatePresence } from 'framer-motion';
import { MdAccountCircle, MdViewCarousel, MdGridView, MdGroups } from 'react-icons/md';
import { IoSearchCircle } from 'react-icons/io5';
import { CiLogout } from 'react-icons/ci';
import { SiBookstack } from 'react-icons/si';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../user_context';
import { auth, db, rtdb } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, set, serverTimestamp as rtdbServerTimestamp } from 'firebase/database';
import img1 from '../assets/panel1.png';
import img2 from '../assets/panel2.png';
import img3 from '../assets/panel3.png';
import img4 from '../assets/panel4.png';
import img5 from '../assets/panel5.png';
import img6 from '../assets/panel6.png';
import img7 from '../assets/panel7.png';
import img8 from '../assets/panel8.png';
import img9 from '../assets/panel9.png';
import itfunLogo from '../assets/LOGO_NAMEN.png';

/* ─────────────────────────────────────────────
   Module + Lesson search index
   Faculty side — all modules unlocked, all searchable
──────────────────────────────────────────────*/
const MODULES = [
  { num: 1, route: '/faculty-chapter-1', img: img1, label: 'Introduction to Computers and History of Computers',
    desc: 'Meet the machine: what a computer is, its four basic operations, and the inventors who started it all.' },
  { num: 2, route: '/faculty-chapter-2', img: img2, label: 'Language & Types of Computers with Their Uses',
    desc: 'From pocket-size PCs to room-size supercomputers — the language of computers and their many forms.' },
  { num: 3, route: '/faculty-chapter-3', img: img3, label: 'Number System & Conversions',
    desc: 'Binary, decimal, and the conversions between them — the math computers actually speak.' },
  { num: 4, route: '/faculty-chapter-4', img: img4, label: 'Hardware Components, Input and Output Devices & Basic PC-Building',
    desc: 'Keyboards to CPUs: the parts of a computer, how data flows in and out, and building a PC.' },
  { num: 5, route: '/faculty-chapter-5', img: img5, label: 'Types of Software',
    desc: 'System, application, and operating systems — the invisible half of computing.' },
  { num: 6, route: '/faculty-chapter-6', img: img6, label: 'Networking Fundamentals',
    desc: 'How computers talk: networks, the Internet and intranet, and everything in between.' },
  { num: 7, route: '/faculty-chapter-7', img: img7, label: 'Microsoft Office Applications',
    desc: 'Word, Excel, and PowerPoint — the everyday tools of the digital workplace.' },
  { num: 8, route: '/faculty-chapter-8', img: img8, label: 'Application of Computers in Different Fields',
    desc: 'Business, banking, healthcare, and more — how computers power the world around us.' },
  { num: 9, route: '/faculty-chapter-9', img: img9, label: 'Keyboarding',
    desc: 'Home-row technique and shortcut keys to type faster and work smarter.' },
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

  // ── Carousel vs grid view toggle ──
  const [view, setView] = useState('carousel');

  // ── Stacked carousel order (adapted from student_modules.jsx) ──
  // `order` = MODULES indices; position 1 is the ACTIVE (full-size + text)
  // card, position 0 is the "under" card behind it, 2..4 are the receding
  // peek cards on the right.
  // Start with Module 1 in the ACTIVE slot (position 1): the "under" card at
  // position 0 is the wrap-around last module, then 0,1,2… follow.
  const [order, setOrder] = useState(() => {
    const n = MODULES.length;
    return [n - 1, ...Array.from({ length: n - 1 }, (_, i) => i)];
  });

  const navigate = useNavigate();
  const { user, setUser, beginLogout } = useUser();
  // Guard: kapag may `user` na pero wala pang firstName/lastName (maikling
  // sandali habang naglo-load pa ang buong data mula sa Firestore, lalo na
  // kapag spam-refresh) — huwag i-access ang [0] ng undefined, para hindi
  // bumagsak sa blangkong page.
  const hasFullName = Boolean(user?.firstName && user?.lastName);
  const initials = hasFullName ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '?';

  // Dati, "Yes, Logout" ay `navigate('/')` lang — hindi talaga tumatawag ng
  // auth.signOut(), kaya nananatiling "naka-login" ang Firebase session
  // (at nananatiling naka-"occupied" ang account sa single-session lock).
  // Dito, talagang linilinis natin ang `activeSessionId` sa Firestore bago
  // mag-signOut, para pwede na ulit i-login ng ibang device/tab agad
  // pagkatapos, sa halip na maghintay ng SESSION_STALE_MS bago ito ma-
  // reclaim.
  const handleConfirmLogout = async () => {
    // Sabihin muna sa presence effect (user_context.jsx) na huwag nang
    // mag-auto-write ng "online" kahit mag-reconnect ang RTDB socket habang
    // nagsi-signOut() (nagbabago ang auth token) — kung hindi ito hihintayin,
    // posibleng ma-overwrite pabalik sa "online" yung explicit "offline"
    // write sa ibaba bago pa man makumpleto ang buong logout.
    beginLogout();

    try {
      if (user?.uid) {
        await set(ref(rtdb, `status/${user.uid}`), {
          state: 'offline',
          lastChanged: rtdbServerTimestamp(),
        });
      }
    } catch (err) {
      console.error('Failed to set offline status on logout:', err);
    }

    try {
      if (user?.uid) {
        await setDoc(doc(db, 'faculty', user.uid), {
          activeSessionId: null,
        }, { merge: true });
      }
    } catch (err) {
      console.error('Failed to clear active session on logout:', err);
    }
    sessionStorage.removeItem('itfun_sessionId');
    try {
      await auth.signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
    setUser(null);
    localStorage.removeItem('user');
    navigate('/');
  };

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

  // ── Carousel helpers (mirrors student_modules.jsx) ──
  const goNext = () => setOrder(o => [...o.slice(1), o[0]]);
  const goPrev = () => setOrder(o => [o[o.length - 1], ...o.slice(0, -1)]);
  const bringToActive = (pos) => {
    if (pos >= 2) setOrder(o => [...o.slice(pos - 1), ...o.slice(0, pos - 1)]);
  };
  const stackPosClass = (pos) => {
    if (pos === 0) return 'stk-under';
    if (pos === 1) return 'stk-active';
    if (pos === 2) return 'stk-peek peek-1';
    if (pos === 3) return 'stk-peek peek-2';
    if (pos === 4) return 'stk-peek peek-3';
    return 'stk-hidden';
  };

  return (
    <motion.div
      className="fm-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Top Navbar (full width — unchanged aside from brand) ── */}
      <div className="top-navbar">
        <div className="fm-brand">
          <img src={itfunLogo} className="fm-logo" alt="ITFun logo" />
          <span className="fm-wordmark">IT<span>Fun</span></span>
        </div>

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

        <div
          className="avatar-circle"
          onClick={() => setShowLogoutModal(true)}
          title={hasFullName ? `${user.firstName} ${user.lastName}` : 'Account'}
        >
          {hasFullName ? initials : <MdAccountCircle style={{ fontSize: 22 }} />}
        </div>
      </div>

      {/* ── Body: sidebar + main ── */}
      <div className="fm-below">
        {/* ── Sidebar ── */}
        <aside className="fm-side">
          <nav className="fm-nav">
            <button className="fm-nav-item active">
              <span className="fm-nav-icon"><SiBookstack /></span>
              <span className="fm-nav-label">Modules</span>
            </button>
            <button className="fm-nav-item" onClick={() => navigate('/faculty-class')}>
              <span className="fm-nav-icon"><MdGroups /></span>
              <span className="fm-nav-label">Classes</span>
            </button>
          </nav>
          <div className="fm-side-foot">Faculty Dashboard</div>
        </aside>

        {/* ── Main content ── */}
        <main className="fm-main">
          <div className="fm-heading">
            <h2>Learning Modules</h2>
            <div className="fm-view-toggle">
              <button
                className={`fm-view-btn ${view === 'carousel' ? 'active' : ''}`}
                onClick={() => setView('carousel')}
              >
                <MdViewCarousel size={16} /> Carousel
              </button>
              <button
                className={`fm-view-btn ${view === 'grid' ? 'active' : ''}`}
                onClick={() => setView('grid')}
              >
                <MdGridView size={16} /> View All
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {view === 'carousel' ? (
              <motion.div
                key="carousel"
                className="fm-carousel-wrap"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <div className="stk-carousel">
                  <div className="stk-stage">
                    {order.map((modIdx, pos) => {
                      const module = MODULES[modIdx];
                      const isActive = pos === 1;
                      return (
                        <div
                          key={module.num}
                          className={`stk-item ${stackPosClass(pos)}`}
                          style={{ backgroundImage: `url(${module.img})` }}
                          onClick={pos >= 2 ? () => bringToActive(pos) : undefined}
                        >
                          <span className="stk-chip">Module {module.num}</span>

                          {isActive && (
                            <div className="stk-content" key={module.num}>
                              <div className="stk-name">{module.label}</div>
                              <div className="stk-des">{module.desc}</div>
                              <button
                                className="stk-cta"
                                onClick={(e) => { e.stopPropagation(); navigate(module.route); }}
                              >
                                OPEN MODULE ▶
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="stk-btns">
                    <button className="stk-nav stk-prev" onClick={goPrev} aria-label="Previous module">◁</button>
                    <button className="stk-nav stk-next" onClick={goNext} aria-label="Next module">▷</button>
                  </div>
                </div>
                <p className="fm-caption">All 9 modules unlocked — swipe to browse the curriculum.</p>
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                className="fm-grid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                {MODULES.map((module) => {
                  const lessonCount = (MODULE_LESSONS[module.num] || []).length;
                  return (
                    <motion.div
                      key={module.num}
                      className="mod-card"
                      onClick={() => navigate(module.route)}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (module.num - 1) * 0.04 }}
                    >
                      <div className="mod-card-img">
                        <img src={module.img} alt={`Module ${module.num}`} />
                        <span className="mod-card-badge">Module {module.num}</span>
                      </div>
                      <div className="mod-card-body">
                        <h3 className="mod-card-title">{module.label}</h3>
                        <p className="mod-card-sub">
                          {lessonCount} lesson{lessonCount !== 1 ? 's' : ''} · Unlocked
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
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
                  justifyContent: 'center',
                }}>
                  <CiLogout size={32} color="#c8102e" />
                </div>
                <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '15px', color: '#333', margin: 0, textAlign: 'center', fontWeight: 'bold' }}>
                  Are you sure you want to exit?
                </p>
              </div>
              <div className="modal-footer">
                <button className="modal-join-btn" onClick={handleConfirmLogout}>Yes, Logout</button>
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
