import { CATEGORIES } from '../data/products'

export default function FilterBar({ active, onChange, counts = {} }) {
  return (
    <div className="filter-bar" role="tablist" aria-label="Product categories">
      {CATEGORIES.map((category) => (
        <button
          key={category.id}
          type="button"
          role="tab"
          aria-selected={active === category.id}
          className={`filter-chip ${active === category.id ? 'active' : ''}`}
          onClick={() => onChange(category.id)}
        >
          {category.label}
          {counts[category.id] !== undefined && <span className="chip-count">{counts[category.id]}</span>}
        </button>
      ))}
    </div>
  )
}
