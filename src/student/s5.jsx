// s5.jsx — Types of Software (System, Application and Operating System)
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProgressTracker } from '../hooks/useProgressTracker';
import { useModuleSection } from '../hooks/useModuleSection';

// ── Assets ──
import softwareImg      from '../assets/software.jpg';
import wordImg          from '../assets/word.webp';
import excelImg         from '../assets/excel.avif';
import powerpointImg    from '../assets/powerpoint.webp';
import chromeImg        from '../assets/chrome.avif';
import vlcImg           from '../assets/vlc.png';
import appsImg          from '../assets/apps.jpg';
import computerImg      from '../assets/computer.png';
import systemImg        from '../assets/system.webp';
import appSoftwareImg   from '../assets/appsoftware.png';
import osImg            from '../assets/os.jpg';

import './s5.css';

/* ─────────────────────────────────────────────
   Module / Lesson config for Chapter 5
   Tracked items: 2 FlipCards + 2 sys accordions + 1 OS flipcard + 1 table dropdown = 6
──────────────────────────────────────────────*/
const MODULE_ID = 'module5';
const TOTAL_ITEMS = 6;

/* ────────────────────────────────────────────
   Accordion — calls trackInteraction(id) once on first open
─────────────────────────────────────────────*/
function AccordionItem({ title, children, isOpen, onToggle, itemId, onInteract }) {
  const [counted, setCounted] = useState(false);

  const handleToggle = useCallback(() => {
    if (!isOpen && !counted) {
      setCounted(true);
      onInteract?.(itemId);
    }
    onToggle();
  }, [isOpen, counted, onToggle, onInteract, itemId]);

  return (
    <div className="chap-accordion-item">
      <button
        className={`chap-accordion-header ${isOpen ? 'open' : ''}`}
        onClick={handleToggle}
      >
        <span>{title}</span>
        <span className="chap-accordion-chevron">{isOpen ? '∧' : '∨'}</span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            className="chap-accordion-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div style={{ padding: '16px 20px', background: '#fff' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ────────────────────────────────────────────
   Flip Card — calls onInteract(id) once on first flip
─────────────────────────────────────────────*/
function FlipCard({ frontImage, frontLabel, backText, backIcon = '💡', itemId, onInteract }) {
  const [flipped, setFlipped] = useState(false);
  const [counted, setCounted] = useState(false);

  // Circle-wipe reveal (fx-wipe): bumubukas mula sa puntong tinapik —
  // fixed ang laki, kaya hindi nagagalaw ang side-by-side pair.
  const handleClick = useCallback((e) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--cx', `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty('--cy', `${((e.clientY - r.top) / r.height) * 100}%`);
    const next = !flipped;
    setFlipped(next);
    if (next && !counted) {
      setCounted(true);
      onInteract?.(itemId);
    }
  }, [flipped, counted, onInteract, itemId]);

  return (
    <div
      className={`fx-card fx-wipe ${flipped ? 'open' : ''}`}
      onClick={handleClick}
    >
      <div className="fx-face fx-front">
        {frontImage
          ? <img src={frontImage} alt={frontLabel} />
          : (
            <div className="fx-placeholder">
              <span style={{ fontSize: 48 }}>💾</span>
              <span>{frontLabel}</span>
            </div>
          )
        }
        <div className="fx-strip">
          <span>Tap for description</span>
          <span>↪</span>
        </div>
      </div>
      <div className="fx-face fx-back">
        <span className="fx-back-icon">{backIcon}</span>
        <p>{backText}</p>
        <span className="fx-hint">Tap to go back</span>
      </div>
    </div>
  );
}

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
  { key: 'software', label: 'Types of Software (System, Application and Operating System)' },
];

/* ════════════════════════════════════════════
   Chapter 5 — Main Component
═════════════════════════════════════════════*/
function Chapter5() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useModuleSection(
    'software',
    ['software']
  );

  // Single lesson tracker
  const tracker = useProgressTracker(MODULE_ID, 'software', TOTAL_ITEMS);

  const progress = {
    software: Math.round(tracker.progress),
  };

  const allLessonsComplete = Object.values(progress).every((p) => p >= 100);

  // Accordion / dropdown open state
  // "Functions" and "Examples" are sibling accordions — only one open at a time.
  const [openSysAccordion, setOpenSysAccordion] = useState(null);
  const [tableOpen,   setTableOpen]   = useState(false);
  const [tableCounted, setTableCounted] = useState(false);

  useEffect(() => {
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = '#060607';
    // index.css locks body/#root sa fixed viewport — i-unlock para
    // maka-scroll nang normal ang accordion-outline layout.
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.body.style.width = '100%';
    const rootEl = document.getElementById('root');
    if (rootEl) { rootEl.style.position = 'static'; rootEl.style.display = 'block'; }
    return () => {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundColor = '';
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.body.style.width = '';
      const rootReset = document.getElementById('root');
      if (rootReset) { rootReset.style.position = ''; rootReset.style.display = ''; }
    };
  }, []);

  /* ── Comparison table rows ── */
  const compareRows = [
    { feature: 'Definition',       system: 'Software that controls and manages computer hardware.',         os: 'The main system software that manages the entire computer.',             app: 'Software designed to help users perform specific tasks.' },
    { feature: 'Purpose',          system: 'Makes the computer work properly.',                             os: 'Acts as a bridge between hardware, software, and users.',                 app: 'Helps users accomplish tasks.' },
    { feature: 'User Interaction', system: 'Usually works in the background.',                              os: 'Users interact with it when using the computer.',                         app: 'Users directly use it.' },
    { feature: 'Necessity',        system: 'Required for the computer to function.',                        os: 'Required for the computer to operate.',                                   app: "Optional, depending on the user's needs." },
    { feature: 'Runs First?',      system: 'Yes',                                                           os: 'Yes, it loads when the computer starts.',                                 app: 'No, it runs after the operating system loads.' },
    { feature: 'Examples',         system: 'Operating Systems, Device Drivers, Utility Programs, Antivirus Software', os: 'Windows, macOS, Linux, Android, iOS',                        app: 'Microsoft Word, Excel, PowerPoint, Chrome, VLC, Games' },
  ];

  /* ── Software examples ── */
  const softwareExamples = [
    { label: 'Microsoft Word',   img: wordImg },
    { label: 'Microsoft Excel',  img: excelImg },
    { label: 'PowerPoint',       img: powerpointImg },
    { label: 'Google Chrome',    img: chromeImg },
    { label: 'VLC Media Player', img: vlcImg },
    { label: 'Mobile Apps',      img: appsImg },
    { label: 'Computer Games',   img: computerImg },
  ];

  /* ── Table dropdown — count only on first open ── */
  const handleTableToggle = useCallback(() => {
    const next = !tableOpen;
    setTableOpen(next);
    if (next && !tableCounted) {
      setTableCounted(true);
      tracker.trackInteraction('s5-dropdown-toggle');
    }
  }, [tableOpen, tableCounted, tracker]);

  return (
    <motion.div
      className="chap-panel cp-page"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Header ── */}
      <div className="chap-header">
        <button className="chap-back-btn" onClick={() => navigate('/learning-modules')}>
          ← Back
        </button>
        <div className="chap-header-title">
          <span className="chap-chapter-label">LEARNING MODULE 5</span>
          <h1 className="chap-title">Types of Software</h1>
        </div>
        {/* progress bar naka-pin sa ilalim ng sticky header */}
        <div className="ao-progress">
          <div style={{ width: `${Math.round(progress.software)}%` }} />
        </div>
      </div>


      <div className="ao-body">

          <div className={`ao-lesson ${activeSection === 'software' ? 'open' : ''}`}>
            <button className="ao-lesson-header" onClick={() => setActiveSection('software')}>
              <span className="ao-caret">{activeSection === 'software' ? '▼' : '▶'}</span>
              <span className="ao-num">01</span>
              <span className="ao-label">Types of Software (System, Application and Operating System)</span>
              <span className="ao-pct">{Math.round(progress.software)}%</span>
            </button>
          <AnimatePresence initial={false}>
          {activeSection === 'software' && (
            <motion.div className="ao-lesson-body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="ao-lesson-inner"><div className="cp-block">
            <>
              {/* ── Title ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title">Types of Software</h2>
              </div>

              {/* ── Main software image ── */}
              <div className="s2-img-wrapper">
                <img src={softwareImg} alt="Software" className="s2-binary-img" />
              </div>

              {/* ── What is Software? ── */}
              <div className="s2-body-block">
                <p className="s2-body-text" style={{ fontWeight: 'bold', fontSize: 17 }}>What is Software?</p>
                <p className="s2-body-text">
                  Software is a collection of programs, instructions, and data that tells a computer what tasks to perform. Unlike hardware, software cannot be physically touched; it consists of coded instructions that enable a computer system to function.
                </p>
                <p className="s2-body-text">
                  Software acts as the bridge between users and computer hardware.
                </p>
              </div>

              {/* ── Examples of Software ── */}
              <div className="s2-body-block" style={{ marginTop: 8 }}>
                <p className="s2-body-text" style={{ fontWeight: 'bold' }}>Examples of Software:</p>
              </div>

              <div className="s5-software-examples">
                {softwareExamples.map(({ label, img }) => (
                  <div className="s5-example-card" key={label}>
                    <img src={img} alt={label} className="s5-example-img" />
                    <span className="s5-example-label">{label}</span>
                  </div>
                ))}
              </div>

              <div className="s2-section-divider" />

              {/* ── Types of Software ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 20 }}>Types of Software</h3>
              </div>

              <div className="s2-body-block" style={{ marginTop: 8 }}>
                <p className="s2-body-text">There are two main types of software:</p>
                <ul className="s3-bullet-list">
                  <li><strong>System Software</strong></li>
                  <li><strong>Application Software</strong></li>
                </ul>
              </div>

              {/* ── Two flip cards ── */}
              <div className="s5-flip-row" style={{ marginTop: 20 }}>
                <FlipCard
                  frontImage={systemImg}
                  frontLabel="System Software"
                  backIcon="⚙️"
                  backText="System software is the software that manages and controls the computer's hardware. It helps the computer run properly and provides a platform for other software to work. It serves as the interface between the computer hardware and the user."
                  itemId="s5-fc-system"
                  onInteract={tracker.trackInteraction}
                />
                <FlipCard
                  frontImage={appSoftwareImg}
                  frontLabel="Application Software"
                  backIcon="📱"
                  backText="Application software consists of programs developed to help users perform specific tasks or solve particular problems. These programs run on top of the operating system and directly assist the user in completing work."
                  itemId="s5-fc-app"
                  onInteract={tracker.trackInteraction}
                />
              </div>

              {/* ── System Software detail ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0, marginTop: 8 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 18 }}>System Software</h3>
              </div>

              {/* Functions accordion */}
              <div className="chap-accordion" style={{ marginTop: 10 }}>
                <AccordionItem
                  title="Functions of System Software"
                  isOpen={openSysAccordion === 'func'}
                  onToggle={() => setOpenSysAccordion(prev => (prev === 'func' ? null : 'func'))}
                  itemId="s5-accordion-sys-func"
                  onInteract={tracker.trackInteraction}
                >
                  <ul className="s3-bullet-list" style={{ margin: 0 }}>
                    <li>Starts the computer</li>
                    <li>Controls hardware devices</li>
                    <li>Manages memory</li>
                    <li>Runs application software</li>
                    <li>Provides security</li>
                  </ul>
                </AccordionItem>

                <AccordionItem
                  title="Examples of System Software"
                  isOpen={openSysAccordion === 'ex'}
                  onToggle={() => setOpenSysAccordion(prev => (prev === 'ex' ? null : 'ex'))}
                  itemId="s5-accordion-sys-ex"
                  onInteract={tracker.trackInteraction}
                >
                  <ul className="s3-bullet-list" style={{ margin: 0 }}>
                    <li>Operating Systems (Windows, macOS, Android, iOS)</li>
                    <li>Device Drivers</li>
                    <li>Compilers</li>
                    <li>Interpreters</li>
                    <li>Assemblers</li>
                    <li>Utility Programs (Antivirus, Disk Cleanup, Backup Tools)</li>
                  </ul>
                </AccordionItem>
              </div>

              {/* Example callout */}
              <div className="s4-callout" style={{ marginTop: 16 }}>
                <span className="s4-callout-label">Example</span>
                <p className="s4-callout-text">
                  When you turn on your computer, Windows loads first before any other program. This is because Windows is system software.
                </p>
              </div>

              <div className="s2-section-divider" />

              {/* ── Application Software detail ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 18 }}>Application Software</h3>
              </div>

              <div className="s2-body-block" style={{ marginTop: 10 }}>
                <p className="s2-body-text">
                  Application software consists of programs developed to help users perform specific tasks or solve particular problems. These programs run on top of the operating system and directly assist the user in completing work.
                </p>
                <p className="s2-body-text" style={{ fontWeight: 'bold' }}>Application software is:</p>
                <ul className="s3-bullet-list">
                  <li>User-oriented</li>
                  <li>Easy to use</li>
                  <li>More interactive</li>
                  <li>Usually written in high-level languages</li>
                  <li>Easier to understand and manipulate</li>
                  <li>Larger in size compared to system software</li>
                </ul>
              </div>

              {/* Application Software Examples - Displayed directly */}
              <div className="s2-body-block" style={{ marginTop: 12 }}>
                <p className="s2-body-text" style={{ fontWeight: 'bold' }}>Examples of Application Software:</p>
                <div className="s5-app-examples">
                  {[
                    { label: 'Microsoft Word', img: wordImg },
                    { label: 'Microsoft Excel', img: excelImg },
                    { label: 'Microsoft PowerPoint', img: powerpointImg },
                    { label: 'VLC Media Player', img: vlcImg },
                    { label: 'Google Chrome', img: chromeImg },
                  ].map(({ label, img }) => (
                    <div className="s5-example-card" key={label}>
                      <img src={img} alt={label} className="s5-example-img" />
                      <span className="s5-example-label">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="s2-section-divider" />

              {/* ── Operating System ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 18 }}>Operating System</h3>
              </div>

              <div className="s3-flipcard-single" style={{ marginTop: 12 }}>
                <FlipCard
                  frontImage={osImg}
                  frontLabel="Operating System"
                  backIcon="🖥️"
                  backText="An Operating System (OS) is the most important type of system software. It acts as a bridge between the user, software, and hardware. The operating system is the boss of the computer — it controls everything and makes sure all programs and hardware work together."
                  itemId="s5-fc-os"
                  onInteract={tracker.trackInteraction}
                />
              </div>

              <div className="s4-callout" style={{ marginTop: 12 }}>
                <span className="s4-callout-label">Explanation</span>
                <p className="s4-callout-text">
                  The operating system is the boss of the computer. It controls everything and makes sure all programs and hardware work together.
                </p>
              </div>

              <div className="s2-body-block" style={{ marginTop: 16 }}>
                <p className="s2-body-text" style={{ fontWeight: 'bold' }}>Types of Operating System:</p>
                <div className="s5-os-chips">
                  {['Windows', 'macOS', 'Linux', 'Android', 'iOS'].map(os => (
                    <span key={os} className="s5-os-chip">{os}</span>
                  ))}
                </div>
              </div>

              <div className="s2-section-divider" />

              {/* ── Comparison Table (custom dropdown with tracking) ── */}
              <button
                className={`s5-dropdown-toggle ${tableOpen ? 'open' : ''}`}
                onClick={handleTableToggle}
              >
                <span>📊 Comparison: System Software vs Operating System vs Application Software</span>
                <span>{tableOpen ? '∧' : '∨'}</span>
              </button>

              <AnimatePresence initial={false}>
                {tableOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="s5-table-wrapper">
                      <table className="s5-compare-table">
                        <thead>
                          <tr>
                            <th>Feature</th>
                            <th>System Software</th>
                            <th>Operating System</th>
                            <th>Application Software</th>
                          </tr>
                        </thead>
                        <tbody>
                          {compareRows.map(row => (
                            <tr key={row.feature}>
                              <td>{row.feature}</td>
                              <td>{row.system}</td>
                              <td>{row.os}</td>
                              <td>{row.app}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* ── Real-Life Example ── */}
                    <div className="s5-reallife-box" style={{ marginTop: 16 }}>
                      <p className="s5-reallife-title">Real-Life Example</p>
                      <p style={{ fontSize: 14, color: '#555', marginBottom: 10, lineHeight: 1.6 }}>
                        Imagine a computer as a school:
                      </p>
                      <ul className="s5-reallife-list">
                        <li><span className="s5-rl-icon">🏫</span><span><strong>Hardware</strong> = The school building and equipment.</span></li>
                        <li><span className="s5-rl-icon">🏢</span><span><strong>Operating System</strong> = The school administration that manages everything.</span></li>
                        <li><span className="s5-rl-icon">👷</span><span><strong>System Software</strong> = The staff who keep the school running.</span></li>
                        <li><span className="s5-rl-icon">📚</span><span><strong>Application Software</strong> = The classrooms and activities where students perform tasks.</span></li>
                        <li><span className="s5-rl-icon">🧑‍🎓</span><span><strong>User</strong> = The student using the school's resources.</span></li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
            </div></div></motion.div>
          )}
          </AnimatePresence>
          </div>



          {allLessonsComplete ? (
            <div className="cp-banner">
              <h3>🎉 Module 5 complete!</h3>
              <p>You've finished all lessons. Ready to test your knowledge?</p>
              <button className="chap-start-game-btn" onClick={() => navigate('/gamified-5')}>START GAME</button>
            </div>
          ) : (
            <button className="ao-locked-pill" disabled>🔒 START GAME — unlocks at 100%</button>
          )}
      </div>
    </motion.div>
  );
}

export default Chapter5;