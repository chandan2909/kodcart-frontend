import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { orderService } from '../services/orderService'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    orderService
      .list()
      .then((result) => {
        if (!active) return
        setOrders(result.orders)
        setError(result.error)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <h3>Loading orders…</h3>
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="page-container">
        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}
        <div className="empty-state">
          <img
            className="empty-state-img"
            src="/shopping-banner.jpg"
            alt=""
            aria-hidden="true"
            loading="lazy"
          />
          <h2>No orders yet</h2>
          <p>When you place an order, it will show up here with full details.</p>
          <Link to="/" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      {error && (
        <div className="alert error" role="alert">
          Could not load store orders: {error}
        </div>
      )}
      <h1 className="page-title">My Orders</h1>
      <div className="orders-list">
        {orders.map((order) => (
          <article key={order.id} className="panel order-card">
            <div className="order-head">
              <div>
                <h3>{order.id}</h3>
                <span className="muted">
                  {order.placedAt
                    ? new Date(order.placedAt).toLocaleString('en-IN')
                    : `${order.items.length} item${order.items.length === 1 ? '' : 's'}`}
                </span>
              </div>
              <span className="pill pill-ok">{order.status}</span>
            </div>

            <ul className="order-items">
              {order.items.map((item) => (
                <li key={`${order.id}-${item.id}`}>
                  <span className="order-emoji" aria-hidden="true">
                    {item.emoji || '🛍️'}
                  </span>
                  <span className="order-name">{item.name}</span>
                  <span className="order-qty">x{item.qty}</span>
                  <span className="order-price">₹{(item.price * item.qty).toLocaleString('en-IN')}</span>
                </li>
              ))}
            </ul>

            <div className="order-foot">
              <span>
                Payment: <strong>{order.paymentMode}</strong>
              </span>
              <span>
                Total: <strong>₹{order.total.toLocaleString('en-IN')}</strong>
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
