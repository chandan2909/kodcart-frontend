import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Navbar from './Navbar'

const hooks = vi.hoisted(() => ({
  user: null,
  logout: vi.fn(),
  count: 0,
  loading: false,
  error: '',
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: hooks.user, logout: hooks.logout }),
}))
vi.mock('../hooks/useCart', () => ({
  useCart: () => ({ count: hooks.count, loading: hooks.loading, error: hooks.error }),
}))

function renderNavbar() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Navbar />} />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  hooks.user = null
  hooks.logout.mockReset()
  hooks.count = 0
  hooks.loading = false
  hooks.error = ''
})

describe('Navbar', () => {
  it('shows brand and home link for everyone', () => {
    renderNavbar()
    expect(screen.getByText('kodcart')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
  })

  it('shows customer-only links and cart count', () => {
    hooks.user = { name: 'Chandan', role: 'CUSTOMER' }
    hooks.count = 3
    renderNavbar()
    expect(screen.getByRole('link', { name: 'Orders' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Cart with 3 items/ })).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Products' })).not.toBeInTheDocument()
  })

  it('shows admin-only links and no cart', () => {
    hooks.user = { name: 'Admin', role: 'ADMIN' }
    renderNavbar()
    expect(screen.getByRole('link', { name: 'Products' })).toBeInTheDocument()
    expect(screen.queryByText('Orders')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Cart/ })).not.toBeInTheDocument()
  })

  it('shows the cart error badge when the count fetch fails', () => {
    hooks.user = { name: 'Chandan', role: 'CUSTOMER' }
    hooks.error = 'Server down'
    renderNavbar()
    expect(screen.getByLabelText('Cart count unavailable')).toBeInTheDocument()
  })

  it('logs out and navigates to login', async () => {
    hooks.user = { name: 'Chandan', role: 'CUSTOMER' }
    hooks.logout.mockResolvedValue()
    renderNavbar()
    fireEvent.click(screen.getByRole('button', { name: /Chandan/ }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Logout' }))
    expect(hooks.logout).toHaveBeenCalled()
    expect(await screen.findByText('Login page')).toBeInTheDocument()
  })
})
