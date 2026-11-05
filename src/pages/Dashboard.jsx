import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import Footer from '../components/Footer'
import { CATEGORIES } from '../data/products'
import { useCart } from '../hooks/useCart'
import { fetchProducts } from '../services/productService'

export default function Dashboard() {
  // The active category lives in the URL (?category=shirts) so the header's
  // category menu can highlight the active filter from any page.
  const [searchParams] = useSearchParams()
  const category = searchParams.get('category') || 'all'
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState('')
  const [result, setResult] = useState({ key: 'all:0', products: [], error: '' })
  const [reloadKey, setReloadKey] = useState(0)
  const { items, addItem } = useCart()
  const navigate = useNavigate()

  // Loading is derived by comparing the rendered key with the requested one,
  // so the effect only ever reports finished work.
  const requestKey = `${category}:${reloadKey}`
  const loading = result.key !== requestKey
  const products = result.products
  const loadError = loading ? '' : result.error

  useEffect(() => {
    let active = true
    const key = `${category}:${reloadKey}`

    fetchProducts(category)
      .then((data) => {
        if (active) setResult({ key, products: data, error: '' })
      })
      .catch((error) => {
        if (!active) return
        // 400 = the category is unknown to the API → plain empty state.
        setResult({ key, products: [], error: error.status === 400 ? '' : error.message })
      })

    return () => {
      active = false
    }
  }, [category, reloadKey])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return products.filter((product) => product.name.toLowerCase().includes(term))
  }, [products, query])

  async function handleAdd(product) {
    try {
      await addItem(product)
      setToast(`${product.name} added to cart`)
    } catch (error) {
      setToast(error.message)
    }
    window.clearTimeout(handleAdd.timer)
    handleAdd.timer = window.setTimeout(() => setToast(''), 2500)
  }

  function qtyOf(productId) {
    return items.find((item) => item.product.id === productId)?.qty || 0
  }

  return (
    <div className="page-container">
      <section className="hero">
        <div className="hero-copy">
          <span className="pill-badge">🛍️ kodcart Store</span>
          <h1>
            Shop the latest,
            <br />
            <span className="hero-accent">effortlessly.</span>
          </h1>
          <p>Fresh picks across clothing, electronics and accessories — delivered to your door.</p>
        </div>
        <div className="hero-visual">
          <img src="/hero-cart.png" alt="" aria-hidden="true" />
        </div>
      </section>

      <nav className="category-nav" aria-label="Product categories">
        {CATEGORIES.filter((item) => item.id !== 'all').map((item) => (
          <Link
            key={item.id}
            to={`/?category=${item.id}`}
            className={category === item.id ? 'active' : undefined}
            aria-current={category === item.id ? 'page' : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="toolbar">
        <span className="result-count">
          {loading ? 'Loading…' : `${filtered.length} product${filtered.length === 1 ? '' : 's'}`}
        </span>
        <input
          type="search"
          className="search-input"
          placeholder="Search products..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {loading ? (
        <div className="empty-state">
          <h3>Loading products…</h3>
        </div>
      ) : loadError ? (
        <div className="empty-state">
          <h3>Could not load products</h3>
          <p>{loadError}</p>
          <button type="button" className="btn btn-outline" onClick={() => setReloadKey((key) => key + 1)}>
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No products found</h3>
          <p>Try a different category or search term.</p>
        </div>
      ) : (
        <div className="product-grid">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              qty={qtyOf(product.id)}
              onAdd={handleAdd}
            />
          ))}
        </div>
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
          <button type="button" onClick={() => navigate('/cart')}>
            View Cart
          </button>
        </div>
      )}

      <Footer />
    </div>
  )
}
