import React, { useContext, useEffect, useState } from "react";
import AuthContext from "../../../context/AuthContext";
import "./Catalogos.css";

import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchPriorities,
  createPriority,
  updatePriority,
  deletePriority,
  fetchStatuses,
  createStatus,
  updateStatus,
  deleteStatus,
} from "../Usuario/Catalogos.service.js";

export default function Catalogos() {
  // Igual que en MisTareas
  const { user, token } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState("categories");
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Formularios
  const [categoryForm, setCategoryForm] = useState({
    id: null,
    name: "",
    description: "",
    color: "#0ea5e9",
    active: true,
  });

  const [priorityForm, setPriorityForm] = useState({
    id: null,
    name: "",
    description: "",
    color: "#22c55e",
    weight: 1,
    active: true,
  });

  const [statusForm, setStatusForm] = useState({
    id: null,
    name: "",
    description: "",
    color: "#0f172a",
    order: 1,
    isClosed: false,
    active: true,
  });

  // ===============================
  // CARGA INICIAL
  // ===============================
  useEffect(() => {
    // 👉 Igual que en MisTareas: si no hay user o token, no llamamos nada
    if (!user || !token) {
      console.warn("⚠️ Falta user o token, no se cargan catálogos todavía");
      return;
    }

    const loadAll = async () => {
      try {
        setLoading(true);
        setError("");
        const [cats, prios, stats] = await Promise.all([
          fetchCategories(token),
          fetchPriorities(token),
          fetchStatuses(token),
        ]);
        setCategories(cats || []);
        setPriorities(prios || []);
        setStatuses(stats || []);
      } catch (e) {
        console.error(e);
        setError("No se pudieron cargar los catálogos.");
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [user, token]);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 2500);
  };

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 3500);
  };

  // Si no hay token, avisamos (igual estilo que usas en otras vistas)
  if (!token) {
    return (
      <div className="cat-layout">
        <div className="cat-card">
          <h2>Catálogos de Tickets</h2>
          <p>Debes iniciar sesión para gestionar los catálogos.</p>
        </div>
      </div>
    );
  }

  // ===============================
  // CATEGORÍAS CRUD
  // ===============================
  const handleEditCategory = (item) => {
    setCategoryForm({
      id: item._id,
      name: item.name || "",
      description: item.description || "",
      color: item.color || "#0ea5e9",
      active: item.active ?? true,
    });
    setActiveTab("categories");
  };

  const handleResetCategoryForm = () => {
    setCategoryForm({
      id: null,
      name: "",
      description: "",
      color: "#0ea5e9",
      active: true,
    });
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");

      if (categoryForm.id) {
        await updateCategory(token, categoryForm.id, categoryForm);
        showSuccess("Categoría actualizada correctamente.");
      } else {
        await createCategory(token, categoryForm);
        showSuccess("Categoría creada correctamente.");
      }

      const cats = await fetchCategories(token);
      setCategories(cats || []);
      handleResetCategoryForm();
    } catch (err) {
      console.error(err);
      showError("Error al guardar la categoría.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("¿Eliminar esta categoría?")) return;
    try {
      setLoading(true);
      setError("");
      await deleteCategory(token, id);
      const cats = await fetchCategories(token);
      setCategories(cats || []);
      showSuccess("Categoría eliminada.");
    } catch (err) {
      console.error(err);
      showError("Error al eliminar la categoría.");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // PRIORIDADES CRUD
  // ===============================
  const handleEditPriority = (item) => {
    setPriorityForm({
      id: item._id,
      name: item.name || "",
      description: item.description || "",
      color: item.color || "#22c55e",
      weight: item.weight ?? 1,
      active: item.active ?? true,
    });
    setActiveTab("priorities");
  };

  const handleResetPriorityForm = () => {
    setPriorityForm({
      id: null,
      name: "",
      description: "",
      color: "#22c55e",
      weight: 1,
      active: true,
    });
  };

  const handleSubmitPriority = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");

      if (priorityForm.id) {
        await updatePriority(token, priorityForm.id, priorityForm);
        showSuccess("Prioridad actualizada correctamente.");
      } else {
        await createPriority(token, priorityForm);
        showSuccess("Prioridad creada correctamente.");
      }

      const prios = await fetchPriorities(token);
      setPriorities(prios || []);
      handleResetPriorityForm();
    } catch (err) {
      console.error(err);
      showError("Error al guardar la prioridad.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePriority = async (id) => {
    if (!window.confirm("¿Eliminar esta prioridad?")) return;
    try {
      setLoading(true);
      setError("");
      await deletePriority(token, id);
      const prios = await fetchPriorities(token);
      setPriorities(prios || []);
      showSuccess("Prioridad eliminada.");
    } catch (err) {
      console.error(err);
      showError("Error al eliminar la prioridad.");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // ESTADOS CRUD
  // ===============================
  const handleEditStatus = (item) => {
    setStatusForm({
      id: item._id,
      name: item.name || "",
      description: item.description || "",
      color: item.color || "#0f172a",
      order: item.order ?? 1,
      isClosed: !!item.isClosed,
      active: item.active ?? true,
    });
    setActiveTab("statuses");
  };

  const handleResetStatusForm = () => {
    setStatusForm({
      id: null,
      name: "",
      description: "",
      color: "#0f172a",
      order: 1,
      isClosed: false,
      active: true,
    });
  };

  const handleSubmitStatus = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");

      if (statusForm.id) {
        await updateStatus(token, statusForm.id, statusForm);
        showSuccess("Estado actualizado correctamente.");
      } else {
        await createStatus(token, statusForm);
        showSuccess("Estado creado correctamente.");
      }

      const stats = await fetchStatuses(token);
      setStatuses(stats || []);
      handleResetStatusForm();
    } catch (err) {
      console.error(err);
      showError("Error al guardar el estado.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStatus = async (id) => {
    if (!window.confirm("¿Eliminar este estado?")) return;
    try {
      setLoading(true);
      setError("");
      await deleteStatus(token, id);
      const stats = await fetchStatuses(token);
      setStatuses(stats || []);
      showSuccess("Estado eliminado.");
    } catch (err) {
      console.error(err);
      showError("Error al eliminar el estado.");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // RENDER
  // ===============================
  return (
    <div className="cat-layout">
      <div className="cat-card">
        <div className="cat-header">
          <h1 className="cat-title">Catálogos de Tickets</h1>
          <p className="cat-subtitle">
            Administra categorías, prioridades y estados usando el mismo token
            de autenticación que en MisTareas.
          </p>
        </div>

        <div className="cat-tabs">
          <button
            className={`cat-tab ${activeTab === "categories" ? "is-active" : ""}`}
            onClick={() => setActiveTab("categories")}
          >
            Categorías
          </button>
          <button
            className={`cat-tab ${activeTab === "priorities" ? "is-active" : ""}`}
            onClick={() => setActiveTab("priorities")}
          >
            Prioridades
          </button>
          <button
            className={`cat-tab ${activeTab === "statuses" ? "is-active" : ""}`}
            onClick={() => setActiveTab("statuses")}
          >
            Estados
          </button>
        </div>

        {loading && <div className="cat-badge cat-badge--loading">Cargando...</div>}
        {error && <div className="cat-badge cat-badge--error">{error}</div>}
        {success && <div className="cat-badge cat-badge--success">{success}</div>}

        {/* ===== CATEGORÍAS ===== */}
        {activeTab === "categories" && (
          <div className="cat-section">
            <form className="cat-form" onSubmit={handleSubmitCategory}>
              <div className="cat-form-row">
                <div className="cat-field">
                  <label>Nombre</label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="cat-field">
                  <label>Color</label>
                  <input
                    type="color"
                    value={categoryForm.color}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, color: e.target.value })
                    }
                  />
                </div>
                <div className="cat-field cat-field--checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={categoryForm.active}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          active: e.target.checked,
                        })
                      }
                    />
                    Activa
                  </label>
                </div>
              </div>
              <div className="cat-field">
                <label>Descripción</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      description: e.target.value,
                    })
                  }
                  rows={2}
                />
              </div>
              <div className="cat-form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleResetCategoryForm}
                >
                  Limpiar
                </button>
                <button type="submit" className="btn-primary">
                  {categoryForm.id ? "Actualizar categoría" : "Crear categoría"}
                </button>
              </div>
            </form>

            <div className="cat-table-wrapper">
              <table className="cat-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Color</th>
                    <th>Activa</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat._id}>
                      <td>{cat.name}</td>
                      <td>{cat.description}</td>
                      <td>
                        <span
                          className="cat-color-dot"
                          style={{ backgroundColor: cat.color || "#0ea5e9" }}
                        />
                        {cat.color}
                      </td>
                      <td>{cat.active ? "Sí" : "No"}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => handleEditCategory(cat)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => handleDeleteCategory(cat._id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={5} className="cat-empty">
                        No hay categorías registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== PRIORIDADES ===== */}
        {activeTab === "priorities" && (
          <div className="cat-section">
            <form className="cat-form" onSubmit={handleSubmitPriority}>
              <div className="cat-form-row">
                <div className="cat-field">
                  <label>Nombre</label>
                  <input
                    type="text"
                    value={priorityForm.name}
                    onChange={(e) =>
                      setPriorityForm({ ...priorityForm, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="cat-field">
                  <label>Peso</label>
                  <input
                    type="number"
                    min="1"
                    value={priorityForm.weight}
                    onChange={(e) =>
                      setPriorityForm({
                        ...priorityForm,
                        weight: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="cat-field">
                  <label>Color</label>
                  <input
                    type="color"
                    value={priorityForm.color}
                    onChange={(e) =>
                      setPriorityForm({ ...priorityForm, color: e.target.value })
                    }
                  />
                </div>
                <div className="cat-field cat-field--checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={priorityForm.active}
                      onChange={(e) =>
                        setPriorityForm({
                          ...priorityForm,
                          active: e.target.checked,
                        })
                      }
                    />
                    Activa
                  </label>
                </div>
              </div>
              <div className="cat-field">
                <label>Descripción</label>
                <textarea
                  value={priorityForm.description}
                  onChange={(e) =>
                    setPriorityForm({
                      ...priorityForm,
                      description: e.target.value,
                    })
                  }
                  rows={2}
                />
              </div>

              <div className="cat-form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleResetPriorityForm}
                >
                  Limpiar
                </button>
                <button type="submit" className="btn-primary">
                  {priorityForm.id ? "Actualizar prioridad" : "Crear prioridad"}
                </button>
              </div>
            </form>

            <div className="cat-table-wrapper">
              <table className="cat-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Peso</th>
                    <th>Color</th>
                    <th>Activa</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {priorities.map((prio) => (
                    <tr key={prio._id}>
                      <td>{prio.name}</td>
                      <td>{prio.description}</td>
                      <td>{prio.weight}</td>
                      <td>
                        <span
                          className="cat-color-dot"
                          style={{ backgroundColor: prio.color || "#22c55e" }}
                        />
                        {prio.color}
                      </td>
                      <td>{prio.active ? "Sí" : "No"}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => handleEditPriority(prio)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => handleDeletePriority(prio._id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {priorities.length === 0 && (
                    <tr>
                      <td colSpan={6} className="cat-empty">
                        No hay prioridades registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== ESTADOS ===== */}
        {activeTab === "statuses" && (
          <div className="cat-section">
            <form className="cat-form" onSubmit={handleSubmitStatus}>
              <div className="cat-form-row">
                <div className="cat-field">
                  <label>Nombre</label>
                  <input
                    type="text"
                    value={statusForm.name}
                    onChange={(e) =>
                      setStatusForm({ ...statusForm, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="cat-field">
                  <label>Orden</label>
                  <input
                    type="number"
                    min="1"
                    value={statusForm.order}
                    onChange={(e) =>
                      setStatusForm({
                        ...statusForm,
                        order: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="cat-field">
                  <label>Color</label>
                  <input
                    type="color"
                    value={statusForm.color}
                    onChange={(e) =>
                      setStatusForm({ ...statusForm, color: e.target.value })
                    }
                  />
                </div>
                <div className="cat-field cat-field--checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={statusForm.isClosed}
                      onChange={(e) =>
                        setStatusForm({
                          ...statusForm,
                          isClosed: e.target.checked,
                        })
                      }
                    />
                    Cierra ticket
                  </label>
                </div>
                <div className="cat-field cat-field--checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={statusForm.active}
                      onChange={(e) =>
                        setStatusForm({
                          ...statusForm,
                          active: e.target.checked,
                        })
                      }
                    />
                    Activo
                  </label>
                </div>
              </div>
              <div className="cat-field">
                <label>Descripción</label>
                <textarea
                  value={statusForm.description}
                  onChange={(e) =>
                    setStatusForm({
                      ...statusForm,
                      description: e.target.value,
                    })
                  }
                  rows={2}
                />
              </div>

              <div className="cat-form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleResetStatusForm}
                >
                  Limpiar
                </button>
                <button type="submit" className="btn-primary">
                  {statusForm.id ? "Actualizar estado" : "Crear estado"}
                </button>
              </div>
            </form>

            <div className="cat-table-wrapper">
              <table className="cat-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Orden</th>
                    <th>Color</th>
                    <th>Cierra</th>
                    <th>Activo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {statuses.map((st) => (
                    <tr key={st._id}>
                      <td>{st.name}</td>
                      <td>{st.description}</td>
                      <td>{st.order}</td>
                      <td>
                        <span
                          className="cat-color-dot"
                          style={{ backgroundColor: st.color || "#0f172a" }}
                        />
                        {st.color}
                      </td>
                      <td>{st.isClosed ? "Sí" : "No"}</td>
                      <td>{st.active ? "Sí" : "No"}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => handleEditStatus(st)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => handleDeleteStatus(st._id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {statuses.length === 0 && (
                    <tr>
                      <td colSpan={7} className="cat-empty">
                        No hay estados registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
