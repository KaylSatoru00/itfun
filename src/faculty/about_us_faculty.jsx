// about_us_faculty.jsx
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IoArrowBack } from 'react-icons/io5';
import { MdOutlineClass, MdInsights } from 'react-icons/md';
import { LuSwords } from 'react-icons/lu';
import itfunLogo from '../assets/LOGO_NAMEN.png';
import photoJ from '../assets/j.jpg';
import photoM from '../assets/m.png';
import photoD from '../assets/d.jpg';
import photoK from '../assets/k.jpg';
import photoC from '../assets/c.jpg';
import './about_us_faculty.css';

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
    icon: <MdOutlineClass size={26} />,
    title: 'Assign It',
    body: (
      <>
        Roll out the same set of modules to a whole class section, broken into
        lessons and flip cards that unlock in order so nothing gets skipped
        ahead.
      </>
    ),
  },
  {
    icon: <MdInsights size={26} />,
    title: 'Track It',
    body: (
      <>
        See progress module by module across your class section, instead of
        guessing who&rsquo;s actually keeping up between class meetings.
      </>
    ),
  },
  {
    icon: <LuSwords size={24} />,
    title: 'Engage Them',
    body: (
      <>
        Let students prove what they know in the PVP Quiz Arena real-time head-to-head quiz battles where classmates can test their knowledge against one another.
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

function AboutUsFaculty() {
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
    <div className="about-faculty-page">
      <header className="about-faculty-header">
        <button className="about-faculty-back" onClick={() => navigate(-1)}>
          <IoArrowBack size={18} />
          <span>Back</span>
        </button>
      </header>

      <div className="about-faculty-content">
        {/* ── Intro ── */}
        <motion.section
          className="auf-intro"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={staggerContainer}
        >
          <motion.h1 className="auf-title" variants={fadeUp}>
            About Us
          </motion.h1>

          <motion.span className="auf-badge" variants={popIn}>
            <i />
            For IT 11 Faculty
          </motion.span>

          <motion.p className="auf-tagline" variants={fadeUp}>
            Less time managing IT 11, more time teaching it.
          </motion.p>

          <motion.p className="auf-copy" variants={fadeUp}>
            ITFun provides faculty with a convenient way to organize their IT 11 classes and support students throughout their learning journey. Faculty can manage their classes, provide access to structured learning modules, and give students additional opportunities to review course topics at their own pace.
          </motion.p>

          <motion.p className="auf-copy" variants={fadeUp}>
           Various learning modules give students a structured way to revisit the topics covered in IT 11. Each module presents lessons and visual materials that students can access when reviewing, allowing them to go through specific topics, refresh their understanding, and track their progress as they learn.
          </motion.p>

          <motion.p className="auf-copy" variants={fadeUp}>
            ITFun also incorporates different gamified quizzes to make reviewing more engaging. Faculty can provide students with opportunities to practice and check their understanding through different quiz formats, allowing them to reinforce concepts covered in their lessons.
          </motion.p>

          <motion.p className="auf-copy" variants={fadeUp}>
           For a more interactive reviewing experience, the PVP Quiz Arena allows students to put their knowledge to the test with their classmates. Faculty can use the platform alongside their classes while students challenge themselves through real-time quiz battles, adding a collaborative and competitive element to their review.
          </motion.p>
        </motion.section>

        {/* ── Level path ── */}
        <div className="auf-path" ref={pathWrapRef}>
          <svg
            className="auf-path-svg"
            ref={svgRef}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path className="auf-path-ghost" ref={ghostRef} />
            <path className="auf-path-draw" ref={drawRef} />
          </svg>

          {STOPS.map((stop, i) => {
            const side = i % 2 === 0 ? 'left' : 'right';
            return (
              <section
                className={`auf-node auf-node--${side}`}
                key={stop.title}
                ref={(el) => {
                  nodeRefs.current[i] = el;
                }}
              >
                <motion.article
                  className="auf-card"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.35 }}
                  variants={slideFrom(side)}
                >
                  <div className="auf-card-icon">{stop.icon}</div>
                  <h3>{stop.title}</h3>
                  <p>{stop.body}</p>
                </motion.article>
                <div className="auf-dot" />
              </section>
            );
          })}
        </div>

        {/* ── Brand moment ── */}
        <motion.section
          className="auf-brand"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          <motion.div className="auf-brand-chip" variants={popIn}>
            <img src={itfunLogo} alt="ITFun logo" className="auf-brand-logo" />
          </motion.div>

          <motion.h2 className="auf-brand-word" variants={wordIn}>
            <motion.span className="auf-brand-word-it" variants={wordIt}>
              IT
            </motion.span>
            <motion.span className="auf-brand-word-fun" variants={wordFun}>
              Fun
            </motion.span>
          </motion.h2>

          <motion.p className="auf-brand-tagline" variants={fadeUp}>
            Built by students, for students and for the faculty teaching
            them, so IT 11 runs a little smoother on both sides.
          </motion.p>
        </motion.section>

        {/* ── Proponents ── */}
        <section className="auf-team">
          <motion.h2
            className="auf-team-title"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={fadeUp}
          >
            Meet the Team
          </motion.h2>

          <motion.div
            className="auf-team-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={staggerContainer}
          >
            {PROPONENTS.map((person, i) => (
              <motion.div className="auf-team-card" key={i} variants={popIn}>
                <div
                  className="auf-team-avatar"
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
                <div className="auf-team-name">{person.name}</div>
                <div className="auf-team-role">{person.role}</div>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </div>
    </div>
  );
}

export default AboutUsFaculty;