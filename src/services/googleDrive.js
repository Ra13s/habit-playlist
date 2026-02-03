const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3/files'

export const DRIVE_SCOPE_APPDATA = 'https://www.googleapis.com/auth/drive.appdata'

export const loadGisScript = () => {
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity script')))
      return
    }

    const script = document.createElement('script')
    script.src = GIS_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity script'))
    document.head.appendChild(script)
  })
}

export const listHabitsFile = async (accessToken, fileName) => {
  const q = encodeURIComponent(`name='${fileName}' and trashed=false`)
  const url = `${DRIVE_API_BASE}/files?spaces=appDataFolder&q=${q}&fields=files(id,name,modifiedTime)`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const err = new Error('Failed to list Drive files')
    err.status = res.status
    throw err
  }
  const data = await res.json()
  return data.files?.[0] ?? null
}

export const createHabitsFile = async (accessToken, fileName, json) => {
  const metadata = {
    name: fileName,
    parents: ['appDataFolder'],
    mimeType: 'application/json',
  }

  const boundary = '-------habitsyncboundary'
  const body =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    'Content-Type: application/json\r\n\r\n' +
    `${JSON.stringify(json)}\r\n` +
    `--${boundary}--`

  const res = await fetch(
    `${DRIVE_UPLOAD_BASE}?uploadType=multipart&fields=id,modifiedTime`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  )
  if (!res.ok) {
    const err = new Error('Failed to create Drive file')
    err.status = res.status
    throw err
  }
  return await res.json()
}

export const downloadJson = async (accessToken, fileId) => {
  const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const err = new Error('Failed to download Drive file')
    err.status = res.status
    throw err
  }
  return await res.json()
}

export const uploadJson = async (accessToken, fileId, json) => {
  const res = await fetch(`${DRIVE_UPLOAD_BASE}/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(json),
  })
  if (!res.ok) {
    const err = new Error('Failed to upload Drive file')
    err.status = res.status
    throw err
  }
  return await res.json()
}
