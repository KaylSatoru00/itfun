import { useState } from 'react';
import './student_login.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PiKeyReturnFill } from "react-icons/pi";
import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useUser } from './user_context';

function toPascalCase(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

function StudentLogin() {
  const [screen, setScreen] = useState('login'); // 'login' | 'signup' | 'verify'
  const navigate = useNavigate();
  const { setUser } = useUser();

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign up fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── LOGIN ──
  const handleLogin = async () => {
    setError('');
    if (!loginEmail || !loginPassword) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      const uid = userCredential.user.uid;

      // Check email verified
      if (!userCredential.user.emailVerified) {
        await auth.signOut();
        setError('Please verify your email first. Check your inbox.');
        setLoading(false);
        return;
      }

      // Check role
      const snap = await getDoc(doc(db, 'students', uid));
      if (!snap.exists()) {
        await auth.signOut();
        setError('No student account found. Are you faculty?');
        setLoading(false);
        return;
      }
      const data = snap.data();
      setUser({ uid, firstName: data.firstName, lastName: data.lastName, email: data.email, role: 'student' });
      navigate('/learning-modules');
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('No account found with this email.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError('Login failed. Please try again.');
      }
    }
    setLoading(false);
  };

  // ── SIGN UP ──
  const handleSignUp = async () => {
    setError('');
    if (!firstName || !lastName || !signupEmail || !signupPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      // Create Firebase account
      const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
      const uid = userCredential.user.uid;

      // Save to Firestore
      await setDoc(doc(db, 'students', uid), {
        uid,
        firstName,
        lastName,
        email: signupEmail,
        role: 'student',
        createdAt: new Date().toISOString(),
      });

      // Send Firebase verification email
      await sendEmailVerification(userCredential.user);

      // Sign out until they verify
      await auth.signOut();

      setScreen('verify');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please log in instead.');
      } else {
        setError('Failed to create account. Please try again.');
      }
    }
    setLoading(false);
  };

  const handleResendVerification = async () => {
    setError('');
    setLoading(true);
    try {
      // Sign in temporarily to resend
      const userCredential = await signInWithEmailAndPassword(auth, signupEmail, signupPassword);
      await sendEmailVerification(userCredential.user);
      await auth.signOut();
      setError('');
      alert('Verification email resent! Check your inbox.');
    } catch {
      setError('Failed to resend. Please try logging in instead.');
    }
    setLoading(false);
  };

  return (
    <motion.div
      className="panel"
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 180, damping: 22 }}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        translateX: '-50%',
        translateY: '-50%',
      }}
    >
      <AnimatePresence mode="wait">

        {/* ── VERIFY SCREEN ── */}
        {screen === 'verify' && (
          <motion.div
            key="verify"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
              style={{
                width: '90px', height: '90px', borderRadius: '50%',
                background: '#fff3e0', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '48px',
              }}
            >
              📧
            </motion.div>
            <h1 className="form-title" style={{ color: '#c8102e' }}>Check Your Email</h1>
            <p style={{ fontSize: '14px', color: '#555', fontFamily: 'Arial, sans-serif', textAlign: 'center', margin: '0' }}>
              A verification link was sent to<br />
              <strong style={{ color: '#c8102e' }}>{signupEmail}</strong>
            </p>
            <p style={{ fontSize: '13px', color: '#777', fontFamily: 'Arial, sans-serif', textAlign: 'center', margin: '0' }}>
              Click the link in the email to verify your account, then come back to log in.
            </p>
            {error && (
              <p style={{ color: '#c8102e', fontSize: '13px', fontFamily: 'Arial, sans-serif', margin: '0', textAlign: 'center' }}>
                {error}
              </p>
            )}
            <button className="submit-btn" onClick={() => { setScreen('login'); setLoginEmail(signupEmail); setLoginPassword(''); }}>
              Go to Login
            </button>
            <p style={{ fontSize: '13px', color: '#555', fontFamily: 'Arial, sans-serif', margin: '0' }}>
              Didn't receive it?{' '}
              <span onClick={handleResendVerification} style={{ color: '#c8102e', cursor: 'pointer', fontWeight: 'bold' }}>
                {loading ? 'Sending...' : 'Resend'}
              </span>
            </p>
          </motion.div>
        )}

        {/* ── LOGIN SCREEN ── */}
        {screen === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}
          >
            <h1 className="form-title">Login as Student</h1>

            {error && (
              <p style={{ color: '#c8102e', fontSize: '13px', fontFamily: 'Arial, sans-serif', margin: '0', textAlign: 'center' }}>
                {error}
              </p>
            )}

            <div className="input-group">
              <label>Email</label>
              <input
                type="email" className="input" placeholder="example@gmail.com"
                value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input
                type="password" className="input" placeholder="••••••••"
                value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <p className="forgot">Forgot password?</p>
            <button className="submit-btn" onClick={handleLogin} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <p className="toggle-text">
              Don't have an account?{' '}
              <span onClick={() => { setScreen('signup'); setError(''); }}>Sign Up</span>
            </p>

            <button className="back-btn" onClick={() => navigate('/')}>
              <PiKeyReturnFill size={28} />
            </button>
          </motion.div>
        )}

        {/* ── SIGN UP SCREEN ── */}
        {screen === 'signup' && (
          <motion.div
            key="signup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}
          >
            <h1 className="form-title">Sign Up as Student</h1>

            {error && (
              <p style={{ color: '#c8102e', fontSize: '13px', fontFamily: 'Arial, sans-serif', margin: '0', textAlign: 'center' }}>
                {error}
              </p>
            )}

            <div className="name-row">
              <div className="input-group" style={{ flex: 1 }}>
                <label>First Name</label>
                <input
                  type="text" className="input small" placeholder="Juan"
                  value={firstName} onChange={e => setFirstName(toPascalCase(e.target.value))}
                />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Last Name</label>
                <input
                  type="text" className="input small" placeholder="Dela Cruz"
                  value={lastName} onChange={e => setLastName(toPascalCase(e.target.value))}
                />
              </div>
            </div>
            <div className="input-group">
              <label>Email</label>
              <input
                type="email" className="input" placeholder="example@gmail.com"
                value={signupEmail} onChange={e => setSignupEmail(e.target.value)}
              />
            </div>
            <div className="name-row">
              <div className="input-group">
                <label>Password</label>
                <input
                  type="password" className="input small" placeholder="••••••••"
                  value={signupPassword} onChange={e => setSignupPassword(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Confirm Password</label>
                <input
                  type="password" className="input small" placeholder="••••••••"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <button className="submit-btn" onClick={handleSignUp} disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
            <p className="toggle-text">
              Already have an account?{' '}
              <span onClick={() => { setScreen('login'); setError(''); }}>Login</span>
            </p>

            <button className="back-btn" onClick={() => navigate('/')}>
              <PiKeyReturnFill size={28} />
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}

export default StudentLogin;