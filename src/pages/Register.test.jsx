import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Register from './Register'

const hooks = vi.hoisted(() => ({
  isAuthenticated: false,
  user: null,
  register: vi.fn(),
}))
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ register: hooks.register, isAuthenticated: hooks.isAuthenticated, user: hooks.user }),
}))

function LoginStub() {
  const location = useLocation()
  return <div>{location.state?.registered ? `Account created for ${location.state.registered}` : 'login page'}</div>
}

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<LoginStub />} />
      </Routes>
    </MemoryRouter>
  )
}

function fillValidForm() {
  fireEvent.change(screen.getByPlaceholderText('Enter your username'), {
    target: { value: 'chandan' },
  })
  fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
    target: { value: 'c@x.io' },
  })
  fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
    target: { value: 'Secret@123' },
  })
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'CUSTOMER' } })
}

beforeEach(() => {
  hooks.isAuthenticated = false
  hooks.register.mockReset()
})

describe('Register', () => {
  it('validates invalid input', () => {
    renderRegister()
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }))
    expect(screen.getByText('Username is required')).toBeInTheDocument()
    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
    expect(screen.getByText('Please select a role')).toBeInTheDocument()
    expect(hooks.register).not.toHaveBeenCalled()
  })

  it('registers and navigates to login with the new username', async () => {
    hooks.register.mockResolvedValue({})
    renderRegister()
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }))
    expect(hooks.register).toHaveBeenCalledWith({
      username: 'chandan',
      email: 'c@x.io',
      password: 'Secret@123',
      role: 'CUSTOMER',
    })
    expect(await screen.findByText('Account created for chandan')).toBeInTheDocument()
  })

  it('shows server errors on the matching field', async () => {
    hooks.register.mockRejectedValue(new Error('Username already taken'))
    renderRegister()
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }))
    expect(await screen.findByText('Username already taken')).toBeInTheDocument()
  })
})
