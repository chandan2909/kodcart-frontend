import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const ROLE_OPTIONS = [
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'ADMIN', label: 'Admin' },
]

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/

const INITIAL_FORM = { username: '', email: '', password: '', role: '' }

// Client-side rules from the design reference. Uniqueness of username and
// email is enforced by POST /api/users/register on the backend.
function validate({ username, email, password, role }) {
  const errors = {}

  const name = username.trim()
  if (!name) {
    errors.username = 'Username is required'
  } else if (name.length < 5 || name.length > 50) {
    errors.username = 'Username must be 5-50 characters long'
  }

  const mail = email.trim()
  if (!mail) {
    errors.email = 'Email is required'
  } else if (!EMAIL_PATTERN.test(mail)) {
    errors.email = 'Enter a valid email address'
  }

  if (!password) {
    errors.password = 'Password is required'
  } else if (!PASSWORD_PATTERN.test(password)) {
    errors.password =
      'Password must be at least 8 characters with uppercase, lowercase, number and special symbol'
  }

  if (!role) {
    errors.role = 'Please select a role'
  }

  return errors
}

export default function Register() {
  const { register, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/'} replace />
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => (prev[name] ? { ...prev, [name]: '' } : prev))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const nextErrors = validate(form)
    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors)
      return
    }

    setSubmitting(true)
    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      })
      // The API issues no auth cookie on register — sign in next.
      navigate('/login', { state: { registered: form.username.trim() }, replace: true })
    } catch (err) {
      const message = err.message || 'Registration failed. Please try again.'
      if (/username/i.test(message)) {
        setErrors({ username: message })
      } else if (/email/i.test(message)) {
        setErrors({ email: message })
      } else {
        setError(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-layout">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <div className="auth-brand">
          <span className="brand-logo" aria-hidden="true">k</span>
          <h1>Register</h1>
          <p>Join kodcart and start shopping today</p>
        </div>

        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}

        <label className="field">
          <span>Username</span>
          <input
            type="text"
            name="username"
            placeholder="Enter your username"
            value={form.username}
            onChange={handleChange}
            minLength={5}
            maxLength={50}
            required
            autoFocus
            aria-invalid={Boolean(errors.username)}
            aria-describedby={errors.username ? 'username-error' : undefined}
          />
          {errors.username && (
            <span className="field-error" id="username-error" role="alert">
              {errors.username}
            </span>
          )}
        </label>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
            required
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <span className="field-error" id="email-error" role="alert">
              {errors.email}
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
            minLength={8}
            required
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          {errors.password && (
            <span className="field-error" id="password-error" role="alert">
              {errors.password}
            </span>
          )}
        </label>

        <label className="field">
          <span>Role</span>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            required
            aria-invalid={Boolean(errors.role)}
            aria-describedby={errors.role ? 'role-error' : undefined}
          >
            <option value="" disabled>
              Select your role
            </option>
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.role && (
            <span className="field-error" id="role-error" role="alert">
              {errors.role}
            </span>
          )}
        </label>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Sign Up'}
        </button>

        <p className="auth-switch">
          Already a user? <Link to="/login">Log in here</Link>
        </p>
      </form>
    </div>
  )
}
