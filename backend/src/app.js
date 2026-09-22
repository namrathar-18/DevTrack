const express = require("express");
const cors = require("cors");

const taskRoutes = require("./routes/taskRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Root endpoint
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to DevTrack API",
        version: "1.0.0"
    });
});

// Health check
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        status: "healthy",
        service: "DevTrack API",
        timestamp: new Date().toISOString()
    });
});

// Task routes
app.use("/api/tasks", taskRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`
    });
});

module.exports = app;