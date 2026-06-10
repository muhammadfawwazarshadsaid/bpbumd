-- =========================
-- MOCK REGISTER USERS
-- Password plain: password123
-- Hash bcrypt:
-- $2a$10$7EqJtq98hPqEX7fNZaFWoOHiq7iX4HTiK7jfb2Lfv2tJ2xl8W8L5K
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
    '$2a$10$7EqJtq98hPqEX7fNZaFWoOHiq7iX4HTiK7jfb2Lfv2tJ2xl8W8L5K',
    'Admin BPBUMD',
    'admin',
    TRUE
),
(
    2,
    'user_jakpro',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoOHiq7iX4HTiK7jfb2Lfv2tJ2xl8W8L5K',
    'User Jakpro',
    'user',
    TRUE
),
(
    2,
    'approver_jakpro_1',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoOHiq7iX4HTiK7jfb2Lfv2tJ2xl8W8L5K',
    'Approver Jakpro 1',
    'user',
    TRUE
),
(
    2,
    'approver_jakpro_2',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoOHiq7iX4HTiK7jfb2Lfv2tJ2xl8W8L5K',
    'Approver Jakpro 2',
    'user',
    TRUE
)
ON CONFLICT (username) DO NOTHING;