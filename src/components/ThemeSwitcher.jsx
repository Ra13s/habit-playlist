import { themes, getThemeName } from '../themes'

export const ThemeSwitcher = ({ currentTheme, onChange }) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
        Theme
      </label>
      <select
        value={currentTheme}
        onChange={(e) => onChange(e.target.value)}
        className="btn-secondary"
        style={{ width: '100%', padding: '12px' }}
      >
        {Object.keys(themes).map((key) => (
          <option key={key} value={key}>
            {getThemeName(key)}
          </option>
        ))}
      </select>
    </div>
  )
}
