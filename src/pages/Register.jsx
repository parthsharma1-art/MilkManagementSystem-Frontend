import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { UserPlus, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react'

export default function Register() {
  const { t } = useTranslation()
  const { register } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    nameByCustomer: '',
    mobileNumber: '',
    email: '',
    address: '',
    preferredLanguage: 'en',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submittedMessage, setSubmittedMessage] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const trimmedPassword = (formData.password || '').trim()
    const trimmedConfirmPassword = (formData.confirmPassword || '').trim()

    if (trimmedPassword !== trimmedConfirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (trimmedPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      const nameVal = (formData.nameByCustomer || '').trim()
      const res = await register({
        ...formData,
        nameByCustomer: nameVal,
        mobileNumber: (formData.mobileNumber || '').trim(),
        email: (formData.email || '').trim(),
        address: (formData.address || '').trim(),
        password: trimmedPassword,
        confirmPassword: trimmedConfirmPassword,
      })
      if (res?.status === 'PENDING_APPROVAL') {
        setIsSubmitted(true)
        setSubmittedMessage(res.message || 'Your registration request is pending admin approval.')
      } else {
        navigate('/customer/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check inputs.')
    } finally {
      setLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="auth-container auth-wide">
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.75rem' }}>
          <div
            style={{
              width: 72,
              height: 72,
              margin: '0 auto 1.25rem',
              borderRadius: '50%',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.2rem',
              border: '2px solid #a7f3d0',
            }}
          >
            ⏳
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>
            Registration Under Review
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.925rem', marginBottom: '1.5rem', maxWidth: 440, margin: '0 auto 1.5rem' }}>
            Thank you, <strong>{formData.nameByCustomer}</strong>. Your registration request has been submitted to the Dairy Administrator.
          </p>

          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '1rem',
              color: '#166534',
              fontSize: '0.875rem',
              marginBottom: '2rem',
              textAlign: 'left',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start',
            }}
          >
            <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>📲</span>
            <div>
              <strong>Instant SMS Notification:</strong> Once the admin approves your account, you will receive an SMS on <strong>{formData.mobileNumber}</strong> containing your login password and portal link.
            </div>
          </div>

          <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex', padding: '0.65rem 2rem' }}>
            <ArrowLeft size={16} />
            <span>Go to Login</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container auth-wide">
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1.45rem', marginBottom: '0.35rem' }}>{t('auth.registerTitle')}</h2>
          <p className="card-subtitle">{t('auth.registerSubtitle')}</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('auth.fullName')} / आपका नाम *</label>
              <input
                type="text"
                name="nameByCustomer"
                className="form-control"
                value={formData.nameByCustomer}
                onChange={handleChange}
                placeholder="e.g. Ramesh Kumar / रमेश कुमार"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('auth.mobileNumber')} *</label>
              <input
                type="tel"
                name="mobileNumber"
                className="form-control"
                value={formData.mobileNumber}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                pattern="[0-9]{10,15}"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('auth.email')}</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com (optional)"
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('auth.address')}</label>
            <input
              type="text"
              name="address"
              className="form-control"
              value={formData.address}
              onChange={handleChange}
              placeholder="House/Plot number, Area or Colony"
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('auth.preferredLanguage')}</label>
            <select
              name="preferredLanguage"
              className="form-control"
              value={formData.preferredLanguage}
              onChange={handleChange}
            >
              <option value="en">English (Default)</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('auth.password')} *</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="form-control"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                  required
                  style={{ paddingRight: '40px' }}
                />
                <button
                  id="toggle-register-password"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t('auth.confirmPassword')} *</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="register-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className="form-control"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                  style={{ paddingRight: '40px' }}
                />
                <button
                  id="toggle-register-confirm-password"
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
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
              {formData.confirmPassword && (
                <div
                  id="password-match-indicator"
                  style={{
                    fontSize: '0.785rem',
                    marginTop: '0.35rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: formData.password.trim() === formData.confirmPassword.trim() ? '#10b981' : '#ef4444',
                    fontWeight: 500,
                  }}
                >
                  {formData.password.trim() === formData.confirmPassword.trim()
                    ? '✓ Passwords match'
                    : '✗ Passwords do not match'}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', marginTop: '0.5rem' }}
            disabled={loading}
          >
            <UserPlus size={18} />
            <span>{loading ? t('auth.registering') : t('auth.registerBtn')}</span>
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>{t('auth.alreadyHaveAccount')} </span>
          <Link to="/login" style={{ fontWeight: 600 }}>
            <ArrowLeft size={14} style={{ verticalAlign: 'middle' }} /> {t('auth.loginHere')}
          </Link>
        </div>
      </div>
    </div>
  )
}
