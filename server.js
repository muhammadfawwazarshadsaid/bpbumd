"use strict";

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const authRoutes = require("./src/routes/auth.routes");
const dashboardRoutes = require("./src/routes/dashboard.routes");
const aspectRoutes = require("./src/routes/aspect.routes");
const actionPlanRoutes = require("./src/routes/actionplan.routes");
const subActionPlanRoutes = require("./src/routes/subactionplan.routes");
const kpiRoutes = require("./src/routes/kpi.routes");
const strategyRoutes = require("./src/routes/strategy.routes");
const activityGroupRoutes = require("./src/routes/activitygroup.routes");

const app = express();
const PORT = process.env.PORT || 8080;

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files
app.use(
  express.static(path.join(__dirname, "public"), {
    maxAge: "1h",
    etag: true,
  }),
);

// Serve uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Root → login
app.get("/", (req, res) => {
  res.redirect("/login.html");
});

// Health check for Azure App Service
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    app: "bpbumd-control-tower",
    timestamp: new Date().toISOString(),
  });
});

// Backend routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/aspects", aspectRoutes);
app.use("/api/action-plans", actionPlanRoutes);
app.use("/api/sub-action-plans", subActionPlanRoutes);
app.use("/api/kpis", kpiRoutes);
app.use("/api/strategies", strategyRoutes);
app.use("/api/activity-groups", activityGroupRoutes);

// API fallback - supaya endpoint API yang salah nggak balikin HTML
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint tidak ditemukan",
    path: req.originalUrl,
  });
});

// Fallback for HTML5 history mode
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`BPBUMD Control Tower running on port ${PORT}`);
});
