// src/components/Tickets/Soporte/TicketsSoporte.jsx
import { useEffect, useState, useContext } from 'react'
import AuthContext from '../../../../context/AuthContext.jsx'

import {
  ORG_ID,
  TICKETS_BASE,
  fetchTicketMetaAndUsers,
  createTicketFull,
} from '../../../Tickets/Usuario/CrearTicket/Service.js'

const TicketsSoporte = () => {
  const { user } = useContext(AuthContext) || {}

  const [categories, setCategories] = useState([])
  const [priorities, setPriorities] = useState([])
  const [statuses, setStatuses] = useState([])
  const [assignees, setAssignees] = useState([])

  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    priorityId: '',
    statusId: '',
    assigneeType: 'person',
    assigneeId: '',
  })

  const [loadingData, setLoadingData] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  console.log('🔧 TICKETS_BASE =>', TICKETS_BASE)
  console.log('🏢 ORG_ID =>', ORG_ID)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  useEffect(() => {
    if (!user) {
      console.warn('⚠️ No hay usuario en contexto, no se cargan datos aún.')
      setLoadingData(false)
      return
    }

    const run = async () => {
      try {
        setLoadingData(true)
        setError('')

        const { categories, priorities, statuses, assignees } =
          await fetchTicketMetaAndUsers(user)

        setCategories(categories)
        setPriorities(priorities)
        setStatuses(statuses)
        setAssignees(assignees)
      } catch (err) {
        console.error('🛑 Error en fetchData tickets soporte:', err)
        setError('No se pudieron cargar los datos para crear el ticket.')
      } finally {
        setLoadingData(false)
      }
    }

    run()
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    try {
      setSubmitting(true)

      await createTicketFull(user, form)

      setSuccessMsg('✅ Ticket creado correctamente.')
      setForm({
        title: '',
        description: '',
        categoryId: '',
        priorityId: '',
        statusId: '',
        assigneeType: 'person',
        assigneeId: '',
      })
    } catch (err) {
      console.error('🛑 Error en handleSubmit tickets soporte:', err)
      setError(err.message || 'Ocurrió un error al crear el ticket.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='tickets-soporte'>
      <h1>FrontCrear Tarea</h1>

      {loadingData ? (
        <p>Cargando datos...</p>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {successMsg && <p style={{ color: 'green' }}>{successMsg}</p>}

          <div>
            <label>
              Título
              <input
                type='text'
                name='title'
                value={form.title}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <div>
            <label>
              Descripción
              <textarea
                name='description'
                value={form.description}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <div>
            <label>
              Categoría
              <select
                name='categoryId'
                value={form.categoryId}
                onChange={handleChange}
                required
              >
                <option value=''>Selecciona una categoría</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name || cat.nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <label>
              Prioridad
              <select
                name='priorityId'
                value={form.priorityId}
                onChange={handleChange}
                required
              >
                <option value=''>Selecciona una prioridad</option>
                {priorities.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name || p.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <label>
              Estado
              <select
                name='statusId'
                value={form.statusId}
                onChange={handleChange}
                required
              >
                <option value=''>Selecciona un estado</option>
                {statuses.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name || s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <label>
              Asignar a
              <select
                name='assigneeId'
                value={form.assigneeId}
                onChange={handleChange}
              >
                <option value=''>Sin asignar (queda para el creador)</option>
                {assignees.map((u) => (
                  <option key={u.id_usuario} value={u.id_usuario}>
                    {u.username || u.nombre || u.email}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button type='submit' disabled={submitting}>
            {submitting ? 'Creando...' : 'Crear Ticket'}
          </button>
        </form>
      )}
    </div>
  )
}

export default TicketsSoporte
