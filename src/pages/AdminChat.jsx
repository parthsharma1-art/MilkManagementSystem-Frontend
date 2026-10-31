import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import {
  MessageCircle,
  Send,
  Search,
  User,
  ArrowLeft,
  CheckCheck,
  Phone,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

export default function AdminChat() {
  const { t } = useTranslation()
  const [conversations, setConversations] = useState([])
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingConv, setLoadingConv] = useState(true)
  const [loadingMsg, setLoadingMsg] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [showMobileChat, setShowMobileChat] = useState(false)

  const messagesEndRef = useRef(null)
  const pollingRef = useRef(null)

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
    }
  }

  // Poll conversations every 3 seconds
  useEffect(() => {
    fetchConversations(true)

    pollingRef.current = setInterval(() => {
      fetchConversations(false)
      if (selectedCustomerId) {
        fetchMessages(selectedCustomerId, false)
      }
    }, 3000)

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [selectedCustomerId])

  const fetchConversations = async (isInitial = false) => {
    try {
      const res = await api.get('/api/admin/chat/conversations')
      const list = res.data || []
      setConversations(list)

      // Auto-select first customer with messages or first customer if none selected on desktop
      if (isInitial && list.length > 0 && !selectedCustomerId && window.innerWidth > 768) {
        const firstWithMsg = list.find((c) => c.lastMessage) || list[0]
        selectCustomer(firstWithMsg.customerId)
      }
    } catch (err) {
      if (isInitial) setError('Failed to load conversations.')
    } finally {
      if (isInitial) setLoadingConv(false)
    }
  }

  const selectCustomer = (customerId) => {
    setSelectedCustomerId(customerId)
    setShowMobileChat(true)
    fetchMessages(customerId, true)
    markAsRead(customerId)
  }

  const fetchMessages = async (customerId, isInitial = false) => {
    if (!customerId) return
    if (isInitial) setLoadingMsg(true)
    try {
      const res = await api.get(`/api/admin/chat/messages/${customerId}`)
      const newMessages = res.data || []
      setMessages((prev) => {
        if (newMessages.length !== prev.length) {
          setTimeout(() => scrollToBottom(true), 100)
        }
        return newMessages
      })
      if (isInitial) {
        setTimeout(() => scrollToBottom(false), 150)
      }
    } catch (err) {
      console.warn('Failed to load messages for customer:', customerId)
    } finally {
      if (isInitial) setLoadingMsg(false)
    }
  }

  const markAsRead = async (customerId) => {
    try {
      await api.patch(`/api/admin/chat/mark-read/${customerId}`)
      setConversations((prev) =>
        prev.map((c) => (c.customerId === customerId ? { ...c, unreadCount: 0 } : c))
      )
    } catch (ignore) {}
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    const content = inputMessage.trim()
    if (!content || !selectedCustomerId || sending) return

    setSending(true)
    setError('')
    try {
      const res = await api.post('/api/admin/chat/send', {
        customerId: selectedCustomerId,
        content,
      })
      setInputMessage('')
      setMessages((prev) => [...prev, res.data])
      setTimeout(() => scrollToBottom(true), 100)

      // Refresh conversation list to show latest message snippet
      fetchConversations(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  const selectedConv = conversations.find((c) => c.customerId === selectedCustomerId)

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (c.nameByCustomer && c.nameByCustomer.toLowerCase().includes(q)) ||
      (c.nameByAdmin && c.nameByAdmin.toLowerCase().includes(q)) ||
      (c.customerNumber && c.customerNumber.toLowerCase().includes(q)) ||
      (c.mobileNumber && c.mobileNumber.includes(q))
    )
  })

  const formatTime = (isoString) => {
    if (!isoString) return ''
    try {
      const d = new Date(isoString)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch (e) {
      return ''
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h2>Customer Chat & Support</h2>
          <p className="card-subtitle">Live 1-on-1 private messaging with registered customers (Auto-updates every 3 sec)</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Container */}
      <div
        className="card"
        style={{
          padding: 0,
          display: 'grid',
          gridTemplateColumns: window.innerWidth > 768 ? '320px 1fr' : '1fr',
          height: 'calc(100vh - 200px)',
          minHeight: 'min(520px, 75vh)',
          maxHeight: 780,
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        {/* Left Pane: Customer Conversations List */}
        <div
          style={{
            borderRight: '1px solid var(--color-border)',
            display: showMobileChat && window.innerWidth <= 768 ? 'none' : 'flex',
            flexDirection: 'column',
            background: 'var(--color-bg-card)',
            height: '100%',
          }}
        >
          {/* Search Box */}
          <div style={{ padding: '0.85rem', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--color-text-light)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search customer name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '34px', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Conversations Scroll Area */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingConv ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                No matching customers found.
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = c.customerId === selectedCustomerId
                const hasUnread = Number(c.unreadCount || 0) > 0
                return (
                  <div
                    key={c.customerId}
                    onClick={() => selectCustomer(c.customerId)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid var(--color-border-subtle)',
                      background: isSelected ? 'var(--color-bg-muted)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                      borderLeft: isSelected ? '4px solid var(--color-primary)' : '4px solid transparent',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.2rem' }}>
                      <div style={{ fontWeight: hasUnread ? 700 : 600, fontSize: '0.88rem', color: 'var(--color-text-main)' }}>
                        {c.nameByAdminHindi && c.nameByAdminEnglish
                          ? `${c.nameByAdminHindi} (${c.nameByAdminEnglish})`
                          : (c.nameByAdmin || c.nameByCustomer)}
                      </div>
                      {c.lastMessageTime && (
                        <span style={{ fontSize: '0.68rem', color: 'var(--color-text-light)' }}>
                          {formatTime(c.lastMessageTime)}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: hasUnread ? 'var(--color-text-main)' : 'var(--color-text-muted)',
                          fontWeight: hasUnread ? 600 : 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 190,
                        }}
                      >
                        {c.lastMessage ? (
                          <span>
                            {c.lastMessageSender === 'ROLE_ADMIN' ? 'You: ' : ''}
                            {c.lastMessage}
                          </span>
                        ) : (
                          <span style={{ fontStyle: 'italic', color: 'var(--color-text-light)' }}>No messages yet</span>
                        )}
                      </div>
                      {hasUnread && (
                        <span
                          style={{
                            background: '#ea580c',
                            color: '#ffffff',
                            borderRadius: '10px',
                            padding: '1px 7px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                          }}
                        >
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Pane: Selected Customer Chat */}
        <div
          style={{
            display: !showMobileChat && window.innerWidth <= 768 ? 'none' : 'flex',
            flexDirection: 'column',
            height: '100%',
            background: 'var(--color-bg-app)',
          }}
        >
          {selectedConv ? (
            <>
              {/* Chat Top Bar */}
              <div
                style={{
                  padding: '0.75rem 1.25rem',
                  background: 'var(--color-bg-muted)',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  {/* Mobile Back Button */}
                  {window.innerWidth <= 768 && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowMobileChat(false)}
                      style={{ padding: '4px 8px' }}
                    >
                      <ArrowLeft size={16} />
                    </button>
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-main)' }}>
                      {selectedConv.nameByAdminHindi && selectedConv.nameByAdminEnglish
                        ? `${selectedConv.nameByAdminHindi} (${selectedConv.nameByAdminEnglish})`
                        : (selectedConv.nameByAdmin || selectedConv.nameByCustomer)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', gap: '0.5rem' }}>
                      <span>ID: {selectedConv.customerNumber}</span>
                      <span>&bull;</span>
                      <span>Phone: {selectedConv.mobileNumber}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#16a34a' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }}></span>
                  <span>Polling (3s)</span>
                </div>
              </div>

              {/* Chat Messages Body */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {loadingMsg ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    Loading conversation...
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', margin: 'auto', maxWidth: 320, padding: '2rem' }}>
                    <MessageCircle size={32} style={{ color: 'var(--color-text-light)', margin: '0 auto 0.5rem' }} />
                    <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>No messages exchanged</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      Send a message below to start a direct private conversation with this customer.
                    </p>
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isMe = m.senderRole === 'ROLE_ADMIN'
                    return (
                      <div
                        key={m.id || idx}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '78%',
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            color: isMe ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            marginBottom: '0.15rem',
                            padding: '0 0.25rem',
                          }}
                        >
                          {isMe ? 'Dairy Admin (You)' : (selectedConv.nameByCustomer || selectedConv.nameByAdmin || 'Customer')}
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
                            padding: '0 0.25rem',
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

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: '0.75rem 1rem',
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
                  placeholder={`Reply to ${selectedConv.nameByAdmin || selectedConv.nameByCustomer}...`}
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
            </>
          ) : (
            <div style={{ textAlign: 'center', margin: 'auto', padding: '3rem', color: 'var(--color-text-muted)' }}>
              <MessageCircle size={40} style={{ color: 'var(--color-text-light)', margin: '0 auto 0.75rem' }} />
              <h4>Select a customer to start chatting</h4>
              <p style={{ fontSize: '0.85rem' }}>Choose from the conversation list on the left.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

