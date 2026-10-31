import React from 'react'
import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { APP_CONFIG } from '../config/appConfig'

/**
 * Official Android Robot vector icon
 */
export function AndroidIcon({ size = 18, color = 'currentColor', className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-hidden="true"
    >
      <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0002 0-.5517.4482-1.0003.9993-1.0003.5517 0 .9998.4486.9998 1.0003 0 .5516-.4481 1.0002-.9998 1.0002m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0002 0-.5517.4482-1.0003.9993-1.0003.5516 0 .9998.4486.9998 1.0003 0 .5516-.4482 1.0002-.9998 1.0002m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4123 13.8533 8.08 12 8.08s-3.5902.3323-5.1368.8697L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.152 1.5676l1.9973 3.4592C2.6889 12.1867 2 15.6309 2 19.4h20c0-3.7691-.689-7.2133-4.1185-10.0786" />
    </svg>
  )
}

export default function DownloadApkButton({ variant = 'hero', className = '', style = {} }) {
  const { t, i18n } = useTranslation()
  const isHindi = i18n.language === 'hi'

  const downloadText = isHindi ? 'एंड्रॉयड ऐप डाउनलोड करें' : 'Download Android App'

  const handleDownloadClick = (e) => {
    // Allows default <a> tag navigation while also ensuring filename is respected
    try {
      const link = document.createElement('a')
      link.href = APP_CONFIG.APK_DOWNLOAD_URL
      link.setAttribute('download', APP_CONFIG.APK_FILENAME)
      link.setAttribute('target', '_blank')
      link.setAttribute('rel', 'noopener noreferrer')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (ignore) {
      // Fallback normal navigation
    }
  }

  // Header compact pill button
  if (variant === 'header') {
    return (
      <a
        href={APP_CONFIG.APK_DOWNLOAD_URL}
        download={APP_CONFIG.APK_FILENAME}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleDownloadClick}
        className={`download-apk-header-btn ${className}`}
        title="Download Android APK / एंड्रॉयड ऐप डाउनलोड करें"
        aria-label="Download Android App APK"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.4rem 0.8rem',
          backgroundColor: 'rgba(22, 163, 74, 0.12)',
          border: '1px solid rgba(22, 163, 74, 0.35)',
          borderRadius: '9999px',
          color: '#16a34a',
          fontSize: '0.82rem',
          fontWeight: 600,
          textDecoration: 'none',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          ...style,
        }}
      >
        <AndroidIcon size={16} color="#16a34a" />
        <span className="apk-btn-text">Android App</span>
        <Download size={13} style={{ opacity: 0.8 }} />
      </a>
    )
  }

  // Card banner variant (for Login or feature sections)
  if (variant === 'card') {
    return (
      <div
        className={`download-apk-card ${className}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '0.85rem 1.15rem',
          backgroundColor: 'rgba(22, 163, 74, 0.08)',
          border: '1px solid rgba(22, 163, 74, 0.25)',
          borderRadius: 'var(--radius-md, 10px)',
          marginTop: '1.25rem',
          flexWrap: 'wrap',
          ...style,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AndroidIcon size={22} color="#ffffff" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
              {downloadText}
            </p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              APK v{APP_CONFIG.APK_VERSION} &bull; Direct install
            </p>
          </div>
        </div>

        <a
          href={APP_CONFIG.APK_DOWNLOAD_URL}
          download={APP_CONFIG.APK_FILENAME}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleDownloadClick}
          className="btn btn-sm"
          style={{
            backgroundColor: '#16a34a',
            color: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.95rem',
            fontSize: '0.82rem',
            fontWeight: 600,
            borderRadius: '6px',
            textDecoration: 'none',
          }}
        >
          <Download size={14} />
          <span>Download</span>
        </a>
      </div>
    )
  }

  // Hero variant (large, prominent for Home page)
  return (
    <a
      href={APP_CONFIG.APK_DOWNLOAD_URL}
      download={APP_CONFIG.APK_FILENAME}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleDownloadClick}
      className={`download-apk-hero-btn ${className}`}
      title="Download Android APK (Direct S3 download)"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.6rem',
        padding: '0.75rem 1.6rem',
        background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: 'var(--radius-md, 8px)',
        fontSize: '1rem',
        fontWeight: 600,
        textDecoration: 'none',
        boxShadow: '0 4px 14px 0 rgba(22, 163, 74, 0.35)',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <AndroidIcon size={20} color="#ffffff" />
      <span>{downloadText} (APK)</span>
      <Download size={17} style={{ opacity: 0.9 }} />
    </a>
  )
}

