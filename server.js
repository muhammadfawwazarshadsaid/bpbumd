"use strict";

require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
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

// Dynamic base path from environment variable
const BASE_PATH = '/' + (process.env.BASE_PATH || 'diagnosticreview-demo').replace(/^\//, '');

console.log(`[config] BASE_PATH = ${BASE_PATH}`);

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cookieParser());

// Universal WAF bypass middleware
app.use((req, res, next) => {
  if (req.headers['x-encoded-payload'] === 'true' && req.body && req.body.encoded_payload) {
    try {
      const decodedStr = Buffer.from(req.body.encoded_payload, 'base64').toString('utf8');
      req.body = JSON.parse(decodedStr);
    } catch (e) {
      console.error("Failed to decode base64 payload:", e);
    }
  }
  next();
});

// ============================================================================
// DUAL-MODE ROUTING MIDDLEWARE
// ============================================================================
// Jika diakses via IP lokal: request = /diagnosticreview/login.html
// Jika diakses via Nginx yg memotong path: request = /login.html
// Middleware ini menormalkan URL sehingga server Node.js selalu melihat URL
// seolah-olah dipanggil tanpa prefix. Ini menyelesaikan masalah Nginx!
app.use((req, res, next) => {
  if (BASE_PATH !== '/' && req.url.startsWith(BASE_PATH)) {
    req.url = req.url.substring(BASE_PATH.length) || '/';
  }
  next();
});

// Serve dynamic config.js that exposes BASE_PATH to frontend
app.get('/config.js', (req, res) => {
  res.type('application/javascript');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(`window.__BASE_PATH__ = "${BASE_PATH}";`);
});

// Middleware to serve HTML files with base path replacement
app.use((req, res, next) => {
  // Intercept .html requests
  if (req.path.endsWith('.html')) {
    const filePath = path.join(__dirname, 'public', req.path);
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        return next(); // Let static middleware or fallback handle it
      }
      // Ganti semua template string dengan BASE_PATH yg aktif
      const replaced = data.replace(/\/diagnosticreview-demo/g, BASE_PATH);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(replaced);
    });
    return;
  }
  next();
});

// Serve static files (non-HTML assets: JS, CSS, images, etc.)
app.use(
  express.static(path.join(__dirname, "public"), {
    setHeaders: (res, filePath) => {
      // Disable caching for everything in development
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    },
    etag: false,
    lastModified: false
  })
);

// Serve uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Root → redirect to the base path login
app.get("/", (req, res) => {
  res.redirect(BASE_PATH + "/login.html");
});

// Health check for Azure App Service
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    app: "bpbumd-control-tower",
    basePath: BASE_PATH,
    timestamp: new Date().toISOString(),
  });
});

// Backend routes (sekarang semuanya mount di /api karena prefix sudah di-strip)
const apiPrefix = '/api';
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

// Fallback for HTML5 history mode
app.get("*", (req, res) => {
  const filePath = path.join(__dirname, "public", "login.html");
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Internal Server Error');
    }
    const replaced = data.replace(/\/diagnosticreview-demo/g, BASE_PATH);
    res.type('html').send(replaced);
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error Caught:", err.message);
  
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error dari Backend Node.js",
    type: err.type || "unknown"
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`BPBUMD Control Tower running on port ${PORT}`);
  console.log(`Base path: ${BASE_PATH}`);
  console.log(`Access: http://localhost:${PORT}${BASE_PATH}/login.html`);
});
