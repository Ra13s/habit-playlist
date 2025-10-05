import { useState, useEffect } from 'react'

/**
 * Hook for loading exercise content
 * Checks program.content first, then falls back to public/exercises.json
 */
export const useExerciseContent = (program, language = 'en') => {
  const [exercises, setExercises] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true)

      // First check if content is embedded in program
      if (program?.content?.exercises && Object.keys(program.content.exercises).length > 0) {
        setExercises(program.content.exercises)
        setLoading(false)
        return
      }

      // Fall back to loading from public files
      try {
        // Try locale-specific file first
        let response = await fetch(`/locales/${language}/exercises.json`)

        if (!response.ok) {
          // Fall back to default exercises.json
          response = await fetch('/exercises.json')
        }

        if (response.ok) {
          const data = await response.json()
          setExercises(data)
        } else {
          setExercises({})
        }
      } catch (error) {
        console.error('Error loading exercise content:', error)
        setExercises({})
      }

      setLoading(false)
    }

    if (program) {
      loadContent()
    }
  }, [program, language])

  /**
   * Get content for a specific exercise/item
   */
  const getContent = (itemId) => {
    return exercises[itemId] || null
  }

  return {
    exercises,
    loading,
    getContent,
  }
}
