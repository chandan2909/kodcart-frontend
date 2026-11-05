import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from './api'
import { adminProductService } from './adminProductService'

vi.mock('./api', () => ({ api: vi.fn() }))

beforeEach(() => {
  vi.mocked(api).mockReset()
  localStorage.clear()
})

describe('adminProductService', () => {
  it('add stores the created product in local history', async () => {
    vi.mocked(api).mockResolvedValue({ productId: 7, name: 'T-Shirt', price: '499', stock: 10 })
    const product = await adminProductService.add({
      name: 'T-Shirt',
      price: 499,
      stock: 10,
      categoryId: 1,
      imageUrl: '/t.png',
      description: '',
    })
    expect(product.productId).toBe(7)
    expect(api).toHaveBeenCalledWith('/admin/products/add', {
      method: 'POST',
      body: { name: 'T-Shirt', price: 499, stock: 10, categoryId: 1, imageUrl: '/t.png', description: '' },
    })
    const [entry] = adminProductService.listLocal()
    expect(entry).toMatchObject({
      productId: 7,
      name: 'T-Shirt',
      price: 499,
      stock: 10,
      categoryId: 1,
      imageUrl: '/t.png',
    })
    expect(entry.addedAt).toEqual(expect.any(String))
  })

  it('remove deletes the product from history', async () => {
    localStorage.setItem(
      'kodcart_admin_products',
      JSON.stringify([
        { productId: 7, name: 'T-Shirt' },
        { productId: 8, name: 'Shirt' },
      ])
    )
    vi.mocked(api).mockResolvedValue({})
    await adminProductService.remove(7)
    expect(api).toHaveBeenCalledWith('/admin/products/delete', {
      method: 'DELETE',
      body: { productId: 7 },
    })
    expect(adminProductService.listLocal().map((p) => p.productId)).toEqual([8])
  })
})
