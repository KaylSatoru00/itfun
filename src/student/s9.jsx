// s9.jsx — Keyboarding
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import handImg from '../assets/hand.png';

import './s9.css';

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
   Shortcut Table
─────────────────────────────────────────────*/
function ShortcutTable({ rows }) {
  return (
    <table className="s9-shortcut-table">
      <tbody>
        {rows.map(([keys, desc], i) => (
          <tr key={i}>
            <td className="s9-shortcut-key">{keys}</td>
            <td className="s9-shortcut-desc">{desc}</td>
          </tr>
        ))}
      </tbody>
    </table>
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

const navItems = [
  { key: 'keyboarding', label: 'Keyboarding' },
];

/* ── Shortcut data ── */
const basicShortcuts = [
  ['Alt + F', 'File menu options in current program'],
  ['Alt + E', 'Edit options in current program'],
  ['F1', 'Universal help (for all programs)'],
  ['Ctrl + A', 'Select all text'],
  ['Ctrl + X', 'Cut selected item'],
  ['Shift + Del', 'Cut selected item'],
  ['Ctrl + C', 'Copy selected item'],
  ['Ctrl + Ins', 'Copy selected item'],
  ['Ctrl + V', 'Paste'],
  ['Shift + Ins', 'Paste'],
  ['Home', 'Go to beginning of current line'],
  ['Ctrl + Home', 'Go to beginning of document'],
  ['End', 'Go to end of current line'],
  ['Ctrl + End', 'Go to end of document'],
  ['Shift + Home', 'Highlight from current position to beginning of line'],
  ['Shift + End', 'Highlight from current position to end of line'],
  ['Ctrl + ←', 'Move one word to the left at a time'],
  ['Ctrl + →', 'Move one word to the right at a time'],
];

const wordShortcuts = [
  ['Ctrl + A', 'Select all contents of the page'],
  ['Ctrl + B', 'Bold highlighted selection'],
  ['Ctrl + C', 'Copy selected text'],
  ['Ctrl + X', 'Cut selected text'],
  ['Ctrl + N', 'Open new/blank document'],
  ['Ctrl + O', 'Open options'],
  ['Ctrl + P', 'Open the print window'],
  ['Ctrl + F', 'Open find box'],
  ['Ctrl + I', 'Italicize highlighted selection'],
  ['Ctrl + K', 'Insert link'],
  ['Ctrl + U', 'Underline highlighted selection'],
  ['Ctrl + V', 'Paste'],
  ['Ctrl + Y', 'Redo the last action performed'],
  ['Ctrl + Z', 'Undo last action'],
  ['Ctrl + G', 'Find and replace options'],
  ['Ctrl + H', 'Find and replace options'],
  ['Ctrl + J', 'Justify paragraph alignment'],
  ['Ctrl + L', 'Align selected text or line to the left'],
  ['Ctrl + Q', 'Align selected paragraph to the left'],
  ['Ctrl + E', 'Align selected text or line to the center'],
  ['Ctrl + R', 'Align selected text or line to the right'],
  ['Ctrl + M', 'Indent the paragraph'],
  ['Ctrl + T', 'Hanging indent'],
  ['Ctrl + D', 'Font options'],
  ['Ctrl + Shift + F', 'Change the font'],
  ['Ctrl + Shift + >', 'Increase selected font +1'],
  ['Ctrl + ]', 'Increase selected font +1'],
  ['Ctrl + Shift + <', 'Decrease selected font -1'],
  ['Ctrl + [', 'Decrease selected font -1'],
  ['Ctrl + Shift + *', 'View or hide non-printing characters'],
  ['Ctrl + ←', 'Move one word to the left'],
  ['Ctrl + →', 'Move one word to the right'],
  ['Ctrl + Home', 'Move to beginning of the document'],
  ['Ctrl + End', 'Move to end of the document'],
  ['Ctrl + Del', 'Delete word to right of cursor'],
  ['Ctrl + Backspace', 'Delete word to left of cursor'],
  ['Ctrl + Space', 'Reset highlighted text to default font'],
  ['Ctrl + 1', 'Single-space lines'],
  ['Ctrl + 2', 'Double-space lines'],
  ['Ctrl + 5', '1.5-line spacing'],
  ['Ctrl + Alt + 1', 'Change text to Heading 1'],
  ['Ctrl + Alt + 2', 'Change text to Heading 2'],
  ['Ctrl + Alt + 3', 'Change text to Heading 3'],
  ['F1', 'Open help'],
  ['Shift + F3', 'Change case of selected text'],
  ['Shift + Insert', 'Paste'],
  ['F4', 'Repeat last action performed'],
  ['F7', 'Spell check selected text and/or document'],
  ['Shift + F7', 'Activate the thesaurus'],
  ['F12', 'Save As'],
  ['Ctrl + S', 'Save'],
  ['Shift + F12', 'Save'],
  ['Alt + Shift + D', 'Insert the current date'],
  ['Alt + Shift + T', 'Insert the current time'],
  ['Ctrl + W', 'Close document'],
];

const windowsShortcuts = [
  ['Alt + Tab', 'Switch between open applications'],
  ['Alt + Shift + Tab', 'Switch backwards between open applications'],
  ['Alt + Print Screen', 'Create screenshot for current program'],
  ['Ctrl + Alt + Del', 'Reboot / Windows Task Manager'],
  ['Ctrl + Esc', 'Bring up Start menu'],
  ['Alt + Esc', 'Switch between applications on taskbar'],
  ['F2', 'Rename selected icon'],
  ['F3', 'Start find from desktop'],
  ['F4', 'Open the drive selection when browsing'],
  ['F5', 'Refresh contents'],
  ['Alt + F4', 'Close current open program'],
  ['Ctrl + F4', 'Close window in program'],
  ['Ctrl + Plus Key', 'Automatically adjust widths of all columns in Windows Explorer'],
  ['Alt + Enter', 'Open properties window of selected icon or program'],
  ['Shift + F10', 'Simulate right-click on selected item'],
  ['Shift + Del', 'Delete programs/files permanently'],
  ['Holding Shift', 'During bootup, boot Safe Mode or bypass system files'],
  ['Holding Shift', 'While inserting an audio CD, prevent CD Player from playing'],
];

const winkeyShortcuts = [
  ['Win + D', 'Bring desktop to the top of other windows'],
  ['Win + M', 'Minimize all windows'],
  ['Win + Shift + M', 'Undo the minimize done by Win + M and Win + D'],
  ['Win + E', 'Open Microsoft Explorer'],
  ['Win + Tab', 'Cycle through open programs on taskbar'],
  ['Win + F', 'Display Windows Search/Find feature'],
  ['Win + Ctrl + F', 'Display the search for computers window'],
  ['Win + F1', 'Display Microsoft Windows Help'],
  ['Win + R', 'Open the Run window'],
  ['Win + Pause/Break', 'Open the System Properties window'],
  ['Win + U', 'Open Utility Manager'],
  ['Win + L', 'Lock the computer'],
];

const excelShortcuts = [
  ['F2', 'Edit the selected cell'],
  ['F5', 'Go to a specific cell'],
  ['F7', 'Spell check selected text and/or document'],
  ['F11', 'Create chart'],
  ['Ctrl + Shift + ;', 'Enter the current time'],
  ['Ctrl + ;', 'Enter the current date'],
  ['Alt + Shift + F1', 'Insert new worksheet'],
  ['Shift + F3', 'Open the Excel formula window'],
  ['Shift + F5', 'Bring up search box'],
  ['Ctrl + A', 'Select all contents of worksheet'],
  ['Ctrl + B', 'Bold highlighted selection'],
  ['Ctrl + I', 'Italicize highlighted selection'],
  ['Ctrl + C', 'Copy selected text'],
  ['Ctrl + V', 'Paste'],
  ['Ctrl + D', 'Fill'],
  ['Ctrl + K', 'Insert link'],
  ['Ctrl + F', 'Open find and replace options'],
  ['Ctrl + G', 'Open Go To options'],
  ['Ctrl + H', 'Open find and replace options'],
  ['Ctrl + U', 'Underline highlighted selection'],
  ['Ctrl + Y', 'Redo last action'],
  ['Ctrl + 5', 'Strikethrough highlighted selection'],
  ['Ctrl + O', 'Open options'],
  ['Ctrl + N', 'Open new document'],
  ['Ctrl + P', 'Open print dialog box'],
  ['Ctrl + S', 'Save'],
  ['Ctrl + Z', 'Undo last action'],
  ['Ctrl + F9', 'Minimize current window'],
  ['Ctrl + F10', 'Maximize currently selected window'],
  ['Ctrl + F6', 'Switch between open workbooks/windows'],
  ['Ctrl + Page Up', 'Move between worksheets'],
  ['Ctrl + Page Down', 'Move between worksheets'],
  ['Ctrl + Tab', 'Move between open Excel files'],
  ["Alt + =", 'Create formula to sum cells above'],
  ["Ctrl + '", 'Insert value of above cell into current cell'],
  ['Ctrl + Shift + !', 'Format number in comma format'],
  ['Ctrl + Shift + $', 'Format number in currency format'],
  ['Ctrl + Shift + #', 'Format number in date format'],
  ['Ctrl + Shift + %', 'Format number in percentage format'],
  ['Ctrl + Shift + ^', 'Format number in scientific format'],
  ['Ctrl + Shift + @', 'Format number in time format'],
  ['Ctrl + Space', 'Select entire column'],
  ['Shift + Space', 'Select entire row'],
  ['Ctrl + W', 'Close document'],
];

/* ════════════════════════════════════════════
   Chapter 9 — Main Component
═════════════════════════════════════════════*/
function Chapter9() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('keyboarding');
  const [openAccordion, setOpenAccordion] = useState(null);

  const toggle = (key) => setOpenAccordion(prev => prev === key ? null : key);

  return (
    <motion.div
      className="chap-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="chap-header">
        <button className="chap-back-btn" onClick={() => navigate('/learning-modules')}>
          ← Back
        </button>
        <div className="chap-header-title">
          <span className="chap-chapter-label">Chapter 9</span>
          <h1 className="chap-title">Keyboarding</h1>
        </div>
      </div>

      <div className="chap-layout">

        {/* ── Left Nav ── */}
        <div className="chap-left-col">
          <div className="chap-card-small">
            <div className="chap-nav-buttons">
              {navItems.map(item => (
                <button
                  key={item.key}
                  className={`chap-nav-btn ${activeSection === item.key ? 'active' : ''}`}
                  onClick={() => setActiveSection(item.key)}
                >
                  <CircleProgress percent={0} active={activeSection === item.key} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <button className="chap-start-game-btn" onClick={() => navigate('/gamified-9')}>
            START GAME
          </button>
        </div>

        {/* ── Main Content ── */}
        <div className="chap-card-main">
          {activeSection === 'keyboarding' && (
            <>
              {/* ── Title ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title">Keyboarding</h2>
              </div>

              {/* ── Hand image ── */}
              <div className="s2-img-wrapper">
                <img src={handImg} alt="Keyboarding" className="s2-binary-img" style={{ maxWidth: 720 }} />
              </div>

              <div className="s2-section-divider" />

              {/* ── Shortcut Keys title ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 18 }}>Shortcut Keys</h3>
              </div>

              {/* ── Accordions ── */}
              <div className="chap-accordion" style={{ marginTop: 14 }}>

                <AccordionItem
                  title="Basic Shortcut Keys"
                  isOpen={openAccordion === 'basic'}
                  onToggle={() => toggle('basic')}
                >
                  <ShortcutTable rows={basicShortcuts} />
                </AccordionItem>

                <AccordionItem
                  title="Word Shortcut Keys"
                  isOpen={openAccordion === 'word'}
                  onToggle={() => toggle('word')}
                >
                  <ShortcutTable rows={wordShortcuts} />
                </AccordionItem>

                <AccordionItem
                  title="Microsoft Windows Shortcut Keys"
                  isOpen={openAccordion === 'windows'}
                  onToggle={() => toggle('windows')}
                >
                  <ShortcutTable rows={windowsShortcuts} />
                </AccordionItem>

                <AccordionItem
                  title="WinKey Shortcuts"
                  isOpen={openAccordion === 'winkey'}
                  onToggle={() => toggle('winkey')}
                >
                  <ShortcutTable rows={winkeyShortcuts} />
                </AccordionItem>

                <AccordionItem
                  title="Excel Shortcut Keys"
                  isOpen={openAccordion === 'excel'}
                  onToggle={() => toggle('excel')}
                >
                  <ShortcutTable rows={excelShortcuts} />
                </AccordionItem>

              </div>
            </>
          )}
        </div>

      </div>
    </motion.div>
  );
}

export default Chapter9;