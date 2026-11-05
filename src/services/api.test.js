import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from './api'

describe('api', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('requests with credentials and returns parsed JSON', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ id: 1, name: 'Shirt' }),
    })

    const data = await api('/products/1')

    expect(fetch).toHaveBeenCalledWith('/products/1', {
      method: 'GET',
      credentials: 'include',
    })
    expect(data).toEqual({ id: 1, name: 'Shirt' })
  })

  it('sends a JSON body on non-GET requests', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
    })

    const data = await api('/auth/login', { method: 'POST', body: { email: 'a@b.c' } })

    expect(fetch).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.c' }),
    })
    expect(data).toBeNull()
  })

  it('returns the backend error message with its status', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: 'Invalid credentials' }),
    })

    await expect(api('/auth/login', { method: 'POST', body: {} })).rejects.toMatchObject({
      message: 'Invalid credentials',
      status: 401,
    })
  })

  it('throws status 0 when the server is unreachable', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('fetch failed'))

    await expect(api('/products')).rejects.toMatchObject({
      message: 'Cannot reach the server. Start the Spring Boot backend on port 9090 and try again.',
      status: 0,
    })
  })
})
