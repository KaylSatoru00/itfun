import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import {
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useUser } from '../user_context';
import AuthShell from './auth_shell.jsx';
import itfunLogo from '../assets/LOGO_NAMEN.png';
import {
  toPascalCase, passwordRules, PasswordChecklist,
  RequiredLabel, PasswordInput, screenVariants, isGmailAddress, maskEmail,
} from './auth_form_kit.jsx';

// ── "VERIFIED" success overlay ──
// Lalabas 'to kapag tama ang OTP: dim ang buong screen, may card na
// "VERIFIED" at may check na kusang iginuguhit. Naka-portal sa document.body
// para (1) sakop ang buong page kasama yung kaliwang panel ng AuthShell, at
// (2) hindi maapektuhan ng transform ng .af-card (kapag may transform ang
// parent, hindi na sa viewport naka-"fixed" ang child).
const VERIFIED_RED = '#c8102e';

function VerifiedOverlay({ show }) {
  const reduce = useReducedMotion();

  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          key="verified-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(20, 16, 18, 0.5)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
          }}
        >
          <motion.div
            role="status"
            aria-live="polite"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 18,
              padding: '26px 44px 34px',
              background: '#eeece6',
              borderRadius: 22,
              boxShadow: '0 18px 50px rgba(0, 0, 0, 0.28)',
            }}
          >
            <motion.h2
              initial={reduce ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              style={{
                margin: 0,
                color: VERIFIED_RED,
                fontSize: '1.75rem',
                fontWeight: 700,
                letterSpacing: '0.02em',
                lineHeight: 1,
              }}
            >
              VERIFIED
            </motion.h2>

            {/* Maliit na "pop" ng buong icon pagkatapos maiguhit ang check */}
            <motion.svg
              viewBox="0 0 100 100"
              width="112"
              height="112"
              aria-hidden="true"
              animate={reduce ? undefined : { scale: [1, 1.1, 1] }}
              transition={{ delay: 1.15, duration: 0.35, ease: 'easeInOut' }}
            >
              {/* Bilog — naka-rotate ng -90° para sa itaas nagsisimula ang guhit */}
              <g transform="rotate(-90 50 50)">
                <motion.circle
                  cx="50"
                  cy="50"
                  r="48"
                  fill="none"
                  stroke={VERIFIED_RED}
                  strokeWidth="1.5"
                  initial={reduce ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.25, duration: 0.5, ease: 'easeOut' }}
                />
              </g>
              {/* Check mark */}
              <motion.path
                d="M31 52 L44 65 L70 36"
                fill="none"
                stroke={VERIFIED_RED}
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={reduce ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.7, duration: 0.4, ease: 'easeOut' }}
              />
            </motion.svg>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ── Refresh-proof na screen state ──
// Naka-sessionStorage (tab-scoped) ang huling screen at ang mga hindi-sensitibong
// field, para hindi na bumalik sa login ang F5 / hard refresh. HINDI sine-save
// ang password. Nabubura ito kapag umalis na sa page (unmount) o nagsara ang tab.
const AUTH_FLOW_KEY = 'itfun_faculty_auth_flow';
const AUTH_SCREENS = ['login', 'signup', 'verify', 'forgot'];

function readSavedAuthFlow() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(AUTH_FLOW_KEY));
    if (!saved || !AUTH_SCREENS.includes(saved.screen)) return null;
    // Walang email = wala nang ve-verify, kaya sa signup na lang ibabalik.
    if (saved.screen === 'verify' && !saved.signupEmail) return { ...saved, screen: 'signup' };
    return saved;
  } catch {
    return null;
  }
}

function FacultyLogin() {
  // Ibinabalik ang huling screen (login / signup / verify / forgot) matapos ang refresh.
  const [saved] = useState(readSavedAuthFlow);
  const [screen, setScreen] = useState(saved?.screen ?? 'login');
  const navigate = useNavigate();
  const { setUser, confirmSession, beginLogin, endLogin } = useUser();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [firstName, setFirstName] = useState(saved?.firstName ?? '');
  const [lastName, setLastName] = useState(saved?.lastName ?? '');
  const [signupEmail, setSignupEmail] = useState(saved?.signupEmail ?? '');
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
  // true habang ipinapakita ang "VERIFIED" animation matapos ang tamang OTP
  const [verified, setVerified] = useState(false);

  // Kapag tama ang OTP: ipakita muna ang VERIFIED animation (~2.2s), saka
  // pa lang ibalik sa login screen. Naka-cleanup para hindi mag-fire ang
  // timer kung na-unmount na ang component.
  useEffect(() => {
    if (!verified) return;
    const timer = setTimeout(() => {
      setVerified(false);
      setScreen('login');
    }, 2200);
    return () => clearTimeout(timer);
  }, [verified]);

  // forgot password state
  const [resetEmail, setResetEmail] = useState(saved?.resetEmail ?? '');
  const [resetTouched, setResetTouched] = useState(false);
  const [resetSent, setResetSent] = useState(saved?.resetSent ?? false);

  // I-save ang kasalukuyang screen at mga field sa bawat pagbabago. Kapag
  // kaka-verify lang (VERIFIED animation pa ang ipinapakita), 'login' na ang
  // isasave para hindi bumalik sa lumang OTP form kung mag-refresh sa gitna.
  useEffect(() => {
    try {
      sessionStorage.setItem(AUTH_FLOW_KEY, JSON.stringify({
        screen: verified ? 'login' : screen,
        signupEmail, firstName, lastName, resetEmail, resetSent,
      }));
    } catch {
      // best-effort lang — kung bawal o puno ang storage, hindi dapat mag-crash ang form
    }
  }, [screen, verified, signupEmail, firstName, lastName, resetEmail, resetSent]);

  // Ang refresh ay hindi nagpapatakbo ng cleanup, pero ang pag-alis sa page
  // (Go back, Login success, ibang route) ay oo — dito nabubura ang saved state
  // para sa susunod na bisita ay sa login screen ulit magsisimula.
  useEffect(() => () => {
    try { sessionStorage.removeItem(AUTH_FLOW_KEY); } catch { /* ignore */ }
  }, []);

  const passwordValid = passwordRules.every(r => r.test(signupPassword));

  const handleLogin = async () => {
    setLoginTouched({ email: true, password: true });
    setError('');
    if (!loginEmail || !loginPassword) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    // I-arm muna ang flag na 'to bago simulan ang fresh login flow — para
    // hindi makipag-race ang onAuthStateChanged restore path sa
    // user_context.jsx (parehong pattern sa student_login.jsx).
    beginLogin();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      const uid = userCredential.user.uid;
      if (!userCredential.user.emailVerified) {
        await auth.signOut();
        setError('Please verify your email first. Check your inbox.');
        setLoading(false);
        return;
      }
      // Require a real faculty account: the doc must exist AND carry
      // role: 'faculty'. A student who reached a faculty page can leave a
      // stray faculty/{uid} doc (an activeSessionId merge-write with no
      // role) — checking the role field rejects those instead of letting a
      // student in through the faculty portal.
      const snap = await getDoc(doc(db, 'faculty', uid));
      if (!snap.exists() || snap.data().role !== 'faculty') {
        await auth.signOut();
        setError('No faculty account found. Are you a student?');
        setLoading(false);
        return;
      }
      const data = snap.data();

      // ── Single active session enforcement (instant takeover) ──
      // Hindi na tayo nagba-block/naghihintay dito. Sa sandaling
      // magtagumpay ang login na ito, direkta na nating i-o-overwrite ang
      // `activeSessionId` sa Firestore — kahit "online" pa mismo ang ibang
      // device/tab na kasalukuyang gumagamit ng account na ito. Ang
      // real-time na "kicked out" listener sa user_context.jsx (naka-
      // onSnapshot sa `activeSessionId` field) ang bahalang mag-react
      // agad-agad sa panig ng LUMANG tab/device sa sandaling makita nitong
      // nagbago na ang halaga — awtomatiko itong ma-lo-logout, walang
      // 90-second na hinihintay pa. Naka-store ang sessionId sa
      // sessionStorage (tab-scoped) para malinis lang ito ng Logout button
      // ng session na talagang gumawa nito.
      const sessionId = crypto.randomUUID();
      await setDoc(doc(db, 'faculty', uid), {
        activeSessionId: sessionId,
      }, { merge: true });
      sessionStorage.setItem('itfun_sessionId', sessionId);

      // Ngayon lang, matapos ma-claim ang session, papayagan na nating
      // sumulat ng "online" ang presence effect sa user_context.jsx.
      confirmSession();

      const userData = {
        uid,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: 'faculty',
        lastNameChangeAt: data.lastNameChangeAt,
      };
      setUser(userData);
      // KRITIKAL: i-set din agad ang optimistic user dito (hindi lang umasa
      // sa async onAuthStateChanged restore path sa user_context.jsx) — kasi
      // naka-skip yun habang naka-loginInProgressRef, at hindi na ito
      // maa-abutan ulit hangga't walang bagong auth state transition. Dapat
      // `sessionStorage` ito (HINDI localStorage) — iyon ang eksaktong key na
      // binabasa ng user_context.jsx optimistic restore; kung localStorage,
      // hindi ito nakikita sa refresh kaya babalik sa /faculty-login.
      sessionStorage.setItem('user', JSON.stringify(userData));
      navigate('/faculty-modules', { replace: true });
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
    } finally {
      // Kahit anong exit path (success, early return, o error) —
      // i-disarm natin ulit ang flag, para makapagpatuloy nang normal
      // ang restore path sa susunod na auth state change.
      endLogin();
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
    if (!isGmailAddress(signupEmail)) {
      setError('Only @gmail.com email addresses are allowed.');
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
      // No account is created yet. The backend emails a 6-digit code and
      // holds the pending signup for 10 minutes; the account is only created
      // once the code from the real inbox is verified. A non-existent Gmail
      // never receives the code, so it can never register.
      await sendSignupOtp();
      setOtpCode('');
      setOtpTouched(false);
      setScreen('verify');
    } catch (err) {
      setError(err.message || 'Failed to start signup. Please try again.');
    }
    setLoading(false);
  };

  // Asks the backend to generate a fresh 6-digit code, stash the pending
  // signup, and email the code via Brevo. Reused by the initial signup and
  // the "Resend" link. The account itself is created later, on OTP verify.
  const sendSignupOtp = async () => {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/send-signup-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: signupEmail.trim(),
        password: signupPassword,
        firstName, lastName,
        role: 'faculty',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to send verification code.');
    }
  };

  const handleResendOtp = async () => {
    // Hindi sine-save sa storage ang password, kaya pagkatapos ng refresh wala na
    // ito sa memory at hindi makakapag-request ng bagong code. Ibalik sa signup
    // (nakapuno pa ang name at email) para ma-re-enter lang ang password.
    if (!signupPassword) {
      setScreen('signup');
      setError("For your security, we don't keep passwords after a refresh. Re-enter your password to get a new code.");
      return;
    }
    setError('');
    setLoading(true);
    try {
      await sendSignupOtp();
      setOtpCode('');
      alert('A new code was sent! Check your inbox.');
    } catch (err) {
      setError(err.message || 'Failed to resend code. Please try again.');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    // Iwas double-submit (hal. Enter key) habang naka-display ang VERIFIED.
    if (verified) return;
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
      // Ihanda na agad ang login fields; ang pag-lipat sa login screen ay
      // gagawin ng useEffect sa itaas pagkatapos ng VERIFIED animation.
      setLoginEmail(signupEmail);
      setLoginPassword('');
      setVerified(true);
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
    <AuthShell>
      <motion.div
        className="af-card itfun-form"
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
      >
        <AnimatePresence mode="wait">

        {/* ── VERIFY SCREEN ── */}
        {screen === 'verify' && (
          <motion.div
            key="verify"
            variants={screenVariants}
            initial="initial" animate="animate" exit="exit"
            className="d-flex flex-column gap-3 w-100"
          >
            <motion.div
              className="af-mail-bubble"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
            >
              📧
            </motion.div>
            <h1 className="af-title" style={{ color: '#c8102e' }}>Check Your Email</h1>
            <p className="af-note">
              A 6-digit verification code was sent to<br />
              <strong>{maskEmail(signupEmail)}</strong>
            </p>
            <p className="af-note af-note-muted">
              Enter the code below to verify your account.
            </p>
            {error && <div className="alert alert-danger py-2 small mb-0 text-center">{error}</div>}

            <div className="af-field">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className={`form-control form-control-lg af-otp-input ${otpTouched && !otpCode ? 'is-invalid' : ''}`}
                placeholder="000000"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onBlur={() => setOtpTouched(true)}
                onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
              />
            </div>

            <button className="btn btn-itfun w-100 py-2" onClick={handleVerifyOtp} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            <p className="af-toggle-text">
              Didn't receive it?{' '}
              <span onClick={handleResendOtp}>
                {loading ? 'Sending...' : 'Resend'}
              </span>
            </p>
          </motion.div>
        )}

        {/* ── FORGOT PASSWORD SCREEN ── */}
        {screen === 'forgot' && (
          <motion.div
            key="forgot"
            variants={screenVariants}
            initial="initial" animate="animate" exit="exit"
            className="d-flex flex-column gap-3 w-100"
          >
            {!resetSent ? (
              <>
                <h1 className="af-title">Reset Password</h1>
                <p className="af-note af-note-muted">
                  Enter the email linked to your account and we'll send you a link to reset your password.
                </p>
                {error && <div className="alert alert-danger py-2 small mb-0 text-center">{error}</div>}

                <div className="af-field">
                  <RequiredLabel label="Email" touched={resetTouched} value={resetEmail} />
                  <input
                    type="email"
                    className={`form-control ${resetTouched && !resetEmail ? 'is-invalid' : ''}`}
                    placeholder="example@gmail.com"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    onBlur={() => setResetTouched(true)}
                    onKeyDown={e => e.key === 'Enter' && handleForgotPassword()}
                  />
                </div>

                <button className="btn btn-itfun w-100 py-2" onClick={handleForgotPassword} disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button className="af-back-btn" onClick={() => { setScreen('login'); setError(''); }}>Back to Login</button>
              </>
            ) : (
              <>
                <motion.div
                  className="af-mail-bubble"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                >
                  📧
                </motion.div>
                <h1 className="af-title" style={{ color: '#c8102e' }}>Check Your Email</h1>
                <p className="af-note">
                  If an account exists for<br />
                  <strong>{maskEmail(resetEmail)}</strong>, a password reset link has been sent.
                </p>
                <p className="af-note af-note-muted">
                  Click the link in the email to set a new password, then come back to log in.
                </p>
                <button className="btn btn-itfun w-100 py-2" onClick={() => { setScreen('login'); setError(''); }}>
                  Go to Login
                </button>
                <p className="af-toggle-text">
                  Didn't receive it?{' '}
                  <span onClick={handleForgotPassword}>
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
            variants={screenVariants}
            initial="initial" animate="animate" exit="exit"
            className="d-flex flex-column gap-3 w-100"
          >
            <img className="af-login-logo" src={itfunLogo} alt="ITFun" />
            <h1 className="af-title">Faculty Login</h1>
            <p className="af-sub">Log in to access and manage your classes</p>
            {error && <div className="alert alert-danger py-2 small mb-0 text-center">{error}</div>}

            <div className="af-field">
              <RequiredLabel label="Email" touched={loginTouched.email} value={loginEmail} />
              <input
                type="email"
                className={`form-control ${loginTouched.email && !loginEmail ? 'is-invalid' : ''}`}
                placeholder="example@gmail.com"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                onBlur={() => setLoginTouched(t => ({ ...t, email: true }))}
              />
            </div>
            <div className="af-field d-flex flex-column">
              <RequiredLabel label="Password" touched={loginTouched.password} value={loginPassword} />
              <PasswordInput
                placeholder="••••••••"
                value={loginPassword}
                invalid={loginTouched.password && !loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <p
              className="af-forgot"
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
            <button className="btn btn-itfun w-100 py-2" onClick={handleLogin} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <p className="af-toggle-text">
              Don't have an account?{' '}
              <span onClick={() => { setScreen('signup'); setError(''); }}>Sign Up</span>
            </p>
            <button className="af-back-btn" onClick={() => navigate('/')}>Go back</button>
          </motion.div>
        )}

        {/* ── SIGN UP SCREEN ── */}
        {screen === 'signup' && (
          <motion.div
            key="signup"
            variants={screenVariants}
            initial="initial" animate="animate" exit="exit"
            className="af-signup d-flex flex-column gap-3 w-100"
          >
            <div className="af-signup-head">
              <img className="af-signup-logo" src={itfunLogo} alt="ITFun" />
              <h1 className="af-signup-title">Faculty Registration</h1>
              <p className="af-signup-sub">Please complete the fields below to create your account.</p>
            </div>
            <div className="af-signup-rule" />
            {error && <div className="alert alert-danger py-2 small mb-0 text-center">{error}</div>}

            <p className="af-sec">Personal information</p>
            <div className="row g-2">
              <div className="col-sm-6 af-field">
                <RequiredLabel label="First Name" touched={signupTouched.firstName} value={firstName} />
                <input
                  type="text"
                  className={`form-control ${signupTouched.firstName && !firstName ? 'is-invalid' : ''}`}
                  placeholder="Maria"
                  value={firstName}
                  maxLength={20}
                  onChange={e => setFirstName(toPascalCase(e.target.value))}
                  onBlur={() => setSignupTouched(t => ({ ...t, firstName: true }))}
                />
              </div>
              <div className="col-sm-6 af-field">
                <RequiredLabel label="Last Name" touched={signupTouched.lastName} value={lastName} />
                <input
                  type="text"
                  className={`form-control ${signupTouched.lastName && !lastName ? 'is-invalid' : ''}`}
                  placeholder="Santos"
                  value={lastName}
                  maxLength={20}
                  onChange={e => setLastName(toPascalCase(e.target.value))}
                  onBlur={() => setSignupTouched(t => ({ ...t, lastName: true }))}
                />
              </div>
            </div>

            <div className="af-field">
              <RequiredLabel label="Email" touched={signupTouched.email} value={signupEmail} />
              <input
                type="email"
                className={`form-control ${signupTouched.email && (!signupEmail || !isGmailAddress(signupEmail)) ? 'is-invalid' : ''}`}
                placeholder="example@gmail.com"
                value={signupEmail}
                onChange={e => setSignupEmail(e.target.value)}
                onBlur={() => setSignupTouched(t => ({ ...t, email: true }))}
              />
              {signupTouched.email && signupEmail && !isGmailAddress(signupEmail) && (
                <p className="af-field-hint">Only <strong>@gmail.com</strong> addresses are allowed.</p>
              )}
            </div>

            <div className="af-signup-divider" />
            <p className="af-sec">Account security</p>
            <div className="row g-2">
              <div className="col-sm-6 af-field d-flex flex-column">
                <RequiredLabel label="Password" touched={signupTouched.password} value={signupPassword} />
                <PasswordInput
                  placeholder="••••••••"
                  value={signupPassword}
                  invalid={signupTouched.password && !signupPassword}
                  maxLength={16}
                  onChange={e => {
                    setSignupPassword(e.target.value);
                    setSignupTouched(t => ({ ...t, password: true }));
                  }}
                />
              </div>
              <div className="col-sm-6 af-field d-flex flex-column">
                <RequiredLabel label="Confirm Password" touched={signupTouched.confirmPassword} value={confirmPassword} />
                <PasswordInput
                  placeholder="••••••••"
                  value={confirmPassword}
                  invalid={signupTouched.confirmPassword && !confirmPassword}
                  maxLength={16}
                  onChange={e => {
                    setConfirmPassword(e.target.value);
                    setSignupTouched(t => ({ ...t, confirmPassword: true }));
                  }}
                />
              </div>
            </div>

            {/* confirm password mismatch hint */}
            {signupTouched.confirmPassword && confirmPassword && signupPassword !== confirmPassword && (
              <p className="af-hint bad">✗ Passwords do not match</p>
            )}
            {signupTouched.confirmPassword && confirmPassword && signupPassword === confirmPassword && (
              <p className="af-hint ok">✓ Passwords match</p>
            )}

            {/* live password checklist */}
            <PasswordChecklist password={signupPassword} />

            <button className="btn af-signup-btn w-100" onClick={handleSignUp} disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
            <p className="af-toggle-text">
              Already have an account?{' '}
              <span onClick={() => { setScreen('login'); setError(''); }}>Login</span>
            </p>
            <button className="af-back-btn" onClick={() => navigate('/')}>Go back</button>
          </motion.div>
        )}

        </AnimatePresence>

        {/* Naka-portal ito sa document.body, kaya kahit nasa loob ng card ang pwesto sa JSX, buong screen ang sakop */}
        <VerifiedOverlay show={verified} />
      </motion.div>
    </AuthShell>
  );
}

export default FacultyLogin;