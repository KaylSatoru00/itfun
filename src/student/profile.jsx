// student_profile.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import { useUser } from '../user_context.jsx';
import { auth, db } from '../firebase.js';
import { doc, updateDoc } from 'firebase/firestore';
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
import './profile.css';

function Profile() {
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

  // Populate fields once the user context resolves (it may load async).
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
    }
  }, [user]);

  const passwordValid = passwordRules.every(r => r.test(newPassword));
  const wantsPasswordChange = !!(currentPassword || newPassword || confirmPassword);

  // Identity header reads from the live fields so it previews edits as you type.
  const initials =
    ((firstName.trim()[0] || '') + (lastName.trim()[0] || '')).toUpperCase() || '—';
  const displayName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

  const handleCancel = () => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
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

    setSaving(true);
    try {
      const nameChanged = firstName.trim() !== user?.firstName || lastName.trim() !== user?.lastName;
      if (nameChanged) {
        await updateDoc(doc(db, 'students', user.uid), {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });
        setUser(prev => ({ ...prev, firstName: firstName.trim(), lastName: lastName.trim() }));
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
    <div className="editprof-page">
      <header className="editprof-header">
        <button className="editprof-header-back" onClick={() => navigate(-1)}>
          <IoArrowBack size={18} />
          <span>Back</span>
        </button>
      </header>

      <div className="editprof-content">
        <h1 className="editprof-title">Edit profile</h1>
        <p className="editprof-subhead">Update your name or change your password.</p>

        {error && <div className="editprof-alert editprof-alert-error">{error}</div>}
        {success && <div className="editprof-alert editprof-alert-success">{success}</div>}

        <div className="editprof-layout">
          <div className="editprof-card">
            {/* ── Identity header ── */}
            <div className="editprof-identity">
              <div className="editprof-avatar" aria-hidden="true">{initials}</div>
              <div>
                <p className="editprof-aside-name">{displayName || 'Your name'}</p>
                <p className="editprof-aside-role">Student</p>
              </div>
            </div>

            <div className="editprof-divider" />

            <div className="editprof-grid-2">
              <div className="editprof-field">
                <label className="editprof-label" htmlFor="ep-first">First name</label>
                <input
                  id="ep-first"
                  className="editprof-input"
                  value={firstName}
                  onChange={e => setFirstName(toPascalCase(e.target.value))}
                  maxLength={20}
                />
              </div>
              <div className="editprof-field">
                <label className="editprof-label" htmlFor="ep-last">Last name</label>
                <input
                  id="ep-last"
                  className="editprof-input"
                  value={lastName}
                  onChange={e => setLastName(toPascalCase(e.target.value))}
                  maxLength={20}
                />
              </div>
            </div>

            <div className="editprof-field">
              <label className="editprof-label" htmlFor="ep-email">Email address</label>
              <input
                id="ep-email"
                className="editprof-input editprof-input-disabled"
                value={user?.email || ''}
                disabled
              />
              <p className="editprof-hint">Email address cannot be changed</p>
            </div>

            <div className="editprof-divider" />

            <h2 className="editprof-subtitle">Change password</h2>
            <p className="editprof-subtitle-note">Leave these blank to keep your current password.</p>

            <div className="editprof-field">
              <label className="editprof-label">Current password</label>
              <PasswordInput
                placeholder="••••••••"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                maxLength={16}
              />
            </div>

            <div className="editprof-grid-2">
              <div className="editprof-field">
                <label className="editprof-label">New password</label>
                <PasswordInput
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  maxLength={16}
                />
              </div>
              <div className="editprof-field">
                <label className="editprof-label">Confirm password</label>
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
              <div className="editprof-checklist-slot">
                <PasswordChecklist password={newPassword} />
              </div>
            )}

            <div className="editprof-actions">
              <button className="editprof-btn editprof-btn-cancel" onClick={handleCancel} disabled={saving}>
                Cancel
              </button>
              <button className="editprof-btn editprof-btn-save" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;