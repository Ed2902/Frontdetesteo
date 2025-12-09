import $ from "jquery";
import "datatables.net-bs5";
import "datatables.net-responsive-bs5";

import {
  ticketsApi,
  usersApi,
  getTicketsHeaders,
  getUsersHeaders,
  ORG_ID,
} from "../CrearTicket/Service.js";

// Helper para normalizar respuestas de Axios
function parseListAxios(res, label) {
  if (!res || res.status >= 400) {
    console.warn(`⚠️ Catálogo HTTP ${label}:`, res?.status, res?.data);
    return [];
  }
  const j = res.data;
  return Array.isArray(j)
    ? j
    : j.rows || j.data || j.users || j.personal || [];
}

// Helper para extraer token de authTokens (string u objeto)
function getAuthToken(authTokens) {
  if (typeof authTokens === "string") return authTokens;
  if (authTokens && typeof authTokens === "object") {
    return (
      authTokens.access ||
      authTokens.token ||
      authTokens.jwt ||
      authTokens.accessToken
    );
  }
  return null;
}

// 🔹 Helper para crear mapas id -> { name, color }
function createCatalogMap(items) {
  const map = {};
  (items || []).forEach((item) => {
    const key = String(item._id || item.id);
    map[key] = {
      name:
        item.name ||
        item.Nombre ||
        item.nombre ||
        item.label || // por si acaso
        key,
      color: item.color || item.hexColor || null,
      
    };
  });
  return map;
}

// 🔹 Helper para renderizar badge con color
function renderColoredBadge(map, id) {
  if (!id) return "";
  const key = String(id);
  const item = map[key];
  if (!item) return "";

  const name = item.name || key;
  const color = item.color || "#6b7280"; // gris por defecto si no hay color

  return `
    <span
      class="badge rounded-pill mis-tareas__badge"
      style="
        background-color: ${color};
        color: #ffffff;
        padding: 4px 10px;
        font-size: 0.75rem;
        border: 1px solid ${color};
      "
    >
      ${name}
    </span>
  `;
}

// Helper para render de "Asignado a" en DataTable
function renderAssignee(row, userMap) {
  const assignee = row.assignee || {};
  const type = assignee.type || "person";

  if (type === "group") {
    const members = Array.isArray(assignee.members) ? assignee.members : [];
    const names = members
      .map((m) => {
        const mid = m?.id ? String(m.id) : null;
        return mid ? userMap[mid] || `Usuario ${mid}` : "";
      })
      .filter(Boolean);
    return names.join("<br>");
  }

  const id = assignee.id;
  if (!id) return "";
  const key = String(id);
  return userMap[key] || `Usuario ${key}`;
}

// Helper para render de "Reportado por" en DataTable
function renderReporter(row, userMap) {
  const id = row.reporter?.id;
  if (!id) return "";
  const key = String(id);
  return userMap[key] || `Usuario ${key}`;
}

/**
 * Carga catálogos, usuarios, tickets y monta/actualiza el DataTable.
 */
export async function loadMisTareas({
  user,
  authTokens,
  tableRef,
  dataTableRef,
  onOpenChat,
}) {
  if (!user) {
    console.warn("⚠️ loadMisTareas llamado sin user");
    return;
  }

  try {
    // Headers con token
    const token = getAuthToken(authTokens);
    const ticketsHeaders = { ...getTicketsHeaders(user) };
    const usersHeaders = { ...getUsersHeaders(user) };
    if (token) {
      ticketsHeaders.Authorization = `Bearer ${token}`;
      usersHeaders.Authorization = `Bearer ${token}`;
    }

    // ⬇️ Nuevas rutas de catálogos
    const [catRes, priRes, staRes, usersRes] = await Promise.all([
      ticketsApi.get("/catalog/categories", {
        headers: ticketsHeaders,
        params: { orgId: ORG_ID },
      }),
      ticketsApi.get("/catalog/priorities", {
        headers: ticketsHeaders,
        params: { orgId: ORG_ID },
      }),
      ticketsApi.get("/catalog/statuses", {
        headers: ticketsHeaders,
        params: { orgId: ORG_ID },
      }),
      usersApi.get("/personal", { headers: usersHeaders }),
    ]);

    const [categories, priorities, statuses, users] = [
      parseListAxios(catRes, "categories"),
      parseListAxios(priRes, "priorities"),
      parseListAxios(staRes, "statuses"),
      parseListAxios(usersRes, "users"),
    ];

    // Mapas id -> { name, color }
    const categoryMap = createCatalogMap(categories);
    const priorityMap = createCatalogMap(priorities);
    const statusMap = createCatalogMap(statuses);

    // Mapa de usuarios
    const userMap = {};
    (users || []).forEach((u) => {
      const idUsuario =
        u.id_usuario ??
        u.Id_usuario ??
        u.ID_usuario ??
        u.idUsuario ??
        u.IdUsuario ??
        u.IDUsuario ??
        u.id ??
        u.Id ??
        u.ID ??
        u.personal?.id_usuario;
      if (!idUsuario) {
        console.warn("⚠️ Usuario sin id_usuario:", u);
        return;
      }
      const key = String(idUsuario);
      const nombre =
        u.personal?.nombre ??
        u.personal?.Nombre ??
        u.Nombre ??
        u.nombre ??
        u.NOMBRE ??
        u.name ??
        u.username ??
        "";
      const apellido =
        u.personal?.apellido ??
        u.personal?.Apellido ??
        u.Apellido ??
        u.apellido ??
        u.APELLIDO ??
        u.lastName ??
        "";
      userMap[key] = `${nombre} ${apellido}`.trim() || `Usuario ${key}`;
    });

    // Cargar tickets
    const ticketsRes = await ticketsApi.get("/tickets", {
      headers: ticketsHeaders,
      params: { orgId: ORG_ID },
    });
    if (ticketsRes.status >= 400) {
      console.error(
        "Error HTTP en /tickets:",
        ticketsRes.status,
        ticketsRes.data
      );
      return;
    }
    const allTickets = Array.isArray(ticketsRes.data?.rows)
      ? ticketsRes.data.rows
      : [];

    // Filtrar tickets del usuario (asignado, reportado o miembro de grupo)
    const myId = String(user.id_usuario);
    const filteredTickets = allTickets.filter((t) => {
      const assigneeId = t.assignee?.id ? String(t.assignee.id) : null;
      const reporterId = t.reporter?.id ? String(t.reporter.id) : null;
      const soyAsignado = assigneeId === myId;
      const soyReportero = reporterId === myId;
      const soyMiembroGrupo =
        Array.isArray(t.assignee?.members) &&
        t.assignee.members.some((m) => String(m?.id) === myId);
      return soyAsignado || soyReportero || soyMiembroGrupo;
    });

    // Deduplicar por _id/id
    const seen = new Set();
    const tickets = filteredTickets.filter((t) => {
      const key = String(t._id || t.id || "");
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(
      `📊 MisTareas => total: ${allTickets.length}, míos (dedupe): ${tickets.length}`
    );

    // DataTable
    if (!tableRef.current) {
      console.warn("⚠️ tableRef.current es null");
      return;
    }
    if ($.fn.DataTable.isDataTable(tableRef.current) && !dataTableRef.current) {
      $(tableRef.current).DataTable().clear().destroy(true);
    }

    if (dataTableRef.current) {
      dataTableRef.current.clear().rows.add(tickets).draw();
    } else {
      dataTableRef.current = $(tableRef.current).DataTable({
        data: tickets,
        responsive: true,
        columns: [
          {
            data: "code",
            render: (code, type, row) =>
              code
                ? `<code>${code}</code>`
                : `<code>${String(row?._id || "").slice(-6)}</code>`,
          },
          { data: "title", defaultContent: "" },

          // 🔹 CATEGORÍA: badge con color del catálogo
          {
            data: "categoryId",
            render: (id) => renderColoredBadge(categoryMap, id),
            defaultContent: "",
          },

          // 🔹 PRIORIDAD: badge con color del catálogo
          {
            data: "priorityId",
            render: (id) => renderColoredBadge(priorityMap, id),
            defaultContent: "",
          },

          // 🔹 ESTADO: badge con color del catálogo
          {
            data: "statusId",
            render: (id) => renderColoredBadge(statusMap, id),
            defaultContent: "",
          },

          {
            data: null,
            render: (row) => renderReporter(row, userMap),
            defaultContent: "",
          },
          {
            data: null,
            render: (row) => renderAssignee(row, userMap),
            defaultContent: "",
          },
          {
            data: "createdAt",
            render: (d) =>
              d
                ? new Date(d).toLocaleString("es-CO", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "",
          },
          {
            data: null,
            orderable: false,
            searchable: false,
            render: (row) =>
              `<button class="btn btn-sm btn-primary ver-btn" data-id="${row._id}">Ver</button>`,
          },
        ],
        language: {
          url: "https://cdn.datatables.net/plug-ins/1.13.8/i18n/es-ES.json",
        },
        pageLength: 10,
      });

      $(tableRef.current).on("click", ".ver-btn", function () {
        const id = $(this).data("id");
        if (typeof onOpenChat === "function") onOpenChat(String(id));
        else alert("Ver ticket: " + id);
      });
    }
  } catch (err) {
    console.error("Error cargando tickets:", err);
  }
}

/**
 * Destruye el DataTable para cleanup.
 */
export function destroyMisTareasTable(dataTableRef) {
  if (dataTableRef.current) {
    try {
      dataTableRef.current.destroy(true);
    } catch (e) {
      console.warn("⚠️ Error al destruir DataTable:", e);
    }
    dataTableRef.current = null;
  }
}

// Opcional: obtener tareas sin DataTable (mantén si usas)
export const getMisTareas = async ({ user, authTokens }) => {
  const headers = { ...getTicketsHeaders(user) };
  const token = getAuthToken(authTokens);
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await ticketsApi.get("/tasks/mine", {
    headers,
    params: { orgId: ORG_ID },
  });
  if (res.status >= 400) {
    console.error("Error HTTP en /tasks/mine:", res.status, res.data);
    return [];
  }
  return res.data?.data || res.data || [];
};
