// Every request goes through the Vite dev proxy (see vite.config.js), so paths
// stay relative and the httpOnly authToken cookie travels with them.
const API_BASE = import.meta.env.VITE_API_URL || ''

export async function api(path, { method = 'GET', body } = {}) {
  const options = { method, credentials: 'include' }
  if (body !== undefined) {
    options.headers = { 'Content-Type': 'application/json' }
    options.body = JSON.stringify(body)
  }

  let response
  try {
    response = await fetch(`${API_BASE}${path}`, options)
  } catch {
    const error = new Error(
      'Cannot reach the server. Start the Spring Boot backend on port 9090 and try again.'
    )
    error.status = 0
    throw error
  }

  const text = await response.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && (data.error || data.message)) ||
      (typeof data === 'string' && data.trim() !== '' && data) ||
      `Request failed (${response.status})`
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return data
}
