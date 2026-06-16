// s4.jsx — Hardware Components, Input and Output Devices & Basic PC-Building
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ── Assets ──
import hardwareImg    from './assets/hardware.jpg';
import buildingImg    from './assets/building.jpg';
import inputDevImg    from './assets/inputdevices.webp';
import outputDevImg   from './assets/outputdevices.webp';
import secondaryImg   from './assets/secondary.webp';
import internalImg    from './assets/internal.webp';
import moboImg        from './assets/mobo.jpg';
import asusImg        from './assets/asus.png';
import bioImg         from './assets/bio.webp';
import portImg        from './assets/port.jpg';
import serialImg      from './assets/serial.jpg';
import parallelImg    from './assets/parallel.jpg';
import ps2Img         from './assets/ps2.jpg';
import usbImg         from './assets/usb.jpg';
import vgaImg         from './assets/vga.jpg';
import ethernetImg    from './assets/ethernet.webp';
import cpuImg         from './assets/cpu.jpg';
import intelSeriesImg from './assets/intelseries.png';
import intelImg       from './assets/intel.jpg';
import amdSeriesImg   from './assets/amdseries.jpg';
import amdImg         from './assets/amd.avif';
import brandImg       from './assets/brand.jpg';

// ── IO Device Assets ──
import keyboardImg   from './assets/keyboard.jpg';
import mouseImg      from './assets/mouse.jpg';
import joystickImg   from './assets/joystick.jpg';
import lightImg      from './assets/light.webp';
import trackballImg  from './assets/trackball.jpg';
import scannerImg    from './assets/scanner.png';
import digitizerImg  from './assets/digitizer.webp';
import micImg        from './assets/mic.jpg';
import micrImg       from './assets/micr.jpg';
import ocrImg        from './assets/ocr.jpg';
import barcodeImg    from './assets/barcode.jpg';
import omrImg        from './assets/omr.jpg';
import monitorImg    from './assets/monitor.webp';
import crtImg        from './assets/crt.jpg';
import flatImg       from './assets/flat.avif';
import printerImg    from './assets/printer.webp';
import impactImg     from './assets/impact.jpg';
import nonImpactImg  from './assets/non.jpg';

import './s4.css';

/* ────────────────────────────────────────────
   Accordion — supports JSX or string as body
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
   Flip Card — image front, text back
─────────────────────────────────────────────*/
function FlipCard({ frontImage, frontLabel, backText, backIcon = '💡' }) {
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
                <span style={{ fontSize: 48 }}>🖥️</span>
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
   Flip Card — text front, image back
─────────────────────────────────────────────*/
function FlipCardImageBack({ frontLabel, backImage, backAlt }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      className={`chap-flip-card ${flipped ? 'flipped' : ''}`}
      onClick={() => setFlipped(f => !f)}
    >
      <div className="chap-flip-card-inner">
        <div className="chap-flip-card-front" style={{
          background: 'linear-gradient(160deg,#A50034 0%,#c8102e 100%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '24px 28px', textAlign: 'center'
        }}>
          <p style={{
            fontSize: 20, fontWeight: 'bold', color: '#fff',
            lineHeight: 1.5, margin: 0,
            textTransform: 'uppercase', letterSpacing: '1.5px'
          }}>{frontLabel}</p>
          <div className="chap-flip-card-front-overlay" style={{ background: 'linear-gradient(to top, rgba(80,0,20,0.7) 0%, transparent 100%)' }}>
            <span>Flip to see</span>
            <span>↩</span>
          </div>
        </div>
        <div className="chap-flip-card-back" style={{ padding: 8, background: '#111' }}>
          <img src={backImage} alt={backAlt} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 12 }} />
        </div>
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
   Small inline image (ports section)
─────────────────────────────────────────────*/
function PortImage({ src, alt }) {
  return (
    <div className="s4-port-img-wrapper">
      <img src={src} alt={alt} className="s4-port-img" />
    </div>
  );
}

/* ────────────────────────────────────────────
   Two-image row (asus + bio)
─────────────────────────────────────────────*/
function ImageRow({ images }) {
  return (
    <div className="s4-img-row">
      {images.map(({ src, alt }) => (
        <div key={alt} className="s4-img-row-item">
          <img src={src} alt={alt} className="s4-img-row-img" />
          <span className="s4-img-row-label">{alt}</span>
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────
   Nav items
─────────────────────────────────────────────*/
const navItems = [
  { key: 'parts',     label: 'Parts of Computer' },
  { key: 'iodevices', label: 'Input and Output Devices' },
];

/* ════════════════════════════════════════════
   Chapter 4 — Main Component
═════════════════════════════════════════════*/
function Chapter4() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('parts');

  // Accordion state for each group (index-based)
  const [hwOpenIdx,   setHwOpenIdx]   = useState(null);
  const [pcOpenIdx,   setPcOpenIdx]   = useState(null);
  const [moboOpenIdx, setMoboOpenIdx] = useState(null);
  const [cpuOpenIdx,  setCpuOpenIdx]  = useState(null);

  // IO section accordion states
  const [kbOpenIdx,     setKbOpenIdx]     = useState(null);
  const [charOpenIdx,   setCharOpenIdx]   = useState(null);
  const [lineOpenIdx,   setLineOpenIdx]   = useState(null);
  const [nonOpenIdx,    setNonOpenIdx]    = useState(null);

  const progress = { parts: 0, iodevices: 0 };

  useEffect(() => {
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = '#ffffff';
    return () => {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  /* ── Hardware dropdown items ── */
  const hardwareDropdowns = [
    {
      title: 'Input Devices — keyboard, mouse etc.',
      img: inputDevImg,
      imgAlt: 'Input Devices',
      desc: 'Input devices allow users to enter data and commands into a computer. Common examples include the keyboard for typing text, the mouse for pointing and clicking, microphones for audio input, scanners for digitizing documents, and webcams for capturing images.',
    },
    {
      title: 'Output Devices — printer, monitor etc.',
      img: outputDevImg,
      imgAlt: 'Output Devices',
      desc: 'Output devices display or produce the results of processed data. Common examples include the monitor which displays visual output, printers which produce hard copies, speakers which produce audio, and projectors which display images on a large screen.',
    },
    {
      title: 'Secondary Storage Devices — Hard disk, CD, DVD etc.',
      img: secondaryImg,
      imgAlt: 'Secondary Storage Devices',
      desc: 'Secondary storage devices provide permanent data storage even when the computer is off. Examples include hard disk drives (HDD), solid-state drives (SSD), CDs, DVDs, USB flash drives, and memory cards.',
    },
    {
      title: 'Internal Components — CPU, motherboard, RAM etc.',
      img: internalImg,
      imgAlt: 'Internal Components',
      desc: 'Internal components are the core hardware parts housed inside the computer case. These include the CPU (processor), motherboard, RAM (memory), GPU (graphics card), power supply unit (PSU), and cooling systems.',
    },
  ];

  /* ── PC Building reasons ── */
  const pcReasons = [
    {
      title: 'Customization and Control',
      desc: 'This allows tailoring performance for specific needs.',
    },
    {
      title: 'Better Value for Money',
      desc: 'By sourcing components individually, you can allocate your budget efficiently, prioritizing parts that matter most for your intended workload.',
    },
    {
      title: 'Upgradability',
      desc: 'Instead of replacing the entire system, you can swap specific parts like the GPU or storage drive.',
    },
    {
      title: 'Performance Optimization',
      desc: 'Match components for maximum efficiency and eliminate performance bottlenecks. Overclocking, custom cooling, and optimized airflow designs are also possible.',
    },
    {
      title: 'Educational Value',
      desc: 'Building a PC deepens understanding of computer hardware. This hands-on knowledge is valuable for IT professionals, hobbyists, and students alike.',
    },
    {
      title: 'Personal Satisfaction',
      desc: "There's a unique pride in powering on a machine you've assembled yourself and watching it work flawlessly.",
    },
  ];

  /* ── Motherboard manufacturers ── */
  const moboMakers = [
    {
      title: 'ASUS',
      desc: 'One of the top-tier brands, known for quality, stability, and innovation. Usually more expensive than competitors. Best for: Gamers, overclockers, and long-term PC builders.',
    },
    {
      title: 'Biostar',
      desc: 'Budget-friendly. Very affordable compared to ASUS/MSI/Gigabyte. Fewer features (weak BIOS, basic VRM design). Less reliable for heavy gaming/overclocking. Best for: Office PCs, light-duty builds, budget gamers.',
    },
    {
      title: 'Gigabyte',
      desc: 'Another top-tier brand, rival to ASUS. BIOS updates sometimes slower. Good gaming and enthusiast boards (AORUS line is popular). Best for: Gamers who want performance without ASUS\'s premium price.',
    },
    {
      title: 'MSI',
      desc: 'Strong presence in gaming boards. User-friendly BIOS, easy tuning features. High-end boards have strong support for overclocking. Historically weaker customer support than ASUS/Gigabyte. Best for: Gamers who like clean design and straightforward overclocking.',
    },
  ];

  /* ── CPU components ── */
  const cpuComponents = [
    {
      title: 'Memory or Storage Unit',
      desc: 'This unit can store instructions, data and intermediate results. Also known as internal storage unit, main memory, primary storage, or RAM. Its size affects speed, power and capability. Functions: stores all data and instructions required for processing; stores intermediate results of processing.',
    },
    {
      title: 'Control Unit',
      desc: 'Controls the operations of all parts of the computer but does not carry out any actual data processing. Responsible for controlling transfer of data and instructions among other units. Obtains instructions from memory, interprets them, and directs the operation of the computer. Does not process or store data.',
    },
    {
      title: 'Arithmetic Logic Unit (ALU)',
      desc: 'Consists of two subsections — Arithmetic Section: performs operations like addition, subtraction, multiplication, and division. Logic Section: performs operations such as comparing, selecting, matching and merging of data.',
    },
  ];

  /* ── Ports ── */
  const ports = [
    {
      name: 'Serial Port',
      desc: 'Used for external modems and older computer mouse. Data travels at 115 kilobits per second.',
      img: serialImg,
    },
    {
      name: 'Parallel Port',
      desc: 'Used for scanners and printers. Also called printer port.',
      img: parallelImg,
    },
    {
      name: 'PS/2 Port',
      desc: 'Used for old computer keyboard and mouse. Also called mouse port.',
      img: ps2Img,
    },
    {
      name: 'Universal Serial Bus (USB) Port',
      desc: 'Connects all kinds of external USB devices such as external hard disk, printer, scanner, mouse, keyboard etc. Introduced in 1997. Most computers provide two USB ports as minimum.',
      img: usbImg,
    },
    {
      name: 'VGA Port',
      desc: "Connects monitor to a computer's video card. Similar to serial port connector but has holes instead of pins.",
      img: vgaImg,
    },
    {
      name: 'Ethernet Port',
      desc: 'Connects to a network and high speed Internet.',
      img: ethernetImg,
    },
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
          <span className="chap-chapter-label">LEARNING MODULE 4</span>
          <h1 className="chap-title">Hardware Components, Input and Output Devices &amp; Basic PC-Building</h1>
        </div>
      </div>

      {/* ── Layout ── */}
      <div className="chap-layout">

        {/* ── Left Nav Card ── */}
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

        {/* ── Main Right Card ── */}
        <div className="chap-card-main">

          {/* ══════════════════════════════════════════
              BUTTON 1 — Parts of Computer
          ══════════════════════════════════════════ */}
          {activeSection === 'parts' && (
            <>

              {/* ── Hardware ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title">Parts of Computer</h2>
              </div>

              <div className="s2-img-wrapper">
                <img src={hardwareImg} alt="Hardware" className="s2-binary-img" />
              </div>

              <div className="s2-body-block">
                <p className="s2-body-text">
                  Hardware represents the physical and tangible components of a computer — the components that can be seen and touched.
                </p>
                <p className="s2-body-text" style={{ fontWeight: 'bold' }}>
                  Examples of Hardware:
                </p>
              </div>

              <div className="chap-accordion" style={{ marginTop: 8 }}>
                {hardwareDropdowns.map((item, i) => (
                  <AccordionItem
                    key={i}
                    title={item.title}
                    isOpen={hwOpenIdx === i}
                    onToggle={() => setHwOpenIdx(hwOpenIdx === i ? null : i)}
                  >
                    <p style={{ fontSize: 14, color: '#333', lineHeight: 1.7, margin: '0 0 12px 0' }}>
                      {item.desc}
                    </p>
                    <img
                      src={item.img}
                      alt={item.imgAlt}
                      style={{ width: '100%', maxWidth: 420, borderRadius: 10, border: '1px solid #f0d0d5', display: 'block', margin: '0 auto' }}
                    />
                  </AccordionItem>
                ))}
              </div>

              {/* ── Five Basic Operations ── */}
              <div className="s2-body-block" style={{ marginTop: 28 }}>
                <p className="s2-body-text">
                  All types of computers follow a same basic logical structure and perform the following five basic operations for converting raw input data into information useful to their users.
                </p>
              </div>

              {/* ── PC Building flip card ── */}
              <div className="s3-flipcard-single">
                <FlipCard
                  frontImage={buildingImg}
                  frontLabel="PC Building"
                  backIcon="🖥️"
                  backText="PC Building is the process of assembling a personal computer from individual hardware components such as the processor, motherboard, memory, storage drives, graphics card, power supply, and case, rather than purchasing a preassembled system."
                />
              </div>

              {/* ── Reasons Why PC Building ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0, marginTop: 12 }}>
                <h2 className="chap-section-main-title">Reasons Why PC Building?</h2>
              </div>

              <div className="chap-accordion" style={{ marginTop: 10 }}>
                {pcReasons.map((item, i) => (
                  <AccordionItem
                    key={i}
                    title={item.title}
                    isOpen={pcOpenIdx === i}
                    onToggle={() => setPcOpenIdx(pcOpenIdx === i ? null : i)}
                  >
                    <p style={{ fontSize: 15, color: '#333', lineHeight: 1.7, margin: 0 }}>
                      {item.desc}
                    </p>
                  </AccordionItem>
                ))}
              </div>

              {/* ── Overclocking callout ── */}
              <div className="s4-callout" style={{ marginTop: 24 }}>
                <span className="s4-callout-label">What is overclocking?</span>
                <p className="s4-callout-text">
                  Pushing a computer component — usually a CPU or GPU — to run at a higher speed than its manufacturer's specifications.
                </p>
              </div>

              {/* ══ DIVIDER ══ */}
              <div className="s2-section-divider" />

              {/* ── Motherboard ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title">PC Parts</h2>
              </div>

              <div className="s2-img-wrapper">
                <img src={moboImg} alt="Motherboard" className="s2-binary-img" />
              </div>

              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0, marginTop: 4 }}>
                <h2 className="chap-section-main-title" style={{ fontSize: 18 }}>Motherboard</h2>
              </div>

              <div className="s2-body-block" style={{ marginTop: 10 }}>
                <p className="s2-body-text">
                  The motherboard serves as a single platform to connect all of the parts of a computer together. It connects the CPU, memory, hard drives, optical drives, video card, sound card, and other ports and expansion cards directly or via cables. It can be considered as the backbone of a computer.
                </p>
                <p className="s2-body-text">
                  <strong>Nicknames:</strong> MOBO, Mainboard, System Board
                </p>
                <p className="s2-body-text" style={{ fontWeight: 'bold', marginBottom: 2 }}>
                  Features of Motherboard:
                </p>
                <ul className="s3-bullet-list">
                  <li>Motherboard varies greatly in supporting various types of components.</li>
                  <li>Normally a motherboard supports a single type of CPU and few types of memories.</li>
                  <li>Video Cards, Hard disks, and Sound Cards have to be compatible with motherboard to function properly.</li>
                </ul>
              </div>

              {/* ── Popular Manufacturers ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0, marginTop: 20 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 16 }}>Popular Manufacturers of Motherboard</h3>
              </div>

              <div className="chap-accordion" style={{ marginTop: 10 }}>
                {moboMakers.map((item, i) => (
                  <AccordionItem
                    key={i}
                    title={item.title}
                    isOpen={moboOpenIdx === i}
                    onToggle={() => setMoboOpenIdx(moboOpenIdx === i ? null : i)}
                  >
                    <p style={{ fontSize: 15, color: '#333', lineHeight: 1.7, margin: 0 }}>
                      {item.desc}
                    </p>
                  </AccordionItem>
                ))}
              </div>

              {/* ── ASUS + Bio images ── */}
              {/* Two mobo images — no card bg, one shared centered label */}
              <div className="s4-mobo-showcase">
                <div className="s4-mobo-imgs">
                  <img src={asusImg} alt="ASUS Motherboard" className="s4-mobo-img" />
                  <img src={bioImg}  alt="Biostar Motherboard" className="s4-mobo-img" />
                </div>
                <span className="s4-mobo-label">Example of Motherboard</span>
              </div>

              {/* ── Ports ── */}
              <div className="s2-section-divider" style={{ marginTop: 28 }} />

              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title" style={{ fontSize: 18 }}>Ports</h2>
              </div>

              <div className="s2-body-block" style={{ marginTop: 10 }}>
                <p className="s2-body-text">
                  A port is a physical docking point using which an external device can be connected to the computer.
                </p>
              </div>

              <PortImage src={portImg} alt="Computer Ports" />

              <div className="s4-ports-grid">
                {ports.map((port) => (
                  <div key={port.name} className="s4-port-card">
                    <img src={port.img} alt={port.name} className="s4-port-card-img" />
                    <div className="s4-port-card-body">
                      <p className="s4-port-card-title">{port.name}</p>
                      <p className="s4-port-card-desc">{port.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ══ DIVIDER ══ */}
              <div className="s2-section-divider" />

              {/* ── CPU ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title">CPU</h2>
              </div>

              <div className="s2-img-wrapper">
                <img src={cpuImg} alt="CPU" className="s2-binary-img" />
              </div>

              <div className="s2-body-block">
                <p className="s2-body-text">
                  The Central Processing Unit is the primary component of a computer responsible for executing instructions from programs. The CPU is considered as the brain of the computer. It performs all types of data processing operations, stores data, intermediate results and instructions. It controls the operation of all parts of the computer.
                </p>
                <p className="s2-body-text" style={{ fontWeight: 'bold' }}>
                  CPU itself has the following three components:
                </p>
              </div>

              <div className="chap-accordion" style={{ marginTop: 10 }}>
                {cpuComponents.map((item, i) => (
                  <AccordionItem
                    key={i}
                    title={item.title}
                    isOpen={cpuOpenIdx === i}
                    onToggle={() => setCpuOpenIdx(cpuOpenIdx === i ? null : i)}
                  >
                    <p style={{ fontSize: 15, color: '#333', lineHeight: 1.7, margin: 0 }}>
                      {item.desc}
                    </p>
                  </AccordionItem>
                ))}
              </div>

              {/* ── 2 Leading CPU Brands ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0, marginTop: 28 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 16 }}>2 Leading CPU Brands</h3>
              </div>

              {/* Intel */}
              <div className="s4-brand-block">
                <p className="s4-brand-name">INTEL</p>
                <div className="s2-img-wrapper" style={{ margin: '10px 0' }}>
                  <img src={intelSeriesImg} alt="Intel Series" className="s2-binary-img" />
                </div>
                <div className="s2-body-block">
                  <p className="s2-body-text">
                    Long-time market leader in CPUs, known for high single-core performance.
                  </p>
                  <ul className="s3-bullet-list">
                    <li><strong>i3</strong> = Entry-Level (Basic performance, good for everyday use)</li>
                    <li><strong>i5</strong> = Mid-Range (Balanced Choice)</li>
                    <li><strong>i7</strong> = High-End</li>
                    <li><strong>i9</strong> = Enthusiast/Professional</li>
                  </ul>
                </div>
                <div className="s2-img-wrapper" style={{ margin: '16px 0 0' }}>
                  <img src={intelImg} alt="Intel" className="s2-binary-img" style={{ maxWidth: 320 }} />
                </div>
              </div>

              {/* AMD */}
              <div className="s4-brand-block">
                <p className="s4-brand-name">AMD</p>
                <div className="s2-img-wrapper" style={{ margin: '10px 0' }}>
                  <img src={amdSeriesImg} alt="AMD Series" className="s2-binary-img" />
                </div>
                <div className="s2-body-block">
                  <p className="s2-body-text">
                    Once the underdog, now a strong competitor to Intel (especially since Ryzen 2017). AMD: Advanced Micro Devices.
                  </p>
                  <ul className="s3-bullet-list">
                    <li><strong>Ryzen 3</strong> = Entry-level (budget, basic gaming, office use)</li>
                    <li><strong>Ryzen 5</strong> = Mid-range (gaming, multitasking, good balance)</li>
                    <li><strong>Ryzen 7</strong> = High-performance (enthusiast gaming, content creation)</li>
                    <li><strong>Ryzen 9</strong> = Top-tier (extreme gaming, professional workloads, streaming, 3D rendering)</li>
                  </ul>
                </div>
                <div className="s2-img-wrapper" style={{ margin: '16px 0 0' }}>
                  <img src={amdImg} alt="AMD" className="s2-binary-img" style={{ maxWidth: 320 }} />
                </div>
              </div>

              {/* ── CPU Naming Convention ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0, marginTop: 28 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 16 }}>CPU Naming Convention Breakdown for Intel and AMD Processors</h3>
              </div>

              <div className="s3-flipcard-single" style={{ marginTop: 16 }}>
                <FlipCardImageBack
                  frontLabel="Intel &amp; AMD Naming Convention Breakdown"
                  backImage={brandImg}
                  backAlt="CPU Naming Convention"
                />
              </div>

            </>
          )}

          {/* ══════════════════════════════════════════
              BUTTON 2 — Input and Output Devices
          ══════════════════════════════════════════ */}
          {activeSection === 'iodevices' && (
            <>

              {/* ════ INPUT DEVICES ════ */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title">Input &amp; Output Devices</h2>
              </div>

              <div className="s4-io-subtitle">
                <span className="s4-io-subtitle-text">INPUT DEVICES</span>
              </div>

              {/* ── Keyboard ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0, marginTop: 8 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 18 }}>Keyboard</h3>
              </div>

              <div className="s3-flipcard-single">
                <FlipCard
                  frontImage={keyboardImg}
                  frontLabel="Keyboard"
                  backIcon="⌨️"
                  backText="Keyboard is the most common and very popular input device which helps in inputting data to the computer. The layout is like that of a traditional typewriter, with additional keys for performing extra functions. Keyboards come in 84, 101/102, 104, or 108 keys."
                />
              </div>

              {/* Keys on the keyboard */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0, marginTop: 4 }}>
                <h4 className="chap-section-main-title" style={{ fontSize: 15 }}>Keys on the Keyboard</h4>
              </div>

              <div className="chap-accordion" style={{ marginTop: 10 }}>
                {[
                  { title: 'Typing Keys', desc: 'These keys include the letter keys (A–Z) and digit keys (0–9), which generally have the same layout as those on typewriters.' },
                  { title: 'Numeric Keypad', desc: 'It is used to enter numeric data or control cursor movement. Generally consists of 17 keys arranged in the same configuration used by most adding machines and calculators.' },
                  { title: 'Function Keys', desc: 'The twelve function keys (F1–F12) are arranged in a row at the top of the keyboard. Each function key has a unique meaning and is used for a specific purpose.' },
                  { title: 'Control Keys', desc: 'These keys provide cursor and screen control. They include the four directional arrow keys, as well as Home, End, Insert, Delete, Page Up, Page Down, Control (Ctrl), Alternate (Alt), and Escape (Esc).' },
                  { title: 'Special Purpose Keys', desc: 'The keyboard also contains several special-purpose keys, such as Enter, Shift, Caps Lock, Num Lock, Spacebar, Tab, and Print Screen. These perform specific functions to assist with typing, navigation, and executing commands.' },
                ].map((item, i) => (
                  <AccordionItem
                    key={i}
                    title={item.title}
                    isOpen={kbOpenIdx === i}
                    onToggle={() => setKbOpenIdx(kbOpenIdx === i ? null : i)}
                  >
                    <p style={{ fontSize: 15, color: '#333', lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
                  </AccordionItem>
                ))}
              </div>

              <div className="s2-section-divider" />

              {/* ── Mouse ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 18 }}>Mouse</h3>
              </div>

              <div className="s3-flipcard-single">
                <FlipCard
                  frontImage={mouseImg}
                  frontLabel="Mouse"
                  backIcon="🖱️"
                  backText="Mouse is the most popular pointing device — a cursor-control device with a small palm-sized box and a round ball at its base which senses movement and sends signals to the CPU. It has left and right buttons and a scroll wheel. It can control the cursor but cannot enter text."
                />
              </div>

              <div className="s2-section-divider" />

              {/* ── Grid of remaining input devices ── */}
              <div className="s4-io-subtitle" style={{ marginTop: 4 }}>
                <span className="s4-io-subtitle-text">MORE INPUT DEVICES</span>
              </div>

              <div className="s4-device-grid">

                <div className="s4-device-card">
                  <img src={joystickImg} alt="Joystick" className="s4-device-img" />
                  <div className="s4-device-body">
                    <p className="s4-device-title">Joystick</p>
                    <p className="s4-device-desc">A pointing device used to move the cursor on a monitor screen. It has a spherical ball at both lower and upper ends and can be moved in all four directions. Mainly used in Computer Aided Designing (CAD) and playing computer games.</p>
                  </div>
                </div>

                <div className="s4-device-card">
                  <img src={lightImg} alt="Light Pen" className="s4-device-img" />
                  <div className="s4-device-body">
                    <p className="s4-device-title">Light Pen</p>
                    <p className="s4-device-desc">A pointing device similar to a pen, used to select displayed menu items or draw pictures on the monitor screen. It contains a photocell and optical system in a small tube that detects screen location when pressed.</p>
                  </div>
                </div>

                <div className="s4-device-card">
                  <img src={trackballImg} alt="Track Ball" className="s4-device-img" />
                  <div className="s4-device-body">
                    <p className="s4-device-title">Track Ball</p>
                    <p className="s4-device-desc">An input device mostly used in notebook or laptop computers instead of a mouse. A ball half-inserted into the device — moving fingers on the ball moves the pointer. Requires less space than a mouse. Comes in various shapes.</p>
                  </div>
                </div>

                <div className="s4-device-card">
                  <img src={scannerImg} alt="Scanner" className="s4-device-img" />
                  <div className="s4-device-body">
                    <p className="s4-device-title">Scanner</p>
                    <p className="s4-device-desc">Works like a photocopy machine. Used to transfer information from paper to the computer's hard disk. Captures images from the source and converts them into digital form that can be stored and edited.</p>
                  </div>
                </div>

                <div className="s4-device-card">
                  <img src={digitizerImg} alt="Digitizer" className="s4-device-img" />
                  <div className="s4-device-body">
                    <p className="s4-device-title">Digitizer</p>
                    <p className="s4-device-desc">Converts analog information into digital form. Also known as Tablet or Graphics Tablet — converts graphics and pictorial data into binary inputs. Used for fine drawing and image manipulation applications.</p>
                  </div>
                </div>

                <div className="s4-device-card">
                  <img src={micImg} alt="Microphone" className="s4-device-img" />
                  <div className="s4-device-body">
                    <p className="s4-device-title">Microphone</p>
                    <p className="s4-device-desc">An input device used to input sound that is then stored in digital form. Used for various applications like adding sound to a multimedia presentation or mixing music.</p>
                  </div>
                </div>

                <div className="s4-device-card">
                  <img src={micrImg} alt="MICR" className="s4-device-img" />
                  <div className="s4-device-body">
                    <p className="s4-device-title">Magnetic Ink Card Reader (MICR)</p>
                    <p className="s4-device-desc">Generally used in banks to process large numbers of cheques. Bank code and cheque number are printed with special magnetic ink that is machine readable. Fast and less error prone.</p>
                  </div>
                </div>

                <div className="s4-device-card">
                  <img src={ocrImg} alt="OCR" className="s4-device-img" />
                  <div className="s4-device-body">
                    <p className="s4-device-title">Optical Character Reader (OCR)</p>
                    <p className="s4-device-desc">Used to read printed text. OCR scans text optically character by character, converts it into machine-readable code, and stores the text in system memory.</p>
                  </div>
                </div>

                <div className="s4-device-card">
                  <img src={barcodeImg} alt="Bar Code Reader" className="s4-device-img" />
                  <div className="s4-device-body">
                    <p className="s4-device-title">Bar Code Reader</p>
                    <p className="s4-device-desc">A device used for reading bar coded data (light and dark lines). Used in labelling goods, numbering books etc. Scans a bar code image and converts it into an alphanumeric value fed to the computer.</p>
                  </div>
                </div>

                <div className="s4-device-card">
                  <img src={omrImg} alt="OMR" className="s4-device-img" />
                  <div className="s4-device-body">
                    <p className="s4-device-title">Optical Mark Reader (OMR)</p>
                    <p className="s4-device-desc">A special optical scanner used to recognize marks made by pen or pencil. Specially used for checking answer sheets with multiple choice questions.</p>
                  </div>
                </div>

              </div>

              {/* ════ OUTPUT DEVICES ════ */}
              <div className="s2-section-divider" />

              <div className="s4-io-subtitle">
                <span className="s4-io-subtitle-text">OUTPUT DEVICES</span>
              </div>

              {/* ── Monitors ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0, marginTop: 8 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 18 }}>Monitors</h3>
              </div>

              <div className="s3-flipcard-single">
                <FlipCard
                  frontImage={monitorImg}
                  frontLabel="Monitor"
                  backIcon="🖥️"
                  backText="Monitors, commonly called Visual Display Unit (VDU), are the main output device of a computer. They form images from tiny dots called pixels arranged in a rectangular form. The sharpness of the image depends on the number of pixels."
                />
              </div>

              <div className="s4-io-subtitle" style={{ marginTop: 20 }}>
                <span className="s4-io-subtitle-text" style={{ fontSize: 12 }}>TWO KINDS OF MONITORS</span>
              </div>

              <div className="s4-device-grid" style={{ marginTop: 14 }}>

                <div className="s4-device-card">
                  <img src={crtImg} alt="CRT Monitor" className="s4-device-img" />
                  <div className="s4-device-body">
                    <p className="s4-device-title">Cathode-Ray Tube (CRT)</p>
                    <p className="s4-device-desc">Made up of small picture elements called pixels — the smaller the pixels, the better the resolution. Most screens display 80 characters horizontally and 25 lines vertically.</p>
                    <ul className="s3-bullet-list" style={{ marginTop: 6 }}>
                      <li>Large in size</li>
                      <li>High power consumption</li>
                    </ul>
                  </div>
                </div>

                <div className="s4-device-card">
                  <img src={flatImg} alt="Flat Panel Display" className="s4-device-img" />
                  <div className="s4-device-body">
                    <p className="s4-device-title">Flat-Panel Display</p>
                    <p className="s4-device-desc">Reduced volume, weight and power requirement compared to CRT. Used in calculators, video games, monitors, laptops, and graphics displays. Divided into Emissive (plasma, LED) and Non-Emissive (LCD) displays.</p>
                  </div>
                </div>

              </div>

              <div className="s2-section-divider" />

              {/* ── Printers ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 18 }}>Printers</h3>
              </div>

              <div className="s2-img-wrapper" style={{ marginTop: 10 }}>
                <img src={printerImg} alt="Printer" className="s2-binary-img" />
              </div>

              <div className="s2-body-block" style={{ marginTop: 12 }}>
                <p className="s2-body-text">
                  Printer is an output device used to print information on paper.
                </p>
                <p className="s2-body-text">
                  There are two types of printers:
                </p>
                <ul className="s3-bullet-list">
                  <li>Impact Printers</li>
                  <li>Non-Impact Printers</li>
                </ul>
              </div>

              {/* ── Impact Printers ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0, marginTop: 16 }}>
                <h4 className="chap-section-main-title" style={{ fontSize: 16 }}>Impact Printers</h4>
              </div>

              <div className="s3-flipcard-single" style={{ marginTop: 10 }}>
                <FlipCard
                  frontImage={impactImg}
                  frontLabel="Impact Printers"
                  backIcon="🖨️"
                  backText="Impact printers print characters by striking them on a ribbon which is then pressed on the paper. Very low consumable costs, useful for bulk printing, but very noisy. There is physical contact with the paper to produce an image."
                />
              </div>

              <div className="s2-body-block" style={{ marginTop: 12 }}>
                <p className="s2-body-text">
                  Impact printers are of two types:
                </p>
                <ul className="s3-bullet-list">
                  <li><strong>Character Printers</strong> — print one character at a time</li>
                  <li><strong>Line Printers</strong> — print one line at a time</li>
                </ul>
              </div>

              {/* Character printers */}
              <div className="s4-printer-label">Character Printers</div>
              <div className="chap-accordion" style={{ marginTop: 8 }}>
                {[
                  {
                    title: 'Dot Matrix Printer (DMP)',
                    desc: 'One of the most popular printers in the market. Characters are printed in a pattern of dots using a matrix of pins (5×7, 7×9, 9×7 or 9×9). Advantages: Inexpensive, widely used, can print other language characters. Disadvantages: Slow speed, poor quality.',
                  },
                  {
                    title: 'Daisy Wheel',
                    desc: 'Head is on a wheel with pins like petals of a daisy flower. Generally used for word-processing in offices requiring nice quality letters. Advantages: More reliable than DMP, better quality, fonts can easily be changed. Disadvantages: Slower than DMP, noisy, more expensive than DMP.',
                  },
                ].map((item, i) => (
                  <AccordionItem
                    key={i}
                    title={item.title}
                    isOpen={charOpenIdx === i}
                    onToggle={() => setCharOpenIdx(charOpenIdx === i ? null : i)}
                  >
                    <p style={{ fontSize: 15, color: '#333', lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
                  </AccordionItem>
                ))}
              </div>

              {/* Line printers */}
              <div className="s4-printer-label" style={{ marginTop: 16 }}>Line Printers</div>
              <div className="chap-accordion" style={{ marginTop: 8 }}>
                {[
                  {
                    title: 'Drum Printer',
                    desc: 'Drum-shaped printer where the surface is divided into tracks equal to the paper width. A character set is embossed on each track. One rotation of the drum prints one line. Speed: 300–2000 lines per minute. Advantages: Very high speed. Disadvantages: Very expensive, character fonts cannot be changed.',
                  },
                  {
                    title: 'Chain Printer',
                    desc: 'Uses a chain of character sets. Standard character sets may have 48, 64, or 96 characters. Advantages: Character fonts can easily be changed, different languages can be used. Disadvantages: Noisy.',
                  },
                ].map((item, i) => (
                  <AccordionItem
                    key={i}
                    title={item.title}
                    isOpen={lineOpenIdx === i}
                    onToggle={() => setLineOpenIdx(lineOpenIdx === i ? null : i)}
                  >
                    <p style={{ fontSize: 15, color: '#333', lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
                  </AccordionItem>
                ))}
              </div>

              {/* ── Non-Impact Printers ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0, marginTop: 28 }}>
                <h4 className="chap-section-main-title" style={{ fontSize: 16 }}>Non-Impact Printers</h4>
              </div>

              <div className="s3-flipcard-single" style={{ marginTop: 10 }}>
                <FlipCard
                  frontImage={nonImpactImg}
                  frontLabel="Non-Impact Printers"
                  backIcon="🖨️"
                  backText="Non-impact printers print characters without using a ribbon. They print a complete page at a time (also called Page Printers). Faster than impact printers, not noisy, high quality, and support many fonts and character sizes."
                />
              </div>

              <div className="chap-accordion" style={{ marginTop: 14 }}>
                {[
                  {
                    title: 'Laser Printers',
                    desc: 'Non-impact page printers that use laser lights to produce dots for characters. Advantages: Very high speed, very high quality output, good graphics quality, support many fonts and character sizes. Disadvantages: Expensive, cannot produce multiple copies in a single printing.',
                  },
                  {
                    title: 'Inkjet Printers',
                    desc: 'Print characters by spraying small drops of ink onto paper. Produce high quality output with less noise. Color printing is possible. Some models can produce multiple copies. Advantages: High quality printing, more reliable. Disadvantages: Expensive (high cost per page), slow compared to laser printers.',
                  },
                ].map((item, i) => (
                  <AccordionItem
                    key={i}
                    title={item.title}
                    isOpen={nonOpenIdx === i}
                    onToggle={() => setNonOpenIdx(nonOpenIdx === i ? null : i)}
                  >
                    <p style={{ fontSize: 15, color: '#333', lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
                  </AccordionItem>
                ))}
              </div>

              {/* Non-impact characteristics callout */}
              <div className="s4-callout" style={{ marginTop: 20 }}>
                <span className="s4-callout-label">Characteristics of Non-Impact Printers</span>
                <ul className="s3-bullet-list" style={{ margin: '4px 0 0 0' }}>
                  <li>Faster than impact printers</li>
                  <li>Not noisy</li>
                  <li>High quality output</li>
                  <li>Support many fonts and different character sizes</li>
                </ul>
              </div>

            </>
          )}

        </div>
      </div>
    </motion.div>
  );
}

export default Chapter4;