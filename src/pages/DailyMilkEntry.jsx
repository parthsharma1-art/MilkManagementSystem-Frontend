import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import {
  CalendarCheck,
  Sun,
  Moon,
  Milk,
  Save,
  CheckCircle,
  AlertCircle,
  Filter,
  Trash2,
  Edit,
} from 'lucide-react'

export default function DailyMilkEntry() {
  const { t } = useTranslation()

  const todayStr = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [selectedShift, setSelectedShift] = useState('MORNING')

  const [activeCustomers, setActiveCustomers] = useState([])
  const [dailySummary, setDailySummary] = useState(null)
  const [existingEntries, setExistingEntries] = useState([])

  // Bulk input grid state: Map of { customerId: { COW: quantity, BUFFALO: quantity, notes: '' } }
  const [entryInputs, setEntryInputs] = useState({})

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchCustomersAndData()
  }, [selectedDate, selectedShift])

  const fetchCustomersAndData = async () => {
    try {
      setLoading(true)
      setError('')

      // 1. Fetch active customers
      const custRes = await api.get('/api/admin/customers/active')
      const customers = custRes.data || []
      setActiveCustomers(customers)

      // 2. Fetch daily summary
      const sumRes = await api.get('/api/admin/milk-entries/summary', { params: { date: selectedDate } })
      setDailySummary(sumRes.data)

      // 3. Fetch existing entries for this date & shift
      const entriesRes = await api.get('/api/admin/milk-entries', {
        params: {
          date: selectedDate,
          shift: selectedShift,
          page: 0,
          size: 100,
        },
      })
      const entries = entriesRes.data.content || []
      setExistingEntries(entries)

      // Initialize entry inputs for all customers
      const inputMap = {}
      customers.forEach((c) => {
        inputMap[c.id] = {
          cow: '',
          buffalo: '',
          notes: '',
        }
      })

      // Populate existing entries into inputs
      entries.forEach((e) => {
        if (inputMap[e.customerId]) {
          if (e.milkType === 'COW') inputMap[e.customerId].cow = e.quantity
          if (e.milkType === 'BUFFALO') inputMap[e.customerId].buffalo = e.quantity
          if (e.notes) inputMap[e.customerId].notes = e.notes
        }
      })

      setEntryInputs(inputMap)
    } catch (err) {
      setError('Failed to load daily milk records.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (customerId, type, val) => {
    setEntryInputs((prev) => ({
      ...prev,
      [customerId]: {
        ...prev[customerId],
        [type]: val,
      },
    }))
  }

  const handleBulkSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    const payloadEntries = []
    Object.keys(entryInputs).forEach((custId) => {
      const item = entryInputs[custId]
      if (item.cow && Number(item.cow) > 0) {
        payloadEntries.push({
          customerId: custId,
          milkType: 'COW',
          quantity: Number(item.cow),
          notes: item.notes,
        })
      }
      if (item.buffalo && Number(item.buffalo) > 0) {
        payloadEntries.push({
          customerId: custId,
          milkType: 'BUFFALO',
          quantity: Number(item.buffalo),
          notes: item.notes,
        })
      }
    })

    if (payloadEntries.length === 0) {
      setError('Please enter quantities for at least one customer.')
      setSaving(false)
      return
    }

    try {
      await api.post('/api/admin/milk-entries/bulk', {
        milkDate: selectedDate,
        shift: selectedShift,
        entries: payloadEntries,
      })
      setSuccess(`Saved ${payloadEntries.length} milk entries for ${selectedDate} (${selectedShift}) successfully.`)
      fetchCustomersAndData()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save daily entries.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this milk entry?')) return
    try {
      await api.delete(`/api/admin/milk-entries/${entryId}`)
      setSuccess('Entry deleted.')
      fetchCustomersAndData()
    } catch (err) {
      setError('Failed to delete entry.')
    }
  }

  return (
    <div>
      {/* Page Title */}
      <div className="page-header">
        <div>
          <h2>{t('nav.dailyEntry')}</h2>
          <p className="card-subtitle">Record daily milk quantities for Cow and Buffalo milk across shifts</p>
        </div>
        <div className="page-header-actions">
          <button
            type="button"
            onClick={handleBulkSave}
            className="btn btn-primary"
            disabled={saving || loading}
          >
            <Save size={16} />
            <span>{saving ? 'Saving Records...' : t('milk.saveAllEntries')}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Date & Shift Selector */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label className="form-label" style={{ margin: 0 }}>{t('milk.date')}:</label>
            <input
              type="date"
              className="form-control"
              style={{ width: '180px' }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label className="form-label" style={{ margin: 0 }}>{t('milk.shift')}:</label>
            <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
              <button
                type="button"
                className={`btn btn-sm ${selectedShift === 'MORNING' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedShift('MORNING')}
              >
                <Sun size={15} />
                <span>{t('milk.morning')}</span>
              </button>
              <button
                type="button"
                className={`btn btn-sm ${selectedShift === 'EVENING' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedShift('EVENING')}
              >
                <Moon size={15} />
                <span>{t('milk.evening')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Summary Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">{t('milk.grandTotal')} ({selectedDate})</span>
            <span className="stat-value">{dailySummary?.grandTotal || '0.00'} L</span>
            <span className="stat-sub">{dailySummary?.totalEntriesCount || 0} entries recorded</span>
          </div>
          <div className="stat-icon blue"><Milk size={22} /></div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">{t('milk.cowTotal')}</span>
            <span className="stat-value" style={{ color: '#16a34a' }}>{dailySummary?.cowTotal || '0.00'} L</span>
            <span className="stat-sub">Across all shifts</span>
          </div>
          <div className="stat-icon green"><Milk size={22} /></div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">{t('milk.buffaloTotal')}</span>
            <span className="stat-value" style={{ color: '#0284c7' }}>{dailySummary?.buffaloTotal || '0.00'} L</span>
            <span className="stat-sub">Across all shifts</span>
          </div>
          <div className="stat-icon purple"><Milk size={22} /></div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Shift Breakdown</span>
            <span className="stat-value" style={{ fontSize: '1.35rem' }}>
              M: {dailySummary?.morningTotal || '0'}L | E: {dailySummary?.eveningTotal || '0'}L
            </span>
            <span className="stat-sub">Morning vs Evening</span>
          </div>
          <div className="stat-icon amber"><Sun size={22} /></div>
        </div>
      </div>

      {/* Customer Milk Input Sheet */}
      <div className="card" style={{ padding: 0 }}>
        <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', margin: 0 }}>
          <div>
            <h3>Daily Customer Milk Register</h3>
            <p className="card-subtitle">
              Enter Cow or Buffalo milk quantities for {selectedDate} ({selectedShift})
            </p>
          </div>
          <span className="badge badge-blue">
            {activeCustomers.length} Active Customers
          </span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>{t('customer.customerNumber')}</th>
                <th>{t('customer.name')}</th>
                <th style={{ width: '180px' }}>{t('milk.cow')} (Litres)</th>
                <th style={{ width: '180px' }}>{t('milk.buffalo')} (Litres)</th>
                <th>Notes / Remarks</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>{t('common.loading')}</td></tr>
              ) : activeCustomers.length > 0 ? (
                activeCustomers.map((cust) => {
                  const input = entryInputs[cust.id] || { cow: '', buffalo: '', notes: '' }
                  return (
                    <tr key={cust.id}>
                      <td>
                        <span className="badge badge-blue" style={{ fontFamily: 'monospace' }}>
                          {cust.customerNumber}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{cust.fullName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{cust.mobileNumber}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            className="form-control"
                            style={{ width: '110px', textAlign: 'right', fontWeight: 600 }}
                            placeholder="0.00"
                            value={input.cow}
                            onChange={(e) => handleInputChange(cust.id, 'cow', e.target.value)}
                          />
                          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>L</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            className="form-control"
                            style={{ width: '110px', textAlign: 'right', fontWeight: 600 }}
                            placeholder="0.00"
                            value={input.buffalo}
                            onChange={(e) => handleInputChange(cust.id, 'buffalo', e.target.value)}
                          />
                          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>L</span>
                        </div>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Optional notes"
                          value={input.notes}
                          onChange={(e) => handleInputChange(cust.id, 'notes', e.target.value)}
                        />
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No active customers registered. Please add customers first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '1.25rem', display: 'flex', justifyContent: 'flex-end', background: 'var(--color-bg-app)' }}>
          <button
            type="button"
            onClick={handleBulkSave}
            className="btn btn-primary"
            disabled={saving || loading}
          >
            <Save size={16} />
            <span>{saving ? 'Saving Records...' : t('milk.saveAllEntries')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
