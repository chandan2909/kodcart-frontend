import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Login from './Login'

const hooks = vi.hoisted(() => ({
  isAuthenticated: false,
  user: null,
  login: vi.fn(),
}))
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ login: hooks.login, isAuthenticated: hooks.isAuthenticated, user: hooks.user }),
}))

function renderLogin(initialEntries = ['/login']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<div>home page</div>} />
        <Route path="/admin" element={<div>admin page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  hooks.isAuthenticated = false
  hooks.user = null
  hooks.login.mockReset()
})

describe('Login', () => {
  it('validates required fields', () => {
    renderLogin()
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))
    expect(screen.getAllByText('Please fill in this field.')).toHaveLength(2)
    expect(hooks.login).not.toHaveBeenCalled()
  })

  it('logs in a customer and navigates home', async () => {
    hooks.login.mockResolvedValue({ role: 'CUSTOMER' })
    renderLogin()
    fireEvent.change(screen.getByPlaceholderText('Enter your username'), {
      target: { value: 'chandan' },
    })
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'secret' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))
    expect(hooks.login).toHaveBeenCalledWith('chandan', 'secret')
    expect(await screen.findByText('home page')).toBeInTheDocument()
  })

  it('shows backend errors', async () => {
    hooks.login.mockRejectedValue(new Error('Invalid username or password.'))
    renderLogin()
    fireEvent.change(screen.getByPlaceholderText('Enter your username'), {
      target: { value: 'u' },
    })
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'p' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid username or password.')
  })

  it('redirects authenticated admins to /admin', () => {
    hooks.isAuthenticated = true
    hooks.user = { role: 'ADMIN' }
    renderLogin()
    expect(screen.getByText('admin page')).toBeInTheDocument()
  })
})
