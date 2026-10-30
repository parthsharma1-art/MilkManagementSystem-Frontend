import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import {
  UploadCloud,
  FileCheck2,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Sun,
  Moon,
  RefreshCw,
  Eye,
  Save,
  Check,
} from 'lucide-react'

export default function ImageUploadOcr() {
  const { t } = useTranslation()

  const todayStr = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(todayStr)
  const [shift, setShift] = useState('MORNING')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  const [activeCustomers, setActiveCustomers] = useState([])
  const [ocrResult, setOcrResult] = useState(null)
  const [editableEntries, setEditableEntries] = useState([])

  const [processing, setProcessing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/api/admin/customers/active')
      setActiveCustomers(res.data || [])
    } catch (err) {
      console.error('Failed to fetch customers for OCR matching', err)
    }
  }

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected) {
      if (!selected.type.startsWith('image/')) {
        setError('Please select an image file (JPEG, PNG, or WebP).')
        return
      }
      setFile(selected)
      setPreviewUrl(URL.createObjectURL(selected))
      setOcrResult(null)
      setEditableEntries([])
      setError('')
      setSuccess('')
    }
  }

  const handleRunOcr = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Please choose a register photograph first.')
      return
    }

    setProcessing(true)
    setError('')
    setSuccess('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('date', date)
    formData.append('shift', shift)

    try {
      const res = await api.post('/api/admin/ocr/upload', formData)
      const result = res.data
      setOcrResult(result)
      // Set editable preview entries
      setEditableEntries(
        result.parsedEntries.map((p, idx) => ({
          idx,
          originalLine: p.originalLine,
          customerId: p.matchedCustomerId || '',
          customerName: p.matchedCustomerName || '',
          customerNumber: p.matchedCustomerNumber || '',
          milkType: p.milkType || 'COW',
          quantity: p.quantity || 1.0,
          confidence: p.confidenceScore || 0.5,
          uncertain: p.uncertain,
          warningMessage: p.warningMessage,
        }))
      )
      setSuccess(`OCR text parsed successfully. Extracted ${result.totalExtracted} lines (${result.matchedCount} matched, ${result.uncertainCount} uncertain).`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process OCR image.')
    } finally {
      setProcessing(false)
    }
  }

  const handleEntryChange = (idx, field, value) => {
    setEditableEntries((prev) =>
      prev.map((e) => {
        if (e.idx === idx) {
          const updated = { ...e, [field]: value }
          if (field === 'customerId') {
            const found = activeCustomers.find((c) => c.id === value)
            if (found) {
              updated.customerName = found.fullName
              updated.customerNumber = found.customerNumber
              updated.uncertain = false
              updated.warningMessage = ''
            }
          }
          return updated
        }
        return e
      })
    )
  }

  const handleConfirmVerified = async () => {
    if (!ocrResult?.uploadId) return

    // Check if any row has no matched customer
    const unmatched = editableEntries.some((e) => !e.customerId)
    if (unmatched) {
      setError('Please select a valid customer for all rows before confirming.')
      return
    }

    setConfirming(true)
    setError('')
    setSuccess('')

    const payload = {
      milkDate: date,
      shift,
      entries: editableEntries.map((e) => ({
        customerId: e.customerId,
        milkType: e.milkType,
        quantity: Number(e.quantity),
        notes: `OCR from ${file?.name || 'Register'}`,
      })),
    }

    try {
      await api.post('/api/admin/ocr/confirm', payload, {
        params: { uploadId: ocrResult.uploadId },
      })
      setSuccess(`Successfully confirmed and saved ${editableEntries.length} verified records to daily milk entries!`)
      setOcrResult(null)
      setFile(null)
      setPreviewUrl(null)
      setEditableEntries([])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm OCR entries.')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>{t('ocr.title')}</h2>
        <p className="card-subtitle">{t('ocr.subtitle')}</p>
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

      {/* Step 1 & 2: Controls and File Upload */}
      <div className="grid-cols-2" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <h3>{t('ocr.step1')}</h3>
          </div>
          <div className="form-group">
            <label className="form-label">{t('milk.date')}</label>
            <input
              type="date"
              className="form-control"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('milk.shift')}</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className={`btn ${shift === 'MORNING' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setShift('MORNING')}
              >
                <Sun size={16} />
                <span>{t('milk.morning')}</span>
              </button>
              <button
                type="button"
                className={`btn ${shift === 'EVENING' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setShift('EVENING')}
              >
                <Moon size={16} />
                <span>{t('milk.evening')}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>{t('ocr.step2')}</h3>
          </div>
          <div className="form-group">
            <label className="form-label">{t('ocr.chooseFile')}</label>
            <input
              type="file"
              accept="image/*"
              className="form-control"
              onChange={handleFileChange}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRunOcr}
              disabled={!file || processing}
            >
              <UploadCloud size={16} />
              <span>{processing ? t('ocr.processing') : t('ocr.processOcrBtn')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Image Preview & Raw Text Dropdown if available */}
      {previewUrl && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3>Uploaded Register Photograph</h3>
            <span className="badge badge-gray">{file?.name}</span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ maxWidth: '400px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <img src={previewUrl} alt="Register Preview" style={{ width: '100%', display: 'block' }} />
            </div>
            {ocrResult?.rawOcrText && (
              <div style={{ flex: 1, minWidth: '300px' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>
                  {t('ocr.originalText')}
                </h4>
                <pre style={{
                  background: 'var(--color-bg-app)',
                  color: 'var(--color-text-main)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.85rem',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                }}>
                  {ocrResult.rawOcrText}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3 & 4: OCR Verification Preview Table */}
      {ocrResult && editableEntries.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', margin: 0 }}>
            <div>
              <h3>{t('ocr.previewTitle')}</h3>
              <p className="card-subtitle">{t('ocr.previewSubtitle')}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="badge badge-warning">
                <AlertTriangle size={13} /> {ocrResult.uncertainCount} Uncertain
              </span>
              <span className="badge badge-success">
                <CheckCircle size={13} /> {ocrResult.matchedCount} Matched
              </span>
            </div>
          </div>

          <div style={{ padding: '0.75rem 1.5rem', background: 'var(--color-warning-bg)', borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem', color: 'var(--color-warning)' }}>
            {t('ocr.uncertainNotice')}
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '220px' }}>{t('ocr.originalLine')}</th>
                  <th>{t('ocr.matchedCustomer')}</th>
                  <th style={{ width: '160px' }}>{t('milk.type')}</th>
                  <th style={{ width: '130px' }}>{t('milk.quantity')}</th>
                  <th>Status & Confidence</th>
                </tr>
              </thead>
              <tbody>
                {editableEntries.map((row) => (
                  <tr key={row.idx} className={row.uncertain ? 'highlight-uncertain' : ''}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                      {row.originalLine}
                    </td>
                    <td>
                      <select
                        className="form-control"
                        value={row.customerId}
                        onChange={(e) => handleEntryChange(row.idx, 'customerId', e.target.value)}
                        style={{ borderColor: !row.customerId ? '#ef4444' : undefined }}
                      >
                        <option value="">-- Select Customer (कृपया ग्राहक चुनें) --</option>
                        {activeCustomers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.customerNumber} - {c.fullName}
                          </option>
                        ))}
                      </select>
                      {row.warningMessage && (
                        <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '2px' }}>
                          ⚠️ {row.warningMessage}
                        </div>
                      )}
                    </td>
                    <td>
                      <select
                        className="form-control"
                        value={row.milkType}
                        onChange={(e) => handleEntryChange(row.idx, 'milkType', e.target.value)}
                      >
                        <option value="COW">{t('milk.cow')}</option>
                        <option value="BUFFALO">{t('milk.buffalo')}</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <input
                          type="number"
                          step="0.25"
                          min="0.1"
                          className="form-control"
                          value={row.quantity}
                          onChange={(e) => handleEntryChange(row.idx, 'quantity', e.target.value)}
                          style={{ textAlign: 'right', fontWeight: 600 }}
                        />
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>L</span>
                      </div>
                    </td>
                    <td>
                      {row.uncertain ? (
                        <span className="badge badge-warning">
                          <AlertTriangle size={12} /> Review Needed ({(row.confidence * 100).toFixed(0)}%)
                        </span>
                      ) : (
                        <span className="badge badge-success">
                          <Check size={12} /> Matched ({(row.confidence * 100).toFixed(0)}%)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '1.25rem 1.5rem', background: 'var(--color-bg-app)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setOcrResult(null); setEditableEntries([]); }}
            >
              {t('ocr.retry')}
            </button>
            <button
              type="button"
              className="btn btn-success"
              onClick={handleConfirmVerified}
              disabled={confirming}
            >
              <FileCheck2 size={16} />
              <span>{confirming ? 'Saving Verified Records...' : t('ocr.confirmAndSave')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
