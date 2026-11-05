import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from './api'
import { fetchProducts, mapProduct } from './productService'

vi.mock('./api', () => ({ api: vi.fn() }))

describe('mapProduct', () => {
  it('maps a raw API product', () => {
    expect(
      mapProduct({
        product_id: 3,
        name: 'Shirt',
        description: 'D',
        price: '899',
        stock: 5,
        images: ['a.png', null],
      })
    ).toEqual({
      id: 3,
      name: 'Shirt',
      description: 'D',
      price: 899,
      mrp: 899,
      stock: 5,
      images: ['a.png'],
      category: '',
    })
  })

  it('defaults missing fields safely', () => {
    expect(mapProduct({ product_id: 1 })).toEqual({
      id: 1,
      description: '',
      price: 0,
      mrp: 0,
      stock: 0,
      images: [],
      category: '',
    })
  })
})

describe('fetchProducts', () => {
  beforeEach(() => {
    vi.mocked(api).mockReset()
  })

  it('fetches all products without a category', async () => {
    vi.mocked(api).mockResolvedValue({ products: [{ product_id: 1, name: 'A', price: 100 }] })
    const result = await fetchProducts('all')
    expect(api).toHaveBeenCalledWith('/api/products')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
  })

  it('falls back from the display label to the chip id on 400', async () => {
    vi.mocked(api)
      .mockRejectedValueOnce({ status: 400, message: 'Category not found' })
      .mockResolvedValueOnce({ products: [] })
    await fetchProducts('shirts')
    expect(api).toHaveBeenNthCalledWith(1, '/api/products?category=Shirts')
    expect(api).toHaveBeenNthCalledWith(2, '/api/products?category=shirts')
  })

  it('rethrows non-400 errors', async () => {
    vi.mocked(api).mockRejectedValueOnce({ status: 500, message: 'boom' })
    await expect(fetchProducts('shirts')).rejects.toMatchObject({ status: 500 })
    expect(api).toHaveBeenCalledTimes(1)
  })

  it('throws when both candidates fail with 400', async () => {
    vi.mocked(api).mockRejectedValue({ status: 400, message: 'Category not found' })
    await expect(fetchProducts('pants')).rejects.toMatchObject({ status: 400 })
    expect(api).toHaveBeenCalledTimes(2)
  })
})
