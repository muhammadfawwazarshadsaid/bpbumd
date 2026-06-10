BEGIN;

-- ============================================================
-- 1. INSERT ASPECTS JAKPRO
-- ============================================================

INSERT INTO aspects (
    company_id,
    name,
    status,
    weight,
    progress_percentage,
    target_percentage
)
VALUES
(
    (SELECT id FROM companies WHERE company_code = 101),
    'Penguatan Bisnis Inti',
    'dalam progres',
    20,
    63,
    65
),
(
    (SELECT id FROM companies WHERE company_code = 101),
    'Pengembangan Bisnis Eksisting',
    'dalam progres',
    20,
    58,
    65
),
(
    (SELECT id FROM companies WHERE company_code = 101),
    'Diversifikasi Usaha Baru',
    'selesai',
    20,
    80,
    73
),
(
    (SELECT id FROM companies WHERE company_code = 101),
    'Keunggulan Operasional',
    'dalam progres',
    20,
    63,
    74
),
(
    (SELECT id FROM companies WHERE company_code = 101),
    'Faktor Pendukung',
    'selesai',
    20,
    86,
    68
);


-- ============================================================
-- 2. INSERT STRATEGIES
-- 1 strategy per aspect
-- Total: 5
-- ============================================================

INSERT INTO strategies (
    aspect_id,
    name,
    code_order,
    status,
    weight,
    progress_percentage,
    target_percentage
)
SELECT
    a.id,
    'Strategi ' || a.name,
    ROW_NUMBER() OVER (ORDER BY a.id)::TEXT,
    a.status,
    a.weight,
    a.progress_percentage,
    a.target_percentage
FROM aspects a
JOIN companies c ON c.id = a.company_id
WHERE c.company_code = 101;


-- ============================================================
-- 3. INSERT ACTIVITY GROUPS
-- 1 activity group per strategy
-- Total: 5
-- ============================================================

INSERT INTO activity_groups (
    strategy_id,
    name,
    code_order,
    status,
    weight,
    progress_percentage,
    target_percentage
)
SELECT
    s.id,
    'Activity Group ' || s.name,
    s.code_order || '.A',
    s.status,
    s.weight,
    s.progress_percentage,
    s.target_percentage
FROM strategies s
JOIN aspects a ON a.id = s.aspect_id
JOIN companies c ON c.id = a.company_id
WHERE c.company_code = 101;


-- ============================================================
-- 4. INSERT ACTION PLANS
-- Distribution supaya mirip dashboard:
--
-- Penguatan Bisnis Inti          total 24 | selesai 12 | progres 8 | terlambat 4 | belum 0
-- Pengembangan Bisnis Eksisting  total 12 | selesai 4  | progres 5 | terlambat 3 | belum 0
-- Diversifikasi Usaha Baru       total 5  | selesai 3  | progres 1 | terlambat 1 | belum 0
-- Keunggulan Operasional         total 8  | selesai 2  | progres 3 | terlambat 3 | belum 0
-- Faktor Pendukung               total 7  | selesai 6  | progres 1 | terlambat 0 | belum 0
--
-- Total Action Plan: 56
-- Total Terlambat: 11
-- ============================================================

WITH distribution AS (
    SELECT *
    FROM (
        VALUES
        ('Penguatan Bisnis Inti', 24, 12, 8, 4, 0, 63, 65),
        ('Pengembangan Bisnis Eksisting', 12, 4, 5, 3, 0, 58, 65),
        ('Diversifikasi Usaha Baru', 5, 3, 1, 1, 0, 80, 73),
        ('Keunggulan Operasional', 8, 2, 3, 3, 0, 63, 74),
        ('Faktor Pendukung', 7, 6, 1, 0, 0, 86, 68)
    ) AS d(
        aspect_name,
        total_action_plan,
        total_selesai,
        total_dalam_progres,
        total_terlambat,
        total_belum_mulai,
        progress_percentage,
        target_percentage
    )
),
generated AS (
    SELECT
        d.*,
        gs.n
    FROM distribution d
    CROSS JOIN LATERAL generate_series(1, d.total_action_plan) AS gs(n)
)
INSERT INTO action_plans (
    activity_group_id,
    pic_user_id,
    name,
    code_order,
    status,
    weight,
    progress_percentage,
    target_percentage,
    start_date,
    end_date,
    target_end_date,
    output,
    indicator,
    is_blocked
)
SELECT
    ag.id,
    (SELECT id FROM users WHERE username = 'user_jakpro'),
    'Rencana Aksi ' || g.n || ' - ' || g.aspect_name,
    s.code_order || '.' || g.n,
    CASE
        WHEN g.n <= g.total_selesai THEN 'selesai'
        WHEN g.n <= g.total_selesai + g.total_dalam_progres THEN 'dalam progres'
        WHEN g.n <= g.total_selesai + g.total_dalam_progres + g.total_terlambat THEN 'terlambat'
        ELSE 'belum mulai'
    END,
    1,
    CASE
        WHEN g.n <= g.total_selesai THEN 100
        WHEN g.n <= g.total_selesai + g.total_dalam_progres THEN 60
        WHEN g.n <= g.total_selesai + g.total_dalam_progres + g.total_terlambat THEN 45
        ELSE 0
    END,
    g.target_percentage,
    DATE '2026-01-01' + (g.n * 3),
    CASE
        WHEN g.n <= g.total_selesai THEN DATE '2026-03-31' + g.n
        ELSE NULL
    END,
    DATE '2026-12-31',
    'Output dummy untuk ' || g.aspect_name,
    'Indikator dummy untuk ' || g.aspect_name,
    CASE
        WHEN g.n <= g.total_selesai + g.total_dalam_progres
             AND g.n > g.total_selesai
             AND g.n % 5 = 0
        THEN TRUE
        ELSE FALSE
    END
FROM generated g
JOIN aspects a ON a.name = g.aspect_name
JOIN companies c ON c.id = a.company_id
JOIN strategies s ON s.aspect_id = a.id
JOIN activity_groups ag ON ag.strategy_id = s.id
WHERE c.company_code = 101;


-- ============================================================
-- 5. INSERT SUB ACTION PLANS
-- 3 sub action plan per action plan
-- Total: 56 * 3 = 168
-- ============================================================

INSERT INTO sub_action_plans (
    action_plan_id,
    pic_user_id,
    submitted_by_user_id,
    name,
    status,
    weight,
    submitted_at
)
SELECT
    ap.id,
    (SELECT id FROM users WHERE username = 'user_jakpro'),
    (SELECT id FROM users WHERE username = 'user_jakpro'),
    'Sub Rencana Aksi ' || gs.n || ' - ' || LEFT(ap.name, 80),
    CASE
        WHEN ap.status = 'selesai' THEN 'selesai'
        WHEN ap.status = 'terlambat' THEN 'terlambat'
        WHEN ap.status = 'dalam progres' AND gs.n = 1 THEN 'verif_2'
        WHEN ap.status = 'dalam progres' AND gs.n = 2 THEN 'verif_1'
        WHEN ap.status = 'dalam progres' AND gs.n = 3 THEN 'pengajuan'
        ELSE 'pengajuan'
    END,
    1,
    CURRENT_TIMESTAMP
FROM action_plans ap
JOIN activity_groups ag ON ag.id = ap.activity_group_id
JOIN strategies s ON s.id = ag.strategy_id
JOIN aspects a ON a.id = s.aspect_id
JOIN companies c ON c.id = a.company_id
CROSS JOIN generate_series(1, 3) AS gs(n)
WHERE c.company_code = 101;


-- ============================================================
-- 6. INSERT APPROVAL 2 LEVEL PER SUB ACTION PLAN
-- ============================================================

WITH approval_rows AS (
    SELECT
        sap.id AS sub_action_plan_id,
        u.id AS approver_user_id,
        approver.approval_order,
        CASE
            WHEN sap.status IN ('selesai', 'terlambat', 'verif_2') THEN 'setujui'
            WHEN sap.status = 'verif_1' AND approver.approval_order = 1 THEN 'setujui'
            ELSE 'menunggu'
        END AS approval_status
    FROM sub_action_plans sap
    JOIN action_plans ap ON ap.id = sap.action_plan_id
    JOIN activity_groups ag ON ag.id = ap.activity_group_id
    JOIN strategies s ON s.id = ag.strategy_id
    JOIN aspects a ON a.id = s.aspect_id
    JOIN companies c ON c.id = a.company_id
    CROSS JOIN (
        VALUES
        (1, 'approver_jakpro_1'),
        (2, 'approver_jakpro_2')
    ) AS approver(approval_order, username)
    JOIN users u ON u.username = approver.username
    WHERE c.company_code = 101
)
INSERT INTO sub_action_plan_approvals (
    sub_action_plan_id,
    approver_user_id,
    approval_order,
    status,
    notes,
    approved_at,
    rejected_at
)
SELECT
    sub_action_plan_id,
    approver_user_id,
    approval_order,
    approval_status,
    CASE
        WHEN approval_status = 'setujui' THEN 'Dummy approval disetujui'
        ELSE NULL
    END,
    CASE
        WHEN approval_status = 'setujui' THEN CURRENT_TIMESTAMP
        ELSE NULL
    END,
    NULL
FROM approval_rows;


-- ============================================================
-- 7. INSERT KPI
-- 1 KPI per action plan
-- ============================================================

INSERT INTO kpis (
    action_plan_id,
    name,
    status
)
SELECT
    ap.id,
    'KPI - ' || LEFT(ap.name, 120),
    CASE
        WHEN ap.status = 'selesai' THEN 'tercapai'
        WHEN ap.status = 'terlambat' THEN 'tidak tercapai'
        WHEN ap.status = 'dalam progres' THEN 'dalam progres'
        ELSE 'belum mulai'
    END
FROM action_plans ap
JOIN activity_groups ag ON ag.id = ap.activity_group_id
JOIN strategies s ON s.id = ag.strategy_id
JOIN aspects a ON a.id = s.aspect_id
JOIN companies c ON c.id = a.company_id
WHERE c.company_code = 101;


-- ============================================================
-- 8. INSERT DOCUMENT DUMMY
-- 1 document per action plan
-- ============================================================

INSERT INTO documents (
    action_plan_id,
    uploaded_by_user_id,
    name,
    description,
    original_file_name,
    file_type,
    file_size,
    file_path,
    status,
    uploaded_at
)
SELECT
    ap.id,
    (SELECT id FROM users WHERE username = 'user_jakpro'),
    'Dokumen Evidence - ' || LEFT(ap.name, 100),
    'Dokumen dummy untuk kebutuhan mockup dashboard',
    'dummy-evidence-' || ap.id || '.pdf',
    'pdf',
    250000,
    '/uploads/dummy-evidence-' || ap.id || '.pdf',
    CASE
        WHEN ap.status = 'selesai' THEN 'terverifikasi'
        ELSE 'diunggah'
    END,
    CURRENT_TIMESTAMP
FROM action_plans ap
JOIN activity_groups ag ON ag.id = ap.activity_group_id
JOIN strategies s ON s.id = ag.strategy_id
JOIN aspects a ON a.id = s.aspect_id
JOIN companies c ON c.id = a.company_id
WHERE c.company_code = 101;


-- ============================================================
-- 9. INSERT HISTORY ACTIVITY DUMMY
-- 1 history per action plan
-- ============================================================

INSERT INTO history_activities (
    action_plan_id,
    user_id,
    description,
    updated_at
)
SELECT
    ap.id,
    (SELECT id FROM users WHERE username = 'user_jakpro'),
    'Dummy history: update status menjadi ' || ap.status,
    CURRENT_TIMESTAMP
FROM action_plans ap
JOIN activity_groups ag ON ag.id = ap.activity_group_id
JOIN strategies s ON s.id = ag.strategy_id
JOIN aspects a ON a.id = s.aspect_id
JOIN companies c ON c.id = a.company_id
WHERE c.company_code = 101;

COMMIT;