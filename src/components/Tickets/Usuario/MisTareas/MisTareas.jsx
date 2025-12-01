// MisTareas.jsx
import React, { useEffect, useRef, useContext, useState } from "react";
import AuthContext from "../../../../context/AuthContext";
import { loadMisTareas, destroyMisTareasTable } from "./MisTareas.service";
import TicketChat from "../../Usuario/MisTareas/TicketsChat/TicketsChat.jsx"; // ajusta la ruta si cambia

export default function MisTareas() {
  const { user, authTokens } = useContext(AuthContext);
  const tableRef = useRef(null);
  const dataTableRef = useRef(null);

  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    console.log("🔎 permiso mistareas =>", user?.permisos?.mistareas);

    loadMisTareas({
      user,
      authTokens,
      tableRef,
      dataTableRef,
      onOpenChat: (ticketId) => {
        console.log("🗨️ abrir chat para ticket =>", ticketId);
        setSelectedTicketId(ticketId);
        setIsChatOpen(true);
      },
    });

    return () => {
      destroyMisTareasTable(dataTableRef);
    };
  }, [user, authTokens]);

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setSelectedTicketId(null);
  };

  return (
    <div>
      <h2>Mis tareas</h2>

      <table
        ref={tableRef}
        className="table table-striped table-bordered"
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

      {/* 🔹 Modal de chat */}
      {isChatOpen && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body">
                <TicketChat
                  ticketId={selectedTicketId}
                  onClose={handleCloseChat}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
