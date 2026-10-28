import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import { formatDateDMY } from '../utils/dateUtils'
import { BookOpen, DollarSign } from 'lucide-react'

export default function CustomerLedger() {
  const { t } = useTranslation()
  const [ledger, setLedger] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLedger()
  }, [])

  const fetchLedger = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/customer/ledger')
      setLedger(res.data)
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
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>{t('nav.myPassbook')}</h2>
        <p className="card-subtitle">Complete chronological record of billed milk charges and payments credited</p>
      </div>

      {/* Summary Cards */}
      <div className="grid-cols-3" style={{ marginBottom: '1.75rem' }}>
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Total Billed Charges</span>
            <span className="stat-value">₹{Number(ledger?.totalBilled || 0).toFixed(2)}</span>
            <span className="stat-sub">Sum of all monthly invoices</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Total Payments Credited</span>
            <span className="stat-value" style={{ color: '#16a34a' }}>
              ₹{Number(ledger?.totalPaid || 0).toFixed(2)}
            </span>
            <span className="stat-sub">Cash, UPI, & Bank payments</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Current Outstanding Due</span>
            <span className="stat-value" style={{ color: (ledger?.outstandingBalance > 0) ? '#dc2626' : '#16a34a' }}>
              ₹{Number(ledger?.outstandingBalance || 0).toFixed(2)}
            </span>
            <span className="stat-sub">Net balance payable</span>
          </div>
        </div>
      </div>

      {/* Passbook Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', margin: 0 }}>
          <h3>Account Passbook Statement</h3>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Reference #</th>
                <th>Description</th>
                <th style={{ textAlign: 'right', color: '#dc2626' }}>Charges (Debit)</th>
                <th style={{ textAlign: 'right', color: '#16a34a' }}>Payment (Credit)</th>
                <th style={{ textAlign: 'right' }}>Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {ledger?.entries && ledger.entries.length > 0 ? (
                ledger.entries.map((e, idx) => (
                  <tr key={idx}>
                    <td>{formatDateDMY(e.date)}</td>
                    <td>
                      <span className={e.type === 'INVOICE' ? 'badge badge-blue' : e.type === 'PAYMENT' ? 'badge badge-success' : 'badge badge-warning'}>
                        {e.type}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>{e.reference}</td>
                    <td>{e.description}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: e.debit > 0 ? '#dc2626' : 'var(--color-text-light)' }}>
                      {e.debit > 0 ? `₹${Number(e.debit).toFixed(2)}` : '-'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: e.credit > 0 ? '#16a34a' : 'var(--color-text-light)' }}>
                      {e.credit > 0 ? `₹${Number(e.credit).toFixed(2)}` : '-'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      ₹{Number(e.runningBalance).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No ledger transactions found.
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
