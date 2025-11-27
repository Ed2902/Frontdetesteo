export const API_URL = import.meta.env.VITE_API_URL4 || 'http://localhost:4000'
export const USERS_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005/api'
export const ORG_ID = import.meta.env.VITE_ORG_ID || 'greenway'
export const TICKETS_BASE = `${API_URL}/tikets/tickets`
// --------- Helpers de headers ---------
const getBaseAuthHeaders = (user) => {
  const headers = {
    'Content-Type': 'application/json',
  }
 const token =
    user?.token ||
    user?.accessToken ||
    user?.jwt ||
    localStorage.getItem('token') ||
    null

  if (token) {
    headers.Authorization = `Bearer ${token}`
    console.log('🔐 Usando token para Authorization:', token.slice(0, 20) + '...')
  } else {
    console.warn('⚠️ No se encontró token para Authorization')
  }

  return headers
}

// Headers para API de tickets (4000) => incluye org y principal
export const getTicketsHeaders = (user) => {
  const headers = getBaseAuthHeaders(user)

  if (!ORG_ID) {
    console.warn('⚠️ ORG_ID está vacío, revisa tu .env (VITE_ORG_ID)')
  } else {
    headers['x-org-id'] = ORG_ID
    console.log('🏢 Enviando x-org-id:', ORG_ID)
  }

  const principalId = user?.id_usuario || user?._id || user?.id || null

  if (principalId) {
    headers['x-principal-id'] = String(principalId)
    console.log('👤 Enviando x-principal-id:', principalId)
  } else {
    console.warn('⚠️ No se encontró principalId en el usuario')
  }

  return headers
}

// Headers para API de usuarios (3005) => solo auth
export const getUsersHeaders = (user) => {
  return getBaseAuthHeaders(user)
}

// --------- Llamadas a APIs ---------

// Carga categorías, prioridades, estados (Mongo) + usuarios (MySQL)
export const fetchTicketMetaAndUsers = async (user) => {
  console.log('🌐 Cargando meta de tickets desde', TICKETS_BASE)
  console.log('🌐 USERS_API_URL =>', USERS_API_URL)

  const ticketsHeaders = getTicketsHeaders(user)
  const usersHeaders = getUsersHeaders(user)

  const [catRes, priRes, staRes] = await Promise.all([
    fetch(`${TICKETS_BASE}/categories`, { headers: ticketsHeaders }),
    fetch(`${TICKETS_BASE}/priorities`, { headers: ticketsHeaders }),
    fetch(`${TICKETS_BASE}/statuses`, { headers: ticketsHeaders }),
  ])

  const usersRes = await fetch(`${USERS_API_URL}/usuario`, {
    headers: usersHeaders,
  })

  console.log('🔎 status =>', {
    categories: catRes.status,
    priorities: priRes.status,
    statuses: staRes.status,
    users: usersRes.status,
  })

  const backendErrors = {}
  if (!catRes.ok) backendErrors.categories = await catRes.text()
  if (!priRes.ok) backendErrors.priorities = await priRes.text()
  if (!staRes.ok) backendErrors.statuses = await staRes.text()
  if (!usersRes.ok) backendErrors.users = await usersRes.text()

  if (!catRes.ok || !priRes.ok || !staRes.ok || !usersRes.ok) {
    console.error('❌ Errores backend:', backendErrors)
    throw new Error('Error al cargar datos del servidor')
  }

  const [catData, priData, staData, usersData] = await Promise.all([
    catRes.json(),
    priRes.json(),
    staRes.json(),
    usersRes.json(),
  ])

  return {
    categories: catData.data || catData || [],
    priorities: priData.data || priData || [],
    statuses: staData.data || staData || [],
    assignees: usersData.data || usersData || [],
  }
}

// Crear ticket completo
export const createTicketFull = async (user, form) => {
  const reporterId = user?.id_usuario || user?._id || user?.id
  const principalId = reporterId

  if (!reporterId) {
    throw new Error('No se pudo identificar el usuario actual (reporterId).')
  }

  const body = {
    title: form.title,
    description: form.description,
    categoryId: form.categoryId,
    priorityId: form.priorityId,
    statusId: form.statusId,
    reporterId,
    assigneeType: form.assigneeType,
    assigneeId: form.assigneeId || null,
    principalId,
  }

  console.log('📤 Enviando ticket:', body)

  const res = await fetch(`${TICKETS_BASE}/full`, {
    method: 'POST',
    headers: getTicketsHeaders(user),
    body: JSON.stringify(body),
  })

  const json = await res.json().catch(() => ({}))

  console.log('📥 Respuesta creación ticket:', res.status, json)

  if (!res.ok || json.ok === false) {
    throw new Error(json.message || 'Error al crear el ticket')
  }

  return json
}
