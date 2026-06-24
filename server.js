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
const documentRoutes = require("./src/routes/document.routes");
const bumdRoutes = require("./src/routes/bumd.routes");

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

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Serve static files at the new prefix path
app.use(
  "/diagnosticreview-demo",
  express.static(path.join(__dirname, "public"), {
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    },
    etag: true,
  }),
);

// Serve uploads directory
app.use("/diagnosticreview-demo/uploads", express.static(path.join(__dirname, "uploads")));

// Root → redirect to the new prefix login
app.get("/", (req, res) => {
  res.redirect("/diagnosticreview-demo/login.html");
});

// Also redirect /diagnosticreview-demo to login
app.get("/diagnosticreview-demo", (req, res) => {
  res.redirect("/diagnosticreview-demo/login.html");
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
const apiPrefix = '/diagnosticreview-demo/api';
app.use(apiPrefix + '/auth', authRoutes);
app.use(apiPrefix + '/dashboard', dashboardRoutes);
app.use(apiPrefix + '/aspects', aspectRoutes);
app.use(apiPrefix + '/action-plans', actionPlanRoutes);
app.use(apiPrefix + '/sub-action-plans', subActionPlanRoutes);
app.use(apiPrefix + '/kpis', kpiRoutes);
app.use(apiPrefix + '/strategies', strategyRoutes);
app.use(apiPrefix + '/activity-groups', activityGroupRoutes);
app.use(apiPrefix + '/documents', documentRoutes);
app.use(apiPrefix + '/bumds', bumdRoutes);

// Fallback for subpath API
app.use(apiPrefix, (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint tidak ditemukan",
    path: req.originalUrl,
  });
});

// Original API routes for backward compatibility local
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/aspects", aspectRoutes);
app.use("/api/action-plans", actionPlanRoutes);
app.use("/api/sub-action-plans", subActionPlanRoutes);
app.use("/api/kpis", kpiRoutes);
app.use("/api/strategies", strategyRoutes);
app.use("/api/activity-groups", activityGroupRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/bumds", bumdRoutes);

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

// Global Error Handler to prevent Express from sending HTML errors
app.use((err, req, res, next) => {
  console.error("Global Error Caught:", err.message);
  
  // Format the error as JSON so frontend doesn't fail with HTML parser error
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error dari Backend Node.js",
    type: err.type || "unknown"
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`BPBUMD Control Tower running on port ${PORT}`);
});
