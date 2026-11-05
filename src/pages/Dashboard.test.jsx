import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Dashboard from './Dashboard'
import { fetchProducts } from '../services/productService'

const carts = vi.hoisted(() => ({ items: [], addItem: vi.fn() }))
vi.mock('../hooks/useCart', () => ({
  useCart: () => ({ items: carts.items, addItem: carts.addItem }),
}))
vi.mock('../services/productService', () => ({ fetchProducts: vi.fn() }))

const products = [
  {
    id: 1,
    name: 'Classic Blue Oxford Shirt',
    category: 'shirts',
    price: 899,
    mrp: 1499,
    rating: 4.4,
    colors: ['#111', '#222'],
  },
  {
    id: 2,
    name: 'Leather Travel Backpack',
    category: 'accessories',
    price: 1899,
    mrp: 2999,
    rating: 4.6,
    colors: ['#111', '#222'],
  },
]

function renderDashboard(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Dashboard />
    </MemoryRouter>
  )
}

beforeEach(() => {
  carts.items = []
  carts.addItem.mockReset()
  vi.mocked(fetchProducts).mockReset()
  vi.mocked(fetchProducts).mockResolvedValue(products)
})

describe('Dashboard', () => {
  it('renders fetched products', async () => {
    renderDashboard()
    expect(await screen.findByText('Classic Blue Oxford Shirt')).toBeInTheDocument()
    expect(screen.getByText('Leather Travel Backpack')).toBeInTheDocument()
    expect(screen.getByText('2 products')).toBeInTheDocument()
  })

  it('filters by search term', async () => {
    renderDashboard()
    await screen.findByText('Classic Blue Oxford Shirt')
    fireEvent.change(screen.getByPlaceholderText('Search products...'), {
      target: { value: 'backpack' },
    })
    expect(screen.queryByText('Classic Blue Oxford Shirt')).not.toBeInTheDocument()
    expect(screen.getByText('Leather Travel Backpack')).toBeInTheDocument()
  })

  it('passes the URL category to fetchProducts', async () => {
    renderDashboard('/?category=shirts')
    await screen.findByText('Classic Blue Oxford Shirt')
    expect(fetchProducts).toHaveBeenCalledWith('shirts')
  })

  it('shows a toast when a product is added', async () => {
    carts.addItem.mockResolvedValue()
    renderDashboard()
    await screen.findByText('Classic Blue Oxford Shirt')
    fireEvent.click(screen.getAllByRole('button', { name: 'Add to Cart' })[0])
    expect(await screen.findByRole('status')).toHaveTextContent('Classic Blue Oxford Shirt added to cart')
  })

  it('shows the error state when fetching fails', async () => {
    vi.mocked(fetchProducts).mockRejectedValue(new Error('Server down'))
    renderDashboard()
    expect(await screen.findByText('Could not load products')).toBeInTheDocument()
    expect(screen.getByText('Server down')).toBeInTheDocument()
  })
})
