import { useState } from 'react';
import './faculty_login.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { auth, db, rtdb } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, get } from 'firebase/database';
import { useUser } from '../user_context';

// ── Staleness ceiling (safety net) ──
// Ang onDisconnect()/sendBeacon sa user_context.jsx ang pangunahing paraan
// para malaman kung "offline" na dapat ang isang session, pero hindi ito
// 100% guaranteed sa LAHAT ng sitwasyon (hal. force-quit ng buong browser
// process, biglaang brownout/pagkawala ng internet bago pa ma-fire ang
// alinman sa dalawa). Kung mangyari 'yon, pwedeng "ma-stuck" sa "online"
// magpakailanman ang status ng account — kaya nagtatakda tayo ng absolute
// ceiling: kahit "online" pa ang naitalang state, kung ang huling
// `lastChanged` nito ay mas matanda na sa halagang ito, ituring pa rin
// nating "pwede nang i-claim" — hindi na permanenteng naka-lock.
const SESSION_ONLINE_CEILING_MS = 90 * 1000; // 90 seconds

function toPascalCase(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

const passwordRules = [
  { id: 'length',    label: 'At least 8 characters',              test: p => p.length >= 8 },
  { id: 'upper',     label: 'At least one uppercase letter (A–Z)', test: p => /[A-Z]/.test(p) },
  { id: 'lower',     label: 'At least one lowercase letter (a–z)', test: p => /[a-z]/.test(p) },
  { id: 'number',    label: 'At least one number (0–9)',           test: p => /[0-9]/.test(p) },
  { id: 'special',   label: 'At least one special character (!@#$%&*_…)', test: p => /[!@#$%^&*_\-+=?]/.test(p) },
  { id: 'nospace',   label: 'No spaces',                           test: p => !/\s/.test(p) && p.length > 0 },
];

function PasswordChecklist({ password }) {
  if (!password) return null;
  return (
    <div style={{
      width: '100%', background: '#fff8f8', border: '1px solid #f5c0c0',
      borderRadius: '8px', padding: '10px 12px', boxSizing: 'border-box',
    }}>
      <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 'bold', color: '#555', fontFamily: 'Arial, sans-serif' }}>
        Password requirements:
      </p>
      {passwordRules.map(rule => {
        const ok = rule.test(password);
        return (
          <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
            <span style={{ fontSize: '12px', color: ok ? '#2e7d32' : '#c8102e', fontWeight: 'bold' }}>
              {ok ? '✓' : '✗'}
            </span>
            <span style={{ fontSize: '12px', color: ok ? '#2e7d32' : '#888', fontFamily: 'Arial, sans-serif' }}>
              {rule.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function RequiredLabel({ label, touched, value }) {
  const missing = touched && !value;
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '13px', fontFamily: 'Arial, sans-serif', color: missing ? '#c8102e' : undefined }}>
      {label}
      <span style={{ color: '#c8102e', fontSize: '13px' }}>*</span>
    </label>
  );
}

function PasswordInput({ value, onChange, placeholder, className, onKeyDown }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type={show ? 'text' : 'password'}
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        style={{ paddingRight: '36px', width: '100%', boxSizing: 'border-box' }}
      />
      <span
        onClick={() => setShow(s => !s)}
        style={{
          position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
          cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center',
        }}
      >
        {show ? <AiOutlineEyeInvisible size={18} /> : <AiOutlineEye size={18} />}
      </span>
    </div>
  );
}

function FacultyLogin() {
  const [screen, setScreen] = useState('login');
  const navigate = useNavigate();
  const { setUser, confirmSession } = useUser();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loginTouched, setLoginTouched] = useState({ email: false, password: false });
  const [signupTouched, setSignupTouched] = useState({
    firstName: false, lastName: false, email: false, password: false, confirmPassword: false,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // signup OTP verification state
  const [otpCode, setOtpCode] = useState('');
  const [otpTouched, setOtpTouched] = useState(false);

  // forgot password state
  const [resetEmail, setResetEmail] = useState('');
  const [resetTouched, setResetTouched] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const passwordValid = passwordRules.every(r => r.test(signupPassword));

  const handleLogin = async () => {
    setLoginTouched({ email: true, password: true });
    setError('');
    if (!loginEmail || !loginPassword) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      const uid = userCredential.user.uid;
      if (!userCredential.user.emailVerified) {
        await auth.signOut();
        setError('Please verify your email first. Check your inbox.');
        setLoading(false);
        return;
      }
      const snap = await getDoc(doc(db, 'faculty', uid));
      if (!snap.exists()) {
        await auth.signOut();
        setError('No faculty account found. Are you a student?');
        setLoading(false);
        return;
      }
      const data = snap.data();

      // ── Single active session enforcement (RTDB presence-based) ──
      // Sa halip na Firestore lastActiveAt (yung old heartbeat/staleness
      // heuristic), titingnan na natin diretso yung status/{uid} node sa
      // Realtime Database — updated in real-time ng onDisconnect() sa
      // user_context.jsx. Kung "online" pa ang huling naitalang state,
      // may aktibong gamit na ito sa ibang device/tab — i-block ang bagong
      // pag-login. Walang staleness guessing kasi tumpak na mismo ang
      // onDisconnect() sa pag-set ng "offline" kapag talagang nawala na
      // yung koneksyon (browser close, network drop, atbp).
      const statusSnap = await get(ref(rtdb, `status/${uid}`));
      const rtdbStatus = statusSnap.exists() ? statusSnap.val() : null;
      const lastChangedMs = rtdbStatus?.lastChanged || 0;
      const isCeilingExceeded = Date.now() - lastChangedMs > SESSION_ONLINE_CEILING_MS;
      if (rtdbStatus?.state === 'online' && !isCeilingExceeded) {
        await auth.signOut();
        setError('Someone else is currently using this account. Please try again later.');
        setLoading(false);
        return;
      }

      // Walang gamit ang account ngayon — i-claim natin ito bilang bagong
      // active session. Naka-store ang sessionId sa sessionStorage
      // (tab-scoped) para malinis lang ito ng Logout button ng session na
      // talagang gumawa nito.
      const sessionId = crypto.randomUUID();
      await setDoc(doc(db, 'faculty', uid), {
        activeSessionId: sessionId,
      }, { merge: true });
      sessionStorage.setItem('itfun_sessionId', sessionId);

      // Ngayon lang, matapos ma-pass ang session-lock check at ma-claim na
      // ang session, papayagan na nating sumulat ng "online" ang presence
      // effect sa user_context.jsx. Kung dito ito tatawagin nang mas maaga
      // (o kung hindi natin ito hihintayin), posibleng ma-block ang sarili
      // nating login dahil sa write na tayo mismo ang gumawa.
      confirmSession();

      setUser({ uid, firstName: data.firstName, lastName: data.lastName, email: data.email, role: 'faculty' });
      navigate('/faculty-modules');
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

  const handleSignUp = async () => {
    setSignupTouched({ firstName: true, lastName: true, email: true, password: true, confirmPassword: true });
    setError('');
    if (!firstName || !lastName || !signupEmail || !signupPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (!passwordValid) {
      setError('Password does not meet all requirements.');
      return;
    }
    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
      const uid = userCredential.user.uid;
      await setDoc(doc(db, 'faculty', uid), {
        uid, firstName, lastName, email: signupEmail,
        role: 'faculty', createdAt: new Date().toISOString(),
      });
      await auth.signOut();
      await sendSignupOtp(signupEmail);
      setOtpCode('');
      setOtpTouched(false);
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

  // Calls the backend to generate a fresh 6-digit code and email it via
  // Brevo. Reused by both the initial signup and the "Resend" link.
  const sendSignupOtp = async (email) => {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/send-signup-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to send verification code.');
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      await sendSignupOtp(signupEmail);
      setOtpCode('');
      alert('A new code was sent! Check your inbox.');
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    setOtpTouched(true);
    setError('');
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/verify-signup-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signupEmail, otp: otpCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Verification failed.');
      }
      setScreen('login');
      setLoginEmail(signupEmail);
      setLoginPassword('');
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    setResetTouched(true);
    setError('');
    if (!resetEmail) {
      setError('Please enter your email.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send reset email.');
      }
      setResetSent(true);
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="login-wrapper">
      <motion.div
        className="panel"
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 22 }}
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
              A 6-digit verification code was sent to<br />
              <strong style={{ color: '#c8102e' }}>{signupEmail}</strong>
            </p>
            <p style={{ fontSize: '13px', color: '#777', fontFamily: 'Arial, sans-serif', textAlign: 'center', margin: '0' }}>
              Enter the code below to verify your account.
            </p>
            {error && <p style={{ color: '#c8102e', fontSize: '13px', fontFamily: 'Arial, sans-serif', margin: '0', textAlign: 'center' }}>{error}</p>}

            <div className="input-group" style={{ width: '100%' }}>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="input"
                placeholder="000000"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onBlur={() => setOtpTouched(true)}
                onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                style={{
                  textAlign: 'center', fontSize: '24px', letterSpacing: '8px', fontWeight: 'bold',
                  borderColor: otpTouched && !otpCode ? '#c8102e' : undefined,
                }}
              />
            </div>

            <button className="submit-btn" onClick={handleVerifyOtp} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            <p style={{ fontSize: '13px', color: '#555', fontFamily: 'Arial, sans-serif', margin: '0' }}>
              Didn't receive it?{' '}
              <span onClick={handleResendOtp} style={{ color: '#c8102e', cursor: 'pointer', fontWeight: 'bold' }}>
                {loading ? 'Sending...' : 'Resend'}
              </span>
            </p>
          </motion.div>
        )}

        {/* ── FORGOT PASSWORD SCREEN ── */}
        {screen === 'forgot' && (
          <motion.div
            key="forgot"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}
          >
            {!resetSent ? (
              <>
                <h1 className="form-title">Reset Password</h1>
                <p style={{ fontSize: '13px', color: '#777', fontFamily: 'Arial, sans-serif', textAlign: 'center', margin: '0' }}>
                  Enter the email linked to your account and we'll send you a link to reset your password.
                </p>
                {error && <p style={{ color: '#c8102e', fontSize: '13px', fontFamily: 'Arial, sans-serif', margin: '0', textAlign: 'center' }}>{error}</p>}

                <div className="input-group">
                  <RequiredLabel label="Email" touched={resetTouched} value={resetEmail} />
                  <input
                    type="email" className="input" placeholder="example@gmail.com"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    onBlur={() => setResetTouched(true)}
                    onKeyDown={e => e.key === 'Enter' && handleForgotPassword()}
                    style={{ borderColor: resetTouched && !resetEmail ? '#c8102e' : undefined }}
                  />
                </div>

                <button className="submit-btn" onClick={handleForgotPassword} disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button className="go-back-btn" onClick={() => { setScreen('login'); setError(''); }}>Back to Login</button>
              </>
            ) : (
              <>
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
                  If an account exists for<br />
                  <strong style={{ color: '#c8102e' }}>{resetEmail}</strong>, a password reset link has been sent.
                </p>
                <p style={{ fontSize: '13px', color: '#777', fontFamily: 'Arial, sans-serif', textAlign: 'center', margin: '0' }}>
                  Click the link in the email to set a new password, then come back to log in.
                </p>
                <button className="submit-btn" onClick={() => { setScreen('login'); setError(''); }}>
                  Go to Login
                </button>
                <p className="toggle-text">
                  Didn't receive it?{' '}
                  <span onClick={handleForgotPassword} style={{ color: '#c8102e', cursor: 'pointer', fontWeight: 'bold' }}>
                    {loading ? 'Sending...' : 'Resend'}
                  </span>
                </p>
              </>
            )}
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
            <h1 className="form-title">Login as Faculty</h1>
            {error && <p style={{ color: '#c8102e', fontSize: '13px', fontFamily: 'Arial, sans-serif', margin: '0', textAlign: 'center' }}>{error}</p>}

            <div className="input-group">
              <RequiredLabel label="Email" touched={loginTouched.email} value={loginEmail} />
              <input
                type="email" className="input" placeholder="example@gmail.com"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                onBlur={() => setLoginTouched(t => ({ ...t, email: true }))}
                style={{ borderColor: loginTouched.email && !loginEmail ? '#c8102e' : undefined }}
              />
            </div>
            <div className="input-group">
              <RequiredLabel label="Password" touched={loginTouched.password} value={loginPassword} />
              <PasswordInput
                className="input"
                placeholder="••••••••"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <p
              className="forgot"
              onClick={() => {
                setError('');
                setResetEmail(loginEmail);
                setResetSent(false);
                setResetTouched(false);
                setScreen('forgot');
              }}
            >
              Forgot password?
            </p>
            <button className="submit-btn" onClick={handleLogin} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <p className="toggle-text">
              Don't have an account?{' '}
              <span onClick={() => { setScreen('signup'); setError(''); }}>Sign Up</span>
            </p>
            <button className="go-back-btn" onClick={() => navigate('/')}>Go back</button>
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
            <h1 className="form-title">Sign Up as Faculty</h1>
            {error && <p style={{ color: '#c8102e', fontSize: '13px', fontFamily: 'Arial, sans-serif', margin: '0', textAlign: 'center' }}>{error}</p>}

            <div className="name-row">
              <div className="input-group" style={{ flex: 1 }}>
                <RequiredLabel label="First Name" touched={signupTouched.firstName} value={firstName} />
                <input
                  type="text" className="input small" placeholder="Maria"
                  value={firstName}
                  onChange={e => setFirstName(toPascalCase(e.target.value))}
                  onBlur={() => setSignupTouched(t => ({ ...t, firstName: true }))}
                  style={{ borderColor: signupTouched.firstName && !firstName ? '#c8102e' : undefined }}
                />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <RequiredLabel label="Last Name" touched={signupTouched.lastName} value={lastName} />
                <input
                  type="text" className="input small" placeholder="Santos"
                  value={lastName}
                  onChange={e => setLastName(toPascalCase(e.target.value))}
                  onBlur={() => setSignupTouched(t => ({ ...t, lastName: true }))}
                  style={{ borderColor: signupTouched.lastName && !lastName ? '#c8102e' : undefined }}
                />
              </div>
            </div>

            <div className="input-group">
              <RequiredLabel label="Email" touched={signupTouched.email} value={signupEmail} />
              <input
                type="email" className="input" placeholder="example@gmail.com"
                value={signupEmail}
                onChange={e => setSignupEmail(e.target.value)}
                onBlur={() => setSignupTouched(t => ({ ...t, email: true }))}
                style={{ borderColor: signupTouched.email && !signupEmail ? '#c8102e' : undefined }}
              />
            </div>

            <div className="name-row">
              <div className="input-group">
                <RequiredLabel label="Password" touched={signupTouched.password} value={signupPassword} />
                <PasswordInput
                  className="input small"
                  placeholder="••••••••"
                  value={signupPassword}
                  onChange={e => {
                    setSignupPassword(e.target.value);
                    setSignupTouched(t => ({ ...t, password: true }));
                  }}
                />
              </div>
              <div className="input-group">
                <RequiredLabel label="Confirm Password" touched={signupTouched.confirmPassword} value={confirmPassword} />
                <PasswordInput
                  className="input small"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value);
                    setSignupTouched(t => ({ ...t, confirmPassword: true }));
                  }}
                />
              </div>
            </div>

            {/* confirm password mismatch hint */}
            {signupTouched.confirmPassword && confirmPassword && signupPassword !== confirmPassword && (
              <p style={{ color: '#c8102e', fontSize: '12px', fontFamily: 'Arial, sans-serif', margin: '-8px 0 0', alignSelf: 'flex-start' }}>
                ✗ Passwords do not match
              </p>
            )}
            {signupTouched.confirmPassword && confirmPassword && signupPassword === confirmPassword && (
              <p style={{ color: '#2e7d32', fontSize: '12px', fontFamily: 'Arial, sans-serif', margin: '-8px 0 0', alignSelf: 'flex-start' }}>
                ✓ Passwords match
              </p>
            )}

            {/* live password checklist */}
            <PasswordChecklist password={signupPassword} />

            <button className="submit-btn" onClick={handleSignUp} disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
            <p className="toggle-text">
              Already have an account?{' '}
              <span onClick={() => { setScreen('login'); setError(''); }}>Login</span>
            </p>
            <button className="go-back-btn" onClick={() => navigate('/')}>Go back</button>
          </motion.div>
        )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default FacultyLogin;