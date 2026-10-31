import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { MessageCircle, Send, CheckCheck, User, Shield, AlertCircle } from 'lucide-react'

export default function CustomerChat() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)
  const pollingRef = useRef(null)

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
    }
  }

  // Initial fetch and mark as read
  useEffect(() => {
    fetchMessages(true)
    markAsRead()

    // 3-second polling interval for latest messages
    pollingRef.current = setInterval(() => {
      fetchMessages(false)
    }, 3000)

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  const fetchMessages = async (isInitial = false) => {
    try {
      const res = await api.get('/api/customer/chat/messages')
      const newMessages = res.data || []
      setMessages((prev) => {
        // If message count changed, auto-scroll to bottom
        if (newMessages.length !== prev.length) {
          setTimeout(() => scrollToBottom(true), 100)
        }
        return newMessages
      })
      if (isInitial) {
        setTimeout(() => scrollToBottom(false), 200)
      }
    } catch (err) {
      if (isInitial) {
        setError('Failed to load chat messages.')
      }
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  const markAsRead = async () => {
    try {
      await api.patch('/api/customer/chat/mark-read')
    } catch (ignore) {}
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    const content = inputMessage.trim()
    if (!content || sending) return

    setSending(true)
    setError('')
    try {
      const res = await api.post('/api/customer/chat/send', { content })
      setInputMessage('')
      setMessages((prev) => [...prev, res.data])
      setTimeout(() => scrollToBottom(true), 100)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  const formatTime = (isoString) => {
    if (!isoString) return ''
    try {
      const d = new Date(isoString)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch (e) {
      return ''
    }
  }

  const formatDateLabel = (isoString) => {
    if (!isoString) return ''
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
    } catch (e) {
      return ''
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h2>Dairy Support Chat</h2>
          <p className="card-subtitle">Direct 1-on-1 private messaging with Dairy Administration</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Chat Window Container */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 220px)',
          minHeight: 480,
          maxHeight: 700,
          padding: 0,
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        {/* Chat Header Bar */}
        <div
          style={{
            padding: '0.85rem 1.25rem',
            background: 'var(--color-bg-muted)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'var(--color-primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-main)' }}>
                Dairy Administrator
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#16a34a' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }}></span>
                <span>Active &bull; Updates every 3 sec</span>
              </div>
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Customer: {user?.fullName || user?.username}
          </div>
        </div>

        {/* Messages Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            background: 'var(--color-bg-app)',
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
              Loading chat history...
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', margin: 'auto', maxWidth: 360, padding: '2rem' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  margin: '0 auto 1rem',
                  borderRadius: '50%',
                  background: 'var(--color-bg-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-light)',
                }}
              >
                <MessageCircle size={28} />
              </div>
              <h4 style={{ fontSize: '1.05rem', marginBottom: '0.35rem' }}>No messages yet</h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                Have questions about your milk deliveries, rates, or bill payments? Send a message to Dairy Admin below!
              </p>
            </div>
          ) : (
            messages.map((m, idx) => {
              const isMe = m.senderRole === 'ROLE_CUSTOMER'
              return (
                <div
                  key={m.id || idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: isMe ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      marginBottom: '0.2rem',
                      padding: '0 0.25rem',
                    }}
                  >
                    {isMe ? 'You' : 'Dairy Admin'}
                  </div>
                  <div
                    style={{
                      padding: '0.65rem 0.95rem',
                      borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      background: isMe ? 'var(--color-primary)' : 'var(--color-bg-card)',
                      color: isMe ? '#ffffff' : 'var(--color-text-main)',
                      border: isMe ? 'none' : '1px solid var(--color-border)',
                      boxShadow: 'var(--shadow-sm)',
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.9rem',
                      lineHeight: 1.45,
                    }}
                  >
                    {m.content}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.68rem',
                      color: 'var(--color-text-light)',
                      marginTop: '0.2rem',
                      padding: '0 0.35rem',
                    }}
                  >
                    <span>{formatTime(m.createdAt)}</span>
                    {isMe && <CheckCheck size={12} color="#16a34a" />}
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          style={{
            padding: '0.85rem 1rem',
            background: 'var(--color-bg-card)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            gap: '0.65rem',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            className="form-control"
            placeholder="Type your message to Dairy Admin..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={sending}
            style={{ borderRadius: '24px', paddingLeft: '1.1rem' }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={sending || !inputMessage.trim()}
            style={{ borderRadius: '24px', padding: '0.55rem 1.25rem', minWidth: 90 }}
          >
            <Send size={16} />
            <span>{sending ? 'Sending...' : 'Send'}</span>
          </button>
        </form>
      </div>
    </div>
  )
}

