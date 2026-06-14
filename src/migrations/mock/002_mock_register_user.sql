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
    2,
    'user_jakpro',
    '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
    'User Jakpro',
    'user',
    TRUE
),
(
    2,
    'approver_jakpro_1',
    '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
    'Approver Jakpro 1',
    'user',
    TRUE
),
(
    2,
    'approver_jakpro_2',
    '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
    'Approver Jakpro 2',
    'user',
    TRUE
)
ON CONFLICT (username) DO NOTHING;