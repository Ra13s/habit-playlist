// Validation helpers for items and schedule rules

export const ItemType = {
  TIMER: 'timer',
  CHECK: 'check',
  LINK: 'link',
  NOTE: 'note',
}

export const validateItemId = (id, existingIds = []) => {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'Item ID is required' }
  }
  if (!/^[a-z0-9_]+$/.test(id)) {
    return { valid: false, error: 'Item ID must be lowercase letters, numbers, and underscores only' }
  }
  if (existingIds.includes(id)) {
    return { valid: false, error: 'Item ID already exists' }
  }
  return { valid: true }
}

export const validateItem = (item, existingIds = []) => {
  const errors = []

  // Check ID
  if (item.id) {
    const idCheck = validateItemId(item.id, existingIds.filter(id => id !== item.id))
    if (!idCheck.valid) errors.push(idCheck.error)
  } else {
    errors.push('Item ID is required')
  }

  // Check type
  if (!Object.values(ItemType).includes(item.type)) {
    errors.push('Invalid item type')
  }

  // Check title
  if (!item.title || typeof item.title !== 'string' || item.title.trim().length === 0) {
    errors.push('Title is required')
  }

  // Type-specific validation
  if (item.type === ItemType.TIMER) {
    if (!item.duration || item.duration <= 0) {
      errors.push('Duration must be greater than 0')
    }
  }

  if (item.type === ItemType.LINK) {
    if (!item.url || typeof item.url !== 'string') {
      errors.push('URL is required for link items')
    } else {
      try {
        new URL(item.url)
      } catch {
        errors.push('Invalid URL format')
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export const validateScheduleRule = (rule, program) => {
  const errors = []

  // Check type
  if (!['weekday', 'interval'].includes(rule.type)) {
    errors.push('Rule type must be "weekday" or "interval"')
  }

  // Check slot
  if (!['morning', 'midday', 'evening'].includes(rule.slot)) {
    errors.push('Slot must be "morning", "midday", or "evening"')
  }

  // Check routines exist
  if (!rule.routines || !Array.isArray(rule.routines)) {
    errors.push('Routines must be an array')
  } else {
    const missingIds = rule.routines.filter(id => !program.items[id])
    if (missingIds.length > 0) {
      errors.push(`Items not found: ${missingIds.join(', ')}`)
    }
  }

  // Type-specific validation
  if (rule.type === 'weekday') {
    if (!rule.days || !Array.isArray(rule.days) || rule.days.length === 0) {
      errors.push('At least one day is required')
    } else {
      const validDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
      const invalidDays = rule.days.filter(d => !validDays.includes(d))
      if (invalidDays.length > 0) {
        errors.push(`Invalid days: ${invalidDays.join(', ')}`)
      }
    }
  }

  if (rule.type === 'interval') {
    if (!rule.every || rule.every <= 0) {
      errors.push('Interval must be greater than 0')
    }
    if (!rule.startDate) {
      errors.push('Start date is required')
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(rule.startDate)) {
        errors.push('Start date must be in YYYY-MM-DD format')
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export const findItemDependencies = (itemId, program) => {
  const dependencies = {
    playlists: [],
    scheduleRules: [],
  }

  // Check base playlists
  Object.keys(program.playlists).forEach(slot => {
    if (program.playlists[slot].some(ref => ref.id === itemId)) {
      dependencies.playlists.push(slot)
    }
  })

  // Check schedule rules
  program.schedule.rules.forEach((rule, index) => {
    if (rule.routines && rule.routines.includes(itemId)) {
      dependencies.scheduleRules.push({ index, rule })
    }
  })

  return dependencies
}

export const generateItemId = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 50)
}

/**
 * Extract schedule configuration for an item from playlists and rules
 * Returns a schedule object that can be used in the ItemEditor
 */
export const extractItemSchedule = (itemId, program) => {
  const defaultSchedule = {
    type: 'weekday',
    days: [],
    every: 3,
    startDate: new Date().toISOString().split('T')[0],
    slot: 'morning',
  }

  // Check if item is in base playlists
  for (const slot of ['morning', 'midday', 'evening']) {
    if (program.playlists[slot]?.some(ref => ref.id === itemId)) {
      // Item is in base playlist - appears every day in this slot
      return {
        type: 'weekday',
        days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
        every: 1,
        startDate: new Date().toISOString().split('T')[0],
        slot,
      }
    }
  }

  // Check schedule rules
  const rulesWithItem = (program.schedule?.rules || []).filter(rule =>
    rule.routines && rule.routines.includes(itemId)
  )

  if (rulesWithItem.length > 0) {
    // If there are multiple weekday rules for the same slot, merge their days
    const weekdayRules = rulesWithItem.filter(r => r.type === 'weekday')
    if (weekdayRules.length > 0) {
      const targetSlot = weekdayRules[0].slot || 'morning'
      const daysSet = new Set()
      weekdayRules
        .filter(r => (r.slot || 'morning') === targetSlot)
        .forEach(r => (r.days || []).forEach(d => daysSet.add(d)))
      return {
        type: 'weekday',
        days: Array.from(daysSet),
        every: 1,
        startDate: new Date().toISOString().split('T')[0],
        slot: targetSlot,
      }
    }

    // Fallback: use the first interval rule
    const intervalRule = rulesWithItem.find(r => r.type === 'interval')
    if (intervalRule) {
      return {
        type: 'interval',
        days: [],
        every: intervalRule.every || 3,
        startDate: intervalRule.startDate || new Date().toISOString().split('T')[0],
        slot: intervalRule.slot || 'morning',
      }
    }
  }

  return defaultSchedule
}
