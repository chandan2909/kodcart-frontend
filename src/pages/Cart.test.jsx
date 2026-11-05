import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Cart from './Cart'
import { startPayment } from '../services/paymentService'

const hooks = vi.hoisted(() => ({
  items: [],
  subtotal: 0,
  shipping: 0,
  total: 0,
  updateQty: vi.fn(),
  removeItem: vi.fn(),
  clearCart: vi.fn(),
  refresh: vi.fn(),
  error: '',
  user: { name: 'Chandan', email: 'c@x.io' },
}))

vi.mock('../hooks/useCart', () => ({
  useCart: () => ({
    items: hooks.items,
    subtotal: hooks.subtotal,
    shipping: hooks.shipping,
    total: hooks.total,
    updateQty: hooks.updateQty,
    removeItem: hooks.removeItem,
    clearCart: hooks.clearCart,
    refresh: hooks.refresh,
    error: hooks.error,
  }),
}))
vi.mock('../hooks/useAuth', () => ({ useAuth: () => ({ user: hooks.user }) }))
vi.mock('../services/paymentService', () => ({ startPayment: vi.fn() }))

const item = {
  product: { id: 1, name: 'Shirt', price: 500, category: '', colors: ['#111', '#222'] },
  qty: 2,
}

function renderCart() {
  return render(
    <MemoryRouter>
      <Cart />
    </MemoryRouter>
  )
}

beforeEach(() => {
  hooks.items = [item]
  hooks.subtotal = 1000
  hooks.shipping = 0
  hooks.total = 1000
  hooks.error = ''
  hooks.updateQty.mockReset()
  hooks.removeItem.mockReset()
  hooks.clearCart.mockReset()
  hooks.refresh.mockReset()
  hooks.updateQty.mockResolvedValue()
  hooks.removeItem.mockResolvedValue()
  hooks.clearCart.mockResolvedValue()
  hooks.refresh.mockResolvedValue()
  vi.mocked(startPayment).mockReset()
})

describe('Cart', () => {
  it('shows the empty state', () => {
    hooks.items = []
    renderCart()
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument()
  })

  it('renders items and summary', () => {
    renderCart()
    expect(screen.getByText('Shirt')).toBeInTheDocument()
    expect(screen.getAllByText('₹1,000').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByRole('button', { name: /Pay ₹1,000/ })).toBeInTheDocument()
  })

  it('quantity controls call updateQty', () => {
    renderCart()
    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }))
    expect(hooks.updateQty).toHaveBeenCalledWith(1, 3)
    fireEvent.click(screen.getByRole('button', { name: 'Decrease quantity' }))
    expect(hooks.updateQty).toHaveBeenCalledWith(1, 1)
  })

  it('remove and clear cart call through', () => {
    renderCart()
    fireEvent.click(screen.getByRole('button', { name: 'Remove Shirt' }))
    expect(hooks.removeItem).toHaveBeenCalledWith(1)
    fireEvent.click(screen.getByRole('button', { name: 'Clear cart' }))
    expect(hooks.clearCart).toHaveBeenCalled()
  })

  it('shows the success screen after payment', async () => {
    vi.mocked(startPayment).mockResolvedValue({ razorpayOrderId: 'ord_123' })
    renderCart()
    fireEvent.click(screen.getByRole('button', { name: /Pay ₹1,000/ }))
    expect(startPayment).toHaveBeenCalledWith(expect.objectContaining({ total: 1000, user: hooks.user }))
    expect(await screen.findByText('Order placed successfully')).toBeInTheDocument()
    expect(screen.getByText('ord_123')).toBeInTheDocument()
  })

  it('shows payment errors', async () => {
    vi.mocked(startPayment).mockRejectedValue(new Error('Payment cancelled'))
    renderCart()
    fireEvent.click(screen.getByRole('button', { name: /Pay ₹1,000/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Payment cancelled')
  })

  it('shows the cart error banner', () => {
    hooks.error = 'Server down'
    renderCart()
    expect(screen.getByRole('alert')).toHaveTextContent('Server down')
  })
})
