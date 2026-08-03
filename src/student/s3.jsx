// s3.jsx — Decimal & Binary Number System
// ── Progress tracking integrated ──
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import numberImg from '../assets/number.jpg';
import numbersystemImg from '../assets/numbersystem.webp';
import decimalImg from '../assets/dec.png';
import binaryImg from '../assets/binary.jpg';
import b1Img from '../assets/b1.png';
import b2Img from '../assets/b2.png';
import d1Img from '../assets/d1.png';
import { useProgressTracker } from '../hooks/useProgressTracker';
import { useModuleSection } from '../hooks/useModuleSection';
import { PiBinary } from 'react-icons/pi';
import { TbNumber10 } from 'react-icons/tb';
import './s3.css';

// ── Lesson totals ──
// numbersystem : 2 FlipCards + 3 AccordionItems = 5
// conversions  : 3 FlipCardImageBacks = 3
const LESSON_TOTALS = { numbersystem: 5, conversions: 3 };

function AccordionItem({ title, description, itemId, onInteract }) {
  const [isOpen, setIsOpen] = useState(false);
  const handleToggle = () => {
    if (!isOpen && onInteract) onInteract(itemId);
    setIsOpen(o => !o);
  };
  return (
    <div className="chap-accordion-item">
      <button className={`chap-accordion-header ${isOpen ? 'open' : ''}`} onClick={handleToggle}>
        <span>{title}</span>
        <span className="chap-accordion-chevron">{isOpen ? '∧' : '∨'}</span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div className="chap-accordion-body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
            <div style={{ padding: '16px 20px', background: '#fff' }}>
              <p style={{ fontSize: 15, color: '#333', lineHeight: 1.7, margin: 0 }}>{description}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Circle-wipe reveal (fx-wipe): ang description ay bumubukas mula mismo
// sa puntong tinapik — fixed ang laki ng card.
function FlipCard({ frontImage, frontLabel, backText, backIcon = <PiBinary />, itemId, onInteract }) {
  const [flipped, setFlipped] = useState(false);
  const handleClick = (e) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--cx', `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty('--cy', `${((e.clientY - r.top) / r.height) * 100}%`);
    if (!flipped && onInteract) onInteract(itemId);
    setFlipped(f => !f);
  };
  return (
    <div className={`fx-card fx-wipe ${flipped ? 'open' : ''}`} onClick={handleClick}>
      <div className="fx-face fx-front">
        {frontImage ? <img src={frontImage} alt={frontLabel} /> : (
          <div className="fx-placeholder">
            <PiBinary size={48} color="#fff" />
            <span>{frontLabel}</span>
          </div>
        )}
        <div className="fx-strip"><span>Tap for description</span><span>↪</span></div>
      </div>
      <div className="fx-face fx-back">
        <span className="fx-back-icon">{backIcon}</span>
        <p>{backText}</p>
        <span className="fx-hint">Tap to go back</span>
      </div>
    </div>
  );
}

// Expand/morph reveal (fx-expand): lumalapad ang card sa buong row para
// makita nang malinaw ang worked-example image sa loob ng white panel.
function FlipCardImageBack({ frontLabel, backImage, backAlt, itemId, onInteract }) {
  const [flipped, setFlipped] = useState(false);
  const handleClick = () => {
    if (!flipped && onInteract) onInteract(itemId);
    setFlipped(f => !f);
  };
  return (
    <div className={`fx-card fx-expand ${flipped ? 'open' : ''}`} onClick={handleClick}>
      <div className="fx-face fx-front fx-front-label">
        <p>{frontLabel}</p>
        <div className="fx-strip"><span>Tap to see example</span><span>⤢</span></div>
      </div>
      <div className="fx-detail">
        <div className="fx-detail-full">
          <img src={backImage} alt={backAlt} />
        </div>
        <span className="fx-detail-note">tap to close</span>
      </div>
    </div>
  );
}

function CircleProgress({ percent = 0, active = false }) {
  const radius = 18, stroke = 3;
  const normalizedRadius = radius - stroke;
  const circumference = 2 * Math.PI * normalizedRadius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  return (
    <svg width={radius * 2} height={radius * 2} className="chap-circle-progress">
      <circle stroke={active ? 'rgba(255,255,255,0.3)' : '#f0d0d5'} fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
      <circle stroke={active ? '#fff' : '#A50034'} fill="transparent" strokeWidth={stroke} strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={strokeDashoffset} strokeLinecap="round" r={normalizedRadius} cx={radius} cy={radius} style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize="7" fontWeight="bold" fill={active ? '#fff' : '#A50034'}>{Math.round(percent)}%</text>
    </svg>
  );
}

const navItems = [
  { key: 'numbersystem', label: 'Decimal & Binary Number System' },
  { key: 'conversions',  label: 'Number System Conversions (Binary, Decimal)' },
];

const BASE_OPTIONS = [
  { key: 'binary',      label: 'Binary',      base: 2,  example: '11111111', regex: /^[01]+$/ },
  { key: 'octal',       label: 'Octal',       base: 8,  example: '377',      regex: /^[0-7]+$/ },
  { key: 'decimal',     label: 'Decimal',     base: 10, example: '255',      regex: /^[0-9]+$/ },
  { key: 'hexadecimal', label: 'Hexadecimal', base: 16, example: 'FF',       regex: /^[0-9A-Fa-f]+$/ },
];

const HEX_DIGITS = '0123456789ABCDEF';

// Source (any base) → decimal via expanded positional notation.
function expandedNotation(input, base) {
  const digits = input.toUpperCase().split('');
  const n = digits.length;
  const terms = digits.map((d, i) => {
    const val = HEX_DIGITS.indexOf(d);
    const power = n - 1 - i;
    return { d, val, power, place: Math.pow(base, power), product: val * Math.pow(base, power) };
  });
  const sum = terms.reduce((a, t) => a + t.product, 0);
  return { terms, sum };
}

// Decimal → target base via repeated division, keeping remainders.
function repeatedDivision(decimal, base) {
  const rows = [];
  let q = decimal;
  if (q === 0) rows.push({ dividend: 0, quotient: 0, remainder: 0 });
  while (q > 0) {
    rows.push({ dividend: q, quotient: Math.floor(q / base), remainder: q % base });
    q = Math.floor(q / base);
  }
  const result = rows.map((r) => HEX_DIGITS[r.remainder]).reverse().join('') || '0';
  return { rows, result };
}

// Step-by-step derivation shown under each conversion result. Every conversion
// routes through decimal, so we show: (1) source → decimal by expanded
// notation, then (2) decimal → target by repeated division — skipping whichever
// step is trivial when the source or target is already decimal.
// A place-value chart: each digit (0/1 for binary) in a box under its weight.
function BitChart({ cells }) {
  return (
    <div className="s3-bitchart">
      {cells.map((c, i) => (
        <div className="s3-bitcol" key={i}>
          <div className="s3-bitw">{c.weight}</div>
          <div className="s3-bitb">{c.digit}</div>
        </div>
      ))}
    </div>
  );
}

function ConverterSolution({ sourceOption, targetOption, input, decimalValue }) {
  const showExpand = sourceOption.base !== 10;
  const showDivide = targetOption.base !== 10;
  const exp = showExpand ? expandedNotation(input, sourceOption.base) : null;
  const div = showDivide ? repeatedDivision(decimalValue, targetOption.base) : null;
  const isBinarySource = sourceOption.base === 2;
  const isBinaryTarget = targetOption.base === 2;
  let step = 0;

  // Helper to render a term list joined with " + ".
  const joinTerms = (terms, fn) =>
    terms.map((t, i) => (
      <span key={i}>
        {i > 0 && <span className="s3-sol-op"> + </span>}
        {fn(t)}
      </span>
    ));

  return (
    <div className="s3-sol">
      {showExpand && (
        <div className="s3-sol-step">
          <div className="s3-sol-step-title">
            <span className="s3-sol-num">{++step}</span>
            {sourceOption.label} → Decimal (expanded notation)
          </div>
          <p className="s3-sol-note">
            {isBinarySource
              ? 'Line up each bit (0 or 1) under its place value, then add the place values where the bit is 1:'
              : `Multiply each digit by (base ${sourceOption.base}) raised to its position, counting from the right starting at 0:`}
          </p>

          {/* Binary: show the 0/1 place-value chart in place of the exponent line */}
          {isBinarySource && (
            <BitChart cells={exp.terms.map((t) => ({ weight: t.place, digit: t.d }))} />
          )}

          {/* Non-binary: show the exponent form first */}
          {!isBinarySource && (
            <div className="s3-sol-line">
              {joinTerms(exp.terms, (t) => (
                <>
                  {t.d}{sourceOption.base === 16 && t.val > 9 ? `(${t.val})` : ''}×{sourceOption.base}
                  <sup>{t.power}</sup>
                </>
              ))}
            </div>
          )}

          <div className="s3-sol-line">
            {!isBinarySource && <span className="s3-sol-op">= </span>}
            {joinTerms(exp.terms, (t) => `${t.val}×${t.place}`)}
          </div>
          <div className="s3-sol-line">
            <span className="s3-sol-op">= </span>
            {joinTerms(exp.terms, (t) => t.product)}
          </div>
          <div className="s3-sol-line">
            <span className="s3-sol-op">= </span>
            <span className="s3-sol-ans">{exp.sum}</span> <span className="s3-sol-mut">(decimal)</span>
          </div>
        </div>
      )}

      {showDivide && (
        <div className="s3-sol-step">
          <div className="s3-sol-step-title">
            <span className="s3-sol-num">{++step}</span>
            Decimal → {targetOption.label} (repeated division)
          </div>
          <p className="s3-sol-note">
            Divide by {targetOption.base} repeatedly and keep the remainders
            {isBinaryTarget ? ' (each is a 0 or 1)' : ''}:
          </p>
          <div className="s3-sol-div">
            {div.rows.map((r, i) => (
              <div className="s3-sol-div-row" key={i}>
                <span>{r.dividend} ÷ {targetOption.base} = {r.quotient}</span>
                <span className="s3-sol-rem">
                  remainder {r.remainder}
                  {targetOption.base === 16 && r.remainder > 9 ? ` (${HEX_DIGITS[r.remainder]})` : ''}
                </span>
              </div>
            ))}
          </div>
          <div className="s3-sol-line">
            Read remainders bottom → top: <span className="s3-sol-ans">{div.result}</span>
          </div>

          {/* Binary: show the resulting 0s and 1s under their place values */}
          {isBinaryTarget && (
            <>
              <p className="s3-sol-note">The 0s and 1s placed under their weights:</p>
              <BitChart
                cells={div.result.split('').map((d, i) => ({
                  weight: Math.pow(2, div.result.length - 1 - i),
                  digit: d,
                }))}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Chapter3() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useModuleSection(
    'numbersystem',
    ['numbersystem', 'conversions', 'converter']
  );
  const [nsOpenIndex, setNsOpenIndex] = useState(null);

  // ── Convert Tool state ──
  const [convBase, setConvBase] = useState('binary');
  const [convInput, setConvInput] = useState('');
  // Which conversion results have their step-by-step solution expanded.
  const [openSol, setOpenSol] = useState({});

  const nsT   = useProgressTracker('module3', 'lesson1', LESSON_TOTALS.numbersystem);
  const convT = useProgressTracker('module3', 'lesson2', LESSON_TOTALS.conversions);

  const progress = { numbersystem: nsT.progress, conversions: convT.progress };

  useEffect(() => {
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = '#F2D7D5';
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

  const currentBaseOption = BASE_OPTIONS.find(b => b.key === convBase);
  const targetBaseOptions = BASE_OPTIONS.filter(b => b.key !== convBase);

  const handleBaseChange = (key) => {
    setConvBase(key);
    setConvInput('');
  };

  let convError = '';
  let decimalValue = null;
  const convResults = {};
  const trimmedInput = convInput.trim();

  if (trimmedInput) {
    if (!currentBaseOption.regex.test(trimmedInput)) {
      convError = `Enter a valid ${currentBaseOption.label.toLowerCase()} number.`;
    } else {
      decimalValue = parseInt(trimmedInput, currentBaseOption.base);
      targetBaseOptions.forEach(t => {
        convResults[t.key] = decimalValue.toString(t.base).toUpperCase();
      });
    }
  }

  return (
    <motion.div className="chap-panel cp-page" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>

      <div className="chap-header">
        <button className="chap-back-btn" onClick={() => navigate('/learning-modules')}>← Back</button>
        <div className="chap-header-title">
          <span className="chap-chapter-label">LEARNING MODULE 3</span>
          <h1 className="chap-title">Number System & Conversions</h1>
        </div>
        {/* progress bar naka-pin sa ilalim ng sticky header */}
        <div className="ao-progress">
          <div style={{ width: `${Math.round((progress.numbersystem + progress.conversions) / 2)}%` }} />
        </div>
      </div>


      <div className="ao-body">

          <div className={`ao-lesson ${activeSection === 'numbersystem' ? 'open' : ''}`}>
            <button className="ao-lesson-header" onClick={() => setActiveSection('numbersystem')}>
              <span className="ao-caret">{activeSection === 'numbersystem' ? '▼' : '▶'}</span>
              <span className="ao-num">01</span>
              <span className="ao-label">Decimal & Binary Number System</span>
              <span className="ao-pct">{Math.round(progress.numbersystem)}%</span>
            </button>
          <AnimatePresence initial={false}>
          {activeSection === 'numbersystem' && (
            <motion.div className="ao-lesson-body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="ao-lesson-inner"><div className="cp-block">
            <>
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title">Number System</h2>
              </div>
              <div className="s2-img-wrapper">
                <img src={numberImg} alt="Number System" className="s2-binary-img" />
              </div>
              <div className="s2-body-block">
                <p className="s2-body-text">When we type some letters or words, the computer translates them into numbers as computers can understand only numbers.</p>
              </div>

              <div className="s2-img-wrapper" style={{ marginTop: 24 }}>
                <FlipCard frontImage={numbersystemImg} frontLabel="Number System" backIcon={<PiBinary size={36} color="#fff" />} backText="A computer can understand positional number system where there are only a few symbols called digits and these symbols represent different values depending on the position they occupy in the number." itemId="ns_flipcard_1" onInteract={nsT.trackInteraction} />
              </div>

              <div className="s2-body-block" style={{ marginTop: 20 }}>
                <p className="s2-body-text" style={{ fontWeight: 'bold', marginBottom: 4 }}>A number system is defined by three factors:</p>
                <ul className="s3-bullet-list">
                  <li>The digit</li>
                  <li>The position of the digit in the number</li>
                  <li>The base of the number system (where base is defined as the total number of digits available in the number system).</li>
                </ul>
              </div>

              <div className="chap-accordion" style={{ marginTop: 20 }}>
                {[
                  { id: 'ns_acc_0', title: 'Base 10 — Decimal System',    description: 'This is what we use every day (also called the decimal system). It uses 10 digits: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9.' },
                  { id: 'ns_acc_1', title: 'Base 2 — Binary System',       description: 'This is what computers use (called the binary system). It uses only 2 digits: 0 and 1.' },
                  { id: 'ns_acc_2', title: 'Base 16 — Hexadecimal System', description: 'Often used in programming (called hexadecimal). It uses 16 symbols: 0 to 9 and A to F.' },
                ].map((item, i) => (
                  <AccordionItem key={item.id} title={item.title} description={item.description} isOpen={nsOpenIndex === i} onToggle={() => setNsOpenIndex(nsOpenIndex === i ? null : i)} itemId={item.id} onInteract={nsT.trackInteraction} />
                ))}
              </div>

              <div className="s2-section-divider" />

              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title">Decimal Number System</h2>
              </div>
              <div className="s2-img-wrapper">
                <img src={decimalImg} alt="Decimal Number System" className="s2-binary-img" />
              </div>
              <div className="s2-body-block">
                <p className="s2-body-text">The number system that we use in our day-to-day life is the decimal number system. Decimal number system has base 10 as it uses 10 digits from 0 to 9.</p>
              </div>
              <div className="s2-img-wrapper" style={{ marginTop: 24 }}>
                <FlipCard frontImage={decimalImg} frontLabel="Decimal Number System" backIcon={<TbNumber10 size={36} color="#fff" />} backText="In decimal number system, the successive positions to the left of the decimal point represent units, tens, hundreds, thousands and so on." itemId="ns_flipcard_2" onInteract={nsT.trackInteraction} />
              </div>

              <div className="s2-section-divider" />

              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title">Binary Number System</h2>
              </div>
              <div className="s2-img-wrapper">
                <img src={binaryImg} alt="Binary Number System" className="s2-binary-img" />
              </div>
              <div className="s2-body-block" style={{ marginTop: 8 }}>
                <p className="s2-body-text" style={{ fontWeight: 'bold' }}>Characteristics of binary number system are as follows:</p>
                <ul className="s3-bullet-list">
                  <li>Uses two digits, 0 and 1.</li>
                  <li>Also called base 2 number system.</li>
                  <li>Each position in a binary number represents a 0 power of the base (2). Example: 2⁰</li>
                  <li>Last position in a binary number represents a x power of the base (2). Example: 2ˣ where x represents the last position − 1.</li>
                </ul>
              </div>
            </>
            </div></div></motion.div>
          )}
          </AnimatePresence>
          </div>


          <div className={`ao-lesson ${activeSection === 'conversions' ? 'open' : ''}`}>
            <button className="ao-lesson-header" onClick={() => setActiveSection('conversions')}>
              <span className="ao-caret">{activeSection === 'conversions' ? '▼' : '▶'}</span>
              <span className="ao-num">02</span>
              <span className="ao-label">Number System Conversions (Binary, Decimal)</span>
              <span className="ao-pct">{Math.round(progress.conversions)}%</span>
            </button>
          <AnimatePresence initial={false}>
          {activeSection === 'conversions' && (
            <motion.div className="ao-lesson-body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="ao-lesson-inner"><div className="cp-block">
            <>
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title">Binary to Decimal Number Conversion</h2>
              </div>
              <div className="s2-body-block" style={{ marginTop: 16 }}>
                <p className="s2-body-text">Binary Numbers can be converted into decimal number using an expanded notation in base 2 instead of base 10.</p>
                <p className="s2-body-text"><strong>Example:</strong> Binary Number: 10101₂</p>
              </div>
              <div className="s3-flipcard-row">
                <FlipCardImageBack frontLabel="BINARY TO DECIMAL NUMBER CONVERSION" backImage={b1Img} backAlt="Binary to Decimal Example 1" itemId="conv_fc_b1" onInteract={convT.trackInteraction} />
                <FlipCardImageBack frontLabel="BINARY TO DECIMAL NUMBER CONVERSION" backImage={b2Img} backAlt="Binary to Decimal Example 2" itemId="conv_fc_b2" onInteract={convT.trackInteraction} />
              </div>

              <div className="s2-section-divider" />

              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title">Decimal to Binary Number Conversion</h2>
              </div>
              <div className="s2-body-block" style={{ marginTop: 16 }}>
                <p className="s2-body-text">Decimal numbers can be converted into binary numbers by dividing it by 2. The remainders are considered as its binary equivalent by reading it upward or the last remainder is the first to be read. You have to neglect the numbers after the decimal point in the quotient.</p>
              </div>
              <div className="s3-flipcard-single">
                <FlipCardImageBack frontLabel="DECIMAL TO BINARY NUMBER CONVERSION" backImage={d1Img} backAlt="Decimal to Binary Example" itemId="conv_fc_d1" onInteract={convT.trackInteraction} />
              </div>
            </>
            </div></div></motion.div>
          )}
          </AnimatePresence>
          </div>


          <div className={`ao-lesson ${activeSection === 'converter' ? 'open' : ''}`}>
            <button className="ao-lesson-header" onClick={() => setActiveSection('converter')}>
              <span className="ao-caret">{activeSection === 'converter' ? '▼' : '▶'}</span>
              <span className="ao-num">⚙</span>
              <span className="ao-label">Number Converter Tool</span>
              <span className="ao-pct">TOOL</span>
            </button>
          <AnimatePresence initial={false}>
          {activeSection === 'converter' && (
            <motion.div className="ao-lesson-body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="ao-lesson-inner"><div className="cp-block">
            <div className="s3-converter-page">
              <div className="s3-converter-header">
                <span className="s3-converter-icon">⇄</span>
                <h2 className="s3-converter-title">Converter Tool</h2>
              </div>
              <p className="s3-converter-subtitle">Choose an input number system, enter a value, and see instant conversions.</p>

              <div className="s3-converter-box">
                <p className="s3-converter-step-label">Step 1 — Choose Input Number System</p>
                <div className="s3-converter-base-row">
                  {BASE_OPTIONS.map(opt => (
                    <button
                      key={opt.key}
                      className={`s3-converter-base-btn ${convBase === opt.key ? 'active' : ''}`}
                      onClick={() => handleBaseChange(opt.key)}
                    >
                      <span className="base-name">{opt.label}</span>
                      <span className="base-sub">Base {opt.base}</span>
                    </button>
                  ))}
                </div>

                <p className="s3-converter-step-label">Step 2 — Enter {currentBaseOption.label} Number</p>
                <input
                  type="text"
                  className="s3-converter-dark-input"
                  placeholder={`e.g. ${currentBaseOption.example}`}
                  value={convInput}
                  onChange={(e) => setConvInput(e.target.value)}
                />
                {convError && <p className="s3-converter-dark-error">{convError}</p>}

                <p className="s3-converter-step-label">Step 3 — Conversion Results</p>
                <div className="s3-converter-results">
                  {targetBaseOptions.map(t => {
                    const value = convResults[t.key];
                    const open = !!openSol[t.key];
                    return (
                      <div className="s3-converter-result-row" key={t.key}>
                        <div className="s3-converter-result-head">
                          <span className="s3-converter-result-label">
                            {currentBaseOption.label} <span className="s3-converter-result-arrow">→</span> {t.label}
                          </span>
                          <span className={`s3-converter-result-value ${!value ? 'empty' : ''}`}>
                            {value || '—'}
                          </span>
                        </div>
                        {value && (
                          <>
                            <button
                              type="button"
                              className="s3-sol-toggle"
                              aria-expanded={open}
                              onClick={() => setOpenSol(s => ({ ...s, [t.key]: !s[t.key] }))}
                            >
                              📝 Step-by-step solution <span className="s3-sol-caret">{open ? '▲' : '▼'}</span>
                            </button>
                            {open && (
                              <ConverterSolution
                                sourceOption={currentBaseOption}
                                targetOption={t}
                                input={trimmedInput}
                                decimalValue={decimalValue}
                              />
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            </div></div></motion.div>
          )}
          </AnimatePresence>
          </div>



      </div>
    </motion.div>
  );
}

export default Chapter3;