import { useState, useEffect, useCallback, useRef } from 'react'
import { createDefaultProgram, createDefaultProgress, validateProgram } from '../types'
import {
  DRIVE_SCOPE_APPDATA,
  loadGisScript,
  listHabitsFile,
  createHabitsFile,
  downloadJson,
  uploadJson,
} from '../services/googleDrive'

// Primary storage keys for Habit Playlists
const STORAGE_KEY_PROGRAM = 'habitPlaylistProgramV2'
const STORAGE_KEY_PROGRESS = 'habitPlaylistProgressV2'
// Legacy keys (backward compatibility)
const LEGACY_KEY_PROGRAM = 'postureCoachUserProgramV2'
const LEGACY_KEY_PROGRESS = 'postureCoachProgressV2'
// Google Drive sync keys
const DRIVE_FILE_ID_KEY = 'habitPlaylistDriveFileId'
const DRIVE_SYNC_FILE_NAME = 'habits.json'
const DRIVE_SYNC_VERSION = 1

/**
 * Main hook for managing app data (Program V2 and Progress V2)
 * Handles localStorage persistence, migration, import/export
 */
export const useAppData = () => {
  const [program, setProgram] = useState(null)
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [driveStatus, setDriveStatus] = useState({
    state: 'disconnected',
    syncing: false,
    lastSyncAt: null,
    error: null,
  })

  const driveTokenRef = useRef(null)
  const driveTokenClientRef = useRef(null)
  const driveFileIdRef = useRef(localStorage.getItem(DRIVE_FILE_ID_KEY) || null)
  const driveSyncTimerRef = useRef(null)
  const driveStatusRef = useRef(driveStatus)
  const latestProgramRef = useRef(null)
  const latestProgressRef = useRef(null)

  useEffect(() => {
    driveStatusRef.current = driveStatus
  }, [driveStatus])

  useEffect(() => {
    latestProgramRef.current = program
  }, [program])

  useEffect(() => {
    latestProgressRef.current = progress
  }, [progress])

  // Load program and progress from localStorage or seed
  useEffect(() => {
    const loadData = async () => {
      try {
        let programData

        // Prefer localStorage in both DEV and PROD. Fallback to seed.
        
        // Prefer new key, fallback to legacy
        let storedProgram = localStorage.getItem(STORAGE_KEY_PROGRAM)
        if (!storedProgram) {
          storedProgram = localStorage.getItem(LEGACY_KEY_PROGRAM)
        }

        if (storedProgram) {
          try {
            programData = JSON.parse(storedProgram)
          } catch (e) {
            console.error('[AppData] loadData: failed to parse program from localStorage', e)
          }
          const validation = validateProgram(programData)
          if (!validation.valid) {
            console.error('[AppData] loadData: Invalid program in localStorage:', validation.error)
            programData = null
          }
        }

        if (!programData) {
          // Try to load seed from public/program.json
          try {
            const response = await fetch('/program.json')
            if (response.ok) {
              const data = await response.json()
              // Handle both {"program": {...}} and direct {...} formats
              programData = data.program || data
              const validation = validateProgram(programData)
              if (!validation.valid) {
                console.error('[AppData] loadData: Invalid seed program:', validation.error)
                programData = createDefaultProgram()
              }
            } else {
              programData = createDefaultProgram()
            }
          } catch (error) {
            console.error('[AppData] loadData: Error loading seed program:', error)
            programData = createDefaultProgram()
          }

          // Save to localStorage so subsequent reloads use local version
          localStorage.setItem(STORAGE_KEY_PROGRAM, JSON.stringify(programData))
        }

        // Ensure content/exercises structure exists and clear embedded exercises
        if (!programData.content) {
          programData.content = { exercises: {} }
        } else if (!('exercises' in programData.content)) {
          programData.content.exercises = {}
        } else if (programData.content.exercises && Object.keys(programData.content.exercises).length > 0) {
          programData = {
            ...programData,
            content: { ...programData.content, exercises: {} },
          }
          localStorage.setItem(STORAGE_KEY_PROGRAM, JSON.stringify(programData))
          
        }

        setProgram(programData)

        // Load progress
        let storedProgress = localStorage.getItem(STORAGE_KEY_PROGRESS)
        if (!storedProgress) {
          storedProgress = localStorage.getItem(LEGACY_KEY_PROGRESS)
        }
        const progressData = storedProgress ? JSON.parse(storedProgress) : createDefaultProgress()
        setProgress(progressData)

        setLoading(false)
      } catch (error) {
        console.error('[AppData] loadData: Error loading app data:', error)
        setProgram(createDefaultProgram())
        setProgress(createDefaultProgress())
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const buildDrivePayload = useCallback(() => {
    return {
      version: DRIVE_SYNC_VERSION,
      updatedAt: new Date().toISOString(),
      program: latestProgramRef.current,
      progress: latestProgressRef.current,
    }
  }, [])

  const markDriveAuthExpired = useCallback((message) => {
    setDriveStatus((prev) => ({
      ...prev,
      state: 'needs_auth',
      syncing: false,
      error: message || 'Google Drive authorization expired. Please reconnect.',
    }))
  }, [])

  const ensureDriveFile = useCallback(async (accessToken) => {
    if (driveFileIdRef.current) {
      return driveFileIdRef.current
    }

    const existing = await listHabitsFile(accessToken, DRIVE_SYNC_FILE_NAME)
    if (existing?.id) {
      driveFileIdRef.current = existing.id
      localStorage.setItem(DRIVE_FILE_ID_KEY, existing.id)
      return existing.id
    }

    const created = await createHabitsFile(accessToken, DRIVE_SYNC_FILE_NAME, buildDrivePayload())
    driveFileIdRef.current = created.id
    localStorage.setItem(DRIVE_FILE_ID_KEY, created.id)
    return created.id
  }, [buildDrivePayload])

  const syncToDriveNow = useCallback(async () => {
    if (!driveTokenRef.current || driveStatusRef.current.state !== 'connected') {
      return false
    }

    setDriveStatus((prev) => ({ ...prev, syncing: true, error: null }))
    try {
      const accessToken = driveTokenRef.current
      const fileId = await ensureDriveFile(accessToken)
      await uploadJson(accessToken, fileId, buildDrivePayload())
      setDriveStatus((prev) => ({
        ...prev,
        syncing: false,
        lastSyncAt: new Date().toISOString(),
        error: null,
      }))
      return true
    } catch (error) {
      if (error?.status === 401) {
        markDriveAuthExpired()
        return false
      }
      setDriveStatus((prev) => ({ ...prev, syncing: false, error: error.message || 'Drive sync failed' }))
      return false
    }
  }, [buildDrivePayload, ensureDriveFile, markDriveAuthExpired])

  const scheduleDriveSync = useCallback(() => {
    if (driveStatusRef.current.state !== 'connected' || !driveTokenRef.current) {
      return
    }
    if (driveSyncTimerRef.current) {
      clearTimeout(driveSyncTimerRef.current)
    }
    driveSyncTimerRef.current = setTimeout(() => {
      syncToDriveNow()
    }, 1200)
  }, [syncToDriveNow])

  // Save program to localStorage
  const saveProgram = useCallback((newProgram) => {
    const validation = validateProgram(newProgram)
    if (!validation.valid) {
      console.error('[AppData] saveProgram: Cannot save invalid program:', validation.error)
      return false
    }

    try {
      localStorage.setItem(STORAGE_KEY_PROGRAM, JSON.stringify(newProgram))
      setProgram(newProgram)
      scheduleDriveSync()
      return true
    } catch (error) {
      console.error('[AppData] saveProgram: Error saving program:', error)
      return false
    }
  }, [scheduleDriveSync])

  // Save progress to localStorage
  const saveProgress = useCallback((newProgress) => {
    try {
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(newProgress))
      setProgress(newProgress)
      scheduleDriveSync()
      return true
    } catch (error) {
      console.error('[AppData] saveProgress: Error saving progress:', error)
      return false
    }
  }, [scheduleDriveSync])

  // Update settings
  const updateSettings = useCallback((settingsPatch) => {
    if (!program) return false

    const updatedProgram = {
      ...program,
      settings: {
        ...program.settings,
        ...settingsPatch,
      },
    }

    return saveProgram(updatedProgram)
  }, [program, saveProgram])

  // Export program
  const exportProgram = useCallback(({ includeProgress = false } = {}) => {
    if (!program) return null

    const exportData = {
      program,
      ...(includeProgress && progress ? { progress } : {}),
    }

    return JSON.stringify(exportData, null, 2)
  }, [program, progress])

  // Import program
  const importProgram = useCallback((jsonString, { mode = 'replace' } = {}) => {
    try {
      const data = JSON.parse(jsonString)
      let importedProgram = data.program || data

      const validation = validateProgram(importedProgram)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Ensure settings has theme (for backward compatibility)
      if (importedProgram.settings && !importedProgram.settings.theme) {
        importedProgram.settings.theme = 'lofi'
      }

      if (mode === 'replace') {
        saveProgram(importedProgram)
        if (data.progress) {
          saveProgress(data.progress)
        }
      } else if (mode === 'merge') {
        // Merge items
        const mergedItems = { ...program.items, ...importedProgram.items }

        // Merge playlists (dedup by id)
        const mergedPlaylists = {}
        Object.keys(program.playlists).forEach(slot => {
          const existingIds = new Set(program.playlists[slot].map(ref => ref.id))
          const newItems = (importedProgram.playlists[slot] || []).filter(ref => !existingIds.has(ref.id))
          mergedPlaylists[slot] = [...program.playlists[slot], ...newItems]
        })

        const mergedProgram = {
          ...program,
          items: mergedItems,
          playlists: mergedPlaylists,
          schedule: {
            rules: [...(program.schedule?.rules || []), ...(importedProgram.schedule?.rules || [])],
            overrides: { ...(program.schedule?.overrides || {}), ...(importedProgram.schedule?.overrides || {}) },
          },
          content: {
            exercises: { ...(program.content?.exercises || {}), ...(importedProgram.content?.exercises || {}) },
          },
        }

        saveProgram(mergedProgram)
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [program, saveProgram, saveProgress])

  const connectDrive = useCallback(async ({ strategy = 'ask' } = {}) => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      throw new Error('Missing VITE_GOOGLE_CLIENT_ID. Add it to your Vite environment variables.')
    }

    await loadGisScript()
    if (!driveTokenClientRef.current) {
      driveTokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: DRIVE_SCOPE_APPDATA,
        callback: () => {},
      })
    }

    const tokenResponse = await new Promise((resolve, reject) => {
      driveTokenClientRef.current.callback = (resp) => {
        if (resp?.error) {
          reject(new Error(resp.error))
        } else {
          resolve(resp)
        }
      }
      driveTokenClientRef.current.requestAccessToken({ prompt: 'consent' })
    })

    driveTokenRef.current = tokenResponse.access_token
    setDriveStatus((prev) => ({ ...prev, state: 'connected', error: null }))

    const existing = await listHabitsFile(driveTokenRef.current, DRIVE_SYNC_FILE_NAME)
    if (!existing) {
      const created = await createHabitsFile(driveTokenRef.current, DRIVE_SYNC_FILE_NAME, buildDrivePayload())
      driveFileIdRef.current = created.id
      localStorage.setItem(DRIVE_FILE_ID_KEY, created.id)
      setDriveStatus((prev) => ({
        ...prev,
        lastSyncAt: new Date().toISOString(),
        error: null,
      }))
      return { action: 'created' }
    }

    driveFileIdRef.current = existing.id
    localStorage.setItem(DRIVE_FILE_ID_KEY, existing.id)
    if (existing.modifiedTime) {
      setDriveStatus((prev) => ({ ...prev, lastSyncAt: existing.modifiedTime }))
    }

    if (strategy === 'preferLocal') {
      await uploadJson(driveTokenRef.current, existing.id, buildDrivePayload())
      setDriveStatus((prev) => ({
        ...prev,
        lastSyncAt: new Date().toISOString(),
        error: null,
      }))
      return { action: 'overwrote_remote' }
    }

    const remoteData = await downloadJson(driveTokenRef.current, existing.id)
    if (strategy === 'preferRemote') {
      return { action: 'loaded_remote', remoteData }
    }

    return { action: 'found_remote', remoteData }
  }, [buildDrivePayload])

  const applyRemoteData = useCallback((remoteData) => {
    if (!remoteData?.program) {
      return { success: false, error: 'Drive file missing program data.' }
    }

    const validation = validateProgram(remoteData.program)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    saveProgram(remoteData.program)
    if (remoteData.progress) {
      saveProgress(remoteData.progress)
    }
    return { success: true }
  }, [saveProgram, saveProgress])

  const overwriteDriveWithLocal = useCallback(async () => {
    if (!driveTokenRef.current) {
      return { success: false, error: 'Not connected to Google Drive.' }
    }
    try {
      const fileId = await ensureDriveFile(driveTokenRef.current)
      await uploadJson(driveTokenRef.current, fileId, buildDrivePayload())
      setDriveStatus((prev) => ({
        ...prev,
        lastSyncAt: new Date().toISOString(),
        error: null,
      }))
      return { success: true }
    } catch (error) {
      if (error?.status === 401) {
        markDriveAuthExpired()
        return { success: false, error: 'Authorization expired. Please reconnect.' }
      }
      return { success: false, error: error.message || 'Failed to overwrite Drive data.' }
    }
  }, [buildDrivePayload, ensureDriveFile, markDriveAuthExpired])

  const disconnectDrive = useCallback(() => {
    driveTokenRef.current = null
    driveTokenClientRef.current = null
    driveFileIdRef.current = null
    localStorage.removeItem(DRIVE_FILE_ID_KEY)
    setDriveStatus({ state: 'disconnected', syncing: false, lastSyncAt: null, error: null })
  }, [])

  // Reset one-off items
  const resetOneOffs = useCallback(() => {
    if (!progress) return false

    const resetProgress = {
      ...progress,
      itemCompletions: progress.itemCompletions.filter(completion => {
        const item = program?.items[completion.itemId]
        return item && !item.oneOff
      }),
    }

    return saveProgress(resetProgress)
  }, [progress, program, saveProgress])

  // Record session completion
  const recordSession = useCallback((slot, date, itemsCompleted, totalItems) => {
    if (!progress) return false

    const session = {
      slot,
      date,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      itemsCompleted,
      totalItems,
    }

    const updatedProgress = {
      ...progress,
      sessions: [...progress.sessions, session],
    }

    return saveProgress(updatedProgress)
  }, [progress, saveProgress])

  // Record item completion
  const recordItemCompletion = useCallback((itemId, slot, date) => {
    if (!progress) return false

    const completion = {
      itemId,
      slot,
      date,
      completedAt: new Date().toISOString(),
    }

    const updatedProgress = {
      ...progress,
      itemCompletions: [...progress.itemCompletions, completion],
    }

    return saveProgress(updatedProgress)
  }, [progress, saveProgress])

  // Check if item is completed (for one-off filtering)
  const isItemCompleted = useCallback((itemId) => {
    if (!progress || !program) return false

    const item = program.items[itemId]
    if (!item || !item.oneOff) return false

    return progress.itemCompletions.some(c => c.itemId === itemId)
  }, [progress, program])

  // Add item
  const addItem = useCallback((item) => {
    if (!program) return false

    let nextProgram = {
      ...program,
      items: {
        ...program.items,
        [item.id]: item,
      },
    }

    // If an initial schedule is provided, mirror it into legacy structures
    if (item && item.schedule) {
      const sched = item.schedule

      // Remove any stale occurrences (shouldn't exist for new, but safe)
      const cleanedPlaylists = Object.fromEntries(
        Object.entries(nextProgram.playlists || {}).map(([slot, refs]) => [
          slot,
          (refs || []).filter(ref => ref.id !== item.id),
        ])
      )

      const existingRules = (nextProgram.schedule?.rules || [])
      const prunedRules = existingRules
        .map(rule => ({
          ...rule,
          routines: (rule.routines || []).filter(id => id !== item.id),
        }))
        .filter(rule => (rule.routines && rule.routines.length > 0))

      const rulesAfterApply = [...prunedRules]

      if (sched.type === 'weekday') {
        const days = Array.isArray(sched.days) ? sched.days.slice().sort() : []
        if (days.length > 0) {
          const matchIdx = rulesAfterApply.findIndex(r =>
            r.type === 'weekday' &&
            Array.isArray(r.days) &&
            r.days.slice().sort().join(',') === days.join(',') &&
            r.slot === sched.slot
          )
          if (matchIdx >= 0) {
            const r = rulesAfterApply[matchIdx]
            if (!r.routines.includes(item.id)) {
              rulesAfterApply[matchIdx] = { ...r, routines: [...r.routines, item.id] }
            }
          } else {
            rulesAfterApply.push({ type: 'weekday', days, slot: sched.slot, routines: [item.id] })
          }
        }
      } else if (sched.type === 'interval') {
        const key = `${sched.every}|${sched.startDate}|${sched.slot}`
        const matchIdx = rulesAfterApply.findIndex(r =>
          r.type === 'interval' && `${r.every}|${r.startDate}|${r.slot}` === key
        )
        if (matchIdx >= 0) {
          const r = rulesAfterApply[matchIdx]
          if (!r.routines.includes(item.id)) {
            rulesAfterApply[matchIdx] = { ...r, routines: [...r.routines, item.id] }
          }
        } else {
          rulesAfterApply.push({ type: 'interval', every: sched.every, startDate: sched.startDate, slot: sched.slot, routines: [item.id] })
        }
      }

      nextProgram = {
        ...nextProgram,
        playlists: cleanedPlaylists,
        schedule: {
          ...(nextProgram.schedule || { rules: [], overrides: {} }),
          rules: rulesAfterApply,
        },
      }
      
    }

    const saved = saveProgram(nextProgram)
    return saved
  }, [program, saveProgram])

  // Update item
  const updateItem = useCallback((itemId, changes) => {
    if (!program || !program.items[itemId]) return false

    // Start from current program snapshot
    let nextProgram = {
      ...program,
      items: {
        ...program.items,
        [itemId]: { ...program.items[itemId], ...changes },
      },
    }
    

    // If schedule is provided on the item, mirror it into legacy playlists/rules
    // so older views remain consistent.
    if (changes && changes.schedule) {
      const sched = changes.schedule

      // 1) Remove item from all base playlists
      const cleanedPlaylists = Object.fromEntries(
        Object.entries(nextProgram.playlists || {}).map(([slot, refs]) => [
          slot,
          (refs || []).filter(ref => ref.id !== itemId),
        ])
      )

      // 2) Remove item from any existing rules; drop empty rules
      const existingRules = (nextProgram.schedule?.rules || [])
      const prunedRules = existingRules
        .map(rule => ({
          ...rule,
          routines: (rule.routines || []).filter(id => id !== itemId),
        }))
        .filter(rule => (rule.routines && rule.routines.length > 0))

      // 3) Add/update rule(s) based on new schedule
      const rulesAfterApply = [...prunedRules]

      if (sched.type === 'weekday') {
        const days = Array.isArray(sched.days) ? sched.days.slice().sort() : []
        if (days.length > 0) {
          // Try to find a matching rule to append to
          const matchIdx = rulesAfterApply.findIndex(r =>
            r.type === 'weekday' &&
            Array.isArray(r.days) &&
            r.days.slice().sort().join(',') === days.join(',') &&
            r.slot === sched.slot
          )
          if (matchIdx >= 0) {
            const r = rulesAfterApply[matchIdx]
            if (!r.routines.includes(itemId)) {
              rulesAfterApply[matchIdx] = { ...r, routines: [...r.routines, itemId] }
            }
          } else {
            rulesAfterApply.push({ type: 'weekday', days, slot: sched.slot, routines: [itemId] })
          }
        }
      } else if (sched.type === 'interval') {
        const key = `${sched.every}|${sched.startDate}|${sched.slot}`
        const matchIdx = rulesAfterApply.findIndex(r =>
          r.type === 'interval' && `${r.every}|${r.startDate}|${r.slot}` === key
        )
        if (matchIdx >= 0) {
          const r = rulesAfterApply[matchIdx]
          if (!r.routines.includes(itemId)) {
            rulesAfterApply[matchIdx] = { ...r, routines: [...r.routines, itemId] }
          }
        } else {
          rulesAfterApply.push({ type: 'interval', every: sched.every, startDate: sched.startDate, slot: sched.slot, routines: [itemId] })
        }
      }

      nextProgram = {
        ...nextProgram,
        playlists: cleanedPlaylists,
        schedule: {
          ...(nextProgram.schedule || { rules: [], overrides: {} }),
          rules: rulesAfterApply,
        },
      }
      
    }

    const saved = saveProgram(nextProgram)
    return saved
  }, [program, saveProgram])

  // Delete item
  const deleteItem = useCallback((itemId) => {
    if (!program || !program.items[itemId]) return false

    const { [itemId]: removed, ...remainingItems } = program.items

    // Remove from playlists
    const cleanedPlaylists = Object.fromEntries(
      Object.entries(program.playlists || {}).map(([slot, refs]) => [
        slot,
        (refs || []).filter(ref => ref.id !== itemId),
      ])
    )

    // Remove from rules and drop empties
    const prunedRules = (program.schedule?.rules || [])
      .map(rule => ({
        ...rule,
        routines: (rule.routines || []).filter(id => id !== itemId),
      }))
      .filter(rule => (rule.routines && rule.routines.length > 0))

    const updatedProgram = {
      ...program,
      items: remainingItems,
      playlists: cleanedPlaylists,
      schedule: {
        ...(program.schedule || { rules: [], overrides: {} }),
        rules: prunedRules,
      },
    }

    const saved = saveProgram(updatedProgram)
    return saved
  }, [program, saveProgram])

  const returnValue = {
    program,
    progress,
    loading,
    settings: program?.settings,
    saveProgram,
    saveProgress,
    updateSettings,
    exportProgram,
    importProgram,
    resetOneOffs,
    recordSession,
    recordItemCompletion,
    isItemCompleted,
    // Editor functions
    addItem,
    updateItem,
    deleteItem,
    // Google Drive sync
    driveStatus,
    connectDrive,
    disconnectDrive,
    syncToDriveNow,
    applyRemoteData,
    overwriteDriveWithLocal,
  }

  

  return returnValue
}
