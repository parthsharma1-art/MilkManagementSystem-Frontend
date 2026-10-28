import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import { BarChart3, Download, Search, Filter } from 'lucide-react'

export default function MonthlyReports() {
  const { t } = useTranslation()

  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [reportData, setReportData] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReport()
  }, [selectedYear, selectedMonth])

  const fetchReport = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/admin/reports/monthly', {
        params: {
          year: selectedYear,
          month: selectedMonth,
        },
      })
      setReportData(res.data || [])
    } catch (err) {
      console.error('Failed to load report', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = reportData.filter((r) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      r.customerNumber?.toLowerCase().includes(q) ||
      r.customerName?.toLowerCase().includes(q)
    )
  })

  // Aggregate totals
  const totalCow = filtered.reduce((acc, r) => acc + (r.totalCowQuantity || 0), 0)
  const totalBuffalo = filtered.reduce((acc, r) => acc + (r.totalBuffaloQuantity || 0), 0)
  const totalEstimated = filtered.reduce((acc, r) => acc + (r.totalEstimatedCharges || 0), 0)

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>{t('nav.reports')}</h2>
          <p className="card-subtitle">Monthly aggregation of Cow and Buffalo milk deliveries per customer</p>
        </div>
      </div>

      {/* Filter Selector */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label className="form-label" style={{ margin: 0 }}>{t('invoice.year')}:</label>
            <select
              className="form-control"
              style={{ width: '110px' }}
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label className="form-label" style={{ margin: 0 }}>{t('invoice.month')}:</label>
            <select
              className="form-control"
              style={{ width: '130px' }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {[
                { val: 1, name: 'January' },
                { val: 2, name: 'February' },
                { val: 3, name: 'March' },
                { val: 4, name: 'April' },
                { val: 5, name: 'May' },
                { val: 6, name: 'June' },
                { val: 7, name: 'July' },
                { val: 8, name: 'August' },
                { val: 9, name: 'September' },
                { val: 10, name: 'October' },
                { val: 11, name: 'November' },
                { val: 12, name: 'December' },
              ].map((m) => (
                <option key={m.val} value={m.val}>{m.name}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '220px' }}>
            <input
              type="text"
              className="form-control"
              placeholder={t('customer.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid-cols-3" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Total Cow Milk</span>
            <span className="stat-value" style={{ color: '#16a34a' }}>{totalCow.toFixed(2)} L</span>
            <span className="stat-sub">Across all customers</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Total Buffalo Milk</span>
            <span className="stat-value" style={{ color: '#0284c7' }}>{totalBuffalo.toFixed(2)} L</span>
            <span className="stat-sub">Across all customers</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Estimated Milk Charges</span>
            <span className="stat-value">₹{totalEstimated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            <span className="stat-sub">Before adjustments / payments</span>
          </div>
        </div>
      </div>

      {/* Aggregation Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('customer.customerNumber')}</th>
                <th>{t('customer.name')}</th>
                <th>Cow (M / E / Total)</th>
                <th>Buffalo (M / E / Total)</th>
                <th>Grand Total</th>
                <th>Delivery Days</th>
                <th style={{ textAlign: 'right' }}>Est. Charges</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>{t('common.loading')}</td></tr>
              ) : filtered.length > 0 ? (
                filtered.map((r) => (
                  <tr key={r.customerId}>
                    <td><span className="badge badge-blue">{r.customerNumber}</span></td>
                    <td style={{ fontWeight: 600 }}>{r.customerName}</td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>
                        {r.cowMorningQuantity}L + {r.cowEveningQuantity}L = <strong>{r.totalCowQuantity}L</strong>
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>
                        {r.buffaloMorningQuantity}L + {r.buffaloEveningQuantity}L = <strong>{r.totalBuffaloQuantity}L</strong>
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{r.grandTotalQuantity} L</td>
                    <td><span className="badge badge-gray">{r.deliveryDaysCount} days</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#1e3a8a' }}>
                      ₹{Number(r.totalEstimatedCharges || 0).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No delivery records found for {selectedMonth}/{selectedYear}.
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
