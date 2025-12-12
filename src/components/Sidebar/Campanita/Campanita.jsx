import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import AuthContext from "../../../context/AuthContext";
import {
  fetchMyNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  normalizeNotification,
  timeAgo,
} from "./Campanita";

import "./Campanita.css";

export default function Campanita({
  apiBaseUrl = import.meta.env.VITE_API_URL4 || import.meta.env.VITE_API_URL,
  orgId = import.meta.env.VITE_ORG_ID,
  pollMs = 15000,
  limit = 30,
}) {
  const navigate = useNavigate();
  const { user, authTokens, token } = useContext(AuthContext);

  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const timerRef = useRef(null);

  const accessToken = useMemo(() => {
    return authTokens?.access || authTokens?.token || token || null;
  }, [authTokens, token]);

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("unread"); // "unread" | "all"
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");

  const [popStyle, setPopStyle] = useState({ top: 0, left: 0, width: 420 });

  const canQuery = Boolean(accessToken && orgId);

  const computePopPosition = () => {
    const el = btnRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const gap = 12;
    const maxWidth = 420;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const width = Math.min(maxWidth, vw - 24);

    // Preferimos abrir a la derecha del botón
    let left = rect.right + gap;

    // Si se sale a la derecha, abrimos a la izquierda del botón
    if (left + width > vw - 12) {
      left = Math.max(12, rect.left - gap - width);
    }

    // Alineado al top del botón
    let top = Math.max(12, rect.top);

    // Evitar que se salga abajo (aprox de alto del dropdown)
    const approxHeight = 520;
    if (top + approxHeight > vh - 12) {
      top = Math.max(12, vh - approxHeight - 12);
    }

    setPopStyle({ top, left, width });
  };

  const loadCounts = async () => {
    if (!canQuery) return;
    try {
      const c = await fetchUnreadCount({ apiBaseUrl, orgId, accessToken });
      setUnreadCount(Number(c || 0));
    } catch {
      // no bloquea UI
    }
  };

  const loadList = async () => {
    if (!canQuery) return;
    setLoading(true);
    setError("");
    try {
      const unreadOnly = tab === "unread";
      const data = await fetchMyNotifications({
        apiBaseUrl,
        orgId,
        accessToken,
        limit,
        unreadOnly,
      });
      setRows((data || []).map(normalizeNotification));
    } catch (e) {
      setError(e?.message || "No se pudieron cargar las notificaciones.");
    } finally {
      setLoading(false);
    }
  };

  // Al abrir: posicionar + cargar + polling tipo Facebook (mientras está abierto)
  useEffect(() => {
    if (!open) return;

    computePopPosition();
    loadCounts();
    loadList();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      loadCounts();
      loadList();
    }, Math.max(6000, pollMs));

    const onMove = () => computePopPosition();
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true); // captura scroll en contenedores

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab, canQuery]);

  // Badge polling aunque esté cerrado
  useEffect(() => {
    if (!canQuery) return;
    loadCounts();
    const t = setInterval(() => loadCounts(), Math.max(8000, pollMs));
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canQuery, pollMs]);

  // Cerrar al click afuera + ESC
  useEffect(() => {
    if (!open) return;

    const onDown = (e) => {
      const pop = document.getElementById("camp-pop-root");
      const clickedInsideRoot = rootRef.current?.contains(e.target);
      const clickedInsidePop = pop?.contains(e.target);

      if (!clickedInsideRoot && !clickedInsidePop) setOpen(false);
    };

    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onToggle = () => {
    if (!accessToken) return;
    setOpen((v) => !v);
  };

  const onOpenItem = async (n) => {
    if (!n) return;

    // optimista: marcar como leída
    if (!n.read) {
      setRows((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await markNotificationRead({ apiBaseUrl, orgId, accessToken, id: n._id });
      } catch {}
    }

    if (n.url) {
      setOpen(false);
      navigate(n.url);
    }
  };

  const onMarkAllRead = async () => {
    if (!canQuery) return;

    setRows((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnreadCount(0);

    try {
      await markAllNotificationsRead({ apiBaseUrl, orgId, accessToken });
    } catch {
      await loadCounts();
      await loadList();
    }
  };

  // Contenido del popup (lo usamos tanto para portal como para mantener limpio el JSX)
  const popContent = (
    <div
      id="camp-pop-root"
      className="camp-pop"
      role="dialog"
      aria-label="Centro de notificaciones"
      style={{
        position: "fixed",
        top: popStyle.top,
        left: popStyle.left,
        width: popStyle.width,
        zIndex: 999999,
      }}
    >
      <div className="camp-head">
        <div className="camp-title">
          Notificaciones
          {user?.nombre || user?.name ? (
            <span className="camp-sub"> {user?.nombre || user?.name}</span>
          ) : null}
        </div>

        <button type="button" className="camp-markall" onClick={onMarkAllRead}>
          Marcar todo como leído
        </button>
      </div>

      <div className="camp-tabs" role="tablist">
        <button
          type="button"
          className={`camp-tab ${tab === "unread" ? "active" : ""}`}
          onClick={() => setTab("unread")}
          role="tab"
          aria-selected={tab === "unread"}
        >
          No leídas
        </button>
        <button
          type="button"
          className={`camp-tab ${tab === "all" ? "active" : ""}`}
          onClick={() => setTab("all")}
          role="tab"
          aria-selected={tab === "all"}
        >
          Todas
        </button>
      </div>

      <div className="camp-body">
        {!accessToken && (
          <div className="camp-empty">Inicia sesión para ver tus notificaciones.</div>
        )}

        {accessToken && loading && <div className="camp-loading">Cargando…</div>}

        {accessToken && error && <div className="camp-error">{error}</div>}

        {accessToken && !loading && !error && rows.length === 0 && (
          <div className="camp-empty">
            {tab === "unread"
              ? "No tienes notificaciones sin leer."
              : "Aún no tienes notificaciones."}
          </div>
        )}

        {accessToken && rows.length > 0 && (
          <ul className="camp-list">
            {rows.map((raw) => {
              const n = normalizeNotification(raw);
              return (
                <li key={n._id} className={`camp-item ${n.read ? "" : "is-unread"}`}>
                  <button
                    type="button"
                    className="camp-itemBtn"
                    onClick={() => onOpenItem(n)}
                  >
                    <div className="camp-dot" aria-hidden="true" />
                    <div className="camp-itemMain">
                      <div className="camp-itemTitle">{n.title}</div>
                      {n.body ? <div className="camp-itemBody">{n.body}</div> : null}
                      <div className="camp-itemMeta">
                        <span>{timeAgo(n.createdAt)}</span>
                        {n.type ? <span className="camp-metaSep">·</span> : null}
                        {n.type ? <span className="camp-type">{n.type}</span> : null}
                      </div>
                    </div>
                    <div className="camp-chevron" aria-hidden="true">
                      ›
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="camp-foot">
        <button
          type="button"
          className="camp-viewAll"
          onClick={() => {
            setOpen(false);
            navigate("/notifications");
          }}
        >
          Ver todas
        </button>
      </div>
    </div>
  );

  return (
    <div className="camp-root" ref={rootRef}>
      <button
        ref={btnRef}
        type="button"
        className={`camp-btn ${open ? "is-open" : ""}`}
        onClick={onToggle}
        aria-label="Notificaciones"
        title="Notificaciones"
      >
        <span className="camp-bell" aria-hidden="true">
          🔔
        </span>
        {unreadCount > 0 && (
          <span className="camp-badge" aria-label={`${unreadCount} no leídas`}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* 🔥 Portal: el popup se renderiza en document.body para que NO lo recorte el sidebar */}
      {open ? createPortal(popContent, document.body) : null}
    </div>
  );
}
