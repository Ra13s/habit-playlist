import { useState, useEffect } from 'react'
import { ItemType } from '../types'
import { useTranslation } from '../hooks/useTranslation'
import { playStartTone, playCompletionTone } from '../utils/sounds'

export const Wizard = ({ items, slot, date, onComplete, onCancel, settings, recordItemCompletion }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [wakeLock, setWakeLock] = useState(null)
  const [useWakeLock, setUseWakeLock] = useState(settings?.wakeLockDefault || false)
  const { t } = useTranslation(settings?.language || 'en')

  const currentItem = items[currentIndex]
  const progress = ((currentIndex + 1) / items.length) * 100

  // Timer logic with sounds
  useEffect(() => {
    if (currentItem?.type === ItemType.TIMER && isRunning && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false)
            if (settings?.tones) {
              playCompletionTone()
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [isRunning, timeLeft, currentItem, settings?.tones])

  // Wake Lock
  useEffect(() => {
    const requestWakeLock = async () => {
      if (useWakeLock && 'wakeLock' in navigator) {
        try {
          const lock = await navigator.wakeLock.request('screen')
          setWakeLock(lock)
        } catch (err) {
          console.error('Wake Lock error:', err)
        }
      }
    }

    const releaseWakeLock = async () => {
      if (wakeLock) {
        await wakeLock.release()
        setWakeLock(null)
      }
    }

    if (useWakeLock) {
      requestWakeLock()
    }

    return () => {
      releaseWakeLock()
    }
  }, [useWakeLock])

  // Initialize timer when item changes
  useEffect(() => {
    if (currentItem?.type === ItemType.TIMER) {
      setTimeLeft(currentItem.duration)
      setIsRunning(false)
    }
  }, [currentItem])

  const handleStartTimer = () => {
    setIsRunning(true)
    if (settings?.tones) {
      playStartTone()
    }
  }

  const handlePauseTimer = () => {
    setIsRunning(false)
  }

  const handleResetTimer = () => {
    setTimeLeft(currentItem.duration)
    setIsRunning(false)
  }

  const handleNext = () => {
    recordItemCompletion(currentItem.id, slot, date)

    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      handleCompleteSession()
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleCompleteSession = () => {
    const completedCount = currentIndex + 1
    onComplete(completedCount, items.length)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTotalDuration = () => {
    return items.reduce((total, item) => {
      if (item.type === ItemType.TIMER && item.duration) {
        return total + item.duration
      }
      return total
    }, 0)
  }

  const title = currentItem?.titleKey ? t(currentItem.titleKey) : currentItem?.title
  const description = currentItem?.descriptionKey ? t(currentItem.descriptionKey) : currentItem?.description

  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '80px' }}>
      {/* Header */}
      <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', color: 'white', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600' }}>
            {t(`slot_${slot}`) || slot}
          </h2>
          {items.length > 0 && (
            <span style={{ fontSize: '14px', opacity: 0.9 }}>
              {currentIndex + 1} / {items.length}
            </span>
          )}
        </div>
        <div className="progress-bar" style={{ marginBottom: '12px', background: 'rgba(255,255,255,0.3)' }}>
          <div className="progress-bar-fill" style={{ width: `${progress}%`, background: 'white' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', opacity: 0.9 }}>
          <span>{t('total_time') || 'Total'}: {formatTime(getTotalDuration())}</span>
          {useWakeLock && wakeLock && <span>🔒 {t('wake_lock_active') || 'Wake Lock'}</span>}
        </div>
      </div>

      {/* Current Item */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>{title}</h1>
        {description && (
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{description}</p>
        )}

        {currentItem?.type === ItemType.TIMER && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '64px', fontWeight: '700', marginBottom: '24px', fontFamily: 'monospace' }}>
              {formatTime(timeLeft)}
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              {!isRunning ? (
                <button className="btn btn-primary" onClick={handleStartTimer}>
                  ▶️ {t('start') || 'Start'}
                </button>
              ) : (
                <button className="btn btn-secondary" onClick={handlePauseTimer}>
                  ⏸️ {t('pause') || 'Pause'}
                </button>
              )}
              <button className="btn btn-secondary" onClick={handleResetTimer}>
                🔄 {t('reset') || 'Reset'}
              </button>
            </div>
          </div>
        )}

        {currentItem?.type === ItemType.CHECK && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>✓</div>
            <button className="btn btn-primary" onClick={handleNext}>
              {t('mark_done') || 'Mark Done'}
            </button>
          </div>
        )}

        {currentItem?.type === ItemType.NOTE && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
            <button className="btn btn-primary" onClick={handleNext}>
              {t('mark_done') || 'Mark Done'}
            </button>
          </div>
        )}

        {currentItem?.type === ItemType.LINK && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔗</div>
            <a
              href={currentItem.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ display: 'inline-flex', marginBottom: '12px', textDecoration: 'none' }}
            >
              {t('open_link') || 'Open Link'} →
            </a>
            <br />
            <button className="btn btn-secondary" onClick={handleNext}>
              {t('mark_done') || 'Mark Done'}
            </button>
          </div>
        )}
      </div>

      {/* Overview */}
      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
          {t('overview') || 'Overview'}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map((item, idx) => {
            const itemTitle = item.titleKey ? t(item.titleKey) : item.title
            const isCurrent = idx === currentIndex
            const isCompleted = idx < currentIndex

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px',
                  background: isCurrent ? 'var(--background)' : 'transparent',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <span>{isCompleted ? '✅' : isCurrent ? '▶️' : '⭕'}</span>
                <span style={{ flex: 1, fontWeight: isCurrent ? '600' : '400' }}>{itemTitle}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer Controls */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        padding: '16px',
        display: 'flex',
        gap: '12px',
      }}>
        <button className="btn btn-secondary" onClick={onCancel} style={{ flex: 1 }}>
          {t('cancel') || 'Cancel'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          style={{ flex: 1 }}
        >
          ← {t('previous') || 'Previous'}
        </button>
        <button
          className="btn btn-primary"
          onClick={handleNext}
          style={{ flex: 1 }}
        >
          {currentIndex === items.length - 1 ? (t('complete') || 'Complete') : (t('next') || 'Next')} →
        </button>
      </div>
    </div>
  )
}
