// profile_faculty.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import { useUser } from '../user_context';
import { auth, db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import {
  passwordRules,
  PasswordChecklist,
  PasswordInput,
  toPascalCase,
} from '../login/auth_form_kit.jsx';
import './profile_faculty.css';

const NAME_CHANGE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function toMillis(value) {
  if (!value) return null;
  if (typeof value.toMillis === 'function') return value.toMillis();
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
}

function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return { h, m, s, label: `${h}:${m}:${s}` };
}

function ProfileFaculty() {
  const navigate = useNavigate();
  const { user, setUser } = useUser();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving]   = useState(false);

  const [now, setNow] = useState(Date.now());

  // Populate fields once the user context resolves (it may load async).
  // Run through toPascalCase here too — older records may have been saved
  // before this formatting existed, so this normalizes them on load
  // instead of only on the next edit.
  useEffect(() => {
    if (user) {
      setFirstName(toPascalCase(user.firstName || ''));
      setLastName(toPascalCase(user.lastName || ''));
    }
  }, [user]);

  const lastNameChangeAt = toMillis(user?.lastNameChangeAt);
  const nameChangeRemainingMs = lastNameChangeAt
    ? Math.max(0, lastNameChangeAt + NAME_CHANGE_COOLDOWN_MS - now)
    : 0;
  const nameChangeLocked = nameChangeRemainingMs > 0;

  useEffect(() => {
    if (!nameChangeLocked) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [nameChangeLocked]);

  const countdown = formatCountdown(nameChangeRemainingMs);

  const passwordValid = passwordRules.every(r => r.test(newPassword));
  const wantsPasswordChange = !!(currentPassword || newPassword || confirmPassword);
  const finalFirstName = toPascalCase(firstName.trim());
  const finalLastName = toPascalCase(lastName.trim());
  const nameChanged = finalFirstName !== user?.firstName || finalLastName !== user?.lastName;

  const [showConfirm, setShowConfirm] = useState(false);

  // Identity header reads from the live fields so it previews edits as you type.
  const initials =
    ((firstName.trim()[0] || '') + (lastName.trim()[0] || '')).toUpperCase() || '—';
  const displayName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

  const handleCancel = () => {
    setFirstName(toPascalCase(user?.firstName || ''));
    setLastName(toPascalCase(user?.lastName || ''));
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  // Runs all the validation that used to live directly in handleSave. If
  // everything checks out, it opens the confirm modal instead of saving
  // right away — the actual write happens in performSave, called from the
  // modal's "Yes, save" button.
  const handleSave = () => {
    setError('');
    setSuccess('');

    if (!firstName.trim() || !lastName.trim()) {
      setError('First and last name are required.');
      return;
    }

    if (wantsPasswordChange) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setError('Fill in all three password fields to change your password.');
        return;
      }
      if (!passwordValid) {
        setError('New password does not meet all requirements.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('New password and confirmation do not match.');
        return;
      }
    }

    if (nameChanged && nameChangeLocked) {
      setError(`You can change your name again in ${countdown.label}.`);
      return;
    }

    if (!nameChanged && !wantsPasswordChange) {
      // Nothing was actually edited — no point confirming a no-op save.
      return;
    }

    setShowConfirm(true);
  };

  const performSave = async () => {
    setShowConfirm(false);
    setSaving(true);
    try {
      if (nameChanged) {
        await updateDoc(doc(db, 'faculty', user.uid), {
          firstName: finalFirstName,
          lastName: finalLastName,
          lastNameChangeAt: serverTimestamp(),
        });
        setUser(prev => ({
          ...prev,
          firstName: finalFirstName,
          lastName: finalLastName,
          lastNameChangeAt: new Date(),
        }));
      }

      if (wantsPasswordChange) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, newPassword);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }

      setSuccess('Profile updated.');
    } catch (err) {
      console.error('Profile update failed:', err.code, err.message);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Current password is incorrect.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Try again later.');
      } else if (err.code === 'auth/weak-password') {
        setError('New password is too weak.');
      } else if (err.code === 'auth/requires-recent-login') {
        setError('Log out and log back in, then change your password again.');
      } else {
        setError('Something went wrong. Try again.');
      }
    }
    setSaving(false);
  };

  return (
    <div className="facprof-page">
      <header className="facprof-header">
        <button className="facprof-header-back" onClick={() => navigate(-1)}>
          <IoArrowBack size={18} />
          <span>Back</span>
        </button>
      </header>

      <div className="facprof-content">
        <h1 className="facprof-title">Edit profile</h1>
        <p className="facprof-subhead">Update your name or change your password.</p>

        {error && <div className="facprof-alert facprof-alert-error">{error}</div>}
        {success && <div className="facprof-alert facprof-alert-success">{success}</div>}

        <div className="facprof-layout">
          <div className="facprof-card">
            {/* ── Identity header ── */}
            <div className="facprof-identity">
              <div className="facprof-avatar" aria-hidden="true">{initials}</div>
              <div>
                <p className="facprof-aside-name">{displayName || 'Your name'}</p>
                <p className="facprof-aside-role">Faculty</p>
              </div>
            </div>

            <div className="facprof-divider" />

            <div className="facprof-grid-2">
              <div className="facprof-field">
                <label className="facprof-label" htmlFor="ep-first">First name</label>
                <input
                  id="ep-first"
                  className={`facprof-input${nameChangeLocked ? ' facprof-input-disabled' : ''}`}
                  value={firstName}
                  onChange={e => setFirstName(toPascalCase(e.target.value))}
                  maxLength={20}
                  disabled={nameChangeLocked}
                />
              </div>
              <div className="facprof-field">
                <label className="facprof-label" htmlFor="ep-last">Last name</label>
                <input
                  id="ep-last"
                  className={`facprof-input${nameChangeLocked ? ' facprof-input-disabled' : ''}`}
                  value={lastName}
                  onChange={e => setLastName(toPascalCase(e.target.value))}
                  maxLength={20}
                  disabled={nameChangeLocked}
                />
                {nameChangeLocked && (
                  <div className="facprof-namelock" role="status" aria-live="polite">
                    <div className="facprof-namelock-clock">
                      <div className="facprof-namelock-row facprof-namelock-digitrow">
                        <span className="facprof-namelock-cell">{countdown.h}</span>
                        <span className="facprof-namelock-colon">:</span>
                        <span className="facprof-namelock-cell">{countdown.m}</span>
                        <span className="facprof-namelock-colon">:</span>
                        <span className="facprof-namelock-cell">{countdown.s}</span>
                      </div>
                      <div className="facprof-namelock-row facprof-namelock-labelrow">
                        <span className="facprof-namelock-cell">Hours</span>
                        <span className="facprof-namelock-colon-spacer" />
                        <span className="facprof-namelock-cell">Mins</span>
                        <span className="facprof-namelock-colon-spacer" />
                        <span className="facprof-namelock-cell">Secs</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="facprof-field">
              <label className="facprof-label" htmlFor="ep-email">Email address</label>
              <input
                id="ep-email"
                className="facprof-input facprof-input-disabled"
                value={user?.email || ''}
                disabled
              />
              <p className="facprof-hint">Email address cannot be changed</p>
            </div>

            <div className="facprof-divider" />

            <h2 className="facprof-subtitle">Change password</h2>
            <p className="facprof-subtitle-note">Leave these blank to keep your current password.</p>

            <div className="facprof-field">
              <label className="facprof-label">Current password</label>
              <PasswordInput
                placeholder="••••••••"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                maxLength={16}
              />
            </div>

            <div className="facprof-grid-2">
              <div className="facprof-field">
                <label className="facprof-label">New password</label>
                <PasswordInput
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  maxLength={16}
                />
              </div>
              <div className="facprof-field">
                <label className="facprof-label">Confirm password</label>
                <PasswordInput
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  maxLength={16}
                />
              </div>
            </div>

            {newPassword && (
              <div className="facprof-checklist-slot">
                <PasswordChecklist password={newPassword} />
              </div>
            )}

            <div className="facprof-actions">
              <button className="facprof-btn facprof-btn-cancel" onClick={handleCancel} disabled={saving}>
                Cancel
              </button>
              <button className="facprof-btn facprof-btn-save" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div
          className="facprof-modal-overlay"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="facprof-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="facprof-modal-title"
            onClick={e => e.stopPropagation()}
          >
            <h2 id="facprof-modal-title" className="facprof-modal-title">
              Save these changes?
            </h2>

            <p className="facprof-modal-text">
              {nameChanged && wantsPasswordChange && (
                <>
                  You're changing your name to <strong>{displayName}</strong> and
                  setting a new password. You'll need the new password next
                  time you log in, and you won't be able to change your name
                  again for 24 hours.
                </>
              )}
              {nameChanged && !wantsPasswordChange && (
                <>
                  You're changing your name to <strong>{displayName}</strong>.
                  Once saved, you won't be able to change it again for 24
                  hours.
                </>
              )}
              {!nameChanged && wantsPasswordChange && (
                <>
                  You're setting a new password. You'll need it the next
                  time you log in — make sure you'll remember it.
                </>
              )}
            </p>

            <div className="facprof-modal-actions">
              <button
                className="facprof-btn facprof-btn-cancel"
                onClick={() => setShowConfirm(false)}
              >
                Go back
              </button>
              <button
                className="facprof-btn facprof-btn-save"
                onClick={performSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Yes, save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileFaculty;