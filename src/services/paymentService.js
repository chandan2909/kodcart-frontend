import { api } from './api'

// Public key id (safe to ship in the browser); the secret lives only on the
// Spring Boot side. Override with VITE_RAZORPAY_KEY_ID if you rotate keys.
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TgBLdtHJF4huZm'

let scriptPromise = null

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve(true)
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
  return scriptPromise
}

// Full live flow:
//   1. POST /api/payment/create  → backend creates a Razorpay order (INR,
//      paise) with the server-side secret and stores a PENDING local order.
//   2. Razorpay checkout modal opens with that order_id.
//   3. POST /api/payment/verify  → backend validates the signature, marks the
//      order SUCCESS, converts the cart into order items and clears the cart.
// Everything rides the Vite proxy with the httpOnly authToken cookie.
export async function startPayment({ total, user, items }) {
  const orderId = await api('/api/payment/create', {
    method: 'POST',
    body: {
      totalAmount: total,
      cartItems: items.map(({ product, qty }) => ({
        productId: product.id,
        quantity: qty,
        price: product.price,
      })),
    },
  })

  const scriptReady = await loadRazorpayScript()
  if (!scriptReady || !window.Razorpay) {
    throw new Error('Could not load Razorpay checkout. Check your internet connection and try again.')
  }

  return new Promise((resolve, reject) => {
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: Math.round(total * 100),
      currency: 'INR',
      name: 'kodcart',
      description: `Payment for ${items.length} item(s)`,
      order_id: orderId,
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
      },
      theme: { color: '#e0a526' },
      handler: async (response) => {
        try {
          await api('/api/payment/verify', {
            method: 'POST',
            body: {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            },
          })
          resolve({
            mode: 'live',
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
          })
        } catch (error) {
          // Money moved but our backend rejected the signature — surface it
          // instead of silently marking the order as placed.
          reject(new Error(`Payment received but verification failed: ${error.message}`))
        }
      },
      modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
    }
    const razorpay = new window.Razorpay(options)
    razorpay.on('payment.failed', (response) =>
      reject(new Error(response.error.description || 'Payment failed. Please try again.'))
    )
    razorpay.open()
  })
}
