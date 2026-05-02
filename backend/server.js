// Main Express server: connects to MongoDB and mounts all routes.

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const movieRoutes = require("./routes/movies");

const app = express();
const PORT = process.env.PORT || 5000;
const DEFAULT_LOCAL_MONGO_URI = "mongodb://localhost:27017/movierecommender";
const isHostedEnvironment = process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);
const MONGO_URI = process.env.MONGO_URI?.trim() || (isHostedEnvironment ? "" : DEFAULT_LOCAL_MONGO_URI);

if (!MONGO_URI) {
  console.error("Missing MONGO_URI. Add your MongoDB Atlas connection string in the Render environment variables.");
  process.exit(1);
}

app.use(cors()); // Allow requests from the frontend.
app.use(express.json()); // Parse JSON request bodies.

app.use("/api/movies", movieRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    message: "Movie Recommender API is running",
  });
});

// Serve the frontend from the same server, so users can open http://localhost:5000.
app.use(express.static(path.join(__dirname, "../frontend/public")));

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

mongoose
  .connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log("Connected to MongoDB");
    const server = app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`API base: http://localhost:${PORT}/api/movies`);
    });

    server.on("error", async (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Stop the other server or set a different PORT.`);
      } else {
        console.error("Server failed to start:", err.message);
      }

      await mongoose.disconnect();
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
