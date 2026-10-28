import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import {
  Users,
  Milk,
  Sun,
  Moon,
  DollarSign,
  AlertCircle,
  FileCheck2,
  CalendarCheck,
  UploadCloud,
  FileText,
  CreditCard,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'

export default function AdminDashboard() {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/admin/dashboard')
      setData(res.data)
    } catch (err) {
      setError('Failed to load dashboard metrics.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>{t('common.loading')}</div>
  }

  return (
    <div>
      {/* Header Banner */}
      <div className="page-header">
        <div>
          <h2>{t('dashboard.summaryTitle')}</h2>
          <p className="card-subtitle">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="page-header-actions">
          <Link to="/admin/daily-entry" className="btn btn-primary">
            <CalendarCheck size={16} />
            <span>{t('dashboard.recordMilk')}</span>
          </Link>
          <Link to="/admin/upload-ocr" className="btn btn-secondary">
            <UploadCloud size={16} />
            <span>{t('dashboard.uploadRegister')}</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Top Key Metrics Row */}
      <div className="grid-cols-4" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">{t('dashboard.todayTotalMilk')}</span>
            <span className="stat-value">{data?.todayTotalMilk || '0.00'} L</span>
            <span className="stat-sub">
              {t('milk.cow')}: {data?.todayCowMilk || '0'}L | {t('milk.buffalo')}: {data?.todayBuffaloMilk || '0'}L
            </span>
          </div>
          <div className="stat-icon blue">
            <Milk size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">{t('dashboard.morningShift')}</span>
            <span className="stat-value">{data?.todayMorningMilk || '0.00'} L</span>
            <span className="stat-sub">{t('dashboard.eveningShift')}: {data?.todayEveningMilk || '0.00'} L</span>
          </div>
          <div className="stat-icon amber">
            <Sun size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">{t('dashboard.totalOutstanding')}</span>
            <span className="stat-value" style={{ color: '#dc2626' }}>
              ₹{Number(data?.totalOutstandingBalances || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="stat-sub">{t('dashboard.totalCollected')}: ₹{Number(data?.totalPaymentsCollected || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="stat-icon rose">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">{t('dashboard.totalCustomers')}</span>
            <span className="stat-value">{data?.totalCustomers || 0}</span>
            <span className="stat-sub">
              {data?.activeCustomers || 0} {t('customer.active')} | {data?.inactiveCustomers || 0} {t('customer.inactive')}
            </span>
          </div>
          <div className="stat-icon green">
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Quick Action Alerts */}
      {data?.pendingOcrUploadsCount > 0 && (
        <div className="alert alert-warning" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 240px' }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>
              <strong>{data.pendingOcrUploadsCount}</strong> register OCR photo(s) are waiting for operator verification and confirmation.
            </span>
          </div>
          <Link to="/admin/upload-ocr" className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }}>
            Review OCR Now <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '1.75rem' }}>
        <Link to="/admin/customers" className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div className="stat-icon purple">
            <Users size={22} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', margin: 0 }}>{t('nav.customers')}</h4>
            <p style={{ fontSize: '0.785rem', color: 'var(--color-text-muted)', margin: 0 }}>Register & search records</p>
          </div>
        </Link>

        <Link to="/admin/invoices" className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div className="stat-icon green">
            <FileText size={22} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', margin: 0 }}>{t('nav.invoices')}</h4>
            <p style={{ fontSize: '0.785rem', color: 'var(--color-text-muted)', margin: 0 }}>Generate & print PDFs</p>
          </div>
        </Link>

        <Link to="/admin/payments" className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div className="stat-icon amber">
            <CreditCard size={22} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', margin: 0 }}>{t('nav.payments')}</h4>
            <p style={{ fontSize: '0.785rem', color: 'var(--color-text-muted)', margin: 0 }}>Record cash & UPI</p>
          </div>
        </Link>

        <Link to="/admin/settings" className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div className="stat-icon blue">
            <TrendingUp size={22} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', margin: 0 }}>{t('nav.settings')}</h4>
            <p style={{ fontSize: '0.785rem', color: 'var(--color-text-muted)', margin: 0 }}>Milk rates per litre</p>
          </div>
        </Link>
      </div>

      {/* Recent Milk Entries Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3>{t('dashboard.recentEntries')}</h3>
            <p className="card-subtitle">Real-time daily deliveries log</p>
          </div>
          <Link to="/admin/daily-entry" className="btn btn-secondary btn-sm">
            View All Entries <ArrowRight size={14} />
          </Link>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('milk.date')}</th>
                <th>{t('customer.customerNumber')}</th>
                <th>{t('customer.name')}</th>
                <th>{t('milk.shift')}</th>
                <th>{t('milk.type')}</th>
                <th>{t('milk.quantity')}</th>
                <th>{t('milk.source')}</th>
                <th>{t('milk.verificationStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentMilkEntries && data.recentMilkEntries.length > 0 ? (
                data.recentMilkEntries.slice(0, 8).map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.milkDate}</td>
                    <td><span className="badge badge-blue">{entry.customerNumber}</span></td>
                    <td style={{ fontWeight: 500 }}>{entry.customerName}</td>
                    <td>
                      {entry.shift === 'MORNING' ? (
                        <span className="badge badge-warning"><Sun size={12} /> {t('milk.morning')}</span>
                      ) : (
                        <span className="badge badge-gray"><Moon size={12} /> {t('milk.evening')}</span>
                      )}
                    </td>
                    <td>
                      <span className={entry.milkType === 'COW' ? 'badge badge-success' : 'badge badge-blue'}>
                        {entry.milkType === 'COW' ? t('milk.cow') : t('milk.buffalo')}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{entry.quantity} L</td>
                    <td>
                      <span className="badge badge-gray">{entry.entrySource}</span>
                    </td>
                    <td>
                      <span className={entry.verificationStatus === 'VERIFIED' ? 'badge badge-success' : 'badge badge-warning'}>
                        {entry.verificationStatus === 'VERIFIED' ? t('milk.verified') : t('milk.pendingReview')}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    {t('common.noRecords')}
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
