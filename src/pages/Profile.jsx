import { useAuth } from '../hooks/useAuth'

// The backend exposes no profile-update endpoint (and no phone field), so the
// account details are shown read-only.
export default function Profile() {
  const { user } = useAuth()

  return (
    <div className="page-container narrow">
      <section className="panel profile-panel">
        <div className="profile-head">
          <span className="profile-avatar" aria-hidden="true">
            {user?.name?.charAt(0)?.toUpperCase()}
          </span>
          <div>
            <h1>{user?.name}</h1>
            <p className="muted">
              {user?.role === 'ADMIN' ? 'Administrator account' : 'Customer account'}
            </p>
          </div>
        </div>

        <form className="profile-form" onSubmit={(event) => event.preventDefault()}>
          <label className="field">
            <span>Username</span>
            <input type="text" value={user?.username || ''} readOnly />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={user?.email || ''}
              placeholder="Not available for this session"
              readOnly
            />
          </label>
          <label className="field">
            <span>Role</span>
            <input type="text" value={user?.role === 'ADMIN' ? 'Administrator' : 'Customer'} readOnly />
          </label>
        </form>
      </section>
    </div>
  )
}
