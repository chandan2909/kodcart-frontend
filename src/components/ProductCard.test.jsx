import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ProductCard from './ProductCard'

const product = {
  id: 1,
  name: 'Classic Blue Oxford Shirt',
  category: 'shirts',
  price: 899,
  mrp: 1499,
  rating: 4.4,
  colors: ['#1e5f9e', '#0d2f52'],
}

describe('ProductCard', () => {
  it('renders name, price, discount and rating', () => {
    render(<ProductCard product={product} qty={0} onAdd={() => {}} />)

    expect(screen.getByText('Classic Blue Oxford Shirt')).toBeInTheDocument()
    expect(screen.getByText('₹899')).toBeInTheDocument()
    expect(screen.getByText('₹1,499')).toBeInTheDocument()
    expect(screen.getByText('40% off')).toBeInTheDocument()
    expect(screen.getByText('4.4')).toBeInTheDocument()
    expect(screen.getByText('shirts')).toBeInTheDocument()
  })

  it('hides MRP/discount/rating when the product has none', () => {
    render(
      <ProductCard product={{ ...product, mrp: 899, rating: null }} qty={0} onAdd={() => {}} />
    )

    expect(screen.queryByText(/% off/)).not.toBeInTheDocument()
    expect(screen.queryByText('₹1,499')).not.toBeInTheDocument()
    expect(screen.queryByText('4.4')).not.toBeInTheDocument()
  })

  it('shows cart quantity on the button when already in cart', () => {
    render(<ProductCard product={product} qty={3} onAdd={() => {}} />)

    expect(screen.getByRole('button', { name: /In Cart \(3\)/ })).toBeInTheDocument()
  })

  it('calls onAdd with the product on click', () => {
    const onAdd = vi.fn()
    render(<ProductCard product={product} qty={0} onAdd={onAdd} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add to Cart' }))

    expect(onAdd).toHaveBeenCalledWith(product)
  })
})
