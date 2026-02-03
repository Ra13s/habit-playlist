import { useState, useEffect } from 'react'
import { useAppData } from './hooks/useAppData'
import { useSchedule } from './hooks/useSchedule'
import { applyTheme } from './themes'
import { Welcome } from './views/Welcome'
import { SlotView } from './views/SlotView'
import { Wizard } from './views/Wizard'
import { Settings } from './views/Settings'
import { Schedule } from './views/Schedule'

function App() {
  const appData = useAppData()

  

  const {
    program,
    progress,
    loading,
    settings,
    updateSettings,
    exportProgram,
    importProgram,
    resetOneOffs,
    recordSession,
    recordItemCompletion,
    isItemCompleted,
    addItem,
    updateItem,
    deleteItem,
    driveStatus,
    connectDrive,
    disconnectDrive,
    syncToDriveNow,
    applyRemoteData,
    overwriteDriveWithLocal,
  } = appData

  

  const { getItemsForDateAndSlot, getItemsForDate, formatDate, getToday } = useSchedule(program)

  const [view, setView] = useState('welcome')
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [wizardItems, setWizardItems] = useState([])

  // Apply theme on mount and when settings change
  useEffect(() => {
    if (settings) {
      applyTheme(settings.theme || 'lofi')
    }
  }, [settings?.theme])

  if (loading) {
    // Render nothing to avoid any flash before data/theme are ready
    return null
  }

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot)
    setView('slot')
  }

  const handleStartAll = (items) => {
    setWizardItems(items.map(ref => program.items[ref.id]).filter(Boolean))
    setView('wizard')
  }

  const handleStartItem = (item) => {
    setWizardItems([item])
    setView('wizard')
  }

  const handleCompleteWizard = (completedCount, totalItems) => {
    recordSession(selectedSlot, getToday(), completedCount, totalItems)
    setView('welcome')
    setWizardItems([])
    setSelectedSlot(null)
  }

  const handleCancelWizard = () => {
    setView(selectedSlot ? 'slot' : 'welcome')
    setWizardItems([])
  }

  const handleShowSchedule = () => {
    setView('schedule')
  }

  const handleShowSettings = () => {
    setView('settings')
  }

  const handleBack = () => {
    setView('welcome')
    setSelectedSlot(null)
  }

  return (
    <div>
      {view === 'welcome' && (
        <>
          <Welcome
            settings={settings}
            onUpdateSettings={updateSettings}
            onSelectSlot={handleSelectSlot}
            onShowSchedule={handleShowSchedule}
            program={program}
            getItemsForDate={getItemsForDate}
            onAddItem={addItem}
            onUpdateItem={updateItem}
            onDeleteItem={deleteItem}
            onExport={exportProgram}
            onImport={importProgram}
          />
          <div style={{ position: 'fixed', top: '16px', right: '16px' }}>
            <button
              onClick={handleShowSettings}
              className="btn-secondary"
              style={{ padding: '8px 16px', fontSize: '14px' }}
            >
              ⚙️ Settings
            </button>
          </div>
        </>
      )}

      {view === 'slot' && selectedSlot && (
        <SlotView
          slot={selectedSlot}
          items={getItemsForDateAndSlot(getToday(), selectedSlot)}
          program={program}
          onStartAll={handleStartAll}
          onStartItem={handleStartItem}
          onBack={handleBack}
          settings={settings}
          isItemCompleted={isItemCompleted}
        />
      )}

      {view === 'wizard' && (
        <Wizard
          items={wizardItems}
          slot={selectedSlot}
          date={getToday()}
          onComplete={handleCompleteWizard}
          onCancel={handleCancelWizard}
          settings={settings}
          recordItemCompletion={recordItemCompletion}
        />
      )}

      {view === 'settings' && (
        <Settings
          settings={settings}
          program={program}
          onUpdateSettings={updateSettings}
          onExport={exportProgram}
          onImport={importProgram}
          onResetOneOffs={resetOneOffs}
          driveStatus={driveStatus}
          onDriveConnect={connectDrive}
          onDriveDisconnect={disconnectDrive}
          onDriveSync={syncToDriveNow}
          onDriveApplyRemote={applyRemoteData}
          onDriveOverwriteWithLocal={overwriteDriveWithLocal}
          onBack={handleBack}
        />
      )}

      {view === 'schedule' && program && (
        <>
          <Schedule
            program={program}
            getItemsForDate={getItemsForDate}
            onBack={handleBack}
            settings={settings}
            onAddItem={addItem}
            onUpdateItem={updateItem}
            onDeleteItem={deleteItem}
            onExport={exportProgram}
            onImport={importProgram}
          />
        </>
      )}
    </div>
  )
}

export default App
