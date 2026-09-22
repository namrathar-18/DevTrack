<div align="center">

# 🚀 DevTrack

**An industrial-grade, full-stack task management dashboard**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express%205-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docs.docker.com/compose)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Docker](#-docker-deployment) • [API Reference](#-api-reference) • [Project Structure](#-project-structure)

</div>

---

## ✨ Features

### 🎯 Core Task Management
- **Create tasks** with title, description, status, priority, and due date
- **Cycle task status** seamlessly: `Pending → In Progress → Completed`
- **Inline edit** — click ✏️ on any card to edit all fields in place
- **Delete with confirmation** modal to prevent accidental data loss

### 📊 Smart Dashboard
- **Live stats bar** — instant counts for Total / Pending / In Progress / Completed / Overdue
- **Overdue detection** — tasks past their due date are flagged with 🚨 indicators

### 🔍 Filter & Search
- **Real-time search** across task titles and descriptions
- **Status filter chips** — All / Pending / In Progress / Completed
- **Priority filter chips** — All / High 🔴 / Medium 🟡 / Low 🟢
- Filters combine — search + status + priority all work together

### 🎨 Premium UI/UX
- **Dark glassmorphism** design system with deep-space gradient background
- **Animated status badges** with glow effects on In-Progress tasks
- **Priority-coded left borders** on every task card (red / amber / emerald)
- **Toast notifications** — success / error / info with slide-in animations
- **Animated spinner** during data loading
- **Responsive layout** — optimised for desktop, tablet, and mobile
- **Inter font** via Google Fonts for crisp, professional typography

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 8, Vanilla CSS (glassmorphism) |
| **Backend** | Node.js, Express 5 |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **HTTP Client** | Axios |
| **Containerisation** | Docker, Docker Compose |
| **Web Server** | Nginx (production frontend) |
| **Font** | Inter (Google Fonts) |

---

## 📁 Project Structure

```
devtrack/
├── compose.yaml              # Docker Compose — full stack orchestration
├── .env                      # Root environment variables (gitignored)
├── .env.example              # Environment variable template
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── server.js         # Entry point — loads env, connects DB, starts HTTP
│       ├── app.js            # Express app, middleware, routes
│       ├── config/
│       │   └── database.js   # MongoDB Atlas connection
│       ├── models/
│       │   └── Task.js       # Mongoose Task schema
│       ├── controllers/
│       │   └── taskController.js  # CRUD logic
│       ├── routes/
│       │   └── taskRoutes.js      # /api/tasks route definitions
│       └── middleware/
│
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx          # React entry point
        ├── index.css         # CSS custom properties / design tokens
        ├── App.css           # Component styles (glassmorphism design system)
        ├── App.jsx           # Main application component
        └── services/
            └── api.js        # Axios API client (getTasks, createTask, updateTask, deleteTask)
```

---

## ⚡ Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A **MongoDB Atlas** cluster (free tier works fine)
- **Docker** + **Docker Compose** *(for containerised deployment)*

---

### 1. Clone the Repository

```bash
git clone https://github.com/namrathar-18/DevTrack.git
cd DevTrack
```

### 2. Configure Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>
NODE_ENV=development
```

> **Tip:** Get your `MONGODB_URI` from the [MongoDB Atlas dashboard](https://cloud.mongodb.com) → Connect → Drivers.

---

### 3. Run the Backend

```bash
cd backend
npm install
npm run dev      # Node --watch hot-reload
```

The API will be available at `http://localhost:3000`.

### 4. Run the Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173` (or the next available port).

> Make sure `frontend/.env` has `VITE_API_URL=http://localhost:3000`

---

## 🐳 Docker Deployment

Run the **entire stack** (backend + frontend + Nginx) with a single command:

```bash
docker compose up --build
```

| Service | Container | Port |
|---|---|---|
| Backend API | `devtrack-api` | `3000` |
| Frontend (Nginx) | `devtrack-frontend` | `5173 → 8080` |

The backend includes a **health check** — the frontend container only starts once the API is confirmed healthy.

```bash
# Stop all services
docker compose down

# Rebuild after code changes
docker compose up --build --force-recreate
```

---

## 📡 API Reference

Base URL: `http://localhost:3000/api`

### Health Check

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Returns API status and timestamp |

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/tasks` | Fetch all tasks (sorted newest first) |
| `POST` | `/tasks` | Create a new task |
| `GET` | `/tasks/:id` | Fetch a single task by ID |
| `PUT` | `/tasks/:id` | Update a task (any fields) |
| `DELETE` | `/tasks/:id` | Delete a task |

### Task Schema

```json
{
  "_id": "ObjectId",
  "title": "string (required, 3–100 chars)",
  "description": "string (max 500 chars)",
  "status": "pending | in-progress | completed",
  "priority": "low | medium | high",
  "dueDate": "ISO 8601 date | null",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

#### Example — Create a Task

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Set up CI/CD pipeline",
    "description": "Configure GitHub Actions for automated testing and deployment",
    "status": "pending",
    "priority": "high",
    "dueDate": "2026-10-15"
  }'
```

#### Example Response

```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "title": "Set up CI/CD pipeline",
    "description": "Configure GitHub Actions for automated testing and deployment",
    "status": "pending",
    "priority": "high",
    "dueDate": "2026-10-15T00:00:00.000Z",
    "createdAt": "2026-09-22T17:45:00.000Z",
    "updatedAt": "2026-09-22T17:45:00.000Z"
  }
}
```

---

## 🧪 Running Tests

```bash
cd backend
npm test
```

Tests use Node's built-in test runner with `supertest` for HTTP assertions.

---

## 🔑 Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | Backend server port |
| `MONGODB_URI` | **Yes** | — | MongoDB Atlas connection string |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `VITE_API_URL` | **Yes** (frontend) | — | Backend API URL for the frontend |

---

## 📜 Scripts Reference

### Backend

```bash
npm start       # Production start (node src/server.js)
npm run dev     # Development with --watch hot reload
npm test        # Run tests
```

### Frontend

```bash
npm run dev     # Vite dev server with HMR
npm run build   # Production build → dist/
npm run preview # Preview production build locally
npm run lint    # ESLint check
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [ISC License](LICENSE).

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/namrathar-18">namrathar-18</a>
</div>
