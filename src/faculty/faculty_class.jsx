// faculty_class.jsx
import { useState, useEffect, useRef } from 'react';
import './faculty_class.css';
import { motion, AnimatePresence } from 'framer-motion';
import { MdAccountCircle, MdGroups, MdPerson, MdInfoOutline } from 'react-icons/md';
import { RiFilePdf2Fill, RiFileExcel2Fill } from 'react-icons/ri';
import { IoSearchCircle } from 'react-icons/io5';
import { SiBookstack } from 'react-icons/si';
import { CiLogout } from 'react-icons/ci';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../user_context';
import { db } from '../firebase';
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, where, serverTimestamp, onSnapshot, writeBatch,
} from 'firebase/firestore';
import itfunLogo from '../assets/LOGO_NAMEN.png';

function generateClassCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const SECTION_PREFIX = 'BSIT-';

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

// ── Export helpers (PDF / Excel) ──
// Same numbers the modal shows: whole numbers stay whole, otherwise up to 2 decimals.
const fmtPct = (v) => `${Number((Number(v) || 0).toFixed(2))}%`;
// Same color thresholds as the donut and the module bars.
const pctColorHex = (v) => (v >= 80 ? '2E7D32' : v >= 60 ? 'E65100' : 'C8102E');
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

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
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const avatarMenuRef = useRef(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sectionInput, setSectionInput] = useState(''); // what the faculty types, e.g. "1A"
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
  const [duration, setDuration] = useState(null); // ONE shared duration for every class section
  const [confirmFinishId, setConfirmFinishId] = useState(null);
  const [confirmRemoveClassId, setConfirmRemoveClassId] = useState(null);

  // ── Local dates (not UTC) for the date picker min + end-of-class check ──
  const _now = new Date();
  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const todayStr = ymd(_now);
  const _tomorrow = new Date(_now); _tomorrow.setDate(_tomorrow.getDate() + 1);
  const tomorrowStr = ymd(_tomorrow); // earliest selectable end date (class must run at least today)
  const todayLabel = _now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const fmtDate = (iso) => {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  // A class ends ON its endDate: once today has reached that day, it's over
  // (string compare is safe for YYYY-MM-DD).
  // ── Shared class duration (one for all sections) ──
  const endDate = duration?.endDate || '';
  const durationEnded = !!endDate && todayStr >= endDate;
  const durationActive = !!endDate && !durationEnded;
  const startDate = durationActive ? duration.startDate : todayStr;
  // The shared end date wins; fall back to a class's own date for legacy classes.
  const clsEnd = (cls) => endDate || cls.endDate;
  const isEnded = (cls) => { const e = clsEnd(cls); return !!e && todayStr >= e; };

  // ── Section typed by the faculty; "BSIT-" is added automatically ──
  const selectedSection = sectionInput ? `${SECTION_PREFIX}${sectionInput}` : '';
  const sectionTaken = !!selectedSection &&
    classes.some(c => (c.name || '').toUpperCase() === selectedSection);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '?';

  // ── State for selected student's progress ──
  const [selectedStudentProgress, setSelectedStudentProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  // ── State for all students' overall progress (for card rings) ──
  const [allStudentsProgress, setAllStudentsProgress] = useState({});
  // ── Per-module % for every enrolled student (used by the PDF / Excel export) ──
  const [allStudentsModules, setAllStudentsModules] = useState({});
  const [exporting, setExporting] = useState(null); // 'pdf' | 'xlsx' | null

  useEffect(() => {
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = '#ffffff';
    return () => {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  /* ── Close avatar dropdown on outside click / Escape ── */
  useEffect(() => {
    if (!showAvatarMenu) return;
    const handleClickOutside = (e) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target)) {
        setShowAvatarMenu(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setShowAvatarMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showAvatarMenu]);

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

  // Load the faculty's shared class duration
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      doc(db, 'facultySettings', user.uid),
      (snap) => setDuration(snap.exists() ? snap.data() : null),
      (err) => console.error('Error loading class duration:', err),
    );
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
    if (enrolledStudents.length === 0) { setAllStudentsProgress({}); setAllStudentsModules({}); return; }
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
          setAllStudentsModules(prev => ({ ...prev, [s.studentId]: values }));
        } else {
          setAllStudentsProgress(prev => ({ ...prev, [s.studentId]: 0 }));
          setAllStudentsModules(prev => ({ ...prev, [s.studentId]: VISIBLE_MODULES.map(() => 0) }));
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

  // ── Set the one shared duration and apply it to every existing class ──
  const handleEndDateChange = async (value) => {
    if (!value || !user) return;
    const start = durationActive ? duration.startDate : todayStr; // new term → starts today
    setDuration({ startDate: start, endDate: value });            // optimistic UI
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'facultySettings', user.uid), {
        startDate: start,
        endDate: value,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      classes.forEach(c => {
        batch.update(doc(db, 'classes', c.firestoreId), { startDate: start, endDate: value });
      });
      await batch.commit();
    } catch (err) {
      console.error('Error saving class duration:', err);
    }
  };

  const handleCreateClass = async () => {
    if (!selectedSection || sectionTaken || !generatedCode || !durationActive || !user) return;
    setCreating(true);
    try {
      await addDoc(collection(db, 'classes'), {
        subject: 'IT 11 - IT Fundamentals',
        name: selectedSection,
        school: 'Dominican College of Tarlac',
        accessCode: generatedCode,
        facultyId: user.uid,
        facultyName: `${user.firstName} ${user.lastName}`,
        startDate,             // shared duration start
        endDate,               // shared duration end; classes auto-end on this date
        createdAt: serverTimestamp(),
      });
      setSectionInput('');
      setGeneratedCode('');
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error creating class:', err);
    }
    setCreating(false);
  };

  // ── Finish an ended class: delete it (and its enrollments) so the section
  //    frees up again in the Add Class dropdown. ──
  const handleFinishClass = (id) => setConfirmFinishId(id);

  // Shared by "Finish Class" and the X (remove) button: delete the class + its enrollments
  const deleteClassAndEnrollments = async (cls) => {
    await deleteDoc(doc(db, 'classes', cls.firestoreId));
    const q = query(collection(db, 'enrollments'), where('classId', '==', cls.firestoreId));
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'enrollments', d.id))));
  };

  const handleConfirmFinish = async () => {
    const cls = classes.find(c => c.firestoreId === confirmFinishId);
    if (!cls) { setConfirmFinishId(null); return; }
    try {
      await deleteClassAndEnrollments(cls);
    } catch (err) {
      console.error('Error finishing class:', err);
    }
    setConfirmFinishId(null);
  };

  // ── X button: remove a class section at any time (ended or not) ──
  const handleConfirmRemoveClass = async () => {
    const cls = classes.find(c => c.firestoreId === confirmRemoveClassId);
    if (!cls) { setConfirmRemoveClassId(null); return; }
    try {
      await deleteClassAndEnrollments(cls);
    } catch (err) {
      console.error('Error removing class:', err);
    }
    setConfirmRemoveClassId(null);
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

  // ── Export: rows for every enrolled student (not just the searched ones) ──
  const exportReady = enrolledStudents.length > 0 &&
    enrolledStudents.every(s => allStudentsModules[s.studentId] && allStudentsProgress[s.studentId] !== undefined);

  const getExportRows = () => enrolledStudents.map(s => ({
    name: formatName(s),
    email: s.studentEmail || '',
    joined: s.joinedAt?.toDate
      ? s.joinedAt.toDate().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
      : '—',
    overall: allStudentsProgress[s.studentId] ?? 0,
    mods: allStudentsModules[s.studentId] || VISIBLE_MODULES.map(() => 0),
  }));

  const exportFileName = (ext) => `${activeClass.name}_Progress_${todayStr}.${ext}`;

  const handleExportExcel = async () => {
    if (!activeClass || !exportReady || exporting) return;
    setExporting('xlsx');
    try {
      const ExcelJS = (await import('exceljs')).default;
      const rows = getExportRows();
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(activeClass.name.slice(0, 31));
      const lastCol = 4 + VISIBLE_MODULES.length;

      // Class heading (same info as the class header on screen)
      ws.getCell('A1').value = activeClass.name;
      ws.getCell('A1').font = { name: 'Calibri', size: 16, bold: true };
      ws.getCell('A2').value = `${activeClass.subject} · Code: ${activeClass.accessCode}`;
      ws.getCell('A2').font = { name: 'Calibri', size: 11, color: { argb: 'FF7A5A60' } };

      // Table header
      const headers = ['Student', 'Email', 'Joined', 'Overall',
        ...VISIBLE_MODULES.map((k, i) => `Module ${i + 1}: ${MODULE_DEFINITIONS[k].displayName}`)];
      const headRow = ws.getRow(4);
      headers.forEach((h, i) => { headRow.getCell(i + 1).value = h; });
      headRow.height = 62;
      for (let c = 1; c <= lastCol; c++) {
        const cell = headRow.getCell(c);
        cell.font = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8102E' } };
        cell.alignment = { vertical: 'middle', horizontal: c <= 3 ? 'left' : 'center', wrapText: true };
      }

      // Student rows
      const setPct = (cell, v) => {
        cell.value = v;
        cell.numFmt = Number.isInteger(v) ? '0"%"' : '0.00"%"';
        cell.font = { name: 'Calibri', bold: true, color: { argb: `FF${pctColorHex(v)}` } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      };
      rows.forEach((r, idx) => {
        const row = ws.getRow(5 + idx);
        row.getCell(1).value = r.name;
        row.getCell(2).value = r.email;
        row.getCell(3).value = r.joined;
        setPct(row.getCell(4), r.overall);
        r.mods.forEach((v, i) => setPct(row.getCell(5 + i), v));
        for (let c = 1; c <= lastCol; c++) {
          row.getCell(c).border = { bottom: { style: 'thin', color: { argb: 'FFF0E2E5' } } };
          if (c <= 3) row.getCell(c).alignment = { vertical: 'middle' };
        }
      });

      ws.columns = [
        { width: 28 }, { width: 34 }, { width: 14 }, { width: 11 },
        ...VISIBLE_MODULES.map(() => ({ width: 17 })),
      ];
      ws.views = [{ state: 'frozen', xSplit: 1, ySplit: 4 }];

      const buf = await wb.xlsx.writeBuffer();
      downloadBlob(
        new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        exportFileName('xlsx'),
      );
    } catch (err) {
      console.error('Error exporting Excel:', err);
    }
    setExporting(null);
  };

  const handleExportPdf = async () => {
    if (!activeClass || !exportReady || exporting) return;
    setExporting('pdf');
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const rows = getExportRows();
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 10;

      // Class heading
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(17, 17, 17);
      doc.text(activeClass.name, margin, 16);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(122, 90, 96);
      doc.text(`${activeClass.subject} · Code: ${activeClass.accessCode}`, margin, 22);

      const head = [['Student', 'Email', 'Joined', 'Overall', ...VISIBLE_MODULES.map((_, i) => `M${i + 1}`)]];
      const body = rows.map(r => [r.name, r.email, r.joined, fmtPct(r.overall), ...r.mods.map(fmtPct)]);
      const raw = rows.map(r => [null, null, null, r.overall, ...r.mods]);

      autoTable(doc, {
        head, body,
        startY: 27,
        margin: { left: margin, right: margin, bottom: 14 },
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 2.2, lineColor: [240, 226, 229], lineWidth: 0.2, valign: 'middle' },
        headStyles: { fillColor: [200, 16, 46], textColor: 255, fontStyle: 'bold', halign: 'center' },
        columnStyles: {
          0: { cellWidth: 44, halign: 'left' },
          1: { cellWidth: 58, halign: 'left' },
          2: { cellWidth: 24, halign: 'left' },
          3: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
          ...Object.fromEntries(VISIBLE_MODULES.map((_, i) => [4 + i, { cellWidth: 14, halign: 'center' }])),
        },
        didParseCell: (d) => {
          if (d.section === 'head' && d.column.index <= 2) d.cell.styles.halign = 'left';
          if (d.section === 'body' && d.column.index >= 3) {
            const v = raw[d.row.index][d.column.index];
            const hex = pctColorHex(v);
            d.cell.styles.textColor = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
            d.cell.styles.fontStyle = 'bold';
          }
        },
      });

      // Legend: M1–M9 → module names (same names as the progress modal)
      let y = (doc.lastAutoTable?.finalY || 27) + 8;
      const lineH = 4.6;
      if (y + 6 + VISIBLE_MODULES.length * lineH > pageH - 14) { doc.addPage(); y = 16; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(165, 0, 52);
      doc.text('Module Progress', margin, y);
      y += lineH + 1;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 60);
      VISIBLE_MODULES.forEach((k, i) => {
        doc.text(`M${i + 1}  ${MODULE_DEFINITIONS[k].displayName}`, margin, y);
        y += lineH;
      });

      // Page numbers
      const total = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        doc.text(`Page ${i} of ${total}`, pageW - margin, pageH - 6, { align: 'right' });
      }

      doc.save(exportFileName('pdf'));
    } catch (err) {
      console.error('Error exporting PDF:', err);
    }
    setExporting(null);
  };

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
        <div className="avatar-menu-wrap" ref={avatarMenuRef}>
          <div
            className="avatar-circle"
            onClick={() => setShowAvatarMenu(v => !v)}
            title={user ? `${user.firstName} ${user.lastName}` : 'Account'}
          >
            {user ? initials : <MdAccountCircle style={{ fontSize: 22 }} />}
          </div>

          <AnimatePresence>
            {showAvatarMenu && (
              <motion.div
                className="avatar-dropdown"
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
              >
                <button
                  className="avatar-dropdown-item"
                  onClick={() => {
                    setShowAvatarMenu(false);
                    navigate('/faculty-profile');
                  }}
                >
                  <MdPerson size={17} />
                  <span>Profile</span>
                </button>
                <button
                  className="avatar-dropdown-item"
                  onClick={() => {
                    setShowAvatarMenu(false);
                    navigate('/about-faculty');
                  }}
                >
                  <MdInfoOutline size={17} />
                  <span>About Us</span>
                </button>
                <div className="avatar-dropdown-divider" />
                <button
                  className="avatar-dropdown-item avatar-dropdown-item-danger"
                  onClick={() => {
                    setShowAvatarMenu(false);
                    setShowLogoutModal(true);
                  }}
                >
                  <CiLogout size={17} />
                  <span>Logout</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
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
                {/* ── Heading row: "Class Section" on the left, one shared Class Duration on the right ── */}
                <div className="fc-head-row">
                  <h2 className="fc-heading">Class Section</h2>

                  <div className="fc-duration-wrap">
                    <div className="fc-duration-bar">
                      <span className="fc-dur-title">Class Duration</span>
                      <div className="fc-dur-field lock">
                        <span className="ccm-dtag">Start <span aria-hidden="true">🔒</span></span>
                        <div className="ccm-dval">{fmtDate(startDate)}</div>
                      </div>
                      <span className="fc-dur-arrow" aria-hidden="true">→</span>
                      <div className={`fc-dur-field end ${endDate ? 'filled' : ''}`}>
                        <span className="ccm-dtag">End <span aria-hidden="true">📅</span></span>
                        <input
                          type="date"
                          className="ccm-dinput"
                          min={tomorrowStr}
                          value={endDate}
                          onChange={e => handleEndDateChange(e.target.value)}
                          onKeyDown={e => { if (e.key !== 'Tab') e.preventDefault(); }}
                          onClick={e => e.currentTarget.showPicker?.()}
                        />
                      </div>
                    </div>
                    <span className={`fc-dur-help ${durationEnded ? 'ended' : ''}`}>
                      {durationEnded
                        ? 'This duration has ended. Pick a new end date to add classes.'
                        : 'One duration for all class sections. The earliest end date is tomorrow.'}
                    </span>
                  </div>
                </div>

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
                        <button
                          type="button"
                          className="fc-class-remove"
                          title={`Remove ${cls.name}`}
                          aria-label={`Remove ${cls.name}`}
                          onClick={e => { e.stopPropagation(); setConfirmRemoveClassId(cls.firestoreId); }}
                        >
                          ×
                        </button>
                        <span className="fc-class-subj">{cls.subject}</span>
                        <div className="fc-class-name">{cls.name}</div>
                        <div className="fc-class-school">{cls.school}</div>
                        <div className="fc-class-code">Access Code <strong>{cls.accessCode}</strong></div>
                        {clsEnd(cls) && (
                          <div className={`fc-class-duration ${isEnded(cls) ? 'ended' : ''}`}>
                            {isEnded(cls)
                              ? <>Ended {fmtDate(clsEnd(cls))}</>
                              : <>Ends {fmtDate(clsEnd(cls))}</>}
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
                      <span className="fc-add-text">Add Class</span>
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── INSIDE CLASS VIEW ── */}
            {activeClass && (
              <motion.div
                key="insideclass"
                className="fc-inside-view"
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
                  <div className="fc-inside-left">
                    <div className="fc-inside-count">
                      {enrolledStudents.length} student{enrolledStudents.length !== 1 ? 's' : ''} enrolled
                    </div>
                    <div className="fc-export-group">
                      <button
                        type="button"
                        className={`fc-export-btn fc-export-pdf${exporting === 'pdf' ? ' is-loading' : ''}`}
                        onClick={handleExportPdf}
                        disabled={!exportReady || !!exporting}
                        title="Download class progress as PDF"
                      >
                        <span className="fc-export-ico"><RiFilePdf2Fill /></span>
                        <span className="fc-export-label">{exporting === 'pdf' ? 'Preparing…' : 'Download PDF'}</span>
                      </button>
                      <button
                        type="button"
                        className={`fc-export-btn fc-export-xlsx${exporting === 'xlsx' ? ' is-loading' : ''}`}
                        onClick={handleExportExcel}
                        disabled={!exportReady || !!exporting}
                        title="Download class progress as Excel"
                      >
                        <span className="fc-export-ico"><RiFileExcel2Fill /></span>
                        <span className="fc-export-label">{exporting === 'xlsx' ? 'Preparing…' : 'Download Excel'}</span>
                      </button>
                    </div>
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

                <div className="fc-inside-divider" />

                <div className="fc-student-scroll">
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
                          <div className="fc-student-avatar" style={{ background: avatarColor(s.studentId) }}>
                            {getInitials(s.studentName)}
                          </div>
                          <div className="fc-student-name">{formatName(s)}</div>
                          <div className="fc-student-mail">{s.studentEmail}</div>
                          <div className="fc-student-ring">
                            <DonutChart percent={pct} size={74} strokeWidth={8} showSub={false} />
                          </div>
                          <button
                            className="fc-student-unenroll"
                            onClick={e => { e.stopPropagation(); handleRemoveStudent(s.enrollmentDocId); }}
                            title="Unenroll student"
                          >Unenroll</button>
                          <div className="fc-student-hint">View progress →</div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
                </div>
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
            onClick={() => { setShowCreateModal(false); setSectionInput(''); setGeneratedCode(''); }}
          >
            <motion.div
              className="create-class-modal ccm-split"
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={e => e.stopPropagation()}
            >
              {/* ── LEFT: form ── */}
              <div className="ccm-form">
                <h3 className="ccm-title">Add a Class</h3>
                <p className="ccm-sub">Enter a section</p>

                <div className="ccm-lbl">Class Section</div>
                <div className={`ccm-secfield ${sectionTaken ? 'invalid' : ''}`}>
                  <span className="ccm-secprefix">{SECTION_PREFIX}</span>
                  <input
                    type="text"
                    className="ccm-secinput"
                    placeholder="1A"
                    value={sectionInput}
                    maxLength={4}
                    autoFocus
                    autoComplete="off"
                    spellCheck={false}
                    onChange={e => setSectionInput(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
                  />
                </div>
                {sectionTaken ? (
                  <p className="ccm-help ccm-help-warn">{selectedSection} already exists. Enter a different section.</p>
                ) : (
                  <p className="ccm-help">Type the section only, like 1A. “{SECTION_PREFIX}” is added automatically.</p>
                )}

                {!durationActive && (
                  <p className="ccm-help ccm-help-warn">
                    Set the Class Duration at the top of the page first, then add the class.
                  </p>
                )}

                <button
                  className="ccm-gen"
                  onClick={handleGenerateCode}
                  disabled={!selectedSection || sectionTaken}
                >
                  Generate Access Code
                </button>
              </div>

              {/* ── RIGHT: live preview ── */}
              <div className="ccm-preview">
                <div className="ccm-prevlbl">Live Preview</div>
                <div className="ccm-pcard">
                  <div className="ccm-psub">IT 11 · IT Fundamentals</div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedSection || 'placeholder'}
                      className={`ccm-pname ${selectedSection ? '' : 'is-empty'}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      {selectedSection || 'Your section'}
                    </motion.div>
                  </AnimatePresence>
                  <div className="ccm-pschool">Dominican College of Tarlac</div>
                  <div className="ccm-pcode">
                    Access Code
                    <AnimatePresence mode="wait">
                      <motion.b
                        key={generatedCode || 'nocode'}
                        className={generatedCode ? '' : 'is-empty'}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                      >
                        {generatedCode || '— — — — — —'}
                      </motion.b>
                    </AnimatePresence>
                  </div>
                  <div className="ccm-pdur">
                    {fmtDate(startDate)} → {endDate ? fmtDate(endDate) : 'end date'}
                  </div>
                </div>
                <button
                  className="ccm-create"
                  onClick={handleCreateClass}
                  disabled={creating || !selectedSection || sectionTaken || !generatedCode || !durationActive}
                >
                  {creating ? 'Adding…' : 'Add Class'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONFIRM REMOVE CLASS MODAL ── */}
      <AnimatePresence>
        {confirmRemoveClassId !== null && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setConfirmRemoveClassId(null)}
          >
            <motion.div
              className="confirm-remove-modal"
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="confirm-icon">🗑️</div>
              <p className="confirm-message">
                Remove {classes.find(c => c.firestoreId === confirmRemoveClassId)?.name || 'this class section'}? Its access code will stop working, enrolled students will be unenrolled, and the section becomes available again.
              </p>
              <div className="confirm-footer">
                <button className="confirm-cancel-btn" onClick={() => setConfirmRemoveClassId(null)}>Cancel</button>
                <button className="confirm-remove-btn" onClick={handleConfirmRemoveClass}>Remove</button>
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
              className="modal-box lo-modal"
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