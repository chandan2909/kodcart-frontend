import { useState } from 'react'
import { Link } from 'react-router-dom'
import { adminProductService } from '../services/adminProductService'

const INITIAL_FORM = {
  name: '',
  description: '',
  price: '',
  stock: '',
  categoryId: '',
  imageUrl: '',
}

// POST /admin/products/add needs: name, description, price, stock (integer),
// categoryId (integer that exists in the categories table) and a non-empty
// imageUrl — the service rejects products without an image.
function validate(form) {
  const errors = {}

  if (!form.name.trim()) errors.name = 'Product name is required'

  const price = Number(form.price)
  if (form.price === '' || !Number.isFinite(price) || price <= 0) {
    errors.price = 'Enter a price greater than 0'
  }

  const stock = Number(form.stock)
  if (form.stock === '' || !Number.isInteger(stock) || stock < 0) {
    errors.stock = 'Stock must be a whole number of 0 or more'
  }

  const categoryId = Number(form.categoryId)
  if (form.categoryId === '' || !Number.isInteger(categoryId) || categoryId < 1) {
    errors.categoryId = 'Category id must be a whole number of 1 or more'
  }

  const imageUrl = form.imageUrl.trim()
  if (!imageUrl) {
    errors.imageUrl = 'Image URL is required'
  } else if (!/^(https?:\/\/|\/)\S+$/i.test(imageUrl)) {
    errors.imageUrl = 'Use a full http(s) URL or a path starting with /'
  }

  return errors
}

export default function AdminProducts() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [addMessage, setAddMessage] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [recent, setRecent] = useState(() => adminProductService.listLocal())

  const [deleteId, setDeleteId] = useState('')
  const [deleteMessage, setDeleteMessage] = useState(null)
  const [deleting, setDeleting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => (prev[name] ? { ...prev, [name]: '' } : prev))
  }

  async function handleAdd(event) {
    event.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) return

    setSubmitting(true)
    setAddMessage(null)
    try {
      const product = await adminProductService.add({
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        categoryId: Number(form.categoryId),
        imageUrl: form.imageUrl.trim(),
      })
      setRecent(adminProductService.listLocal())
      setAddMessage({ ok: true, text: `Product #${product.productId} "${product.name}" was created.` })
      setForm(INITIAL_FORM)
    } catch (err) {
      setAddMessage({ ok: false, text: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(productId) {
    const id = Number(productId)
    if (!Number.isInteger(id) || id < 1) {
      setDeleteMessage({ ok: false, text: 'Enter a valid product id' })
      return
    }
    if (deleting) return

    setDeleting(true)
    setDeleteMessage(null)
    try {
      await adminProductService.remove(id)
      setRecent(adminProductService.listLocal())
      setDeleteId('')
      setDeleteMessage({ ok: true, text: `Product #${id} was deleted.` })
    } catch (err) {
      setDeleteMessage({ ok: false, text: err.message })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="page-container">
      <section className="hero">
        <div className="hero-copy">
          <span className="pill-badge">📦 Product Management</span>
          <h1>
            Grow the catalog,
            <br />
            <span className="hero-accent">effortlessly.</span>
          </h1>
          <p>
            Add new products and retire old ones in one place. Changes are live for every customer
            immediately.
          </p>
          <Link to="/admin" className="btn btn-outline">
            Back to dashboard
          </Link>
        </div>
      </section>

      <div className="cart-layout">
        <section className="panel profile-panel">
          <div className="panel-head">
            <h2>Add product</h2>
          </div>

          {addMessage && (
            <div className={`alert ${addMessage.ok ? 'success' : 'error'}`} role="alert">
              {addMessage.text}
            </div>
          )}

          <form className="profile-form" onSubmit={handleAdd} noValidate>
            <label className="field">
              <span>Product name</span>
              <input
                type="text"
                name="name"
                placeholder="Classic Blue Oxford Shirt"
                value={form.name}
                onChange={handleChange}
                maxLength={255}
                required
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && (
                <span className="field-error" role="alert">
                  {errors.name}
                </span>
              )}
            </label>

            <div className="field-row">
              <label className="field">
                <span>Price (₹)</span>
                <input
                  type="number"
                  name="price"
                  min="1"
                  step="0.01"
                  placeholder="899"
                  value={form.price}
                  onChange={handleChange}
                  required
                  aria-invalid={Boolean(errors.price)}
                />
                {errors.price && (
                  <span className="field-error" role="alert">
                    {errors.price}
                  </span>
                )}
              </label>
              <label className="field">
                <span>Stock</span>
                <input
                  type="number"
                  name="stock"
                  min="0"
                  step="1"
                  placeholder="25"
                  value={form.stock}
                  onChange={handleChange}
                  required
                  aria-invalid={Boolean(errors.stock)}
                />
                {errors.stock && (
                  <span className="field-error" role="alert">
                    {errors.stock}
                  </span>
                )}
              </label>
            </div>

            <label className="field">
              <span>Category id</span>
              <input
                type="number"
                name="categoryId"
                min="1"
                step="1"
                placeholder="1"
                value={form.categoryId}
                onChange={handleChange}
                required
                aria-invalid={Boolean(errors.categoryId)}
              />
              {errors.categoryId && (
                <span className="field-error" role="alert">
                  {errors.categoryId}
                </span>
              )}
            </label>

            <label className="field">
              <span>Image URL</span>
              <input
                type="text"
                name="imageUrl"
                placeholder="https://example.com/shirt.jpg"
                value={form.imageUrl}
                onChange={handleChange}
                required
                aria-invalid={Boolean(errors.imageUrl)}
              />
              {errors.imageUrl && (
                <span className="field-error" role="alert">
                  {errors.imageUrl}
                </span>
              )}
            </label>

            <label className="field">
              <span>Description</span>
              <textarea
                name="description"
                placeholder="Premium cotton oxford shirt…"
                value={form.description}
                onChange={handleChange}
              />
            </label>

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add product'}
            </button>
          </form>
        </section>

        <aside className="panel profile-panel">
          <div className="panel-head">
            <h2>Delete product</h2>
          </div>

          {deleteMessage && (
            <div className={`alert ${deleteMessage.ok ? 'success' : 'error'}`} role="alert">
              {deleteMessage.text}
            </div>
          )}

          <form
            className="profile-form"
            onSubmit={(event) => {
              event.preventDefault()
              handleDelete(deleteId)
            }}
          >
            <label className="field">
              <span>Product id</span>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="12"
                value={deleteId}
                onChange={(event) => {
                  setDeleteId(event.target.value)
                  setDeleteMessage(null)
                }}
                required
              />
            </label>
            <button type="submit" className="btn btn-outline" disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete product'}
            </button>
          </form>

          <div className="panel-head">
            <h2>Added from this browser</h2>
          </div>

          {recent.length === 0 ? null : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Id</th>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {recent.map((product) => (
                    <tr key={product.productId}>
                      <td>#{product.productId}</td>
                      <td>{product.name}</td>
                      <td>₹{Number(product.price || 0).toLocaleString('en-IN')}</td>
                      <td>{product.stock}</td>
                      <td>
                        <button
                          type="button"
                          className="link-btn"
                          onClick={() => handleDelete(product.productId)}
                          disabled={deleting}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
