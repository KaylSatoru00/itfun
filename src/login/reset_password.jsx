import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth, db } from '../firebase';
import {
  verifyPasswordResetCode,
  confirmPasswordReset,
} from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import AuthShell from './auth_shell.jsx';
import {
  passwordRules,
  PasswordChecklist,
  PasswordInput,
  screenVariants,
} from './auth_form_kit.jsx';

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get('oobCode');

  // 'checking' | 'invalid' | 'form' | 'success'
  const [stage, setStage] = useState('checking');
  const [email, setEmail] = useState('');
  const [loginPath, setLoginPath] = useState('/'); // where "Go to Login" should send the user
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState(false);

  const passwordValid = passwordRules.every(r => r.test(newPassword));

  useEffect(() => {
    if (!oobCode) {
      setStage('invalid');
      return;
    }
    verifyPasswordResetCode(auth, oobCode)
      .then(async (verifiedEmail) => {
        setEmail(verifiedEmail);

        // Figure out whether this account belongs to a student or faculty,
        // so the "Go to Login" button sends them to the right login page.
        try {
          const studentQuery = query(collection(db, 'students'), where('email', '==', verifiedEmail));
          const studentSnap = await getDocs(studentQuery);
          if (!studentSnap.empty) {
            setLoginPath('/student-login');
          } else {
            const facultyQuery = query(collection(db, 'faculty'), where('email', '==', verifiedEmail));
            const facultySnap = await getDocs(facultyQuery);
            if (!facultySnap.empty) {
              setLoginPath('/faculty-login');
            }
          }
        } catch (lookupErr) {
          console.error('Role lookup failed:', lookupErr);
          // Not critical — loginPath just falls back to '/' (role selection page)
        }

        setStage('form');
      })
      .catch((err) => {
        console.error('Verify reset code failed:', err.code, err.message);
        setStage('invalid');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oobCode]);

  const handleReset = async () => {
    setTouched(true);
    setError('');
    if (!newPassword || !confirmPassword) {
      setError('Please fill in both fields.');
      return;
    }
    if (!passwordValid) {
      setError('Password does not meet all requirements.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setStage('success');
    } catch (err) {
      if (err.code === 'auth/expired-action-code') {
        setError('This reset link has expired. Please request a new one.');
        setStage('invalid');
      } else if (err.code === 'auth/invalid-action-code') {
        setError('This reset link is invalid or has already been used.');
        setStage('invalid');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak.');
      } else {
        setError('Failed to reset password. Please try again.');
      }
    }
    setLoading(false);
  };

  return (
    <AuthShell>
      <motion.div
        className="af-card itfun-form"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
      >
        <AnimatePresence mode="wait">

          {/* ── CHECKING LINK ── */}
          {stage === 'checking' && (
            <motion.div
              key="checking"
              variants={screenVariants}
              initial="initial" animate="animate" exit="exit"
              className="d-flex flex-column align-items-center gap-3 w-100"
            >
              <h1 className="af-title">Verifying link…</h1>
              <p className="af-sub">Please wait a moment.</p>
            </motion.div>
          )}

          {/* ── INVALID / EXPIRED LINK ── */}
          {stage === 'invalid' && (
            <motion.div
              key="invalid"
              variants={screenVariants}
              initial="initial" animate="animate" exit="exit"
              className="d-flex flex-column align-items-center gap-3 w-100"
            >
              <motion.div
                className="af-mail-bubble"
                style={{ background: '#fff0f0' }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
              >
                ⚠️
              </motion.div>
              <h1 className="af-title" style={{ color: '#c8102e' }}>Link Invalid or Expired</h1>
              <p className="af-note af-note-muted" style={{ textAlign: 'center' }}>
                {error || 'This password reset link is no longer valid. Please request a new one from the login page.'}
              </p>
              <button className="btn btn-itfun w-100 py-2" onClick={() => navigate('/')}>
                Go to Login
              </button>
            </motion.div>
          )}

          {/* ── RESET FORM ── */}
          {stage === 'form' && (
            <motion.div
              key="form"
              variants={screenVariants}
              initial="initial" animate="animate" exit="exit"
              className="d-flex flex-column gap-3 w-100"
            >
              <h1 className="af-title">Set New Password</h1>
              <p className="af-sub">
                Resetting password for<br />
                <strong style={{ color: '#c8102e' }}>{email}</strong>
              </p>
              {error && <div className="alert alert-danger py-2 small mb-0 text-center">{error}</div>}

              <div className="af-field">
                <label className="af-label">New Password <span style={{ color: '#c8102e' }}>*</span></label>
                <PasswordInput
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>
              <div className="af-field">
                <label className="af-label">Confirm Password <span style={{ color: '#c8102e' }}>*</span></label>
                <PasswordInput
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleReset()}
                />
              </div>

              {touched && confirmPassword && newPassword !== confirmPassword && (
                <p className="af-hint bad" style={{ margin: '-4px 0 0' }}>✗ Passwords do not match</p>
              )}
              {touched && confirmPassword && newPassword === confirmPassword && newPassword && (
                <p className="af-hint ok" style={{ margin: '-4px 0 0' }}>✓ Passwords match</p>
              )}

              <PasswordChecklist password={newPassword} />

              <button className="btn btn-itfun w-100 py-2" onClick={handleReset} disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
              <button className="af-back-btn" onClick={() => navigate('/')}>Cancel</button>
            </motion.div>
          )}

          {/* ── SUCCESS ── */}
          {stage === 'success' && (
            <motion.div
              key="success"
              variants={screenVariants}
              initial="initial" animate="animate" exit="exit"
              className="d-flex flex-column align-items-center gap-3 w-100"
            >
              <motion.div
                className="af-mail-bubble"
                style={{ background: '#e8f5e9' }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
              >
                ✅
              </motion.div>
              <h1 className="af-title" style={{ color: '#2e7d32' }}>Password Reset!</h1>
              <p className="af-note" style={{ textAlign: 'center' }}>
                Your password has been changed successfully. You can now log in with your new password.
              </p>
              <button className="btn btn-itfun w-100 py-2" onClick={() => navigate(loginPath)}>
                Go to Login
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </AuthShell>
  );
}

export default ResetPassword;
