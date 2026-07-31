"use strict";

const express = require("express");
const router = express.Router();

const sapService = require("../services/subactionplan.service");
const { authMiddleware } = require("../middleware/auth.middleware");

// ═════════════════════════════════════════════
//  SUBMITTER SIDE
// ═════════════════════════════════════════════

/**
 * POST /api/sub-action-plans
 *
 * Body:
 *  - action_plan_id       (required)
 *  - name                 (required)
 *  - pic_user_id          (optional)
 *  - weight               (optional)
 *  - approver_user_id_1   (required)
 *  - approver_user_id_2   (required)
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const data = await sapService.createSubActionPlan(req.user, req.body);

    res.status(201).json({
      success: true,
      message: "Sub rencana aksi berhasil dibuat",
      data,
    });
  } catch (error) {
    console.error("Create sub action plan error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal membuat sub rencana aksi",
    });
  }
});

/**
 * PUT /api/sub-action-plans/:id
 *
 * Body:
 *  - name         (optional)
 *  - pic_user_id  (optional)
 *  - weight       (optional)
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

    const data = await sapService.updateSubActionPlan(req.user, id, req.body);

    res.json({
      success: true,
      message: "Sub rencana aksi berhasil diubah",
      data,
    });
  } catch (error) {
    console.error("Update sub action plan error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal mengubah sub rencana aksi",
    });
  }
});

/**
 * DELETE /api/sub-action-plans/:id
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

    const data = await sapService.deleteSubActionPlan(req.user, id);

    res.json({
      success: true,
      message: "Sub rencana aksi berhasil dihapus",
      data,
    });
  } catch (error) {
    console.error("Delete sub action plan error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal menghapus sub rencana aksi",
    });
  }
});

// ═════════════════════════════════════════════
//  APPROVER SIDE
// ═════════════════════════════════════════════

/**
 * POST /api/sub-action-plans/:id/approve
 *
 * Body:
 *  - notes (optional)
 */
router.post("/:id/approve", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Parameter id harus berupa angka",
      });
    }

    const data = await sapService.approveSubActionPlan(
      req.user,
      id,
      req.body,
    );

    res.json({
      success: true,
      message: "Sub rencana aksi berhasil disetujui",
      data,
    });
  } catch (error) {
    console.error("Approve sub action plan error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal menyetujui sub rencana aksi",
    });
  }
});

/**
 * POST /api/sub-action-plans/:id/reject
 *
 * Body:
 *  - notes (required) — alasan penolakan
 */
router.post("/:id/reject", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Parameter id harus berupa angka",
      });
    }

    const data = await sapService.rejectSubActionPlan(
      req.user,
      id,
      req.body,
    );

    res.json({
      success: true,
      message: "Sub rencana aksi berhasil ditolak",
      data,
    });
  } catch (error) {
    console.error("Reject sub action plan error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal menolak sub rencana aksi",
    });
  }
});

/**
 * POST /api/sub-action-plans/:id/restore
 */
router.post("/:id/restore", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Parameter id harus berupa angka",
      });
    }

    const data = await sapService.restoreSubActionPlan(req.user, id);

    res.json({
      success: true,
      message: "Sub rencana aksi berhasil dipulihkan",
      data,
    });
  } catch (error) {
    console.error("Restore sub action plan error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal memulihkan sub rencana aksi",
    });
  }
});

/**
 * GET /api/sub-action-plans/pic/:userId/verifiers
 * Get default verifiers for a PIC (based on most recent sub action plan).
 */
router.get("/pic/:userId/verifiers", authMiddleware, async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "Parameter userId harus berupa angka",
      });
    }

    const verifiers = await sapService.getPicDefaultVerifiers(req.user, userId);

    res.json({
      success: true,
      message: "Berhasil mendapatkan verifikator default PIC",
      data: verifiers,
    });
  } catch (error) {
    console.error("Get PIC verifiers error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal mendapatkan verifikator default PIC",
    });
  }
});

/**
 * GET /api/sub-action-plans/pic-verifiers-mapping
 * Get all PIC to verifiers mapping for modal display.
 */
router.get("/pic-verifiers-mapping", authMiddleware, async (req, res) => {
  try {
    const userCompanyScope = (!req.user || req.user.role === "admin") ? null : (req.user.company_id || null);
    const companyId = req.query.company_id ? Number(req.query.company_id) : userCompanyScope;
    const { pool } = require("../config/database");
    const client = await pool.connect();
    try {
      let query = `
        SELECT 
          u.id AS pic_user_id,
          u.name AS pic_name,
          u.position AS pic_position,
          u.company_id,
          c.name AS company_name,
          (
            SELECT JSON_AGG(json_build_object(
              'id', app.id,
              'name', app.name,
              'position', app.position,
              'company_name', ac.name,
              'approval_order', sapa.approval_order
            ) ORDER BY sapa.approval_order ASC)
            FROM sub_action_plan_approvals sapa
            JOIN users app ON app.id = sapa.approver_user_id
            LEFT JOIN companies ac ON ac.id = app.company_id
            WHERE sapa.sub_action_plan_id = (
              SELECT sap.id
              FROM sub_action_plans sap
              WHERE sap.pic_user_id = u.id
                AND EXISTS (SELECT 1 FROM sub_action_plan_approvals sa2 WHERE sa2.sub_action_plan_id = sap.id)
              ORDER BY sap.created_at DESC
              LIMIT 1
            )
          ) AS verifiers
        FROM users u
        LEFT JOIN companies c ON c.id = u.company_id
        WHERE u.role != 'admin'
          AND EXISTS (SELECT 1 FROM sub_action_plans sap WHERE sap.pic_user_id = u.id)
      `;
      const params = [];
      if (companyId && !isNaN(companyId)) {
        query += ` AND u.company_id = $1 `;
        params.push(companyId);
      }
      query += ` ORDER BY u.name ASC `;

      const dbRes = await client.query(query, params);
      res.json({
        success: true,
        message: "Berhasil mendapatkan mapping PIC & Verifikator",
        data: dbRes.rows,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Get PIC mapping error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mendapatkan mapping PIC",
    });
  }
});

module.exports = router;
