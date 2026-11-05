import { act, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CartProvider } from './CartContext'
import { useCart } from '../hooks/useCart'
import { api } from '../services/api'

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { username: 'chandan', role: 'CUSTOMER' } }),
}))

vi.mock('../services/api', () => ({ api: vi.fn() }))

function Probe() {
  const cart = useCart()
  return (
    <div>
      <span data-testid="count">{cart.count}</span>
      <span data-testid="subtotal">{cart.subtotal}</span>
      <span data-testid="shipping">{cart.shipping}</span>
      <span data-testid="total">{cart.total}</span>
      <span data-testid="items">{cart.items.length}</span>
      <button onClick={() => cart.addItem({ id: 9 }, 1)}>add</button>
      <button onClick={() => cart.updateQty(1, 0)}>dec-to-zero</button>
      <button onClick={() => cart.clearCart()}>clear</button>
    </div>
  )
}

function productRow(overrides = {}) {
  return {
    product_id: 1,
    name: 'Shirt',
    price_per_unit: 500,
    quantity: 2,
    total_price: 1000,
    image_url: null,
    ...overrides,
  }
}

beforeEach(() => {
  vi.mocked(api).mockReset()
  vi.mocked(api).mockResolvedValue({ cart: { products: [productRow()], overall_total_price: 1000 } })
})

describe('CartProvider', () => {
  it('loads items and derives totals', async () => {
    render(
      <CartProvider>
        <Probe />
      </CartProvider>
    )
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('2'))
    expect(screen.getByTestId('subtotal')).toHaveTextContent('1000')
    expect(screen.getByTestId('shipping')).toHaveTextContent('0')
    expect(screen.getByTestId('total')).toHaveTextContent('1000')
    expect(screen.getByTestId('items')).toHaveTextContent('1')
  })

  it('applies shipping below the free threshold', async () => {
    vi.mocked(api).mockResolvedValue({
      cart: { products: [productRow({ quantity: 1, total_price: 500 })], overall_total_price: 500 },
    })
    render(
      <CartProvider>
        <Probe />
      </CartProvider>
    )
    await waitFor(() => expect(screen.getByTestId('shipping')).toHaveTextContent('49'))
    expect(screen.getByTestId('total')).toHaveTextContent('549')
  })

  it('addItem posts then refreshes', async () => {
    render(
      <CartProvider>
        <Probe />
      </CartProvider>
    )
    await waitFor(() => expect(screen.getByTestId('items')).toHaveTextContent('1'))
    await act(async () => {
      screen.getByText('add').click()
    })
    expect(api).toHaveBeenCalledWith('/api/cart/add', {
      method: 'POST',
      body: { username: 'chandan', productId: 9, quantity: 1 },
    })
    await waitFor(() => expect(api).toHaveBeenCalledTimes(3))
    expect(api).toHaveBeenLastCalledWith('/api/cart/items')
  })

  it('updateQty with zero removes the item', async () => {
    render(
      <CartProvider>
        <Probe />
      </CartProvider>
    )
    await waitFor(() => expect(screen.getByTestId('items')).toHaveTextContent('1'))
    await act(async () => {
      screen.getByText('dec-to-zero').click()
    })
    expect(api).toHaveBeenCalledWith('/api/cart/delete', {
      method: 'DELETE',
      body: { username: 'chandan', productId: 1 },
    })
  })

  it('clearCart deletes every item and empties', async () => {
    render(
      <CartProvider>
        <Probe />
      </CartProvider>
    )
    await waitFor(() => expect(screen.getByTestId('items')).toHaveTextContent('1'))
    await act(async () => {
      screen.getByText('clear').click()
    })
    expect(screen.getByTestId('items')).toHaveTextContent('0')
    expect(api).toHaveBeenCalledWith('/api/cart/delete', {
      method: 'DELETE',
      body: { username: 'chandan', productId: 1 },
    })
  })
})
