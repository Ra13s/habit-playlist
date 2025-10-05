/**
 * Data model types and schemas for Program V2
 */

// Item types
export const ItemType = {
  TIMER: 'timer',
  CHECK: 'check',
  LINK: 'link',
  NOTE: 'note',
}

// Slot names
export const Slot = {
  MORNING: 'morning',
  MIDDAY: 'midday',
  EVENING: 'evening',
}

/**
 * Default Program V2 structure
 */
export const createDefaultProgram = () => ({
  version: 2,
  items: {},
  playlists: {
    morning: [],
    midday: [],
    evening: [],
  },
  schedule: {
    rules: [],
    overrides: {},
  },
  content: {
    exercises: {},
  },
  settings: {
    tones: true,
    wakeLockDefault: false,
    language: 'en',
    theme: 'lofi',
  },
})

/**
 * Default Progress V2 structure
 */
export const createDefaultProgress = () => ({
  sessions: [],
  itemCompletions: [],
})

/**
 * Validates a Program V2 object
 */
export const validateProgram = (program) => {
  if (!program || typeof program !== 'object') {
    return { valid: false, error: 'Program must be an object' }
  }

  if (program.version !== 2) {
    return { valid: false, error: 'Program version must be 2' }
  }

  if (!program.items || typeof program.items !== 'object') {
    return { valid: false, error: 'Program must have items object' }
  }

  if (!program.playlists || typeof program.playlists !== 'object') {
    return { valid: false, error: 'Program must have playlists object' }
  }

  return { valid: true }
}

/**
 * Creates a timer item
 */
export const createTimerItem = (id, { title, description, duration, tags = [], oneOff = false, enabled = true }) => ({
  id,
  type: ItemType.TIMER,
  title,
  description,
  duration,
  tags,
  oneOff,
  enabled,
})

/**
 * Creates a check item
 */
export const createCheckItem = (id, { title, description, tags = [], oneOff = false, enabled = true }) => ({
  id,
  type: ItemType.CHECK,
  title,
  description,
  tags,
  oneOff,
  enabled,
})

/**
 * Creates a link item
 */
export const createLinkItem = (id, { title, description, url, tags = [], oneOff = false, enabled = true }) => ({
  id,
  type: ItemType.LINK,
  title,
  description,
  url,
  tags,
  oneOff,
  enabled,
})

/**
 * Creates a note item
 */
export const createNoteItem = (id, { title, description, tags = [], oneOff = false, enabled = true }) => ({
  id,
  type: ItemType.NOTE,
  title,
  description,
  tags,
  oneOff,
  enabled,
})
