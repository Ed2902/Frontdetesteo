// src/components/Tickets/Usuario/CrearTicket/Service.js
import axios from 'axios'

// ================== CONFIG DESDE .ENV ==================

// Todas las rutas vienen DIRECTO del .env
const TICKETS_BASE_URL = import.meta.env.VITE_API_URL4        // http://localhost:4000
const USERS_BASE_URL = import.meta.env.VITE_API_URL           // http://localhost:3005/api

export const ORG_ID = import.meta.env.VITE_ORG_ID             // greenway

// ================== INSTANCIAS AXIOS ==================

// API de tickets (Node 4000) -> VITE_API_URL4/tikets
export const ticketsApi = axios.create({
  baseURL: `${TICKETS_BASE_URL}/tikets`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  validateStatus: (status) => status >= 200 && status < 500,
})

// API de usuarios (3005/api) -> VITE_API_URL
export const usersApi = axios.create({
  baseURL: USERS_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  validateStatus: (status) => status >= 200 && status < 500,
})

// ================== HELPERS DE HEADERS ==================

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
  } else {
    console.warn('⚠️ No se encontró token para Authorization')
  }

  return headers
}

export const getTicketsHeaders = (user) => {
  const headers = getBaseAuthHeaders(user)

  if (ORG_ID) {
    headers['x-org-id'] = ORG_ID
  }

  const principalId = user?.id_usuario || user?._id || user?.id || null

  if (principalId) {
    headers['x-principal-id'] = String(principalId)
  } else {
    console.warn('⚠️ No se encontró principalId en el usuario')
  }

  return headers
}

export const getUsersHeaders = (user) => {
  return getBaseAuthHeaders(user)
}

// ================== LLAMADAS A APIS ==================

// 👉 Carga categorías, prioridades, estados (Mongo) + usuarios (MySQL)
export const fetchTicketMetaAndUsers = async (user) => {
  console.log('🌐 Cargando meta de tickets desde Axios (ticketsApi)')
  console.log('🌐 Cargando usuarios desde Axios (usersApi)')

  const ticketsHeaders = getTicketsHeaders(user)
  const usersHeaders = getUsersHeaders(user)

  const [catRes, priRes, staRes, usersRes] = await Promise.all([
    ticketsApi.get('/tickets/categories', { headers: ticketsHeaders }),
    ticketsApi.get('/tickets/priorities', { headers: ticketsHeaders }),
    ticketsApi.get('/tickets/statuses', { headers: ticketsHeaders }),
    usersApi.get('/usuario', { headers: usersHeaders }),
  ])

  console.log('🔎 status =>', {
    categories: catRes.status,
    priorities: priRes.status,
    statuses: staRes.status,
    users: usersRes.status,
  })

  const backendErrors = {}
  if (catRes.status >= 400)
    backendErrors.categories = catRes.data || catRes.statusText
  if (priRes.status >= 400)
    backendErrors.priorities = priRes.data || priRes.statusText
  if (staRes.status >= 400)
    backendErrors.statuses = staRes.data || staRes.statusText
  if (usersRes.status >= 400)
    backendErrors.users = usersRes.data || usersRes.statusText

  if (
    catRes.status >= 400 ||
    priRes.status >= 400 ||
    staRes.status >= 400 ||
    usersRes.status >= 400
  ) {
    console.error('❌ Errores backend:', backendErrors)
    throw new Error('Error al cargar datos del servidor')
  }

  const catData = catRes.data
  const priData = priRes.data
  const staData = staRes.data
  const usersData = usersRes.data

  return {
    categories: catData?.data || catData || [],
    priorities: priData?.data || priData || [],
    statuses: staData?.data || staData || [],
    assignees: usersData?.data || usersData || [],
  }
}

// 👉 Crear ticket completo
export const createTicketFull = async (user, form) => {
  const reporterId = user?.id_usuario || user?._id || user?.id
  const principalId = reporterId

  if (!reporterId) {
    throw new Error('No se pudo identificar el usuario actual (reporterId).')
  }

  const assigneeType = form.assigneeType === 'group' ? 'group' : 'person'

  let assigneeId = null
  let assigneeGroup = []

  if (assigneeType === 'person') {
    assigneeId = form.assigneeId || null
  } else {
    assigneeGroup = Array.isArray(form.assigneeGroup)
      ? form.assigneeGroup.filter(Boolean).map((id) => String(id))
      : []
  }

  const body = {
    title: form.title,
    description: form.description,
    categoryId: form.categoryId,
    priorityId: form.priorityId,
    statusId: form.statusId,
    reporterId,
    principalId,
    firstMessageBody: form.description,
    assigneeType,
  }

  if (assigneeType === 'person') {
    body.assigneeId = assigneeId
  } else {
    body.assigneeGroup = assigneeGroup
  }

  console.log('📤 Enviando ticket (Axios):', body)

  const res = await ticketsApi.post('/tickets/full', body, {
    headers: getTicketsHeaders(user),
  })

  const json = res.data || {}

  console.log('📥 Respuesta creación ticket:', res.status, json)

  if (res.status >= 400 || json.ok === false) {
    throw new Error(json.message || 'Error al crear el ticket')
  }

  return json
}
