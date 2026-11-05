import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './hooks/useAuth'
import AdminDashboard from './pages/AdminDashboard'
import AdminProducts from './pages/AdminProducts'
import Cart from './pages/Cart'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Orders from './pages/Orders'
import Profile from './pages/Profile'
import Register from './pages/Register'

function Layout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">{children}</main>
    </div>
  )
}

function Home() {
  const { user } = useAuth()
  return user.role === 'ADMIN' ? <AdminDashboard /> : <Dashboard />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Home />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <Layout>
              <AdminProducts />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cart"
        element={
          <ProtectedRoute roles={['CUSTOMER']}>
            <Layout>
              <Cart />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute roles={['CUSTOMER']}>
            <Layout>
              <Orders />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Login />} />
    </Routes>
  )
}
