import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from './api'
import { startPayment } from './paymentService'

vi.mock('./api', () => ({ api: vi.fn() }))

class FakeRazorpay {
  static instances = []
  constructor(options) {
    this.options = options
    FakeRazorpay.instances.push(this)
  }
  on() {}
  open() {}
}

const ctx = {
  total: 1798,
  user: { name: 'C', email: 'c@x.io' },
  items: [{ product: { id: 1, price: 899 }, qty: 2 }],
}

beforeEach(() => {
  vi.mocked(api).mockReset()
  FakeRazorpay.instances = []
  window.Razorpay = FakeRazorpay
})

afterEach(() => {
  delete window.Razorpay
  vi.restoreAllMocks()
})

describe('startPayment', () => {
  it('creates the order and resolves after successful verification', async () => {
    vi.mocked(api)
      .mockResolvedValueOnce('ord_123')
      .mockResolvedValueOnce({ ok: true })

    const pending = startPayment(ctx)
    await vi.waitFor(() => expect(FakeRazorpay.instances).toHaveLength(1))
    const rzp = FakeRazorpay.instances[0]
    expect(api).toHaveBeenCalledWith('/api/payment/create', {
      method: 'POST',
      body: { totalAmount: 1798, cartItems: [{ productId: 1, quantity: 2, price: 899 }] },
    })
    expect(rzp.options.order_id).toBe('ord_123')
    expect(rzp.options.amount).toBe(179800)

    rzp.options.handler({
      razorpay_order_id: 'ord_123',
      razorpay_payment_id: 'pay_1',
      razorpay_signature: 'sig',
    })
    await expect(pending).resolves.toEqual({
      mode: 'live',
      razorpayPaymentId: 'pay_1',
      razorpayOrderId: 'ord_123',
      razorpaySignature: 'sig',
    })
    expect(api).toHaveBeenLastCalledWith('/api/payment/verify', {
      method: 'POST',
      body: {
        razorpayOrderId: 'ord_123',
        razorpayPaymentId: 'pay_1',
        razorpaySignature: 'sig',
      },
    })
  })

  it('rejects when the checkout script cannot load', async () => {
    window.Razorpay = undefined
    vi.mocked(api).mockResolvedValueOnce('ord_1')
    vi.spyOn(document.body, 'appendChild').mockImplementationOnce((el) => {
      el.onerror()
      return el
    })
    await expect(startPayment(ctx)).rejects.toThrow('Could not load Razorpay checkout')
  })

  it('rejects when the modal is dismissed', async () => {
    vi.mocked(api).mockResolvedValueOnce('ord_1')
    const pending = startPayment(ctx)
    await vi.waitFor(() => expect(FakeRazorpay.instances).toHaveLength(1))
    FakeRazorpay.instances[0].options.modal.ondismiss()
    await expect(pending).rejects.toThrow('Payment cancelled')
  })

  it('wraps verify failures with a warning', async () => {
    vi.mocked(api)
      .mockResolvedValueOnce('ord_1')
      .mockRejectedValueOnce(new Error('bad signature'))
    const pending = startPayment(ctx)
    await vi.waitFor(() => expect(FakeRazorpay.instances).toHaveLength(1))
    FakeRazorpay.instances[0].options.handler({
      razorpay_order_id: 'o',
      razorpay_payment_id: 'p',
      razorpay_signature: 's',
    })
    await expect(pending).rejects.toThrow('Payment received but verification failed: bad signature')
  })
})
