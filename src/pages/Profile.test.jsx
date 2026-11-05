import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Profile from './Profile'

const hooks = vi.hoisted(() => ({ user: null }))
vi.mock('../hooks/useAuth', () => ({ useAuth: () => ({ user: hooks.user }) }))

describe('Profile', () => {
  it('renders customer details', () => {
    hooks.user = { name: 'Chandan', username: 'chandan', email: 'c@x.io', role: 'CUSTOMER' }
    render(<Profile />)
    expect(screen.getByText('Chandan')).toBeInTheDocument()
    expect(screen.getByText('Customer account')).toBeInTheDocument()
    expect(screen.getByDisplayValue('chandan')).toBeInTheDocument()
    expect(screen.getByDisplayValue('c@x.io')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Customer')).toBeInTheDocument()
  })

  it('renders administrator details', () => {
    hooks.user = { name: 'Admin', username: 'admin', email: '', role: 'ADMIN' }
    render(<Profile />)
    expect(screen.getByText('Administrator account')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Administrator')).toBeInTheDocument()
  })
})
