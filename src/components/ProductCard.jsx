import ProductImage from './ProductImage'

export default function ProductCard({ product, qty, onAdd }) {
  // The store API returns no MRP/rating/category, so those rows are hidden
  // instead of showing made-up numbers.
  const hasMrp = product.mrp > product.price
  const discount = hasMrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0
  const showRating = typeof product.rating === 'number'

  return (
    <article className="product-card">
      <ProductImage product={product} />
      <div className="product-body">
        {product.category && <span className="product-category">{product.category.replace('-', ' ')}</span>}
        <h3 className="product-name" title={product.name}>
          {product.name}
        </h3>
        {showRating && (
          <div className="product-rating">
            <span className="star">★</span> {product.rating.toFixed(1)}
          </div>
        )}
        <div className="product-price">
          <span className="price">₹{product.price.toLocaleString('en-IN')}</span>
          {hasMrp && <span className="mrp">₹{product.mrp.toLocaleString('en-IN')}</span>}
          {hasMrp && <span className="discount">{discount}% off</span>}
        </div>
        <button type="button" className="btn btn-add" onClick={() => onAdd(product)}>
          {qty > 0 ? `In Cart (${qty})` : 'Add to Cart'}
        </button>
      </div>
    </article>
  )
}
