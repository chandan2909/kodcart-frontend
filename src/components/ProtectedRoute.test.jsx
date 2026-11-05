import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import ProtectedRoute from './ProtectedRoute'

const hooks = vi.hoisted(() => ({ user: null }))
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: Boolean(hooks.user), user: hooks.user }),
}))

function renderProtected(path, props) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path={path}
          element={
            <ProtectedRoute {...props}>
              <div>protected content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>login page</div>} />
        <Route path="/admin" element={<div>admin page</div>} />
        <Route path="/" element={<div>home page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  it('redirects to login when unauthenticated', () => {
    hooks.user = null
    renderProtected('/secret', {})
    expect(screen.getByText('login page')).toBeInTheDocument()
    expect(screen.queryByText('protected content')).not.toBeInTheDocument()
  })

  it('redirects admins to /admin for customer-only roles', () => {
    hooks.user = { role: 'ADMIN' }
    renderProtected('/secret', { roles: ['CUSTOMER'] })
    expect(screen.getByText('admin page')).toBeInTheDocument()
  })

  it('redirects customers home for admin-only roles', () => {
    hooks.user = { role: 'CUSTOMER' }
    renderProtected('/secret', { roles: ['ADMIN'] })
    expect(screen.getByText('home page')).toBeInTheDocument()
  })

  it('renders children when the role matches', () => {
    hooks.user = { role: 'CUSTOMER' }
    renderProtected('/secret', { roles: ['CUSTOMER'] })
    expect(screen.getByText('protected content')).toBeInTheDocument()
  })
})
