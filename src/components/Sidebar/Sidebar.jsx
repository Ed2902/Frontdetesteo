// src/components/Sidebar/Sidebar.jsx
import { useState, useEffect, useContext } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Campanita from './Campanita/Campanita.jsx'
import {
  BiChevronLeft,
  BiChevronRight,
  BiLogOut,
  BiMenu,
  BiGitMerge,
} from 'react-icons/bi'
import AuthContext from '../../context/AuthContext'
import { usePermisos } from '../../hooks/usePermisos'
import './Sidebar.css'

const Sidebar = ({ onToggleCollapse }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const { logout, user } = useContext(AuthContext)
  const { tienePermiso } = usePermisos()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
      if (window.innerWidth > 768) {
        setIsMobileOpen(false)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(!isMobileOpen)
    } else {
      const newCollapsed = !isCollapsed
      setIsCollapsed(newCollapsed)
      if (onToggleCollapse) onToggleCollapse(newCollapsed)
    }
  }

  const handleLinkClick = () => {
    if (isMobile) setIsMobileOpen(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const nombreUsuario = user?.personal?.nombre || ''
  const apellidoUsuario = user?.personal?.apellido || ''

  return (
    <div className='sidebar-container'>
      {isMobile && (
        <div className='mobile-menu-button' onClick={toggleSidebar}>
          <BiMenu size={30} />
        </div>
      )}

      <nav
        className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${
          isMobileOpen ? 'open' : ''
        }`}
      >
      <div className="sidebar-top">
  <div className="sidebar-top-row">
    <div className="logo-wrapper">
      <img src="/Genika.webp" alt="Logo Empresa" className="logo-image" />
      <p
        className={`sidebar-subtitle ${
          isCollapsed && !isMobileOpen ? "hide-text" : ""
        }`}
      >
        <span className="by-text">By:</span>{" "}
        <span className="fastway-text">Fastwaysas</span>
      </p>
    </div>

    {/* 🔔 Campanita (siempre visible, incluso colapsado) */}
    <div className="sidebar-notifications">
      <Campanita />
    </div>
  </div>
</div>


        <div className='sidebar-links'>
          <h6>Menú</h6>
          <ul>
            {/* ✔ Solo Tickets */}
            {tienePermiso('tickets') && (
              <li className={location.pathname === '/tickets' ? 'active' : ''}>
                <Link to='/tickets' onClick={handleLinkClick}>
                  <BiGitMerge size={20} />
                  <span
                    className={`${
                      isCollapsed && !isMobileOpen ? 'hide-text' : ''
                    }`}
                  >
                    Tickets Soporte Técnico
                  </span>
                </Link>
              </li>
            )}
          </ul>
        </div>
        <div className='sidebar-bottom'>
          <div className='profile-logout'>
            <a href='#' className='logout' onClick={handleLogout}>
              <BiLogOut size={24} />
            </a>
          </div>

          {!isCollapsed && (
            <div className='sidebar-user'>
              <p className='sidebar-user-text'>
                Hola, {nombreUsuario} {apellidoUsuario}
              </p>
            
            </div>
          )}
        </div>
    
      </nav>

      {!isMobile && (
        <div className='toggle-tab' onClick={toggleSidebar}>
          {isCollapsed ? (
            <BiChevronRight size={24} />
          ) : (
            <BiChevronLeft size={24} />
          )}
 
        </div>
      )}
    </div>
  )
}

export default Sidebar
