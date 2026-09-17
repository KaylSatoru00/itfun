// about_us.jsx
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IoArrowBack } from 'react-icons/io5';
import { MdLockOpen, MdTrendingUp } from 'react-icons/md';
import { LuSwords } from 'react-icons/lu';
import itfunLogo from '../assets/LOGO_NAMEN.png';
import photoJ from '../assets/j.jpg';
import photoM from '../assets/m.png';
import photoD from '../assets/d.jpg';
import photoK from '../assets/k.jpg';
import photoC from '../assets/c.jpg';
import './about_us.css';

/* ─────────────────────────────────────────────
   Proponents
──────────────────────────────────────────────*/
const PROPONENTS = [
  { name: 'Kyle Tuazon', role: 'Programmer / Game Developer', photo: photoK },
  { name: 'Mark Adrian Dela Cruz', role: 'Project Manager / Game Developer', photo: photoM },
  { name: 'Jezter Mangacu', role: 'System Analyst / Game Developer', photo: photoJ },
  { name: 'Crismar Dimarucut', role: 'UI/UX Designer', photo: photoC },
  { name: 'Desiree Kate Chimmon', role: 'Technical Writer', photo: photoD },
];

const AVATAR_COLOR = '#C8102E';

/* Path stops — each one becomes a node on the line. */
const STOPS = [
  {
    icon: <MdLockOpen size={26} />,
    title: 'Learn It',
    body: (
      <>
        Review IT 11 topics through various learning modules, organized lessons, and learning materials designed to help you understand and strengthen your knowledge at your own pace.
      </>
    ),
  },
  {
    icon: <MdTrendingUp size={26} />,
    title: 'Level It Up',
    body: (
      <>
        Your progress is tracked module by module, so you always know exactly how
        far you&rsquo;ve come and what&rsquo;s next.
      </>
    ),
  },
  {
    icon: <LuSwords size={24} />,
    title: 'Battle It Out',
    body: (
      <>
        Put it all to the test in the PVP Quiz Arena real-time head-to-head quiz
        battles against your classmates, no waiting for exam day to find out what
        you know.
      </>
    ),
  },
];

/* ── Scroll-reveal variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const popIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

/* Cards slide in from the side of the path they sit on. */
const slideFrom = (dir) => ({
  hidden: { opacity: 0, x: dir === 'left' ? -46 : 46, y: 18 },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
});

/* Wordmark splits apart: IT rises, Fun drops. */
const wordIn = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const wordIt = {
  hidden: { opacity: 0, y: '55%', rotate: -5 },
  visible: { opacity: 1, y: 0, rotate: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};
const wordFun = {
  hidden: { opacity: 0, y: '-55%', rotate: 5 },
  visible: { opacity: 1, y: 0, rotate: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

function AboutUs() {
  const navigate = useNavigate();

  const pathWrapRef = useRef(null);
  const svgRef = useRef(null);
  const drawRef = useRef(null);
  const ghostRef = useRef(null);
  const nodeRefs = useRef([]);

  // Reset scroll to top on mount — otherwise this page opens at whatever
  // scroll offset the previous page left behind, cutting off the top.
  useEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById('root')?.scrollTo(0, 0);
  }, []);

  /* ── The line: rebuilt in real pixel coordinates so the stroke never
     distorts, then stroked in as you scroll. Nodes light up as they
     reach the middle of the screen. ── */
  useEffect(() => {
    const wrap = pathWrapRef.current;
    const svg = svgRef.current;
    const draw = drawRef.current;
    const ghost = ghostRef.current;
    if (!wrap || !svg || !draw || !ghost) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scroller = document.getElementById('root');
    let length = 0;
    let frame = 0;

    const build = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (!w || !h) return;
      const cx = w / 2;
      const amp = Math.min(150, w * 0.17);
      const d =
        `M ${cx} 0 ` +
        `C ${cx - amp} ${h * 0.13}, ${cx + amp} ${h * 0.26}, ${cx} ${h * 0.4} ` +
        `S ${cx - amp} ${h * 0.66}, ${cx} ${h * 0.8} ` +
        `S ${cx + amp * 0.7} ${h * 0.93}, ${cx} ${h}`;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      ghost.setAttribute('d', d);
      draw.setAttribute('d', d);
      length = draw.getTotalLength();
      draw.style.strokeDasharray = `${length}`;
      draw.style.strokeDashoffset = reduceMotion ? '0' : `${length}`;
    };

    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      const rect = wrap.getBoundingClientRect();

      if (!reduceMotion) {
        const progress = Math.min(
          1,
          Math.max(0, (vh * 0.62 - rect.top) / (rect.height || 1))
        );
        draw.style.strokeDashoffset = `${length - length * progress}`;
      }

      nodeRefs.current.forEach((node) => {
        if (!node) return;
        const r = node.getBoundingClientRect();
        node.classList.toggle('is-lit', r.top < vh * 0.72 && r.bottom > 0);
      });
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    build();
    update();

    scroller?.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    const ro = new ResizeObserver(() => {
      build();
      update();
    });
    ro.observe(wrap);

    return () => {
      scroller?.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      ro.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="about-us-page">
      <header className="about-us-header">
        <button className="about-us-back" onClick={() => navigate(-1)}>
          <IoArrowBack size={18} />
          <span>Back</span>
        </button>
      </header>

      <div className="about-us-content">
        {/* ── Intro ── */}
        <motion.section
          className="au-intro"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={staggerContainer}
        >
          <motion.h1 className="au-title" variants={fadeUp}>
            About Us
          </motion.h1>

          <motion.span className="au-badge" variants={popIn}>
            <i />
            Built for IT 11
          </motion.span>

          <motion.p className="au-tagline" variants={fadeUp}>
            IT Fundamentals, developing potentials.
          </motion.p>

          <motion.p className="au-copy" variants={fadeUp}>
           Why just study when you can learn by playing? ITFun provides a supplementary way to review IT 11 lessons through various learning modules, gamified quizzes, and different learning features. It gives students an opportunity to revisit topics, practice what they have learned, and strengthen their understanding at their own pace. Take it a step further with the PVP Quiz Arena, where you can test your knowledge, challenge yourself, and compete with your classmates in exciting real-time quiz battles.
          </motion.p>

          <motion.p className="au-copy" variants={fadeUp}>
           ITFun organizes IT Fundamentals into various learning modules, with each module focusing on a specific topic from the course. The modules provide organized lessons and visual learning materials that students can use when reviewing previously discussed concepts. Progress tracking also allows students to monitor their completion as they work through the available modules.
          </motion.p>

          <motion.p className="au-copy" variants={fadeUp}>
           As a supplementary learning tool, ITFun provides different ways to review and practice course content. Students can revisit specific topics, answer gamified quizzes, and use the available learning features to reinforce what they have learned. The variety of quiz formats and activities allows students to review concepts in different ways while making the process more engaging.
          </motion.p>

          <motion.p className="au-copy" variants={fadeUp}>
            ITFun brings these reviewing features together in one platform, providing students with an accessible way to revisit lessons, practice their knowledge, and prepare themselves through gamified learning. The PVP Quiz Arena adds a collaborative and competitive element, allowing students to challenge themselves and compete with classmates in real-time quiz battles.
          </motion.p>
        </motion.section>

        {/* ── Level path ── */}
        <div className="au-path" ref={pathWrapRef}>
          <svg
            className="au-path-svg"
            ref={svgRef}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path className="au-path-ghost" ref={ghostRef} />
            <path className="au-path-draw" ref={drawRef} />
          </svg>

          {STOPS.map((stop, i) => {
            const side = i % 2 === 0 ? 'left' : 'right';
            return (
              <section
                className={`au-node au-node--${side}`}
                key={stop.title}
                ref={(el) => {
                  nodeRefs.current[i] = el;
                }}
              >
                <motion.article
                  className="au-card"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.35 }}
                  variants={slideFrom(side)}
                >
                  <div className="au-card-icon">{stop.icon}</div>
                  <h3>{stop.title}</h3>
                  <p>{stop.body}</p>
                </motion.article>
                <div className="au-dot" />
              </section>
            );
          })}
        </div>

        {/* ── Brand moment ── */}
        <motion.section
          className="au-brand"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          <motion.div className="au-brand-chip" variants={popIn}>
            <img src={itfunLogo} alt="ITFun logo" className="au-brand-logo" />
          </motion.div>

          <motion.h2 className="au-brand-word" variants={wordIn}>
            <motion.span className="au-brand-word-it" variants={wordIt}>
              IT
            </motion.span>
            <motion.span className="au-brand-word-fun" variants={wordFun}>
              Fun
            </motion.span>
          </motion.h2>

          <motion.p className="au-brand-tagline" variants={fadeUp}>
            Built by students, for students because if we had to learn this
            stuff, we might as well make it fun.
          </motion.p>
        </motion.section>

        {/* ── Proponents ── */}
        <section className="au-team">
          <motion.h2
            className="au-team-title"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={fadeUp}
          >
            Meet the Team
          </motion.h2>

          <motion.div
            className="au-team-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={staggerContainer}
          >
            {PROPONENTS.map((person, i) => (
              <motion.div className="au-team-card" key={i} variants={popIn}>
                <div
                  className="au-team-avatar"
                  style={{
                    borderColor: AVATAR_COLOR,
                    ...(person.photo ? {} : { background: AVATAR_COLOR }),
                  }}
                >
                  {person.photo ? (
                    <img src={person.photo} alt={person.name} />
                  ) : (
                    person.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="au-team-name">{person.name}</div>
                <div className="au-team-role">{person.role}</div>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </div>
    </div>
  );
}

export default AboutUs;