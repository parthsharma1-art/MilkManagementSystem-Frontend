import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import { saveDraft, getDraft, clearDraft, queueOfflineAction } from '../utils/draftStorage'
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
  Layers,
  Calculator,
} from 'lucide-react'

export default function DailyMilkEntry() {
  const { t } = useTranslation()

  const todayStr = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(todayStr)
  // 'MORNING' | 'EVENING' | 'FULL_DAY'
  const [selectedShift, setSelectedShift] = useState('MORNING')

  const [activeCustomers, setActiveCustomers] = useState([])
  const [dailySummary, setDailySummary] = useState(null)
  const [existingEntries, setExistingEntries] = useState([])

  // Bulk input grid state: Map of { customerId: { morningCow: '', morningBuffalo: '', morningNotes: '', eveningCow: '', eveningBuffalo: '', eveningNotes: '' } }
  const [entryInputs, setEntryInputs] = useState({})
  const [draftRestored, setDraftRestored] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const getEntryDraftKey = () => `daily_milk_entry_${selectedDate}`

  useEffect(() => {
    fetchCustomersAndData()
  }, [selectedDate])

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

      // 3. Fetch all existing entries for this date (both Morning and Evening)
      const entriesRes = await api.get('/api/admin/milk-entries', {
        params: {
          date: selectedDate,
          page: 0,
          size: 500,
        },
      })
      const entries = entriesRes.data?.content || []
      setExistingEntries(entries)

      // Initialize inputs for all customers
      const inputMap = {}
      customers.forEach((c) => {
        inputMap[c.id] = {
          morningCow: '',
          morningBuffalo: '',
          morningNotes: '',
          eveningCow: '',
          eveningBuffalo: '',
          eveningNotes: '',
        }
      })

      // Populate entries from database
      entries.forEach((e) => {
        if (inputMap[e.customerId]) {
          if (e.shift === 'MORNING') {
            if (e.milkType === 'COW') inputMap[e.customerId].morningCow = e.quantity
            if (e.milkType === 'BUFFALO') inputMap[e.customerId].morningBuffalo = e.quantity
            if (e.notes) inputMap[e.customerId].morningNotes = e.notes
          } else if (e.shift === 'EVENING') {
            if (e.milkType === 'COW') inputMap[e.customerId].eveningCow = e.quantity
            if (e.milkType === 'BUFFALO') inputMap[e.customerId].eveningBuffalo = e.quantity
            if (e.notes) inputMap[e.customerId].eveningNotes = e.notes
          }
        }
      })

      // Restore unsaved local storage draft if available
      const savedDraft = getDraft(getEntryDraftKey())
      if (savedDraft && typeof savedDraft === 'object') {
        let hasDraftData = false
        Object.keys(savedDraft).forEach((cId) => {
          if (inputMap[cId]) {
            const d = savedDraft[cId]
            if (d.morningCow || d.morningBuffalo || d.eveningCow || d.eveningBuffalo || d.morningNotes || d.eveningNotes) {
              inputMap[cId] = { ...inputMap[cId], ...d }
              hasDraftData = true
            }
          }
        })
        setDraftRestored(hasDraftData)
      } else {
        setDraftRestored(false)
      }

      setEntryInputs(inputMap)
    } catch (err) {
      setError('Failed to load daily milk records. Showing cached offline data if available.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (customerId, field, val) => {
    setEntryInputs((prev) => {
      const next = {
        ...prev,
        [customerId]: {
          ...prev[customerId],
          [field]: val,
        },
      }
      saveDraft(getEntryDraftKey(), next)
      return next
    })
  }

  // Live full day calculations from input state
  const liveTotals = activeCustomers.reduce(
    (acc, cust) => {
      const inp = entryInputs[cust.id] || {}
      const mCow = Number(inp.morningCow) || 0
      const mBuf = Number(inp.morningBuffalo) || 0
      const eCow = Number(inp.eveningCow) || 0
      const eBuf = Number(inp.eveningBuffalo) || 0

      acc.morningCow += mCow
      acc.morningBuffalo += mBuf
      acc.morningTotal += (mCow + mBuf)

      acc.eveningCow += eCow
      acc.eveningBuffalo += eBuf
      acc.eveningTotal += (eCow + eBuf)

      acc.totalCow += (mCow + eCow)
      acc.totalBuffalo += (mBuf + eBuf)
      acc.grandTotal += (mCow + mBuf + eCow + eBuf)

      if (mCow > 0 || mBuf > 0) acc.morningCount++
      if (eCow > 0 || eBuf > 0) acc.eveningCount++
      if (mCow > 0 || mBuf > 0 || eCow > 0 || eBuf > 0) acc.totalActiveCustomersCount++

      return acc
    },
    {
      morningCow: 0,
      morningBuffalo: 0,
      morningTotal: 0,
      morningCount: 0,
      eveningCow: 0,
      eveningBuffalo: 0,
      eveningTotal: 0,
      eveningCount: 0,
      totalCow: 0,
      totalBuffalo: 0,
      grandTotal: 0,
      totalActiveCustomersCount: 0,
    }
  )

  const handleBulkSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    const morningPayload = []
    const eveningPayload = []

    Object.keys(entryInputs).forEach((custId) => {
      const item = entryInputs[custId]
      // Morning
      if (item.morningCow && Number(item.morningCow) > 0) {
        morningPayload.push({
          customerId: custId,
          milkType: 'COW',
          quantity: Number(item.morningCow),
          notes: item.morningNotes,
        })
      }
      if (item.morningBuffalo && Number(item.morningBuffalo) > 0) {
        morningPayload.push({
          customerId: custId,
          milkType: 'BUFFALO',
          quantity: Number(item.morningBuffalo),
          notes: item.morningNotes,
        })
      }
      // Evening
      if (item.eveningCow && Number(item.eveningCow) > 0) {
        eveningPayload.push({
          customerId: custId,
          milkType: 'COW',
          quantity: Number(item.eveningCow),
          notes: item.eveningNotes,
        })
      }
      if (item.eveningBuffalo && Number(item.eveningBuffalo) > 0) {
        eveningPayload.push({
          customerId: custId,
          milkType: 'BUFFALO',
          quantity: Number(item.eveningBuffalo),
          notes: item.eveningNotes,
        })
      }
    })

    const shiftsToSave = []
    if (selectedShift === 'MORNING') {
      if (morningPayload.length === 0) {
        setError('Please enter morning milk quantities for at least one customer.')
        setSaving(false)
        return
      }
      shiftsToSave.push({ shift: 'MORNING', entries: morningPayload })
    } else if (selectedShift === 'EVENING') {
      if (eveningPayload.length === 0) {
        setError('Please enter evening milk quantities for at least one customer.')
        setSaving(false)
        return
      }
      shiftsToSave.push({ shift: 'EVENING', entries: eveningPayload })
    } else {
      // FULL_DAY: save both if entries exist
      if (morningPayload.length === 0 && eveningPayload.length === 0) {
        setError('Please enter milk quantities for at least one customer.')
        setSaving(false)
        return
      }
      if (morningPayload.length > 0) shiftsToSave.push({ shift: 'MORNING', entries: morningPayload })
      if (eveningPayload.length > 0) shiftsToSave.push({ shift: 'EVENING', entries: eveningPayload })
    }

    try {
      let savedCount = 0
      for (const item of shiftsToSave) {
        await api.post('/api/admin/milk-entries/bulk', {
          milkDate: selectedDate,
          shift: item.shift,
          entries: item.entries,
        })
        savedCount += item.entries.length
      }

      clearDraft(getEntryDraftKey())
      setDraftRestored(false)
      setSuccess(`✅ Successfully saved ${savedCount} milk entries for ${selectedDate} (${selectedShift === 'FULL_DAY' ? 'Full Day Morning & Evening' : selectedShift})!`)
      fetchCustomersAndData()
    } catch (err) {
      saveDraft(getEntryDraftKey(), entryInputs)
      const isServerDown = !err.response || err.response.status >= 500
      if (isServerDown) {
        for (const item of shiftsToSave) {
          queueOfflineAction({
            action: 'BULK_MILK_ENTRY',
            endpoint: '/api/admin/milk-entries/bulk',
            method: 'POST',
            payload: {
              milkDate: selectedDate,
              shift: item.shift,
              entries: item.entries,
            },
            description: `${item.entries.length} milk entries on ${selectedDate} (${item.shift})`,
          })
        }
        setError('Backend server is down! All entered milk quantities are safely preserved in local storage draft.')
      } else {
        setError(err.response?.data?.message || 'Failed to save daily entries. Your entries are saved locally.')
      }
    } finally {
      setSaving(false)
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
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
          >
            <Save size={16} />
            <span>
              {saving
                ? 'Saving Records...'
                : selectedShift === 'FULL_DAY'
                ? 'Save Full Day Records / पूरा दिन सहेजें'
                : `Save ${selectedShift === 'MORNING' ? 'Morning (सुबह)' : 'Evening (शाम)'} Entries`}
            </span>
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

      {/* Date & Shift Controls */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>{t('milk.date')}:</label>
            <input
              type="date"
              className="form-control"
              style={{ width: '180px', fontWeight: 600 }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>{t('milk.shift')}:</label>
            <div style={{ display: 'inline-flex', gap: '0.35rem', background: 'var(--color-bg-app)', padding: '4px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <button
                type="button"
                className={`btn btn-sm ${selectedShift === 'MORNING' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedShift('MORNING')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
              >
                <Sun size={15} />
                <span>{t('milk.morning')} (सुबह)</span>
              </button>
              <button
                type="button"
                className={`btn btn-sm ${selectedShift === 'EVENING' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedShift('EVENING')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
              >
                <Moon size={15} />
                <span>{t('milk.evening')} (शाम)</span>
              </button>
              <button
                type="button"
                className={`btn btn-sm ${selectedShift === 'FULL_DAY' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedShift('FULL_DAY')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
              >
                <Layers size={15} />
                <span>Full Day (पूरा दिन / Both Shifts)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {draftRestored && (
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            padding: '0.6rem 1rem',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
          }}
        >
          <span>📝 <strong>Restored Unsaved Draft:</strong> Your previously entered milk quantities for {selectedDate} were restored from local storage.</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              clearDraft(getEntryDraftKey())
              setDraftRestored(false)
              fetchCustomersAndData()
            }}
          >
            Clear Draft
          </button>
        </div>
      )}

      {/* Full Day Calculation Dashboard Cards (Dynamic Live Calculation) */}
      <div className="grid-cols-4" style={{ marginBottom: '1.5rem' }}>
        {/* Card 1: Full Day Total */}
        <div className="stat-card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <div className="stat-content">
            <span className="stat-label">🏆 Full Day Total / पूरा दिन कुल</span>
            <span className="stat-value" style={{ color: 'var(--color-primary)' }}>
              {liveTotals.grandTotal.toFixed(2)} L
            </span>
            <span className="stat-sub">
              {liveTotals.totalActiveCustomersCount} of {activeCustomers.length} customers recorded
            </span>
          </div>
          <div className="stat-icon blue"><Milk size={22} /></div>
        </div>

        {/* Card 2: Morning Shift Subtotal */}
        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-content">
            <span className="stat-label">☀️ Morning / सुबह की मात्रा</span>
            <span className="stat-value" style={{ color: '#d97706' }}>
              {liveTotals.morningTotal.toFixed(2)} L
            </span>
            <span className="stat-sub">
              भैंस: <strong>{liveTotals.morningBuffalo.toFixed(2)}L</strong> | गाय: <strong>{liveTotals.morningCow.toFixed(2)}L</strong>
            </span>
          </div>
          <div className="stat-icon amber"><Sun size={22} /></div>
        </div>

        {/* Card 3: Evening Shift Subtotal */}
        <div className="stat-card" style={{ borderLeft: '4px solid #6366f1' }}>
          <div className="stat-content">
            <span className="stat-label">🌙 Evening / शाम की मात्रा</span>
            <span className="stat-value" style={{ color: '#4f46e5' }}>
              {liveTotals.eveningTotal.toFixed(2)} L
            </span>
            <span className="stat-sub">
              भैंस: <strong>{liveTotals.eveningBuffalo.toFixed(2)}L</strong> | गाय: <strong>{liveTotals.eveningCow.toFixed(2)}L</strong>
            </span>
          </div>
          <div className="stat-icon purple"><Moon size={22} /></div>
        </div>

        {/* Card 4: Cow vs Buffalo Full Day */}
        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-content">
            <span className="stat-label">🥛 Milk Type Breakdown / प्रकार अनुसार</span>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>भैंस (Buffalo)</span>
                <strong style={{ fontSize: '1.1rem', color: '#1e293b' }}>{liveTotals.totalBuffalo.toFixed(2)} L</strong>
              </div>
              <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>गाय (Cow)</span>
                <strong style={{ fontSize: '1.1rem', color: '#0369a1' }}>{liveTotals.totalCow.toFixed(2)} L</strong>
              </div>
            </div>
            <span className="stat-sub" style={{ marginTop: '0.35rem' }}>Full day combined sum</span>
          </div>
          <div className="stat-icon green"><Calculator size={22} /></div>
        </div>
      </div>

      {/* Full Day Calculation Live Bar */}
      <div style={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        padding: '0.85rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Calculator size={18} color="var(--color-primary)" />
          <div>
            <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.92rem' }}>
              Full Day Calculation Summary (सम्पूर्ण दिन का हिसाब) — {selectedDate}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#3b82f6' }}>
              ☀️ Morning: <strong>{liveTotals.morningTotal.toFixed(2)} L</strong> (Buffalo: {liveTotals.morningBuffalo.toFixed(2)}L, Cow: {liveTotals.morningCow.toFixed(2)}L) + 🌙 Evening: <strong>{liveTotals.eveningTotal.toFixed(2)} L</strong> (Buffalo: {liveTotals.eveningBuffalo.toFixed(2)}L, Cow: {liveTotals.eveningCow.toFixed(2)}L)
            </div>
          </div>
        </div>
        <div style={{
          background: '#ffffff',
          border: '1px solid #93c5fd',
          padding: '0.4rem 0.85rem',
          borderRadius: '6px',
          fontWeight: 700,
          color: '#1d4ed8',
          fontSize: '0.95rem'
        }}>
          Total Milk: {liveTotals.grandTotal.toFixed(2)} Liters
        </div>
      </div>

      {/* Customer Milk Input Sheet */}
      <div className="card" style={{ padding: 0 }}>
        <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0 }}>
              {selectedShift === 'FULL_DAY'
                ? 'Full Day Customer Milk Register (पूरा दिन - दोनों शिफ्ट)'
                : `${selectedShift === 'MORNING' ? '☀️ Morning Shift (सुबह)' : '🌙 Evening Shift (शाम)'} Register with Full Day Total`}
            </h3>
            <p className="card-subtitle" style={{ margin: 0 }}>
              {selectedShift === 'FULL_DAY'
                ? 'Enter or edit both Morning and Evening milk quantities together with live customer day totals.'
                : `Enter ${selectedShift === 'MORNING' ? 'Morning' : 'Evening'} quantities. Full day calculation updates dynamically.`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="badge badge-blue">
              {activeCustomers.length} Active Customers
            </span>
            <span className="badge badge-green">
              {liveTotals.totalActiveCustomersCount} Active Today
            </span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th style={{ width: '130px' }}>{t('customer.customerNumber')}</th>
                <th style={{ minWidth: '180px' }}>Customer Name / ग्राहक</th>

                {/* MORNING VIEW */}
                {selectedShift === 'MORNING' && (
                  <>
                    <th style={{ width: '135px' }}>☀️ Cow (गाय L)</th>
                    <th style={{ width: '135px' }}>☀️ Buffalo (भैंस L)</th>
                    <th style={{ width: '110px', textAlign: 'right' }}>☀️ Morning Subtotal</th>
                    <th style={{ width: '140px', textAlign: 'center' }}>🌙 Evening Recorded</th>
                    <th style={{ width: '120px', textAlign: 'right' }}>🏆 Day Total (दिन कुल)</th>
                  </>
                )}

                {/* EVENING VIEW */}
                {selectedShift === 'EVENING' && (
                  <>
                    <th style={{ width: '140px', textAlign: 'center' }}>☀️ Morning Recorded</th>
                    <th style={{ width: '135px' }}>🌙 Cow (गाय L)</th>
                    <th style={{ width: '135px' }}>🌙 Buffalo (भैंस L)</th>
                    <th style={{ width: '110px', textAlign: 'right' }}>🌙 Evening Subtotal</th>
                    <th style={{ width: '120px', textAlign: 'right' }}>🏆 Day Total (दिन कुल)</th>
                  </>
                )}

                {/* FULL DAY VIEW */}
                {selectedShift === 'FULL_DAY' && (
                  <>
                    <th style={{ width: '125px' }}>☀️ Morn Cow (गाय)</th>
                    <th style={{ width: '125px' }}>☀️ Morn Buf (भैंस)</th>
                    <th style={{ width: '125px' }}>🌙 Eve Cow (गाय)</th>
                    <th style={{ width: '125px' }}>🌙 Eve Buf (भैंस)</th>
                    <th style={{ width: '120px', textAlign: 'right' }}>🏆 Day Total (दिन कुल)</th>
                  </>
                )}

                <th style={{ minWidth: '130px' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>{t('common.loading')}</td></tr>
              ) : activeCustomers.length > 0 ? (
                activeCustomers.map((cust, idx) => {
                  const input = entryInputs[cust.id] || {}
                  const mCow = Number(input.morningCow) || 0
                  const mBuf = Number(input.morningBuffalo) || 0
                  const mSubtotal = mCow + mBuf

                  const eCow = Number(input.eveningCow) || 0
                  const eBuf = Number(input.eveningBuffalo) || 0
                  const eSubtotal = eCow + eBuf

                  const customerDayTotal = mSubtotal + eSubtotal

                  return (
                    <tr key={cust.id} style={{ background: customerDayTotal > 0 ? 'rgba(239, 246, 255, 0.35)' : undefined }}>
                      <td style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>{idx + 1}</td>
                      <td>
                        <span className="badge badge-blue" style={{ fontFamily: 'monospace' }}>
                          {cust.customerNumber}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {cust.nameByAdminHindi && cust.nameByAdminEnglish
                            ? `${cust.nameByAdminHindi} (${cust.nameByAdminEnglish})`
                            : (cust.nameByAdmin || cust.fullName)}
                          {cust.nickname ? ` (${cust.nickname})` : ''}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{cust.mobileNumber}</div>
                      </td>

                      {/* MORNING VIEW */}
                      {selectedShift === 'MORNING' && (
                        <>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <input
                                type="number"
                                step="0.25"
                                min="0"
                                className="form-control"
                                style={{ width: '85px', textAlign: 'right', fontWeight: 600, color: '#0369a1' }}
                                placeholder="0.00"
                                value={input.morningCow === 0 ? '' : input.morningCow}
                                onChange={(e) => handleInputChange(cust.id, 'morningCow', e.target.value)}
                              />
                              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>L</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <input
                                type="number"
                                step="0.25"
                                min="0"
                                className="form-control"
                                style={{ width: '85px', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}
                                placeholder="0.00"
                                value={input.morningBuffalo === 0 ? '' : input.morningBuffalo}
                                onChange={(e) => handleInputChange(cust.id, 'morningBuffalo', e.target.value)}
                              />
                              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>L</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: mSubtotal > 0 ? '#d97706' : '#94a3b8' }}>
                            {mSubtotal.toFixed(2)} L
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {eSubtotal > 0 ? (
                              <span className="badge badge-purple" style={{ fontSize: '0.78rem' }}>
                                {eSubtotal.toFixed(2)} L {eBuf > 0 && eCow > 0 ? `(भैंस:${eBuf}, गाय:${eCow})` : eBuf > 0 ? `(भैंस)` : `(गाय)`}
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>— 0.00 L</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <strong style={{
                              color: customerDayTotal > 0 ? 'var(--color-primary)' : '#94a3b8',
                              fontSize: '0.95rem'
                            }}>
                              {customerDayTotal.toFixed(2)} L
                            </strong>
                          </td>
                        </>
                      )}

                      {/* EVENING VIEW */}
                      {selectedShift === 'EVENING' && (
                        <>
                          <td style={{ textAlign: 'center' }}>
                            {mSubtotal > 0 ? (
                              <span className="badge badge-amber" style={{ fontSize: '0.78rem' }}>
                                {mSubtotal.toFixed(2)} L {mBuf > 0 && mCow > 0 ? `(भैंस:${mBuf}, गाय:${mCow})` : mBuf > 0 ? `(भैंस)` : `(गाय)`}
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>— 0.00 L</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <input
                                type="number"
                                step="0.25"
                                min="0"
                                className="form-control"
                                style={{ width: '85px', textAlign: 'right', fontWeight: 600, color: '#0369a1' }}
                                placeholder="0.00"
                                value={input.eveningCow === 0 ? '' : input.eveningCow}
                                onChange={(e) => handleInputChange(cust.id, 'eveningCow', e.target.value)}
                              />
                              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>L</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <input
                                type="number"
                                step="0.25"
                                min="0"
                                className="form-control"
                                style={{ width: '85px', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}
                                placeholder="0.00"
                                value={input.eveningBuffalo === 0 ? '' : input.eveningBuffalo}
                                onChange={(e) => handleInputChange(cust.id, 'eveningBuffalo', e.target.value)}
                              />
                              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>L</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: eSubtotal > 0 ? '#4f46e5' : '#94a3b8' }}>
                            {eSubtotal.toFixed(2)} L
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <strong style={{
                              color: customerDayTotal > 0 ? 'var(--color-primary)' : '#94a3b8',
                              fontSize: '0.95rem'
                            }}>
                              {customerDayTotal.toFixed(2)} L
                            </strong>
                          </td>
                        </>
                      )}

                      {/* FULL DAY VIEW */}
                      {selectedShift === 'FULL_DAY' && (
                        <>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <input
                                type="number"
                                step="0.25"
                                min="0"
                                className="form-control"
                                style={{ width: '80px', textAlign: 'right', fontWeight: 600, color: '#0369a1' }}
                                placeholder="0.0"
                                value={input.morningCow === 0 ? '' : input.morningCow}
                                onChange={(e) => handleInputChange(cust.id, 'morningCow', e.target.value)}
                              />
                              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>L</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <input
                                type="number"
                                step="0.25"
                                min="0"
                                className="form-control"
                                style={{ width: '80px', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}
                                placeholder="0.0"
                                value={input.morningBuffalo === 0 ? '' : input.morningBuffalo}
                                onChange={(e) => handleInputChange(cust.id, 'morningBuffalo', e.target.value)}
                              />
                              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>L</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <input
                                type="number"
                                step="0.25"
                                min="0"
                                className="form-control"
                                style={{ width: '80px', textAlign: 'right', fontWeight: 600, color: '#0369a1' }}
                                placeholder="0.0"
                                value={input.eveningCow === 0 ? '' : input.eveningCow}
                                onChange={(e) => handleInputChange(cust.id, 'eveningCow', e.target.value)}
                              />
                              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>L</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <input
                                type="number"
                                step="0.25"
                                min="0"
                                className="form-control"
                                style={{ width: '80px', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}
                                placeholder="0.0"
                                value={input.eveningBuffalo === 0 ? '' : input.eveningBuffalo}
                                onChange={(e) => handleInputChange(cust.id, 'eveningBuffalo', e.target.value)}
                              />
                              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>L</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <strong style={{
                              color: customerDayTotal > 0 ? 'var(--color-primary)' : '#94a3b8',
                              fontSize: '1rem'
                            }}>
                              {customerDayTotal.toFixed(2)} L
                            </strong>
                          </td>
                        </>
                      )}

                      <td>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Optional notes"
                          style={{ fontSize: '0.85rem' }}
                          value={selectedShift === 'EVENING' ? (input.eveningNotes || '') : (input.morningNotes || '')}
                          onChange={(e) => {
                            if (selectedShift === 'EVENING') handleInputChange(cust.id, 'eveningNotes', e.target.value)
                            else handleInputChange(cust.id, 'morningNotes', e.target.value)
                          }}
                        />
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No active customers registered. Please add customers first.
                  </td>
                </tr>
              )}
            </tbody>

            {/* Table Footer with Full Day Calculations */}
            {activeCustomers.length > 0 && (
              <tfoot>
                <tr style={{ background: '#f8fafc', fontWeight: 700, borderTop: '2px solid var(--color-border)' }}>
                  <td colSpan="3" style={{ textAlign: 'right', paddingRight: '1rem' }}>
                    Total Shift & Day Calculations:
                  </td>

                  {selectedShift === 'MORNING' && (
                    <>
                      <td style={{ color: '#0369a1' }}>{liveTotals.morningCow.toFixed(2)} L</td>
                      <td style={{ color: '#1e293b' }}>{liveTotals.morningBuffalo.toFixed(2)} L</td>
                      <td style={{ textAlign: 'right', color: '#d97706' }}>{liveTotals.morningTotal.toFixed(2)} L</td>
                      <td style={{ textAlign: 'center', color: '#4f46e5' }}>{liveTotals.eveningTotal.toFixed(2)} L</td>
                      <td style={{ textAlign: 'right', color: 'var(--color-primary)', fontSize: '1.05rem' }}>
                        {liveTotals.grandTotal.toFixed(2)} L
                      </td>
                    </>
                  )}

                  {selectedShift === 'EVENING' && (
                    <>
                      <td style={{ textAlign: 'center', color: '#d97706' }}>{liveTotals.morningTotal.toFixed(2)} L</td>
                      <td style={{ color: '#0369a1' }}>{liveTotals.eveningCow.toFixed(2)} L</td>
                      <td style={{ color: '#1e293b' }}>{liveTotals.eveningBuffalo.toFixed(2)} L</td>
                      <td style={{ textAlign: 'right', color: '#4f46e5' }}>{liveTotals.eveningTotal.toFixed(2)} L</td>
                      <td style={{ textAlign: 'right', color: 'var(--color-primary)', fontSize: '1.05rem' }}>
                        {liveTotals.grandTotal.toFixed(2)} L
                      </td>
                    </>
                  )}

                  {selectedShift === 'FULL_DAY' && (
                    <>
                      <td style={{ color: '#0369a1' }}>{liveTotals.morningCow.toFixed(2)} L</td>
                      <td style={{ color: '#1e293b' }}>{liveTotals.morningBuffalo.toFixed(2)} L</td>
                      <td style={{ color: '#0369a1' }}>{liveTotals.eveningCow.toFixed(2)} L</td>
                      <td style={{ color: '#1e293b' }}>{liveTotals.eveningBuffalo.toFixed(2)} L</td>
                      <td style={{ textAlign: 'right', color: 'var(--color-primary)', fontSize: '1.05rem' }}>
                        {liveTotals.grandTotal.toFixed(2)} L
                      </td>
                    </>
                  )}

                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'var(--color-bg-app)',
          borderTop: '1px solid var(--color-border)'
        }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            Summary: <strong>{liveTotals.totalActiveCustomersCount} active customers</strong> &bull; Morning: <strong style={{ color: '#d97706' }}>{liveTotals.morningTotal.toFixed(2)} L</strong> &bull; Evening: <strong style={{ color: '#4f46e5' }}>{liveTotals.eveningTotal.toFixed(2)} L</strong> &bull; Full Day Total: <strong style={{ color: 'var(--color-primary)', fontSize: '1rem' }}>{liveTotals.grandTotal.toFixed(2)} Liters</strong>
          </div>

          <button
            type="button"
            onClick={handleBulkSave}
            className="btn btn-primary"
            disabled={saving || loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, padding: '0.6rem 1.35rem' }}
          >
            <Save size={16} />
            <span>
              {saving
                ? 'Saving Records...'
                : selectedShift === 'FULL_DAY'
                ? 'Save Full Day Records / पूरा दिन सहेजें'
                : `Save ${selectedShift === 'MORNING' ? 'Morning (सुबह)' : 'Evening (शाम)'} Entries`}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
