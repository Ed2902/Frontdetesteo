// src/components/Tickets/Chat/TicketChat.jsx
import React, { useEffect, useState, useContext } from "react";
import AuthContext from "../../../../../context/AuthContext";
import {
  fetchTicketMessages,
  sendTicketMessage,
  fetchTicketDetail,
  fetchTicketCategories,
  fetchTicketPriorities,
  fetchTicketStatuses,
  fetchTicketUsers, // 👈 asegúrate que exista en TicketsChat.js
} from "../TicketsChat/TicketsChat.js";

export default function TicketChat({ ticketId, onClose }) {
  const { user, authTokens } = useContext(AuthContext);

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

  const principalId =
    user?.id_personal || user?.id || user?.id_usuario || 1;

  /* ======================= Cargar ticket + mensajes ======================= */
  useEffect(() => {
    let isMounted = true;

    if (!ticketId) return;

    async function loadTicket() {
      try {
        setTicketLoading(true);
        const data = await fetchTicketDetail({ ticketId, authTokens });
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
        const [cats, pris, stats, users] = await Promise.all([
          fetchTicketCategories({ authTokens }),
          fetchTicketPriorities({ authTokens }),
          fetchTicketStatuses({ authTokens }),
          fetchTicketUsers({ authTokens }),
        ]);

        // categorías
        const cMap = {};
        cats.forEach((c) => {
          const key = String(c._id || c.id);
          cMap[key] = c.name || c.Nombre || c.nombre || key;
        });

        // prioridades
        const pMap = {};
        pris.forEach((p) => {
          const key = String(p._id || p.id);
          pMap[key] = p.name || p.Nombre || p.nombre || key;
        });

        // estados
        const sMap = {};
        stats.forEach((s) => {
          const key = String(s._id || s.id);
          sMap[key] = s.name || s.Nombre || s.nombre || key;
        });

        // usuarios (MISMO criterio que usas en MisTareas)
        const uMap = {};
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

          if (idUsuario == null) return;

          const key = String(idUsuario).trim();

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
          uMap[key] = fullName || `Usuario ${key}`;
        });

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

    loadMeta();
    return () => {
      isMounted = false;
    };
  }, [authTokens]);

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

      setMessages((prev) => [...prev, created]);
      setNewMessage("");
    } catch (err) {
      console.error("❌ Error enviando mensaje:", err);
      setError("No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  };

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

  const getUserName = (id) => {
    if (!id) return "";
    const key = String(id).trim();
    return userMap[key] || `Usuario ${key}`;
  };

  /* ======================= Render ======================= */
  return (
    <div className="ticket-chat-container">
      <div className="ticket-chat-header d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">
          Chat del ticket {ticket?.code || ticketId}
        </h5>

        {onClose && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={onClose}
          >
            Cerrar
          </button>
        )}
      </div>

      <div className="row">
        {/* 🔹 Columna izquierda: detalle del ticket */}
        <div className="col-md-4 mb-3">
          <div className="card h-100">
            <div className="card-header">Detalle del ticket</div>
            <div className="card-body">
              {ticketLoading && <p>Cargando ticket...</p>}

              {ticketError && (
                <div className="alert alert-danger py-1 mb-2">
                  {ticketError}
                </div>
              )}

              {ticket && !ticketLoading && (
                <>
                  <p className="mb-1">
                    <strong>ID:</strong> {ticket.code}
                  </p>
                  <p className="mb-1">
                    <strong>Título:</strong> {ticket.title}
                  </p>
                  <p className="mb-1">
                    <strong>Descripción:</strong> {ticket.description}
                  </p>
                  <p className="mb-1">
                    <strong>Categoría:</strong> {getCategoryName()}
                  </p>
                  <p className="mb-1">
                    <strong>Prioridad:</strong> {getPriorityName()}
                  </p>
                  <p className="mb-1">
                    <strong>Estado:</strong> {getStatusName()}
                  </p>
                  <p className="mb-1">
                    <strong>Reportado por:</strong>{" "}
                    {getUserName(ticket.reporter?.id)}
                  </p>
                  <p className="mb-1">
                    <strong>Asignado a:</strong>{" "}
                    {getUserName(ticket.assignee?.id)}
                  </p>
                  <p className="mb-1">
                    <strong>Creado:</strong>{" "}
                    {formatDate(ticket.createdAt)}
                  </p>
                  <p className="mb-1">
                    <strong>Adjuntos:</strong>{" "}
                    {ticket.attachmentsCount ?? 0}
                  </p>
                  {Array.isArray(ticket.tags) && ticket.tags.length > 0 && (
                    <p className="mb-1">
                      <strong>Tags:</strong>{" "}
                      {ticket.tags.join(", ")}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* 🔹 Columna derecha: chat */}
        <div className="col-md-8">
          {loadingMessages ? (
            <p>Cargando mensajes...</p>
          ) : (
            <>
              {error && (
                <div className="alert alert-danger py-1 mb-2">
                  {error}
                </div>
              )}

              <div
                className="ticket-chat-messages border rounded p-2 mb-3"
                style={{ maxHeight: "320px", overflowY: "auto" }}
              >
                {messages.length === 0 && (
                  <p className="text-muted mb-0">
                    No hay mensajes todavía.
                  </p>
                )}

                {messages.map((msg) => {
                  const isMine =
                    msg?.sender?.id == principalId ||
                    msg?.principalId == principalId ||
                    msg?.senderId == principalId;

                  return (
                    <div
                      key={msg._id || msg.id || Math.random()}
                      className={`ticket-chat-message mb-2 d-flex ${
                        isMine
                          ? "justify-content-end"
                          : "justify-content-start"
                      }`}
                    >
                      <div
                        className={`p-2 rounded ${
                          isMine
                            ? "bg-primary text-white"
                            : "bg-light"
                        }`}
                        style={{ maxWidth: "70%" }}
                      >
                        <div className="small fw-bold mb-1">
                          {msg.sender?.name ||
                            msg.senderName ||
                            (isMine ? "Tú" : "Usuario")}
                        </div>

                        <div>
                          {msg.message || msg.content || msg.text}
                        </div>

                        <div className="small text-muted mt-1 text-end">
                          {msg.createdAt
                            ? new Date(
                                msg.createdAt
                              ).toLocaleString()
                            : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSend} className="ticket-chat-input">
                <div className="mb-2">
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Escribe un mensaje..."
                    value={newMessage}
                    onChange={(e) =>
                      setNewMessage(e.target.value)
                    }
                    disabled={sending}
                  />
                </div>

                <div className="d-flex justify-content-end">
                  <button
                    type="submit"
                    className="btn btn-primary"
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
  );
}
