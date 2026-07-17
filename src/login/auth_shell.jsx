import './auth_shell.css';
import { motion } from 'framer-motion';

/**
 * Shared split-screen auth layout: animated dark brand panel on the left,
 * page content (role cards / login forms) on the right. Stacks vertically
 * below 900px. Purely presentational — no auth logic lives here.
 */
function AuthShell({ children }) {
  return (
    <motion.div
      className="as-wrapper"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeIn' }}
    >
      <div className="as-brand">
        <div className="as-blob as-blob-1" />
        <div className="as-blob as-blob-2" />
        <div className="as-blob as-blob-3" />

        <motion.div
          className="as-brand-content"
          initial={{ opacity: 0, x: -32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h1 className="as-wordmark">
            IT<span className="as-accent">Fun</span>
          </h1>
          <p className="as-tagline">IT Fundamentals Made Fun</p>
          <div className="as-chips">
            <span className="as-chip">9 Learning Modules</span>
            <span className="as-chip">PVP Quiz Arena</span>
            <span className="as-chip">Gamified Quizzes</span>
          </div>
        </motion.div>
      </div>

      <div className="as-side">{children}</div>
    </motion.div>
  );
}

export default AuthShell;
