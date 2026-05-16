const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const { connectDB, pool } = require("./config/db");
const incidentRoutes = require("./routes/incidents");
const incidentManagementRoutes = require("./routes/incidentManagement");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);
app.use(express.json());

connectDB();

app.use("/api/incidents", incidentRoutes);
app.use("/api/incident-management", incidentManagementRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Incident Management API is running");
});

app.get("/health", async (req, res) => {
  try {
    const result = await pool.request().query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    res.status(500).json({
      status: "error",
      database: "disconnected",
      error: err.message,
    });
  }
});

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
