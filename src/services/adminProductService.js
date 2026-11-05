import { api } from './api'

const HISTORY_KEY = 'kodcart_admin_products'

function readHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeHistory(items) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items))
}

// POST /admin/products/add → 201 with the saved Product (includes the
// generated productId). DELETE /admin/products/delete → 200/404.
// The API exposes no product-list endpoint for admins, so ids returned by
// add are remembered locally to give the delete screen something to show.
export const adminProductService = {
  listLocal() {
    return readHistory()
  },

  async add(payload) {
    const product = await api('/admin/products/add', { method: 'POST', body: payload })
    writeHistory([
      {
        productId: product.productId,
        name: product.name,
        price: Number(product.price),
        stock: product.stock,
        categoryId: payload.categoryId,
        imageUrl: payload.imageUrl,
        addedAt: new Date().toISOString(),
      },
      ...readHistory(),
    ])
    return product
  },

  async remove(productId) {
    await api('/admin/products/delete', { method: 'DELETE', body: { productId } })
    writeHistory(readHistory().filter((item) => item.productId !== productId))
  },
}
