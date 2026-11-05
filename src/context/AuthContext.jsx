import { useCallback, useEffect, useMemo, useState } from 'react'
import { authCtx } from './authCtx'
import { authService } from '../services/authService'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.currentUser())

  useEffect(() => {
    let active = true
    authService.validateSession().then((valid) => {
      if (active && !valid) setUser(null)
    })
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (username, password) => {
    const session = await authService.login(username, password)
    setUser(session)
    return session
  }, [])

  // Registration does not sign the user in — the backend only issues the
  // auth cookie on /api/auth/login, so pages navigate to /login afterwards.
  const register = useCallback((payload) => authService.register(payload), [])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), login, register, logout }),
    [user, login, register, logout]
  )

  return <authCtx.Provider value={value}>{children}</authCtx.Provider>
}
