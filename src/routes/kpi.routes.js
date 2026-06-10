"use strict";

const express = require("express");
const router = express.Router();

const kpiService = require("../services/kpi.service");
const { authMiddleware } = require("../middleware/auth.middleware");

/**
 * POST /api/kpis
 * Body: { action_plan_id, name, status }
 */
router.post("/", authMiddleware, async (req, res) => {
    try {
        const data = await kpiService.createKpi(req.user, req.body);

        res.status(201).json({
            success: true,
            message: "KPI berhasil dibuat",
            data,
        });
    } catch (error) {
        console.error("Create KPI error:", error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Gagal membuat KPI",
        });
    }
});

/**
 * PUT /api/kpis/:id
 * Body: { name, status }
 */
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "Parameter id harus berupa angka",
            });
        }

        const data = await kpiService.updateKpi(req.user, id, req.body);

        res.json({
            success: true,
            message: "KPI berhasil diubah",
            data,
        });
    } catch (error) {
        console.error("Update KPI error:", error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Gagal mengubah KPI",
        });
    }
});

/**
 * DELETE /api/kpis/:id
 */
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "Parameter id harus berupa angka",
            });
        }

        const data = await kpiService.deleteKpi(req.user, id);

        res.json({
            success: true,
            message: "KPI berhasil dihapus",
            data,
        });
    } catch (error) {
        console.error("Delete KPI error:", error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Gagal menghapus KPI",
        });
    }
});

module.exports = router;