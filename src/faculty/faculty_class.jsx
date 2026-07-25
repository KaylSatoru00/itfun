// faculty_class.jsx
import { useState, useEffect } from 'react';
import './faculty_class.css';
import { motion, AnimatePresence } from 'framer-motion';
import { MdAccountCircle, MdGroups } from 'react-icons/md';
import { IoSearchCircle } from 'react-icons/io5';
import { SiBookstack } from 'react-icons/si';
import { CiLogout } from 'react-icons/ci';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../user_context';
import { db } from '../firebase';
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, where, serverTimestamp, onSnapshot,
} from 'firebase/firestore';
import itfunLogo from '../assets/LOGO_NAMEN.png';

function generateClassCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const SECTIONS = Array.from({ length: 10 }, (_, i) =>
  `BSIT-1${String.fromCharCode(65 + i)}`
);

const MODULE_NAMES = [
  'Introduction to Computers and History of Computers',
  'Language & Types of Computers with Their Uses',
  'Number System & Conversions',
  'Hardware Components, Input and Output Devices & Basic PC-Building',
  'Types of Software',
  'Networking Fundamentals',
  'Microsoft Office Applications',
  'Application of Computers in Different Fields',
  'Keyboarding',
];

// ── Module definitions for progress tracking ──
// Each module defines which lessons it contains
const MODULE_DEFINITIONS = {
  module1: {
    displayName: 'Introduction to Computers and History of Computers',
    lessons: ['lesson1', 'lesson2', 'lesson3'],
    totalLessons: 3,
  },
  module2: {
    displayName: 'Language & Types of Computers with Their Uses',
    lessons: ['lesson1', 'lesson2', 'lesson3', 'lesson4'],
    totalLessons: 4,
  },
  module3: {
    displayName: 'Number System & Conversions',
    lessons: ['lesson1', 'lesson2'],
    totalLessons: 2,
  },
  module4: {
    displayName: 'Hardware Components, Input and Output Devices & Basic PC-Building',
    lessons: ['parts', 'iodevices'],
    totalLessons: 2,
  },
  module5: {
    displayName: 'Types of Software',
    lessons: ['software'],
    totalLessons: 1,
  },
  module6: {
    displayName: 'Networking Fundamentals',
    lessons: ['characteristics', 'internet', 'areas'],
    totalLessons: 3,
  },
  module7: {
    displayName: 'Microsoft Office Applications',
    lessons: ['intro', 'apps'],
    totalLessons: 2,
  },
  module8: {
    displayName: 'Application of Computers in Different Fields',
    lessons: ['applications'],
    totalLessons: 1,
  },
  module9: {
    displayName: 'Keyboarding',
    lessons: ['keyboarding'],
    totalLessons: 1,
  },
};

// ── For display, show all modules 1-9 ──
const VISIBLE_MODULES = ['module1', 'module2', 'module3', 'module4', 'module5', 'module6', 'module7', 'module8', 'module9'];

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatName(s) {
  if (s.studentLastName && s.studentFirstName) {
    const last = s.studentLastName.charAt(0).toUpperCase() + s.studentLastName.slice(1).toLowerCase();
    const first = s.studentFirstName.split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
    return `${last}, ${first}`;
  }
  const parts = (s.studentName || '').trim().split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  if (parts.length === 1) return parts[0];
  const lastName = parts[parts.length - 1];
  const firstName = parts.slice(0, -1).join(' ');
  return `${lastName}, ${firstName}`;
}

// ── Helper function to extract last name for sorting ──
function getLastNameForSorting(student) {
  if (student.studentLastName) {
    return student.studentLastName.toLowerCase();
  }
  // If no separate last name field, try to extract from studentName
  const name = student.studentName || '';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return name.toLowerCase();
  // Assume last part is the last name
  return parts[parts.length - 1].toLowerCase();
}

function DonutChart({ percent, size = 100, strokeWidth = 10, showSub = true }) {
  const half = size / 2;
  const r = half - strokeWidth;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color = percent >= 80 ? '#2e7d32' : percent >= 60 ? '#e65100' : '#c8102e';
  const fontSize = size * 0.2;
  const subFontSize = size * 0.09;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={half} cy={half} r={r} fill="none" stroke="#f0e2e5" strokeWidth={strokeWidth} />
      <circle
        cx={half} cy={half} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${half} ${half})`}
        style={{ transition: 'stroke-dashoffset 0.7s ease' }}
      />
      {showSub ? (
        <>
          <text x={half} y={half - 2} textAnchor="middle" fontSize={fontSize} fontWeight="800" fill="#222" fontFamily="Poppins,sans-serif">{percent}%</text>
          <text x={half} y={half + fontSize * 0.85} textAnchor="middle" fontSize={subFontSize} fill="#999" fontFamily="Montserrat,sans-serif" letterSpacing="1">OVERALL</text>
        </>
      ) : (
        <text x={half} y={half + fontSize * 0.35} textAnchor="middle" fontSize={fontSize} fontWeight="800" fill="#222" fontFamily="Poppins,sans-serif">{percent}%</text>
      )}
    </svg>
  );
}

function FacultyClass() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [classes, setClasses] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [activeClass, setActiveClass] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [confirmRemoveStudentId, setConfirmRemoveStudentId] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [creating, setCreating] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [confirmFinishId, setConfirmFinishId] = useState(null);

  // ── Local "today" (not UTC) for the date picker min + end-of-class check ──
  const _now = new Date();
  const todayStr = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`;
  const todayLabel = _now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const fmtDate = (iso) => {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  // A class has ended once today is strictly past its endDate (string compare is safe for YYYY-MM-DD).
  const isEnded = (cls) => cls.endDate && todayStr > cls.endDate;
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '?';

  // ── State for selected student's progress ──
  const [selectedStudentProgress, setSelectedStudentProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  // ── State for all students' overall progress (for card rings) ──
  const [allStudentsProgress, setAllStudentsProgress] = useState({});

  useEffect(() => {
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = '#ffffff';
    return () => {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  // Load faculty's classes from Firestore
  useEffect(() => {
    if (!user) return;
    setLoadingClasses(true);
    const q = query(collection(db, 'classes'), where('facultyId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const loaded = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
      const sorted = loaded.sort((a, b) => a.name.localeCompare(b.name));
        setClasses(sorted);
        setMyClasses(sorted);
        setLoadingClasses(false);
    });
    return () => unsub();
  }, [user]);

  // ── Restore activeClass from URL on refresh ──
  useEffect(() => {
    if (classes.length === 0) return;
    const params = new URLSearchParams(location.search);
    const classId = params.get('classId');
    if (classId && !activeClass) {
      const found = classes.find(c => c.firestoreId === classId);
      if (found) {
        setActiveClass(found);
        setStudentSearch('');
      }
    }
  }, [classes, location.search]);

  // Load enrolled students when a class is opened
  useEffect(() => {
    if (!activeClass) {
      setEnrolledStudents([]);
      setSelectedStudent(null);
      setSelectedStudentProgress(null);
      return;
    }
    setLoadingStudents(true);
    const q = query(collection(db, 'enrollments'), where('classId', '==', activeClass.firestoreId));
    const unsub = onSnapshot(q, (snap) => {
      const students = snap.docs.map(d => ({ enrollmentDocId: d.id, ...d.data() }));
      // ── Sort students alphabetically by last name ──
      const sortedStudents = students.sort((a, b) => {
        const lastNameA = getLastNameForSorting(a);
        const lastNameB = getLastNameForSorting(b);
        return lastNameA.localeCompare(lastNameB);
      });
      setEnrolledStudents(sortedStudents);
      setLoadingStudents(false);
    });
    return () => unsub();
  }, [activeClass]);

  // ── Fetch overall progress for all enrolled students (for card rings) ──
  useEffect(() => {
    if (enrolledStudents.length === 0) { setAllStudentsProgress({}); return; }
    const unsubs = enrolledStudents.map(s => {
      const progressRef = doc(db, 'studentProgress', s.studentId);
      return onSnapshot(progressRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const values = VISIBLE_MODULES.map(key => {
            const moduleDef = MODULE_DEFINITIONS[key];
            if (!moduleDef || moduleDef.totalLessons === 0) return 0;
            const moduleData = data?.modules?.[key] || {};
            const lessons = moduleData.lessons || {};
            let total = 0;
            moduleDef.lessons.forEach(lk => {
              const ld = lessons[lk];
              if (ld && typeof ld.progress === 'number') total += ld.progress;
            });
            return Math.round((total / moduleDef.totalLessons) * 100) / 100;
          });
          const overall = Math.round(values.reduce((sum, p) => sum + p, 0) / VISIBLE_MODULES.length * 100) / 100;
          setAllStudentsProgress(prev => ({ ...prev, [s.studentId]: overall }));
        } else {
          setAllStudentsProgress(prev => ({ ...prev, [s.studentId]: 0 }));
        }
      });
    });
    return () => unsubs.forEach(u => u());
  }, [enrolledStudents]);

  // ── Listen to selected student's progress in real-time ──
  useEffect(() => {
    if (!selectedStudent) {
      setSelectedStudentProgress(null);
      return;
    }

    setLoadingProgress(true);
    const progressRef = doc(db, 'studentProgress', selectedStudent.studentId);

    const unsub = onSnapshot(progressRef, (snap) => {
      if (snap.exists()) {
        setSelectedStudentProgress(snap.data());
      } else {
        // No progress doc yet - student hasn't started any modules
        setSelectedStudentProgress(null);
      }
      setLoadingProgress(false);
    }, (error) => {
      console.error('Error loading student progress:', error);
      setLoadingProgress(false);
    });

    return () => unsub();
  }, [selectedStudent]);

  // ── Calculate module progress for a given module ──
  const calculateModuleProgress = (moduleKey, progressData) => {
    const moduleDef = MODULE_DEFINITIONS[moduleKey];
    if (!moduleDef || moduleDef.totalLessons === 0) return 0;

    const modules = progressData?.modules || {};
    const moduleData = modules[moduleKey] || {};
    const lessons = moduleData.lessons || {};

    // Calculate average of all lesson progress
    let totalProgress = 0;
    let lessonCount = 0;

    moduleDef.lessons.forEach(lessonKey => {
      const lessonData = lessons[lessonKey];
      if (lessonData && typeof lessonData.progress === 'number') {
        totalProgress += lessonData.progress;
        lessonCount++;
      }
    });

    // If no lessons have progress data, return 0
    if (lessonCount === 0) return 0;

    // Average = sum of lesson progress / total lessons in module
    return Math.round((totalProgress / moduleDef.totalLessons) * 100) / 100;
  };

  // ── Helper to check if student has progress doc ──
  const hasProgress = selectedStudentProgress !== null;

  const handleGenerateCode = () => setGeneratedCode(generateClassCode());

  const handleCreateClass = async () => {
    if (!selectedSection || !generatedCode || !endDate || !user) return;
    setCreating(true);
    try {
      await addDoc(collection(db, 'classes'), {
        subject: 'IT 11 - IT Fundamentals',
        name: selectedSection,
        school: 'Dominican College of Tarlac',
        accessCode: generatedCode,
        facultyId: user.uid,
        facultyName: `${user.firstName} ${user.lastName}`,
        startDate: todayStr,   // auto: the day the class is created
        endDate,               // faculty-picked; class auto-ends on this date
        createdAt: serverTimestamp(),
      });
      setSelectedSection('');
      setGeneratedCode('');
      setEndDate('');
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error creating class:', err);
    }
    setCreating(false);
  };

  // ── Finish an ended class: delete it (and its enrollments) so the section
  //    frees up again in the Create Class dropdown. ──
  const handleFinishClass = (id) => setConfirmFinishId(id);

  const handleConfirmFinish = async () => {
    const cls = classes.find(c => c.firestoreId === confirmFinishId);
    if (!cls) { setConfirmFinishId(null); return; }
    try {
      await deleteDoc(doc(db, 'classes', cls.firestoreId));
      const q = query(collection(db, 'enrollments'), where('classId', '==', cls.firestoreId));
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'enrollments', d.id))));
    } catch (err) {
      console.error('Error finishing class:', err);
    }
    setConfirmFinishId(null);
  };

  const handleRemoveStudent = (enrollmentDocId) => setConfirmRemoveStudentId(enrollmentDocId);

  const handleConfirmRemoveStudent = async () => {
    try {
      await deleteDoc(doc(db, 'enrollments', confirmRemoveStudentId));
      if (selectedStudent?.enrollmentDocId === confirmRemoveStudentId) setSelectedStudent(null);
    } catch (err) {
      console.error('Error removing student:', err);
    }
    setConfirmRemoveStudentId(null);
  };

  // ── Filter and sort students for display ──
  const getFilteredAndSortedStudents = () => {
    const filtered = enrolledStudents.filter(s =>
      s.studentName.toLowerCase().includes(studentSearch.toLowerCase())
    );
    // Sort filtered results by last name
    return filtered.sort((a, b) => {
      const lastNameA = getLastNameForSorting(a);
      const lastNameB = getLastNameForSorting(b);
      return lastNameA.localeCompare(lastNameB);
    });
  };

  const filteredStudents = getFilteredAndSortedStudents();

  function avatarColor(uid = '') {
    let hash = 0;
    for (let i = 0; i < uid.length; i++) hash = uid.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${hash % 360}, 55%, 52%)`;
  }

  // Overall percent for the selected student (used by the progress modal donut)
  const selectedOverall = (() => {
    if (!hasProgress) return 0;
    const values = VISIBLE_MODULES.map(key => calculateModuleProgress(key, selectedStudentProgress));
    const total = values.reduce((sum, p) => sum + p, 0);
    return Math.round((total / VISIBLE_MODULES.length) * 100) / 100;
  })();

  return (
    <motion.div
      className="fc-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Top Navbar (full width, matches faculty_modules) ── */}
      <div className="top-navbar">
        <div className="fc-brand">
          <img src={itfunLogo} className="fc-logo" alt="ITFun logo" />
          <span className="fc-wordmark">IT<span>Fun</span></span>
        </div>
        <div className="navbar-spacer" />
        <div
          className="avatar-circle"
          onClick={() => setShowLogoutModal(true)}
          title={user ? `${user.firstName} ${user.lastName}` : 'Account'}
        >
          {user ? initials : <MdAccountCircle style={{ fontSize: 22 }} />}
        </div>
      </div>

      {/* ── Body: sidebar + main ── */}
      <div className="fc-below">
        <aside className="fc-side">
          <nav className="fc-nav">
            <button className="fc-nav-item" onClick={() => navigate('/faculty-modules')}>
              <span className="fc-nav-icon"><SiBookstack /></span>
              <span className="fc-nav-label">Modules</span>
            </button>
            <button className="fc-nav-item active">
              <span className="fc-nav-icon"><MdGroups /></span>
              <span className="fc-nav-label">Classes</span>
            </button>
          </nav>
          <div className="fc-side-foot">Faculty Dashboard</div>
        </aside>

        <main className="fc-main">
          <AnimatePresence mode="wait">

            {/* ── CLASS LIST VIEW ── */}
            {!activeClass && (
              <motion.div
                key="classlist"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="fc-heading">Class Section</h2>

                {loadingClasses ? (
                  <p className="fc-loading">Loading classes...</p>
                ) : (
                  <motion.div
                    className="fc-class-grid"
                    initial="hidden"
                    animate="show"
                    variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
                  >
                    {classes.map((cls) => (
                      <motion.div
                        key={cls.firestoreId}
                        className="fc-class-card"
                        variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
                        whileHover={{ y: -5 }}
                        onClick={() => { setActiveClass(cls); setStudentSearch(''); navigate(`/faculty-class?classId=${cls.firestoreId}`); }}
                      >
                        <span className="fc-class-subj">{cls.subject}</span>
                        <div className="fc-class-name">{cls.name}</div>
                        <div className="fc-class-school">{cls.school}</div>
                        <div className="fc-class-code">Access Code <strong>{cls.accessCode}</strong></div>
                        {cls.endDate && (
                          <div className={`fc-class-duration ${isEnded(cls) ? 'ended' : ''}`}>
                            {isEnded(cls)
                              ? <>Ended {fmtDate(cls.endDate)}</>
                              : <>Ends {fmtDate(cls.endDate)}</>}
                          </div>
                        )}
                        {isEnded(cls) && (
                          <button
                            className="fc-class-finish"
                            onClick={e => { e.stopPropagation(); handleFinishClass(cls.firestoreId); }}
                          >
                            ✓ Finish Class
                          </button>
                        )}
                      </motion.div>
                    ))}

                    <motion.div
                      className="fc-add-card"
                      variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowCreateModal(true)}
                    >
                      <span className="fc-add-icon">+</span>
                      <span className="fc-add-text">Create Class</span>
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── INSIDE CLASS VIEW ── */}
            {activeClass && (
              <motion.div
                key="insideclass"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <div className="fc-inside-head">
                  <button className="fc-back" onClick={() => { setActiveClass(null); setSelectedStudent(null); navigate('/faculty-class'); }}>
                    ← Back
                  </button>
                  <div className="fc-inside-info">
                    <div className="fc-inside-name">{activeClass.name}</div>
                    <div className="fc-inside-meta">{activeClass.subject} · Code: <strong>{activeClass.accessCode}</strong></div>
                  </div>
                </div>

                <div className="fc-inside-toolbar">
                  <div className="fc-inside-count">
                    {enrolledStudents.length} student{enrolledStudents.length !== 1 ? 's' : ''} enrolled
                  </div>
                  <div className="fc-search">
                    <IoSearchCircle className="fc-search-icon" />
                    <input
                      type="text"
                      className="fc-search-input"
                      placeholder="Search students..."
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                    />
                    {studentSearch && (
                      <button className="fc-search-clear" onClick={() => setStudentSearch('')}>×</button>
                    )}
                  </div>
                </div>

                {loadingStudents ? (
                  <p className="fc-loading">Loading students...</p>
                ) : filteredStudents.length === 0 ? (
                  <div className="fc-empty">
                    <div className="fc-empty-icon">👥</div>
                    <p className="fc-empty-text">
                      {enrolledStudents.length === 0
                        ? 'No students have joined yet. Share the access code!'
                        : 'No students match your search.'}
                    </p>
                  </div>
                ) : (
                  <motion.div
                    className="fc-student-grid"
                    initial="hidden"
                    animate="show"
                    variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
                  >
                    {filteredStudents.map(s => {
                      const pct = Math.round(allStudentsProgress[s.studentId] ?? 0);
                      return (
                        <motion.div
                          key={s.enrollmentDocId}
                          className="fc-student-card"
                          variants={{ hidden: { opacity: 0, y: 16, scale: 0.96 }, show: { opacity: 1, y: 0, scale: 1 } }}
                          whileHover={{ y: -5 }}
                          onClick={() => setSelectedStudent(s)}
                        >
                          <button
                            className="fc-student-unenroll"
                            onClick={e => { e.stopPropagation(); handleRemoveStudent(s.enrollmentDocId); }}
                            title="Unenroll student"
                          >×</button>
                          <div className="fc-student-avatar" style={{ background: avatarColor(s.studentId) }}>
                            {getInitials(s.studentName)}
                          </div>
                          <div className="fc-student-name">{formatName(s)}</div>
                          <div className="fc-student-mail">{s.studentEmail}</div>
                          <div className="fc-student-ring">
                            <DonutChart percent={pct} size={74} strokeWidth={8} showSub={false} />
                          </div>
                          <div className="fc-student-hint">View progress →</div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

      {/* ── STUDENT PROGRESS MODAL ── */}
      <AnimatePresence>
        {selectedStudent && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedStudent(null)}
          >
            <motion.div
              className="fc-progress-modal"
              initial={{ scale: 0.9, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="fc-pm-head">
                <span className="fc-pm-title">Student Progress</span>
                <button className="fc-pm-close" onClick={() => setSelectedStudent(null)}>×</button>
              </div>

              <div className="fc-pm-top">
                <div className="fc-pm-avatar" style={{ background: avatarColor(selectedStudent.studentId) }}>
                  {getInitials(selectedStudent.studentName)}
                </div>
                <div className="fc-pm-id">
                  <div className="fc-pm-name">{formatName(selectedStudent)}</div>
                  <div className="fc-pm-mail">{selectedStudent.studentEmail}</div>
                  <span className="fc-pm-badge">Enrolled</span>
                </div>
              </div>

              <div className="fc-pm-body">
                <div className="fc-pm-donut">
                  <DonutChart percent={selectedOverall} size={150} strokeWidth={16} />
                  <div className="fc-pm-joined">
                    Joined {selectedStudent.joinedAt?.toDate
                      ? selectedStudent.joinedAt.toDate().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </div>
                </div>

                <div className="fc-pm-mods">
                  <p className="fc-pm-seclabel">Module Progress</p>
                  {loadingProgress ? (
                    <p className="fc-pm-note">Loading progress...</p>
                  ) : !hasProgress ? (
                    <p className="fc-pm-note">No progress data yet</p>
                  ) : (
                    VISIBLE_MODULES.map((moduleKey, i) => {
                      const moduleDef = MODULE_DEFINITIONS[moduleKey];
                      const moduleProgress = calculateModuleProgress(moduleKey, selectedStudentProgress);
                      const barColor = moduleProgress >= 80 ? '#2e7d32' : moduleProgress >= 60 ? '#e65100' : '#c8102e';
                      return (
                        <motion.div
                          key={moduleKey}
                          className="fc-pm-mrow"
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + i * 0.04 }}
                        >
                          <div className="fc-pm-mtop">
                            <span className="fc-pm-mname">{moduleDef.displayName}</span>
                            <span className="fc-pm-mpct">{moduleProgress}%</span>
                          </div>
                          <div className="fc-pm-mtrack">
                            <div className="fc-pm-mfill" style={{ width: `${moduleProgress}%`, background: barColor }} />
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONFIRM REMOVE STUDENT MODAL ── */}
      <AnimatePresence>
        {confirmRemoveStudentId !== null && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setConfirmRemoveStudentId(null)}
          >
            <motion.div
              className="confirm-remove-modal"
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="confirm-icon">🗑️</div>
              <p className="confirm-message">Unenroll this student from the class?</p>
              <div className="confirm-footer">
                <button className="confirm-cancel-btn" onClick={() => setConfirmRemoveStudentId(null)}>Cancel</button>
                <button className="confirm-remove-btn" onClick={handleConfirmRemoveStudent}>Unenroll</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CREATE CLASS MODAL ── */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { setShowCreateModal(false); setSelectedSection(''); setGeneratedCode(''); setEndDate(''); }}
          >
            <motion.div
              className="create-class-modal"
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={e => e.stopPropagation()}
            >
              <h3 className="modal-heading">Create a Class</h3>
              <p className="modal-subheading">Pick a section and generate an access code</p>

              <label className="modal-label">Class Section</label>
              <select
                className="modal-section-select"
                value={selectedSection}
                onChange={e => setSelectedSection(e.target.value)}
              >
                <option value="">Select Section</option>
                {SECTIONS.map(sec => {
                  const taken = classes.some(c => c.name === sec);
                  return (
                    <option key={sec} value={sec} disabled={taken}>
                      {taken ? `${sec} (Already Created)` : sec}
                    </option>
                  );
                })}
              </select>

              {selectedSection && (
                <div className="modal-selected-label">
                  Selected: <strong>{selectedSection}</strong>
                </div>
              )}

              <label className="modal-label" style={{ marginTop: '16px' }}>Class Duration</label>
              <div className="modal-date-row">
                <span className="modal-date-tag">Start</span>
                <div className="modal-date-field locked">
                  <span>{todayLabel}</span>
                  <span className="modal-date-ico" aria-hidden="true">🔒</span>
                </div>
              </div>
              <div className="modal-date-row">
                <span className="modal-date-tag">End</span>
                <div className={`modal-date-field end ${endDate ? 'filled' : ''}`}>
                  <input
                    type="date"
                    className="modal-date-input"
                    min={todayStr}
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    onKeyDown={e => { if (e.key !== 'Tab') e.preventDefault(); }}
                    onClick={e => e.currentTarget.showPicker?.()}
                  />
                </div>
              </div>
              <p className="modal-date-help">Class auto-ends on this date. Dates before today are disabled.</p>

              <button
                className="modal-generate-btn"
                onClick={handleGenerateCode}
                disabled={!selectedSection}
              >
                Generate Access Code
              </button>

              <AnimatePresence>
                {generatedCode && (
                  <motion.div
                    className="modal-code-display"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                  >
                    {generatedCode}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="modal-create-row">
                <button
                  className="modal-create-btn"
                  onClick={handleCreateClass}
                  disabled={creating || !selectedSection || !generatedCode || !endDate}
                >
                  {creating ? 'Creating...' : 'Create Class'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONFIRM FINISH CLASS MODAL ── */}
      <AnimatePresence>
        {confirmFinishId !== null && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setConfirmFinishId(null)}
          >
            <motion.div
              className="confirm-remove-modal"
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="confirm-icon">🎓</div>
              <p className="confirm-message">Finish this class? It will be closed and removed, and its section becomes available again. Enrolled students will be unenrolled.</p>
              <div className="confirm-footer">
                <button className="confirm-cancel-btn" onClick={() => setConfirmFinishId(null)}>Cancel</button>
                <button className="confirm-remove-btn" onClick={handleConfirmFinish}>Finish Class</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

export default FacultyClass;
