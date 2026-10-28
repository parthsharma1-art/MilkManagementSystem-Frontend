import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { LogIn, Shield, User, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const trimmedUsername = (username || '').trim()
      const trimmedPassword = (password || '').trim()
      const user = await login(trimmedUsername, trimmedPassword)
      if (user.role === 'ROLE_ADMIN') {
        navigate('/admin/dashboard')
      } else {
        navigate('/customer/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.')
    } finally {
      setLoading(false)
    }
  }

  const fillAdmin = () => {
    setUsername('admin')
    setPassword('Admin@123')
  }

  const fillCustomer = () => {
    setUsername('9876543210')
    setPassword('Customer@123')
  }

  return (
    <div className="auth-container">
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div className="brand-icon" style={{ margin: '0 auto 0.75rem', width: '52px', height: '52px', fontSize: '1.75rem' }}>
            M
          </div>
          <h2 style={{ fontSize: '1.45rem', marginBottom: '0.35rem' }}>{t('auth.loginTitle')}</h2>
          <p className="card-subtitle">{t('auth.loginSubtitle')}</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('auth.usernameOrMobile')}</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin or 9876543210"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">{t('auth.password')}</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ paddingRight: '40px' }}
              />
              <button
                id="toggle-login-password"
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

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
            disabled={loading}
          >
            <LogIn size={18} />
            <span>{loading ? t('auth.loggingIn') : t('auth.signInBtn')}</span>
          </button>
        </form>

        {/* Quick Demo Fill Buttons */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.65rem', textAlign: 'center' }}>
            Quick Demo Auto-Fill:
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={fillAdmin}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, fontSize: '0.775rem' }}
            >
              <Shield size={14} color="#1e3a8a" />
              <span>{t('auth.quickFillAdmin')}</span>
            </button>
            <button
              type="button"
              onClick={fillCustomer}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, fontSize: '0.775rem' }}
            >
              <User size={14} color="#0284c7" />
              <span>{t('auth.quickFillCustomer')}</span>
            </button>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>{t('auth.dontHaveAccount')} </span>
          <Link to="/register" style={{ fontWeight: 600 }}>
            {t('auth.registerHere')} <ArrowRight size={14} style={{ verticalAlign: 'middle' }} />
          </Link>
        </div>
      </div>
    </div>
  )
}
