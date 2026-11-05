import { useState } from 'react'

export default function ProductImage({ product, className = '' }) {
  // A broken image URL falls back to the styled placeholder below — the
  // course's onError handling rendered with our own visuals.
  const [failed, setFailed] = useState(false)
  const src = product?.images?.[0] || product?.image_url || null
  const name = product?.name || 'Product'

  if (src && !failed) {
    return (
      <div className={`product-img ${className}`}>
        <img src={src} alt={name} loading="lazy" onError={() => setFailed(true)} />
      </div>
    )
  }

  const [from, to] = product?.colors || ['#1f2937', '#111827']
  return (
    <div
      className={`product-img ${className}`}
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
      role="img"
      aria-label={name}
    >
      <span aria-hidden="true">{product?.emoji || '🛍️'}</span>
    </div>
  )
}
