import { useEffect, useState, useCallback } from "react";
import { getTasks, createTask, updateTask, deleteTask } from "./services/api";
import "./App.css";

// ─── SVG Icon System ──────────────────────────────────────────────────────────
// All icons use a 16×16 viewBox, no fill, stroke="currentColor"

const PATHS = {
    task:     "M5.5 7.5l2 2 3.5-4M2 3h12v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3z",
    plus:     "M8 3v10M3 8h10",
    pencil:   "M10.5 2.5l3 3-8.5 8.5H2v-3L10.5 2.5z",
    trash:    "M3 5h10M6 5V3.5h4V5m-5 0v7a1 1 0 001 1h4a1 1 0 001-1V5",
    search:   "M11 11l2.5 2.5M7 12a5 5 0 100-10 5 5 0 000 10z",
    x:        "M3 3l10 10M13 3L3 13",
    check:    "M3 8l3.5 3.5L13 5",
    calendar: "M2 4.5h12M5 2v3M11 2v3M3 2.5h10a.5.5 0 01.5.5v10a.5.5 0 01-.5.5H3a.5.5 0 01-.5-.5V3a.5.5 0 01.5-.5z",
    clock:    "M8 2a6 6 0 100 12A6 6 0 008 2zM8 5v3.5l2.5 1.5",
    alert:    "M8 5.5v4M8 11.5v.5M2 13.5h12L8 2.5 2 13.5z",
    arrow:    "M3 8h10M9 5l3 3-3 3",
    bar:      "M3 13h2V8H3zM7 13h2V5H7zM11 13h2V9h-2",
    list:     "M3 5h10M3 8h10M3 11h6",
    save:     "M2.5 2.5h8l3 3v8a.5.5 0 01-.5.5h-10a.5.5 0 01-.5-.5v-10a.5.5 0 01.5-.5zM9.5 2.5v4h-5v-4M5 9.5h6",
    filter:   "M2 4.5h12M4 8h8M6.5 11.5h3",
};

function Icon({ name, size = 14, className = "" }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <path d={PATHS[name] ?? ""} />
        </svg>
    );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_NEXT = {
    pending:      "in-progress",
    "in-progress":"completed",
    completed:    "pending",
};

const STATUS_CFG = {
    pending:       { label: "Pending",     cls: "s-pending" },
    "in-progress": { label: "In Progress", cls: "s-inprogress" },
    completed:     { label: "Completed",   cls: "s-completed" },
};

const PRIORITY_CFG = {
    high:   { label: "High",   stripe: "tc-stripe-high",   pind: "pind-high",   pdot: "pdot-high",   ptxt: "pri-high" },
    medium: { label: "Medium", stripe: "tc-stripe-medium", pind: "pind-medium", pdot: "pdot-medium", ptxt: "pri-medium" },
    low:    { label: "Low",    stripe: "tc-stripe-low",    pind: "pind-low",    pdot: "pdot-low",    ptxt: "pri-low" },
};

function isOverdue(t) {
    return t.dueDate && t.status !== "completed" && new Date(t.dueDate) < new Date();
}

function fmtDate(d) {
    if (!d) return null;
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Toast hook ───────────────────────────────────────────────────────────────

let _tid = 0;

function useToasts() {
    const [toasts, setToasts] = useState([]);

    const push = useCallback((message, type = "success") => {
        const id = ++_tid;
        setToasts(p => [...p, { id, message, type }]);
        setTimeout(() => {
            setToasts(p => p.map(t => t.id === id ? { ...t, exiting: true } : t));
            setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 250);
        }, 3600);
    }, []);

    return { toasts, push };
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
    const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending;
    return (
        <span className={`sbadge ${cfg.cls}`}>
            <span className="sbadge-dot" />
            {cfg.label}
        </span>
    );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function Stat({ icon, num, label, variant }) {
    return (
        <div className={`stat stat-${variant}`}>
            <div className="stat-ico">
                <Icon name={icon} size={15} />
            </div>
            <div className="stat-info">
                <span className="stat-num">{num}</span>
                <span className="stat-lbl">{label}</span>
            </div>
        </div>
    );
}

// ─── Inline Edit ─────────────────────────────────────────────────────────────

function InlineEdit({ task, onSave, onCancel }) {
    const [d, setD] = useState({
        title:       task.title,
        description: task.description ?? "",
        priority:    task.priority,
        dueDate:     task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
    });

    const set = (k, v) => setD(p => ({ ...p, [k]: v }));

    const save = () => {
        if (!d.title.trim()) return;
        onSave({ ...d, dueDate: d.dueDate || null });
    };

    return (
        <div className="ie-wrap">
            <input
                className="ie-input"
                value={d.title}
                onChange={e => set("title", e.target.value)}
                placeholder="Task title"
                autoFocus
            />
            <textarea
                className="ie-textarea"
                value={d.description}
                onChange={e => set("description", e.target.value)}
                placeholder="Description (optional)"
                rows={2}
            />
            <div className="ie-row">
                <select className="ie-select" value={d.priority} onChange={e => set("priority", e.target.value)}>
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                </select>
                <input
                    className="ie-date"
                    type="date"
                    value={d.dueDate}
                    onChange={e => set("dueDate", e.target.value)}
                />
            </div>
            <div className="ie-actions">
                <button className="btn-sm btn-primary" onClick={save}>
                    <Icon name="save" size={12} /> Save
                </button>
                <button className="btn-sm btn-ghost" onClick={onCancel}>
                    Cancel
                </button>
            </div>
        </div>
    );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({ task, onStatusChange, onDelete, onEdit }) {
    const [editing, setEditing] = useState(false);
    const overdue  = isOverdue(task);
    const pcfg     = PRIORITY_CFG[task.priority] ?? PRIORITY_CFG.medium;

    const handleSave = async data => {
        await onEdit(task._id, data);
        setEditing(false);
    };

    return (
        <div className="task-card">
            <div className={`tc-stripe ${pcfg.stripe}`} />
            <div className="tc-body">
                {editing ? (
                    <InlineEdit task={task} onSave={handleSave} onCancel={() => setEditing(false)} />
                ) : (
                    <>
                        <div className="tc-top">
                            <div className="tc-title-area">
                                <div className="tc-title-row">
                                    <span className={`pind ${pcfg.pind}`} />
                                    <h3 className={`tc-title${task.status === "completed" ? " done" : ""}`}>
                                        {task.title}
                                    </h3>
                                </div>
                                {task.description && (
                                    <p className="tc-desc">{task.description}</p>
                                )}
                            </div>
                            <StatusBadge status={task.status} />
                        </div>

                        <div className="tc-bottom">
                            <div className="tc-meta">
                                <span className="tc-meta-item">
                                    <Icon name="calendar" size={11} />
                                    {fmtDate(task.createdAt)}
                                </span>
                                {task.dueDate && (
                                    <span className={`tc-meta-item${overdue ? " overdue" : ""}`}>
                                        <Icon name={overdue ? "alert" : "clock"} size={11} />
                                        Due {fmtDate(task.dueDate)}
                                        {overdue && " · Overdue"}
                                    </span>
                                )}
                                <span className={`tc-priority-text ${pcfg.ptxt}`}>
                                    {pcfg.label}
                                </span>
                            </div>

                            <div className="tc-actions">
                                <button
                                    className="btn-sm btn-ghost"
                                    onClick={() => setEditing(true)}
                                    title="Edit"
                                >
                                    <Icon name="pencil" size={12} />
                                    Edit
                                </button>
                                <button
                                    className="btn-sm btn-ghost"
                                    onClick={() => onStatusChange(task)}
                                    title="Advance status"
                                >
                                    <Icon name="arrow" size={12} />
                                    Status
                                </button>
                                <button
                                    className="btn-sm btn-danger"
                                    onClick={() => onDelete(task._id, task.title)}
                                    title="Delete"
                                >
                                    <Icon name="trash" size={12} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

function ConfirmModal({ taskTitle, onConfirm, onCancel }) {
    return (
        <div className="overlay" onClick={onCancel}>
            <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
                <div className="modal-ico-wrap">
                    <Icon name="trash" size={18} />
                </div>
                <h3>Delete Task</h3>
                <p className="modal-desc">
                    You are about to permanently delete{" "}
                    <strong>"{taskTitle}"</strong>. This cannot be undone.
                </p>
                <div className="modal-footer">
                    <button className="btn-md btn-ghost" onClick={onCancel}>Cancel</button>
                    <button className="btn-md btn-danger-fill" onClick={onConfirm}>Delete</button>
                </div>
            </div>
        </div>
    );
}

// ─── Toasts ───────────────────────────────────────────────────────────────────

function ToastStack({ toasts }) {
    const iconMap = { success: "check", error: "x", info: "arrow" };
    return (
        <div className="toast-stack" aria-live="polite">
            {toasts.map(t => (
                <div
                    key={t.id}
                    className={`toast toast-${t.type}${t.exiting ? " toast-exit" : ""}`}
                    role="alert"
                >
                    <Icon name={iconMap[t.type] ?? "check"} size={13} />
                    <span>{t.message}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

const STATUS_TABS = [
    { key: "all",          label: "All" },
    { key: "pending",      label: "Pending" },
    { key: "in-progress",  label: "In Progress" },
    { key: "completed",    label: "Completed" },
];

const PRIORITY_TABS = [
    { key: "all",    label: "All" },
    { key: "high",   label: "High",   dot: "pdot-high" },
    { key: "medium", label: "Medium", dot: "pdot-medium" },
    { key: "low",    label: "Low",    dot: "pdot-low" },
];

export default function App() {
    const [tasks,    setTasks]   = useState([]);
    const [loading,  setLoading] = useState(true);
    const [apiOk,    setApiOk]   = useState(true);

    const [search,          setSearch]          = useState("");
    const [filterStatus,    setFilterStatus]    = useState("all");
    const [filterPriority,  setFilterPriority]  = useState("all");
    const [deleteTarget,    setDeleteTarget]    = useState(null);
    const [submitting,      setSubmitting]      = useState(false);

    const { toasts, push } = useToasts();

    const [form, setForm] = useState({
        title: "", description: "", status: "pending", priority: "medium", dueDate: ""
    });

    // ── Load ─────────────────────────────────────────────────────────────────

    const loadTasks = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getTasks();
            setTasks(res.data);
            setApiOk(true);
        } catch (err) {
            console.error(err);
            setApiOk(false);
            push("Unable to connect to the API.", "error");
        } finally {
            setLoading(false);
        }
    }, [push]);

    useEffect(() => { loadTasks(); }, [loadTasks]);

    // ── Create ────────────────────────────────────────────────────────────────

    const handleSubmit = async e => {
        e.preventDefault();
        if (!form.title.trim()) return;
        setSubmitting(true);
        try {
            await createTask({ ...form, dueDate: form.dueDate || null });
            const title = form.title;
            setForm({ title: "", description: "", status: "pending", priority: "medium", dueDate: "" });
            await loadTasks();
            push(`"${title}" created.`, "success");
        } catch (err) {
            console.error(err);
            push("Failed to create task.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Status cycle ──────────────────────────────────────────────────────────

    const handleStatusChange = async task => {
        try {
            const next = STATUS_NEXT[task.status] ?? "pending";
            await updateTask(task._id, { status: next });
            await loadTasks();
            push(`Status → ${STATUS_CFG[next]?.label}.`, "info");
        } catch (err) {
            console.error(err);
            push("Failed to update status.", "error");
        }
    };

    // ── Edit ──────────────────────────────────────────────────────────────────

    const handleEdit = async (id, data) => {
        try {
            await updateTask(id, data);
            await loadTasks();
            push("Task updated.", "success");
        } catch (err) {
            console.error(err);
            push("Failed to save changes.", "error");
        }
    };

    // ── Delete ────────────────────────────────────────────────────────────────

    const handleDeleteConfirm = async () => {
        const { id, title } = deleteTarget;
        setDeleteTarget(null);
        try {
            await deleteTask(id);
            await loadTasks();
            push(`"${title}" deleted.`, "success");
        } catch (err) {
            console.error(err);
            push("Failed to delete task.", "error");
        }
    };

    // ── Derived ───────────────────────────────────────────────────────────────

    const stats = {
        total:      tasks.length,
        pending:    tasks.filter(t => t.status === "pending").length,
        inProgress: tasks.filter(t => t.status === "in-progress").length,
        completed:  tasks.filter(t => t.status === "completed").length,
        overdue:    tasks.filter(isOverdue).length,
    };

    const filtered = tasks.filter(t => {
        const q = search.trim().toLowerCase();
        return (
            (!q || t.title.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q)) &&
            (filterStatus   === "all" || t.status   === filterStatus) &&
            (filterPriority === "all" || t.priority === filterPriority)
        );
    });

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="app">

            {/* Header */}
            <header className="header">
                <div className="hd-brand">
                    <div className="hd-logo">
                        <Icon name="task" size={14} />
                    </div>
                    <span className="hd-name">DevTrack</span>
                    <span className="hd-divider" />
                    <span className="hd-sub">Task Management</span>
                </div>

                <div className={`api-pill ${apiOk ? "connected" : "offline"}`}>
                    <span className="api-dot" />
                    {apiOk ? "API Connected" : "API Offline"}
                </div>
            </header>

            {/* Main */}
            <main className="main">

                {/* Stats */}
                <div className="stats-bar">
                    <Stat icon="bar"      num={stats.total}      label="Total"       variant="total" />
                    <Stat icon="list"     num={stats.pending}    label="Pending"     variant="pending" />
                    <Stat icon="arrow"    num={stats.inProgress} label="In Progress" variant="progress" />
                    <Stat icon="check"    num={stats.completed}  label="Completed"   variant="completed" />
                    <Stat icon="alert"    num={stats.overdue}    label="Overdue"     variant="overdue" />
                </div>

                {/* Workspace */}
                <div className="workspace">

                    {/* Sidebar — Create Form */}
                    <aside>
                        <div className="panel">
                            <div className="panel-hd">
                                <span className="panel-hd-icon">
                                    <Icon name="plus" size={14} />
                                </span>
                                <h2>New Task</h2>
                            </div>

                            <form className="form-body" onSubmit={handleSubmit}>
                                <div className="field">
                                    <label htmlFor="f-title">
                                        Title <span className="req">*</span>
                                    </label>
                                    <input
                                        id="f-title"
                                        type="text"
                                        name="title"
                                        value={form.title}
                                        onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                        placeholder="Enter task title"
                                        required
                                        autoComplete="off"
                                    />
                                </div>

                                <div className="field">
                                    <label htmlFor="f-desc">Description</label>
                                    <textarea
                                        id="f-desc"
                                        name="description"
                                        value={form.description}
                                        onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                        placeholder="Optional description…"
                                        rows={3}
                                    />
                                </div>

                                <div className="field-row">
                                    <div className="field">
                                        <label htmlFor="f-status">Status</label>
                                        <select
                                            id="f-status"
                                            name="status"
                                            value={form.status}
                                            onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>

                                    <div className="field">
                                        <label htmlFor="f-priority">Priority</label>
                                        <select
                                            id="f-priority"
                                            name="priority"
                                            value={form.priority}
                                            onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="field">
                                    <label htmlFor="f-due">Due Date</label>
                                    <input
                                        id="f-due"
                                        type="date"
                                        name="dueDate"
                                        value={form.dueDate}
                                        onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn-md btn-primary btn-full"
                                    disabled={submitting || !form.title.trim()}
                                >
                                    <Icon name="plus" size={14} />
                                    {submitting ? "Creating…" : "Create Task"}
                                </button>
                            </form>
                        </div>
                    </aside>

                    {/* Right — Task list */}
                    <div className="list-col">

                        {/* Toolbar */}
                        <div className="toolbar">
                            <div className="search-row">
                                <Icon name="search" size={14} />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search tasks…"
                                    aria-label="Search tasks"
                                />
                                {search && (
                                    <button
                                        className="search-clear"
                                        onClick={() => setSearch("")}
                                        type="button"
                                        aria-label="Clear search"
                                    >
                                        <Icon name="x" size={10} />
                                    </button>
                                )}
                            </div>

                            <div className="filter-row">
                                <div className="filter-group">
                                    <span className="filter-label">Status</span>
                                    <div className="filter-seg">
                                        {STATUS_TABS.map(tab => (
                                            <button
                                                key={tab.key}
                                                type="button"
                                                className={`fseg-btn${filterStatus === tab.key ? " is-active" : ""}`}
                                                onClick={() => setFilterStatus(tab.key)}
                                            >
                                                {tab.label}
                                                {tab.key !== "all" && (
                                                    <span className="fcnt">
                                                        {tab.key === "pending"      ? stats.pending
                                                         : tab.key === "in-progress" ? stats.inProgress
                                                         : stats.completed}
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <span className="filter-vdivider" />

                                <div className="filter-group">
                                    <span className="filter-label">Priority</span>
                                    <div className="filter-seg">
                                        {PRIORITY_TABS.map(tab => (
                                            <button
                                                key={tab.key}
                                                type="button"
                                                className={`fseg-btn${filterPriority === tab.key ? " is-active" : ""}`}
                                                onClick={() => setFilterPriority(tab.key)}
                                            >
                                                {tab.dot && <span className={`pdot ${tab.dot}`} />}
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* List header */}
                        <div className="list-hd">
                            <h2>Tasks</h2>
                            <span className="list-count">
                                {filtered.length === tasks.length
                                    ? `${tasks.length} task${tasks.length !== 1 ? "s" : ""}`
                                    : `${filtered.length} of ${tasks.length}`}
                            </span>
                        </div>

                        {/* Content */}
                        {loading ? (
                            <div className="state-box">
                                <div className="spinner" />
                                <p className="state-sub">Loading tasks…</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="state-box">
                                <div className="state-ico">
                                    <Icon name={tasks.length === 0 ? "task" : "search"} size={34} />
                                </div>
                                <p className="state-title">
                                    {tasks.length === 0 ? "No tasks yet" : "No results found"}
                                </p>
                                <p className="state-sub">
                                    {tasks.length === 0
                                        ? "Create your first task using the form on the left."
                                        : "Try adjusting your search query or filters."}
                                </p>
                            </div>
                        ) : (
                            <div className="task-list">
                                {filtered.map(task => (
                                    <TaskCard
                                        key={task._id}
                                        task={task}
                                        onStatusChange={handleStatusChange}
                                        onDelete={(id, title) => setDeleteTarget({ id, title })}
                                        onEdit={handleEdit}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Delete modal */}
            {deleteTarget && (
                <ConfirmModal
                    taskTitle={deleteTarget.title}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}

            {/* Toasts */}
            <ToastStack toasts={toasts} />
        </div>
    );
}