// src/components/Tickets/Chat/TicketChat.jsx
import React, { useEffect, useState, useContext } from "react";
import AuthContext from "../../../../../context/AuthContext";
import "../TicketsChat/Chat.css";
import {
  fetchTicketMessages,
  sendTicketMessage,
  fetchTicketDetail,
  fetchTicketCategories,
  fetchTicketPriorities,
  fetchTicketStatuses,
} from "../TicketsChat/TicketsChat.js";
import { fetchTicketMetaAndUsers } from "../../../Usuario/CrearTicket/Service.js";

const DEBUG_PREFIX = "[TicketChat DEBUG]";

export default function TicketChat({ ticketId, onClose }) {
  const { user, authTokens } = useContext(AuthContext);

  // 🧑 ID principal: priorizamos id_personal y luego id_usuario
  const principalId =
    user?.id_personal || user?.id_usuario || user?.id || 1;

  const [ticket, setTicket] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(true);
  const [ticketError, setTicketError] = useState("");

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const [categoryMap, setCategoryMap] = useState({});
  const [priorityMap, setPriorityMap] = useState({});
  const [statusMap, setStatusMap] = useState({});
  const [userMap, setUserMap] = useState({});

  /* ======================= Cargar ticket + mensajes ======================= */
  useEffect(() => {
    let isMounted = true;

    if (!ticketId) return;

    async function loadTicket() {
      try {
        setTicketLoading(true);
        const data = await fetchTicketDetail({ ticketId, authTokens });
        console.log(`${DEBUG_PREFIX} ticket detalle =>`, data);
        if (isMounted) setTicket(data || null);
      } catch (err) {
        console.error("❌ Error cargando ticket:", err);
        if (isMounted) setTicketError("No se pudo cargar el ticket.");
      } finally {
        if (isMounted) setTicketLoading(false);
      }
    }

    async function loadMessages() {
      try {
        setLoadingMessages(true);
        const data = await fetchTicketMessages({
          ticketId,
          authTokens,
          principalId,
        });
        console.log(`${DEBUG_PREFIX} mensajes =>`, data);
        if (isMounted) setMessages(data || []);
      } catch (err) {
        console.error("❌ Error cargando mensajes:", err);
        if (isMounted) setError("No se pudieron cargar los mensajes.");
      } finally {
        if (isMounted) setLoadingMessages(false);
      }
    }

    loadTicket();
    loadMessages();

    return () => {
      isMounted = false;
    };
  }, [ticketId, principalId, authTokens]);

  /* ========== Cargar categorías / prioridad / estado / usuarios ========== */
  useEffect(() => {
    let isMounted = true;

    async function loadMeta() {
      try {
        const [cats, pris, stats] = await Promise.all([
          fetchTicketCategories({ authTokens }),
          fetchTicketPriorities({ authTokens }),
          fetchTicketStatuses({ authTokens }),
        ]);

        let assignees = [];
        try {
          const meta = await fetchTicketMetaAndUsers(user);
          assignees = meta?.assignees || [];
          console.log(
            `${DEBUG_PREFIX} assignees desde PHP/MySQL =>`,
            assignees
          );
        } catch (err) {
          console.warn(
            `${DEBUG_PREFIX} No se pudieron cargar usuarios desde Service.php`,
            err
          );
        }

        console.log(`${DEBUG_PREFIX} users crudos (assignees) =>`, assignees);

        const cMap = {};
        cats.forEach((c) => {
          const key = String(c._id || c.id);
          cMap[key] = c.name || c.Nombre || c.nombre || key;
        });

        const pMap = {};
        pris.forEach((p) => {
          const key = String(p._id || p.id);
          pMap[key] = p.name || p.Nombre || p.nombre || key;
        });

        const sMap = {};
        stats.forEach((s) => {
          const key = String(s._id || s.id);
          sMap[key] = s.name || s.Nombre || s.nombre || key;
        });

        const uMap = {};
        assignees.forEach((u) => {
          const idUsuario =
            u.id_usuario ??
            u.Id_usuario ??
            u.ID_usuario ??
            u.usuario_id ??
            u.id ??
            null;

          const idPersonal =
            u.id_personal ??
            u.Id_personal ??
            u.ID_personal ??
            u.personal?.id_personal ??
            null;

          const nombreBase =
            u.username ||
            u.personal?.Nombre ||
            u.personal?.nombre ||
            u.Nombre ||
            u.nombre ||
            "";

          const fullName = nombreBase || u.email || "Sin nombre";

          if (idUsuario != null) {
            uMap[String(idUsuario).trim()] = fullName;
          }

          if (idPersonal != null) {
            uMap[String(idPersonal).trim()] = fullName;
          }
        });

        console.log(`${DEBUG_PREFIX} userMap final =>`, uMap);

        if (isMounted) {
          setCategoryMap(cMap);
          setPriorityMap(pMap);
          setStatusMap(sMap);
          setUserMap(uMap);
        }
      } catch (err) {
        console.error("❌ Error cargando meta:", err);
      }
    }

    if (user) {
      loadMeta();
    } else {
      console.warn(
        `${DEBUG_PREFIX} No hay user en contexto, no se cargan meta/users todavía.`
      );
    }

    return () => {
      isMounted = false;
    };
  }, [authTokens, user]);

  /* ======================= Helpers ======================= */
  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleString("es-CO", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  const getCategoryName = () => {
    if (!ticket) return "";
    const id = ticket.categoryId;
    if (!id) return "";
    return categoryMap[String(id)] || ticket.categoryName || String(id);
  };

  const getPriorityName = () => {
    if (!ticket) return "";
    const id = ticket.priorityId;
    if (!id) return "";
    return priorityMap[String(id)] || ticket.priorityName || String(id);
  };

  const getStatusName = () => {
    if (!ticket) return "";
    const id = ticket.statusId;
    if (!id) return "";
    return statusMap[String(id)] || ticket.statusName || String(id);
  };

  const getUserNameById = (id) => {
    if (!id) return "";
    const key = String(id).trim();
    const name = userMap[key] || "";
    console.log(`${DEBUG_PREFIX} getUserNameById`, {
      id,
      key,
      name,
      userMapKeys: Object.keys(userMap),
    });
    return name;
  };

  const getUserNameFromObj = (obj, label = "sin label") => {
    console.log(`${DEBUG_PREFIX} getUserNameFromObj(${label}) =>`, obj);

    if (!obj) return "";

    if (typeof obj === "number" || typeof obj === "string") {
      return getUserNameById(obj);
    }

    const directName = obj.name || obj.Nombre || obj.nombre;
    if (directName) return directName;

    const nombre =
      obj.personal?.Nombre ??
      obj.personal?.nombre ??
      obj.Nombre ??
      obj.nombre ??
      "";

    const apellido =
      obj.personal?.Apellido ??
      obj.personal?.apellido ??
      obj.Apellido ??
      obj.apellido ??
      "";

    const fullDirect = `${nombre} ${apellido}`.trim();
    if (fullDirect) return fullDirect;

    const id =
      obj.id_usuario ??
      obj.Id_usuario ??
      obj.usuario_id ??
      obj.userId ??
      obj.id_personal ??
      obj.Id_personal ??
      obj.personalId ??
      obj.principalId ??
      obj.id ??
      obj.Id;

    return getUserNameById(id) || "";
  };

  const getReporterName = () => {
    if (!ticket) return "—";

    const byObj =
      getUserNameFromObj(ticket.reporter, "reporter") ||
      ticket.reporterName ||
      ticket.reporter_fullname;
    if (byObj) return byObj;

    const idCandidates = [
      typeof ticket.reporter === "number" || typeof ticket.reporter === "string"
        ? ticket.reporter
        : null,
      ticket.reporterId,
      ticket.reporter_id,
      ticket.reportedBy,
      ticket.createdBy,
      ticket.principalId,
      ticket.id_usuario,
      ticket.id_personal,
      ticket.reporter?.id,
      ticket.reporter?.principalId,
      ticket.reporter?.id_usuario,
      ticket.reporter?.id_personal,
    ];

    const firstValidId = idCandidates.find(
      (v) => v !== null && v !== undefined && v !== ""
    );

    const nameFromMap = getUserNameById(firstValidId);

    if (nameFromMap) return nameFromMap;
    if (firstValidId) return `Usuario ${String(firstValidId)}`;
    return "—";
  };

  const getAssigneeName = () => {
    if (!ticket) return "—";

    const byObj =
      getUserNameFromObj(ticket.assignee, "assignee") ||
      ticket.assigneeName ||
      ticket.assignee_fullname;
    if (byObj) return byObj;

    const idCandidates = [
      typeof ticket.assignee === "number" || typeof ticket.assignee === "string"
        ? ticket.assignee
        : null,
      ticket.assigneeId,
      ticket.assignee_id,
      ticket.assignedTo,
      ticket.id_asignado,
      ticket.asignadoA,
      ticket.assignee?.id,
      ticket.assignee?.principalId,
      ticket.assignee?.id_usuario,
      ticket.assignee?.id_personal,
    ];

    const firstValidId = idCandidates.find(
      (v) => v !== null && v !== undefined && v !== ""
    );

    const nameFromMap = getUserNameById(firstValidId);

    if (nameFromMap) return nameFromMap;
    if (firstValidId) return `Usuario ${String(firstValidId)}`;
    return "—";
  };

  /* ======================= Enviar mensaje ======================= */
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    setError("");

    try {
      const created = await sendTicketMessage({
        ticketId,
        authTokens,
        principalId,
        content: newMessage.trim(),
        user,
      });

      console.log(`${DEBUG_PREFIX} mensaje creado =>`, created);

      setMessages((prev) => [...prev, created]);
      setNewMessage("");
    } catch (err) {
      console.error("❌ Error enviando mensaje:", err);
      setError("No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  };

  /* ======================= Render ======================= */
  return (
    <div className="ticket-chat">
      <div className="ticket-chat__container">
        <div className="ticket-chat__header">
          <div className="ticket-chat__title-wrapper">
            <h5 className="ticket-chat__title">
              Chat del ticket {ticket?.code || ticketId}
            </h5>
            {ticket && (
              <span className="ticket-chat__subtitle">
                {ticket.title || "Sin título"}
              </span>
            )}
          </div>

          {onClose && (
            <button
              type="button"
              className="ticket-chat__close-btn"
              onClick={onClose}
            >
              Cerrar
            </button>
          )}
        </div>

        <div className="ticket-chat__grid">
          {/* 🔹 Columna izquierda: detalle del ticket */}
          <div className="ticket-chat__left">
            <div className="ticket-chat__card">
              <div className="ticket-chat__card-header">
                Detalle del ticket
              </div>
              <div className="ticket-chat__card-body">
                {ticketLoading && (
                  <p className="ticket-chat__status-text">
                    Cargando ticket...
                  </p>
                )}

                {ticketError && (
                  <div className="ticket-chat__alert ticket-chat__alert--error">
                    {ticketError}
                  </div>
                )}

                {ticket && !ticketLoading && (
                  <dl className="ticket-chat__info-list">
                    <div className="ticket-chat__info-row">
                      <dt>ID</dt>
                      <dd>{ticket.code}</dd>
                    </div>

                    <div className="ticket-chat__info-row">
                      <dt>Título</dt>
                      <dd>{ticket.title}</dd>
                    </div>

                    <div className="ticket-chat__info-row">
                      <dt>Descripción</dt>
                      <dd>{ticket.description}</dd>
                    </div>

                    <div className="ticket-chat__info-row">
                      <dt>Categoría</dt>
                      <dd>{getCategoryName()}</dd>
                    </div>

                    <div className="ticket-chat__info-row">
                      <dt>Prioridad</dt>
                      <dd>{getPriorityName()}</dd>
                    </div>

                    <div className="ticket-chat__info-row">
                      <dt>Estado</dt>
                      <dd>{getStatusName()}</dd>
                    </div>

                    <div className="ticket-chat__info-row">
                      <dt>Reportado por</dt>
                      <dd>{getReporterName()}</dd>
                    </div>

                    <div className="ticket-chat__info-row">
                      <dt>Asignado a</dt>
                      <dd>{getAssigneeName()}</dd>
                    </div>

                    <div className="ticket-chat__info-row">
                      <dt>Creado</dt>
                      <dd>{formatDate(ticket.createdAt)}</dd>
                    </div>

                    <div className="ticket-chat__info-row">
                      <dt>Adjuntos</dt>
                      <dd>{ticket.attachmentsCount ?? 0}</dd>
                    </div>

                    {Array.isArray(ticket.tags) &&
                      ticket.tags.length > 0 && (
                        <div className="ticket-chat__info-row">
                          <dt>Tags</dt>
                          <dd>{ticket.tags.join(", ")}</dd>
                        </div>
                      )}
                  </dl>
                )}
              </div>
            </div>
          </div>

          {/* 🔹 Columna derecha: chat */}
          <div className="ticket-chat__right">
            {loadingMessages ? (
              <p className="ticket-chat__status-text">
                Cargando mensajes...
              </p>
            ) : (
              <>
                {error && (
                  <div className="ticket-chat__alert ticket-chat__alert--error">
                    {error}
                  </div>
                )}

                <div className="ticket-chat__messages">
                  {messages.length === 0 && (
                    <p className="ticket-chat__empty">
                      No hay mensajes todavía.
                    </p>
                  )}

                  {messages.map((msg, index) => {
  // 💳 IDs del usuario logueado (varias opciones para asegurarnos)
  const currentIdsRaw = [
    user?.id_usuario,
    user?.Id_usuario,
    user?.id_personal,
    user?.Id_personal,
    user?.id,
    user?.username,
    user?.email,
    principalId, 
  ];

  const currentIds = currentIdsRaw
    .filter((v) => v !== null && v !== undefined && v !== "")
    .map((v) => String(v).trim());

  
  const senderCandidatesRaw = [
    msg?.sender?.id_usuario,
    msg?.sender?.Id_usuario,
    msg?.sender?.id_personal,
    msg?.sender?.Id_personal,
    msg?.sender?.principalId,
    msg?.senderId,
    msg?.principalId,
    msg?.sender?.id,
    msg?.sender?.name,
    msg?.senderName,
  ];

  const senderCandidates = senderCandidatesRaw
    .filter((v) => v !== null && v !== undefined && v !== "")
    .map((v) => String(v).trim());

  // ✅ Ahora sí: es mío si algún ID/nombre del sender coincide con los del usuario
  const isMine = senderCandidates.some((sid) => currentIds.includes(sid));

  const senderId =
    msg?.sender?.id_usuario ??
    msg?.sender?.Id_usuario ??
    msg?.sender?.id_personal ??
    msg?.sender?.Id_personal ??
    msg?.sender?.principalId ??
    msg?.senderId ??
    msg?.principalId ??
    msg?.sender?.id;

  const nameFromMap = getUserNameById(senderId);
  const baseName =
    nameFromMap ||
    msg.sender?.name ||
    msg.senderName ||
    (senderId ? `Usuario ${String(senderId)}` : "Usuario");

  // Nombre que se muestra
  const displayName = isMine ? `Tú (${baseName})` : baseName;

  const timestamp = msg.createdAt
    ? new Date(msg.createdAt).toLocaleString("es-CO", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const initials = baseName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  console.log(`${DEBUG_PREFIX} mensaje[${index}] =>`, {
    msg,
    isMine,
    currentIds,
    senderCandidates,
    displayName,
  });

  return (
    <div
      key={msg._id || msg.id || `${index}-${timestamp}`}
      className={`ticket-chat__message ${
        isMine
          ? "ticket-chat__message--mine"
          : "ticket-chat__message--other"
      }`}
    >
      {/* 👤 Avatar otro usuario (izquierda) */}
      {!isMine && (
        <div className="ticket-chat__avatar">
          <span>{initials}</span>
        </div>
      )}

      {/* 💬 Burbuja */}
      <div className="ticket-chat__bubble">
        <div className="ticket-chat__bubble-header">
          <span className="ticket-chat__sender-name">{displayName}</span>
          <span className="ticket-chat__timestamp">{timestamp}</span>
        </div>

        <div className="ticket-chat__bubble-body">
          {msg.message || msg.content || msg.text}
        </div>
      </div>

      {/* 🧑‍💻 Tu avatar (derecha) */}
      {isMine && (
        <div className="ticket-chat__avatar ticket-chat__avatar--mine">
          <span>{initials}</span>
        </div>
      )}
    </div>
  );
})}

                </div>

                <form
                  onSubmit={handleSend}
                  className="ticket-chat__input-wrapper"
                >
                  <div className="ticket-chat__textarea-wrapper">
                    <textarea
                      className="ticket-chat__textarea"
                      rows={2}
                      placeholder="Escribe un mensaje..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={sending}
                    />
                  </div>

                  <div className="ticket-chat__actions">
                    <button
                      type="submit"
                      className="ticket-chat__send-btn"
                      disabled={sending || !newMessage.trim()}
                    >
                      {sending ? "Enviando..." : "Enviar"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
