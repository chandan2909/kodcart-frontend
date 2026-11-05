import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ProductImage from './ProductImage'

const product = {
  name: 'Shirt',
  colors: ['#1e5f9e', '#0d2f52'],
  emoji: '👕',
}

describe('ProductImage', () => {
  it('renders an image when a src exists', () => {
    render(<ProductImage product={{ ...product, images: ['https://x/img.png'] }} />)
    const img = screen.getByRole('img', { name: 'Shirt' })
    expect(img).toHaveAttribute('src', 'https://x/img.png')
  })

  it('falls back to the styled placeholder when the image errors', () => {
    render(<ProductImage product={{ ...product, images: ['https://x/broken.png'] }} />)
    fireEvent.error(screen.getByRole('img', { name: 'Shirt' }))
    expect(screen.getByText('👕')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Shirt' })).toHaveStyle({
      backgroundImage: 'linear-gradient(135deg, rgb(30, 95, 158), rgb(13, 47, 82))',
    })
  })

  it('renders the placeholder when there is no image', () => {
    render(<ProductImage product={product} />)
    expect(screen.getByRole('img', { name: 'Shirt' })).toBeInTheDocument()
    expect(screen.getByText('👕')).toBeInTheDocument()
  })
})
