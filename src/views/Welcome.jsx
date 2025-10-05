import { useState } from 'react'
import { useTranslation } from '../hooks/useTranslation'
import { Schedule } from './Schedule'

export const Welcome = ({ settings, onUpdateSettings, onSelectSlot, onShowSchedule, program, getItemsForDate, onAddItem, onUpdateItem, onDeleteItem, onExport, onImport }) => {
  const [activeTab, setActiveTab] = useState('today')
  const { t } = useTranslation(settings?.language || 'en')

  return (
    <div className="container" style={{ paddingTop: '24px' }}>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: '600' }}>
        {t('app_title') || 'Habit Playlists'}
      </h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid var(--border)' }}>
        <button
          onClick={() => setActiveTab('today')}
          style={{
            padding: '12px 24px',
            background: 'none',
            borderBottom: activeTab === 'today' ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom: '-2px',
            fontWeight: activeTab === 'today' ? '600' : '400',
            color: activeTab === 'today' ? 'var(--primary)' : 'var(--text-secondary)',
          }}
        >
          {t('tab_today') || 'Today'}
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          style={{
            padding: '12px 24px',
            background: 'none',
            borderBottom: activeTab === 'schedule' ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom: '-2px',
            fontWeight: activeTab === 'schedule' ? '600' : '400',
            color: activeTab === 'schedule' ? 'var(--primary)' : 'var(--text-secondary)',
          }}
        >
          {t('tab_schedule') || 'Schedule'}
        </button>
      </div>

      {activeTab === 'today' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            className="btn btn-primary"
            onClick={() => onSelectSlot('morning')}
            style={{ width: '100%', fontSize: '18px' }}
          >
            ☀️ {t('slot_morning') || 'Morning'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onSelectSlot('midday')}
            style={{ width: '100%', fontSize: '18px' }}
          >
            🌤️ {t('slot_midday') || 'Midday'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onSelectSlot('evening')}
            style={{ width: '100%', fontSize: '18px' }}
          >
            🌙 {t('slot_evening') || 'Evening'}
          </button>
        </div>
      )}

      {activeTab === 'schedule' && (
        <Schedule
          program={program}
          getItemsForDate={getItemsForDate}
          onBack={() => setActiveTab('today')}
          settings={settings}
          onAddItem={onAddItem}
          onUpdateItem={onUpdateItem}
          onDeleteItem={onDeleteItem}
          onExport={onExport}
          onImport={onImport}
        />
      )}
    </div>
  )
}
