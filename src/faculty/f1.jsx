// s1.jsx — Introduction to Computers and History of Computers
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import pic1 from '../assets/pic1.jpg';
import pic2 from '../assets/pic2.jpg';
import inputImg from '../assets/input.webp';
import processingImg from '../assets/processing.jpg';
import storageImg from '../assets/storage.jpg';
import outputImg from '../assets/output.png';
import abacusImg from '../assets/abacus.jpg';
import blaiseImg from '../assets/blaise.jpg';
import pascalineImg from '../assets/pascaline.jpg';
import leibnizImg from '../assets/gottfried.jpg';
import steppedreckImg from '../assets/stepped.jpg';
import jacquardImg from '../assets/joseph.jpg';
import jacquardloomImg from '../assets/jacquard.jpg';
import babbageImg from '../assets/charles.jpg';
import analyticalengineImg from '../assets/analytical.jpg';
import differenceengineImg from '../assets/difference.jpg';
import thomasImg from '../assets/xavier.jpeg';
import arithmometerImg from '../assets/arithmometer.jpg';
import hollerithImg from '../assets/herman.jpg';
import tabulatingImg from '../assets/tabulating.jpg';
import aikenImg from '../assets/howard.jpg';
import mark1Img from '../assets/mark.jpg';
import atanasoffImg from '../assets/atanasoff.jpg';
import atanasoffBerryImg from '../assets/atanasoff_berry.png';
import gen1Img from '../assets/1stgen.jpg';
import gen2Img from '../assets/2ndgen.jpg';
import gen3Img from '../assets/3rdgen.png';
import gen4Img from '../assets/4thgen.jpg';
import gen5Img from '../assets/5thgen.jpg';
import './f1.css';




function FlipCard({ image, text, title }) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setFlipped(false);
  }, [title]);

  return (
    <div
      className={`chap-flip-card ${flipped ? 'flipped' : ''}`}
      onClick={() => setFlipped(f => !f)}
    >
      <div className="chap-flip-card-inner">
        {/* Front */}
        <div className="chap-flip-card-front">
          {image
            ? <img src={image} alt={title} />
            : (
              <div className="chap-flip-card-front-placeholder">
                <span style={{ fontSize: 48 }}>🖥️</span>
                <span>{title}</span>
              </div>
            )
          }
          <div className="chap-flip-card-front-overlay">
            <span>Flip for description</span>
            <span>↩</span>
          </div>
        </div>
        {/* Back */}
        <div className="chap-flip-card-back">
          <span className="chap-flip-card-back-icon">💡</span>
          {Array.isArray(text)
            ? text.map((para, i) => <p key={i}>{para}</p>)
            : <p>{text}</p>
          }
          <span className="chap-flip-card-back-hint">Tap to flip back</span>
        </div>
      </div>
    </div>
  );
}

function AccordionItem({ title, description, isOpen, onToggle }) {
  return (
    <div className="chap-accordion-item">
      <button className={`chap-accordion-header ${isOpen ? 'open' : ''}`} onClick={onToggle}>
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
              {Array.isArray(description)
                ? description.map((para, i) => {
                    const isBullet = para.startsWith('•');
                    const isLabel = para === 'Examples:' || para === 'Example:';
                    return (
                      <p key={i} style={{
                        fontSize: 16,
                        color: isLabel ? '#A50034' : '#333',
                        fontWeight: isLabel ? 'bold' : 'normal',
                        lineHeight: 1.7,
                        margin: i > 0 ? '6px 0 0' : 0,
                        paddingLeft: isBullet ? '8px' : 0,
                      }}>{para}</p>
                    );
                  })
                : <p style={{ fontSize: 16, color: '#333', lineHeight: 1.7, margin: 0 }}>{description}</p>
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PersonFlipCard({ image, name, description, wide = false }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      className={`chap-person-flip-card ${flipped ? 'flipped' : ''} ${wide ? 'wide' : ''}`}
      onClick={() => setFlipped(f => !f)}
    >
      <div className="chap-flip-card-inner">
        {/* Front — person image */}
        <div className="chap-flip-card-front">
          {image
            ? <img src={image} alt={name} />
            : (
              <div className="chap-flip-card-front-placeholder">
                <span style={{ fontSize: 48 }}>🧑‍💻</span>
                <span>{name}</span>
              </div>
            )
          }
          <div className="chap-flip-card-front-overlay">
            <span>Flip for description</span>
            <span>↩</span>
          </div>
        </div>
        {/* Back — description */}
        <div className="chap-flip-card-back chap-person-flip-back">
          <span className="chap-person-flip-name">{name}</span>
          <p>{description}</p>
          <span className="chap-flip-card-back-hint">Tap to flip back</span>
        </div>
      </div>
    </div>
  );
}

function HistoryPersonBlock({ name, label, image, description, inventions, openIndex, setOpenIndex, wide = false }) {
  return (
    <>
      {/* Divider */}
      <div className="chap-history-divider" />

      <div className="chap-history-block">
        <h2 className="chap-history-title">{name}</h2>
        {label && <p className="chap-history-label">{label}</p>}

        <PersonFlipCard
          image={image}
          name={name}
          description={description}
          wide={wide}
        />

        <p className="chap-pascal-invention-label">{inventions.length > 1 ? 'Inventions' : 'Invention'}</p>
        <div className="chap-accordion">
          {inventions.map((item, i) => (
            <div key={i} className="chap-accordion-item">
              <button
                className={`chap-accordion-header ${openIndex === i ? 'open' : ''}`}
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span>{item.title}</span>
                <span className="chap-accordion-chevron">{openIndex === i ? '∧' : '∨'}</span>
              </button>
              <AnimatePresence initial={false}>
                {openIndex === i && (
                  <motion.div
                    className="chap-accordion-body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="chap-pascal-accordion-content">
                      {item.image && <img src={item.image} alt={item.title} className="chap-pascal-invention-img" />}
                      <p className="chap-pascal-invention-desc">{item.description}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

const sectionData = {
  introduction: [
    {
      title: 'Input',
      description: [
        'The process of entering data into the computer.',
        'Examples:',
        '• Typing using a keyboard',
        '• Clicking using a mouse',
        '• Scanning documents',
      ],
      flipImage: pic1,
      flipText: 'A computer is an electronic device that accepts data, processes it according to a set of instructions (program), stores the data, and produces meaningful information as output.',
    },
    {
      title: 'Processing',
      description: [
        'The computer manipulates data and performs calculations.',
        'Example:',
        '• Calculating a student\'s average grade.',
      ],
      flipImage: null,
      flipText: 'The CPU processes the input data by executing instructions from software programs.',
    },
    {
      title: 'Storage',
      description: [
        'The computer saves data for future use.',
        'Examples:',
        '• Hard Disk Drive (HDD)',
        '• Solid State Drive (SSD)',
      ],
      flipImage: null,
      flipText: 'Data can be stored temporarily in RAM or permanently in hard drives, SSDs, or cloud storage.',
    },
    {
      title: 'Output',
      description: [
        'The computer presents processed information.',
        'Examples:',
        '• Monitor display',
        '• Printed reports',
        '• Audio from speakers',
      ],
      flipImage: null,
      flipText: 'Processed data is displayed or sent to output devices like monitors, printers, or speakers.',
    },
  ],
  functionalities: [
    {
      title: 'Input',
      description: 'The computer receives data from input devices such as a keyboard, mouse, scanner, or microphone.',
      flipImage: null,
      flipText: 'The computer receives data from input devices such as a keyboard, mouse, scanner, or microphone.',
    },
    {
      title: 'Processing',
      description: 'The CPU processes the input data by executing instructions from software programs.',
      flipImage: null,
      flipText: 'The CPU processes the input data by executing instructions from software programs.',
    },
    {
      title: 'Output',
      description: 'Processed data is displayed or sent to output devices like monitors, printers, or speakers.',
      flipImage: null,
      flipText: 'Processed data is displayed or sent to output devices like monitors, printers, or speakers.',
    },
    {
      title: 'Storage',
      description: 'Data can be stored temporarily in RAM or permanently in hard drives, SSDs, or cloud storage.',
      flipImage: null,
      flipText: 'Data can be stored temporarily in RAM or permanently in hard drives, SSDs, or cloud storage.',
    },
  ],
  history: [
    {
      title: 'Early Computing (1940s)',
      description: 'The first electronic computers like ENIAC were room-sized machines used for military calculations. They used vacuum tubes and were extremely slow by modern standards.',
      flipImage: null,
      flipText: 'The first electronic computers like ENIAC were room-sized machines used for military calculations. They used vacuum tubes and were extremely slow by modern standards.',
    },
    {
      title: 'Transistor Era (1950s–1960s)',
      description: 'Transistors replaced vacuum tubes, making computers smaller, faster, and more reliable. This era saw the rise of mainframe computers used by businesses and governments.',
      flipImage: null,
      flipText: 'Transistors replaced vacuum tubes, making computers smaller, faster, and more reliable. This era saw the rise of mainframe computers used by businesses and governments.',
    },
    {
      title: 'Personal Computer Revolution (1970s–1980s)',
      description: 'The invention of the microprocessor led to affordable personal computers. Companies like Apple and IBM brought computers into homes and offices.',
      flipImage: null,
      flipText: 'The invention of the microprocessor led to affordable personal computers. Companies like Apple and IBM brought computers into homes and offices.',
    },
    {
      title: 'Modern Era (1990s–Present)',
      description: 'The internet, mobile computing, and cloud technology transformed how people use computers. Today, computers are embedded in nearly every aspect of daily life.',
      flipImage: null,
      flipText: 'The internet, mobile computing, and cloud technology transformed how people use computers. Today, computers are embedded in nearly every aspect of daily life.',
    },
  ],
};

function FacultyChapter1() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('introduction');
  const [openIndex, setOpenIndex] = useState(null);
  const [advOpenIndex, setAdvOpenIndex] = useState(null);
  const [pascalOpenIndex, setPascalOpenIndex] = useState(null);
  const [leibnizOpenIndex, setLeibnizOpenIndex] = useState(null);
  const [jacquardOpenIndex, setJacquardOpenIndex] = useState(null);
  const [babbageOpenIndex, setBabbageOpenIndex] = useState(null);
  const [thomasOpenIndex, setThomasOpenIndex] = useState(null);
  const [hollerithOpenIndex, setHollerithOpenIndex] = useState(null);
  const [aikenOpenIndex, setAikenOpenIndex] = useState(null);
  const [atanasoffOpenIndex, setAtanasoffOpenIndex] = useState(null);

  const progress = {
    introduction: 0,
    functionalities: 0,
    history: 0,
  };

  useEffect(() => {
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = '#ffffff';
    return () => {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  const handleSectionChange = (key) => {
    setActiveSection(key);
    setOpenIndex(null);
  };

  const currentItems = sectionData[activeSection];

  // Find the first item with a flipImage in the current section
  const flipItem = currentItems.find(item => item.flipImage);

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
        <button className="chap-back-btn" onClick={() => navigate('/faculty-modules')}>
          ← Back
        </button>
        <div className="chap-header-title">
          <span className="chap-chapter-label">LEARNING MODULE 1</span>
          <h1 className="chap-title">Introduction to Computers and History of Computers</h1>
        </div>
      </div>

      {/* ── Layout ── */}
      <div className="chap-layout">

        {/* Small Left Card */}
        <div className="chap-card-small">
          <nav className="chap-nav-buttons">
            {[
              { key: 'introduction', label: 'Introduction of Computer' },
              { key: 'functionalities', label: 'Functionalities of a Computer' },
              { key: 'history', label: 'History of Computers' },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`chap-nav-btn ${activeSection === key ? 'active' : ''}`}
                onClick={() => handleSectionChange(key)}
              >
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Right Card */}
        <div className="chap-card-main">

          {activeSection === 'introduction' && (
            <>
              {/* Section Title & Subtitle */}
              <div className="chap-section-header">
                <h2 className="chap-section-main-title">Introduction of Computer</h2>
                <p className="chap-section-subtitle">The world is an information-rich world and it has become a necessity for everyone to know about computers.</p>
              </div>

              {/* Flip card + side text row */}
              {flipItem && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSection}
                    className="chap-flip-row"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.25 }}
                    style={{ marginBottom: 28 }}
                  >
                    <FlipCard
                      image={flipItem.flipImage}
                      text={flipItem.flipText}
                      title={flipItem.title}
                    />
                    <div className="chap-flip-side-text">
                      <p className="chap-flip-side-body">
                        Computers are used in almost every aspect of modern life, including education, business, healthcare, banking, communication, and entertainment.
                      </p>
                      <p className="chap-flip-side-examples-label">Examples:</p>
                      <ul className="chap-flip-side-list">
                        <li>A student uses a laptop to create a research paper.</li>
                        <li>A cashier uses a computer to process customer purchases.</li>
                        <li>A hospital uses computers to manage patient records.</li>
                      </ul>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}

              {/* Concepts of Computer header */}
              <div className="chap-concepts-header">
                <h2 className="chap-concepts-title">Concepts of Computer</h2>
                <p className="chap-concepts-subtitle">A Computer performs four basic operations:</p>
              </div>

              {/* Accordion list — now BELOW flip card */}
              <div className="chap-accordion">
                {currentItems.map((item, i) => (
                  <AccordionItem
                    key={i}
                    title={item.title}
                    description={item.description}
                    isOpen={openIndex === i}
                    onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                  />
                ))}
              </div>

              {/* What is Data section */}
              <div className="chap-data-header">
                <h2 className="chap-data-title">What is Data?</h2>
                <p className="chap-data-subtitle">An information that can be interpreted and used by computers</p>
              </div>

              {/* Data flip row — text left, image right */}
              <div className="chap-flip-row" style={{ marginTop: 20 }}>
                <div className="chap-flip-side-text">
                  <p className="chap-flip-side-examples-label">Examples of Data</p>
                  <ul className="chap-flip-side-list">
                    <li>Student names</li>
                    <li>Examination scores</li>
                    <li>Attendance records</li>
                    <li>Product prices</li>
                  </ul>
                  <div className="chap-data-example-box">
                    <p className="chap-data-example-row"><span className="chap-data-example-label">Example:</span> Data 90, 85, 88</p>
                    <p className="chap-data-example-row"><span className="chap-data-example-label">Information:</span> Average Grade = 87.67</p>
                  </div>
                </div>
                <FlipCard
                  image={pic2}
                  text="A collection of facts, such as numbers, words, measurements, observations or even just descriptions of things"
                  title="What is Data?"
                />
              </div>
            </>
          )}

          {activeSection === 'functionalities' && (
            <>
              {/* Section Title — no border */}
              <div style={{ marginBottom: 28, textAlign: 'center', width: '100%' }}>
                <h2 className="chap-section-main-title">Functionalities of a Computer</h2>
              </div>

              {/* Functionality Cards — vertical list */}
              <div className="chap-func-list" style={{ width: '100%', alignItems: 'center' }}>
                {[
                  { label: 'Input', desc: 'receiving data', img: inputImg },
                  { label: 'Processing', desc: 'manipulating data', img: processingImg },
                  { label: 'Storage', desc: 'saving data', img: storageImg },
                  { label: 'Output', desc: 'presenting results', img: outputImg },
                ].map(({ label, desc, img }) => (
                  <div key={label} className="chap-func-item">
                    <div className="chap-func-item-header">
                      <span className="chap-func-title">{label}</span>
                      <span className="chap-func-dash">–</span>
                      <span className="chap-func-desc">{desc}</span>
                    </div>
                    <img src={img} alt={label} className="chap-func-img" />
                  </div>
                ))}
              </div>

              {/* Advantages Section */}
              <div className="chap-adv-section">
                <p className="chap-adv-subtitle">Advantages:</p>
                <div className="chap-accordion">
                  {[
                    { title: 'High Speed', desc: 'A very fast device and also capable of performing calculation of very large amount of data.' },
                    { title: 'Accuracy', desc: 'Calculations are 100% error free, provided that correct input has been given.' },
                    { title: 'Storage Capability', desc: 'A computer has much more storage capacity than human beings and can store any type of data.' },
                    { title: 'Diligence', desc: 'Free from tiredness and lack of concentration and can work continuously without any error and boredom.' },
                    { title: 'Versatility', desc: 'A computer is very flexible in performing jobs to be done and can be used to solve the problems related to various fields.' },
                    { title: 'Reliability', desc: 'Modern electronic components have long lives and make maintenance easy.' },
                    { title: 'Automation', desc: 'Means ability to perform the given task automatically without human interaction.' },
                    { title: 'Reduction in Paper Work', desc: 'The use of computers for data processing in an organization leads to reduction in paper work and results in speeding up a process.' },
                    { title: 'Reduction in Cost', desc: 'Though the initial investment for installing a computer is high but it substantially reduces the cost of each of its transaction.' },
                  ].map((item, i) => (
                    <AccordionItem
                      key={i}
                      title={item.title}
                      description={item.desc}
                      isOpen={advOpenIndex === i}
                      onToggle={() => setAdvOpenIndex(advOpenIndex === i ? null : i)}
                    />
                  ))}
                </div>
              </div>

              {/* Disadvantages Section */}
              <div className="chap-adv-section">
                <p className="chap-adv-subtitle">Disadvantages:</p>
                <div className="chap-accordion">
                  {[
                    { title: '1. Dependency', desc: "It functions as per a user's instruction, so it is fully dependent on human being." },
                    { title: '2. Environment', desc: 'The operating environment of computer should be dust free and suitable.' },
                    { title: '3. No Feeling', desc: 'It cannot make judgment based on feeling, taste, experience, and knowledge unlike a human being.' },
                  ].map((item, i) => (
                    <AccordionItem
                      key={i}
                      title={item.title}
                      description={item.desc}
                      isOpen={advOpenIndex === (i + 9)}
                      onToggle={() => setAdvOpenIndex(advOpenIndex === (i + 9) ? null : (i + 9))}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {activeSection === 'history' && (
            <>
              {/* History of Computer */}
              <div className="chap-history-section">

                {/* Block 1 — History of Computer */}
                <div className="chap-history-block">
                  <h2 className="chap-history-title chap-history-title-center">History of Computers</h2>
                  <p className="chap-history-body">
                    Man's progress is measured by the sophistication of his tools. First, he discovered how to control the fire. Eventually he invented the wheel. He built boats and learned to harness the wind. As soon as commerce developed in early societies, people recognized the need to calculate and to keep track of information. They soon devised simple computing devices and bookkeeping systems to enable them to add subtract and record – simple transactions. Today we are witnessing rapid technological changes taking place on a broad scale. However, many centuries elapsed before technology was sufficiently advanced to develop computers. Without computers, many technological achievements of the past decade would not have been possible.
                  </p>
                </div>

                {/* Divider */}
                <div className="chap-history-divider" />

                {/* Block 2 — Ancient Times */}
                <div className="chap-history-block">
                  <h2 className="chap-history-title">Ancient Times</h2>
                  <p className="chap-history-body">
                    In the beginning there were no computers or calculators. To add or subtract, man used his finger and toes. At some unknown point in antiquity, one or several of our ancestors realized that by using some objects to represent digits, it might be possible to perform computations beyond the limited scope of one's own finger and toes.
                  </p>
                  <p className="chap-history-body">
                    Shells, chicken bones, or any number of objects could have been used, but the fact that the word "calculate" is derived from "calculus", the Latin word for small stone, suggests that pebbles or beads were arranged to form the familiar abacus, the first man made mechanical computing device. By manipulating the beads, it is possible with some skill and practice to make rapid calculations. Aside from the abacus, early man also invented numbering systems to enable him to compute with ease sums greater than 10.
                  </p>
                </div>

                {/* Divider */}
                <div className="chap-history-divider" />

                {/* Block 3 — Abacus */}
                <div className="chap-history-block">
                  <h2 className="chap-history-title">Abacus</h2>
                  <p className="chap-history-label">— the first man made mechanical computing device.</p>
                  <img src={abacusImg} alt="Abacus" className="chap-history-img" />
                  <p className="chap-history-body">
                    One such numbering system is the decimal numbering system, which is traceable to early Hindu-Arabic influence. This decimal system with specific digits representing numbers from 0 to 9, came into general use in Europe and has survived until the present.
                  </p>
                </div>

                {/* Divider */}
                <div className="chap-history-divider" />

                {/* Block 4 → 12 — Pioneers */}

                <HistoryPersonBlock
                  name="Blaise Pascal"
                  label="— French mathematician and inventor of one of the first mechanical calculating machines."
                  image={blaiseImg}
                  description="A French mathematician invented one of the first mechanical calculating machine in 1642. The machine adopted partly the principles of the abacus but did away with the use of the hand to move the beads or counter. Instead, Pascal used wheels to move the counters. The principle of Pascal's machine is still being used today, such as in the counters of tape recorders and odometers. Pascal's machine was one of the first mechanical calculating machines."
                  inventions={[
                    {
                      title: 'Pascaline',
                      image: pascalineImg,
                      description: "The Pascaline (also known as Pascal's calculator or arithmetic machine) is one of the world's first mechanical calculators. Invented by the 19-year-old French mathematician Blaise Pascal in 1642, it was designed to automatically perform addition and subtraction.",
                    },
                  ]}
                  openIndex={pascalOpenIndex}
                  setOpenIndex={setPascalOpenIndex}
                />

                {/* Block 5 → 12 — Remaining Pioneers */}

                <HistoryPersonBlock
                  name="Gottfried Wilhelm Von Leibniz"
                  label="— German mathematician who improved Pascal's machine into a Four Functions Machine."
                  image={leibnizImg}
                  description="Made improvements on Pascal's machine. With his improvements, it was possible for the machine to divide and multiply as easily as it could add and subtract. This is also called a Four Functions Machine."
                  inventions={[
                    {
                      title: 'Stepped Reckoner',
                      image: steppedreckImg,
                      description: 'The Stepped Reckoner was a pioneering mechanical calculator invented by the German mathematician Gottfried Wilhelm Leibniz in 1673. It was the first device capable of performing all four basic arithmetic operations directly: addition, subtraction, multiplication, and division.',
                    },
                  ]}
                  openIndex={leibnizOpenIndex}
                  setOpenIndex={setLeibnizOpenIndex}
                />

                <HistoryPersonBlock
                  name="Joseph Jacquard"
                  label="— French inventor of the mechanical loom, a milestone in industrialization."
                  image={jacquardImg}
                  description="A Frenchman who invented mechanical loam. An invention that profound changes in the history of industrialization. With the use of cards punch with holes, it was possible for the loam to weave fabrics in a variety of patterns."
                  inventions={[
                    {
                      title: 'Jacquard Loom',
                      image: jacquardloomImg,
                      description: "A Jacquard loom is a revolutionary weaving machine that uses a system of interchangeable punched cards to automate the creation of intricate, complex patterns like brocade, damask, and tapestries. Invented in 1804 by French weaver Joseph-Marie Jacquard, its binary punch-card system later inspired modern computing.",
                    },
                  ]}
                  openIndex={jacquardOpenIndex}
                  setOpenIndex={setJacquardOpenIndex}
                />

                <HistoryPersonBlock
                  name="Charles Babbage"
                  label='— English mathematician, "Father of the Computer."'
                  image={babbageImg}
                  description={`An English mathematician, who foresaw a machine that can perform all mathematical calculations, store values in its "memory" and perform logical comparison among values. He called it Analytical Engine. Electronics was the missing link in Babbage's analytical engine. He is considered as the "father of Computer."`}
                  inventions={[
                    {
                      title: 'Analytical Engine',
                      image: analyticalengineImg,
                      description: `The Analytical Engine is widely considered the world's first conceptual design for a general-purpose, programmable digital computer. It predated modern electronic computing by a century, introducing the fundamental architecture used in computers today.`,
                    },
                    {
                      title: 'Difference Engine',
                      image: differenceengineImg,
                      description: 'The Difference Engine is an early mechanical calculator designed in the 1820s by English mathematician Charles Babbage. It was built to automatically compute and tabulate polynomial functions to eliminate the severe human errors common in manual navigational and astronomical tables.',
                    },
                  ]}
                  openIndex={babbageOpenIndex}
                  setOpenIndex={setBabbageOpenIndex}
                />

                <HistoryPersonBlock
                  name="Charles Xavier Thomas"
                  label="— French inventor of the first commercially successful mechanical calculator."
                  image={thomasImg}
                  description="From France, produced his arithmometer, a mechanical calculator (the first commercial successful adding and subtracting machine). Some of those machines were brought to the United States and their arrival marked the beginning of the calculating machine industry in the US."
                  inventions={[
                    {
                      title: 'Arithmometer',
                      image: arithmometerImg,
                      description: 'The arithmometer is the first commercially mass-produced mechanical calculator, patented by Charles Xavier Thomas de Colmar in 1820. It was the first reliable machine rugged enough for daily office use, significantly reducing the time taken by banks, insurance companies, and actuaries to perform math.',
                    },
                  ]}
                  openIndex={thomasOpenIndex}
                  setOpenIndex={setThomasOpenIndex}
                />

                <HistoryPersonBlock
                  name="Dr. Herman Hollerith"
                  label="— Statistician who developed the punched card tabulating system; founder of IBM's predecessor."
                  image={hollerithImg}
                  description="A statistician working in Census Bureau who adopted the punched card concept of Jacquard. Hollerith developed the forerunner of what almost everyone recognizes today as the standard punched card. Each card has 12 rows and 80 columns and used a coding scheme that is still in use today — the Hollerith code. It permitted specially designed machines to sort census data. The Hollerith machine cut by 2/3 the time to tabulate census results. In 1896, Hollerith founded the Tabulating Machine Company. In 1924, its successor merged to form IBM."
                  inventions={[
                    {
                      title: 'Tabulating Machine',
                      image: tabulatingImg,
                      description: 'A tabulating machine was an electromechanical device designed to read, count, and sort data stored on punched cards. Invented by Herman Hollerith in the 1880s, it was famously used to process the 1890 United States Census, reducing a decade-long manual task to just one year.',
                    },
                  ]}
                  openIndex={hollerithOpenIndex}
                  setOpenIndex={setHollerithOpenIndex}
                />

                <HistoryPersonBlock
                  name="Howard Aiken"
                  label="— American computer pioneer who completed the Mark I in 1944."
                  image={aikenImg}
                  description="In 1944, the Automatic Sequence Controlled Calculator or Mark I was finished. Mark I could perform addition, subtraction, multiplication and division in a specified sequence determined by the setting of the switches. Mark I can type the answer on a typewriter connected to it or on punched cards after a few seconds. It contained more than three thousand electromagnetic relays; arithmetic counters were mechanical. Thus, the Mark I was not an electronic computer but rather an electromechanical one. In many respects, the Mark I was the realization of Babbage's dream."
                  inventions={[
                    {
                      title: 'Automatic Sequence Controlled Calculator (Mark I)',
                      image: mark1Img,
                      description: `The Automatic Sequence Controlled Calculator (ASCC), widely known as the Harvard Mark I, was one of the earliest and largest electromechanical computers. Conceived by Harvard's Dr. Howard Aiken and engineered by IBM, the machine was officially dedicated at Harvard University in 1944. It played a crucial role in World War II by calculating complex ballistics and ship designs for the U.S. Navy.`,
                    },
                  ]}
                  openIndex={aikenOpenIndex}
                  setOpenIndex={setAikenOpenIndex}
                />

                <HistoryPersonBlock
                  name="Dr. John Vincent Atanasoff & Clifford Berry"
                  label="— American inventors of the first electronic computer (ABC)."
                  image={atanasoffBerryImg}
                  description="The first prototype computer was conceived by Dr. John Vincent Atanasoff, he teamed up with Clifford Berry, his graduate assistant in building the first electronic computer. The ABC used vacuum tubes for storage and arithmetic-logic functions."
                  wide={true}
                  inventions={[
                    {
                      title: 'Atanasoff-Berry Computer (ABC)',
                      image: atanasoffImg,
                      description: "The Atanasoff-Berry Computer (ABC) was the world's first automatic electronic digital computer. Developed between 1939 and 1942 at Iowa State University, it was created by physics professor John Vincent Atanasoff and graduate student Clifford Berry.",
                    },
                  ]}
                  openIndex={atanasoffOpenIndex}
                  setOpenIndex={setAtanasoffOpenIndex}
                />

                {/* ── Generation of Computers ── */}
                <div className="chap-history-divider" style={{ marginTop: 8 }} />

                <div className="chap-history-block">
                  <h2 className="chap-history-title chap-history-title-center">Generation of Computers</h2>

                  {[
                    {
                      period: '1951 – 1958',
                      gen: 'First Generation',
                      tech: 'Used vacuum tubes (about 18,000 in number, can do calculations of 10,000 additions per second)',
                      characteristics: ['Very large', 'Expensive', 'Generated much heat'],
                      examples: ['ENIAC'],
                      image: gen1Img,
                    },
                    {
                      period: '1959 – 1964',
                      gen: 'Second Generation',
                      tech: 'Transistor based; can perform 200,000 to 250,000 calculations per second',
                      characteristics: ['Faster', 'Smaller', 'More reliable'],
                      examples: [],
                      image: gen2Img,
                    },
                    {
                      period: '1964 – 1971',
                      gen: 'Third Generation',
                      tech: 'Solid state technology & integrated circuit coupled with extreme miniaturization',
                      characteristics: ['Smaller size', 'Increased speed', 'Lower cost'],
                      examples: [],
                      image: gen3Img,
                    },
                    {
                      period: '1971 – 1979',
                      gen: 'Fourth Generation',
                      tech: 'Increased multiprogramming and virtual storage memory (microprocessor)',
                      characteristics: ['Personal computers emerged', 'Increased memory and storage'],
                      examples: ['IBM PC', 'Apple Computers'],
                      image: gen4Img,
                    },
                    {
                      period: '1979 – Present',
                      gen: 'Fifth Generation',
                      tech: 'Microprocessor operating speed at 3 to 5 million calculations per second (small scale) & 10 to 15 million instructions per second (large scale)',
                      characteristics: ['Machine Learning', 'Natural Language Processing', 'Robotics', 'Expert Systems'],
                      examples: ['AI Assistants', 'Self-driving vehicles', 'Smart devices'],
                      image: gen5Img,
                    },
                  ].map((gen, i) => (
                    <div key={i} className={`chap-gen-row ${i % 2 === 1 ? 'reverse' : ''}`}>
                      <img src={gen.image} alt={gen.gen} className="chap-gen-img" />
                      <div className="chap-gen-content">
                        <span className="chap-gen-period">{gen.period}</span>
                        <h3 className="chap-gen-title">{gen.gen}</h3>
                        <p className="chap-gen-tech">{gen.tech}</p>
                        <p className="chap-gen-label">Characteristics</p>
                        <ul className="chap-gen-list">
                          {gen.characteristics.map((c, j) => <li key={j}>{c}</li>)}
                        </ul>
                        {gen.examples.length > 0 && (
                          <>
                            <p className="chap-gen-label">Examples</p>
                            <ul className="chap-gen-list">
                              {gen.examples.map((e, j) => <li key={j}>{e}</li>)}
                            </ul>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </>
          )}

        </div>

      </div>

    </motion.div>
  );
}

export default FacultyChapter1;



