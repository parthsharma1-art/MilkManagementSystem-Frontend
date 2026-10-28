import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { User, Lock, Globe, Save, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'

export default function CustomerProfile() {
  const { t, i18n } = useTranslation()
  const { switchLanguage, language } = useAuth()

  const [profile, setProfile] = useState(null)
  const [formData, setFormData] = useState({
    fullName: '',
    nickname: '',
    email: '',
    address: '',
  })

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loading, setLoading] = useState(true)
  const [profileSuccess, setProfileSuccess] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/customer/profile')
      setProfile(res.data)
      setFormData({
        fullName: res.data.fullName || '',
        nickname: res.data.nickname || '',
        email: res.data.email || '',
        address: res.data.address || '',
      })
    } catch (err) {
      setError('Failed to fetch profile details.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setProfileSuccess('')
    setError('')
    try {
      const res = await api.put('/api/customer/profile', {
        fullName: formData.fullName,
        email: formData.email,
        address: formData.address,
      })
      setProfile(res.data)
      setProfileSuccess('Profile updated successfully.')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.')
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordSuccess('')
    setError('')

    const trimmedOld = (passwordData.oldPassword || '').trim()
    const trimmedNew = (passwordData.newPassword || '').trim()
    const trimmedConfirm = (passwordData.confirmPassword || '').trim()

    if (trimmedNew !== trimmedConfirm) {
      setError('New passwords do not match.')
      return
    }

    if (trimmedNew.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }

    try {
      await api.post('/api/auth/change-password', {
        oldPassword: trimmedOld,
        newPassword: trimmedNew,
        confirmPassword: trimmedConfirm,
      })
      setPasswordSuccess('Password changed successfully.')
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.')
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>{t('nav.myProfile')}</h2>
        <p className="card-subtitle">Manage your contact details, security, and bilingual preferences</p>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Profile Details Form */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <h3>Contact Details</h3>
          <span className="badge badge-blue">{profile?.customerNumber}</span>
        </div>

        {profileSuccess && (
          <div className="alert alert-success">
            <CheckCircle size={18} />
            <span>{profileSuccess}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('auth.fullName')}</label>
              <input
                type="text"
                className="form-control"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('auth.mobileNumber')}</label>
              <input
                type="text"
                className="form-control"
                value={profile?.mobileNumber || ''}
                disabled
                style={{ background: 'var(--color-bg-muted)', color: 'var(--color-text-muted)' }}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{t('auth.nickname')}</span>
                <span style={{ fontSize: '0.72rem', color: '#6366f1', background: '#eef2ff', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>
                  Admin Managed
                </span>
              </label>
              <input
                type="text"
                className="form-control"
                value={profile?.nickname || '-'}
                disabled
                readOnly
                style={{ background: 'var(--color-bg-muted, #f8fafc)', color: 'var(--color-text-muted, #64748b)', cursor: 'not-allowed' }}
                title="Nickname is assigned and managed exclusively by the dairy administrator"
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('auth.email')}</label>
              <input
                type="email"
                className="form-control"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('auth.address')}</label>
            <input
              type="text"
              className="form-control"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              <span>Save Contact Info</span>
            </button>
          </div>
        </form>
      </div>

      {/* Language Preference Card */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <h3>Preferred Language / भाषा चयन</h3>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          Select your preferred interface language. Your selection is remembered on all your visits.
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            type="button"
            className={`btn ${language === 'en' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '0.75rem' }}
            onClick={() => switchLanguage('en')}
          >
            English (Default)
          </button>
          <button
            type="button"
            className={`btn ${language === 'hi' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '0.75rem' }}
            onClick={() => switchLanguage('hi')}
          >
            हिन्दी (Hindi)
          </button>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="card">
        <div className="card-header">
          <h3>{t('auth.changePassword')}</h3>
        </div>

        {passwordSuccess && (
          <div className="alert alert-success">
            <CheckCircle size={18} />
            <span>{passwordSuccess}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label className="form-label">{t('auth.oldPassword')}</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showOldPassword ? 'text' : 'password'}
                className="form-control"
                value={passwordData.oldPassword}
                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                required
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                title={showOldPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                }}
              >
                {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('auth.newPassword')}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  className="form-control"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                  }}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t('auth.confirmPassword')}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-control"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordData.confirmPassword && (
                <div
                  style={{
                    fontSize: '0.785rem',
                    marginTop: '0.35rem',
                    color: passwordData.newPassword.trim() === passwordData.confirmPassword.trim() ? '#10b981' : '#ef4444',
                    fontWeight: 500,
                  }}
                >
                  {passwordData.newPassword.trim() === passwordData.confirmPassword.trim()
                    ? '✓ New passwords match'
                    : '✗ New passwords do not match'}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-secondary">
              <Lock size={16} />
              <span>{t('auth.updatePasswordBtn')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
