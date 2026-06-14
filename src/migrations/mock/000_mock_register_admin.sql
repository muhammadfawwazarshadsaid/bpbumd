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
    is_active
)
VALUES
(
    1,
    'admin_bpbumd',
    '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
    'Admin BPBUMD',
    'admin',
    TRUE
)
ON CONFLICT (username) DO NOTHING;