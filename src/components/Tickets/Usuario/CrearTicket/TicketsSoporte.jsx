import { useEffect, useState, useContext } from 'react'
import AuthContext from '../../../../context/AuthContext.jsx'

import {
  ORG_ID,
  TICKETS_BASE,
  fetchTicketMetaAndUsers,
  createTicketFull,
} from '../../../Tickets/Usuario/CrearTicket/Service.js'

import './CreTick.css'

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
    assigneeType: 'person', // 'person' | 'group'
    assigneeId: '',
    assigneeGroup: [], // 👈 array de ids de usuarios
  })

  const [loadingData, setLoadingData] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  console.log('🔧 TICKETS_BASE =>', TICKETS_BASE)
  console.log('🏢 ORG_ID =>', ORG_ID)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // 👉 Agregar usuario seleccionado al grupo
  const handleAddToGroup = () => {
    if (!form.assigneeId) return

    setForm((prev) => {
      const id = String(prev.assigneeId)
      if (prev.assigneeGroup.includes(id)) {
        return prev // ya está en el grupo
      }
      return {
        ...prev,
        assigneeGroup: [...prev.assigneeGroup, id],
      }
    })
  }

  // 👉 Quitar usuario del grupo
  const handleRemoveFromGroup = (idToRemove) => {
    setForm((prev) => ({
      ...prev,
      assigneeGroup: prev.assigneeGroup.filter(
        (id) => String(id) !== String(idToRemove)
      ),
    }))
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
        assigneeGroup: [], // reset grupo
      })
    } catch (err) {
      console.error('🛑 Error en handleSubmit tickets soporte:', err)
      setError(err.message || 'Ocurrió un error al crear el ticket.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="tickets-soporte">
      <div className="tickets-soporte__container">
        <header className="tickets-soporte__header">
          <div className="tickets-soporte__title-wrapper">
            <h1 className="tickets-soporte__title">Crear nueva tarea</h1>
            <p className="tickets-soporte__subtitle">
              Registra un ticket para soporte y asígnalo a la persona o grupo
              correspondiente.
            </p>
          </div>

          <div className="tickets-soporte__badge">
            <span>ORG:</span> <strong>{ORG_ID}</strong>
          </div>
        </header>

        {loadingData ? (
          <p className="tickets-soporte__status">Cargando datos...</p>
        ) : (
          <form onSubmit={handleSubmit} className="tickets-soporte__form">
            {error && (
              <div className="tickets-soporte__alert tickets-soporte__alert--error">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="tickets-soporte__alert tickets-soporte__alert--success">
                {successMsg}
              </div>
            )}

            <div className="tickets-soporte__grid">
              {/* Columna izquierda */}
              <div className="tickets-soporte__col">
                <div className="tickets-soporte__field">
                  <label
                    htmlFor="ts-title"
                    className="tickets-soporte__label"
                  >
                    Título
                  </label>
                  <input
                    id="ts-title"
                    type="text"
                    name="title"
                    className="tickets-soporte__input"
                    value={form.title}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Problema con impresora de la recepción"
                  />
                </div>

                <div className="tickets-soporte__field">
                  <label
                    htmlFor="ts-description"
                    className="tickets-soporte__label"
                  >
                    Descripción
                  </label>
                  <textarea
                    id="ts-description"
                    name="description"
                    className="tickets-soporte__textarea"
                    value={form.description}
                    onChange={handleChange}
                    required
                    placeholder="Describe el problema, área afectada y cualquier detalle importante..."
                  />
                </div>
              </div>

              {/* Columna derecha */}
              <div className="tickets-soporte__col">
                <div className="tickets-soporte__field">
                  <label
                    htmlFor="ts-category"
                    className="tickets-soporte__label"
                  >
                    Categoría
                  </label>
                  <select
                    id="ts-category"
                    name="categoryId"
                    className="tickets-soporte__select"
                    value={form.categoryId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecciona una categoría</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name || cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="tickets-soporte__field-group">
                  <div className="tickets-soporte__field">
                    <label
                      htmlFor="ts-priority"
                      className="tickets-soporte__label"
                    >
                      Prioridad
                    </label>
                    <select
                      id="ts-priority"
                      name="priorityId"
                      className="tickets-soporte__select"
                      value={form.priorityId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selecciona una prioridad</option>
                      {priorities.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name || p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="tickets-soporte__field">
                    <label
                      htmlFor="ts-status"
                      className="tickets-soporte__label"
                    >
                      Estado
                    </label>
                    <select
                      id="ts-status"
                      name="statusId"
                      className="tickets-soporte__select"
                      value={form.statusId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selecciona un estado</option>
                      {statuses.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name || s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tipo de asignación */}
                <div className="tickets-soporte__field">
                  <span className="tickets-soporte__label">
                    Tipo de asignación
                  </span>
                  <div className="tickets-soporte__radio-group">
                    <label className="tickets-soporte__radio">
                      <input
                        type="radio"
                        name="assigneeType"
                        value="person"
                        checked={form.assigneeType === 'person'}
                        onChange={handleChange}
                      />
                      <span>Persona</span>
                    </label>
                    <label className="tickets-soporte__radio">
                      <input
                        type="radio"
                        name="assigneeType"
                        value="group"
                        checked={form.assigneeType === 'group'}
                        onChange={handleChange}
                      />
                      <span>Grupo</span>
                    </label>
                  </div>
                </div>

                {/* Asignar / Grupo */}
                <div className="tickets-soporte__field">
                  <label
                    htmlFor="ts-assignee"
                    className="tickets-soporte__label"
                  >
                    {form.assigneeType === 'person'
                      ? 'Asignar a'
                      : 'Agregar integrante al grupo'}
                  </label>

                  <div className="tickets-soporte__assignee-row">
                    <select
                      id="ts-assignee"
                      name="assigneeId"
                      className="tickets-soporte__select"
                      value={form.assigneeId}
                      onChange={handleChange}
                    >
                      <option value="">
                        {form.assigneeType === 'person'
                          ? 'Sin asignar (queda para el creador)'
                          : 'Selecciona un usuario para agregar'}
                      </option>
                      {assignees.map((u) => (
                        <option key={u.id_usuario} value={u.id_usuario}>
                          {u.username || u.nombre || u.email}
                        </option>
                      ))}
                    </select>

                    {form.assigneeType === 'group' && (
                      <button
                        type="button"
                        className="tickets-soporte__btn-secondary"
                        onClick={handleAddToGroup}
                      >
                        Agregar
                      </button>
                    )}
                  </div>

                  {form.assigneeType === 'person' && (
                    <p className="tickets-soporte__help">
                      Puedes dejarlo vacío para que el ticket quede a nombre del
                      usuario que lo crea.
                    </p>
                  )}

                  {form.assigneeType === 'group' && (
                    <>
                      <p className="tickets-soporte__help">
                        El ticket se asignará a todos los integrantes del grupo.
                      </p>
                      {form.assigneeGroup.length > 0 && (
                        <ul className="tickets-soporte__group-list">
                          {form.assigneeGroup.map((id) => {
                            const u = assignees.find(
                              (usr) =>
                                String(usr.id_usuario) === String(id)
                            )
                            const label =
                              u?.username || u?.nombre || u?.email || id
                            return (
                              <li
                                key={id}
                                className="tickets-soporte__group-item"
                              >
                                <span>{label}</span>
                                <button
                                  type="button"
                                  className="tickets-soporte__group-remove"
                                  onClick={() => handleRemoveFromGroup(id)}
                                >
                                  Quitar
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="tickets-soporte__actions">
              <button
                type="submit"
                className="tickets-soporte__submit"
                disabled={submitting}
              >
                {submitting ? 'Creando...' : 'Crear Ticket'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default TicketsSoporte
