const path = require("path");
const dotenv = require("dotenv");

// Load .env from project root
dotenv.config({
    path: path.resolve(__dirname, "../../.env")
});

const app = require("./app");
const connectDatabase = require("./config/database");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Connect to MongoDB Atlas
        await connectDatabase();

        // Start HTTP server
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`DevTrack API running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();