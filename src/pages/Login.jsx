import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const INITIAL_FORM = { username: '', password: '' }

// Both fields are required — empty submits get an inline message under the
// field instead of the browser bubble.
function validate({ username, password }) {
  const errors = {}
  if (!username.trim()) errors.username = 'Please fill in this field.'
  if (!password) errors.password = 'Please fill in this field.'
  return errors
}

export default function Login() {
  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  // Backend failure (invalid credentials / unreachable server) — rendered
  // below the form as the reference requires.
  const [error, setError] = useState('')
  const [rejected, setRejected] = useState(false)
  const notice = location.state?.registered
    ? `Account created for ${location.state.registered}. Sign in to continue.`
    : ''
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/'} replace />
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => (prev[name] ? { ...prev, [name]: '' } : prev))
    if (rejected) {
      setRejected(false)
      setError('')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const nextErrors = validate(form)
    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors)
      return
    }

    setLoading(true)
    try {
      const logged = await login(form.username.trim(), form.password)
      const from = location.state?.from
      navigate(from || (logged.role === 'ADMIN' ? '/admin' : '/'), { replace: true })
    } catch (err) {
      // The API answers 401 with "Invalid username or password."
      setError(err.message)
      setRejected(true)
    } finally {
      setLoading(false)
    }
  }

  const highlight = rejected

  return (
    <div className="auth-layout">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <div className="auth-brand">
          <span className="brand-logo" aria-hidden="true">k</span>
          <h1>Login</h1>
        </div>

        {/* Error shown under the title, above the form — as in the course implementation */}
        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}

        {notice && <div className="alert success">{notice}</div>}

        <label className="field">
          <span>Username</span>
          <input
            type="text"
            name="username"
            placeholder="Enter your username"
            value={form.username}
            onChange={handleChange}
            required
            autoFocus
            aria-invalid={Boolean(errors.username) || highlight}
            aria-describedby={errors.username ? 'username-error' : undefined}
          />
          {errors.username && (
            <span className="field-error" id="username-error" role="alert">
              {errors.username}
            </span>
          )}
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            required
            aria-invalid={Boolean(errors.password) || highlight}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          {errors.password && (
            <span className="field-error" id="password-error" role="alert">
              {errors.password}
            </span>
          )}
        </label>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <p className="auth-switch">
          New User? <Link to="/register">Sign up here</Link>
        </p>
      </form>
    </div>
  )
}
