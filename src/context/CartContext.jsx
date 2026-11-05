import { useCallback, useEffect, useMemo, useState } from 'react'
import { cartCtx } from './cartCtx'
import { useAuth } from '../hooks/useAuth'
import { api } from '../services/api'
import { FREE_SHIPPING_THRESHOLD, SHIPPING_CHARGES } from '../data/pricing'

// GET /api/cart/items →
// { username, role, cart: { products: [{ product_id, image_url, name,
//   description, price_per_unit, quantity, total_price }], overall_total_price } }
function toCartItem(raw) {
  const price = Number(raw.price_per_unit) || 0
  return {
    product: {
      id: raw.product_id,
      name: raw.name,
      description: raw.description || '',
      price,
      mrp: price,
      category: '',
      images: raw.image_url ? [raw.image_url] : [],
    },
    qty: Number(raw.quantity) || 1,
  }
}

// Stable fallback so an empty cart keeps the same identity between renders.
const EMPTY_CART = []

export function CartProvider({ children }) {
  const { user } = useAuth()
  // The filter only lets CUSTOMER role through on /api/*, so admins keep an
  // empty cart.
  const username = user?.role === 'CUSTOMER' ? user.username : null

  // owner tags the cached rows with the account they belong to, so a session
  // switch never shows one user's cart to another.
  const [cartState, setCartState] = useState({ owner: null, items: [], error: '' })

  const refresh = useCallback(() => {
    if (!username) return Promise.resolve()
    return api('/api/cart/items')
      .then((data) =>
        setCartState({
          owner: username,
          items: (data?.cart?.products || []).map(toCartItem),
          error: '',
        })
      )
      .catch((err) =>
        setCartState((prev) => ({
          owner: username,
          items: prev.owner === username ? prev.items : [],
          error: err.message,
        }))
      )
  }, [username])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addItem = useCallback(
    async (product, qty = 1) => {
      if (!username) throw new Error('Sign in to add items to your cart')
      await api('/api/cart/add', {
        method: 'POST',
        body: { username, productId: product.id, quantity: qty },
      })
      await refresh()
    },
    [username, refresh]
  )

  const removeItem = useCallback(
    async (productId) => {
      if (!username) return
      await api('/api/cart/delete', {
        method: 'DELETE',
        body: { username, productId },
      })
      await refresh()
    },
    [username, refresh]
  )

  const updateQty = useCallback(
    async (productId, qty) => {
      if (!username) return
      if (qty <= 0) return removeItem(productId)
      await api('/api/cart/update', {
        method: 'PUT',
        body: { username, productId, quantity: qty },
      })
      await refresh()
    },
    [username, refresh, removeItem]
  )

  const clearCart = useCallback(async () => {
    if (!username) return
    await Promise.all(
      cartState.items.map((item) =>
        api('/api/cart/delete', {
          method: 'DELETE',
          body: { username, productId: item.product.id },
        })
      )
    )
    setCartState({ owner: username, items: [], error: '' })
  }, [username, cartState.items])

  // Derived, so a signed-out or switched session starts empty by construction.
  const items = username && cartState.owner === username ? cartState.items : EMPTY_CART
  const error = username && cartState.owner === username ? cartState.error : ''
  // '…' badge while the first cart fetch (or an account switch) is in flight.
  const loading = Boolean(username) && cartState.owner !== username

  const { count, subtotal, shipping, total } = useMemo(() => {
    const count = items.reduce((sum, item) => sum + item.qty, 0)
    const subtotal = items.reduce((sum, item) => sum + item.product.price * item.qty, 0)
    const shipping =
      subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGES
    return { count, subtotal, shipping, total: subtotal + shipping }
  }, [items])

  const value = useMemo(
    () => ({
      items,
      count,
      subtotal,
      shipping,
      total,
      error,
      loading,
      refresh,
      addItem,
      removeItem,
      updateQty,
      clearCart,
    }),
    [
      items,
      count,
      subtotal,
      shipping,
      total,
      error,
      loading,
      refresh,
      addItem,
      removeItem,
      updateQty,
      clearCart,
    ]
  )

  return <cartCtx.Provider value={value}>{children}</cartCtx.Provider>
}
