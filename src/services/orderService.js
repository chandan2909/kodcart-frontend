import { api } from './api'

const ORDERS_KEY = 'kodcart_orders'

function readLocalOrders() {
  try {
    const raw = localStorage.getItem(ORDERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// GET /api/orders → { username, role, products: [order items] } where every row
// carries the razorpay order id it belongs to. Rows are grouped back into orders.
function mapBackendOrders(payload) {
  const rows = Array.isArray(payload?.products) ? payload.products : []
  const grouped = new Map()

  for (const row of rows) {
    const id = row.order_id
    if (!id) continue
    if (!grouped.has(id)) {
      grouped.set(id, {
        id,
        source: 'store',
        status: 'SUCCESS',
        paymentMode: 'RAZORPAY',
        placedAt: null,
        items: [],
        total: 0,
      })
    }
    const order = grouped.get(id)
    order.items.push({
      id: row.product_id,
      name: row.name,
      qty: Number(row.quantity) || 1,
      price: Number(row.price_per_unit) || 0,
      emoji: '🛍️',
      image: row.image_url || null,
    })
    order.total += Number(row.total_price) || 0
  }

  return [...grouped.values()]
}

export const orderService = {
  // Checkout stays in demo mode until the Razorpay key arrives, so these
  // orders are recorded in this browser only.
  createDemo({ user, items, subtotal, shipping, total, payment }) {
    const orders = readLocalOrders()
    const order = {
      id: `KOD${Date.now().toString().slice(-8)}`,
      source: 'local',
      customerName: user.name,
      customerEmail: user.email,
      items: items.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        qty: item.qty,
        emoji: item.product.emoji,
        colors: item.product.colors,
      })),
      subtotal,
      shipping,
      total,
      status: 'PLACED',
      paymentMode: payment.mode === 'live' ? 'RAZORPAY' : 'DEMO',
      paymentId: payment.razorpayPaymentId || null,
      placedAt: new Date().toISOString(),
    }
    orders.unshift(order)
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
    return order
  },

  // Real orders from the backend plus any local demo order, with a non-fatal
  // error message so the page can still render what it has.
  async list() {
    const local = readLocalOrders()
    try {
      const data = await api('/api/orders')
      return { orders: [...local, ...mapBackendOrders(data)], error: '' }
    } catch (error) {
      return { orders: local, error: error.message }
    }
  },
}
