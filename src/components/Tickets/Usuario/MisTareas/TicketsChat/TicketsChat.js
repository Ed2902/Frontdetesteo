// src/components/Tickets/Usuario/MisTareas/TicketsChat/TicketsChat.js

// 🔗 Usamos la misma instancia de Axios que ya creaste para tickets
import {
  ticketsApi,
  ORG_ID,
} from "../../CrearTicket/Service.js"; // ajusta la ruta si cambia

// ====================== HELPERS ======================

function resolveToken(authTokens) {
  return (
    authTokens?.access ||
    authTokens?.token ||
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    null
  );
}

// Headers básicos basados en el token (pero sin exponer API_URL ni nada)
function buildHeaders(authTokens) {
  const headers = {
    "Content-Type": "application/json",
  };

  const token = resolveToken(authTokens);

  if (token) {
    headers.Authorization = `Bearer ${token}`;
    console.log(
      "🔐 [TicketChat] Usando token:",
      String(token).slice(0, 20) + "..."
    );
  } else {
    console.warn("⚠️ [TicketChat] No hay token en TicketChat");
  }

  return headers;
}

function normalizeList(json) {
  if (!json) return [];
  if (Array.isArray(json?.rows)) return json.rows;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.messages)) return json.messages;
  if (Array.isArray(json?.categories)) return json.categories;
  if (Array.isArray(json?.users)) return json.users;
  if (Array.isArray(json?.personal)) return json.personal;
  if (Array.isArray(json)) return json;
  return [];
}

// ============================================================
// 📥 Obtener mensajes de un ticket
//   Antes: GET `${MESSAGES_BASE}/by-ticket/${ticketId}?orgId=...`
//   Ahora: GET /tikets/messages/by-ticket/:ticketId?orgId=...
// ============================================================
export async function fetchTicketMessages({
  ticketId,
  authTokens,
  principalId, // no se usa hoy, pero lo dejamos
}) {
  if (!ticketId) throw new Error("ticketId requerido");

  const headers = buildHeaders(authTokens);

  console.log(
    "🌐 [TicketChat] GET mensajes => /tikets/messages/by-ticket/",
    ticketId
  );

  const res = await ticketsApi.get(`/messages/by-ticket/${ticketId}`, {
    headers,
    params: { orgId: ORG_ID },
    withCredentials: true,
  });

  const raw = res.data;
  console.log("📥 [TicketChat] Respuesta mensajes:", res.status, raw);

  if (res.status >= 400) {
    throw new Error(`Error cargando mensajes: ${res.status}`);
  }

  return normalizeList(raw);
}

// ============================================================
// 📤 Enviar mensaje a un ticket
//   Antes: POST `${MESSAGES_BASE}`
//   Ahora: POST /tikets/messages
// ============================================================
export async function sendTicketMessage({
  ticketId,
  authTokens,
  principalId,
  content,
  user,
}) {
  if (!ticketId) throw new Error("ticketId requerido");
  if (!content) throw new Error("content requerido");

  const senderName =
    user?.personal?.Nombre && user?.personal?.Apellido
      ? `${user.personal.Nombre} ${user.personal.Apellido}`
      : user?.username || "Usuario";

  const principalStr = String(principalId ?? "");

  const body = {
    orgId: ORG_ID,
    ticketId,
    principalId: principalStr, // también a nivel root

    sender: {
      principalId: principalStr, // requerido por el schema
      id: principalStr,
      type: "user",
      name: senderName,
    },

    message: content.trim(),
    attachments: [],
  };

  console.log("📤 [TicketChat] Enviando mensaje (Axios):", body);

  const headers = buildHeaders(authTokens);

  const res = await ticketsApi.post("/messages", body, {
    headers,
    withCredentials: true,
  });

  const json = res.data;
  console.log("📥 [TicketChat] Respuesta envío:", res.status, json);

  if (res.status >= 400 || json?.ok === false) {
    throw new Error(
      json?.message ||
        json?.error ||
        `Error enviando mensaje: ${res.status}`
    );
  }

  return json;
}

// ============================================================
// 📄 Obtener detalle de un ticket
//   Antes: GET `${TICKETS_BASE}/${ticketId}?orgId=...`
//   Ahora: GET /tikets/tickets/:ticketId?orgId=...
// ============================================================
export async function fetchTicketDetail({ ticketId, authTokens }) {
  if (!ticketId) throw new Error("ticketId requerido");

  const headers = buildHeaders(authTokens);

  console.log(
    "🌐 [TicketChat] GET ticket detail => /tikets/tickets/",
    ticketId
  );

  const res = await ticketsApi.get(`/tickets/${ticketId}`, {
    headers,
    params: { orgId: ORG_ID },
    withCredentials: true,
  });

  const json = res.data;
  console.log("📥 [TicketChat] Respuesta ticket detail:", res.status, json);

  if (res.status >= 400) {
    throw new Error(
      json?.message || json?.error || `Error cargando ticket: ${res.status}`
    );
  }

  return json;
}

// ============================================================
// 🔁 Helper genérico para catálogos (vía Axios)
//   Equivalente a tu fetchMetaList(url, authTokens)
// ============================================================
async function fetchMetaListAxios(path, authTokens) {
  const headers = buildHeaders(authTokens);

  console.log("🌐 [TicketChat] GET meta Axios =>", path);

  const res = await ticketsApi.get(path, {
    headers,
    params: { orgId: ORG_ID },
    withCredentials: true,
  });

  const json = res.data;
  console.log("📥 [TicketChat] Respuesta meta:", res.status, json);

  if (res.status >= 400) {
    throw new Error(
      json?.message || json?.error || `Error cargando meta: ${res.status}`
    );
  }

  return normalizeList(json);
}

// ============================================================
// 📚 Categorías, prioridades, estados
//   Antes: GET CATEGORIES_BASE / PRIORITIES_BASE / STATUSES_BASE
//   Ahora: GET /tikets/tickets/categories|priorities|statuses
// ============================================================
export async function fetchTicketCategories({ authTokens }) {
  return fetchMetaListAxios("/tickets/categories", authTokens);
}

export async function fetchTicketPriorities({ authTokens }) {
  return fetchMetaListAxios("/tickets/priorities", authTokens);
}

export async function fetchTicketStatuses({ authTokens }) {
  return fetchMetaListAxios("/tickets/statuses", authTokens);
}

// ============================================================
// 👥 Usuarios relacionados a tickets
//   Antes: GET `${API_URL}/tikets/tickets/users?orgId=...`
//   Ahora: GET /tikets/tickets/users
// ============================================================
export async function fetchTicketUsers({ authTokens }) {
  const headers = buildHeaders(authTokens);

  console.log("🌐 [TicketChat] GET usuarios => /tikets/tickets/users");

  const res = await ticketsApi.get("/tickets/users", {
    headers,
    params: { orgId: ORG_ID },
    withCredentials: true,
  });

  const json = res.data;
  console.log("📥 [TicketChat] Respuesta usuarios:", res.status, json);

  if (res.status >= 400) {
    throw new Error(
      json?.message || json?.error || `Error cargando usuarios: ${res.status}`
    );
  }

  return normalizeList(json);
}
