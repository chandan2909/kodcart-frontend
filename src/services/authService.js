import { api } from './api'

const SESSION_KEY = 'kodcart_session'
const EMAILS_KEY = 'kodcart_emails'

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// The login endpoint only answers with username + role, so the email seen
// during registration is remembered here to still be able to show it in the
// profile of the same browser.
function emailBook() {
  try {
    return JSON.parse(localStorage.getItem(EMAILS_KEY) || '{}')
  } catch {
    return {}
  }
}

function rememberEmail(username, email) {
  const book = emailBook()
  book[username] = email
  localStorage.setItem(EMAILS_KEY, JSON.stringify(book))
}

export const authService = {
  // POST /api/users/register — validates username/email uniqueness on the
  // backend. The API sets no cookie here, so the caller goes to /login next.
  async register({ username, email, password, role }) {
    const data = await api('/api/users/register', {
      method: 'POST',
      body: { username, email, password, role },
    })
    rememberEmail(username, email)
    return data
  },

  // POST /api/auth/login — answers { message, role, username } and sets the
  // httpOnly authToken cookie that every other call relies on.
  async login(username, password) {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    })

    const session = {
      username: data.username,
      name: data.username,
      role: data.role,
      email: emailBook()[data.username] || '',
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return session
  },

  async logout() {
    try {
      await api('/api/auth/logout', { method: 'POST' })
    } catch {
      // Expired cookie, or an admin session — the filter blocks /api/* for
      // admins. Either way the local session is dropped below.
    }
    localStorage.removeItem(SESSION_KEY)
  },

  currentUser() {
    return readSession()
  },

  clearSession() {
    localStorage.removeItem(SESSION_KEY)
  },

  // The auth cookie lives one hour while localStorage does not, so confirm the
  // stored session against the backend once when the app starts.
  async validateSession() {
    const session = readSession()
    if (!session) return false

    try {
      if (session.role === 'ADMIN') {
        await api('/admin/business/overall')
      } else {
        await api(`/api/cart/items/count?username=${encodeURIComponent(session.username)}`)
      }
      return true
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        localStorage.removeItem(SESSION_KEY)
        return false
      }
      // Backend unreachable — keep the session, pages will surface the error.
      return true
    }
  },
}
