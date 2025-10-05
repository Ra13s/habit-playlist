import { useState, useEffect } from 'react'
import { validateItem, generateItemId, ItemType, extractItemSchedule } from '../validation'

export const ItemEditor = ({ item, program, existingIds, onSave, onCancel }) => {
  const isEdit = !!item

  const defaultSchedule = {
    type: 'weekday', // 'weekday' or 'interval'
    days: [], // for weekday: ['mon', 'tue', ...]
    every: 3, // for interval: every N days
    startDate: new Date().toISOString().split('T')[0], // for interval
    slot: 'morning', // 'morning', 'midday', or 'evening'
  }

  const [formData, setFormData] = useState(
    item ? {
      ...item,
      schedule: item.schedule || extractItemSchedule(item.id, program)
    } : {
      id: '',
      type: ItemType.TIMER,
      title: '',
      description: '',
      duration: 1800, // 30 minutes default
      url: '',
      tags: [],
      oneOff: false,
      enabled: true,
      schedule: defaultSchedule
    }
  )
  const [errors, setErrors] = useState([])
  const [durationMinutes, setDurationMinutes] = useState(
    item?.duration ? Math.floor(item.duration / 60) : 30
  )

  // Auto-generate ID from title (only for new items)
  useEffect(() => {
    if (!isEdit && formData.title) {
      const generatedId = generateItemId(formData.title)
      setFormData(prev => ({ ...prev, id: generatedId }))
    }
  }, [formData.title, isEdit])

  // Update duration when minutes change
  useEffect(() => {
    if (formData.type === ItemType.TIMER) {
      setFormData(prev => ({ ...prev, duration: durationMinutes * 60 }))
    }
  }, [durationMinutes, formData.type])

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate
    const validation = validateItem(formData, existingIds)
    if (!validation.valid) {
      
      setErrors(validation.errors)
      return
    }

    // Convert tags string to array
    const itemToSave = {
      ...formData,
      tags: typeof formData.tags === 'string'
        ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        : formData.tags,
    }

    // Remove type-specific fields that don't apply
    if (itemToSave.type !== ItemType.TIMER) {
      delete itemToSave.duration
    }
    if (itemToSave.type !== ItemType.LINK) {
      delete itemToSave.url
    }

    onSave(itemToSave)
  }

  const handleTypeChange = (newType) => {
    setFormData(prev => ({ ...prev, type: newType }))
    setErrors([])
  }

  const tagsValue = Array.isArray(formData.tags) ? formData.tags.join(', ') : formData.tags

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        className="card"
        style={{
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
            {isEdit ? 'Edit Item' : 'Add Item'}
          </h2>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0 8px',
            }}
          >
            ×
          </button>
        </div>

        {errors.length > 0 && (
          <div
            style={{
              background: '#fee2e2',
              color: '#991b1b',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '16px',
            }}
          >
            {errors.map((error, i) => (
              <div key={i}>• {error}</div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Type Selection */}
          {!isEdit && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Item Type *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { type: ItemType.TIMER, icon: '⏱️', label: 'Timer' },
                  { type: ItemType.CHECK, icon: '✓', label: 'Check' },
                  { type: ItemType.LINK, icon: '🔗', label: 'Link' },
                  { type: ItemType.NOTE, icon: '📝', label: 'Note' },
                ].map(({ type, icon, label }) => (
                  <button
                    key={type}
                    type="button"
                    className="btn"
                    onClick={() => handleTypeChange(type)}
                    style={{
                      background: formData.type === type ? 'var(--primary)' : 'var(--surface)',
                      color: formData.type === type ? '#fff' : 'var(--text)',
                    }}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="btn-secondary"
              style={{ width: '100%', padding: '12px' }}
              placeholder="e.g., Morning Meditation"
              required
            />
          </div>

          {/* ID (editable for advanced users) */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px', color: 'var(--text-secondary)' }}>
              ID (auto-generated)
            </label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              className="btn-secondary"
              style={{ width: '100%', padding: '12px', fontSize: '14px' }}
              disabled={isEdit}
              placeholder="lowercase_with_underscores"
            />
          </div>

          {/* Timer Duration */}
          {formData.type === ItemType.TIMER && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Duration *
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '12px' }}
                  min="1"
                  required
                />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>minutes</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                {[5, 10, 15, 30, 45, 60].map(min => (
                  <button
                    key={min}
                    type="button"
                    className="btn-secondary"
                    onClick={() => setDurationMinutes(min)}
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    {min}m
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Link URL */}
          {formData.type === ItemType.LINK && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                URL *
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="btn-secondary"
                style={{ width: '100%', padding: '12px' }}
                placeholder="https://example.com"
                required
              />
            </div>
          )}

          {/* Description */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="btn-secondary"
              style={{ width: '100%', padding: '12px', minHeight: '80px', fontFamily: 'inherit' }}
              placeholder="Optional description..."
            />
          </div>

          {/* Tags */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tagsValue}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="btn-secondary"
              style={{ width: '100%', padding: '12px' }}
              placeholder="e.g., fitness, morning, daily"
            />
          </div>

          {/* One-off */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={formData.oneOff}
                onChange={(e) => setFormData({ ...formData, oneOff: e.target.checked })}
              />
              <span>One-off item (disappears after completion)</span>
            </label>
          </div>

          {/* Schedule Configuration */}
          <div className="card" style={{ marginBottom: '24px', padding: '16px', background: 'var(--surface)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
              Schedule
            </h3>

            {/* Schedule Type */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                When should this appear?
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setFormData({ ...formData, schedule: { ...formData.schedule, type: 'weekday' } })}
                  style={{
                    background: formData.schedule.type === 'weekday' ? 'var(--primary)' : 'transparent',
                    color: formData.schedule.type === 'weekday' ? '#fff' : 'var(--text)',
                    fontSize: '14px',
                    padding: '8px',
                  }}
                >
                  📆 Specific Days
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setFormData({ ...formData, schedule: { ...formData.schedule, type: 'interval' } })}
                  style={{
                    background: formData.schedule.type === 'interval' ? 'var(--primary)' : 'transparent',
                    color: formData.schedule.type === 'interval' ? '#fff' : 'var(--text)',
                    fontSize: '14px',
                    padding: '8px',
                  }}
                >
                  🔄 Every N Days
                </button>
              </div>
            </div>

            {/* Weekday Selection */}
            {formData.schedule.type === 'weekday' && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                  Select Days
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                  {[
                    { id: 'mon', label: 'M' },
                    { id: 'tue', label: 'T' },
                    { id: 'wed', label: 'W' },
                    { id: 'thu', label: 'T' },
                    { id: 'fri', label: 'F' },
                    { id: 'sat', label: 'S' },
                    { id: 'sun', label: 'S' },
                  ].map(day => {
                    const isSelected = formData.schedule.days.includes(day.id)
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => {
                          const newDays = isSelected
                            ? formData.schedule.days.filter(d => d !== day.id)
                            : [...formData.schedule.days, day.id]
                          setFormData({ ...formData, schedule: { ...formData.schedule, days: newDays } })
                        }}
                        style={{
                          padding: '8px 4px',
                          border: '2px solid',
                          borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                          borderRadius: '6px',
                          background: isSelected ? 'var(--primary)' : 'transparent',
                          color: isSelected ? '#fff' : 'var(--text)',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer',
                        }}
                      >
                        {day.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Interval Settings */}
            {formData.schedule.type === 'interval' && (
              <>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                    Every N Days
                  </label>
                  <input
                    type="number"
                    value={formData.schedule.every}
                    onChange={(e) => setFormData({ ...formData, schedule: { ...formData.schedule, every: parseInt(e.target.value) || 1 } })}
                    className="btn-secondary"
                    style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                    min="1"
                  />
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    e.g., 3 = every 3 days
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.schedule.startDate}
                    onChange={(e) => setFormData({ ...formData, schedule: { ...formData.schedule, startDate: e.target.value } })}
                    className="btn-secondary"
                    style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                  />
                </div>
              </>
            )}

            {/* Time Slot */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                Time Slot
              </label>
              <select
                value={formData.schedule.slot}
                onChange={(e) => setFormData({ ...formData, schedule: { ...formData.schedule, slot: e.target.value } })}
                className="btn-secondary"
                style={{ width: '100%', padding: '10px', fontSize: '14px' }}
              >
                <option value="morning">☀️ Morning</option>
                <option value="midday">🌤️ Midday</option>
                <option value="evening">🌙 Evening</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={onCancel} className="btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              {isEdit ? 'Update Item' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
