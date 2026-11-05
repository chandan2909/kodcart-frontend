import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from './api'
import { authService } from './authService'

vi.mock('./api', () => ({ api: vi.fn() }))

const SESSION_KEY = 'kodcart_session'
const EMAILS_KEY = 'kodcart_emails'

beforeEach(() => {
  vi.mocked(api).mockReset()
  localStorage.clear()
})

describe('authService', () => {
  it('register calls the API and remembers the email', async () => {
    vi.mocked(api).mockResolvedValue({ message: 'ok' })
    await authService.register({
      username: 'chandan',
      email: 'c@x.io',
      password: 'p',
      role: 'CUSTOMER',
    })
    expect(api).toHaveBeenCalledWith('/api/users/register', {
      method: 'POST',
      body: { username: 'chandan', email: 'c@x.io', password: 'p', role: 'CUSTOMER' },
    })
    expect(JSON.parse(localStorage.getItem(EMAILS_KEY))).toEqual({ chandan: 'c@x.io' })
  })

  it('login stores a session and picks up the remembered email', async () => {
    localStorage.setItem(EMAILS_KEY, JSON.stringify({ chandan: 'c@x.io' }))
    vi.mocked(api).mockResolvedValue({ username: 'chandan', role: 'CUSTOMER' })
    const session = await authService.login('chandan', 'secret')
    expect(session).toEqual({
      username: 'chandan',
      name: 'chandan',
      role: 'CUSTOMER',
      email: 'c@x.io',
    })
    expect(authService.currentUser()).toEqual(session)
  })

  it('logout calls the API and clears the session even on failure', async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ username: 'u' }))
    vi.mocked(api).mockRejectedValue(new Error('gone'))
    await authService.logout()
    expect(api).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' })
    expect(authService.currentUser()).toBeNull()
  })

  it('validateSession returns false without a stored session', async () => {
    expect(await authService.validateSession()).toBe(false)
    expect(api).not.toHaveBeenCalled()
  })

  it('validateSession confirms an admin via the business endpoint', async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ username: 'a', role: 'ADMIN' }))
    vi.mocked(api).mockResolvedValue({})
    expect(await authService.validateSession()).toBe(true)
    expect(api).toHaveBeenCalledWith('/admin/business/overall')
  })

  it('validateSession clears the session on 401 or 403', async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ username: 'u', role: 'CUSTOMER' }))
    vi.mocked(api).mockRejectedValue({ status: 403 })
    expect(await authService.validateSession()).toBe(false)
    expect(authService.currentUser()).toBeNull()
  })

  it('validateSession keeps the session when the backend is unreachable', async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ username: 'u', role: 'CUSTOMER' }))
    vi.mocked(api).mockRejectedValue(new Error('network'))
    expect(await authService.validateSession()).toBe(true)
    expect(authService.currentUser()).toEqual({ username: 'u', role: 'CUSTOMER' })
  })
})
