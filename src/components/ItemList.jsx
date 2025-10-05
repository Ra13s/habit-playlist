import { useState } from 'react'
import { ItemEditor } from './ItemEditor'
import { findItemDependencies } from '../validation'

export const ItemList = ({ program, onAddItem = () => {}, onUpdateItem = () => {}, onDeleteItem = () => {} }) => {
  const [editingItem, setEditingItem] = useState(null)
  const [showEditor, setShowEditor] = useState(false)
  const [deletingItem, setDeletingItem] = useState(null)

  

  const items = Object.values(program.items)
  const existingIds = Object.keys(program.items)

  const handleAdd = () => {
    setEditingItem(null)
    setShowEditor(true)
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setShowEditor(true)
  }

  const handleSave = (item) => {
    if (editingItem) {
      if (typeof onUpdateItem !== 'function') {
        console.error('onUpdateItem is not a function. Received:', onUpdateItem)
        return
      }
      onUpdateItem(item.id, item)
    } else {
      if (typeof onAddItem !== 'function') {
        console.error('onAddItem is not a function. Received:', onAddItem)
        return
      }
      onAddItem(item)
    }
    setShowEditor(false)
    setEditingItem(null)
  }

  const handleDelete = (item) => {
    const deps = findItemDependencies(item.id, program)
    setDeletingItem({ item, deps })
  }

  const confirmDelete = () => {
    if (deletingItem) {
      onDeleteItem(deletingItem.item.id)
      setDeletingItem(null)
    }
  }

  const getItemTypeIcon = (type) => {
    switch (type) {
      case 'timer': return '⏱️'
      case 'check': return '✓'
      case 'link': return '🔗'
      case 'note': return '📝'
      default: return '•'
    }
  }

  const getItemTypeDuration = (item) => {
    if (item.type === 'timer') {
      const minutes = Math.floor(item.duration / 60)
      return `${minutes} min`
    }
    return item.type.charAt(0).toUpperCase() + item.type.slice(1)
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
          Manage Items
        </h2>
        <button onClick={handleAdd} className="btn btn-primary">
          + Add Item
        </button>
      </div>

      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        Create and manage your activities. Each item can be added to playlists or scheduled with rules.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
            No items yet. Click "Add Item" to create your first activity.
          </div>
        ) : (
          items.map(item => (
            <div
              key={item.id}
              className="card"
              style={{
                padding: '12px',
                background: 'var(--surface)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '18px' }}>{getItemTypeIcon(item.type)}</span>
                  <span style={{ fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {getItemTypeDuration(item)}
                  {item.tags && item.tags.length > 0 && ` • ${item.tags.join(', ')}`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleEdit(item)}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '14px' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '14px', color: '#dc2626' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <ItemEditor
          item={editingItem}
          program={program}
          existingIds={editingItem ? existingIds : existingIds}
          onSave={handleSave}
          onCancel={() => {
            setShowEditor(false)
            setEditingItem(null)
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deletingItem && (
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
          onClick={() => setDeletingItem(null)}
        >
          <div
            className="card"
            style={{ maxWidth: '400px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
              Delete Item?
            </h3>
            <p style={{ marginBottom: '16px' }}>
              Are you sure you want to delete "{deletingItem.item.title}"?
            </p>

            {(deletingItem.deps.playlists.length > 0 || deletingItem.deps.scheduleRules.length > 0) && (
              <div
                style={{
                  background: '#fef3c7',
                  color: '#92400e',
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  fontSize: '14px',
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '8px' }}>⚠️ This item is used in:</div>
                {deletingItem.deps.playlists.length > 0 && (
                  <div>• Playlists: {deletingItem.deps.playlists.join(', ')}</div>
                )}
                {deletingItem.deps.scheduleRules.length > 0 && (
                  <div>• {deletingItem.deps.scheduleRules.length} schedule rule(s)</div>
                )}
                <div style={{ marginTop: '8px' }}>It will be removed from all schedules.</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setDeletingItem(null)}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="btn btn-primary"
                style={{ flex: 1, background: '#dc2626' }}
              >
                Delete Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
