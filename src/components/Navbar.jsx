import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { LogOut, User, Shield, Sun, Moon } from 'lucide-react'

export default function Navbar() {
  const { t } = useTranslation()
  const { user, isAuthenticated, isAdmin, isCustomer, logout, language, switchLanguage } = useAuth()
  const { theme, isDark, toggleTheme } = useTheme()

  return (
    <header className="app-header">
      <Link to={isAdmin ? '/admin/dashboard' : isCustomer ? '/customer/dashboard' : '/login'} className="header-brand">
        <div className="brand-icon">M</div>
        <div className="brand-text">
          <h1>{t('app.title')}</h1>
          <p>{t('app.subtitle')}</p>
        </div>
      </Link>

      <div className="header-actions">
        {/* Dark / Light Mode Toggle */}
        <button
          id="theme-toggle-btn"
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode / लाइट मोड चालू करें' : 'Switch to Dark Mode / डार्क मोड चालू करें'}
          aria-label="Toggle Dark / Light Theme"
        >
          {isDark ? (
            <>
              <Sun size={17} className="theme-toggle-icon sun" />
              <span className="theme-toggle-text">Light</span>
            </>
          ) : (
            <>
              <Moon size={17} className="theme-toggle-icon moon" />
              <span className="theme-toggle-text">Dark</span>
            </>
          )}
        </button>

        {/* Bilingual Language Switcher */}
        <div className="lang-switch" title="Change Language / भाषा बदलें">
          <button
            type="button"
            className={`lang-btn ${language === 'en' ? 'active' : ''}`}
            onClick={() => switchLanguage('en')}
          >
            English
          </button>
          <button
            type="button"
            className={`lang-btn ${language === 'hi' ? 'active' : ''}`}
            onClick={() => switchLanguage('hi')}
          >
            हिन्दी
          </button>
        </div>

        {isAuthenticated && user && (
          <>
            <div className="user-badge">
              {isAdmin ? <Shield size={16} color="#1e3a8a" /> : <User size={16} color="#0284c7" />}
              <span>{user.fullName || user.username}</span>
              {user.customerNumber && <span className="badge badge-blue">{user.customerNumber}</span>}
            </div>

            <button type="button" onClick={logout} className="btn btn-secondary btn-sm logout-btn" title={t('nav.logout')}>
              <LogOut size={16} />
              <span>{t('nav.logout')}</span>
            </button>
          </>
        )}
      </div>
    </header>
  )
}
