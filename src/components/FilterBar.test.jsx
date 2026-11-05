import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CATEGORIES } from '../data/products'
import FilterBar from './FilterBar'

describe('FilterBar', () => {
  it('renders every category as a tab', () => {
    render(<FilterBar active="all" onChange={() => {}} />)

    for (const category of CATEGORIES) {
      expect(screen.getByRole('tab', { name: category.label })).toBeInTheDocument()
    }
  })

  it('marks the active category and shows counts', () => {
    render(<FilterBar active="shirts" counts={{ shirts: 2 }} onChange={() => {}} />)

    expect(screen.getByRole('tab', { name: /Shirts/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'All' })).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('calls onChange with the clicked category id', () => {
    const onChange = vi.fn()
    render(<FilterBar active="all" onChange={onChange} />)

    fireEvent.click(screen.getByRole('tab', { name: 'Pants' }))

    expect(onChange).toHaveBeenCalledWith('pants')
  })
})
