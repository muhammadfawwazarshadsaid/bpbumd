-- =========================
-- MOCK REGISTER USERS
-- Password plain: password123
-- Hash bcrypt (generated with bcryptjs v3):
-- $2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6
-- =========================

INSERT INTO users (
    company_id,
    username,
    password_hash,
    name,
    role,
    position,
    is_active
)
VALUES
(
    (SELECT id FROM companies WHERE name = 'BPBUMD'),
    'hsyaeful397',
    '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
    'Syaefuloh Hidayat',
    'admin',
    'Kepala BPBUMD',
    TRUE
),
(
    (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
    'bimatesdayu',
    '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
    'Bima Tesdayu',
    'admin',
    'Direktur Keuangan',
    TRUE
),
(
    (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
    'tito.hadi',
    '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
    'Tito Hadi Dewan',
    'admin',
    'VP Strategic Plan & Program',
    TRUE
)
ON CONFLICT (username) DO NOTHING;