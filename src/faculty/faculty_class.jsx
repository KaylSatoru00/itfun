// faculty_class.jsx
import { useState, useEffect } from 'react';
import './faculty_class.css';
import { motion, AnimatePresence } from 'framer-motion';
import { MdAccountCircle } from 'react-icons/md';
import { IoSearchCircle } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../user_context';
import { db } from '../firebase';
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, where, serverTimestamp, onSnapshot,
} from 'firebase/firestore';

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
    lessons: ['intro', 'powerpoint', 'word', 'excel'],
    totalLessons: 4,
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

function DonutChart({ percent, size = 100, strokeWidth = 10 }) {
  const half = size / 2;
  const r = half - strokeWidth;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color = percent >= 80 ? '#2e7d32' : percent >= 60 ? '#e65100' : '#c8102e';
  const fontSize = size * 0.13;
  const subFontSize = size * 0.08;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={half} cy={half} r={r} fill="none" stroke="#f0f0f0" strokeWidth={strokeWidth} />
      <circle
        cx={half} cy={half} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${half} ${half})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x={half} y={half - 2} textAnchor="middle" fontSize={fontSize} fontWeight="bold" fill="#222" fontFamily="Arial,sans-serif">{percent}%</text>
      <text x={half} y={half + fontSize * 0.9} textAnchor="middle" fontSize={subFontSize} fill="#888" fontFamily="Arial,sans-serif">OVERALL</text>
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
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [activeClass, setActiveClass] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [confirmRemoveStudentId, setConfirmRemoveStudentId] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { user } = useUser();
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '?';

  // ── State for selected student's progress ──
  const [selectedStudentProgress, setSelectedStudentProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  // ── State for all students' overall progress (for table row bars) ──
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

  // ── Fetch overall progress for all enrolled students (for table row bars) ──
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
    if (!selectedSection || !generatedCode || !user) return;
    setCreating(true);
    try {
      await addDoc(collection(db, 'classes'), {
        subject: 'IT 11 - IT Fundamentals',
        name: selectedSection,
        school: 'Dominican College of Tarlac',
        accessCode: generatedCode,
        facultyId: user.uid,
        facultyName: `${user.firstName} ${user.lastName}`,
        createdAt: serverTimestamp(),
      });
      setSelectedSection('');
      setGeneratedCode('');
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error creating class:', err);
    }
    setCreating(false);
  };

  const handleRemoveClass = (id) => setConfirmRemoveId(id);

  const handleConfirmRemove = async () => {
    const cls = classes.find(c => c.firestoreId === confirmRemoveId);
    if (!cls) { setConfirmRemoveId(null); return; }
    try {
      await deleteDoc(doc(db, 'classes', cls.firestoreId));
      const q = query(collection(db, 'enrollments'), where('classId', '==', cls.firestoreId));
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'enrollments', d.id))));
    } catch (err) {
      console.error('Error removing class:', err);
    }
    setConfirmRemoveId(null);
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
    return `hsl(${hash % 360}, 60%, 55%)`;
  }

  return (
    <motion.div
      className="fc-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Top Navbar ── */}
      <div className="top-navbar">
        <div className="navbar-spacer" />
        <div className="top-center-btns">
          <button className="top-btn" onClick={() => navigate('/faculty-modules')}>
            Modules
          </button>
          <button className="top-btn active-btn">
            Class
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

      <AnimatePresence mode="wait">

        {/* ── CLASS LIST VIEW ── */}
        {!activeClass && (
          <motion.div
            key="classlist"
            className="class-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h1 style={{
              textAlign: 'center',
              fontFamily: 'Arial, sans-serif',
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#222',
              margin: '0 0 20px 0',
              letterSpacing: '2px',
            }}>CLASS SECTION</h1>

            <div className="class-cards-area">
              {loadingClasses ? (
                <p style={{ fontFamily: 'Arial, sans-serif', color: '#aaa', padding: '20px' }}>Loading classes...</p>
              ) : (
                <>
                  {classes.map(cls => (
                    <div
                      key={cls.firestoreId}
                      className="class-card"
                      onClick={() => { setActiveClass(cls); setStudentSearch(''); }}
                    >
                      <div className="class-card-subject">{cls.subject}</div>
                      <div className="class-card-name">{cls.name}</div>
                      <div className="class-card-school">{cls.school}</div>
                      <div className="class-card-code">Access Code: <strong>{cls.accessCode}</strong></div>
                      <button
                        className="class-card-remove"
                        onClick={e => { e.stopPropagation(); handleRemoveClass(cls.firestoreId); }}
                        title="Remove class"
                      >×</button>
                    </div>
                  ))}

                  <div className="class-card add-card" onClick={() => setShowCreateModal(true)}>
                    <span className="add-card-icon">+</span>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* ── INSIDE CLASS VIEW ── */}
        {activeClass && (
          <motion.div
            key="insideclass"
            className="inside-class-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="inside-class-header">
              <button className="ic-back-btn" onClick={() => { setActiveClass(null); setSelectedStudent(null); }}>
                ← Back
              </button>
              <div className="ic-class-info">
                <div className="ic-class-name">{activeClass.name}</div>
                <div className="ic-class-subject">{activeClass.subject} · Code: <strong>{activeClass.accessCode}</strong></div>
              </div>
            </div>

            <div className="inside-class-body">

              {/* LEFT: Student Table */}
              <div className="ic-table-panel">
                <div className="ic-table-title">Enrolled Students</div>
                <div className="ic-table-subtitle">{enrolledStudents.length} student{enrolledStudents.length !== 1 ? 's' : ''} enrolled</div>

                <div className="ic-search-bar">
                  <IoSearchCircle className="ic-search-icon" />
                  <input
                    type="text"
                    className="ic-search-input"
                    placeholder="Search students..."
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                  />
                  {studentSearch && (
                    <button className="ic-search-clear" onClick={() => setStudentSearch('')}>×</button>
                  )}
                </div>

                <div className="ic-table-header">
                  <span>STUDENT</span>
                  <span>EMAIL</span>
                  <span>JOINED</span>
                  <span>PROGRESS</span>
                  <span></span>
                </div>

                <div className="ic-table-body">
                  {loadingStudents ? (
                    <p style={{ textAlign: 'center', color: '#aaa', padding: '20px', fontFamily: 'Arial, sans-serif', fontSize: '13px' }}>
                      Loading students...
                    </p>
                  ) : filteredStudents.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#aaa', padding: '20px', fontFamily: 'Arial, sans-serif', fontSize: '13px' }}>
                      {enrolledStudents.length === 0
                        ? 'No students have joined yet. Share the access code!'
                        : 'No students match your search.'}
                    </p>
                  ) : (
                    filteredStudents.map(s => (
  <div
    key={s.enrollmentDocId}
    className={`ic-table-row ${selectedStudent?.enrollmentDocId === s.enrollmentDocId ? 'selected' : ''}`}
    onClick={() => setSelectedStudent(s)}
  >
    <div className="ic-student-cell">
      <div className="ic-avatar" style={{ background: avatarColor(s.studentId) }}>
        {getInitials(s.studentName)}
      </div>
      <div className="ic-student-text">
        <div className="ic-student-name">{formatName(s)}</div>
        <div className="ic-student-id">{s.studentEmail}</div>
      </div>
    </div>

    <div className="ic-section-cell ic-email-cell">
      {s.studentEmail}
    </div>

    <div className="ic-section-cell ic-joined-cell">
      {s.joinedAt?.toDate
        ? s.joinedAt.toDate().toLocaleDateString('en-PH', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : '-'}
    </div>

    <div className="ic-progress-cell">
      <div className="ic-progress-bar-track">
        <div
          className="ic-progress-bar-fill"
          style={{
            width: `${allStudentsProgress[s.studentId] ?? 0}%`,
            background:
              (allStudentsProgress[s.studentId] ?? 0) >= 80
                ? '#2e7d32'
                : (allStudentsProgress[s.studentId] ?? 0) >= 60
                  ? '#e65100'
                  : '#c8102e',
          }}
        />
      </div>
      <span className="ic-progress-label">{allStudentsProgress[s.studentId] ?? 0}%</span>
    </div>

    <button
      className="ic-unenroll-btn"
      onClick={e => {
        e.stopPropagation();
        handleRemoveStudent(s.enrollmentDocId);
      }}
      title="Unenroll student"
    >
      Unenroll
    </button>
  </div>
))
                  )}
                </div>
              </div>

              {/* RIGHT: Student Profile Panel */}
              <AnimatePresence mode="wait">
                {selectedStudent ? (
                  <motion.div
                    key={selectedStudent.enrollmentDocId}
                    className="ic-profile-panel"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 26 }}
                  >
                    <div className="ic-profile-header">
                      <span className="ic-profile-title">Student Profile</span>
                      <span className="ic-live-badge">Enrolled</span>
                    </div>

                    <div className="ic-profile-top">
                      <div
                        className="ic-profile-avatar"
                        style={{ background: avatarColor(selectedStudent.studentId) }}
                      >
                        {getInitials(selectedStudent.studentName)}
                      </div>
                      <div className="ic-profile-info">
                        <div className="ic-profile-name">{formatName(selectedStudent)}</div>
                        <div className="ic-profile-meta">{selectedStudent.studentEmail}</div>
                        <div className="ic-status-badge" style={{ color: '#2e7d32', background: '#e8f5e9' }}>
                          Enrolled
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '12px 0', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
                      <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#888', margin: '0 0 4px' }}>Joined</p>
                      <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#333', margin: 0 }}>
                        {selectedStudent.joinedAt?.toDate
                          ? selectedStudent.joinedAt.toDate().toLocaleString('en-PH', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </p>
                    </div>

                    <div>
                      <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#888', margin: '0 0 16px' }}>
                        Progress data will appear here as students complete modules.
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <DonutChart
                          percent={(() => {
                            if (!hasProgress) return 0;
                            const values = VISIBLE_MODULES.map(key =>
                              calculateModuleProgress(key, selectedStudentProgress)
                            );
                            const total = values.reduce((sum, p) => sum + p, 0);
                            return Math.round((total / VISIBLE_MODULES.length) * 100) / 100;
                          })()}
                          size={160}
                          strokeWidth={16}
                        />
                      </div>
                    </div>

                    {/* ── MODULE PROGRESS SECTION ── */}
                    <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', fontWeight: 'bold', color: '#888', margin: '0 0 4px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                        Module Progress
                      </p>
                      
                      {loadingProgress ? (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                          <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#aaa' }}>Loading progress...</p>
                        </div>
                      ) : !hasProgress ? (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                          <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#aaa' }}>
                            No progress data yet
                          </p>
                        </div>
                      ) : (
                        VISIBLE_MODULES.map((moduleKey) => {
                          const moduleDef = MODULE_DEFINITIONS[moduleKey];
                          const moduleProgress = calculateModuleProgress(moduleKey, selectedStudentProgress);
                          const barColor = moduleProgress >= 80 ? '#2e7d32' : moduleProgress >= 60 ? '#e65100' : '#c8102e';
                          
                          return (
                            <div key={moduleKey}>
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'baseline', 
                                marginBottom: '4px' 
                              }}>
                                <span style={{ 
                                  fontFamily: 'Arial, sans-serif', 
                                  fontSize: '13px', 
                                  color: '#444', 
                                  flex: 1, 
                                  paddingRight: '8px', 
                                  lineHeight: '1.3' 
                                }}>
                                  {moduleDef.displayName}
                                </span>
                                <span style={{ 
                                  fontFamily: 'Arial, sans-serif', 
                                  fontSize: '13px', 
                                  color: '#888', 
                                  whiteSpace: 'nowrap', 
                                  fontWeight: 'bold' 
                                }}>
                                  {moduleProgress}%
                                </span>
                              </div>
                              <div style={{ 
                                height: '7px', 
                                background: '#f0d0d5', 
                                borderRadius: '99px', 
                                overflow: 'hidden' 
                              }}>
                                <div style={{ 
                                  height: '100%', 
                                  width: `${moduleProgress}%`, 
                                  background: barColor, 
                                  borderRadius: '99px', 
                                  transition: 'width 0.5s ease' 
                                }} />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    className="ic-profile-panel ic-profile-empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="ic-empty-icon">👤</div>
                    <p className="ic-empty-text">Click a student row to view their profile</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Confirm Remove Student Modal */}
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
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── CREATE CLASS MODAL ── */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { setShowCreateModal(false); setSelectedSection(''); setGeneratedCode(''); }}
          >
            <motion.div
              className="create-class-modal"
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={e => e.stopPropagation()}
            >
              <label className="modal-label">Select Class Section</label>

              <select
                className="modal-section-select"
                value={selectedSection}
                onChange={e => setSelectedSection(e.target.value)}
              >
                <option value="">Select Section</option>
                {SECTIONS.map(sec => {
                  const taken = classes.some(c => c.name === sec);
                  return (
                    <option
                      key={sec}
                      value={sec}
                      disabled={taken}
                    >
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

              <button
                className="modal-generate-btn"
                onClick={handleGenerateCode}
                disabled={!selectedSection}
              >
                Generate Access Code
              </button>

              {generatedCode && (
                <div className="modal-code-display">{generatedCode}</div>
              )}

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                <button
                  className="modal-create-btn"
                  onClick={handleCreateClass}
                  disabled={creating || !selectedSection || !generatedCode}
                >
                  {creating ? 'Creating...' : 'Create Class'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONFIRM REMOVE CLASS MODAL ── */}
      <AnimatePresence>
        {confirmRemoveId !== null && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setConfirmRemoveId(null)}
          >
            <motion.div
              className="confirm-remove-modal"
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="confirm-icon">🗑️</div>
              <p className="confirm-message">Remove this class? All enrolled students will also be removed.</p>
              <div className="confirm-footer">
                <button className="confirm-cancel-btn" onClick={() => setConfirmRemoveId(null)}>Cancel</button>
                <button className="confirm-remove-btn" onClick={handleConfirmRemove}>Remove</button>
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

export default FacultyClass;