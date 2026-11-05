import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminProducts from './AdminProducts'
import { adminProductService } from '../services/adminProductService'

vi.mock('../services/adminProductService', () => ({
  adminProductService: {
    listLocal: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
  },
}))

const recent = [{ productId: 7, name: 'T-Shirt', price: 499, stock: 10 }]

function renderAdminProducts() {
  return render(
    <MemoryRouter>
      <AdminProducts />
    </MemoryRouter>
  )
}

function fillValidForm() {
  fireEvent.change(screen.getByPlaceholderText('Classic Blue Oxford Shirt'), {
    target: { value: 'Nova Jacket' },
  })
  fireEvent.change(screen.getByPlaceholderText('899'), { target: { value: '1299' } })
  fireEvent.change(screen.getByPlaceholderText('25'), { target: { value: '8' } })
  fireEvent.change(screen.getByPlaceholderText('1'), { target: { value: '2' } })
  fireEvent.change(screen.getByPlaceholderText('https://example.com/shirt.jpg'), {
    target: { value: 'https://img/nova.jpg' },
  })
}

beforeEach(() => {
  vi.mocked(adminProductService.listLocal).mockReturnValue(recent)
  vi.mocked(adminProductService.add).mockReset()
  vi.mocked(adminProductService.remove).mockReset()
})

describe('AdminProducts', () => {
  it('renders local history', () => {
    renderAdminProducts()
    expect(screen.getByText('#7')).toBeInTheDocument()
    expect(screen.getByText('T-Shirt')).toBeInTheDocument()
  })

  it('validates the add form', () => {
    renderAdminProducts()
    fireEvent.click(screen.getByRole('button', { name: 'Add product' }))
    expect(screen.getByText('Product name is required')).toBeInTheDocument()
    expect(screen.getByText('Enter a price greater than 0')).toBeInTheDocument()
    expect(screen.getByText('Stock must be a whole number of 0 or more')).toBeInTheDocument()
    expect(screen.getByText('Category id must be a whole number of 1 or more')).toBeInTheDocument()
    expect(screen.getByText('Image URL is required')).toBeInTheDocument()
    expect(adminProductService.add).not.toHaveBeenCalled()
  })

  it('adds a product and resets the form', async () => {
    vi.mocked(adminProductService.add).mockResolvedValue({ productId: 9, name: 'Nova Jacket' })
    vi.mocked(adminProductService.listLocal).mockReturnValue([
      { productId: 9, name: 'Nova Jacket', price: 1299, stock: 8 },
      ...recent,
    ])
    renderAdminProducts()
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: 'Add product' }))
    expect(adminProductService.add).toHaveBeenCalledWith({
      name: 'Nova Jacket',
      description: '',
      price: 1299,
      stock: 8,
      categoryId: 2,
      imageUrl: 'https://img/nova.jpg',
    })
    expect(await screen.findByText('Product #9 "Nova Jacket" was created.')).toBeInTheDocument()
    expect(screen.getByText('#9')).toBeInTheDocument()
  })

  it('shows add failures', async () => {
    vi.mocked(adminProductService.add).mockRejectedValue(new Error('Backend rejected'))
    renderAdminProducts()
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: 'Add product' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Backend rejected')
  })

  it('rejects invalid delete ids', () => {
    renderAdminProducts()
    fireEvent.change(screen.getByPlaceholderText('12'), { target: { value: '-1' } })
    fireEvent.submit(screen.getByPlaceholderText('12').closest('form'))
    expect(screen.getByText('Enter a valid product id')).toBeInTheDocument()
    expect(adminProductService.remove).not.toHaveBeenCalled()
  })

  it('deletes from history via the row button', async () => {
    vi.mocked(adminProductService.remove).mockResolvedValue()
    renderAdminProducts()
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(adminProductService.remove).toHaveBeenCalledWith(7)
    expect(await screen.findByText('Product #7 was deleted.')).toBeInTheDocument()
  })
})
