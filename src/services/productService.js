import { api } from './api'
import { CATEGORIES } from '../data/products'

// GET /api/products answers with:
// { user: {...}, products: [{ product_id, name, description, price, stock, images: [] }] }
// The API ships no MRP/rating/category per item, so those stay unset and the
// UI hides them instead of inventing values.
export function mapProduct(raw) {
  const price = Number(raw.price) || 0
  return {
    id: raw.product_id,
    name: raw.name,
    description: raw.description || '',
    price,
    mrp: price,
    stock: raw.stock ?? 0,
    images: Array.isArray(raw.images) ? raw.images.filter(Boolean) : [],
    category: '',
  }
}

async function requestProducts(categoryName) {
  const path = categoryName
    ? `/api/products?category=${encodeURIComponent(categoryName)}`
    : '/api/products'
  const data = await api(path)
  return (data.products || []).map(mapProduct)
}

// The category filter expects the exact category_name stored in the database.
// Try the display label first, then the chip id; a 400 "Category not found"
// from either means the category simply has no products yet.
export async function fetchProducts(categoryId = 'all') {
  const category = CATEGORIES.find((item) => item.id === categoryId)
  if (!category || category.id === 'all') {
    return requestProducts('')
  }

  let lastError = null
  for (const candidate of [category.label, category.id]) {
    try {
      return await requestProducts(candidate)
    } catch (error) {
      if (error.status && error.status !== 400) throw error
      lastError = error
    }
  }
  throw lastError
}
