// student_modules.jsx
import { useState, useEffect, useRef } from 'react';
import './student_modules.css';
import { motion, AnimatePresence } from 'framer-motion';
import { MdAccountCircle, MdViewCarousel, MdGridView } from 'react-icons/md';
import { IoSearchCircle } from 'react-icons/io5';
import { CiLogout } from 'react-icons/ci';
import { LuSwords } from 'react-icons/lu';
import { SiBookstack } from 'react-icons/si';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../user_context';
import { auth, db, rtdb } from '../firebase';
import { ref, set, serverTimestamp as rtdbServerTimestamp } from 'firebase/database';
import {
  collection, query, where, getDocs, addDoc, doc, getDoc, setDoc,
  serverTimestamp, onSnapshot,
} from 'firebase/firestore';
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
   Module metadata
──────────────────────────────────────────────*/
const MODULES = [
  { id: 'module1', num: 1, route: '/student-chapter-1', label: 'Introduction to Computers and History of Computers', img: img1,
    desc: 'Meet the machine: what a computer is, its four basic operations, and the inventors who started it all.' },
  { id: 'module2', num: 2, route: '/student-chapter-2', label: 'Language & Types of Computers with Their Uses',       img: img2,
    desc: 'From pocket-size PCs to room-size supercomputers — the language of computers and their many forms.' },
  { id: 'module3', num: 3, route: '/student-chapter-3', label: 'Number System & Conversions',                         img: img3,
    desc: 'Binary, decimal, and the conversions between them — the math computers actually speak.' },
  { id: 'module4', num: 4, route: '/student-chapter-4', label: 'Hardware Components, Input and Output Devices & Basic PC-Building', img: img4,
    desc: 'Keyboards to CPUs: the parts of a computer, how data flows in and out, and building a PC.' },
  { id: 'module5', num: 5, route: '/student-chapter-5', label: 'Types of Software',                                   img: img5,
    desc: 'System, application, and operating systems — the invisible half of computing.' },
  { id: 'module6', num: 6, route: '/student-chapter-6', label: 'Networking Fundamentals',                             img: img6,
    desc: 'How computers talk: networks, the Internet and intranet, and everything in between.' },
  { id: 'module7', num: 7, route: '/student-chapter-7', label: 'Microsoft Office Applications',                       img: img7,
    desc: 'Word, Excel, and PowerPoint — the everyday tools of the digital workplace.' },
  { id: 'module8', num: 8, route: '/student-chapter-8', label: 'Application of Computers in Different Fields',        img: img8,
    desc: 'Business, banking, healthcare, and more — how computers power the world around us.' },
  { id: 'module9', num: 9, route: '/student-chapter-9', label: 'Keyboarding',                                         img: img9,
    desc: 'Home-row technique and shortcut keys to type faster and work smarter.' },
];

/* ─────────────────────────────────────────────
   Lessons per module (from navItems in each s*.jsx)
   Used for search results — links to module route,
   the section key is passed as URL hash so the
   module page can auto-scroll/activate that lesson.
──────────────────────────────────────────────*/
const MODULE_LESSONS = {
  module1: [
    { key: 'introduction',    label: 'Introduction of Computer' },
    { key: 'functionalities', label: 'Functionalities of a Computer' },
    { key: 'history',         label: 'History of Computers' },
  ],
  module2: [
    { key: 'language',     label: 'Language of Computer' },
    { key: 'personal',     label: 'Personal Computers (PC)' },
    { key: 'workstation',  label: 'Workstation' },
    { key: 'minicomputer', label: 'Minicomputer, Mainframe & Supercomputer' },
  ],
  module3: [
    { key: 'numbersystem', label: 'Decimal & Binary Number System' },
    { key: 'conversions',  label: 'Number System Conversions (Binary, Decimal)' },
  ],
  module4: [
    { key: 'parts',     label: 'Parts of Computer' },
    { key: 'iodevices', label: 'Input and Output Devices' },
  ],
  module5: [
    { key: 'software', label: 'Types of Software (System, Application and Operating System)' },
  ],
  module6: [
    { key: 'characteristics', label: 'Characteristics of a Computer Network' },
    { key: 'internet',        label: 'Internet and Intranet' },
    { key: 'areas',           label: 'Areas of Network' },
  ],
  module7: [
    { key: 'intro',      label: 'Introduction to MS Office' },
    { key: 'powerpoint', label: 'Microsoft PowerPoint' },
    { key: 'word',       label: 'Microsoft Word' },
    { key: 'excel',      label: 'Microsoft Excel' },
  ],
  module8: [
    { key: 'applications', label: 'Application of Computers in Different Fields' },
  ],
  module9: [
    { key: 'keyboarding', label: 'Keyboarding' },
  ],
};

function toPascalCase(str = '') {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

/* ─────────────────────────────────────────────
   Build flat search index from modules + lessons
──────────────────────────────────────────────*/
function buildSearchIndex() {
  const index = [];

  MODULES.forEach((mod) => {
    // Module-level entry
    index.push({
      type: 'module',
      moduleId: mod.id,
      moduleNum: mod.num,
      route: mod.route,
      label: mod.label,
      sublabel: `Learning Module ${mod.num}`,
    });

    // Lesson-level entries
    const lessons = MODULE_LESSONS[mod.id] || [];
    lessons.forEach((lesson) => {
      index.push({
        type: 'lesson',
        moduleId: mod.id,
        moduleNum: mod.num,
        route: `${mod.route}#${lesson.key}`,
        label: lesson.label,
        sublabel: `Module ${mod.num} › Lesson`,
        lessonKey: lesson.key,
      });
    });
  });

  return index;
}

const SEARCH_INDEX = buildSearchIndex();

/* ════════════════════════════════════════════
   Main Component
═════════════════════════════════════════════*/
function LearningModules() {
  const [showLogoutModal, setShowLogoutModal]   = useState(false);
  const [showMyCourse, setShowMyCourse]         = useState(false);
  const [myCourses, setMyCourses]               = useState([]);

  // ── Search state ──
  const [searchQuery, setSearchQuery]     = useState('');
  const [showDropdown, setShowDropdown]   = useState(false);
  const searchRef                         = useRef(null);

  // ── Join Course modal states ──
  const [joinStep, setJoinStep]       = useState('input');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [accessCode, setAccessCode]   = useState('');
  const [joinError, setJoinError]     = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [foundClass, setFoundClass]   = useState(null);

  // ── Module unlock/progress state ──
  const [moduleStates, setModuleStates] = useState(() =>
    Object.fromEntries(MODULES.map((m, i) => [
      m.id,
      { unlocked: i === 0, completed: false, overallPercent: 0 },
    ]))
  );
  const [progressLoading, setProgressLoading] = useState(true);

  // ── Carousel vs grid view toggle ──
  const [view, setView] = useState(() => sessionStorage.getItem('itfun_ui_student_view') || 'carousel');

  // ── Stacked carousel order ──
  // `order` = array of MODULES indices. Ang naka-ACTIVE (full-size + text)
  // ay ang nasa position 1; ang position 0 ay ang "under" card (full-size
  // din pero nakatago sa likod) — ito ang eksaktong 2-card na istraktura ng
  // reference (MDJAmin) na nagbibigay ng grow-into-place animation. Next =
  // ilipat ang unang item sa dulo; Prev = kabaligtaran.
  // Initialize so the ACTIVE card (position 1) is the module the user last
  // had selected this session (persisted in sessionStorage), or Module 1 on
  // the first visit after login. This keeps the selected module across
  // refresh, Back/Forward, and opening a chapter and returning.
  const [order, setOrder] = useState(() => {
    const n = MODULES.length;
    const savedId = sessionStorage.getItem('itfun_ui_student_module');
    const savedIdx = savedId ? MODULES.findIndex(m => m.id === savedId) : -1;
    const activeIdx = savedIdx >= 0 ? savedIdx : 0; // Module 1 default
    const start = (activeIdx - 1 + n) % n;           // the "under" card sits one before
    return Array.from({ length: n }, (_, i) => (start + i) % n);
  });

  // Persist layout (Carousel/View All) and the selected module so they
  // survive refresh / Back-Forward / chapter round-trips.
  useEffect(() => { sessionStorage.setItem('itfun_ui_student_view', view); }, [view]);
  useEffect(() => {
    const activeModule = MODULES[order[1]];
    if (activeModule) sessionStorage.setItem('itfun_ui_student_module', activeModule.id);
  }, [order]);

  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, setUser, beginLogout }  = useUser();
  // KRITIKAL: hindi sapat ang `user ? ... : '?'` lang dito — habang
  // nagre-restore pa ang buong user data (hal. matapos mag-spam-refresh),
  // posibleng may `user` object na pero wala pang `firstName`/`lastName`
  // laman, causing "Cannot read properties of undefined (reading '0')"
  // kapag na-access ang `[0]` ng undefined value. I-check muna nating
  // meron talaga bago i-access.
  const initials = (user && user.firstName && user.lastName)
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : '?';

  // Dati, "Yes, Logout" ay `navigate('/')` lang — hindi talaga tumatawag ng
  // auth.signOut(), kaya nananatiling "naka-login" ang Firebase session
  // (at nananatiling naka-"occupied" ang account sa single-session lock).
  // Dito, talagang linilinis natin ang `activeSessionId` sa Firestore bago
  // mag-signOut, para pwede na ulit i-login ng ibang device/tab agad
  // pagkatapos, sa halip na maghintay ng SESSION_STALE_MS bago ito ma-
  // reclaim.
  const handleConfirmLogout = async () => {
    // I-arm muna ang logout flag bago anuman — para hindi maapektuhan ng
    // reconnect race condition (ref: user_context.jsx presence effect) ang
    // explicit "offline" write sa baba.
    beginLogout();
    try {
      if (user?.uid) {
        await setDoc(doc(db, 'students', user.uid), {
          activeSessionId: null,
        }, { merge: true });
      }
    } catch (err) {
      console.error('Failed to clear active session on logout:', err);
    }

    // Explicit na i-set ang RTDB status sa "offline" DITO, HABANG naka-login
    // pa rin (bago ang auth.signOut() sa baba). Kailangang mangyari ito
    // habang buhay pa ang session, kasi pagkatapos ng signOut(), magiging
    // `null` na ang auth.currentUser at ma-fa-fail na ang RTDB rule na
    // `auth.uid === $uid`. Hindi natin lang aasahan ang onDisconnect() dito
    // kasi may ilang segundong lag pa iyon bago maregister ng server na
    // naputol na ang koneksyon — mas mabilis at sigurado itong manual set.
    if (user?.uid) {
      try {
        await set(ref(rtdb, `status/${user.uid}`), {
          state: 'offline',
          lastChanged: rtdbServerTimestamp(),
        });
      } catch (err) {
        console.error('Failed to set offline status on logout:', err);
      }
    }

    sessionStorage.removeItem('itfun_sessionId');
    try {
      await auth.signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
    setUser(null);
    sessionStorage.removeItem('user');
    navigate('/');
  };

  /* ── Body background ──
     Dark brand background sa redesign (dating puti/#F2D7D5 depende sa
     join state — ang join state ay makikita pa rin sa navbar button na
     "Join Instructor" vs "My Instructor"). */
  useEffect(() => {
    document.body.style.backgroundImage  = 'none';
    document.body.style.backgroundColor = '#F2D7D5';
    return () => {
      document.body.style.backgroundImage  = '';
      document.body.style.backgroundColor = '';
    };
  }, [myCourses.length]);

  /* ── Close search dropdown on outside click ── */
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
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

  /* ── Real-time listener for module progress ── */
  useEffect(() => {
    if (!user) return;
    setProgressLoading(true);

    const progressRef = doc(db, 'studentProgress', user.uid);
    // KRITIKAL: `includeMetadataChanges: true` para makita natin kung
    // galing sa LOCAL CACHE (`snap.metadata.fromCache`) o kumpirmado na
    // mula sa SERVER ang bawat snapshot. Kailangan ito dahil pagkatapos
    // mag-refresh, madalas unang dumadaan ang onSnapshot sa isang cached
    // na snapshot bago pa man makumpleto ang totoong network round-trip —
    // kung wala pang laman ang cache na iyon, makikita ni `!snap.exists()`
    // na parang "walang progress doc" agad, kahit meron namang totoong
    // data sa server. Ito yung dahilan ng "grayscale/naka-lock lahat" na
    // flash pagkatapos mag-refresh.
    const unsub = onSnapshot(progressRef, { includeMetadataChanges: true }, (snap) => {
      if (!snap.exists()) {
        // Kung galing pa lang ito sa cache, huwag muna nating ituring na
        // "confirmed wala talagang progress" — hintayin muna ang
        // server-confirmed na snapshot (fromCache: false).
        if (snap.metadata.fromCache) return;

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

  /* ── Search results computed from query ── */
  const searchResults = (() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    return SEARCH_INDEX.filter(item =>
      item.label.toLowerCase().includes(q) ||
      item.sublabel.toLowerCase().includes(q)
    ).slice(0, 8); // max 8 results
  })();

  /* ── Handle search input change ── */
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowDropdown(true);
  };

  /* ── Handle search result click ── */
  const handleSearchResultClick = (item) => {
    const state = moduleStates[item.moduleId];
    if (!state?.unlocked) return; // locked — unclickable

    setSearchQuery('');
    setShowDropdown(false);

    // For lessons, pass the section key as ?section= query param
    if (item.type === 'lesson') {
      navigate(`${item.route.split('#')[0]}?section=${item.lessonKey}`);
    } else {
      navigate(item.route);
    }
  };

  /* ── Navigation guard: only allow access if unlocked ── */
  const handleModuleClick = (module) => {
    const state = moduleStates[module.id];
    if (!state?.unlocked) {
      alert(`Please complete all lessons in the previous module to unlock "${module.label}".`);
      return;
    }
    navigate(module.route);
  };

  /* ── Route Protection: Prevent direct URL access to locked modules ── */
  useEffect(() => {
    const path = location.pathname;
    const chapterMatch = path.match(/\/student-chapter-(\d+)/);

    if (chapterMatch) {
      const chapterNum = parseInt(chapterMatch[1]);
      const moduleId = `module${chapterNum}`;
      const state = moduleStates[moduleId];

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

  /* ── Module card (shared between carousel slides and grid cells) ── */
  const renderModuleCard = (module) => {
    const state  = moduleStates[module.id] ?? { unlocked: false, completed: false, overallPercent: 0 };
    const locked = !state.unlocked;

    return (
      <div
        className={`mod-card ${locked ? 'locked' : 'unlocked'}`}
        onClick={() => handleModuleClick(module)}
      >
        <div className="mod-card-img">
          <img src={module.img} alt={`Module ${module.num}`} loading="lazy" />
          <span className="mod-num-chip">Module {module.num}</span>
          {locked ? (
            <span className="mod-status-chip locked">🔒 Locked</span>
          ) : state.completed ? (
            <span className="mod-status-chip done">✓ Completed</span>
          ) : state.overallPercent > 0 ? (
            <span className="mod-status-chip prog">In Progress</span>
          ) : null}
        </div>
        {locked && (
          <div className="mod-lock-overlay"><span>🔒</span></div>
        )}
        <div className="mod-card-body">
          <h3 className="mod-card-title">{module.label}</h3>
          <div className="mod-progress-row">
            <div className="mod-progress-track">
              <div className="mod-progress-fill" style={{ width: `${state.overallPercent}%` }} />
            </div>
            <span className="mod-progress-pct">{state.overallPercent}%</span>
          </div>
        </div>
      </div>
    );
  };

  const goNext = () => setOrder(o => [...o.slice(1), o[0]]);
  const goPrev = () => setOrder(o => [o[o.length - 1], ...o.slice(0, -1)]);
  // I-dala ang tinapik na peek card papuntang ACTIVE slot (position 1).
  const bringToActive = (pos) => {
    if (pos >= 2) setOrder(o => [...o.slice(pos - 1), ...o.slice(0, pos - 1)]);
  };

  // Class ayon sa posisyon sa stack (tugma sa reference geometry).
  const stackPosClass = (pos) => {
    if (pos === 0) return 'stk-under';   // full-size, nasa likod (walang text)
    if (pos === 1) return 'stk-active';  // full-size, may text — ito ang bukas
    if (pos === 2) return 'stk-peek peek-1';
    if (pos === 3) return 'stk-peek peek-2';
    if (pos === 4) return 'stk-peek peek-3';
    return 'stk-hidden';
  };

  return (
    <motion.div
      className="lm-panel sm-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Top Navbar ── */}
      <div className="top-navbar">
        <div className="lm-brand">
          <img src={itfunLogo} className="lm-logo" alt="ITFun logo" />
          <div className="lm-wordmark">IT<span>Fun</span></div>
        </div>

        {/* ── Search Bar with Dropdown ── */}
        <div className="search-bar" ref={searchRef} style={{ position: 'relative' }}>
          <IoSearchCircle className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search modules or lessons..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery.trim() && setShowDropdown(true)}
          />

          {/* ── Search Dropdown ── */}
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
                  searchResults.map((item, idx) => {
                    const unlocked = moduleStates[item.moduleId]?.unlocked ?? false;
                    return (
                      <div
                        key={idx}
                        className={`search-dropdown-item ${unlocked ? 'unlocked' : 'locked'}`}
                        onClick={() => handleSearchResultClick(item)}
                      >
                        {/* Icon */}
                        <div className={`search-dropdown-icon ${unlocked ? 'unlocked' : 'locked'}`}>
                          {!unlocked ? '🔒' : item.type === 'module' ? '📚' : '📖'}
                        </div>

                        {/* Text */}
                        <div className="search-dropdown-text">
                          <div className={`search-dropdown-label ${unlocked ? 'unlocked' : 'locked'}`}>
                            {item.label}
                          </div>
                          <div className={`search-dropdown-sublabel ${unlocked ? 'unlocked' : 'locked'}`}>
                            {item.sublabel}{!unlocked && ' · Locked'}
                          </div>
                        </div>

                        {/* Arrow (unlocked only) */}
                        {unlocked && <span className="search-dropdown-arrow">›</span>}
                      </div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="navbar-spacer" />
        <div className="top-center-btns">
          <button
            className="top-btn"
            onClick={() => {
              if (myCourses.length > 0) {
                setShowMyCourse(true);
              } else {
                setShowJoinModal(true);
                setJoinStep('input');
              }
            }}
          >
            {myCourses.length > 0 ? 'My Instructor' : 'Join Instructor'}
          </button>
          <div
            className="avatar-circle"
            onClick={() => setShowLogoutModal(true)}
            title={(user && user.firstName && user.lastName) ? `${user.firstName} ${user.lastName}` : 'Account'}
            style={{ cursor: 'pointer', flexShrink: 0 }}
          >
            {user ? initials : <MdAccountCircle style={{ fontSize: 22 }} />}
          </div>
        </div>
      </div>

      {/* ── Module cards: coverflow carousel (default) o grid ── */}
      <div className="lm-scroll-body">
        <div className="lm-heading">
          <h2>
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}! 👋
          </h2>
          <div className="lm-view-toggle">
            <button
              className={`lm-view-btn ${view === 'carousel' ? 'active' : ''}`}
              onClick={() => setView('carousel')}
            >
              <MdViewCarousel size={16} /> Carousel
            </button>
            <button
              className={`lm-view-btn ${view === 'grid' ? 'active' : ''}`}
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
              className="lm-carousel-wrap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {/* ── Stacked-card carousel (adapted from MDJAmin,
                  freefrontend.com/css-carousels) ── */}
              <div className="stk-carousel">
                <div className="stk-stage">
                  {order.map((modIdx, pos) => {
                    const module = MODULES[modIdx];
                    const state  = moduleStates[module.id] ?? { unlocked: false, completed: false, overallPercent: 0 };
                    const locked = !state.unlocked;
                    const isActive = pos === 1;

                    return (
                      <div
                        key={module.id}
                        className={`stk-item ${stackPosClass(pos)} ${locked ? 'locked' : ''}`}
                        style={{ backgroundImage: `url(${module.img})` }}
                        onClick={pos >= 2 ? () => bringToActive(pos) : undefined}
                      >
                        <span className="stk-chip">Module {module.num}</span>
                        {locked
                          ? <span className="stk-lock">🔒 Locked</span>
                          : state.completed
                            ? <span className="stk-lock done">✓ Completed</span>
                            : null}

                        {isActive && (
                          // key={module.id} → nagre-mount tuwing nagbabago ang
                          // active card, kaya muling tumutugtog ang blur/slide
                          // -up entrance animation (tulad sa reference).
                          <div className="stk-content" key={module.id}>
                            <div className="stk-name">{module.label}</div>
                            <div className="stk-des">{module.desc}</div>
                            <div className="stk-prog">
                              <div className="stk-track">
                                <div className="stk-fill" style={{ width: `${state.overallPercent}%` }} />
                              </div>
                              <span>{locked ? 'Locked' : `${state.overallPercent}% complete`}</span>
                            </div>
                            <button
                              className="stk-cta"
                              onClick={(e) => { e.stopPropagation(); handleModuleClick(module); }}
                            >
                              {locked ? '🔒 LOCKED' : (state.overallPercent > 0 ? 'CONTINUE MODULE ▶' : 'START MODULE ▶')}
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
              <p className="lm-caption">Pick up where you left off — swipe through your learning modules.</p>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              className="lm-grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {MODULES.map((module) => (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (module.num - 1) * 0.04 }}
                >
                  {renderModuleCard(module)}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation — Sliding Pill */}
      <div className="bottom-nav">
        <div className="bottom-nav-pill" />
        <div className="bottom-nav-btn active" onClick={() => navigate('/learning-modules')}>
          <span className="bottom-nav-icon"><SiBookstack /></span>
          <span className="bottom-nav-label">Learning Modules</span>
        </div>
        <div className="bottom-nav-btn" onClick={() => navigate('/pvp-quiz')}>
          <span className="bottom-nav-icon"><LuSwords /></span>
          <span className="bottom-nav-label">PVP Quiz Arena</span>
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