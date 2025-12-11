import React, { useEffect, useRef, useContext, useState } from "react";
import AuthContext from "../../../../context/AuthContext";
import { loadMisTareas, destroyMisTareasTable } from "./MisTareas.service";
import TicketChat from "../../Usuario/MisTareas/TicketsChat/TicketsChat.jsx";
import "./MisTareas.css";

export default function MisTareas({ initialTicketId = null }) {
  const { user, token } = useContext(AuthContext);

  const tableRef = useRef(null);
  const dataTableRef = useRef(null);
  const initializedRef = useRef(false); // evita doble inicialización

  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loading, setLoading] = useState(false);


   useEffect(() => {
    if (initialTicketId) {
      console.log('🎯 MisTareas: ticket desde URL =>', initialTicketId);
      setSelectedTicketId(initialTicketId);
      setIsChatOpen(true);
    }
  }, [initialTicketId]);

  useEffect(() => {
    console.log("🔎 permiso mistareas =>", user?.permisos?.mistareas);
    console.log("📊 MisTareas: inicializando DataTable con", {
      hasUser: !!user,
      hasToken: !!token,
    });

    if (!user || !token) {
      console.warn("⚠️ Falta user o token, no se cargan mis tareas todavía");
      return;
    }

    // Evita doble init (StrictMode / remount)
    if (initializedRef.current) {
      console.log(
        "⏭ MisTareas: ya inicializado, no vuelvo a llamar loadMisTareas"
      );
      return;
    }
    initializedRef.current = true;

    let cancelled = false;

    const init = async () => {
      try {
        setLoading(true);
        await loadMisTareas({
          user,
          // seguimos mandando la clave 'authTokens' para NO romper service.js
          authTokens: token,
          tableRef,
          dataTableRef,
          onOpenChat: (ticketId) => {
            console.log("🗨️ abrir chat para ticket =>", ticketId);
            setSelectedTicketId(ticketId);
            setIsChatOpen(true);
          },
        });
      } catch (err) {
        console.error("❌ Error en MisTareas:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      console.log("🧹 MisTareas: cleanup, destruyendo DataTable");
      cancelled = true;
      destroyMisTareasTable(dataTableRef);
      initializedRef.current = false;
    };
  }, [user, token]);

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setSelectedTicketId(null);
  };

  return (
    <div className="mis-tareas">
      <div className="mis-tareas__container">
        {/* HEADER */}
        <header className="mis-tareas__header">
          <div className="mis-tareas__title-wrapper">
            <h1 className="mis-tareas__title">Mis tareas</h1>
            <p className="mis-tareas__subtitle">
              Aquí verás los tickets que tienes asignados o en los que
              participas. Desde aquí también puedes abrir el chat de cada
              ticket.
            </p>
          </div>

          <div className="mis-tareas__user-badge">
            <span>Usuario:</span>{" "}
            <strong>
              {user?.username ||
                user?.nombre ||
                `${user?.personal?.Nombre || ""} ${
                  user?.personal?.Apellido || ""
                }`.trim() ||
                "—"}
            </strong>
          </div>
        </header>

        {/* AVISO DE PERMISO OPCIONAL */}
        {user && user?.permisos?.mistareas === false && (
          <div className="mis-tareas__alert mis-tareas__alert--warning">
            No tienes permisos completos para gestionar tareas. Es posible que
            solo veas información parcial.
          </div>
        )}

        {/* CARD CON LA TABLA */}
        <div className="mis-tareas__card">
          <div className="mis-tareas__card-header">
            <span className="mis-tareas__card-title">Listado de tareas</span>
            <span className="mis-tareas__card-caption">
              Usa los filtros de la tabla para buscar por estado, prioridad o
              usuarios.
            </span>
          </div>

          <div className="mis-tareas__card-body">
            {loading && (
              <div className="mis-tareas__loading">Cargando tus tareas...</div>
            )}

            <table
              id="misTareasTable"
              ref={tableRef}
              className="table table-striped table-bordered mis-tareas__table"
              style={{ width: "100%" }}
            >
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Título</th>
                  <th>Categoría</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Reportado por</th>
                  <th>Asignado a</th>
                  <th>Creado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody />
            </table>
          </div>
        </div>
      </div>

      {/* 🔹 Modal de chat */}
      {isChatOpen && (
        <>
          <div className="mis-tareas__modal-backdrop" />

          <div className="mis-tareas__modal" role="dialog" aria-modal="true">
            <div className="mis-tareas__modal-dialog">
              <div className="mis-tareas__modal-header">
                <h2 className="mis-tareas__modal-title">
                  Chat del ticket {selectedTicketId?.slice?.(0, 6) || ""}
                </h2>
                <button
                  type="button"
                  className="mis-tareas__modal-close"
                  onClick={handleCloseChat}
                >
                  ✕
                </button>
              </div>
              <div className="mis-tareas__modal-body">
                <TicketChat
                  ticketId={selectedTicketId}
                  onClose={handleCloseChat}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
