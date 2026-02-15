require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const uploadRoutes = require("./routes/uploadRoutes");
const authRoutes = require("./routes/authRoutes");
const startCleanupJob = require("./jobs/cleanup");

const app = express();
const PORT = process.env.PORT || 5000;

/* ─── Middleware ─────────────────────────────────────────────── */
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

/* ─── Routes ────────────────────────────────────────────────── */
app.use("/api/auth", authRoutes);
app.use("/api", uploadRoutes);

/* Health check */
app.get("/health", (_req, res) => res.json({ status: "ok" }));

/* 404 catch-all */
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found." });
});

/* Global error handler */
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File too large. Maximum size is 50 MB." });
  }
  res.status(500).json({ error: "Internal server error." });
});

/* ─── Start ─────────────────────────────────────────────────── */
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 LinkVault backend running on http://localhost:${PORT}`);
  });
  startCleanupJob();
});
