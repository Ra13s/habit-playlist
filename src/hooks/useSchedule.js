import { useMemo } from 'react'

/**
 * Hook for schedule resolution - reads schedule from items
 */
export const useSchedule = (program) => {
  /**
   * Check if an item should appear on a specific date and slot
   */
  const itemAppliesToDateAndSlot = (item, date, slot) => {
    if (!item.schedule) return false
    if (item.schedule.slot !== slot) return false

    const dateObj = new Date(date)
    const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][dateObj.getDay()]

    if (item.schedule.type === 'weekday') {
      return item.schedule.days && item.schedule.days.includes(dayOfWeek)
    } else if (item.schedule.type === 'interval') {
      const start = new Date(item.schedule.startDate)
      const daysDiff = Math.floor((dateObj - start) / (1000 * 60 * 60 * 24))
      return daysDiff >= 0 && daysDiff % item.schedule.every === 0
    }

    return false
  }

  /**
   * Get items for a specific date and slot
   */
  const getItemsForDateAndSlot = useMemo(() => {
    return (date, slot) => {
      if (!program) return []

      const items = []

      // Check all items to see if they apply to this date/slot
      Object.values(program.items).forEach(item => {
        if (itemAppliesToDateAndSlot(item, date, slot)) {
          items.push({ id: item.id })
        }
      })

      // Also check old playlists system for backward compatibility
      const basePlaylist = program.playlists?.[slot] || []
      basePlaylist.forEach(ref => {
        if (program.items[ref.id] && !items.find(item => item.id === ref.id)) {
          items.push(ref)
        }
      })

      // Also check old schedule rules for backward compatibility
      if (program.schedule?.rules) {
        const dateObj = new Date(date)
        const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][dateObj.getDay()]

        program.schedule.rules.forEach(rule => {
          if (rule.slot && rule.slot !== slot) return

          let applies = false

          if (rule.type === 'weekday' && rule.days?.includes(dayOfWeek)) {
            applies = true
          } else if (rule.type === 'interval' && rule.every && rule.startDate) {
            const start = new Date(rule.startDate)
            const daysDiff = Math.floor((dateObj - start) / (1000 * 60 * 60 * 24))
            if (daysDiff >= 0 && daysDiff % rule.every === 0) {
              applies = true
            }
          }

          if (applies && rule.routines) {
            rule.routines.forEach(id => {
              if (program.items[id] && !items.find(item => item.id === id)) {
                items.push({ id })
              }
            })
          }
        })
      }

      return items
    }
  }, [program])

  /**
   * Get all items for a date (all slots)
   */
  const getItemsForDate = useMemo(() => {
    return (date) => {
      if (!program) return {}

      return {
        morning: getItemsForDateAndSlot(date, 'morning'),
        midday: getItemsForDateAndSlot(date, 'midday'),
        evening: getItemsForDateAndSlot(date, 'evening'),
      }
    }
  }, [program, getItemsForDateAndSlot])

  /**
   * Format date as YYYY-MM-DD
   */
  const formatDate = (date) => {
    const d = date instanceof Date ? date : new Date(date)
    return d.toISOString().split('T')[0]
  }

  /**
   * Get today's date formatted
   */
  const getToday = () => {
    return formatDate(new Date())
  }

  return {
    getItemsForDateAndSlot,
    getItemsForDate,
    formatDate,
    getToday,
  }
}
