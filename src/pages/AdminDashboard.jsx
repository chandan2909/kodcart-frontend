import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function now() {
  const date = new Date()
  return { month: date.getMonth() + 1, year: date.getFullYear() }
}

function unitsSold(categorySales = {}) {
  return Object.values(categorySales).reduce((sum, value) => sum + Number(value || 0), 0)
}

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

export default function AdminDashboard() {
  const initial = now()
  const [overall, setOverall] = useState(null)
  const [overallError, setOverallError] = useState('')
  const [month, setMonth] = useState(initial.month)
  const [year, setYear] = useState(initial.year)
  const [monthly, setMonthly] = useState(null)

  useEffect(() => {
    let active = true
    api('/admin/business/overall')
      .then((data) => {
        if (active) setOverall(data)
      })
      .catch((err) => {
        if (active) setOverallError(err.message)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    api(`/admin/business/monthly?month=${month}&year=${year}`)
      .then((data) => {
        if (active) setMonthly({ month, year, data, error: '' })
      })
      .catch((err) => {
        if (active) setMonthly({ month, year, data: null, error: err.message })
      })
    return () => {
      active = false
    }
  }, [month, year])

  // Loading is derived: the report starts absent and is only replaced by a
  // finished response tagged with the month it belongs to.
  const loading = overall === null && overallError === ''
  const currentMonthly = monthly && monthly.month === month && monthly.year === year ? monthly : null
  const overallCategories = Object.entries(overall?.categorySales || {})
  const monthCategories = Object.entries(currentMonthly?.data?.categorySales || {})

  return (
    <div className="page-container">
      <section className="hero">
        <div className="hero-copy">
          <span className="pill-badge">⚙️ Admin Console</span>
          <h1>
            Manage kodcart,
            <br />
            <span className="hero-accent">Effortlessly.</span>
          </h1>
          <p>Track business performance and category sales across the store from one place.</p>
          <Link to="/admin/products" className="btn btn-outline">
            Manage products
          </Link>
        </div>
      </section>

      {overallError && (
        <div className="alert error" role="alert">
          {overallError}
        </div>
      )}

      {loading ? (
        <div className="empty-state">
          <h3>Loading business report…</h3>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Overall business</span>
              <strong>{formatMoney(overall?.totalBusiness)}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">
                {MONTHS[month - 1]} {year}
              </span>
              <strong>{formatMoney(currentMonthly?.data?.totalBusiness)}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Units sold</span>
              <strong>{unitsSold(overall?.categorySales)}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Categories sold</span>
              <strong>{overallCategories.length}</strong>
            </div>
          </div>

          <section className="panel">
            <div className="panel-head">
              <h2>Sales by category — all time</h2>
            </div>
            {overallCategories.length === 0 ? (
              <p className="muted panel-empty">
                No successful orders yet. Category sales appear after customers complete a payment.
              </p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Units sold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overallCategories.map(([category, units]) => (
                      <tr key={category}>
                        <td className="capitalize">{category}</td>
                        <td>{units}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-head admin-product-head">
              <h2>Monthly report</h2>
              <div className="admin-filters">
                <select
                  className="search-input"
                  value={month}
                  onChange={(event) => setMonth(Number(event.target.value))}
                  aria-label="Month"
                >
                  {MONTHS.map((name, index) => (
                    <option key={name} value={index + 1}>
                      {name}
                    </option>
                  ))}
                </select>
                <input
                  className="search-input"
                  type="number"
                  min="2000"
                  max="2100"
                  value={year}
                  onChange={(event) => setYear(Number(event.target.value))}
                  aria-label="Year"
                />
              </div>
            </div>

            {!currentMonthly ? (
              <p className="muted panel-empty">Loading monthly report…</p>
            ) : currentMonthly.error ? (
              <p className="muted panel-empty">{currentMonthly.error}</p>
            ) : monthCategories.length === 0 ? (
              <p className="muted panel-empty">
                No successful orders in {MONTHS[month - 1]} {year}.
              </p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Units sold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthCategories.map(([category, units]) => (
                      <tr key={category}>
                        <td className="capitalize">{category}</td>
                        <td>{units}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
