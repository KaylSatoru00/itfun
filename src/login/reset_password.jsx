import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { auth } from '../firebase';
import {
  verifyPasswordResetCode,
  confirmPasswordReset,
} from 'firebase/auth';

const passwordRules = [
  { id: 'length',  label: 'At least 8 characters',                       test: p => p.length >= 8 },
  { id: 'upper',   label: 'At least one uppercase letter (A–Z)',         test: p => /[A-Z]/.test(p) },
  { id: 'lower',   label: 'At least one lowercase letter (a–z)',         test: p => /[a-z]/.test(p) },
  { id: 'number',  label: 'At least one number (0–9)',                   test: p => /[0-9]/.test(p) },
  { id: 'special', label: 'At least one special character (!@#$%&*_…)',  test: p => /[!@#$%^&*_\-+=?]/.test(p) },
  { id: 'nospace', label: 'No spaces',                                    test: p => !/\s/.test(p) && p.length > 0 },
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

function PasswordInput({ value, onChange, placeholder, onKeyDown }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type={show ? 'text' : 'password'}
        className="input"
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

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get('oobCode');

  // 'checking' | 'invalid' | 'form' | 'success'
  const [stage, setStage] = useState('checking');
  const [email, setEmail] = useState('');
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
      .then(verifiedEmail => {
        setEmail(verifiedEmail);
        setStage('form');
      })
      .catch(() => {
        setStage('invalid');
      });
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
    <div className="login-wrapper">
      <style>{`
        .login-wrapper {
          position: fixed;
          inset: 0;
          overflow-y: auto;
          display: grid;
          place-items: center;
          padding: 40px 16px;
          box-sizing: border-box;
          background-color: #ececec;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 1440 900' preserveAspectRatio='xMidYMid slice'%3E%3Crect width='1440' height='900' fill='%23ececec'/%3E%3Cpolygon points='350,0 1440,0 1440,900 700,900' fill='%23f5f5f5'/%3E%3Cpolygon points='450,0 1440,0 1440,900 800,900' fill='%23fafafa'/%3E%3Cpolygon points='580,0 1440,0 1440,900 930,900' fill='%23f2f2f2'/%3E%3Cpolygon points='700,0 1440,0 1440,900 1050,900' fill='%23f8f8f8'/%3E%3Cpolygon points='850,0 1440,0 1440,900 1200,900' fill='%23efefef'/%3E%3Cpolygon points='0,0 220,0 100,900 0,900' fill='%23f5f5f5'/%3E%3Cpolygon points='0,0 160,0 50,900 0,900' fill='%23fafafa'/%3E%3Cpolygon points='345,0 380,0 255,900 220,900' fill='%23ffffff'/%3E%3Cpolygon points='445,0 462,0 340,900 322,900' fill='%23ffffff'/%3E%3Cpolygon points='575,0 588,0 463,900 450,900' fill='%23ffffff'/%3E%3Cpolygon points='695,0 705,0 583,900 573,900' fill='%23ffffff'/%3E%3Cpolygon points='155,0 220,0 95,900 30,900' fill='%23c8102e'/%3E%3Cpolygon points='170,0 200,0 68,900 42,900' fill='%23a00d24'/%3E%3Cpolygon points='0,400 60,400 310,900 250,900' fill='%23c8102e'/%3E%3Cpolygon points='0,420 35,420 275,900 240,900' fill='%23a00d24'/%3E%3C%2Fsvg%3E");
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
        .panel {
          width: min(800px, 92vw);
          background: #fff;
          border-radius: 20px;
          margin: auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px;
          gap: 14px;
          box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.3);
          box-sizing: border-box;
        }
        .form-title {
          font-size: 28px;
          font-weight: bold;
          color: #000;
          font-family: Arial, sans-serif;
          margin: 0;
          text-align: center;
        }
        .input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #ccc;
          border-radius: 10px;
          font-size: 14px;
          font-family: Arial, sans-serif;
          outline: none;
          box-sizing: border-box;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          width: 100%;
          margin-bottom: 10px;
          gap: 4px;
        }
        .submit-btn {
          width: 100%;
          padding: 12px;
          background: #c8102e;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-family: Arial, sans-serif;
          cursor: pointer;
        }
        .go-back-btn {
          margin-top: 4px;
          background: none;
          border: none;
          color: #aaa;
          font-size: 13px;
          font-family: Arial, sans-serif;
          cursor: pointer;
          text-decoration: underline;
        }
        .go-back-btn:hover {
          color: #c8102e;
        }
        @media (max-width: 600px) {
          .panel {
            padding: 28px 20px;
            border-radius: 14px;
            margin: 20px auto;
          }
          .form-title {
            font-size: 22px;
          }
        }
        @media (max-width: 400px) {
          .panel {
            padding: 24px 16px;
            border-radius: 12px;
            margin: 12px auto;
          }
        }
      `}</style>
      <motion.div
        className="panel"
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 22 }}
      >
        <AnimatePresence mode="wait">

          {/* ── CHECKING LINK ── */}
          {stage === 'checking' && (
            <motion.div
              key="checking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}
            >
              <h1 className="form-title">Verifying link…</h1>
              <p style={{ fontSize: '13px', color: '#777', fontFamily: 'Arial, sans-serif' }}>
                Please wait a moment.
              </p>
            </motion.div>
          )}

          {/* ── INVALID / EXPIRED LINK ── */}
          {stage === 'invalid' && (
            <motion.div
              key="invalid"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 200, damping: 22 }}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}
            >
              <div style={{
                width: '90px', height: '90px', borderRadius: '50%',
                background: '#fff0f0', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '48px',
              }}>
                ⚠️
              </div>
              <h1 className="form-title" style={{ color: '#c8102e' }}>Link Invalid or Expired</h1>
              <p style={{ fontSize: '14px', color: '#555', fontFamily: 'Arial, sans-serif', textAlign: 'center', margin: '0' }}>
                {error || 'This password reset link is no longer valid. Please request a new one from the login page.'}
              </p>
              <button className="submit-btn" onClick={() => navigate('/')}>
                Go to Login
              </button>
            </motion.div>
          )}

          {/* ── RESET FORM ── */}
          {stage === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 200, damping: 22 }}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}
            >
              <h1 className="form-title">Set New Password</h1>
              <p style={{ fontSize: '13px', color: '#777', fontFamily: 'Arial, sans-serif', textAlign: 'center', margin: '0' }}>
                Resetting password for<br /><strong style={{ color: '#c8102e' }}>{email}</strong>
              </p>
              {error && <p style={{ color: '#c8102e', fontSize: '13px', fontFamily: 'Arial, sans-serif', margin: '0', textAlign: 'center' }}>{error}</p>}

              <div className="input-group">
                <label style={{ fontSize: '13px', fontFamily: 'Arial, sans-serif' }}>New Password</label>
                <PasswordInput
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label style={{ fontSize: '13px', fontFamily: 'Arial, sans-serif' }}>Confirm Password</label>
                <PasswordInput
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleReset()}
                />
              </div>

              {touched && confirmPassword && newPassword !== confirmPassword && (
                <p style={{ color: '#c8102e', fontSize: '12px', fontFamily: 'Arial, sans-serif', margin: '-8px 0 0', alignSelf: 'flex-start' }}>
                  ✗ Passwords do not match
                </p>
              )}
              {touched && confirmPassword && newPassword === confirmPassword && newPassword && (
                <p style={{ color: '#2e7d32', fontSize: '12px', fontFamily: 'Arial, sans-serif', margin: '-8px 0 0', alignSelf: 'flex-start' }}>
                  ✓ Passwords match
                </p>
              )}

              <PasswordChecklist password={newPassword} />

              <button className="submit-btn" onClick={handleReset} disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
              <button className="go-back-btn" onClick={() => navigate('/')}>Cancel</button>
            </motion.div>
          )}

          {/* ── SUCCESS ── */}
          {stage === 'success' && (
            <motion.div
              key="success"
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
                  background: '#e8f5e9', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '48px',
                }}
              >
                ✅
              </motion.div>
              <h1 className="form-title" style={{ color: '#2e7d32' }}>Password Reset!</h1>
              <p style={{ fontSize: '14px', color: '#555', fontFamily: 'Arial, sans-serif', textAlign: 'center', margin: '0' }}>
                Your password has been changed successfully. You can now log in with your new password.
              </p>
              <button className="submit-btn" onClick={() => navigate('/')}>
                Go to Login
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default ResetPassword;