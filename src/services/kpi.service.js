"use strict";

const { pool } = require("../config/database");

/**
 * POST /api/kpis
 * Create a new KPI for an Action Plan
 */
async function createKpi(user, payload) {
    const { action_plan_id, name, status } = payload;

    // ── Validation ──
    if (!action_plan_id || !name) {
        const error = new Error("action_plan_id dan name wajib diisi");
        error.statusCode = 400;
        throw error;
    }

    const allowedStatus = ["belum mulai", "dalam progres", "tercapai", "tidak tercapai"];
    const kpiStatus = status || "belum mulai";

    if (!allowedStatus.includes(kpiStatus)) {
        const error = new Error("Status KPI tidak valid");
        error.statusCode = 400;
        throw error;
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // ── Verify action plan exists ──
        const apCheck = await client.query(
            "SELECT id FROM action_plans WHERE id = $1",
            [action_plan_id],
        );

        if (apCheck.rowCount === 0) {
            const error = new Error("Action plan tidak ditemukan");
            error.statusCode = 404;
            throw error;
        }

        // ── Insert KPI ──
        const result = await client.query(
            `
        INSERT INTO kpis (action_plan_id, name, status, created_at, updated_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `,
            [action_plan_id, name, kpiStatus],
        );

        const newKpi = result.rows;

        // ── Catat Riwayat Aktivitas ──
        await client.query(
            `
        INSERT INTO history_activities (action_plan_id, user_id, description)
        VALUES ($1, $2, $3)
      `,
            [action_plan_id, user.id, `Menambahkan KPI baru: ${name}`]
        );

        await client.query("COMMIT");

        return {
            kpi_id: Number(newKpi.id),
            action_plan_id: Number(newKpi.action_plan_id),
            name: newKpi.name,
            status: newKpi.status,
            created_at: newKpi.created_at,
            updated_at: newKpi.updated_at,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

/**
 * PUT /api/kpis/:id
 * Update KPI name or status
 */
async function updateKpi(user, kpiId, payload) {
    const { name, status } = payload;

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // ── Lock & Verify KPI ──
        const existing = await client.query(
            `
        SELECT id, action_plan_id, name, status
        FROM kpis
        WHERE id = $1
        FOR UPDATE
      `,
            [kpiId],
        );

        if (existing.rowCount === 0) {
            const error = new Error("KPI tidak ditemukan");
            error.statusCode = 404;
            throw error;
        }

        const kpi = existing.rows;

        // ── Build SET clause dynamically ──
        const sets = [];
        const values = [];
        let paramIndex = 1;

        if (name !== undefined) {
            sets.push(`name = $${paramIndex++}`);
            values.push(name);
        }

        if (status !== undefined) {
            const allowedStatus = ["belum mulai", "dalam progres", "tercapai", "tidak tercapai"];
            if (!allowedStatus.includes(status)) {
                const error = new Error("Status KPI tidak valid");
                error.statusCode = 400;
                throw error;
            }
            sets.push(`status = $${paramIndex++}`);
            values.push(status);
        }

        if (sets.length === 0) {
            const error = new Error("Tidak ada data yang diubah");
            error.statusCode = 400;
            throw error;
        }

        sets.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(kpiId); // Parameter terakhir untuk WHERE id = $x

        const result = await client.query(
            `
        UPDATE kpis
        SET ${sets.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING *
      `,
            values,
        );

        const updatedKpi = result.rows;

        // ── Catat Riwayat Aktivitas ──
        let description = `Memperbarui KPI: ${kpi.name}`;
        if (status && status !== kpi.status) {
            description = `Mengubah status KPI "${kpi.name}" menjadi "${status}"`;
        }

        await client.query(
            `
        INSERT INTO history_activities (action_plan_id, user_id, description)
        VALUES ($1, $2, $3)
      `,
            [kpi.action_plan_id, user.id, description]
        );

        await client.query("COMMIT");

        return {
            kpi_id: Number(updatedKpi.id),
            action_plan_id: Number(updatedKpi.action_plan_id),
            name: updatedKpi.name,
            status: updatedKpi.status,
            updated_at: updatedKpi.updated_at,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

/**
 * DELETE /api/kpis/:id
 * Delete KPI
 */
async function deleteKpi(user, kpiId) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // ── Lock & Verify KPI ──
        const existing = await client.query(
            `
        SELECT id, action_plan_id, name
        FROM kpis
        WHERE id = $1
        FOR UPDATE
      `,
            [kpiId],
        );

        if (existing.rowCount === 0) {
            const error = new Error("KPI tidak ditemukan");
            error.statusCode = 404;
            throw error;
        }

        const kpi = existing.rows;

        // ── Delete KPI ──
        await client.query("DELETE FROM kpis WHERE id = $1", [kpiId]);

        // ── Catat Riwayat Aktivitas ──
        await client.query(
            `
        INSERT INTO history_activities (action_plan_id, user_id, description)
        VALUES ($1, $2, $3)
      `,
            [kpi.action_plan_id, user.id, `Menghapus KPI: ${kpi.name}`]
        );

        await client.query("COMMIT");

        return { deleted_id: Number(kpiId) };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    createKpi,
    updateKpi,
    deleteKpi,
};