import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import {
  User,
  Milk,
  DollarSign,
  Calendar,
  FileText,
  BookOpen,
  ArrowRight,
  Sun,
  Moon,
} from 'lucide-react'

export default function CustomerDashboard() {
  const { t } = useTranslation()
  const [profile, setProfile] = useState(null)
  const [recentMilk, setRecentMilk] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCustomerData()
  }, [])

  const fetchCustomerData = async () => {
    try {
      setLoading(true)
      const profRes = await api.get('/api/customer/profile')
      setProfile(profRes.data)

      const milkRes = await api.get('/api/customer/milk-history')
      setRecentMilk(milkRes.data || [])

      const invRes = await api.get('/api/customer/invoices')
      setInvoices(invRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>{t('common.loading')}</div>
  }

  return (
    <div>
      {/* Customer Header Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #1e3a8a, #0284c7)', color: '#ffffff', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: '1 1 240px' }}>
            <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.85 }}>
              Customer Portal / ग्राहक पोर्टल
            </span>
            <h2 style={{ color: '#ffffff', fontSize: 'clamp(1.25rem, 3.5vw, 1.6rem)', margin: '0.25rem 0' }}>
              {profile?.fullName}
            </h2>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '0.875rem', wordBreak: 'break-word' }}>
              Registered Customer Number: <strong style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px' }}>{profile?.customerNumber}</strong>
            </p>
          </div>

          <div style={{ flex: '1 1 180px', textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>Current Balance Due / कुल बकाया</div>
            <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
              ₹{Number(profile?.currentBalance || 0).toFixed(2)}
            </div>
            <Link to="/customer/invoices" className="btn btn-sm" style={{ marginTop: '0.5rem', background: '#ffffff', color: '#1e3a8a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              ⚡ Calculate & View Bill
            </Link>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid-cols-3" style={{ marginBottom: '1.75rem' }}>
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Total Milk Billed</span>
            <span className="stat-value">₹{Number(profile?.totalBilled || 0).toFixed(2)}</span>
            <span className="stat-sub">Across all finalized invoices</span>
          </div>
          <div className="stat-icon blue"><FileText size={22} /></div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Total Paid So Far</span>
            <span className="stat-value" style={{ color: '#16a34a' }}>
              ₹{Number(profile?.totalPaid || 0).toFixed(2)}
            </span>
            <span className="stat-sub">Verified payments credited</span>
          </div>
          <div className="stat-icon green"><DollarSign size={22} /></div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Recent Deliveries</span>
            <span className="stat-value">{recentMilk.length}</span>
            <span className="stat-sub">Recorded in last 30 days</span>
          </div>
          <div className="stat-icon amber"><Milk size={22} /></div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid-cols-3" style={{ marginBottom: '1.75rem' }}>
        <Link to="/customer/milk-history" className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div className="stat-icon blue"><Calendar size={22} /></div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem' }}>{t('nav.myMilkHistory')}</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Daily morning & evening logs</p>
          </div>
        </Link>

        <Link to="/customer/invoices" className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div className="stat-icon green"><FileText size={22} /></div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem' }}>{t('nav.myInvoices')}</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>View & download bills</p>
          </div>
        </Link>

        <Link to="/customer/ledger" className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div className="stat-icon amber"><BookOpen size={22} /></div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem' }}>{t('nav.myPassbook')}</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Payment & charges passbook</p>
          </div>
        </Link>
      </div>

      {/* Recent Deliveries */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3>Recent Milk Deliveries (हाल का दूध)</h3>
            <p className="card-subtitle">Last recorded daily deliveries for your household</p>
          </div>
          <Link to="/customer/milk-history" className="btn btn-secondary btn-sm">
            View Full History <ArrowRight size={14} />
          </Link>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Shift</th>
                <th>Milk Type</th>
                <th>Quantity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentMilk.length > 0 ? (
                recentMilk.slice(0, 6).map((m) => (
                  <tr key={m.id}>
                    <td>{m.milkDate}</td>
                    <td>
                      {m.shift === 'MORNING' ? (
                        <span className="badge badge-warning"><Sun size={12} /> Morning</span>
                      ) : (
                        <span className="badge badge-gray"><Moon size={12} /> Evening</span>
                      )}
                    </td>
                    <td>
                      <span className={m.milkType === 'COW' ? 'badge badge-success' : 'badge badge-blue'}>
                        {m.milkType === 'COW' ? 'Cow Milk (गाय)' : 'Buffalo Milk (भैंस)'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{m.quantity} Litres</td>
                    <td><span className="badge badge-success">{m.verificationStatus}</span></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No recent deliveries recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
