import React, {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

  // ==========================
  // 🔐 Tokens e identidad
  // ==========================
  const accessToken = useMemo(() => {
    return authTokens?.access || authTokens?.token || token || null;
  }, [authTokens, token]);

  const principalId = useMemo(() => {
    return (
      user?.principalId ??
      user?.id_usuario ??
      user?.id ??
      user?._id ??
      null
    );
  }, [user]);

  const canQuery = Boolean(accessToken && orgId && principalId);

  // ==========================
  // 📦 State
  // ==========================
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("unread"); // unread | all
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");
  const [popStyle, setPopStyle] = useState({ top: 0, left: 0, width: 420 });

  // ==========================
  // 📐 Posición popup
  // ==========================
  const computePopPosition = () => {
    const el = btnRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const gap = 12;
    const maxWidth = 420;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const width = Math.min(maxWidth, vw - 24);
    let left = rect.right + gap;

    if (left + width > vw - 12) {
      left = Math.max(12, rect.left - gap - width);
    }

    let top = Math.max(12, rect.top);
    const approxHeight = 520;
    if (top + approxHeight > vh - 12) {
      top = Math.max(12, vh - approxHeight - 12);
    }

    setPopStyle({ top, left, width });
  };

  // ==========================
  // 🔢 Conteo
  // ==========================
  const loadCounts = async () => {
    if (!canQuery) return;
    try {
      const c = await fetchUnreadCount({
        apiBaseUrl,
        orgId,
        accessToken,
        principalId,
      });
      setUnreadCount(Number(c || 0));
    } catch {
      // silencioso
    }
  };

  // ==========================
  // 📜 Listado
  // ==========================
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
        principalId,
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

  // ==========================
  // 🔄 Polling al abrir
  // ==========================
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
    window.addEventListener("scroll", onMove, true);

    return () => {
      clearInterval(timerRef.current);
      timerRef.current = null;
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open, tab, canQuery]);

  // ==========================
  // 🔔 Polling badge cerrado
  // ==========================
  useEffect(() => {
    if (!canQuery) return;
    loadCounts();
    const t = setInterval(() => loadCounts(), Math.max(8000, pollMs));
    return () => clearInterval(t);
  }, [canQuery, pollMs]);

  // ==========================
  // ❌ Cerrar afuera / ESC
  // ==========================
  useEffect(() => {
    if (!open) return;

    const onDown = (e) => {
      const pop = document.getElementById("camp-pop-root");
      const insideRoot = rootRef.current?.contains(e.target);
      const insidePop = pop?.contains(e.target);
      if (!insideRoot && !insidePop) setOpen(false);
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

  // ==========================
  // 🖱️ Acciones
  // ==========================
  const onToggle = () => {
    if (!accessToken) return;
    setOpen((v) => !v);
  };

  const onOpenItem = async (n) => {
    if (!n) return;

    if (!n.read) {
      setRows((prev) =>
        prev.map((x) => (x._id === n._id ? { ...x, read: true } : x))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await markNotificationRead({
          apiBaseUrl,
          orgId,
          accessToken,
          principalId,
          id: n._id,
        });
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
      await markAllNotificationsRead({
        apiBaseUrl,
        orgId,
        accessToken,
        principalId,
      });
    } catch {
      await loadCounts();
      await loadList();
    }
  };

  // ==========================
  // 🪟 Popup
  // ==========================
  const popContent = (
    <div
      id="camp-pop-root"
      className="camp-pop"
      role="dialog"
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
          {user?.nombre && <span className="camp-sub"> {user.nombre}</span>}
        </div>
        <button className="camp-markall" onClick={onMarkAllRead}>
          Marcar todo como leído
        </button>
      </div>

      <div className="camp-tabs">
        <button
          className={`camp-tab ${tab === "unread" ? "active" : ""}`}
          onClick={() => setTab("unread")}
        >
          No leídas
        </button>
        <button
          className={`camp-tab ${tab === "all" ? "active" : ""}`}
          onClick={() => setTab("all")}
        >
          Todas
        </button>
      </div>

      <div className="camp-body">
        {loading && <div className="camp-loading">Cargando…</div>}
        {error && <div className="camp-error">{error}</div>}

        {!loading && !error && rows.length === 0 && (
          <div className="camp-empty">
            {tab === "unread"
              ? "No tienes notificaciones sin leer."
              : "Aún no tienes notificaciones."}
          </div>
        )}

        {rows.length > 0 && (
          <ul className="camp-list">
            {rows.map((n) => (
              <li
                key={n._id}
                className={`camp-item ${n.read ? "" : "is-unread"}`}
              >
                <button
                  className="camp-itemBtn"
                  onClick={() => onOpenItem(n)}
                >
                  <div className="camp-dot" />
                  <div className="camp-itemMain">
                    <div className="camp-itemTitle">{n.title}</div>
                    {n.body && (
                      <div className="camp-itemBody">{n.body}</div>
                    )}
                    <div className="camp-itemMeta">
                      <span>{timeAgo(n.createdAt)}</span>
                      {n.type && <span className="camp-type"> · {n.type}</span>}
                    </div>
                  </div>
                  <div className="camp-chevron">›</div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <div className="camp-root" ref={rootRef}>
      <button
        ref={btnRef}
        className={`camp-btn ${open ? "is-open" : ""}`}
        onClick={onToggle}
      >
        🔔
        {unreadCount > 0 && (
          <span className="camp-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && createPortal(popContent, document.body)}
    </div>
  );
}
