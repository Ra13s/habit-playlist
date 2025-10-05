import { useState, useEffect, useCallback } from 'react'

const loadedTranslations = {}

/**
 * Hook for i18n with dynamic loading
 */
export const useTranslation = (language = 'en') => {
  const [translations, setTranslations] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTranslations = async () => {
      setLoading(true)

      // Check if already loaded
      if (loadedTranslations[language]) {
        setTranslations(loadedTranslations[language])
        setLoading(false)
        return
      }

      try {
        // Load common translations
        const commonResponse = await fetch(`/locales/${language}/common.json`)
        const common = commonResponse.ok ? await commonResponse.json() : {}

        // Load exercises translations
        const exercisesResponse = await fetch(`/locales/${language}/exercises.json`)
        const exercises = exercisesResponse.ok ? await exercisesResponse.json() : {}

        const merged = { ...common, ...exercises }
        loadedTranslations[language] = merged
        setTranslations(merged)
      } catch (error) {
        console.error('Error loading translations:', error)
        setTranslations({})
      }

      setLoading(false)
    }

    loadTranslations()
  }, [language])

  /**
   * Translate a key with optional variable substitution
   * Supports {{var}} syntax
   */
  const t = useCallback((key, vars = {}) => {
    let text = translations[key] || key

    // Replace variables
    Object.keys(vars).forEach(varKey => {
      text = text.replace(new RegExp(`{{${varKey}}}`, 'g'), vars[varKey])
    })

    return text
  }, [translations])

  return {
    t,
    loading,
    language,
  }
}
