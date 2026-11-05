import { useContext } from 'react'
import { cartCtx } from '../context/cartCtx'

export function useCart() {
  const context = useContext(cartCtx)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}
