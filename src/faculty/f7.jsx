// f7.jsx — Faculty: Microsoft Office Applications
import { useEffect, useState } from 'react';
import { useModuleSection } from '../hooks/useModuleSection';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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

import './f7.css';

/* ────────────────────────────────────────────
   Accordion
─────────────────────────────────────────────*/
function AccordionItem({ title, children, isOpen, onToggle }) {
  return (
    <div className="chap-accordion-item">
      <button
        className={`chap-accordion-header ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
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
   Flip Card
─────────────────────────────────────────────*/
function FlipCard({ frontImage, frontLabel, backText, backIcon = '💡', frontIcon = '🖥️' }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      className={`chap-flip-card ${flipped ? 'flipped' : ''}`}
      onClick={() => setFlipped(f => !f)}
    >
      <div className="chap-flip-card-inner">
        <div className="chap-flip-card-front">
          {frontImage
            ? <img src={frontImage} alt={frontLabel} />
            : (
              <div className="chap-flip-card-front-placeholder">
                <span style={{ fontSize: 48 }}>{frontIcon}</span>
                <span>{frontLabel}</span>
              </div>
            )
          }
          <div className="chap-flip-card-front-overlay">
            <span>Flip for description</span>
            <span>↩</span>
          </div>
        </div>
        <div className="chap-flip-card-back">
          <span className="chap-flip-card-back-icon">{backIcon}</span>
          <p>{backText}</p>
          <span className="chap-flip-card-back-hint">Tap to flip back</span>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Nav items
─────────────────────────────────────────────*/
const navItems = [
  { key: 'intro',       label: 'Introduction to MS Office' },
  { key: 'powerpoint',  label: 'Microsoft PowerPoint' },
  { key: 'word',        label: 'Microsoft Word' },
  { key: 'excel',       label: 'Microsoft Excel' },
];

/* ── Word interface items ── */
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

/* ── Excel features ── */
const excelFeatures = [
  { name: 'AutoFormat', desc: 'Choose from many preset table formatting options to quickly style your data.' },
  { name: 'AutoSum', desc: 'Helps you add the contents of a cluster of adjacent cells with one click.' },
  { name: 'List AutoFill', desc: 'Automatically extends cell formatting when a new item is added to the end of a list.' },
  { name: 'AutoShapes Toolbar', desc: 'Allows you to draw geometrical shapes, arrows, flowchart elements, stars, and more.' },
  { name: 'Drag and Drop', desc: 'Reposition data and text by simply dragging the data with the mouse.' },
  { name: 'Charts', desc: 'Present graphical representation of data in the form of Pie, Bar, Line charts, and more.' },
  { name: 'Shortcut Menus', desc: 'Commands appropriate to the task appear by clicking the right mouse button.' },
];

/* ════════════════════════════════════════════
   Faculty Chapter 7 — Main Component
═════════════════════════════════════════════*/
function FacultyChapter7() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useModuleSection('intro', ['intro', 'powerpoint', 'word', 'excel']);

  const [introOpen, setIntroOpen] = useState(false);
  const [pptOpen, setPptOpen] = useState(false);
  // Excel feature accordions — one open at a time.
  const [openExcel, setOpenExcel] = useState(null);
  const toggleExcel = (i) => setOpenExcel(prev => (prev === i ? null : i));

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
      className="chap-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Header ── */}
      <div className="chap-header">
        <button className="chap-back-btn" onClick={() => navigate('/faculty-modules')}>
          ← Back
        </button>
        <div className="chap-header-title">
          <span className="chap-chapter-label">Chapter 7</span>
          <h1 className="chap-title">Microsoft Office Applications</h1>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="chap-layout">

        {/* ── Left Nav Card ── */}
        <div className="chap-card-small">
          <nav className="chap-nav-buttons">
            {navItems.map(item => (
              <button
                key={item.key}
                className={`chap-nav-btn ${activeSection === item.key ? 'active' : ''}`}
                onClick={() => setActiveSection(item.key)}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* ── Right Main Card ── */}
        <div className="chap-card-main">

          {/* ══════ INTRODUCTION TO MS OFFICE ══════ */}
          {activeSection === 'intro' && (
            <>
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title">Introduction to MS Office</h2>
              </div>

              <div className="s2-img-wrapper">
                <img src={mslogoImg} alt="MS Office Logo" className="s2-binary-img" style={{ maxWidth: '320px', width: '100%' }} />
              </div>

              <div className="s2-body-block">
                <p className="s2-body-text">
                  <strong>Microsoft Office</strong> is an office suite of applications, servers, and services developed by Microsoft. It was first announced by Bill Gates on <strong>August 1, 1988</strong>, in Las Vegas. The first version of Office contained <strong>Microsoft Word, Microsoft Excel, and Microsoft PowerPoint</strong>. Several versions of MS Office have been released over the years with emphasis on user friendliness and better display.
                </p>
              </div>

              <div className="s2-section-divider" />

              {/* What is MS Office? accordion */}
              <div className="chap-accordion" style={{ marginTop: 4 }}>
                <AccordionItem
                  title="What is Microsoft Office?"
                  isOpen={introOpen}
                  onToggle={() => setIntroOpen(o => !o)}
                >
                  <p className="s2-body-text" style={{ margin: 0 }}>
                    Microsoft Office is a suite of desktop productivity applications that is designed specifically to be used for office or business use. Microsoft Office was primarily created to automate the manual office work with a collection of purpose-built applications.
                  </p>
                </AccordionItem>
              </div>

              <div className="s2-section-divider" />

              {/* Different Applications */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 18 }}>Different Applications in MS Office</h3>
              </div>

              <div className="s3-flipcard-single" style={{ marginTop: 12 }}>
                <FlipCard
                  frontImage={msofficeImg}
                  frontLabel="MS Office Applications"
                  backIcon="📱"
                  backText="Microsoft Office includes: Word (word processing), Excel (spreadsheets), PowerPoint (presentations), Outlook (email), Access (databases), and Publisher (desktop publishing)."
                />
              </div>

              <div className="s2-section-divider" />

              {/* Different Versions */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 18 }}>Different Versions of MS Office</h3>
              </div>

              <div className="s3-flipcard-single" style={{ marginTop: 12 }}>
                <FlipCard
                  frontImage={versionsImg}
                  frontLabel="MS Office Versions"
                  backIcon="📅"
                  backText="Major versions include Office 95, 97, 2000, XP, 2003, 2007, 2010, 2013, 2016, and 2019, up to Microsoft 365 (subscription-based). Each version improved features and the user interface."
                />
              </div>
            </>
          )}

          {/* ══════ MICROSOFT POWERPOINT ══════ */}
          {activeSection === 'powerpoint' && (
            <>
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

              <div className="s2-img-wrapper">
                <img src={insideImg} alt="PowerPoint Inside" className="s2-binary-img" style={{ maxWidth: '640px', width: '100%' }} />
              </div>

              <div className="s2-section-divider" />

              <div className="chap-accordion">
                <AccordionItem
                  title="PowerPoint Overview"
                  isOpen={pptOpen}
                  onToggle={() => setPptOpen(o => !o)}
                >
                  <p className="s2-body-text" style={{ margin: 0 }}>
                    PowerPoint is a presentation program developed by Microsoft. It is part of the Microsoft Office suite and runs on Windows and macOS. PowerPoint presentations consist of slides that may contain text, images, charts, videos, and animations. The software provides tools for creating professional presentations with transitions, animations, and multimedia integration.
                  </p>
                </AccordionItem>
              </div>
            </>
          )}

          {/* ══════ MICROSOFT WORD ══════ */}
          {activeSection === 'word' && (
            <>
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

              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 18, textAlign: 'center' }}>Navigating the Interface</h3>
              </div>

              <div className="s7-word-interface-grid">
                {wordInterfaceItems.map((item, index) => (
                  <div key={index} className="s7-word-card-centered">
                    <div className="s7-word-card-centered-img-wrap">
                      <img src={item.img} alt={item.name} className="s7-word-card-centered-img" />
                    </div>
                    <h4 className="s7-word-card-centered-name">{item.name}</h4>
                    <p className="s7-word-card-centered-desc">{item.desc}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ══════ MICROSOFT EXCEL ══════ */}
          {activeSection === 'excel' && (
            <>
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

              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 18 }}>Excel Features</h3>
              </div>

              <div className="chap-accordion" style={{ marginTop: 12 }}>
                {excelFeatures.map((feature, i) => (
                  <AccordionItem
                    key={i}
                    title={feature.name}
                    isOpen={openExcel === i}
                    onToggle={() => toggleExcel(i)}
                  >
                    <p className="s2-body-text" style={{ margin: 0 }}>{feature.desc}</p>
                  </AccordionItem>
                ))}
              </div>

              <div className="s2-section-divider" />

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
    </motion.div>
  );
}

export default FacultyChapter7;
