function buildHeaders(accessToken, principalId) {
  const h = { "Content-Type": "application/json" };
  if (accessToken) h.Authorization = `Bearer ${accessToken}`;
  if (principalId) h["x-principal-id"] = principalId;
  return h;
}


async function handleJson(res) {
  const txt = await res.text();
  let data = null;
  try { data = txt ? JSON.parse(txt) : null; } catch { data = null; }

  if (!res.ok) {
    const msg = data?.message || data?.error || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/**
 * Espera un response tipo:
 * { ok: true, rows: [...] }
 * o directamente [...]
 */
export async function fetchMyNotifications({
  apiBaseUrl,
  orgId,
  accessToken,
  principalId,
  limit = 30,
  unreadOnly = false,
}) {
  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  qs.set("unreadOnly", unreadOnly ? "1" : "0");

  // ✅ opcional: si tu validator/listSchema acepta principalId por query
  if (principalId) qs.set("principalId", String(principalId));

  const url = `${apiBaseUrl}/tikets/notifications?${qs.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...buildHeaders(accessToken, principalId), // ✅ AQUÍ estaba el error
      "x-org-id": orgId,
    },
  });

  const data = await handleJson(res);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}



export async function fetchUnreadCount({ apiBaseUrl, orgId, accessToken, principalId }) {
  const url = `${apiBaseUrl}/tikets/notifications/unread-count`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...buildHeaders(accessToken, principalId), // ✅
      "x-org-id": orgId,
    },
  });

  const data = await handleJson(res);
  return data?.count ?? data?.data?.count ?? 0;
}


/**
 * PATCH /tikets/notifications/:id/read
 */
export async function markNotificationRead({ apiBaseUrl, orgId, accessToken, principalId, id }) {
  const url = `${apiBaseUrl}/tikets/notifications/${id}/read`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      ...buildHeaders(accessToken, principalId),
      "x-org-id": orgId,
    },
  });

  return handleJson(res);
}

export async function markAllNotificationsRead({ apiBaseUrl, orgId, accessToken, principalId }) {
  const url = `${apiBaseUrl}/tikets/notifications/read-all`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      ...buildHeaders(accessToken, principalId),
      "x-org-id": orgId,
    },
  });

  return handleJson(res);
}


/**
 * Normaliza diferentes shapes:
 * - payload.title/body/url
 * - createdAt / timestamps
 */
export function normalizeNotification(n) {
  if (!n) return n;

  const payload = n.payload || {};
  const title =
    payload.title ||
    payload.titulo ||
    n.title ||
    "Notificación";

  const body =
    payload.body ||
    payload.message ||
    payload.mensaje ||
    n.body ||
    "";

  const url =
    payload.url ||
    payload.link ||
    payload.path ||
    "";

  const createdAt = n.createdAt || n.created_at || n.timestamp || n.updatedAt || null;

  return {
    ...n,
    _id: n._id || n.id,
    title,
    body,
    url,
    createdAt,
    read: Boolean(n.read),
    type: n.type || payload.type || "",
  };
}

/**
 * Tiempo relativo tipo Facebook
 */
export function timeAgo(dateLike) {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "";

  const diffMs = Date.now() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 10) return "ahora";
  if (sec < 60) return `hace ${sec}s`;

  const min = Math.floor(sec / 60);
  if (min < 60) return `hace ${min} min`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `hace ${hr} h`;

  const day = Math.floor(hr / 24);
  if (day < 7) return `hace ${day} d`;

  const wk = Math.floor(day / 7);
  if (wk < 5) return `hace ${wk} sem`;

  const mo = Math.floor(day / 30);
  if (mo < 12) return `hace ${mo} mes`;

  const yr = Math.floor(day / 365);
  return `hace ${yr} a`;
}
export function notificationsbyid (id) {
 const notifications = JSON.parse(localStorage.getItem("notifications")) || [];
 return notifications.find(notification => notification.id === id);
}