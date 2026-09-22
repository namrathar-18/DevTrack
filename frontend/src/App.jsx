import { useEffect, useState, useCallback } from "react";
import {
    getTasks,
    createTask,
    updateTask,
    deleteTask
} from "./services/api";

import "./App.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_ORDER = ["pending", "in-progress", "completed"];

const STATUS_META = {
    pending:     { label: "Pending",     icon: "⏳", cls: "badge-pending" },
    "in-progress": { label: "In Progress", icon: "🔄", cls: "badge-inprogress" },
    completed:   { label: "Completed",   icon: "✅", cls: "badge-completed" }
};

const PRIORITY_META = {
    high:   { label: "High",   icon: "🔴", cls: "badge-priority-high" },
    medium: { label: "Medium", icon: "🟡", cls: "badge-priority-medium" },
    low:    { label: "Low",    icon: "🟢", cls: "badge-priority-low" }
};

function isOverdue(task) {
    if (!task.dueDate || task.status === "completed") return false;
    return new Date(task.dueDate) < new Date();
}

function formatDate(dateStr) {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

let toastIdCounter = 0;

// ─── Toast System ─────────────────────────────────────────────────────────────

function useToasts() {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((msg, type = "success") => {
        const id = ++toastIdCounter;
        setToasts(prev => [...prev, { id, msg, type, removing: false }]);
        setTimeout(() => {
            setToasts(prev =>
                prev.map(t => t.id === id ? { ...t, removing: true } : t)
            );
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 280);
        }, 3500);
    }, []);

    return { toasts, addToast };
}

// ─── Toast Component ──────────────────────────────────────────────────────────

function ToastContainer({ toasts }) {
    const icons = { success: "✅", error: "❌", info: "ℹ️" };
    if (!toasts.length) return null;
    return (
        <div className="toast-container" aria-live="polite">
            {toasts.map(t => (
                <div
                    key={t.id}
                    className={`toast toast-${t.type}${t.removing ? " removing" : ""}`}
                    role="alert"
                >
                    <span className="toast-icon">{icons[t.type]}</span>
                    <span className="toast-msg">{t.msg}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

function ConfirmModal({ title, message, onConfirm, onCancel }) {
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-icon">🗑️</div>
                <h3>{title}</h3>
                <p>{message}</p>
                <div className="modal-actions">
                    <button className="btn-ghost" onClick={onCancel}>Cancel</button>
                    <button className="btn-danger" onClick={onConfirm}>Delete Task</button>
                </div>
            </div>
        </div>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon, value, label, color }) {
    return (
        <div className="stat-card" style={{ "--stat-color": color }}>
            <span className="stat-icon">{icon}</span>
            <span className="stat-value">{value}</span>
            <span className="stat-label">{label}</span>
        </div>
    );
}

// ─── Inline Edit Form ─────────────────────────────────────────────────────────

function InlineEditForm({ task, onSave, onCancel }) {
    const [editData, setEditData] = useState({
        title:       task.title,
        description: task.description || "",
        priority:    task.priority,
        dueDate:     task.dueDate
            ? new Date(task.dueDate).toISOString().split("T")[0]
            : ""
    });

    const handleChange = e => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        if (!editData.title.trim()) return;
        onSave({
            ...editData,
            dueDate: editData.dueDate || null
        });
    };

    return (
        <div className="inline-edit">
            <input
                type="text"
                name="title"
                value={editData.title}
                onChange={handleChange}
                placeholder="Task title"
                autoFocus
            />
            <textarea
                name="description"
                value={editData.description}
                onChange={handleChange}
                placeholder="Description (optional)"
            />
            <div className="inline-edit-row form-row">
                <select name="priority" value={editData.priority} onChange={handleChange}>
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                </select>
                <input
                    type="date"
                    name="dueDate"
                    value={editData.dueDate}
                    onChange={handleChange}
                />
            </div>
            <div className="inline-edit-actions">
                <button className="btn-primary" style={{ width: "auto", padding: "8px 18px", marginTop: 0 }} onClick={handleSave}>
                    💾 Save Changes
                </button>
                <button className="btn-ghost" onClick={onCancel}>Cancel</button>
            </div>
        </div>
    );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({ task, onStatusChange, onDelete, onSaveEdit }) {
    const [editing, setEditing] = useState(false);
    const overdue = isOverdue(task);
    const statusMeta = STATUS_META[task.status] || STATUS_META.pending;
    const priorityMeta = PRIORITY_META[task.priority] || PRIORITY_META.medium;

    const handleSave = async (data) => {
        await onSaveEdit(task._id, data);
        setEditing(false);
    };

    return (
        <article className={`task-card priority-${task.priority}`}>
            <div className="task-priority-bar" />
            <div className="task-body">
                <div className="task-content">
                    {editing ? (
                        <InlineEditForm
                            task={task}
                            onSave={handleSave}
                            onCancel={() => setEditing(false)}
                        />
                    ) : (
                        <>
                            <div className="task-title-row">
                                <h3 className={task.status === "completed" ? "completed-text" : ""}>
                                    {task.title}
                                </h3>
                                <span className={`badge ${statusMeta.cls}`}>
                                    {statusMeta.icon} {statusMeta.label}
                                </span>
                                <span className={`badge ${priorityMeta.cls}`}>
                                    {priorityMeta.label}
                                </span>
                            </div>

                            {task.description && (
                                <p className="task-description">{task.description}</p>
                            )}

                            <div className="task-meta">
                                <span className="task-meta-item">
                                    <span className="icon">📅</span>
                                    Created {formatDate(task.createdAt)}
                                </span>
                                {task.dueDate && (
                                    <span className={`task-meta-item${overdue ? " overdue" : ""}`}>
                                        <span className="icon">{overdue ? "🚨" : "🗓️"}</span>
                                        Due {formatDate(task.dueDate)}
                                        {overdue && " (Overdue)"}
                                    </span>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {!editing && (
                    <div className="task-actions">
                        <button
                            className="btn-icon btn-secondary"
                            title="Edit task"
                            onClick={() => setEditing(true)}
                        >
                            ✏️
                        </button>
                        <button
                            className="btn-secondary"
                            title="Cycle status"
                            onClick={() => onStatusChange(task)}
                            style={{ fontSize: "12px", padding: "7px 10px" }}
                        >
                            🔄 Status
                        </button>
                        <button
                            className="btn-icon btn-danger"
                            title="Delete task"
                            onClick={() => onDelete(task._id, task.title)}
                        >
                            🗑️
                        </button>
                    </div>
                )}
            </div>
        </article>
    );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

function App() {
    const [tasks, setTasks]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiOk, setApiOk]     = useState(true);

    // Filter / search state
    const [search,         setSearch]         = useState("");
    const [filterStatus,   setFilterStatus]   = useState("all");
    const [filterPriority, setFilterPriority] = useState("all");

    // Delete modal state
    const [deleteTarget, setDeleteTarget] = useState(null); // { id, title }

    const { toasts, addToast } = useToasts();

    // Create form
    const [formData, setFormData] = useState({
        title:       "",
        description: "",
        status:      "pending",
        priority:    "medium",
        dueDate:     ""
    });

    // ── Data loading ──────────────────────────────────────────────────────────

    const loadTasks = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getTasks();
            setTasks(response.data);
            setApiOk(true);
        } catch (err) {
            console.error(err);
            setApiOk(false);
            addToast("Unable to load tasks. Is the backend running?", "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    // ── Form handlers ─────────────────────────────────────────────────────────

    const handleChange = e => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async e => {
        e.preventDefault();
        if (!formData.title.trim()) return;

        try {
            await createTask({
                ...formData,
                dueDate: formData.dueDate || null
            });
            setFormData({ title: "", description: "", status: "pending", priority: "medium", dueDate: "" });
            await loadTasks();
            addToast(`Task "${formData.title}" created!`, "success");
        } catch (err) {
            console.error(err);
            addToast("Unable to create task.", "error");
        }
    };

    // ── Status cycling ────────────────────────────────────────────────────────

    const handleStatusChange = async (task) => {
        try {
            const current = STATUS_ORDER.indexOf(task.status);
            const next    = STATUS_ORDER[(current + 1) % STATUS_ORDER.length];
            await updateTask(task._id, { status: next });
            await loadTasks();
            addToast(`Status → ${STATUS_META[next].label}`, "info");
        } catch (err) {
            console.error(err);
            addToast("Unable to update task status.", "error");
        }
    };

    // ── Inline edit save ──────────────────────────────────────────────────────

    const handleSaveEdit = async (id, data) => {
        try {
            await updateTask(id, data);
            await loadTasks();
            addToast("Task updated successfully!", "success");
        } catch (err) {
            console.error(err);
            addToast("Unable to save changes.", "error");
        }
    };

    // ── Delete (with confirmation) ────────────────────────────────────────────

    const handleDeleteRequest = (id, title) => {
        setDeleteTarget({ id, title });
    };

    const handleDeleteConfirm = async () => {
        const { id, title } = deleteTarget;
        setDeleteTarget(null);
        try {
            await deleteTask(id);
            await loadTasks();
            addToast(`"${title}" deleted.`, "success");
        } catch (err) {
            console.error(err);
            addToast("Unable to delete task.", "error");
        }
    };

    // ── Stats ─────────────────────────────────────────────────────────────────

    const stats = {
        total:      tasks.length,
        pending:    tasks.filter(t => t.status === "pending").length,
        inProgress: tasks.filter(t => t.status === "in-progress").length,
        completed:  tasks.filter(t => t.status === "completed").length,
        overdue:    tasks.filter(isOverdue).length
    };

    // ── Filtered tasks ────────────────────────────────────────────────────────

    const filteredTasks = tasks.filter(task => {
        const matchSearch = !search.trim() ||
            task.title.toLowerCase().includes(search.toLowerCase()) ||
            (task.description || "").toLowerCase().includes(search.toLowerCase());

        const matchStatus   = filterStatus   === "all" || task.status   === filterStatus;
        const matchPriority = filterPriority === "all" || task.priority === filterPriority;

        return matchSearch && matchStatus && matchPriority;
    });

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="app">

            {/* ── Header ── */}
            <header className="header">
                <div className="header-brand">
                    <div className="header-logo">DT</div>
                    <div className="header-text">
                        <h1>DevTrack</h1>
                        <p>Task Management Dashboard</p>
                    </div>
                </div>

                <div className="header-right">
                    <span className={`api-status${apiOk ? "" : " error"}`}>
                        <span className="api-status-dot" />
                        {apiOk ? "API Connected" : "API Offline"}
                    </span>
                </div>
            </header>

            {/* ── Main ── */}
            <main className="container">

                {/* Stats */}
                <div className="stats-grid">
                    <StatCard icon="📋" value={stats.total}      label="Total Tasks"   color="var(--accent-primary)" />
                    <StatCard icon="⏳" value={stats.pending}    label="Pending"        color="var(--status-pending)" />
                    <StatCard icon="🔄" value={stats.inProgress} label="In Progress"    color="var(--status-inprogress)" />
                    <StatCard icon="✅" value={stats.completed}  label="Completed"      color="var(--status-completed)" />
                    <StatCard icon="🚨" value={stats.overdue}    label="Overdue"        color="var(--priority-high)" />
                </div>

                {/* Two-column layout */}
                <div className="page-layout">

                    {/* ── Left: Create Task Form ── */}
                    <aside>
                        <section className="card">
                            <h2 className="card-title">
                                <span className="card-title-icon">➕</span>
                                Create New Task
                            </h2>

                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label htmlFor="title">Task Title *</label>
                                    <input
                                        id="title"
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="Enter task title"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="description">Description</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Describe the task..."
                                        rows={3}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="status">Status</label>
                                        <select
                                            id="status"
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="priority">Priority</label>
                                        <select
                                            id="priority"
                                            name="priority"
                                            value={formData.priority}
                                            onChange={handleChange}
                                        >
                                            <option value="low">🟢 Low</option>
                                            <option value="medium">🟡 Medium</option>
                                            <option value="high">🔴 High</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="dueDate">Due Date</label>
                                    <input
                                        id="dueDate"
                                        type="date"
                                        name="dueDate"
                                        value={formData.dueDate}
                                        onChange={handleChange}
                                    />
                                </div>

                                <button type="submit" className="btn-primary">
                                    ➕ Add Task
                                </button>
                            </form>
                        </section>
                    </aside>

                    {/* ── Right: Filter + Task List ── */}
                    <div className="tasks-section">

                        {/* Filter Bar */}
                        <div className="filter-bar">
                            <div className="search-wrap">
                                <span className="search-icon">🔍</span>
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="Search tasks by title or description…"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    aria-label="Search tasks"
                                />
                            </div>

                            <div className="filter-row">
                                <div className="filter-chips">
                                    {[
                                        { value: "all",         label: "All",         cls: "" },
                                        { value: "pending",     label: "⏳ Pending",  cls: "chip-pending" },
                                        { value: "in-progress", label: "🔄 In Progress", cls: "chip-inprogress" },
                                        { value: "completed",   label: "✅ Completed", cls: "chip-completed" }
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            className={`filter-chip ${opt.cls}${filterStatus === opt.value ? " active" : ""}`}
                                            onClick={() => setFilterStatus(opt.value)}
                                            type="button"
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="filter-divider" />

                                <div className="filter-chips">
                                    {[
                                        { value: "all",    label: "All" },
                                        { value: "high",   label: "🔴 High",   cls: "chip-high" },
                                        { value: "medium", label: "🟡 Medium", cls: "chip-medium" },
                                        { value: "low",    label: "🟢 Low",    cls: "chip-low" }
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            className={`filter-chip ${opt.cls || ""}${filterPriority === opt.value ? " active" : ""}`}
                                            onClick={() => setFilterPriority(opt.value)}
                                            type="button"
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Section header */}
                        <div className="section-header">
                            <h2>Tasks</h2>
                            <span className="task-count-badge">
                                {filteredTasks.length} of {tasks.length} task{tasks.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                        {/* Task list */}
                        {loading ? (
                            <div className="loading-wrap">
                                <div className="spinner" />
                                <span>Loading tasks…</span>
                            </div>
                        ) : filteredTasks.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">
                                    {tasks.length === 0 ? "📋" : "🔍"}
                                </div>
                                <h3>
                                    {tasks.length === 0
                                        ? "No tasks yet"
                                        : "No matching tasks"}
                                </h3>
                                <p>
                                    {tasks.length === 0
                                        ? "Create your first task using the form on the left."
                                        : "Try adjusting your search or filter settings."}
                                </p>
                            </div>
                        ) : (
                            <div className="task-list">
                                {filteredTasks.map(task => (
                                    <TaskCard
                                        key={task._id}
                                        task={task}
                                        onStatusChange={handleStatusChange}
                                        onDelete={handleDeleteRequest}
                                        onSaveEdit={handleSaveEdit}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* ── Delete Confirmation Modal ── */}
            {deleteTarget && (
                <ConfirmModal
                    title="Delete Task"
                    message={`Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.`}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}

            {/* ── Toast Notifications ── */}
            <ToastContainer toasts={toasts} />
        </div>
    );
}

export default App;