import { useEffect, useState } from "react";
import {
    getTasks,
    createTask,
    updateTask,
    deleteTask
} from "./services/api";

import "./App.css";

function App() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        status: "pending",
        priority: "medium"
    });

    const loadTasks = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getTasks();

            setTasks(response.data);
        } catch (err) {
            console.error(err);
            setError("Unable to load tasks. Is the backend running?");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!formData.title.trim()) {
            return;
        }

        try {
            await createTask(formData);

            setFormData({
                title: "",
                description: "",
                status: "pending",
                priority: "medium"
            });

            await loadTasks();
        } catch (err) {
            console.error(err);
            setError("Unable to create task.");
        }
    };

    const handleStatusChange = async (task) => {
        try {
            const nextStatus =
                task.status === "pending"
                    ? "in-progress"
                    : task.status === "in-progress"
                        ? "completed"
                        : "pending";

            await updateTask(task._id, {
                status: nextStatus
            });

            await loadTasks();
        } catch (err) {
            console.error(err);
            setError("Unable to update task.");
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteTask(id);
            await loadTasks();
        } catch (err) {
            console.error(err);
            setError("Unable to delete task.");
        }
    };

    return (
        <div className="app">
            <header className="header">
                <div>
                    <h1>DevTrack</h1>
                    <p>Task Management Dashboard</p>
                </div>

                <span className="api-status">
                    ● API Connected
                </span>
            </header>

            <main className="container">

                <section className="card">
                    <h2>Create New Task</h2>

                    <form onSubmit={handleSubmit}>

                        <div className="form-group">
                            <label>Task Title</label>

                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Enter task title"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Description</label>

                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe the task"
                                rows="4"
                            />
                        </div>

                        <div className="form-row">

                            <div className="form-group">
                                <label>Status</label>

                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    <option value="pending">
                                        Pending
                                    </option>

                                    <option value="in-progress">
                                        In Progress
                                    </option>

                                    <option value="completed">
                                        Completed
                                    </option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Priority</label>

                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                >
                                    <option value="low">
                                        Low
                                    </option>

                                    <option value="medium">
                                        Medium
                                    </option>

                                    <option value="high">
                                        High
                                    </option>
                                </select>
                            </div>

                        </div>

                        <button type="submit">
                            Add Task
                        </button>

                    </form>
                </section>

                <section className="tasks-section">

                    <div className="section-header">
                        <h2>Tasks</h2>

                        <span>
                            {tasks.length} task
                            {tasks.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    {error && (
                        <div className="error">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="empty">
                            Loading tasks...
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="empty">
                            No tasks available.
                        </div>
                    ) : (
                        <div className="task-list">

                            {tasks.map((task) => (
                                <article
                                    className="task-card"
                                    key={task._id}
                                >

                                    <div className="task-content">

                                        <div className="task-title-row">

                                            <h3>
                                                {task.title}
                                            </h3>

                                            <span
                                                className={`priority ${task.priority}`}
                                            >
                                                {task.priority}
                                            </span>

                                        </div>

                                        <p>
                                            {task.description ||
                                                "No description"}
                                        </p>

                                        <div className="task-meta">

                                            <span>
                                                Status:
                                                {" "}
                                                <strong>
                                                    {task.status}
                                                </strong>
                                            </span>

                                            <span>
                                                Created:
                                                {" "}
                                                {new Date(
                                                    task.createdAt
                                                ).toLocaleDateString()}
                                            </span>

                                        </div>

                                    </div>

                                    <div className="task-actions">

                                        <button
                                            onClick={() =>
                                                handleStatusChange(task)
                                            }
                                            className="secondary"
                                        >
                                            Change Status
                                        </button>

                                        <button
                                            onClick={() =>
                                                handleDelete(task._id)
                                            }
                                            className="danger"
                                        >
                                            Delete
                                        </button>

                                    </div>

                                </article>
                            ))}

                        </div>
                    )}

                </section>

            </main>
        </div>
    );
}

export default App;