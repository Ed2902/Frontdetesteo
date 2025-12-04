// MisTareas.service.js
import $ from "jquery";
import "datatables.net-bs5";
import "datatables.net-responsive-bs5";

const API_URL = import.meta.env.VITE_API_URL4 || "http://localhost:4000";
const USERS_API_URL = import.meta.env.VITE_API_URL || "http://localhost:3005/api";
const ORG_ID = import.meta.env.VITE_ORG_ID || "greenway";

const CATEGORIES_URL = `${API_URL}/tikets/tickets/categories`;
const PRIORITIES_URL = `${API_URL}/tikets/tickets/priorities`;
const STATUSES_URL = `${API_URL}/tikets/tickets/statuses`;
const USERS_URL = `${USERS_API_URL}/personal`;

async function parseList(res, label) {
  if (!res.ok) {
    console.warn(`⚠️ catálogo HTTP ${label}`, res.status);
    try {
      const txt = await res.text();
      console.warn(`🧾 body ${label}:`, txt);
    } catch {}
    return [];
  }

  const j = await res.json();

  if (Array.isArray(j)) return j;
  if (Array.isArray(j.rows)) return j.rows;
  if (Array.isArray(j.data)) return j.data;
  if (Array.isArray(j.users)) return j.users;
  if (Array.isArray(j.personal)) return j.personal;

  return [];
}

/**
 * Carga catálogos, usuarios, tickets y monta/actualiza el DataTable.
 * @param {Object} params
 * @param {Object} params.user         
 * @param {Object} params.authTokens 
 * @param {Object} params.tableRef     
 * @param {Object} params.dataTableRef 
 * @param {Function} [params.onOpenChat]
 */
export async function loadMisTareas({
  user,
  authTokens,
  tableRef,
  dataTableRef,
  onOpenChat,
}) {
  if (!user) {
    return;
  }

  try {
    // ============ TOKEN ============
    const ctxToken =
      authTokens?.access ||
      authTokens?.token ||
      user?.token ||
      user?.accessToken;

    const lsToken =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("authToken");

    const token = ctxToken || lsToken || null;

    const commonHeaders = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    // =====================================================================
    // 1) CARGAR CATÁLOGOS (categorías, prioridades, estados, usuarios)
    // =====================================================================
    const [catRes, priRes, staRes, usersRes] = await Promise.all([
      fetch(`${CATEGORIES_URL}?orgId=${encodeURIComponent(ORG_ID)}`, {
        method: "GET",
        headers: commonHeaders,
        credentials: "include",
      }),
      fetch(`${PRIORITIES_URL}?orgId=${encodeURIComponent(ORG_ID)}`, {
        method: "GET",
        headers: commonHeaders,
        credentials: "include",
      }),
      fetch(`${STATUSES_URL}?orgId=${encodeURIComponent(ORG_ID)}`, {
        method: "GET",
        headers: commonHeaders,
        credentials: "include",
      }),
      fetch(USERS_URL, {
        method: "GET",
        headers: commonHeaders,
      }),
    ]);

    const [categories, priorities, statuses, users] = await Promise.all([
      parseList(catRes, "categories"),
      parseList(priRes, "priorities"),
      parseList(staRes, "statuses"),
      parseList(usersRes, "users"),
    ]);

    // =====================================================================
    // 2) MAPAS ID -> NAME
    // =====================================================================
    const categoryMap = {};
    categories.forEach((c) => {
      const key = String(c._id || c.id);
      categoryMap[key] = c.name || c.Nombre || c.nombre || key;
    });

    const priorityMap = {};
    priorities.forEach((p) => {
      const key = String(p._id || p.id);
      priorityMap[key] = p.name || p.Nombre || p.nombre || key;
    });

    const statusMap = {};
    statuses.forEach((s) => {
      const key = String(s._id || s.id);
      statusMap[key] = s.name || s.Nombre || s.nombre || key;
    });

    // 🔹 Mapa de usuarios: id_usuario -> "Nombre Apellido"
    const userMap = {};
    users.forEach((u) => {
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

      if (idUsuario == null) {
        console.warn("⚠️ Usuario sin id_usuario reconocible:", u);
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

      const fullName = `${nombre} ${apellido}`.trim();

      userMap[key] = fullName || `Usuario ${key}`;
    });

    // =====================================================================
    // 3) CARGAR TICKETS
    // =====================================================================
    const url = `${API_URL}/tikets/tickets?orgId=${encodeURIComponent(ORG_ID)}`;

    const res = await fetch(url, {
      method: "GET",
      headers: commonHeaders,
      credentials: "include",
    });

    if (!res.ok) {
      console.error("Error HTTP:", res.status);
      try {
        const errText = await res.text();
        console.error("🧾 Respuesta de error del backend:", errText);
      } catch {}
      return;
    }

    const json = await res.json();
    const allTickets = Array.isArray(json.rows) ? json.rows : [];

    // =====================================================================
    // 4) FILTRAR TICKETS DEL USUARIO (asignado O reportado por él)
    // =====================================================================
    const myId = String(user.id_usuario);

const tickets = allTickets.filter((t) => {
  const assigneeId =
    t.assignee && t.assignee.id != null ? String(t.assignee.id) : null;
  const reporterId =
    t.reporter && t.reporter.id != null ? String(t.reporter.id) : null;

  const soyAsignado = assigneeId === myId;
  const soyReportero = reporterId === myId;

  // 🔹 NUEVO: ver si estoy dentro de assignee.members (grupo)
  const members = Array.isArray(t.assignee?.members)
    ? t.assignee.members
    : [];

  const soyMiembroGrupo = members.some((m) => {
    const mid = m?.id != null ? String(m.id) : null;
    return mid === myId;
  });

  return soyAsignado || soyReportero || soyMiembroGrupo;
});

    // =====================================================================
    // 5) DATATABLE
    // =====================================================================
    if (!tableRef.current) {
      console.warn("⚠️ tableRef.current es null, no puedo montar DataTable");
      return;
    }

    if (dataTableRef.current) {
      // Actualizar
      dataTableRef.current.clear();
      dataTableRef.current.rows.add(tickets);
      dataTableRef.current.draw();
    } else {
      // Crear
      dataTableRef.current = $(tableRef.current).DataTable({
        data: tickets,
        responsive: true,
        columns: [


// 🔹 Participantes (Reportado + Asignados + Grupo)



       {
  data: "code",
  render: (code, type, row) => {
    // ✅ Caso normal: mostrar el code (ej: TCK-0006)
    if (code) return `<code>${code}</code>`;

    // 🔙 Respaldo para tickets viejos sin code: mostrar el _id recortado
    const id = row?._id;
    return id ? `<code>${String(id).slice(-6)}</code>` : "";
  },
},

          { data: "title", defaultContent: "" },

          // 🔹 Categoría
          {
            data: "categoryId",
            render: (id) =>
              id ? categoryMap[String(id)] || String(id) : "",
            defaultContent: "",
          },

          // 🔹 Prioridad
          {
            data: "priorityId",
            render: (id) =>
              id ? priorityMap[String(id)] || String(id) : "",
            defaultContent: "",
          },

          // 🔹 Estado
          {
            data: "statusId",
            render: (id) =>
              id ? statusMap[String(id)] || String(id) : "",
            defaultContent: "",
          },

          // 🔹 Reportado por
          {
            data: null,
            render: (row) => {
              const id = row.reporter?.id;
              if (!id) return "";
              const key = String(id);
              const name = userMap[key];
              if (!name) {
                console.warn(
                  "⚠️ reporter.id sin match en userMap",
                  key,
                  userMap
                );
                return `Usuario ${key}`;
              }
              return name;
            },
            defaultContent: "",
          },

          // 🔹 Asignado a
         {
  data: null,
  render: (row) => {
    const assignee = row.assignee || {};
    const type = assignee.type || "person";

    // 👥 Si es grupo: mostrar todos los integrantes
    if (type === "group") {
      const members = Array.isArray(assignee.members)
        ? assignee.members
        : [];

      if (!members.length) return "";

      const names = members
        .map((m) => {
          const mid = m?.id != null ? String(m.id) : null;
          if (!mid) return "";
          const name = userMap[mid];
          if (!name) {
            console.warn(
              "⚠️ member.id sin match en userMap",
              mid,
              userMap
            );
            return `Usuario ${mid}`;
          }
          return name;
        })
        .filter(Boolean);

      return names.join("<br>"); // cada integrante en una línea
    }

    // 🧍 Si NO es grupo (person / team): solo un nombre
    const id = assignee.id;
    if (!id) return "";
    const key = String(id);
    const name = userMap[key];
    if (!name) {
      console.warn("⚠️ assignee.id sin match en userMap", key, userMap);
      return `Usuario ${key}`;
    }
    return name;
  },
  defaultContent: "",
},


          // 🔹 Fecha creación
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

          // 🔹 Botón Ver (abre chat / detalle)
          {
            data: null,
            orderable: false,
            searchable: false,
            render: (row) =>
              `<button class="btn btn-sm btn-primary ver-btn" data-id="${row._id}">
                Ver
              </button>`,
          },
        ],
        language: {
          url: "https://cdn.datatables.net/plug-ins/1.13.8/i18n/es-ES.json",
        },
        pageLength: 10,
      });

      // Manejador del botón "Ver"
      $(tableRef.current).off("click", ".ver-btn");
      $(tableRef.current).on("click", ".ver-btn", function () {
        const id = $(this).data("id");

        if (typeof onOpenChat === "function") {
          onOpenChat(String(id)); // <- aquí llamamos al React padre
        } else {
          alert("Ver ticket: " + id);
        }
      });
    }
  } catch (err) {
    console.error("Error cargando tickets (logic):", err);
  }
}

/**
 * Destruye el DataTable de MisTareas (para cleanup del useEffect)
 */
export function destroyMisTareasTable(dataTableRef) {
  if (dataTableRef.current) {
    try {
      dataTableRef.current.destroy(true);
    } catch (e) {
      console.warn("⚠️ Error al destruir DataTable (ignorado):", e);
    }
    dataTableRef.current = null;
  }
}
