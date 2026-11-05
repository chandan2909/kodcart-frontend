import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminDashboard from './AdminDashboard'
import { api } from '../services/api'

vi.mock('../services/api', () => ({ api: vi.fn() }))

function renderAdmin() {
  return render(
    <MemoryRouter>
      <AdminDashboard />
    </MemoryRouter>
  )
}

function monthlyPath() {
  const date = new Date()
  return `/admin/business/monthly?month=${date.getMonth() + 1}&year=${date.getFullYear()}`
}

beforeEach(() => {
  vi.mocked(api).mockReset()
  vi.mocked(api).mockImplementation((path) => {
    if (path === '/admin/business/overall') {
      return Promise.resolve({ totalBusiness: 25000, categorySales: { shirts: 3, pants: 2 } })
    }
    if (path.startsWith('/admin/business/monthly')) {
      return Promise.resolve({ totalBusiness: 5000, categorySales: {} })
    }
    return Promise.reject(new Error(`Unexpected call ${path}`))
  })
})

describe('AdminDashboard', () => {
  it('shows loading first', () => {
    vi.mocked(api).mockReturnValue(new Promise(() => {}))
    renderAdmin()
    expect(screen.getByText('Loading business report…')).toBeInTheDocument()
  })

  it('renders overall stats and category table', async () => {
    renderAdmin()
    expect(await screen.findByText('₹25,000')).toBeInTheDocument()
    expect(screen.getAllByText('Units sold').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('shirts')).toBeInTheDocument()
    expect(screen.getByText('pants')).toBeInTheDocument()
    expect(api).toHaveBeenCalledWith(monthlyPath())
  })

  it('shows an error alert when overall fails', async () => {
    vi.mocked(api).mockImplementation((path) =>
      path === '/admin/business/overall'
        ? Promise.reject(new Error('Server down'))
        : Promise.resolve({ totalBusiness: 0, categorySales: {} })
    )
    renderAdmin()
    expect(await screen.findByRole('alert')).toHaveTextContent('Server down')
  })
})
