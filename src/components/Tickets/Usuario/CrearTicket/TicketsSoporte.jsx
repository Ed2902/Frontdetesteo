import { useEffect, useState, useContext } from "react";
import AuthContext from "../../../../context/AuthContext.jsx";

import { ORG_ID, fetchTicketMetaAndUsers, createTicketFull } from "./Service.js";

import "./CreTick.css";

const TicketsSoporte = () => {
  const { user } = useContext(AuthContext) || {};

  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [assignees, setAssignees] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    priorityId: "",
    statusId: "",
    assigneeType: "person", // 'person' | 'group'
    assigneeId: "",
    assigneeGroup: [], // array de ids de usuarios
  });

  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  console.log("🏢 ORG_ID =>", ORG_ID);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Agregar usuario seleccionado al grupo
  const handleAddToGroup = () => {
    if (!form.assigneeId) return;

    setForm((prev) => {
      const id = String(prev.assigneeId);
      if (prev.assigneeGroup.includes(id)) {
        return prev; // ya está en el grupo
      }
      return {
        ...prev,
        assigneeGroup: [...prev.assigneeGroup, id],
      };
    });
  };

  // Quitar usuario del grupo
  const handleRemoveFromGroup = (idToRemove) => {
    setForm((prev) => ({
      ...prev,
      assigneeGroup: prev.assigneeGroup.filter(
        (id) => String(id) !== String(idToRemove)
      ),
    }));
  };

  useEffect(() => {
    if (!user) {
      console.warn("⚠️ No hay usuario en contexto, no se cargan datos aún.");
      setLoadingData(false);
      return;
    }

    const run = async () => {
      try {
        setLoadingData(true);
        setError("");

        const { categories, priorities, statuses, assignees } =
          await fetchTicketMetaAndUsers(user);

        setCategories(categories || []);
        setPriorities(priorities || []);
        setStatuses(statuses || []);
        setAssignees(assignees || []);
      } catch (err) {
        console.error("🛑 Error en fetchData tickets soporte:", err);
        setError("No se pudieron cargar los datos para crear el ticket.");
      } finally {
        setLoadingData(false);
      }
    };

    run();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    try {
      setSubmitting(true);

      await createTicketFull(user, form);

      setSuccessMsg("✅ Ticket creado correctamente.");
      setForm({
        title: "",
        description: "",
        categoryId: "",
        priorityId: "",
        statusId: "",
        assigneeType: "person",
        assigneeId: "",
        assigneeGroup: [],
      });
    } catch (err) {
      console.error("🛑 Error en handleSubmit tickets soporte:", err);
      setError(err.message || "Ocurrió un error al crear el ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ts-page">
      <div className="ts-shell">
        {/* HEADER */}
        <header className="ts-header">
          <div className="ts-header__left">
            <h1 className="ts-title">Crear nueva tarea</h1>
            <p className="ts-subtitle">
              Registra un ticket de soporte y asígnalo a la persona o grupo
              correspondiente. Esto nos ayuda a dar seguimiento y medir tiempos
              de respuesta.
            </p>
          </div>

          <div className="ts-header__right">
            <div className="ts-org-badge">
              <span className="ts-org-badge__label">Organización</span>
              <span className="ts-org-badge__value">{ORG_ID || "—"}</span>
            </div>
          </div>
        </header>

        {/* CONTENIDO */}
        <div className="ts-card">
          {loadingData ? (
            <div className="ts-loading">
              <div className="ts-spinner" />
              <span>Cargando datos para crear el ticket...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="ts-form">
              {/* MENSAJES */}
              {error && (
                <div className="ts-alert ts-alert--error">{error}</div>
              )}

              {successMsg && (
                <div className="ts-alert ts-alert--success">
                  {successMsg}
                </div>
              )}

              <div className="ts-grid">
                {/* Columna izquierda */}
                <div className="ts-col">
                  <div className="ts-field">
                    <label htmlFor="ts-title" className="ts-label">
                      Título <span className="ts-label__required">*</span>
                    </label>
                    <input
                      id="ts-title"
                      type="text"
                      name="title"
                      className="ts-input"
                      value={form.title}
                      onChange={handleChange}
                      required
                      placeholder="Ej: Problema con impresora de recepción"
                    />
                  </div>

                  <div className="ts-field">
                    <label htmlFor="ts-description" className="ts-label">
                      Descripción{" "}
                      <span className="ts-label__required">*</span>
                    </label>
                    <textarea
                      id="ts-description"
                      name="description"
                      className="ts-textarea"
                      value={form.description}
                      onChange={handleChange}
                      required
                      placeholder="Describe el problema, área afectada y cualquier detalle importante..."
                    />
                    <p className="ts-help">
                      Sé lo más específico posible. Esto ayuda al equipo de
                      soporte a resolver más rápido.
                    </p>
                  </div>
                </div>

                {/* Columna derecha */}
                <div className="ts-col">
                  <div className="ts-field">
                    <label htmlFor="ts-category" className="ts-label">
                      Categoría <span className="ts-label__required">*</span>
                    </label>
                    <select
                      id="ts-category"
                      name="categoryId"
                      className="ts-select"
                      value={form.categoryId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selecciona una categoría</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name || cat.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="ts-field-group">
                    <div className="ts-field">
                      <label htmlFor="ts-priority" className="ts-label">
                        Prioridad{" "}
                        <span className="ts-label__required">*</span>
                      </label>
                      <select
                        id="ts-priority"
                        name="priorityId"
                        className="ts-select"
                        value={form.priorityId}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Selecciona una prioridad</option>
                        {priorities.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name || p.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="ts-field">
                      <label htmlFor="ts-status" className="ts-label">
                        Estado <span className="ts-label__required">*</span>
                      </label>
                      <select
                        id="ts-status"
                        name="statusId"
                        className="ts-select"
                        value={form.statusId}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Selecciona un estado</option>
                        {statuses.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.name || s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Tipo de asignación */}
                  <div className="ts-field">
                    <span className="ts-label">Tipo de asignación</span>
                    <div className="ts-radio-group">
                      <label className="ts-radio">
                        <input
                          type="radio"
                          name="assigneeType"
                          value="person"
                          checked={form.assigneeType === "person"}
                          onChange={handleChange}
                        />
                        <span>Persona</span>
                      </label>
                      <label className="ts-radio">
                        <input
                          type="radio"
                          name="assigneeType"
                          value="group"
                          checked={form.assigneeType === "group"}
                          onChange={handleChange}
                        />
                        <span>Grupo</span>
                      </label>
                    </div>
                  </div>

                  {/* Asignar / Grupo */}
                  <div className="ts-field">
                    <label htmlFor="ts-assignee" className="ts-label">
                      {form.assigneeType === "person"
                        ? "Asignar a"
                        : "Agregar integrante al grupo"}
                    </label>

                    <div className="ts-assignee-row">
                      <select
                        id="ts-assignee"
                        name="assigneeId"
                        className="ts-select"
                        value={form.assigneeId}
                        onChange={handleChange}
                      >
                        <option value="">
                          {form.assigneeType === "person"
                            ? "Sin asignar (queda para el creador)"
                            : "Selecciona un usuario para agregar"}
                        </option>
                        {assignees.map((u) => (
                          <option key={u.id_usuario} value={u.id_usuario}>
                            {u.username || u.nombre || u.email}
                          </option>
                        ))}
                      </select>

                      {form.assigneeType === "group" && (
                        <button
                          type="button"
                          className="ts-btn-secondary"
                          onClick={handleAddToGroup}
                        >
                          Agregar
                        </button>
                      )}
                    </div>

                    {form.assigneeType === "person" && (
                      <p className="ts-help">
                        Puedes dejarlo vacío para que el ticket quede asignado
                        al usuario que lo crea.
                      </p>
                    )}

                    {form.assigneeType === "group" && (
                      <>
                        <p className="ts-help">
                          El ticket se asignará a todos los integrantes del
                          grupo seleccionado.
                        </p>
                        {form.assigneeGroup.length > 0 && (
                          <ul className="ts-group-list">
                            {form.assigneeGroup.map((id) => {
                              const u = assignees.find(
                                (usr) =>
                                  String(usr.id_usuario) === String(id)
                              );
                              const label =
                                u?.username || u?.nombre || u?.email || id;
                              return (
                                <li key={id} className="ts-group-item">
                                  <span>{label}</span>
                                  <button
                                    type="button"
                                    className="ts-group-remove"
                                    onClick={() =>
                                      handleRemoveFromGroup(id)
                                    }
                                  >
                                    Quitar
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="ts-actions">
                <button
                  type="submit"
                  className="ts-submit"
                  disabled={submitting}
                >
                  {submitting ? "Creando..." : "Crear ticket"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketsSoporte;
