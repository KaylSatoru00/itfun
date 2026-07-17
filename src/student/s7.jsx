// s7.jsx — Microsoft Office Applications (UPDATED Word Interface Section)
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProgressTracker } from '../hooks/useProgressTracker';
import { useModuleSection } from '../hooks/useModuleSection';

// ── Assets ──
import mslogoImg from '../assets/mslogo.png';
import msofficeImg from '../assets/msoffice.jpeg';
import versionsImg from '../assets/versions.jpg';
import mspptImg from '../assets/msppt.png';
import insideImg from '../assets/inside.png';
import mswordImg from '../assets/msword.png';
import ribbonImg from '../assets/ribbon.png';
import toolbarImg from '../assets/toolbar.png';
import groupsImg from '../assets/groups.png';
import rulerImg from '../assets/ruler.png';
import pageImg from '../assets/page.png';
import documentImg from '../assets/document.png';
import zoomImg from '../assets/zoom.png';
import documentareaImg from '../assets/documentarea.png';
import msexcelImg from '../assets/msexcel.png';
import excelinterfaceImg from '../assets/excelinterface.png';

import './s7.css';

/* ─────────────────────────────────────────────
   Module / Lesson config for Chapter 7
   intro:       3 items (2 flipcards + 1 accordion)
   apps:        4 items (1 ppt accordion + 1 ppt image + 1 word section + 1 excel accordion)
──────────────────────────────────────────────*/
const MODULE_ID = 'module7';
const LESSON_TOTALS = {
  intro: 3,       // 2 flipcards + 1 accordion
  apps: 16,       // 1 ppt accordion + 8 word interface cards + 7 excel feature dropdowns
};

/* ────────────────────────────────────────────
   Accordion — calls trackInteraction(id) once on first open
─────────────────────────────────────────────*/
function AccordionItem({ title, children, isOpen, onToggle, itemId, onInteract }) {
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleToggle = useCallback(() => {
    if (!isOpen && !hasInteracted) {
      setHasInteracted(true);
      if (onInteract) {
        onInteract(itemId);
      }
    }
    onToggle();
  }, [isOpen, hasInteracted, onToggle, onInteract, itemId]);

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
// Staggered list reveal (fx-stagger): nag-fade out ang photo, tapos ang
// bawat list item ay sunud-sunod na pumapasok. `backItems` (array) ang
// nagre-render bilang staggered list; fallback ang `backText` paragraph.
function FlipCard({ frontImage, frontLabel, backTitle, backItems, backText, backIcon = '💡', itemId, onInteract }) {
  const [flipped, setFlipped] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleClick = useCallback(() => {
    const nextFlipped = !flipped;
    setFlipped(nextFlipped);

    if (nextFlipped && !hasInteracted) {
      setHasInteracted(true);
      if (onInteract) {
        onInteract(itemId);
      }
    }
  }, [flipped, hasInteracted, onInteract, itemId]);

  return (
    <div
      className={`fx-card fx-stagger ${flipped ? 'open' : ''}`}
      onClick={handleClick}
    >
      <div className="fx-face fx-front">
        {frontImage
          ? <img src={frontImage} alt={frontLabel} />
          : (
            <div className="fx-placeholder">
              <span style={{ fontSize: 48 }}>📄</span>
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
        {backItems ? (
          <>
            <strong>{backTitle || frontLabel}</strong>
            <ul>
              {backItems.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </>
        ) : (
          <p>{backText}</p>
        )}
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
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize="7" fontWeight="bold" fill={active ? '#fff' : '#A50034'}>{Math.round(percent)}%</text>
    </svg>
  );
}

/* ────────────────────────────────────────────
   Nav items — CONSOLIDATED: only 2 buttons
─────────────────────────────────────────────*/
const navItems = [
  { key: 'intro', label: 'Introduction to MS Office' },
  { key: 'apps',  label: 'MS PowerPoint, Word, & Excel' },
];

/* ════════════════════════════════════════════
   Chapter 7 — Main Component
═════════════════════════════════════════════*/
function Chapter7() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useModuleSection(
    'intro',
    ['intro', 'apps']
  );

  // ── Use individual trackers per lesson ──
  const introTracker = useProgressTracker(MODULE_ID, 'intro', LESSON_TOTALS.intro);
  const appsTracker = useProgressTracker(MODULE_ID, 'apps', LESSON_TOTALS.apps);

  const progress = {
    intro: Math.round(introTracker.progress),
    apps: Math.round(appsTracker.progress),
  };

  const allLessonsComplete = Object.values(progress).every((p) => p >= 100);

  // ── Accordion open/close state ──
  // Intro accordion (1 item)
  const [introOpenStates, setIntroOpenStates] = useState([false]);
  const toggleIntro = useCallback((index) => {
    setIntroOpenStates(prev => {
      const newStates = [...prev];
      newStates[index] = !newStates[index];
      return newStates;
    });
  }, []);

  // Powerpoint accordion (1 item)
  const [pptOpenStates, setPptOpenStates] = useState([false]);
  const togglePpt = useCallback((index) => {
    setPptOpenStates(prev => {
      const newStates = [...prev];
      newStates[index] = !newStates[index];
      return newStates;
    });
  }, []);

  // Excel feature accordions (7 features, top-level).
  // Only one open at a time — opening one closes the previously open one.
  const [openExcelFeature, setOpenExcelFeature] = useState(null);
  const toggleExcelFeature = useCallback((index) => {
    setOpenExcelFeature(prev => (prev === index ? null : index));
  }, []);

  useEffect(() => {
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = '#ffffff';
    return () => {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  // Word interface items - for centered card layout
  const wordInterfaceItems = [
    { name: 'Ribbon', img: ribbonImg, desc: 'The Ribbon is the command center of Word, containing tabs with various tool groups.' },
    { name: 'Quick Access Toolbar', img: toolbarImg, desc: 'A customizable toolbar that contains frequently used commands like Save, Undo, and Redo.' },
    { name: 'Groups', img: groupsImg, desc: 'Related commands are organized into groups within each tab on the Ribbon.' },
    { name: 'Ruler', img: rulerImg, desc: 'The Ruler helps you align text, graphics, tables, and other elements in your document.' },
    { name: 'Page & Word Count', img: pageImg, desc: 'Displays the current page number, total pages, and word count of your document.' },
    { name: 'Document View', img: documentImg, desc: 'Different viewing options include Print Layout, Read Mode, Web Layout, Outline, and Draft.' },
    { name: 'Zoom Control', img: zoomImg, desc: 'Adjust the zoom level to zoom in or out on your document for better viewing.' },
    { name: 'Document Area', img: documentareaImg, desc: 'The main workspace where you create and edit your document content.' },
  ];

  // Excel features with descriptions
  const excelFeatures = [
    { name: 'AutoFormat', desc: 'Choose from many preset table formatting options to quickly style your data.' },
    { name: 'AutoSum', desc: 'Helps you add the contents of a cluster of adjacent cells with one click.' },
    { name: 'List AutoFill', desc: 'Automatically extends cell formatting when a new item is added to the end of a list.' },
    { name: 'AutoShapes Toolbar', desc: 'Allows you to draw geometrical shapes, arrows, flowchart elements, stars, and more.' },
    { name: 'Drag and Drop', desc: 'Reposition data and text by simply dragging the data with the mouse.' },
    { name: 'Charts', desc: 'Present graphical representation of data in the form of Pie, Bar, Line charts, and more.' },
    { name: 'Shortcut Menus', desc: 'Commands appropriate to the task appear by clicking the right mouse button.' },
  ];

  return (
    <motion.div
      className="chap-panel"
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
          <span className="chap-chapter-label">LEARNING MODULE 7</span>
          <h1 className="chap-title">Microsoft Office Applications</h1>
        </div>
      </div>

      {/* ── Layout ── */}
      <div className="chap-layout">

        {/* ── Left Nav Card ── */}
        <div className="chap-left-col">
          <div className="chap-card-small">
            <nav className="chap-nav-buttons">
              {navItems.map(({ key, label }) => (
                <button
                  key={key}
                  className={`chap-nav-btn ${activeSection === key ? 'active' : ''}`}
                  onClick={() => setActiveSection(key)}
                >
                  <CircleProgress percent={progress[key]} active={activeSection === key} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {allLessonsComplete && (
            <button className="chap-start-game-btn chap-start-game-btn-desktop-only" onClick={() => navigate('/gamified-7')}>
              START GAME
            </button>
          )}
        </div>

        {/* ── Main Right Card ── */}
        <div className="chap-card-main">

          {/* ══ INTRODUCTION TO MS OFFICE ══ */}
          {activeSection === 'intro' && (
            <>
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title">Introduction to MS Office</h2>
              </div>

              {/* Image */}
              <div className="s2-img-wrapper">
                <img src={mslogoImg} alt="MS Office Logo" className="s2-binary-img" style={{ maxWidth: '320px', width: '100%' }} />
              </div>

              <div className="s2-body-block">
                <p className="s2-body-text">
                  <strong>Microsoft Office</strong> is an office suite of applications, servers, and services developed by Microsoft. It was first announced by Bill Gates on <strong>August 1, 1988</strong>, in Las Vegas. The first version of Office contained <strong>Microsoft Word, Microsoft Excel, and Microsoft PowerPoint</strong>. Several versions of MS Office have been released over the years with emphasis on user friendliness and better display.
                </p>
              </div>

              <div className="s2-section-divider" />

              {/* Accordion 1 */}
              <div className="chap-accordion" style={{ marginTop: 4 }}>
                <AccordionItem
                  title="What is Microsoft Office?"
                  isOpen={introOpenStates[0]}
                  onToggle={() => toggleIntro(0)}
                  itemId="s7-intro-accordion-1"
                  onInteract={introTracker.trackInteraction}
                >
                  <p className="s2-body-text" style={{ margin: 0 }}>
                    Microsoft Office is a suite of desktop productivity applications that is designed specifically to be used for office or business use. Microsoft Office was primarily created to automate the manual office work with a collection of purpose-built applications.
                  </p>
                </AccordionItem>
              </div>

              <div className="s2-section-divider" />

              {/* Flip Cards: Different Applications */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 18 }}>Different Applications in MS Office</h3>
              </div>

              <div className="s3-flipcard-single" style={{ marginTop: 12 }}>
                <FlipCard
                  frontImage={msofficeImg}
                  frontLabel="MS Office Applications"
                  backIcon="📱"
                  backTitle="Microsoft Office includes:"
                  backItems={[
                    '📝 Word — word processing',
                    '📊 Excel — spreadsheets',
                    '📽️ PowerPoint — presentations',
                    '✉️ Outlook — email',
                    '🗂️ Access — databases',
                    '📰 Publisher — desktop publishing',
                  ]}
                  itemId="s7-fc-apps"
                  onInteract={introTracker.trackInteraction}
                />
              </div>

              <div className="s2-section-divider" />

              {/* Flip Cards: Different Versions */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 18 }}>Different Versions of MS Office</h3>
              </div>

              <div className="s3-flipcard-single" style={{ marginTop: 12 }}>
                <FlipCard
                  frontImage={versionsImg}
                  frontLabel="MS Office Versions"
                  backIcon="📅"
                  backTitle="Major versions:"
                  backItems={[
                    'Office 95 · 97 · 2000 · XP',
                    'Office 2003 · 2007 · 2010',
                    'Office 2013 · 2016 · 2019',
                    'Microsoft 365 — subscription-based',
                    'Each version improved features and UI',
                  ]}
                  itemId="s7-fc-versions"
                  onInteract={introTracker.trackInteraction}
                />
              </div>
            </>
          )}

          {/* ══ MS POWERPOINT, WORD, & EXCEL (CONSOLIDATED) ══ */}
          {activeSection === 'apps' && (
            <>
              {/* ══ POWERPOINT ══ */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title">MS PowerPoint</h2>
              </div>

              <div className="s2-img-wrapper">
                <img src={mspptImg} alt="MS PowerPoint" className="s2-binary-img" style={{ maxWidth: '320px', width: '100%' }} />
              </div>

              <div className="s2-body-block">
                <p className="s2-body-text">
                  PowerPoint presentations are commonly used in business meetings and for training and educational purposes. Various circumstances in which a presentation is made: teaching a class, introducing a product to sell, explaining an organizational structure, etc.
                </p>
                <p className="s2-body-text" style={{ marginTop: 8 }}>
                  PowerPoint software features and formatting options include a wizard that walks you through the presentation creation process. <strong>Design template</strong> — prepacked background designs and font styles that will be applied to all slides in a presentation.
                </p>
              </div>

              {/* LARGER inside.png image */}
              <div className="s2-img-wrapper">
                <img src={insideImg} alt="PowerPoint Inside" className="s2-binary-img" style={{ maxWidth: '640px', width: '100%' }} />
              </div>

              <div className="s2-section-divider" />

              {/* PowerPoint Accordion */}
              <div className="chap-accordion">
                <AccordionItem
                  title="PowerPoint Overview"
                  isOpen={pptOpenStates[0]}
                  onToggle={() => togglePpt(0)}
                  itemId="s7-ppt-accordion"
                  onInteract={appsTracker.trackInteraction}
                >
                  <p className="s2-body-text" style={{ margin: 0 }}>
                    PowerPoint is a presentation program developed by Microsoft. It is part of the Microsoft Office suite and runs on Windows and macOS. PowerPoint presentations consist of slides that may contain text, images, charts, videos, and animations. The software provides tools for creating professional presentations with transitions, animations, and multimedia integration.
                  </p>
                </AccordionItem>
              </div>

              <div className="s2-section-divider" />

              {/* ══ WORD ══ */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title">MS Word</h2>
              </div>

              <div className="s2-img-wrapper">
                <img src={mswordImg} alt="MS Word" className="s2-binary-img" style={{ maxWidth: '320px', width: '100%' }} />
              </div>

              <div className="s2-body-block">
                <p className="s2-body-text">
                  <strong>Microsoft Word</strong> is a word processing application developed by Microsoft. It allows users to create, edit, format, and print documents.
                </p>
                <p className="s2-body-text" style={{ marginTop: 8 }}>
                  <strong>Creating a document:</strong>
                </p>
                <ul className="s3-bullet-list">
                  <li>Open Microsoft Word</li>
                  <li>Create a blank document</li>
                  <li>Write the document you want</li>
                </ul>
              </div>

              <div className="s2-section-divider" />

              {/* Navigating the Interface - CENTERED CARDS */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 18, textAlign: 'center' }}>Navigating the Interface</h3>
              </div>

              <div className="s7-word-interface-grid">
                {wordInterfaceItems.map((item, index) => {
                  const itemId = `s7-word-${index}`;
                  const isViewed = appsTracker.completedItems.has(itemId);
                  return (
                    <div
                      key={index}
                      className="s7-word-card-centered"
                      onClick={() => appsTracker.trackInteraction(itemId)}
                    >
                      <div className="s7-word-card-centered-img-wrap">
                        <img src={item.img} alt={item.name} className="s7-word-card-centered-img" />
                        {isViewed ? (
                          <span className="s7-word-card-centered-badge" title="Viewed">✓</span>
                        ) : (
                          <span className="s7-word-card-centered-hint">👆 Tap to check</span>
                        )}
                      </div>
                      <h4 className="s7-word-card-centered-name">{item.name}</h4>
                      <p className="s7-word-card-centered-desc">{item.desc}</p>
                    </div>
                  );
                })}
              </div>


              <div className="s2-section-divider" />

              {/* ══ EXCEL ══ */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title">MS Excel</h2>
              </div>

              <div className="s2-img-wrapper">
                <img src={msexcelImg} alt="MS Excel" className="s2-binary-img" style={{ maxWidth: '320px', width: '100%' }} />
              </div>

              <div className="s2-body-block">
                <p className="s2-body-text">
                  <strong>Microsoft Excel</strong> is a general-purpose electronic spreadsheet used to organize, calculate, and analyze data. There are a number of features that are available in Excel to make your task easier.
                </p>
              </div>

              <div className="s2-section-divider" />

              {/* Excel Features — subtitle + individual dropdowns (no wrapper accordion) */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 18 }}>Excel Features</h3>
              </div>

              <div className="chap-accordion" style={{ marginTop: 12 }}>
                {excelFeatures.map((feature, i) => (
                  <AccordionItem
                    key={i}
                    title={feature.name}
                    isOpen={openExcelFeature === i}
                    onToggle={() => toggleExcelFeature(i)}
                    itemId={`s7-excel-feature-${i}`}
                    onInteract={appsTracker.trackInteraction}
                  >
                    <p className="s2-body-text" style={{ margin: 0 }}>{feature.desc}</p>
                  </AccordionItem>
                ))}
              </div>

              <div className="s2-section-divider" />

              {/* LARGER excelinterface.png image */}
              <div className="s2-img-wrapper">
                <img src={excelinterfaceImg} alt="Excel Interface" className="s2-binary-img" style={{ maxWidth: '640px', width: '100%' }} />
              </div>

              <div className="s2-body-block" style={{ marginTop: 8 }}>
                <p className="s2-body-text" style={{ textAlign: 'center', color: '#888', fontSize: '13px' }}>
                  Excel Interface — The workspace where you can organize, calculate, and analyze your data.
                </p>
              </div>
            </>
          )}

        </div>
      </div>

      {allLessonsComplete && (
        <button className="chap-start-game-btn chap-start-game-btn-mobile-only" onClick={() => navigate('/gamified-7')}>
          START GAME
        </button>
      )}
    </motion.div>
  );
}

export default Chapter7;