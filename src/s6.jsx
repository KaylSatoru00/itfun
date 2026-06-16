// s6.jsx — Networking Fundamentals
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ── Assets ──
import comnetImg       from './assets/comnet.webp';
import networkImg      from './assets/network.webp';
import distributorImg  from './assets/distributor.jpg';
import routersImg      from './assets/routers.webp';
import cardImg         from './assets/card.jpg';
import internalnetImg  from './assets/internalnet.png';
import externalImg     from './assets/external.jpg';
import universalImg    from './assets/universal.jpg';
import internetImg     from './assets/internet.webp';
import intranetImg     from './assets/intranet.avif';
import lanImg          from './assets/lan.png';
import wanImg          from './assets/wan.jpg';
import manImg          from './assets/man.jpg';
import wirelessImg     from './assets/wireless.webp';

import './s6.css';

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
                <span style={{ fontSize: 48 }}>🌐</span>
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
  { key: 'characteristics', label: 'Characteristics of a Computer Network' },
  { key: 'internet',        label: 'Internet and Intranet' },
  { key: 'areas',           label: 'Areas of Network' },
];

/* ── Hardware items for the dropdown ── */
const hardwareItems = [
  {
    name: 'Network Cables',
    desc: 'Network cables are used to connect computers. The most commonly used cable is Category 5 cable RJ-45.',
    img: networkImg,
  },
  {
    name: 'Distributors',
    desc: 'A computer can be connected to another one via a serial port but if we need to connect many computers to produce a network, this serial connection will not work. The solution is to use a central body to which other computers, printers, scanners etc. can be connected and then this body will manage or distribute network traffic.',
    img: distributorImg,
  },
  {
    name: 'Routers',
    desc: 'A router is a type of device which acts as the central point among computers and other devices that are part of a network. A router is equipped with holes called ports and computers and other devices are connected to a router using network cables. Now-a-days router comes in wireless modes using which computers can be connected without any physical cable.',
    img: routersImg,
  },
  {
    name: 'Network Card',
    desc: 'Network card is a necessary component of a computer without which a computer cannot be connected over a network. It is also known as network adapter or Network Interface Card (NIC). Most branded computers have network card pre-installed. Network cards are of two types: Internal and External Network Cards.',
    img: cardImg,
  },
  {
    name: 'Internal Network Cards',
    desc: 'Motherboard has a slot for internal network card where it is to be inserted. Internal network cards are of two types in which first type uses Peripheral Component Interconnect (PCI) connection while the second type uses Industry Standard Architecture (ISA). Network cables are required to provide network access.',
    img: internalnetImg,
  },
  {
    name: 'External Network Cards',
    desc: 'External network cards come in two flavours: Wireless and USB based. Wireless network card need to be inserted into the motherboard but no network cable is required to connect to network.',
    img: externalImg,
  },
  {
    name: 'Universal Serial Bus (USB)',
    desc: 'USB cards are easy to use and connect via USB port. Computers automatically detect USB card and can install the drivers required to support the USB network card automatically.',
    img: universalImg,
  },
];

/* ════════════════════════════════════════════
   Chapter 6 — Main Component
═════════════════════════════════════════════*/
function Chapter6() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('characteristics');

  // Accordion state — one per hardware item
  const [hw0, setHw0] = useState(false);
  const [hw1, setHw1] = useState(false);
  const [hw2, setHw2] = useState(false);
  const [hw3, setHw3] = useState(false);
  const [hw4, setHw4] = useState(false);
  const [hw5, setHw5] = useState(false);
  const [hw6, setHw6] = useState(false);
  const hwStates   = [hw0, hw1, hw2, hw3, hw4, hw5, hw6];
  const hwToggles  = [
    () => setHw0(o => !o),
    () => setHw1(o => !o),
    () => setHw2(o => !o),
    () => setHw3(o => !o),
    () => setHw4(o => !o),
    () => setHw5(o => !o),
    () => setHw6(o => !o),
  ];
  const [dig0, setDig0] = useState(false);
  const [dig1, setDig1] = useState(false);
  const [dig2, setDig2] = useState(false);
  const [dig3, setDig3] = useState(false);
  const digStates  = [dig0, dig1, dig2, dig3];
  const digToggles = [
    () => setDig0(o => !o),
    () => setDig1(o => !o),
    () => setDig2(o => !o),
    () => setDig3(o => !o),
  ];

  const progress = { characteristics: 0, internet: 0, areas: 0 };

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
          <span className="chap-chapter-label">LEARNING MODULE 6</span>
          <h1 className="chap-title">Networking Fundamentals</h1>
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
              BUTTON 1 — Characteristics of a Computer Network
          ══════════════════════════════════════════ */}
          {activeSection === 'characteristics' && (
            <>
              {/* ── Title ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title">Characteristics of a Computer Network</h2>
              </div>

              {/* ── Flip Card ── */}
              <div className="s3-flipcard-single" style={{ marginTop: 16 }}>
                <FlipCard
                  frontImage={comnetImg}
                  frontLabel="Computer Network"
                  backIcon="🌐"
                  backText="A Computer Network is a system in which multiple computers are connected to each other to share information and resources."
                />
              </div>

              {/* ── Definition ── */}
              <div className="s2-body-block" style={{ marginTop: 16 }}>
                <p className="s2-body-text">
                  <strong>Computer Network</strong> — is a system in which multiple computers are connected to each other to share information and resources.
                </p>
              </div>

              {/* ── Divider ── */}
              <div className="s2-section-divider" />

              {/* ── Characteristics title ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 18 }}>Characteristics of a Computer Network</h3>
              </div>

              <div className="s2-body-block" style={{ marginTop: 10 }}>
                <ul className="s3-bullet-list">
                  <li>Share Resources from one computer to another.</li>
                  <li>Create files and store them in one computer, access those files from the other computer(s) connected over the network.</li>
                  <li>Connect a printer, scanner, or a fax machine to one computer within the network and let other computers of the network use the machines available over the network.</li>
                </ul>
              </div>

              {/* ── Divider ── */}
              <div className="s2-section-divider" />

              {/* ── Hardware dropdowns — one per item ── */}
              <p className="s2-body-text" style={{ marginBottom: 12 }}>
                Following is the list of hardware required to setup a computer network:
              </p>
              <div className="chap-accordion" style={{ marginTop: 4 }}>
                {hardwareItems.map(({ name, desc, img }, i) => (
                  <AccordionItem
                    key={name}
                    title={name}
                    isOpen={hwStates[i]}
                    onToggle={hwToggles[i]}
                  >
                    <div className="s6-hardware-card">
                      <div className="s6-hardware-img-wrap">
                        <img src={img} alt={name} className="s6-hardware-img" />
                      </div>
                      <div className="s6-hardware-body">
                        <p className="s6-hardware-desc">{desc}</p>
                      </div>
                    </div>
                  </AccordionItem>
                ))}
              </div>

            </>
          )}

          {/* ══════════════════════════════════════════
              BUTTON 2 — Internet and Intranet
          ══════════════════════════════════════════ */}
          {activeSection === 'internet' && (
            <>
              {/* ── Main Title ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title">Internet / Intranet</h2>
              </div>

              {/* ════ INTERNET ════ */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0, marginTop: 16 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 18 }}>Internet</h3>
              </div>

              {/* Flip Card */}
              <div className="s3-flipcard-single" style={{ marginTop: 12 }}>
                <FlipCard
                  frontImage={internetImg}
                  frontLabel="Internet"
                  backIcon="🌐"
                  backText="It is a worldwide system of interconnected computer networks that uses the standard Internet Protocol (TCP/IP) to connect billions of devices globally."
                />
              </div>

              <div className="s2-body-block" style={{ marginTop: 14 }}>
                <p className="s2-body-text">It is a worldwide system which has the following characteristics:</p>
                <ul className="s3-bullet-list">
                  <li>Internet is a world-wide / global system of interconnected computer networks.</li>
                  <li>Internet uses the standard Internet Protocol (TCP/IP).</li>
                  <li>Every computer in internet is identified by a unique IP address.</li>
                  <li>IP Address is a unique set of numbers (such as 110.22.33.114) which identifies a computer's location.</li>
                  <li>A special computer DNS (Domain Name Server) is used to give name to the IP Address so that user can locate a computer by a name.</li>
                  <li>For example, a DNS server will resolve a name <span style={{ color: '#A50034', fontWeight: 600 }}>http://www.tutorialspoint.com</span> to a particular IP address to uniquely identify the computer on which this website is hosted.</li>
                  <li>Internet is accessible to every user all over the world.</li>
                </ul>
              </div>

              {/* ── Divider ── */}
              <div className="s2-section-divider" />

              {/* ════ INTRANET ════ */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 18 }}>Intranet</h3>
              </div>

              {/* Flip Card */}
              <div className="s3-flipcard-single" style={{ marginTop: 12 }}>
                <FlipCard
                  frontImage={intranetImg}
                  frontLabel="Intranet"
                  backIcon="🏢"
                  backText="Intranet is a system in which multiple PCs are connected to each other within a private network, accessible only to members of that organization."
                />
              </div>

              <div className="s2-body-block" style={{ marginTop: 14 }}>
                <p className="s2-body-text">Intranet is system in which multiple PCs are connected to each other.</p>
                <ul className="s3-bullet-list">
                  <li>PCs in intranet are not available to the world outside the intranet.</li>
                  <li>Usually each company or organization has their own Intranet network and members/employees of that company can access the computers in their intranet.</li>
                  <li>Each computer in Intranet is also identified by an IP Address which is unique among the computers in that Intranet.</li>
                </ul>
              </div>

              {/* ── Divider ── */}
              <div className="s2-section-divider" />

              {/* ════ SIMILARITIES ════ */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 18 }}>Similarities in Internet and Intranet</h3>
              </div>

              <div className="s2-body-block" style={{ marginTop: 10 }}>
                <p className="s2-body-text">Intranet uses the internet protocols such as TCP/IP and FTP.</p>
                <ul className="s3-bullet-list">
                  <li>Intranet sites are accessible via web browser in similar way as websites in internet. But only members of Intranet network can access intranet hosted sites.</li>
                  <li>In Intranet, own instant messengers can be used as similar to yahoo messenger / gtalk over the internet.</li>
                </ul>
              </div>

              {/* ── Divider ── */}
              <div className="s2-section-divider" />

              {/* ════ DIFFERENCES ════ */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 18 }}>Differences in Internet and Intranet</h3>
              </div>

              <div className="s2-body-block" style={{ marginTop: 10 }}>
                <p className="s2-body-text">Internet is general to PCs all over the world whereas Intranet is specific to few PCs.</p>
                <ul className="s3-bullet-list">
                  <li>Internet has wider access and provides a better access to websites to large population whereas Intranet is restricted.</li>
                  <li>Internet is not as safe as Intranet as Intranet can be safely privatized as per the need.</li>
                </ul>
              </div>

            </>
          )}

          {/* ══════════════════════════════════════════
              BUTTON 3 — Areas of Network
          ══════════════════════════════════════════ */}
          {activeSection === 'areas' && (
            <>
              {/* ── Title ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className="chap-section-main-title">Areas of a Network</h2>
              </div>

              {/* ── Network type cards ── */}
              <div className="s6-area-list" style={{ marginTop: 16 }}>

                {/* LAN */}
                <div className="s6-area-card">
                  <div className="s6-area-img-wrap">
                    <img src={lanImg} alt="LAN" className="s6-area-img" />
                  </div>
                  <div className="s6-area-body">
                    <p className="s6-area-name">Local Area Network (LAN)</p>
                    <p className="s6-area-desc">Is an interconnection of personal computers that are close to each other, usually in the same building, campus or area.</p>
                  </div>
                </div>

                {/* WAN */}
                <div className="s6-area-card">
                  <div className="s6-area-img-wrap">
                    <img src={wanImg} alt="WAN" className="s6-area-img" />
                  </div>
                  <div className="s6-area-body">
                    <p className="s6-area-name">Wide Area Network (WAN)</p>
                    <p className="s6-area-desc">Is an interconnection of many computers that are located from different cities or countries.</p>
                  </div>
                </div>

                {/* MAN */}
                <div className="s6-area-card">
                  <div className="s6-area-img-wrap">
                    <img src={manImg} alt="MAN" className="s6-area-img" />
                  </div>
                  <div className="s6-area-body">
                    <p className="s6-area-name">Metropolitan Area Network (MAN)</p>
                    <p className="s6-area-desc">Is a large-scale network that connects multiple corporate LANs together, across a wide geographical area such as by regions.</p>
                  </div>
                </div>

                {/* Wireless LAN */}
                <div className="s6-area-card">
                  <div className="s6-area-img-wrap">
                    <img src={wirelessImg} alt="Wireless LAN" className="s6-area-img" />
                  </div>
                  <div className="s6-area-body">
                    <p className="s6-area-name">Wireless LAN</p>
                    <p className="s6-area-desc">It enables people to communicate anytime, anywhere and access application without being required to connect to the network using wires or cables.</p>
                  </div>
                </div>

              </div>

              {/* ── Divider ── */}
              <div className="s2-section-divider" />

              {/* ── Digital Connections dropdown ── */}
              <div className="chap-section-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h3 className="chap-section-main-title" style={{ fontSize: 18 }}>Digital Connections</h3>
              </div>

              {/* ── Digital Connections — 4 separate dropdowns ── */}
              <div className="chap-accordion" style={{ marginTop: 12 }}>
                {[
                  {
                    title: 'Digital Subscriber Line (DSL) Connection',
                    desc: 'Is usually used by internet users at home.',
                  },
                  {
                    title: 'Broadband Connections',
                    desc: 'Simply describe a network connection that can transmit data faster than a DSL technology can do.',
                  },
                  {
                    title: 'Cable Modem Connections',
                    desc: 'A technology that utilizes the present Cable TV technology infrastructure.',
                  },
                  {
                    title: 'Wireless Connections',
                    desc: 'A technology that allows connectivity so that portable and handheld computers such as Laptops and PDAs can move around while being continuously connected to the network, and can communicate to each other successfully without wires.',
                  },
                ].map((item, i) => (
                  <AccordionItem
                    key={i}
                    title={item.title}
                    isOpen={digStates[i]}
                    onToggle={digToggles[i]}
                  >
                    <p style={{ fontSize: 15, color: '#333', lineHeight: 1.75, margin: 0 }}>{item.desc}</p>
                  </AccordionItem>
                ))}
              </div>

            </>
          )}

        </div>
      </div>
    </motion.div>
  );
}

export default Chapter6;