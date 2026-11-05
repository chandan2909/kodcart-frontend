import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ProductImage from '../components/ProductImage'
import { FREE_SHIPPING_THRESHOLD } from '../data/pricing'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useCart'
import { startPayment } from '../services/paymentService'

export default function Cart() {
  const {
    items,
    subtotal,
    shipping,
    total,
    updateQty,
    removeItem,
    clearCart,
    refresh,
    error: cartError,
  } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [paying, setPaying] = useState(false)
  const [placedOrder, setPlacedOrder] = useState(null)
  const [actionError, setActionError] = useState('')

  const error = actionError || cartError

  // Cart mutations now hit /api/cart/*, so failures land in the banner instead
  // of being swallowed.
  function run(action) {
    setActionError('')
    return action().catch((err) => setActionError(err.message))
  }

  async function handlePayment() {
    if (items.length === 0 || paying) return
    setPaying(true)
    setActionError('')
    const paidTotal = total
    try {
      // Live Razorpay flow: on success the backend verify call has already
      // recorded the order, converted the cart into order items and cleared
      // the cart server-side — so we only resync state here.
      const payment = await startPayment({ total: paidTotal, user, items })
      await refresh()
      setPlacedOrder({ id: payment.razorpayOrderId, total: paidTotal })
    } catch (error) {
      setActionError(error.message || 'Payment failed. Please try again.')
    } finally {
      setPaying(false)
    }
  }

  if (placedOrder) {
    return (
      <div className="page-container">
        <div className="order-success">
          <div className="success-icon" aria-hidden="true">
            ✓
          </div>
          <h1>Order placed successfully</h1>
          <p>
            Order ID <strong>{placedOrder.id}</strong> · Amount paid{' '}
            <strong>₹{placedOrder.total.toLocaleString('en-IN')}</strong>
          </p>
          <div className="success-actions">
            <button type="button" className="btn btn-primary" onClick={() => navigate('/orders')}>
              View Orders
            </button>
            <Link to="/" className="btn btn-outline">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-cart-icon" aria-hidden="true">
            🛒
          </div>
          <h2>Your cart is empty</h2>
          <p>Add products from the dashboard and they will show up here.</p>
          <Link to="/" className="btn btn-primary">
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}

      <div className="cart-layout">
        <section className="panel cart-items">
          <div className="panel-head">
            <h2>My Cart ({items.length})</h2>
            <button type="button" className="link-btn" onClick={() => run(clearCart)}>
              Clear cart
            </button>
          </div>

          <ul className="cart-list">
            {items.map(({ product, qty }) => (
              <li key={product.id} className="cart-row">
                <ProductImage product={product} className="cart-thumb" />
                <div className="cart-info">
                  <h3>{product.name}</h3>
                  {product.category && (
                    <span className="cart-category">{product.category.replace('-', ' ')}</span>
                  )}
                  <div className="cart-price">
                    ₹{(product.price * qty).toLocaleString('en-IN')}
                    <small>₹{product.price.toLocaleString('en-IN')} each</small>
                  </div>
                </div>
                <div className="qty-controls">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => run(() => updateQty(product.id, qty - 1))}
                  >
                    −
                  </button>
                  <span>{qty}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => run(() => updateQty(product.id, qty + 1))}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => run(() => removeItem(product.id))}
                  aria-label={`Remove ${product.name}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>

        <aside className="panel cart-summary">
          <h2>Price Details</h2>
          <div className="summary-row">
            <span>Products total</span>
            <span>₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="summary-row">
            <span>Shipping charges</span>
            <span className={shipping === 0 ? 'free' : ''}>
              {shipping === 0 ? 'FREE' : `₹${shipping}`}
            </span>
          </div>
          {shipping > 0 && (
            <p className="shipping-note">
              Add ₹{(FREE_SHIPPING_THRESHOLD - subtotal).toLocaleString('en-IN')} more for free shipping
            </p>
          )}
          <hr />
          <div className="summary-row total">
            <span>Total amount</span>
            <span>₹{total.toLocaleString('en-IN')}</span>
          </div>

          <button type="button" className="btn btn-primary pay-btn" onClick={handlePayment} disabled={paying}>
            {paying ? 'Processing...' : `Pay ₹${total.toLocaleString('en-IN')}`}
          </button>
          <p className="razorpay-note">Secured payments powered by Razorpay</p>
        </aside>
      </div>
    </div>
  )
}
