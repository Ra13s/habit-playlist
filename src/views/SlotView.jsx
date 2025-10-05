import { ItemType } from '../types'
import { useTranslation } from '../hooks/useTranslation'

export const SlotView = ({ slot, items, program, onStartAll, onStartItem, onBack, settings, isItemCompleted }) => {
  const { t } = useTranslation(settings?.language || 'en')

  // Filter out completed one-off items
  const visibleItems = items.filter(itemRef => {
    const item = program.items[itemRef.id]
    if (!item || !item.enabled) return false
    if (item.oneOff && isItemCompleted(item.id)) return false
    return true
  })

  const slotEmoji = {
    morning: '☀️',
    midday: '🌤️',
    evening: '🌙',
  }

  const getItemTypeLabel = (type) => {
    const labels = {
      [ItemType.TIMER]: '⏱️ Timer',
      [ItemType.CHECK]: '✓ Check',
      [ItemType.LINK]: '🔗 Link',
      [ItemType.NOTE]: '📝 Note',
    }
    return labels[type] || type
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
  }

  const getTotalDuration = () => {
    return visibleItems.reduce((total, itemRef) => {
      const item = program.items[itemRef.id]
      if (item?.type === ItemType.TIMER && item.duration) {
        return total + item.duration
      }
      return total
    }, 0)
  }

  return (
    <div className="container" style={{ paddingTop: '24px' }}>
      <button
        onClick={onBack}
        className="btn-secondary"
        style={{ marginBottom: '16px', padding: '8px 16px' }}
      >
        ← {t('back') || 'Back'}
      </button>

      <h1 style={{ marginBottom: '8px', fontSize: '28px', fontWeight: '600' }}>
        {slotEmoji[slot]} {t(`slot_${slot}`) || slot}
      </h1>

      {visibleItems.length > 0 && (
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          {visibleItems.length} {t('items') || 'items'} • {formatDuration(getTotalDuration())}
        </p>
      )}

      {visibleItems.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ fontSize: '48px', marginBottom: '16px' }}>📋</p>
          <p style={{ color: 'var(--text-secondary)' }}>
            {t('empty_playlist') || 'No items in this playlist'}
          </p>
        </div>
      ) : (
        <>
          <button
            className="btn btn-primary"
            onClick={() => onStartAll(visibleItems)}
            style={{ width: '100%', marginBottom: '24px', fontSize: '18px' }}
          >
            ▶️ {t('start_all') || 'Start All'}
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {visibleItems.map((itemRef) => {
              const item = program.items[itemRef.id]
              if (!item) return null

              const title = item.titleKey ? t(item.titleKey) : item.title
              const description = item.descriptionKey ? t(item.descriptionKey) : item.description

              return (
                <div
                  key={item.id}
                  className="card"
                  onClick={() => onStartItem(item)}
                  style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ marginBottom: '4px', fontWeight: '500' }}>{title}</h3>
                      {description && (
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                          {description}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '12px',
                          padding: '2px 8px',
                          background: 'var(--background)',
                          borderRadius: '4px',
                          color: 'var(--text-secondary)',
                        }}>
                          {getItemTypeLabel(item.type)}
                        </span>
                        {item.type === ItemType.TIMER && item.duration && (
                          <span style={{
                            fontSize: '12px',
                            padding: '2px 8px',
                            background: 'var(--primary)',
                            color: 'white',
                            borderRadius: '4px',
                          }}>
                            {formatDuration(item.duration)}
                          </span>
                        )}
                        {item.tags?.map(tag => (
                          <span key={tag} style={{
                            fontSize: '12px',
                            padding: '2px 8px',
                            background: 'var(--background)',
                            borderRadius: '4px',
                            color: 'var(--text-secondary)',
                          }}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
