import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import { saveDraft, getDraft, clearDraft, queueOfflineAction } from '../utils/draftStorage'
import {
  UploadCloud,
  FileCheck2,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Sun,
  Moon,
  Trash2,
  PlusCircle,
  Sparkles,
  Eye,
  Check,
  RefreshCw,
  Layers,
  UserCheck,
  UserPlus,
  X,
  Phone,
  Mail,
  User,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  List,
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
  const [batchCreating, setBatchCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Small Create Customer Modal States (Mobile & Email)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [modalRowId, setModalRowId] = useState(null)
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createModalError, setCreateModalError] = useState('')
  const [createFormData, setCreateFormData] = useState({
    nameByAdmin: '',
    nameByCustomer: '',
    mobileNumber: '',
    email: '',
  })

  // Batch Create Customers One-by-One States
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [batchList, setBatchList] = useState([])
  const [batchIndex, setBatchIndex] = useState(0)
  const [batchViewMode, setBatchViewMode] = useState('one-by-one') // 'one-by-one' | 'all-list'
  const [batchSubmitting, setBatchSubmitting] = useState(false)
  const [batchError, setBatchError] = useState('')
  const [batchSuccessCount, setBatchSuccessCount] = useState(0)

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
    if (e) e.preventDefault()
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

      // Initialize editable entries with both Buffalo and Cow milk quantities
      const entries = (result.parsedEntries || []).map((p, idx) => {
        const rawBuf = p.buffaloQuantity != null ? Number(p.buffaloQuantity) : (p.milkType !== 'COW' ? Number(p.quantity || 1.0) : 0)
        const rawCow = p.cowQuantity != null ? Number(p.cowQuantity) : (p.milkType === 'COW' ? Number(p.quantity || 1.0) : 0)
        const total = (rawBuf + rawCow > 0) ? (rawBuf + rawCow) : Number(p.quantity || 1.0)

        return {
          id: idx + 1,
          originalLine: p.originalLine || p.user || '',
          extractedName: p.extractedNameOrNumber || p.user || '',
          customerId: p.customerId || p.matchedCustomerId || '',
          customerName: p.customerName || p.matchedCustomerName || '',
          customerNumber: p.customerNumber || p.matchedCustomerNumber || '',
          buffaloQuantity: rawBuf > 0 ? rawBuf : (rawCow === 0 ? total : 0),
          cowQuantity: rawCow,
          quantity: total,
          confidence: p.confidenceScore || 0.5,
          uncertain: p.uncertain,
          warningMessage: p.warningMessage || '',
          creating: false,
        }
      })

      setEditableEntries(entries)
      setSuccess(`AI successfully extracted ${entries.length} entries! Review, edit if needed, and confirm below.`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process register image. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const handleOpenCreateModal = (row) => {
    const rawName = (row.extractedName || row.originalLine || '').trim()
    setModalRowId(row.id)
    const saved = getDraft('ocr_quick_create_draft')
    setCreateFormData({
      nameByAdmin: rawName,
      nameByCustomer: rawName,
      mobileNumber: saved?.mobileNumber || '',
      email: saved?.email || '',
    })
    setCreateModalError('')
    setShowCreateModal(true)
  }

  const handleSaveModalCustomer = async (e) => {
    e.preventDefault()
    const cleanAdminName = (createFormData.nameByAdmin || '').trim()
    if (!cleanAdminName) {
      setCreateModalError('Unique Admin Register Name (nameByAdmin) is required.')
      return
    }
    const cleanMobile = (createFormData.mobileNumber || '').trim()
    if (!cleanMobile) {
      setCreateModalError('Mobile number is required for customer login.')
      return
    }
    if (!/^[0-9]{10,15}$/.test(cleanMobile)) {
      setCreateModalError('Mobile number must be a valid 10-15 digit phone number.')
      return
    }

    // Check duplicate nameByAdmin against existing customers
    const dupName = activeCustomers.find(
      (c) => (c.nameByAdmin && c.nameByAdmin.trim().toLowerCase() === cleanAdminName.toLowerCase()) ||
             (c.nameByAdminHindi && c.nameByAdminHindi.trim().toLowerCase() === cleanAdminName.toLowerCase()) ||
             (c.nameByAdminEnglish && c.nameByAdminEnglish.trim().toLowerCase() === cleanAdminName.toLowerCase())
    )
    if (dupName) {
      setCreateModalError(`Customer with Admin Name "${cleanAdminName}" already exists (Customer ${dupName.customerNumber} - ${dupName.nameByAdmin || dupName.fullName}). nameByAdmin must be unique!`)
      return
    }

    setCreateSubmitting(true)
    setCreateModalError('')

    // Save draft in case of failure
    saveDraft('ocr_quick_create_draft', createFormData)

    try {
      const res = await api.post('/api/admin/customers/quick-create', {
        nameByAdmin: cleanAdminName,
        nameByCustomer: createFormData.nameByCustomer?.trim() || cleanAdminName,
        mobileNumber: cleanMobile,
        email: createFormData.email?.trim() || null,
      })
      const newCust = res.data

      // Clear draft on success
      clearDraft('ocr_quick_create_draft')

      // Add to active customers list
      setActiveCustomers((prev) => {
        if (prev.some((c) => c.id === newCust.id)) return prev
        return [...prev, newCust]
      })

      // Link any matching row in the editable entries
      const targetName = cleanAdminName.toLowerCase()
      setEditableEntries((prev) =>
        prev.map((row) => {
          const isTarget = row.id === modalRowId || (row.extractedName && row.extractedName.trim().toLowerCase() === targetName)
          if (isTarget) {
            return {
              ...row,
              customerId: newCust.id,
              customerName: newCust.nameByAdmin || newCust.fullName,
              customerNumber: newCust.customerNumber,
              uncertain: false,
              warningMessage: '',
              creating: false,
            }
          }
          return row
        })
      )

      setSuccess(`✅ Successfully created customer "${newCust.nameByAdmin || newCust.fullName}" (${newCust.customerNumber})! Credentials sent via SMS to ${newCust.mobileNumber}.`)
      setShowCreateModal(false)
      setModalRowId(null)
    } catch (err) {
      saveDraft('ocr_quick_create_draft', createFormData)
      const isServerDown = !err.response || err.response.status >= 500
      if (isServerDown) {
        queueOfflineAction({
          action: 'QUICK_CREATE_CUSTOMER',
          endpoint: '/api/admin/customers/quick-create',
          method: 'POST',
          payload: createFormData,
          description: `Customer: ${createFormData.nameByAdmin}`,
        })
        setCreateModalError('Backend is offline! Your typed customer details have been saved to local draft so you will not lose them.')
      } else {
        setCreateModalError(err.response?.data?.message || 'Failed to create customer. Preserved in local draft.')
      }
    } finally {
      setCreateSubmitting(false)
    }
  }

  const handleQuickCreate = async (rowId, rawName) => {
    if (!rawName || !rawName.trim()) {
      setError('Please provide a name for the customer.')
      return
    }
    const cleanName = rawName.trim()
    setError('')
    try {
      setEditableEntries((prev) =>
        prev.map((e) => (e.id === rowId ? { ...e, creating: true } : e))
      )
      const res = await api.post('/api/admin/customers/quick-create', {
        nameByAdmin: cleanName,
      })
      const newCust = res.data
      setActiveCustomers((prev) => {
        if (prev.some((c) => c.id === newCust.id)) return prev
        return [...prev, newCust]
      })

      // Link any row with this extracted name
      setEditableEntries((prev) =>
        prev.map((e) => {
          const isTarget = e.id === rowId || (e.extractedName && e.extractedName.trim().toLowerCase() === cleanName.toLowerCase())
          if (isTarget) {
            return {
              ...e,
              customerId: newCust.id,
              customerName: newCust.nameByAdmin || newCust.fullName,
              customerNumber: newCust.customerNumber,
              uncertain: false,
              warningMessage: '',
              creating: false,
            }
          }
          return e
        })
      )
      setSuccess(`✅ Created customer "${newCust.nameByAdmin || newCust.fullName}" (${newCust.customerNumber}) with user login account!`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create customer.')
      setEditableEntries((prev) =>
        prev.map((e) => (e.id === rowId ? { ...e, creating: false } : e))
      )
    }
  }

  const handleOpenBatchModal = () => {
    const missingRows = editableEntries.filter((e) => !e.customerId && (e.extractedName || e.originalLine))
    if (missingRows.length === 0) return

    const distinctNames = Array.from(
      new Set(missingRows.map((r) => (r.extractedName || r.originalLine).trim()).filter(Boolean))
    )

    const items = distinctNames.map((name) => ({
      originalExtractedName: name,
      name: name, // Unique nameByAdmin editable by admin
      mobileNumber: '',
      email: '',
      status: 'pending',
      error: '',
    }))

    setBatchList(items)
    setBatchIndex(0)
    setBatchViewMode('one-by-one')
    setBatchError('')
    setBatchSuccessCount(0)
    setShowBatchModal(true)
  }

  const handleBatchFieldChange = (idx, field, val) => {
    setBatchList((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: val, error: '' }
      return next
    })
  }

  const handleSaveCurrentBatchCustomer = async (e) => {
    if (e) e.preventDefault()
    const current = batchList[batchIndex]
    if (!current) return

    // 1. Validate Unique nameByAdmin
    const cleanAdminName = (current.name || '').trim()
    if (!cleanAdminName) {
      setBatchError('Unique admin register name (nameByAdmin) is required.')
      return
    }

    // Check duplicate nameByAdmin within this batch list
    const duplicateNameInBatch = batchList.find(
      (item, idx) => idx !== batchIndex && item.name && item.name.trim().toLowerCase() === cleanAdminName.toLowerCase()
    )
    if (duplicateNameInBatch) {
      setBatchError(`Admin Name "${cleanAdminName}" is already entered for another customer in this batch. nameByAdmin must be unique!`)
      return
    }

    // Check duplicate nameByAdmin against existing customers
    const dupNameInDb = activeCustomers.find(
      (c) => (c.nameByAdmin && c.nameByAdmin.trim().toLowerCase() === cleanAdminName.toLowerCase()) ||
             (c.nameByAdminHindi && c.nameByAdminHindi.trim().toLowerCase() === cleanAdminName.toLowerCase()) ||
             (c.nameByAdminEnglish && c.nameByAdminEnglish.trim().toLowerCase() === cleanAdminName.toLowerCase())
    )
    if (dupNameInDb) {
      setBatchError(`Customer with Admin Name "${cleanAdminName}" already exists (Customer ${dupNameInDb.customerNumber} - ${dupNameInDb.nameByAdmin || dupNameInDb.fullName}). Please provide a unique nameByAdmin!`)
      return
    }

    // 2. Validate Mobile Number
    const cleanMobile = (current.mobileNumber || '').trim()
    if (!cleanMobile) {
      setBatchError(`Please provide a mobile number for "${cleanAdminName}".`)
      return
    }

    if (!/^[0-9]{10,15}$/.test(cleanMobile)) {
      setBatchError('Mobile number must be a valid 10-15 digit phone number.')
      return
    }

    // Check duplicate in current batch
    const duplicateInBatch = batchList.find(
      (item, idx) => idx !== batchIndex && item.mobileNumber && item.mobileNumber.trim() === cleanMobile
    )
    if (duplicateInBatch) {
      setBatchError(`Mobile number ${cleanMobile} is already entered for "${duplicateInBatch.name}". Each customer must have a unique mobile number.`)
      return
    }

    setBatchSubmitting(true)
    setBatchError('')

    try {
      const res = await api.post('/api/admin/customers/quick-create', {
        nameByAdmin: cleanAdminName,
        nameByCustomer: cleanAdminName,
        mobileNumber: cleanMobile,
        email: current.email?.trim() || null,
      })
      const newCust = res.data

      // Add to active customers
      setActiveCustomers((prev) => {
        if (prev.some((c) => c.id === newCust.id)) return prev
        return [...prev, newCust]
      })

      // Link any matching row in editableEntries
      const targetOrig = (current.originalExtractedName || '').toLowerCase()
      const targetNew = cleanAdminName.toLowerCase()
      setEditableEntries((prev) =>
        prev.map((row) => {
          const rName = (row.extractedName || row.originalLine || '').trim().toLowerCase()
          if (rName === targetOrig || rName === targetNew) {
            return {
              ...row,
              customerId: newCust.id,
              customerName: newCust.nameByAdmin || newCust.fullName,
              customerNumber: newCust.customerNumber,
              uncertain: false,
              warningMessage: '',
              creating: false,
            }
          }
          return row
        })
      )

      // Mark current as done
      const updatedList = [...batchList]
      updatedList[batchIndex] = { ...current, name: cleanAdminName, status: 'done', error: '' }
      setBatchList(updatedList)

      const nextCount = batchSuccessCount + 1
      setBatchSuccessCount(nextCount)

      // Advance to next customer or finish
      if (batchIndex < batchList.length - 1) {
        setBatchIndex(batchIndex + 1)
      } else {
        setShowBatchModal(false)
        setSuccess(`✅ Successfully registered all ${nextCount} customer accounts with unique Admin Names & mobile login credentials! All diary entries are matched.`)
      }
    } catch (err) {
      setBatchError(err.response?.data?.message || `Failed to create customer "${cleanAdminName}".`)
    } finally {
      setBatchSubmitting(false)
    }
  }

  const handleSkipBatchCustomer = () => {
    setBatchError('')
    if (batchIndex < batchList.length - 1) {
      setBatchIndex(batchIndex + 1)
    } else {
      setShowBatchModal(false)
      if (batchSuccessCount > 0) {
        setSuccess(`✅ Created ${batchSuccessCount} customer accounts.`)
      }
    }
  }

  const handleSaveAllBatchList = async () => {
    // Validate all items have unique nameByAdmin and mobile numbers
    for (let i = 0; i < batchList.length; i++) {
      const it = batchList[i]
      if (it.status === 'done') continue
      const name = (it.name || '').trim()
      if (!name) {
        setBatchError(`Row #${i + 1}: Unique Admin Register Name (nameByAdmin) is required.`)
        return
      }
      const num = (it.mobileNumber || '').trim()
      if (!num || !/^[0-9]{10,15}$/.test(num)) {
        setBatchError(`Row #${i + 1} (${name}): Valid 10-15 digit mobile number is required.`)
        return
      }
    }

    // Check duplicate names and phones within the list
    const namesSeen = new Set()
    const numbersSeen = new Set()
    for (let i = 0; i < batchList.length; i++) {
      const name = batchList[i].name?.trim().toLowerCase()
      if (name) {
        if (namesSeen.has(name)) {
          setBatchError(`Duplicate Admin Name "${batchList[i].name}" found in list. Each customer must have a unique nameByAdmin!`)
          return
        }
        namesSeen.add(name)
      }
      const num = batchList[i].mobileNumber?.trim()
      if (num) {
        if (numbersSeen.has(num)) {
          setBatchError(`Duplicate mobile number "${num}" found in list. Each customer must have a unique mobile number.`)
          return
        }
        numbersSeen.add(num)
      }
    }

    setBatchSubmitting(true)
    setBatchError('')
    let successCount = batchSuccessCount

    try {
      for (let i = 0; i < batchList.length; i++) {
        const item = batchList[i]
        if (item.status === 'done') continue

        const cleanAdminName = item.name.trim()
        const cleanMobile = item.mobileNumber.trim()

        try {
          const res = await api.post('/api/admin/customers/quick-create', {
            nameByAdmin: cleanAdminName,
            nameByCustomer: cleanAdminName,
            mobileNumber: cleanMobile,
            email: item.email?.trim() || null,
          })
          const newCust = res.data
          setActiveCustomers((prev) => {
            if (prev.some((c) => c.id === newCust.id)) return prev
            return [...prev, newCust]
          })

          const targetOrig = (item.originalExtractedName || '').toLowerCase()
          const targetNew = cleanAdminName.toLowerCase()
          setEditableEntries((prev) =>
            prev.map((row) => {
              const rName = (row.extractedName || row.originalLine || '').trim().toLowerCase()
              if (rName === targetOrig || rName === targetNew) {
                return {
                  ...row,
                  customerId: newCust.id,
                  customerName: newCust.nameByAdmin || newCust.fullName,
                  customerNumber: newCust.customerNumber,
                  uncertain: false,
                  warningMessage: '',
                  creating: false,
                }
              }
              return row
            })
          )

          batchList[i].status = 'done'
          batchList[i].error = ''
          successCount++
        } catch (itemErr) {
          batchList[i].status = 'error'
          batchList[i].error = itemErr.response?.data?.message || 'Failed'
          console.warn(`Failed for ${cleanAdminName}:`, itemErr)
        }
      }

      setBatchList([...batchList])
      setBatchSuccessCount(successCount)
      const hasErrors = batchList.some((it) => it.status === 'error')
      if (!hasErrors) {
        setShowBatchModal(false)
        setSuccess(`✅ Successfully created all ${successCount} customers with unique Admin Names & user login credentials!`)
      } else {
        setBatchError('Some customers could not be created. Please review the errors highlighted below.')
      }
    } finally {
      setBatchSubmitting(false)
    }
  }

  const handleEntryChange = (id, field, value) => {
    setEditableEntries((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          const updated = { ...e, [field]: value }
          if (field === 'customerId') {
            const found = activeCustomers.find((c) => c.id === value)
            if (found) {
              updated.customerName = found.nameByAdmin || found.fullName
              updated.customerNumber = found.customerNumber
              updated.uncertain = false
              updated.warningMessage = ''
            } else {
              updated.customerName = ''
              updated.customerNumber = ''
              updated.uncertain = true
            }
          }
          if (field === 'buffaloQuantity' || field === 'cowQuantity') {
            const b = field === 'buffaloQuantity' ? (Number(value) || 0) : (Number(updated.buffaloQuantity) || 0)
            const c = field === 'cowQuantity' ? (Number(value) || 0) : (Number(updated.cowQuantity) || 0)
            updated.quantity = b + c
          }
          return updated
        }
        return e
      })
    )
  }

  const handleDeleteEntry = (id) => {
    setEditableEntries((prev) => prev.filter((e) => e.id !== id))
  }

  const handleAddEntry = () => {
    const newId = editableEntries.length > 0 ? Math.max(...editableEntries.map((e) => e.id)) + 1 : 1
    const newRow = {
      id: newId,
      originalLine: 'Manual entry',
      extractedName: '',
      customerId: '',
      customerName: '',
      customerNumber: '',
      buffaloQuantity: 1.0,
      cowQuantity: 0.0,
      quantity: 1.0,
      confidence: 1.0,
      uncertain: true,
      warningMessage: 'Please select customer',
    }
    setEditableEntries((prev) => [...prev, newRow])
  }

  const handleConfirmVerified = async () => {
    if (!ocrResult?.uploadId) return

    if (editableEntries.length === 0) {
      setError('No milk entries to confirm.')
      return
    }

    const unmatched = editableEntries.some((e) => !e.customerId)
    if (unmatched) {
      setError('Please select a registered customer for all highlighted rows before confirming.')
      return
    }

    setConfirming(true)
    setError('')
    setSuccess('')

    const payloadEntries = []
    for (const row of editableEntries) {
      const bufQty = Number(row.buffaloQuantity) || 0
      const cowQty = Number(row.cowQuantity) || 0

      if (bufQty <= 0 && cowQty <= 0) {
        setError(`Please enter at least one quantity (Buffalo or Cow milk) for "${row.customerName || row.extractedName || 'Customer'}".`)
        setConfirming(false)
        return
      }

      if (bufQty > 0) {
        payloadEntries.push({
          customerId: row.customerId,
          milkType: 'BUFFALO',
          quantity: bufQty,
          buffaloQuantity: bufQty,
          notes: `AI Register OCR (${file?.name || 'photo'})`,
        })
      }

      if (cowQty > 0) {
        payloadEntries.push({
          customerId: row.customerId,
          milkType: 'COW',
          quantity: cowQty,
          cowQuantity: cowQty,
          notes: `AI Register OCR (${file?.name || 'photo'})`,
        })
      }
    }

    const payload = {
      milkDate: date,
      shift,
      entries: payloadEntries,
    }

    try {
      await api.post('/api/admin/ocr/confirm', payload, {
        params: { uploadId: ocrResult.uploadId },
      })
      clearDraft('ocr_entries_draft')
      setSuccess(`✅ Successfully saved verified records directly to the daily milk ledger!`)
      setOcrResult(null)
      setFile(null)
      setPreviewUrl(null)
      setEditableEntries([])
    } catch (err) {
      saveDraft('ocr_entries_draft', { date, shift, entries: editableEntries, uploadId: ocrResult.uploadId })
      const isServerDown = !err.response || err.response.status >= 500
      if (isServerDown) {
        queueOfflineAction({
          action: 'CONFIRM_OCR_ENTRIES',
          endpoint: `/api/admin/ocr/confirm?uploadId=${ocrResult.uploadId}`,
          method: 'POST',
          payload,
          description: `${payloadEntries.length} milk records for ${date} (${shift})`,
        })
        setError('Backend server offline! Your verified entries are safely preserved in local storage draft. You will not lose your work and do not need to re-scan.')
      } else {
        setError(err.response?.data?.message || 'Failed to confirm and save entries. All verified entries remain saved locally.')
      }
    } finally {
      setConfirming(false)
    }
  }

  const totalBuffalo = editableEntries.reduce((sum, e) => sum + (Number(e.buffaloQuantity) || 0), 0)
  const totalCow = editableEntries.reduce((sum, e) => sum + (Number(e.cowQuantity) || 0), 0)
  const totalQuantity = totalBuffalo + totalCow
  const unmatchedCount = editableEntries.filter((e) => !e.customerId).length

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Sparkles size={24} color="#0284c7" />
          <h2 style={{ margin: 0 }}>{t('ocr.title')} (AI Hindi & English)</h2>
        </div>
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
            <h3>Step 1: Date & Shift / तारीख और पाली</h3>
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
                <span>{t('milk.morning')} (सुबह)</span>
              </button>
              <button
                type="button"
                className={`btn ${shift === 'EVENING' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setShift('EVENING')}
              >
                <Moon size={16} />
                <span>{t('milk.evening')} (शाम)</span>
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Step 2: Upload Register Photo / रजिस्टर फोटो चुनें</h3>
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
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {processing ? (
                <>
                  <RefreshCw size={16} className="spin" />
                  <span>AI Extracting Text & Milk / डेटा निकाला जा रहा है...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Extract Milk Entries / डेटा निकालें</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Step 3: Split View - Image and Extracted Text */}
      {previewUrl && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Eye size={18} />
              <span>Image to Text Comparison / फोटो और निकाला गया डेटा</span>
            </h3>
            <span className="badge badge-gray">{file?.name}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
            {/* Left Box: Photo */}
            <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#000' }}>
              <img
                src={previewUrl}
                alt="Register Preview"
                style={{ width: '100%', maxHeight: '360px', objectFit: 'contain', display: 'block' }}
              />
              <div style={{ padding: '0.5rem 0.75rem', background: 'var(--color-bg-muted)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Original Diary / Register Photo
              </div>
            </div>

            {/* Right Box: Extracted Text */}
            <div>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-main)' }}>
                <Sparkles size={15} color="#0284c7" />
                <span>AI Detected Text / निकाला गया टेक्स्ट</span>
              </h4>
              <div style={{
                background: 'var(--color-bg-app)',
                color: 'var(--color-text-main)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                minHeight: '180px',
                maxHeight: '320px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6
              }}>
                {ocrResult?.rawOcrText || (processing ? 'Analyzing image with AI...' : 'Click "Extract Milk Entries" to analyze.')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Verification and Editable Table */}
      {ocrResult && editableEntries.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Edit & Confirm Entries / संपादन और पुष्टि करें</h3>
              <p className="card-subtitle" style={{ margin: 0 }}>
                Review customer mappings and quantities. Edit any value directly before saving.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span className="badge badge-blue">
                <Layers size={13} /> {editableEntries.length} entries &bull; Buffalo: {totalBuffalo.toFixed(2)} L &bull; Cow: {totalCow.toFixed(2)} L &bull; Total: {totalQuantity.toFixed(2)} L
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddEntry}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <PlusCircle size={15} />
                <span>Add Row / प्रविष्टि जोड़ें</span>
              </button>
            </div>
          </div>

          {unmatchedCount > 0 && (
            <div style={{
              margin: '1rem 1.5rem',
              padding: '0.85rem 1.15rem',
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <AlertTriangle size={20} color="#d97706" />
                <div>
                  <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.925rem' }}>
                    {unmatchedCount} Unregistered Customer{unmatchedCount > 1 ? 's' : ''} Detected in Register Photo
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#b45309' }}>
                    Click below to create customer accounts by entering their mobile numbers one by one:
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleOpenBatchModal}
                style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600, padding: '0.5rem 1rem' }}
              >
                <UserPlus size={16} />
                <span>⚡ Create All {unmatchedCount} Customers (One by One) / सभी नए ग्राहक बनाएं</span>
              </button>
            </div>
          )}

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th style={{ width: '180px' }}>Extracted Name / लिखा नाम</th>
                  <th>Assign Customer / ग्राहक चुनें</th>
                  <th style={{ width: '140px' }}>Buffalo Milk / भैंस (L)</th>
                  <th style={{ width: '140px' }}>Cow Milk / गाय (L)</th>
                  <th style={{ width: '110px' }}>Total / कुल (L)</th>
                  <th style={{ width: '120px' }}>Status</th>
                  <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {editableEntries.map((row, idx) => (
                  <tr key={row.id} className={row.uncertain ? 'highlight-uncertain' : ''}>
                    <td style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                        {row.extractedName || row.originalLine}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                        {row.originalLine}
                      </div>
                    </td>
                    <td>
                      <select
                        className="form-control"
                        value={row.customerId}
                        onChange={(e) => handleEntryChange(row.id, 'customerId', e.target.value)}
                        style={{ borderColor: !row.customerId ? '#ef4444' : undefined }}
                      >
                        <option value="">-- Select Customer (कृपया ग्राहक चुनें) --</option>
                        {activeCustomers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.customerNumber} - {c.nameByAdminHindi && c.nameByAdminEnglish ? `${c.nameByAdminHindi} (${c.nameByAdminEnglish})` : (c.nameByAdmin || c.fullName)} {c.nickname ? `(${c.nickname})` : ''}
                          </option>
                        ))}
                      </select>

                      {/* Small entity card & Create Customer button when unregistered */}
                      {!row.customerId && (
                        <div style={{
                          marginTop: '0.5rem',
                          padding: '0.45rem 0.65rem',
                          background: '#fef3c7',
                          border: '1px dashed #f59e0b',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem'
                        }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#92400e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              New: {row.extractedName || row.originalLine}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#b45309' }}>
                              Not in DB &bull; Register name
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={row.creating}
                            onClick={() => handleOpenCreateModal(row)}
                            style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem', whiteSpace: 'nowrap' }}
                          >
                            ➕ Create Customer / ग्राहक बनाएं
                          </button>
                        </div>
                      )}

                      {row.warningMessage && row.customerId && (
                        <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '3px' }}>
                          ⚠️ {row.warningMessage}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          className="form-control"
                          value={row.buffaloQuantity === 0 ? '' : row.buffaloQuantity}
                          placeholder="0.0"
                          onChange={(e) => handleEntryChange(row.id, 'buffaloQuantity', e.target.value)}
                          style={{ textAlign: 'right', fontWeight: 600, color: '#1e293b' }}
                        />
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>L</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          className="form-control"
                          value={row.cowQuantity === 0 ? '' : row.cowQuantity}
                          placeholder="0.0"
                          onChange={(e) => handleEntryChange(row.id, 'cowQuantity', e.target.value)}
                          style={{ textAlign: 'right', fontWeight: 600, color: '#0369a1' }}
                        />
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>L</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', textAlign: 'right', paddingRight: '0.5rem', color: (Number(row.buffaloQuantity || 0) + Number(row.cowQuantity || 0)) > 0 ? 'var(--color-primary)' : '#94a3b8' }}>
                        {((Number(row.buffaloQuantity) || 0) + (Number(row.cowQuantity) || 0)).toFixed(2)} L
                      </div>
                    </td>
                    <td>
                      {row.customerId ? (
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <UserCheck size={12} /> Ready
                        </span>
                      ) : (
                        <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <AlertTriangle size={12} /> Assign Customer
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteEntry(row.id)}
                        className="btn btn-secondary btn-sm"
                        title="Delete row"
                        style={{ color: '#ef4444', padding: '0.35rem 0.5rem' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '1.25rem 1.5rem', background: 'var(--color-bg-app)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              Total Verified: <strong>{editableEntries.length} entries</strong> &bull; Buffalo (भैंस): <strong style={{ color: '#1e293b' }}>{totalBuffalo.toFixed(2)} L</strong> &bull; Cow (गाय): <strong style={{ color: '#0369a1' }}>{totalCow.toFixed(2)} L</strong> &bull; Combined: <strong style={{ color: 'var(--color-primary)' }}>{totalQuantity.toFixed(2)} Liters</strong>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setOcrResult(null); setEditableEntries([]) }}
              >
                Clear / रीसेट करें
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleConfirmVerified}
                disabled={confirming || editableEntries.length === 0}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem' }}
              >
                <FileCheck2 size={18} />
                <span>{confirming ? 'Saving Verified Records...' : 'Save & Record in Daily Ledger / लेजर में सहेजें'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Small Modal: Create Customer with Mobile Number & Email */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={20} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>
                  Create Customer / नया ग्राहक जोड़ें
                </h3>
              </div>
              <button
                type="button"
                onClick={() => { setShowCreateModal(false); setModalRowId(null); }}
                className="btn btn-secondary btn-sm"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveModalCustomer}>
              <div className="modal-body">
                <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Provide mobile number and optional email to register customer account and automatically link to this entry.
                </p>

                {createModalError && (
                  <div className="alert alert-danger" style={{ marginBottom: '1rem', padding: '0.6rem 0.85rem' }}>
                    <AlertCircle size={16} />
                    <span style={{ fontSize: '0.85rem' }}>{createModalError}</span>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Register Name (nameByAdmin) *</span>
                    <span style={{ fontSize: '0.72rem', color: '#0369a1', background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                      From Image
                    </span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--color-text-muted)' }} />
                    <input
                      type="text"
                      className="form-control"
                      style={{ paddingLeft: '34px', fontWeight: 600 }}
                      value={createFormData.nameByAdmin}
                      onChange={(e) => setCreateFormData({
                        ...createFormData,
                        nameByAdmin: e.target.value,
                        nameByCustomer: e.target.value
                      })}
                      placeholder="e.g. Gupta / गुप्ता"
                      required
                    />
                  </div>
                  <small style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '3px' }}>
                    Hindi or English is accepted; the system will automatically convert &amp; save both scripts.
                  </small>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">
                    Mobile Number (मोबाइल नंबर) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--color-text-muted)' }} />
                    <input
                      type="tel"
                      className="form-control"
                      style={{ paddingLeft: '34px' }}
                      value={createFormData.mobileNumber}
                      onChange={(e) => setCreateFormData({ ...createFormData, mobileNumber: e.target.value })}
                      placeholder="10-digit mobile number"
                      pattern="[0-9]{10,15}"
                      required
                      autoFocus
                    />
                  </div>
                  <small style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '3px' }}>
                    Used for customer login. Initial password is set to their <strong>mobile number</strong>.
                  </small>
                </div>

                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label className="form-label">
                    Email Address (ईमेल पता - Optional)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--color-text-muted)' }} />
                    <input
                      type="email"
                      className="form-control"
                      style={{ paddingLeft: '34px' }}
                      value={createFormData.email}
                      onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                      placeholder="customer@example.com (optional)"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--color-border)', padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setShowCreateModal(false); setModalRowId(null); }}
                  disabled={createSubmitting}
                >
                  Cancel / रद्द करें
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createSubmitting}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <UserPlus size={16} />
                  <span>{createSubmitting ? 'Creating...' : 'Create Customer / ग्राहक बनाएं'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Create Customers Modal (One by One & List) */}
      {showBatchModal && batchList.length > 0 && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserPlus size={18} color="#0284c7" />
                  <span>Register Customers from Photo / फोटो से ग्राहक बनाएं</span>
                </h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Add mobile numbers one by one to generate accounts and passwords.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="btn btn-secondary btn-sm"
              >
                <X size={16} />
              </button>
            </div>

            {/* Stepper / Progress Bar */}
            <div style={{ padding: '0.75rem 1.25rem', background: 'var(--color-bg-muted)', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', fontSize: '0.8rem' }}>
                <span style={{ fontWeight: 600 }}>
                  Customer {batchIndex + 1} of {batchList.length} ({Math.round(((batchSuccessCount) / batchList.length) * 100)}% registered)
                </span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${batchViewMode === 'one-by-one' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                    onClick={() => setBatchViewMode('one-by-one')}
                  >
                    One by One
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${batchViewMode === 'all-list' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                    onClick={() => setBatchViewMode('all-list')}
                  >
                    Table View
                  </button>
                </div>
              </div>

              {/* Customer Chips */}
              <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '4px' }}>
                {batchList.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { setBatchIndex(idx); setBatchError(''); }}
                    style={{
                      background: item.status === 'done' ? '#dcfce7' : idx === batchIndex ? '#0284c7' : '#f1f5f9',
                      color: item.status === 'done' ? '#166534' : idx === batchIndex ? '#ffffff' : '#475569',
                      border: idx === batchIndex ? '1px solid #0284c7' : '1px solid var(--color-border)',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    {item.status === 'done' ? <Check size={11} /> : <span>{idx + 1}.</span>}
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {batchError && (
              <div style={{ margin: '1rem 1.25rem 0' }}>
                <div className="alert alert-danger" style={{ margin: 0, padding: '0.6rem 0.85rem' }}>
                  <AlertCircle size={16} />
                  <span style={{ fontSize: '0.85rem' }}>{batchError}</span>
                </div>
              </div>
            )}

            {/* View 1: Step-by-Step One by One */}
            {batchViewMode === 'one-by-one' && batchList[batchIndex] && (
              <form onSubmit={handleSaveCurrentBatchCustomer}>
                <div className="modal-body" style={{ padding: '1.25rem' }}>
                  {/* Step Info Banner */}
                  <div style={{
                    padding: '0.65rem 0.9rem',
                    background: '#f8fafc',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge badge-blue">Customer {batchIndex + 1} of {batchList.length}</span>
                      {batchList[batchIndex].originalExtractedName && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                          Extracted from image: <strong style={{ color: 'var(--color-text-main)' }}>"{batchList[batchIndex].originalExtractedName}"</strong>
                        </span>
                      )}
                    </div>
                    {batchList[batchIndex].status === 'done' && (
                      <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Check size={12} /> Registered
                      </span>
                    )}
                  </div>

                  {/* Unique nameByAdmin Input */}
                  <div className="form-group" style={{ marginBottom: '1.15rem' }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span>Unique Admin Register Name (nameByAdmin) *</span>
                      <span style={{ fontSize: '0.72rem', color: '#0369a1', background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                        Unique &bull; Only Admin
                      </span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--color-text-muted)' }} />
                      <input
                        type="text"
                        className="form-control"
                        style={{ paddingLeft: '34px', fontSize: '0.95rem', fontWeight: 600 }}
                        value={batchList[batchIndex].name}
                        onChange={(e) => handleBatchFieldChange(batchIndex, 'name', e.target.value)}
                        placeholder="e.g. गुप्ता or Gupta (Admin's unique identifier)"
                        required
                        disabled={batchList[batchIndex].status === 'done'}
                      />
                    </div>
                    <small style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '3px' }}>
                      Enter either in Hindi (गुप्ता) or English (Gupta). System will automatically convert &amp; save both scripts!
                    </small>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.15rem' }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      Mobile Number (मोबाइल नंबर) *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={16} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--color-text-muted)' }} />
                      <input
                        type="tel"
                        className="form-control"
                        style={{ paddingLeft: '34px', fontSize: '1rem', fontWeight: 600 }}
                        value={batchList[batchIndex].mobileNumber}
                        onChange={(e) => handleBatchFieldChange(batchIndex, 'mobileNumber', e.target.value)}
                        placeholder="10-digit mobile number (e.g. 9876543210)"
                        pattern="[0-9]{10,15}"
                        required
                        autoFocus
                        disabled={batchList[batchIndex].status === 'done'}
                      />
                    </div>
                    <small style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '4px' }}>
                      Customer login account will be created with username &amp; initial password set to this mobile number.
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Email Address (ईमेल - Optional)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--color-text-muted)' }} />
                      <input
                        type="email"
                        className="form-control"
                        style={{ paddingLeft: '34px' }}
                        value={batchList[batchIndex].email}
                        onChange={(e) => handleBatchFieldChange(batchIndex, 'email', e.target.value)}
                        placeholder="customer@example.com (optional)"
                        disabled={batchList[batchIndex].status === 'done'}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer" style={{ borderTop: '1px solid var(--color-border)', padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {batchIndex > 0 && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => { setBatchIndex(batchIndex - 1); setBatchError(''); }}
                      >
                        <ArrowLeft size={14} /> Back / पिछला
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleSkipBatchCustomer}
                    >
                      Skip / छोड़ें
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {batchList[batchIndex].status === 'done' ? (
                      batchIndex < batchList.length - 1 ? (
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => { setBatchIndex(batchIndex + 1); setBatchError(''); }}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                          <span>Next Customer / अगला ग्राहक</span>
                          <ArrowRight size={15} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-success"
                          onClick={() => setShowBatchModal(false)}
                        >
                          Finish / पूरा हुआ
                        </button>
                      )
                    ) : (
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={batchSubmitting}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
                      >
                        <UserPlus size={16} />
                        <span>
                          {batchSubmitting
                            ? 'Creating...'
                            : batchIndex === batchList.length - 1
                            ? 'Create & Finish / ग्राहक बनाएं और समाप्त करें'
                            : 'Create & Next ➡️ / ग्राहक बनाएं और अगला'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </form>
            )}

            {/* View 2: All Customers in a Table */}
            {batchViewMode === 'all-list' && (
              <div style={{ padding: '1rem 1.25rem' }}>
                <div style={{ maxHeight: '350px', overflowY: 'auto', marginBottom: '1rem' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>#</th>
                        <th>Unique Admin Name (nameByAdmin) *</th>
                        <th>Mobile Number * (मोबाइल नंबर)</th>
                        <th>Email (Optional)</th>
                        <th style={{ width: '80px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchList.map((item, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem', fontWeight: 600 }}
                              value={item.name}
                              onChange={(e) => handleBatchFieldChange(idx, 'name', e.target.value)}
                              placeholder="Unique nameByAdmin"
                              disabled={item.status === 'done'}
                              required
                            />
                            {item.originalExtractedName && item.originalExtractedName !== item.name && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                Raw: {item.originalExtractedName}
                              </div>
                            )}
                          </td>
                          <td>
                            <input
                              type="tel"
                              className="form-control"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
                              value={item.mobileNumber}
                              onChange={(e) => handleBatchFieldChange(idx, 'mobileNumber', e.target.value)}
                              placeholder="10-digit mobile"
                              disabled={item.status === 'done'}
                            />
                            {item.error && (
                              <div style={{ color: '#dc2626', fontSize: '0.72rem', marginTop: '2px' }}>
                                {item.error}
                              </div>
                            )}
                          </td>
                          <td>
                            <input
                              type="email"
                              className="form-control"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
                              value={item.email}
                              onChange={(e) => handleBatchFieldChange(idx, 'email', e.target.value)}
                              placeholder="email (opt)"
                              disabled={item.status === 'done'}
                            />
                          </td>
                          <td>
                            {item.status === 'done' ? (
                              <span className="badge badge-success">Saved</span>
                            ) : (
                              <span className="badge badge-blue">Pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.85rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowBatchModal(false)}
                  >
                    Close / बंद करें
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={batchSubmitting}
                    onClick={handleSaveAllBatchList}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
                  >
                    <UserPlus size={16} />
                    <span>{batchSubmitting ? 'Registering...' : 'Register All Customers / सभी ग्राहक बनाएं'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
