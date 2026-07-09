-- =========================
-- MOCK REGISTER USERS DJ & PSJ
-- Password plain: password123
-- Hash bcrypt: $2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6
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
-- Dharma Jaya Users
(
    (SELECT id FROM companies WHERE name ILIKE '%Dharma Jaya%'),
    'afan.dj',
    '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
    'Afan',
    'admin',
    'Requestor',
    TRUE
),
(
    (SELECT id FROM companies WHERE name ILIKE '%Dharma Jaya%'),
    'raditya.dj',
    '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
    'Raditya',
    'admin',
    'Approver',
    TRUE
),
-- PSJ Users
(
    (SELECT id FROM companies WHERE name ILIKE '%Pembangunan Sarana Jaya%'),
    'dwi.psj',
    '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
    'Dwi',
    'admin',
    'Requestor',
    TRUE
),
(
    (SELECT id FROM companies WHERE name ILIKE '%Pembangunan Sarana Jaya%'),
    'bernard.psj',
    '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
    'Bernard',
    'admin',
    'Approver',
    TRUE
)
ON CONFLICT (username) DO NOTHING;
