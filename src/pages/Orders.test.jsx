import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Orders from './Orders'
import { orderService } from '../services/orderService'

vi.mock('../services/orderService', () => ({ orderService: { list: vi.fn() } }))

const order = {
  id: 'KOD12345678',
  source: 'local',
  status: 'PLACED',
  paymentMode: 'DEMO',
  placedAt: '2026-11-05T10:00:00.000Z',
  items: [{ id: 1, name: 'Shirt', qty: 2, price: 500, emoji: '👕' }],
  total: 1000,
}

function renderOrders() {
  return render(
    <MemoryRouter>
      <Orders />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.mocked(orderService.list).mockReset()
})

describe('Orders', () => {
  it('shows loading initially', () => {
    vi.mocked(orderService.list).mockReturnValue(new Promise(() => {}))
    renderOrders()
    expect(screen.getByText('Loading orders…')).toBeInTheDocument()
  })

  it('shows the empty state', async () => {
    vi.mocked(orderService.list).mockResolvedValue({ orders: [], error: '' })
    renderOrders()
    expect(await screen.findByText('No orders yet')).toBeInTheDocument()
  })

  it('renders orders with items and totals', async () => {
    vi.mocked(orderService.list).mockResolvedValue({ orders: [order], error: '' })
    renderOrders()
    expect(await screen.findByText('KOD12345678')).toBeInTheDocument()
    expect(screen.getByText('Shirt')).toBeInTheDocument()
    expect(screen.getByText('x2')).toBeInTheDocument()
    expect(screen.getAllByText('₹1,000').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('PLACED')).toBeInTheDocument()
  })

  it('shows the store error banner', async () => {
    vi.mocked(orderService.list).mockResolvedValue({ orders: [order], error: 'Server down' })
    renderOrders()
    expect(await screen.findByText(/Could not load store orders: Server down/)).toBeInTheDocument()
  })
})
