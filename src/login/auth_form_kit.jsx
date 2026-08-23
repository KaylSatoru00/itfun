import { useState } from 'react';
import './auth_forms.css';
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

// Shared building blocks for the student & faculty auth forms.
// Purely presentational — all auth logic stays in the page components.

export function toPascalCase(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

// Only @gmail.com addresses are accepted for signup. One local part, no
// spaces, and the domain must be exactly gmail.com (case-insensitive).
export function isGmailAddress(email) {
  return /^[^\s@]+@gmail\.com$/i.test((email || '').trim());
}

export const passwordRules = [
  { id: 'length',    label: '8–16 characters',                    test: p => p.length >= 8 && p.length <= 16 },
  { id: 'upper',     label: 'At least one uppercase letter (A–Z)', test: p => /[A-Z]/.test(p) },
  { id: 'lower',     label: 'At least one lowercase letter (a–z)', test: p => /[a-z]/.test(p) },
  { id: 'number',    label: 'At least one number (0–9)',           test: p => /[0-9]/.test(p) },
  { id: 'special',   label: 'At least one special character (!@#$%&*_…)', test: p => /[!@#$%^&*_\-+=?]/.test(p) },
  { id: 'nospace',   label: 'No spaces',                           test: p => !/\s/.test(p) && p.length > 0 },
];

export function PasswordChecklist({ password }) {
  if (!password) return null;
  return (
    <div className="af-checklist">
      <p className="af-checklist-title">Password requirements</p>
      {passwordRules.map(rule => {
        const ok = rule.test(password);
        return (
          <div key={rule.id} className={`af-check-item ${ok ? 'ok' : 'bad'}`}>
            <span className="af-check-mark">{ok ? '✓' : '✗'}</span>
            <span>{rule.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function RequiredLabel({ label, touched, value }) {
  const missing = touched && !value;
  return (
    <label className={`af-label ${missing ? 'af-missing' : ''}`}>
      {label} <span style={{ color: '#c8102e' }}>*</span>
    </label>
  );
}

export function PasswordInput({ value, onChange, placeholder, invalid, onKeyDown, maxLength }) {
  const [show, setShow] = useState(false);
  return (
    <div className="af-pass">
      <input
        type={show ? 'text' : 'password'}
        className={`form-control ${invalid ? 'is-invalid' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        maxLength={maxLength}
      />
      <button type="button" className="af-eye" tabIndex={-1} onClick={() => setShow(s => !s)}>
        {show ? <AiOutlineEyeInvisible size={18} /> : <AiOutlineEye size={18} />}
      </button>
    </div>
  );
}

export const screenVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.18 } },
};