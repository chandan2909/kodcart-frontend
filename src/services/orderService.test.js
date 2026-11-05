import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from './api'
import { orderService } from './orderService'

vi.mock('./api', () => ({ api: vi.fn() }))

const item = {
  product: { id: 1, name: 'Shirt', price: 899, emoji: '👕', colors: ['#000'] },
  qty: 2,
}

beforeEach(() => {
  vi.mocked(api).mockReset()
  localStorage.clear()
})

describe('orderService', () => {
  it('createDemo records a local order', () => {
    const order = orderService.createDemo({
      user: { name: 'Chandan', email: 'c@x.io' },
      items: [item],
      subtotal: 1798,
      shipping: 0,
      total: 1798,
      payment: { mode: 'demo' },
    })
    expect(order.id).toMatch(/^KOD\d{8}$/)
    expect(order.source).toBe('local')
    expect(order.status).toBe('PLACED')
    expect(order.paymentMode).toBe('DEMO')
    expect(order.items).toEqual([
      { id: 1, name: 'Shirt', price: 899, qty: 2, emoji: '👕', colors: ['#000'] },
    ])
    expect(order.placedAt).toEqual(expect.any(String))
    expect(JSON.parse(localStorage.getItem('kodcart_orders'))).toHaveLength(1)
  })

  it('list merges local and backend orders', async () => {
    orderService.createDemo({
      user: { name: 'C', email: '' },
      items: [item],
      subtotal: 1798,
      shipping: 0,
      total: 1798,
      payment: { mode: 'demo' },
    })
    vi.mocked(api).mockResolvedValue({
      products: [
        { order_id: 5, product_id: 1, name: 'A', quantity: 2, price_per_unit: 100, total_price: 200, image_url: null },
        { order_id: 5, product_id: 2, name: 'B', quantity: 1, price_per_unit: 50, total_price: 50, image_url: 'b.png' },
      ],
    })
    const { orders, error } = await orderService.list()
    expect(error).toBe('')
    expect(orders).toHaveLength(2)
    const store = orders.find((o) => o.id === 5)
    expect(store).toMatchObject({
      source: 'store',
      status: 'SUCCESS',
      paymentMode: 'RAZORPAY',
      placedAt: null,
      total: 250,
    })
    expect(store.items).toHaveLength(2)
    expect(store.items[1].image).toBe('b.png')
  })

  it('list returns local orders with an error message on failure', async () => {
    orderService.createDemo({
      user: { name: 'C', email: '' },
      items: [item],
      subtotal: 1798,
      shipping: 0,
      total: 1798,
      payment: { mode: 'demo' },
    })
    vi.mocked(api).mockRejectedValue(new Error('Server down'))
    const { orders, error } = await orderService.list()
    expect(orders).toHaveLength(1)
    expect(error).toBe('Server down')
  })
})
