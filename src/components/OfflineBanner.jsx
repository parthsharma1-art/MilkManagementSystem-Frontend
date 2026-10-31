import React, { useState, useEffect } from 'react'
import { WifiOff, Wifi, RefreshCw, AlertTriangle, CheckCircle2, X } from 'lucide-react'
import { getOfflineQueue } from '../utils/draftStorage'

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [isFallbackActive, setIsFallbackActive] = useState(false)
  const [fallbackTime, setFallbackTime] = useState(null)
  const [reconnected, setReconnected] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    // Check initial queue count
    setPendingCount(getOfflineQueue().length)

    const handleOnline = () => {
      setIsOffline(false)
      setIsFallbackActive(false)
      setReconnected(true)
      setDismissed(false)
      const timer = setTimeout(() => setReconnected(false), 5000)
      return () => clearTimeout(timer)
    }

    const handleOffline = () => {
      setIsOffline(true)
      setReconnected(false)
      setDismissed(false)
    }

    const handleFallback = (e) => {
      setIsFallbackActive(true)
      setDismissed(false)
      if (e.detail?.timestamp) {
        setFallbackTime(new Date(e.detail.timestamp).toLocaleTimeString())
      }
    }

    const handleQueueUpdated = (e) => {
      setPendingCount(e.detail?.count ?? getOfflineQueue().length)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('api-offline-fallback', handleFallback)
    window.addEventListener('offline-queue-updated', handleQueueUpdated)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('api-offline-fallback', handleFallback)
      window.removeEventListener('offline-queue-updated', handleQueueUpdated)
    }
  }, [])

  if (dismissed) return null

  if (reconnected) {
    return (
      <div
        style={{
          background: '#ecfdf5',
          borderBottom: '1px solid #a7f3d0',
          color: '#065f46',
          padding: '0.5rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.85rem',
          fontWeight: 500,
          zIndex: 1000,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} color="#059669" />
          <span>Connection restored! Backend is online and live data is synchronized.</span>
        </div>
        <button
          type="button"
          onClick={() => setReconnected(false)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#065f46' }}
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  if (isOffline || isFallbackActive) {
    return (
      <div
        style={{
          background: '#fffbeb',
          borderBottom: '1px solid #fde68a',
          color: '#92400e',
          padding: '0.5rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.85rem',
          fontWeight: 500,
          zIndex: 1000,
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <WifiOff size={16} color="#d97706" />
          <span>
            <strong>Offline / Local Storage Mode:</strong> Backend server is currently unreachable. Showing last saved data
            {fallbackTime ? ` (cached at ${fallbackTime})` : ''}. All form changes are preserved in drafts so you won't lose your work!
          </span>
          {pendingCount > 0 && (
            <span
              style={{
                background: '#fef3c7',
                border: '1px solid #f59e0b',
                padding: '1px 6px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {pendingCount} Pending Offline Action{pendingCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => window.location.reload()}
            style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <RefreshCw size={12} />
            <span>Retry Connection</span>
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#92400e' }}
            title="Dismiss notice"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    )
  }

  return null
}

