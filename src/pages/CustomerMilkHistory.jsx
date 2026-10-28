import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import { formatDateDMY } from '../utils/dateUtils'
import { Calendar, Sun, Moon, Milk, Filter } from 'lucide-react'

export default function CustomerMilkHistory() {
  const { t } = useTranslation()

  const today = new Date()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [startDate, endDate])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/customer/milk-history', {
        params: { startDate, endDate },
      })
      setHistory(res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Calculate totals
  const totalCow = history.filter((e) => e.milkType === 'COW').reduce((acc, e) => acc + (e.quantity || 0), 0)
  const totalBuffalo = history.filter((e) => e.milkType === 'BUFFALO').reduce((acc, e) => acc + (e.quantity || 0), 0)

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>{t('nav.myMilkHistory')}</h2>
        <p className="card-subtitle">Daily milk delivery records across morning and evening shifts</p>
      </div>

      {/* Date Filter */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label className="form-label" style={{ margin: 0 }}>From:</label>
            <input
              type="date"
              className="form-control"
              style={{ width: '160px' }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label className="form-label" style={{ margin: 0 }}>To:</label>
            <input
              type="date"
              className="form-control"
              style={{ width: '160px' }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Totals in Selected Range */}
      <div className="grid-cols-3" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Cow Milk Total</span>
            <span className="stat-value" style={{ color: '#16a34a' }}>{totalCow.toFixed(2)} Litres</span>
            <span className="stat-sub">In selected period</span>
          </div>
          <div className="stat-icon green"><Milk size={22} /></div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Buffalo Milk Total</span>
            <span className="stat-value" style={{ color: '#0284c7' }}>{totalBuffalo.toFixed(2)} Litres</span>
            <span className="stat-sub">In selected period</span>
          </div>
          <div className="stat-icon purple"><Milk size={22} /></div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Grand Total Deliveries</span>
            <span className="stat-value">{(totalCow + totalBuffalo).toFixed(2)} Litres</span>
            <span className="stat-sub">{history.length} records found</span>
          </div>
          <div className="stat-icon blue"><Calendar size={22} /></div>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Shift</th>
                <th>Milk Type</th>
                <th>Quantity</th>
                <th>Source</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>{t('common.loading')}</td></tr>
              ) : history.length > 0 ? (
                history.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600 }}>{formatDateDMY(m.milkDate)}</td>
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
                    <td><span className="badge badge-gray">{m.entrySource}</span></td>
                    <td><span className="badge badge-success">{m.verificationStatus}</span></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No milk deliveries recorded in this date range.
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
