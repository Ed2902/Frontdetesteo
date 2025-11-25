// src/App.jsx
import React from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login/Login'
import Home from './pages/Home/Home'
import PrivateRoute from './components/PrivateRoute'
import NoEncontrado from './pages/NoEncontrado'
import Tickets from './pages/Tickets/TicketsPage.jsx'
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

// Este componente está dentro del mismo archivo y permite manejar el "from" hacia la 404
function AppRoutes() {
  const location = useLocation()

  return (
    <Routes>
      {/* Ruta pública */}
      <Route path='/login' element={<Login />} />

      {/* Ruta privada general */}
      <Route path='/home' element={<PrivateRoute element={<Home />} />} />

      <Route
        path='/tickets'
        element={<PrivateRoute permiso='tickets' element={<Tickets />} />}
      />

      {/* Redirección inicial */}
      <Route path='/' element={<Navigate to='/login' />} />

      {/* Página 404 */}
      <Route path='/404' element={<NoEncontrado />} />

      {/* Catch-all con "from" */}
      <Route
        path='*'
        element={<Navigate to='/404' state={{ from: location.pathname }} />}
      />
    </Routes>
  )
}

export default App
