export const LanguageSelector = ({ language, onChange }) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      <select
        value={language}
        onChange={(e) => onChange(e.target.value)}
        className="btn-secondary"
        style={{ width: '100%', padding: '12px' }}
      >
        <option value="en">English</option>
        <option value="et">Eesti</option>
      </select>
    </div>
  )
}
