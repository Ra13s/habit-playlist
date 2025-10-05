import { useState, useRef } from 'react'
import { useTranslation } from '../hooks/useTranslation'
import { ItemList } from '../components/ItemList'

export const Schedule = ({ program, getItemsForDate, onBack, settings, onAddItem = () => {}, onUpdateItem = () => {}, onDeleteItem = () => {}, onExport, onImport }) => {
  const { t } = useTranslation(settings?.language || 'en')
  const [showEditor, setShowEditor] = useState(false)
  const [importMode, setImportMode] = useState('replace')
  const [message, setMessage] = useState(null)
  const fileInputRef = useRef(null)

  

  // Generate 3 weeks of dates starting from today
  const generateDates = () => {
    const dates = []
    const today = new Date()

    for (let i = 0; i < 21; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date)
    }

    return dates
  }

  const dates = generateDates()

  const formatDate = (date) => {
    return date.toISOString().split('T')[0]
  }

  const formatDisplayDate = (date) => {
    return date.toLocaleDateString(settings?.language || 'en', {
      month: 'short',
      day: 'numeric',
    })
  }

  const getDayName = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return days[date.getDay()]
  }

  const isToday = (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const handleExport = () => {
    const json = onExport({ includeProgress: false })
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `todo-playlists-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage({ type: 'success', text: t('export_success') || 'Program exported successfully' })
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const result = onImport(text, { mode: importMode })

      if (result.success) {
        setMessage({ type: 'success', text: t('import_success') || 'Program imported successfully' })
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        setMessage({ type: 'error', text: result.error || (t('import_error') || 'Import failed') })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    }
  }

  return (
    <div className="container" style={{ paddingTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button
          onClick={onBack}
          className="btn-secondary"
          style={{ padding: '8px 16px' }}
        >
          ← {t('back') || 'Back'}
        </button>
        <button
          onClick={() => setShowEditor(!showEditor)}
          className="btn btn-primary"
          style={{ padding: '8px 16px' }}
        >
          {showEditor ? '📅 View Schedule' : '✏️ Edit Schedule'}
        </button>
      </div>

      {showEditor ? (
        <>
          <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: '600' }}>
            Edit Schedule
          </h1>

          {message && (
            <div
              className="card"
              style={{
                marginBottom: '24px',
                background: message.type === 'error' ? '#fee2e2' : '#d1fae5',
                color: message.type === 'error' ? '#991b1b' : '#065f46',
              }}
            >
              {message.text}
            </div>
          )}

          <ItemList
            program={program}
            onAddItem={onAddItem}
            onUpdateItem={onUpdateItem}
            onDeleteItem={onDeleteItem}
          />

          {/* Import/Export */}
          <div className="card" style={{ marginTop: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              {t('import_export') || 'Import/Export'}
            </h2>

            <button
              className="btn btn-primary"
              onClick={handleExport}
              style={{ width: '100%', marginBottom: '16px' }}
            >
              📥 {t('export_program') || 'Export Program'}
            </button>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                {t('import_mode') || 'Import Mode'}
              </label>
              <select
                value={importMode}
                onChange={(e) => setImportMode(e.target.value)}
                className="btn-secondary"
                style={{ width: '100%', padding: '12px' }}
              >
                <option value="replace">{t('mode_replace') || 'Replace (overwrite all)'}</option>
                <option value="merge">{t('mode_merge') || 'Merge (combine with existing)'}</option>
              </select>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            <button
              className="btn btn-secondary"
              onClick={handleImportClick}
              style={{ width: '100%' }}
            >
              📤 {t('import_program') || 'Import Program'}
            </button>
          </div>
        </>
      ) : (
        <>
          <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: '600' }}>
            {t('schedule') || 'Schedule'}
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {dates.map((date) => {
          const dateStr = formatDate(date)
          const slotItems = getItemsForDate(dateStr)

          return (
            <div
              key={dateStr}
              className="card"
              style={{
                background: isToday(date) ? 'var(--primary)' : 'var(--surface)',
                color: isToday(date) ? 'white' : 'var(--text)',
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600' }}>
                    {getDayName(date)} {formatDisplayDate(date)}
                  </h3>
                  {isToday(date) && (
                    <span style={{ fontSize: '12px', opacity: 0.9 }}>
                      {t('today') || 'Today'}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {/* Morning */}
                <div
                  style={{
                    padding: '8px',
                    background: isToday(date) ? 'rgba(255,255,255,0.2)' : 'var(--background)',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ fontSize: '12px', marginBottom: '4px', fontWeight: '500' }}>
                    ☀️ {t('slot_morning') || 'Morning'}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    {slotItems.morning.length} {t('items') || 'items'}
                  </div>
                  {slotItems.morning.map((itemRef) => {
                    const item = program.items[itemRef.id]
                    if (!item) return null
                    const title = item.titleKey ? t(item.titleKey) : item.title
                    return (
                      <div
                        key={itemRef.id}
                        style={{
                          fontSize: '11px',
                          opacity: 0.7,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        • {title}
                      </div>
                    )
                  })}
                </div>

                {/* Midday */}
                <div
                  style={{
                    padding: '8px',
                    background: isToday(date) ? 'rgba(255,255,255,0.2)' : 'var(--background)',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ fontSize: '12px', marginBottom: '4px', fontWeight: '500' }}>
                    🌤️ {t('slot_midday') || 'Midday'}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    {slotItems.midday.length} {t('items') || 'items'}
                  </div>
                  {slotItems.midday.map((itemRef) => {
                    const item = program.items[itemRef.id]
                    if (!item) return null
                    const title = item.titleKey ? t(item.titleKey) : item.title
                    return (
                      <div
                        key={itemRef.id}
                        style={{
                          fontSize: '11px',
                          opacity: 0.7,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        • {title}
                      </div>
                    )
                  })}
                </div>

                {/* Evening */}
                <div
                  style={{
                    padding: '8px',
                    background: isToday(date) ? 'rgba(255,255,255,0.2)' : 'var(--background)',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ fontSize: '12px', marginBottom: '4px', fontWeight: '500' }}>
                    🌙 {t('slot_evening') || 'Evening'}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    {slotItems.evening.length} {t('items') || 'items'}
                  </div>
                  {slotItems.evening.map((itemRef) => {
                    const item = program.items[itemRef.id]
                    if (!item) return null
                    const title = item.titleKey ? t(item.titleKey) : item.title
                    return (
                      <div
                        key={itemRef.id}
                        style={{
                          fontSize: '11px',
                          opacity: 0.7,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        • {title}
                      </div>
                    )
                  })}
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
