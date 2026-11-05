import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Footer from './Footer'

describe('Footer', () => {
  it('renders brand and links', () => {
    render(<Footer />)
    expect(screen.getByText('kodcart')).toBeInTheDocument()
    expect(screen.getByText('Your one-stop shop for all your needs')).toBeInTheDocument()
    for (const label of ['About Us', 'Contact', 'Terms of Service', 'Privacy Policy']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })
})
