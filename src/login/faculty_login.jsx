import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useUser } from '../user_context';
import AuthShell from './auth_shell.jsx';
import {
  toPascalCase, passwordRules, PasswordChecklist,
  RequiredLabel, PasswordInput, screenVariants,
} from './auth_form_kit.jsx';

function FacultyLogin() {
  const [screen, setScreen] = useState('login');
  const navigate = useNavigate();
  const { setUser, confirmSession, beginLogin, endLogin } = useUser();

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

      const userData = { uid, firstName: data.firstName, lastName: data.lastName, email: data.email, role: 'faculty' };
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
              <strong>{signupEmail}</strong>
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
                  <strong>{resetEmail}</strong>, a password reset link has been sent.
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
            <h1 className="af-title">Faculty Login</h1>
            <p className="af-sub">Log in to manage your classes</p>
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
            className="d-flex flex-column gap-3 w-100"
          >
            <h1 className="af-title">Sign Up as Faculty</h1>
            <p className="af-sub">Create your account to manage classes</p>
            {error && <div className="alert alert-danger py-2 small mb-0 text-center">{error}</div>}

            <p className="af-section-heading">Personal information</p>
            <div className="row g-2">
              <div className="col-sm-6 af-field">
                <RequiredLabel label="First Name" touched={signupTouched.firstName} value={firstName} />
                <input
                  type="text"
                  className={`form-control ${signupTouched.firstName && !firstName ? 'is-invalid' : ''}`}
                  placeholder="Maria"
                  value={firstName}
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
                  onChange={e => setLastName(toPascalCase(e.target.value))}
                  onBlur={() => setSignupTouched(t => ({ ...t, lastName: true }))}
                />
              </div>
            </div>

            <div className="af-field">
              <RequiredLabel label="Email" touched={signupTouched.email} value={signupEmail} />
              <input
                type="email"
                className={`form-control ${signupTouched.email && !signupEmail ? 'is-invalid' : ''}`}
                placeholder="example@gmail.com"
                value={signupEmail}
                onChange={e => setSignupEmail(e.target.value)}
                onBlur={() => setSignupTouched(t => ({ ...t, email: true }))}
              />
            </div>

            <p className="af-section-heading">Create password</p>
            <div className="row g-2">
              <div className="col-sm-6 af-field d-flex flex-column">
                <RequiredLabel label="Password" touched={signupTouched.password} value={signupPassword} />
                <PasswordInput
                  placeholder="••••••••"
                  value={signupPassword}
                  invalid={signupTouched.password && !signupPassword}
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

            <button className="btn btn-itfun w-100 py-2" onClick={handleSignUp} disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
            <p className="af-toggle-text">
              Already have an account?{' '}
              <span onClick={() => { setScreen('login'); setError(''); }}>Login</span>
            </p>
            <button className="af-back-btn" onClick={() => navigate('/')}>Go back</button>
          </motion.div>
        )}

        </AnimatePresence>
      </motion.div>
    </AuthShell>
  );
}

export default FacultyLogin;