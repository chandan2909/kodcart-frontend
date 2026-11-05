import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useCart'

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const { count, loading: cartLoading, error: cartError } = useCart()
  const [open, setOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const menuRef = useRef(null)
  const navigate = useNavigate()
  // The API only lets CUSTOMER accounts use /api/cart and /api/orders.
  const isCustomer = user?.role === 'CUSTOMER'
  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    function handleOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  async function handleLogout() {
    setOpen(false)
    await logout()
    navigate('/login')
  }

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <span className="brand-logo" aria-hidden="true">k</span>
        <span className="brand-name">kodcart</span>
      </Link>

      <button
        type="button"
        className="nav-toggle"
        aria-label="Toggle navigation menu"
        aria-expanded={navOpen}
        onClick={() => setNavOpen((value) => !value)}
      >
        <MenuIcon />
      </button>

      <nav className={`nav-links${navOpen ? ' open' : ''}`}>
        <NavLink to="/" end onClick={() => setNavOpen(false)}>
          Home
        </NavLink>
        {isCustomer && (
          <NavLink to="/orders" onClick={() => setNavOpen(false)}>
            Orders
          </NavLink>
        )}
        {isAdmin && (
          <NavLink to="/admin/products" onClick={() => setNavOpen(false)}>
            Products
          </NavLink>
        )}
      </nav>

      <div className="nav-actions">
        {isCustomer && (
          <Link to="/cart" className="cart-button" aria-label={`Cart with ${count} items`}>
            <CartIcon />
            {cartLoading ? (
              <span className="cart-badge" aria-label="Loading cart count">
                …
              </span>
            ) : cartError ? (
              <span className="cart-badge cart-badge-error" aria-label="Cart count unavailable">
                !
              </span>
            ) : count > 0 ? (
              <span className="cart-badge">{count}</span>
            ) : null}
          </Link>
        )}

        <div className="user-menu" ref={menuRef}>
          <button
            type="button"
            className="user-trigger"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-haspopup="menu"
          >
            <span className="user-avatar">
              <UserIcon />
            </span>
            <span className="user-name">{user?.name}</span>
          </button>

          {open && (
            <div className="user-dropdown" role="menu">
              <div className="dropdown-head">
                <strong>{user?.name}</strong>
                <small>{user?.role === 'ADMIN' ? 'Administrator' : 'Customer'}</small>
              </div>
              <Link to="/profile" role="menuitem" onClick={() => setOpen(false)}>
                Profile
              </Link>
              {isCustomer && (
                <Link to="/orders" role="menuitem" onClick={() => setOpen(false)}>
                  Orders
                </Link>
              )}
              <button type="button" className="logout-btn" role="menuitem" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
