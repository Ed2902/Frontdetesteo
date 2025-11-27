import './Menutickets.css'
import { useContext } from 'react'
import AuthContext from '../../../context/AuthContext'
import { usePermisos } from '../../../hooks/usePermisos'

const MenuTickets = ({ selectedSection, onSelectSection }) => {
  useContext(AuthContext)
  const { tienePermiso } = usePermisos()
console.log('🔎 permiso mistareas =>', tienePermiso('mistareas'))
  const botones = [
    { label: 'Mis Tareas', key: 'usuarios', permiso: 'crearTicket' },
    { label: 'Crear Tarea', key: 'soporte', permiso: 'soporteTicket' },
    { label: 'Mis Tareas', key: 'mistareas', permiso: 'MisTareas' },

  ]

  return (
    <div className='menu-tickets'>
      {botones
        .filter(btn => tienePermiso(btn.permiso))
        .map(btn => (
          <button
            key={btn.key}
            className={`menu-button ${
              selectedSection === btn.key ? 'active' : ''
            }`}
            onClick={() => onSelectSection(btn.key)}
          >
            {btn.label}
          </button>
        ))}
    </div>
  )
}

export default MenuTickets
