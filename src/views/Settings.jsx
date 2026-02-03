import { useState, useRef } from 'react'
import { useTranslation } from '../hooks/useTranslation'
import { ThemeSwitcher } from '../components/ThemeSwitcher'
import { LanguageSelector } from '../components/LanguageSelector'

export const Settings = ({
  settings,
  program,
  onUpdateSettings,
  onExport,
  onImport,
  onResetOneOffs,
  driveStatus,
  onDriveConnect,
  onDriveDisconnect,
  onDriveSync,
  onDriveApplyRemote,
  onDriveOverwriteWithLocal,
  onBack
}) => {
  const [importMode, setImportMode] = useState('replace')
  const [message, setMessage] = useState(null)
  const [driveConnecting, setDriveConnecting] = useState(false)
  const fileInputRef = useRef(null)
  const { t } = useTranslation(settings?.language || 'en')

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

  const handleResetOneOffs = () => {
    if (confirm(t('confirm_reset_oneoffs') || 'Reset all one-off items? They will appear again in playlists.')) {
      onResetOneOffs()
      setMessage({ type: 'success', text: t('oneoffs_reset') || 'One-off items reset' })
    }
  }

  const handleDriveConnect = async () => {
    if (!onDriveConnect) return
    setDriveConnecting(true)
    try {
      const result = await onDriveConnect({ strategy: 'ask' })
      if (result?.action === 'found_remote') {
        const useRemote = confirm(
          'Drive data found. Click OK to replace this device with Drive data, or Cancel to overwrite Drive with this device.'
        )
        if (useRemote) {
          const applied = onDriveApplyRemote(result.remoteData)
          if (applied?.success) {
            setMessage({ type: 'success', text: 'Loaded data from Google Drive.' })
          } else {
            setMessage({ type: 'error', text: applied?.error || 'Failed to load Drive data.' })
          }
        } else {
          const saved = await onDriveOverwriteWithLocal()
          if (saved?.success) {
            setMessage({ type: 'success', text: 'Overwrote Drive data with this device.' })
          } else {
            setMessage({ type: 'error', text: saved?.error || 'Failed to overwrite Drive data.' })
          }
        }
      } else if (result?.action === 'created') {
        setMessage({ type: 'success', text: 'Google Drive connected. Data uploaded.' })
      } else if (result?.action === 'overwrote_remote') {
        setMessage({ type: 'success', text: 'Google Drive updated with local data.' })
      } else if (result?.action === 'loaded_remote') {
        const applied = onDriveApplyRemote(result.remoteData)
        if (applied?.success) {
          setMessage({ type: 'success', text: 'Loaded data from Google Drive.' })
        } else {
          setMessage({ type: 'error', text: applied?.error || 'Failed to load Drive data.' })
        }
      } else {
        setMessage({ type: 'success', text: 'Google Drive connected.' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setDriveConnecting(false)
    }
  }

  const handleDriveSync = async () => {
    if (!onDriveSync) return
    const ok = await onDriveSync()
    if (ok) {
      setMessage({ type: 'success', text: 'Synced to Google Drive.' })
    } else {
      setMessage({ type: 'error', text: 'Drive sync failed. Please reconnect.' })
    }
  }

  const handleDriveDisconnect = () => {
    if (!onDriveDisconnect) return
    onDriveDisconnect()
    setMessage({ type: 'success', text: 'Disconnected from Google Drive.' })
  }

  const driveStateLabel = () => {
    if (!driveStatus) return 'Not connected'
    if (driveStatus.state === 'connected') return 'Connected'
    if (driveStatus.state === 'needs_auth') return 'Needs re-authentication'
    return 'Not connected'
  }

  const formatDriveTime = (iso) => {
    if (!iso) return 'Never'
    try {
      return new Date(iso).toLocaleString()
    } catch (e) {
      return iso
    }
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

      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: '600' }}>
        {t('settings') || 'Settings'}
      </h1>

      {message && (
        <div
          className="card"
          style={{
            marginBottom: '24px',
            background: 'var(--surface)',
            color: 'var(--text)',
            borderLeft: `4px solid ${message.type === 'error' ? 'var(--error)' : 'var(--primary)'}`,
          }}
        >
          {message.text}
        </div>
      )}

      {/* How to Use AI */}
      <div className="card" style={{ marginBottom: '24px', background: 'var(--surface)', borderLeft: '4px solid var(--primary)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
          🤖 Advanced: Use AI for Complex Changes
        </h2>
        <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '12px' }}>
          For complex schedule modifications, you can still use AI:
        </p>
        <ol style={{ fontSize: '14px', lineHeight: '1.8', paddingLeft: '20px', marginBottom: '12px' }}>
          <li><strong>Export</strong> your program below</li>
          <li><strong>Open</strong> Claude, ChatGPT, or any AI assistant</li>
          <li><strong>Tell it</strong> what you want to change</li>
          <li><strong>Import</strong> the updated JSON back</li>
        </ol>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          Useful for bulk changes, complex rotations, or merging schedules.
        </p>
      </div>

      {/* Import/Export */}
      <div className="card" style={{ marginBottom: '24px' }}>
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

      {/* Google Drive Sync */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          Google Drive Sync
        </h2>

        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          Status: <strong>{driveStateLabel()}</strong>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Last sync: {formatDriveTime(driveStatus?.lastSyncAt)}
        </div>

        {driveStatus?.error && (
          <div style={{ fontSize: '13px', color: 'var(--error)', marginBottom: '12px' }}>
            {driveStatus.error}
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleDriveConnect}
          disabled={driveConnecting}
          style={{ width: '100%', marginBottom: '12px' }}
        >
          {driveStatus?.state === 'needs_auth' ? 'Reconnect Google Drive' : 'Connect Google Drive'}
        </button>

        <button
          className="btn btn-secondary"
          onClick={handleDriveSync}
          disabled={driveStatus?.state !== 'connected' || driveStatus?.syncing}
          style={{ width: '100%', marginBottom: '12px' }}
        >
          {driveStatus?.syncing ? 'Syncing…' : 'Sync Now'}
        </button>

        <button
          className="btn btn-secondary"
          onClick={handleDriveDisconnect}
          disabled={driveStatus?.state === 'disconnected'}
          style={{ width: '100%' }}
        >
          Disconnect
        </button>
      </div>

      {/* Preferences */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          {t('preferences') || 'Preferences'}
        </h2>

        <div style={{ marginBottom: '16px' }}>
          <LanguageSelector
            language={settings?.language || 'en'}
            onChange={(lang) => onUpdateSettings({ language: lang })}
          />
        </div>

        <ThemeSwitcher
          currentTheme={settings?.theme || 'lofi'}
          onChange={(theme) => onUpdateSettings({ theme })}
        />

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <input
            type="checkbox"
            checked={settings?.tones ?? true}
            onChange={(e) => onUpdateSettings({ tones: e.target.checked })}
          />
          <span>{t('enable_tones') || 'Enable completion tones'}</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={settings?.wakeLockDefault ?? false}
            onChange={(e) => onUpdateSettings({ wakeLockDefault: e.target.checked })}
          />
          <span>{t('enable_wakelock') || 'Enable wake lock by default'}</span>
        </label>
      </div>

      {/* One-off Management */}
      <div className="card">
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          {t('oneoff_management') || 'One-off Items'}
        </h2>

        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          {t('oneoff_description') || 'One-off items disappear after completion. Reset them to make them appear again.'}
        </p>

        <button
          className="btn btn-secondary"
          onClick={handleResetOneOffs}
          style={{ width: '100%' }}
        >
          🔄 {t('reset_oneoffs') || 'Reset One-off Items'}
        </button>
      </div>
    </div>
  )
}
