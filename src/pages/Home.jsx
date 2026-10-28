import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { 
  LogIn, 
  UserPlus, 
  Shield, 
  Calendar, 
  FileText, 
  CreditCard, 
  Camera, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  LayoutDashboard
} from 'lucide-react'

export default function Home() {
  const { t } = useTranslation()
  const { isAuthenticated, isAdmin, user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="home-container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem 4rem' }}>
      {/* Hero Section */}
      <section className="hero-section" style={{
        textAlign: 'center',
        padding: '3rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.08) 0%, rgba(2, 132, 199, 0.08) 100%)',
        border: '1px solid var(--color-border)',
        marginBottom: '2.5rem'
      }}>
        <div className="brand-icon" style={{ 
          margin: '0 auto 1rem', 
          width: '64px', 
          height: '64px', 
          fontSize: '2.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-primary)',
          color: '#ffffff',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)'
        }}>
          M
        </div>

        <h1 style={{ 
          fontSize: 'clamp(1.8rem, 4vw, 2.75rem)', 
          fontWeight: '800', 
          color: 'var(--color-text-main)',
          marginBottom: '0.75rem',
          letterSpacing: '-0.02em'
        }}>
          {t('app.title')}
        </h1>

        <p style={{ 
          fontSize: '1.2rem', 
          color: 'var(--color-text-muted)', 
          maxWidth: '650px', 
          margin: '0 auto 1.75rem',
          lineHeight: 1.5
        }}>
          {t('app.tagline')} &bull; {t('app.subtitle')}
        </p>

        {/* CTA Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {isAuthenticated ? (
            <Link 
              to={isAdmin ? '/admin/dashboard' : '/customer/dashboard'} 
              className="btn btn-primary"
              style={{ padding: '0.75rem 1.75rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <LayoutDashboard size={18} />
              <span>{t('nav.dashboard')} ({user?.fullName || user?.username})</span>
              <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <Link 
                to="/login" 
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.75rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <LogIn size={19} />
                <span>{t('auth.signInBtn')} / लॉगिन</span>
                <ArrowRight size={18} />
              </Link>

              <Link 
                to="/register" 
                className="btn btn-secondary"
                style={{ padding: '0.75rem 1.5rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <UserPlus size={19} />
                <span>{t('auth.registerHere')} / पंजीकरण</span>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ 
          textAlign: 'center', 
          fontSize: '1.6rem', 
          marginBottom: '2rem',
          color: 'var(--color-text-main)' 
        }}>
          Everything You Need for Dairy Operations
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem'
        }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: 'var(--radius-sm)', 
              background: 'rgba(30, 58, 138, 0.12)', 
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <Calendar size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Daily Milk Logging</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', lineHeight: 1.5 }}>
              Effortlessly track morning and evening milk entries, FAT %, SNF, and automatic total calculations per household.
            </p>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: 'var(--radius-sm)', 
              background: 'rgba(22, 163, 74, 0.12)', 
              color: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <FileText size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Monthly Invoices</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', lineHeight: 1.5 }}>
              Generate complete, PDF-ready invoices at month-end with itemized shift breakdowns and previous balance carry-forwards.
            </p>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: 'var(--radius-sm)', 
              background: 'rgba(2, 132, 199, 0.12)', 
              color: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <CreditCard size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Customer Passbook</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', lineHeight: 1.5 }}>
              Customers can check delivery history, unpaid balances, invoices, and payment receipts from any mobile device.
            </p>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: 'var(--radius-sm)', 
              background: 'rgba(234, 88, 12, 0.12)', 
              color: 'var(--color-warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <Camera size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>OCR Register Scan</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', lineHeight: 1.5 }}>
              Take a photo of physical dairy register notebooks to extract rows automatically using Tesseract OCR.
            </p>
          </div>
        </div>
      </section>

      {/* Trust & Dual Portals */}
      <section className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.25rem' }}>Ready to Get Started?</h3>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: '500px' }}>
          Sign in to manage dairy accounts, check your daily distribution, or review current milk market rates.
        </p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          <Link to="/login" className="btn btn-primary">
            <LogIn size={16} />
            <span>Go to Login</span>
          </Link>
        </div>
      </section>
    </div>
  )
}
