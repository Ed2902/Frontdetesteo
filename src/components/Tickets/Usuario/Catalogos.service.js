import {
  ticketsApi,
  getTicketsHeaders,
  ORG_ID,
} from "../Usuario/CrearTicket/Service.js";

// =====================================
// Helper para normalizar respuestas
// =====================================
function parseListAxios(res, label) {
  if (!res) return [];

  if (res.status >= 400) {
    console.warn(`⚠️ catálogo HTTP ${label}:`, res.status, res.data);
    return [];
  }

  const j = res.data;

  if (Array.isArray(j)) return j;
  if (Array.isArray(j.rows)) return j.rows;
  if (Array.isArray(j.data)) return j.data;
  if (Array.isArray(j.items)) return j.items;
  if (Array.isArray(j.categories)) return j.categories;
  if (Array.isArray(j.priorities)) return j.priorities;
  if (Array.isArray(j.statuses)) return j.statuses;

  return [];
}

// =====================================
// CATEGORÍAS
// =====================================

export async function fetchCategories(authTokens) {
  try {
    const headers = getTicketsHeaders(authTokens);
    const res = await ticketsApi.get("/catalog/categories", {
      headers,
    });
    return parseListAxios(res, "categories");
  } catch (err) {
    console.error("❌ Error cargando categorías:", err);
    return [];
  }
}

export async function createCategory(authTokens, payload) {
  try {
    const headers = getTicketsHeaders(authTokens);
    const body = {
      orgId: ORG_ID,
      name: payload.name?.trim(),
      description: payload.description?.trim() || "",
      color: payload.color || "#0ea5e9",
      active: payload.active ?? true,
    };

    const res = await ticketsApi.post("/catalog/categories", body, {
      headers,
    });
    return res.data;
  } catch (err) {
    console.error("❌ Error creando categoría:", err.response?.data || err);
    throw err;
  }
}

export async function updateCategory(authTokens, id, payload) {
  if (!payload) {
    console.error("❌ updateCategory llamado SIN payload");
    throw new Error("payload es requerido en updateCategory");
  }

  try {
    const headers = getTicketsHeaders(authTokens);

    const body = {
      name: payload.name?.trim(),
      description: payload.description?.trim() || "",
      color: payload.color || "#0ea5e9",
      active: payload.active ?? true,
    };

    // 👇 OJO: aquí ya NO se pone /tikets, eso ya va en baseURL
    const res = await ticketsApi.patch(
      `/catalog/categories/${id}`,
      body,
      { headers }
    );

    return res.data;
  } catch (err) {
    console.error("❌ Error actualizando categoría:", err.response?.data || err);
    throw err;
  }
}

export async function deleteCategory(authTokens, id) {
  try {
    const headers = getTicketsHeaders(authTokens);
    const res = await ticketsApi.delete(
      `/catalog/categories/${id}`,
      { headers }
    );
    return res.data;
  } catch (err) {
    console.error("❌ Error eliminando categoría:", err.response?.data || err);
    throw err;
  }
}

// =====================================
// PRIORIDADES
// =====================================

export async function fetchPriorities(authTokens) {
  try {
    const headers = getTicketsHeaders(authTokens);
    const res = await ticketsApi.get("/catalog/priorities", {
      headers,
    });
    return parseListAxios(res, "priorities");
  } catch (err) {
    console.error("❌ Error cargando prioridades:", err);
    return [];
  }
}

export async function createPriority(authTokens, payload) {
  try {
    const headers = getTicketsHeaders(authTokens);
    const weightInt = parseInt(payload.weight, 10);

    const body = {
      orgId: ORG_ID,
      name: payload.name?.trim(),
      description: payload.description?.trim() || "",
      color: payload.color || "#22c55e",
      weight: Number.isNaN(weightInt) ? 1 : Math.max(1, weightInt), // 👈 evita el 400 de validación
      active: payload.active ?? true,
    };

    const res = await ticketsApi.post("/catalog/priorities", body, {
      headers,
    });
    return res.data;
  } catch (err) {
    console.error("❌ Error creando prioridad:", err.response?.data || err);
    throw err;
  }
}

export async function updatePriority(authTokens, id, payload) {
  if (!payload) {
    console.error("❌ updatePriority llamado SIN payload");
    throw new Error("payload es requerido en updatePriority");
  }

  try {
    const headers = getTicketsHeaders(authTokens);
    const weightInt = parseInt(payload.weight, 10);

    const body = {
      name: payload.name?.trim(),
      description: payload.description?.trim() || "",
      color: payload.color || "#22c55e",
     weight: Number.isNaN(weightInt) ? 1 : Math.max(1, weightInt),
      active: payload.active ?? true,
    };

    const res = await ticketsApi.patch(
      `/catalog/priorities/${id}`,   
      body,
      { headers }
    );

    return res.data;
  } catch (err) {
    console.error(
      " Error actualizando prioridad:",
      err.response?.data || err
    );
    throw err;
  }
}


export async function deletePriority(authTokens, id) {
  try {
    const headers = getTicketsHeaders(authTokens);
    const res = await ticketsApi.delete(
      `/catalog/priorities/${id}`,
      { headers }
    );
    return res.data;
  } catch (err) {
    console.error("❌ Error eliminando prioridad:", err.response?.data || err);
    throw err;
  }
}

// =====================================
// ESTADOS
// =====================================

export async function fetchStatuses(authTokens) {
  try {
    const headers = getTicketsHeaders(authTokens);
    const res = await ticketsApi.get("/catalog/statuses", {
      headers,
    });
    return parseListAxios(res, "statuses");
  } catch (err) {
    console.error("❌ Error cargando estados:", err);
    return [];
  }
}

export async function createStatus(authTokens, payload) {
  try {
    const headers = getTicketsHeaders(authTokens);
    const orderInt = parseInt(payload.order, 10);

    const body = {
      orgId: ORG_ID,
      name: payload.name?.trim(),
      description: payload.description?.trim() || "",
      color: payload.color || "#0f172a",
      order: Number.isNaN(orderInt) ? 1 : Math.max(1, orderInt), // 👈 evita el 400 de validación
      isClosed: !!payload.isClosed,
      active: payload.active ?? true,
    };

    const res = await ticketsApi.post("/catalog/statuses", body, {
      headers,
    });
    return res.data;
  } catch (err) {
    console.error("❌ Error creando estado:", err.response?.data || err);
    throw err;
  }
}

export async function updateStatus(authTokens, id, payload) {
  if (!payload) {
    console.error("❌ updateStatus llamado SIN payload");
    throw new Error("payload es requerido en updateStatus");
  }

  try {
    const headers = getTicketsHeaders(authTokens);
    const orderInt = parseInt(payload.order, 10);

    const body = {
      name: payload.name?.trim(),
      description: payload.description?.trim() || "",
      color: payload.color || "#0f172a",
      // entero >= 1
      order: Number.isNaN(orderInt) ? 1 : Math.max(1, orderInt),
      isClosed: !!payload.isClosed,
      active: payload.active ?? true,
    };

    const res = await ticketsApi.patch(
      `/catalog/statuses/${id}`,   // 👈 ahora PATCH
      body,
      { headers }
    );

    return res.data;
  } catch (err) {
    console.error("❌ Error actualizando estado:", err.response?.data || err);
    throw err;
  }
}


export async function deleteStatus(authTokens, id) {
  try {
    const headers = getTicketsHeaders(authTokens);
    const res = await ticketsApi.delete(
      `/catalog/statuses/${id}`,
      { headers }
    );
    return res.data;
  } catch (err) {
    console.error("❌ Error eliminando estado:", err.response?.data || err);
    throw err;
  }
}
