// src/components/Tickets/TicketsChat/TicketsChat.js

// 🔗 Config básica
const API_URL = import.meta.env.VITE_API_URL4 || "http://localhost:4000";
const ORG_ID = import.meta.env.VITE_ORG_ID || "greenway";

const MESSAGES_BASE   = `${API_URL}/tikets/messages`;
const TICKETS_BASE    = `${API_URL}/tikets/tickets`;
const CATEGORIES_BASE = `${API_URL}/tikets/tickets/categories`;
const PRIORITIES_BASE = `${API_URL}/tikets/tickets/priorities`;
const STATUSES_BASE   = `${API_URL}/tikets/tickets/statuses`;

// --------- Headers básicos ---------
function buildHeaders(authTokens) {
  const headers = {
    "Content-Type": "application/json",
  };

  const token =
    authTokens?.access ||
    authTokens?.token ||
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    null;

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

/* ============================================================
   📥 Obtener mensajes de un ticket
   ============================================================ */
export async function fetchTicketMessages({
  ticketId,
  authTokens,
  principalId, // no se usa hoy, pero lo dejamos
}) {
  if (!ticketId) throw new Error("ticketId requerido");

  const url = `${MESSAGES_BASE}/by-ticket/${ticketId}?orgId=${encodeURIComponent(
    ORG_ID
  )}`;

  console.log("🌐 [TicketChat] GET mensajes =>", url);

  const res = await fetch(url, {
    method: "GET",
    headers: buildHeaders(authTokens),
  });

  const raw = await res.json().catch(() => null);
  console.log("📥 [TicketChat] Respuesta mensajes:", res.status, raw);

  if (!res.ok) {
    throw new Error(`Error cargando mensajes: ${res.status}`);
  }

  // raw = { total, page, limit, rows } o arreglo directo
  if (Array.isArray(raw?.rows)) return raw.rows;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.messages)) return raw.messages;

  return [];
}

/* ============================================================
   📤 Enviar mensaje a un ticket
   ============================================================ */
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

  console.log("📤 [TicketChat] Enviando mensaje:", body);

  const token =
    authTokens?.access ||
    authTokens?.token ||
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    "";

  const res = await fetch(MESSAGES_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => null);
  console.log("📥 [TicketChat] Respuesta envío:", res.status, json);

  if (!res.ok) {
    throw new Error(
      json?.message || json?.error || `Error enviando mensaje: ${res.status}`
    );
  }

  return json;
}

/* ============================================================
   📄 Obtener detalle de un ticket
   ============================================================ */
export async function fetchTicketDetail({ ticketId, authTokens }) {
  if (!ticketId) throw new Error("ticketId requerido");

  const url = `${TICKETS_BASE}/${ticketId}?orgId=${encodeURIComponent(
    ORG_ID
  )}`;

  console.log("🌐 [TicketChat] GET ticket detail =>", url);

  const res = await fetch(url, {
    method: "GET",
    headers: buildHeaders(authTokens),
  });

  const json = await res.json().catch(() => null);
  console.log("📥 [TicketChat] Respuesta ticket detail:", res.status, json);

  if (!res.ok) {
    throw new Error(
      json?.message || json?.error || `Error cargando ticket: ${res.status}`
    );
  }

  return json;
}

/* ============================================================
   🔁 Helper genérico para catálogos
   ============================================================ */
async function fetchMetaList(url, authTokens) {
  console.log("🌐 [TicketChat] GET meta =>", url);

  const res = await fetch(url, {
    method: "GET",
    headers: buildHeaders(authTokens),
    credentials: "include",
  });

  const json = await res.json().catch(() => null);
  console.log("📥 [TicketChat] Respuesta meta:", res.status, json);

  if (!res.ok) {
    throw new Error(
      json?.message || json?.error || `Error cargando meta: ${res.status}`
    );
  }

  let list = [];
  if (Array.isArray(json?.rows)) list = json.rows;
  else if (Array.isArray(json)) list = json;
  else if (Array.isArray(json?.data)) list = json.data;
  else if (Array.isArray(json?.categories)) list = json.categories;

  return list;
}

/* ============================================================
   📚 Categorías, prioridades, estados
   ============================================================ */
export async function fetchTicketCategories({ authTokens }) {
  const url = `${CATEGORIES_BASE}?orgId=${encodeURIComponent(ORG_ID)}`;
  return fetchMetaList(url, authTokens);
}


export async function fetchTicketPriorities({ authTokens }) {
  const url = `${PRIORITIES_BASE}?orgId=${encodeURIComponent(ORG_ID)}`;
  return fetchMetaList(url, authTokens);
}

export async function fetchTicketStatuses({ authTokens }) {
  const url = `${STATUSES_BASE}?orgId=${encodeURIComponent(ORG_ID)}`;
  return fetchMetaList(url, authTokens);
}

export async function fetchTicketUsers({ authTokens }) {
  const url = `${API_URL}/tikets/tickets/users?orgId=${encodeURIComponent(ORG_ID)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: buildHeaders(authTokens),
    credentials: "include",
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      json?.message || json?.error || `Error cargando usuarios: ${res.status}`
    );
  }

  let list = [];
  if (Array.isArray(json?.rows)) list = json.rows;
  else if (Array.isArray(json)) list = json;
  else if (Array.isArray(json?.data)) list = json.data;
  else if (Array.isArray(json?.users)) list = json.users;
  else if (Array.isArray(json?.personal)) list = json.personal;

  return list;
}
