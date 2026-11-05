import { useContext } from 'react'
import { authCtx } from '../context/authCtx'

export function useAuth() {
  const context = useContext(authCtx)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
