import { act, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthContext'
import { authService } from '../services/authService'
import { useAuth } from '../hooks/useAuth'

vi.mock('../services/authService', () => ({
  authService: {
    currentUser: vi.fn(),
    validateSession: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    clearSession: vi.fn(),
  },
}))

function Probe() {
  const auth = useAuth()
  return (
    <div>
      <span data-testid="user">{auth.user ? auth.user.username : 'none'}</span>
      <button onClick={() => auth.login('u', 'p')}>login</button>
      <button onClick={() => auth.logout()}>logout</button>
    </div>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  authService.currentUser.mockReturnValue(null)
  authService.validateSession.mockResolvedValue(true)
})

describe('AuthProvider', () => {
  it('restores a validated session on mount', async () => {
    authService.currentUser.mockReturnValue({ username: 'chandan', role: 'CUSTOMER' })
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    )
    expect(screen.getByTestId('user')).toHaveTextContent('chandan')
    expect(authService.validateSession).toHaveBeenCalled()
  })

  it('clears an invalid session on mount', async () => {
    authService.currentUser.mockReturnValue({ username: 'old', role: 'CUSTOMER' })
    authService.validateSession.mockResolvedValue(false)
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'))
  })

  it('login stores the session', async () => {
    authService.login.mockResolvedValue({ username: 'chandan', role: 'CUSTOMER' })
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    )
    await act(async () => {
      screen.getByText('login').click()
    })
    expect(screen.getByTestId('user')).toHaveTextContent('chandan')
  })

  it('logout clears the session', async () => {
    authService.currentUser.mockReturnValue({ username: 'chandan', role: 'CUSTOMER' })
    authService.logout.mockResolvedValue()
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    )
    await act(async () => {
      screen.getByText('logout').click()
    })
    expect(screen.getByTestId('user')).toHaveTextContent('none')
  })
})
