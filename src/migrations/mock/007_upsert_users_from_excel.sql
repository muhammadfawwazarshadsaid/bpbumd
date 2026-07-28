-- =============================================================
-- AUTO-GENERATED: Insert/Upsert users from "Akun BUMD.xlsx"
-- Generated at: 2026-07-21T04:59:30.206Z
-- =============================================================

-- Ensure companies exist
INSERT INTO companies (sector_id, name, company_code, company_type)
VALUES
  (NULL, 'Perumda Dharma Jaya', 102, 'bumd'),
  (NULL, 'Perumda Pembangunan Sarana Jaya', 103, 'bumd')
ON CONFLICT (company_code) DO NOTHING;

-- Upsert users (ON CONFLICT username → update password, name, position)
INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'Perumda Pembangunan Sarana Jaya'),
  'bernard.yohanes',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Bernard Yohanes',
  'admin',
  'Direktur Utama',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'Perumda Pembangunan Sarana Jaya'),
  'arjo.baroto',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Arjo Baroto',
  'admin',
  'Direktur Pengembangan',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'Perumda Pembangunan Sarana Jaya'),
  'tri.handoyo',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Ignatius Tri Handoyo',
  'admin',
  'Direktur Administrasi dan Keuangan',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'Perumda Pembangunan Sarana Jaya'),
  'wahyudi.hidayat',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Muhamad Wahyudi Hidayat',
  'admin',
  'Kepala Divisi Satuan Pengawasan Internal',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'Perumda Pembangunan Sarana Jaya'),
  'dwi.ananto',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Dwi Ananto',
  'admin',
  'GM Divisi Pengadaan',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'Perumda Pembangunan Sarana Jaya'),
  'aldi.pradana',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'I Gede Aldi Pradana',
  'admin',
  'GM Divisi Hukum',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'Perumda Pembangunan Sarana Jaya'),
  'rigandatogatorop01',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Drs. Riganda Togatorop',
  'admin',
  'GM SBU Novotel',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'Perumda Pembangunan Sarana Jaya'),
  'henriko.ganesha',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Henriko Ganesha Putra',
  'admin',
  'GM SBU Warna',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'Perumda Pembangunan Sarana Jaya'),
  'erik.raharjo',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Erik Willi Raharjo Pasaribu',
  'admin',
  'GM SBU Apartemen',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'Perumda Pembangunan Sarana Jaya'),
  'andy.purba',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Andy Sakti P.Purba',
  'admin',
  'GM Divisi Pengembangan Bisnis',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'Perumda Pembangunan Sarana Jaya'),
  'maulina.wulansari',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Maulina Wulansari',
  'admin',
  'GM Divisi Perencanaan dan Pembangunan',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'Perumda Pembangunan Sarana Jaya'),
  'bodro.bahwono',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Bodro Bahwono',
  'admin',
  'GM SBU Teknologi',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'Perumda Pembangunan Sarana Jaya'),
  'bayu.romas',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Bayu Romas',
  'admin',
  'GM PMO',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'Perumda Pembangunan Sarana Jaya'),
  'dian.wahyuni',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Dian Wahyuni',
  'admin',
  'GM Divisi Manajemen Risiko',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'Perumda Pembangunan Sarana Jaya'),
  'retty.susanti',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Retty Wahyu Susanti',
  'admin',
  'GM Divisi Keuangan dan Akuntansi',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'Perumda Pembangunan Sarana Jaya'),
  'nurfaried.qoriantoro',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Nurfaried Qoriantoro',
  'admin',
  'GM Divisi SDM, Umum dan Aset',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
  'lusiana.herawati',
  '$2b$10$4fNnok0gRBZ84P99Oe8z4OlOKBsu.valWVQu0I2ZMiNI8jagGd8na',
  'Lusiana Herawati',
  'admin',
  'Komisaris Utama',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
  'kresna.putra',
  '$2b$10$St0P1IQRa2tmafWAb5TYbOxK9UZqBVX0JrtseA5DcOFOKYGTqKMN2',
  'Kresna Putra',
  'admin',
  'Komisaris',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
  'syaefuloh.hidayat',
  '$2b$10$Lkb17lEBfUEQ12z4MtrxTeiz6nro57VyeiQdVXIbEr8fkB3kEpTXi',
  'Syaefuloh Hidayat',
  'admin',
  'Komisaris',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
  'ammarsjah',
  '$2b$10$ljzSEMcORZShteUgNS.aquuqKO.sZf7H45HbrOCY0atWBys0WUjA.',
  'Ammarsjah',
  'admin',
  'Komisaris',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
  'iwan.takwin',
  '$2b$10$lgmql5/kYwK83Age5WVJ4.Z07rQQnE/MHpSMCAawsuwmzMt5e/cd6',
  'Iwan Takwin',
  'admin',
  'Direktur Utama',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
  'solihin.dj',
  '$2b$10$f8GvYyYoihiq3M0tUV4jA.HVFMm/21qoSxfPwsfmzrkUPw4v71sAK',
  'Solihin',
  'admin',
  'Direktur Dukungan Bisnis',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
  'troficiendy.suroso',
  '$2b$10$wUy4q73qf7caNp8TqQA/nOdI73mRakdXYFiNvjy2Cw3Sqby/hrVh6',
  'Troficiendy Suroso',
  'admin',
  'Direktur Bisnis dan Operasional',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
  'robert.sarjaka',
  '$2b$10$jdALF0nWlXQOx.yjZ.yod.oem1COy9HXcQDYEiDcDq1GzGpudSpAS',
  'Robert Sarjaka',
  'admin',
  'Direktur Teknik dan Pengembangan',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
  'bima.tesdayu',
  '$2b$10$rs/M/xgAvTKHdhKdIBEfF.33ddBLwyjWXR3WdOrF0FVt8pmS9UQVq',
  'Bima Tesdayu',
  'admin',
  'Direktur Keuangan',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
  'rialfin',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'M. Alfin Rinaldinsyah',
  'admin',
  'VP Corporate Secretary',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
  'tjahjo.dwi',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Tjahjo Dwi Agus Idawati',
  'admin',
  'VP Internal Audit',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
  'agus.jp',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Agus Jaya Putra',
  'admin',
  'VP Legal',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
  'tito.hadi',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Tito H. Dewan',
  'admin',
  'VP Strategic Plan & Program',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
  'yedi.isnandi',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Yedi Isnandi',
  'admin',
  'VP Accounting, Tax & Investment',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
  'ade',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Ade Nur Hidayat',
  'admin',
  'VP Finance & Budget',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
  'aditya.dm',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Aditya Dwi Martanto',
  'admin',
  'VP GRC & Management System',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
  'fahrianto',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Fahrianto Haris',
  'admin',
  'VP Human Capital',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
  'rizal.chaniago',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Rizal Zainuddin Chaniago',
  'admin',
  'VP Procurement',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
  'ajipratomo.bs',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'B.S. Ajipratomo',
  'admin',
  'VP Information Technology & General Affairs',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
  'gerry.a',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Gerry Anzala',
  'admin',
  'VP Business Development',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
  'hanif.hanif',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Hanif',
  'admin',
  'VP Project Engineering',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
  'ibnu',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Ibnu Gumelar',
  'admin',
  'VP Asset Management',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
  'ramdani',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Ramdani Akbar',
  'admin',
  'Project Director LRT',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
  'luky_i',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Luky Ismayanti',
  'admin',
  'Project Director Revitalisasi Pasar Muara Karang',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
  'yeni.w',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Yeni Widayanti',
  'admin',
  'VP SBU Office',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
  'shinta.sa',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Shinta Syamsul Arief',
  'admin',
  'Head of SBU Jakarta International Stadium',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
  'arya.aditya',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Arya Aditya Wardhana',
  'admin',
  'Head of SBU Jakarta International Velodrome',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
  'anya.aprillia',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Anya A. C.',
  'admin',
  'Head of SBU Taman Ismail Marzuki',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
  'ayub.zailani',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Laode Ayub Zailani',
  'admin',
  'General Manager SBU Hotel & Apartment',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
  'putra',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Putra Perdana',
  'admin',
  'Head of SBU Property',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)'),
  'ekomurdi',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Eko Murdiyanto',
  'admin',
  'Head of SBU PMK',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'Perumda Dharma Jaya'),
  'raditya.endra',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Raditya Endra Budiman',
  'admin',
  'Direktur Utama',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'Perumda Dharma Jaya'),
  'sri.wahyuningsih',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Sri Wahyuningsih',
  'admin',
  'Kepala Sekper & Legal',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'Perumda Dharma Jaya'),
  'afan.wahyu',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Afan Wahyu Syafii',
  'admin',
  'Plt. Kepala Divisi Manajemen Informasi System',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'Perumda Dharma Jaya'),
  'ahmad.zaid',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Ahmad Zaid Mahfudi',
  'admin',
  'Kesatuan Pengawas Intern',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'Perumda Dharma Jaya'),
  'muhammad.irham',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Muhammad Irham',
  'admin',
  'Kepala Divisi Penugasan & Pengadaan',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'Perumda Dharma Jaya'),
  'irwan.nusyirwan',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Irwan Nusyirwan',
  'admin',
  'Direktur Bisnis',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'Perumda Dharma Jaya'),
  'taufiqurrahman',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Taufiqurrahman',
  'admin',
  'Kepala Divisi RPH & Property',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'Perumda Dharma Jaya'),
  'diki.firmansyah',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Diki Firmansyah',
  'admin',
  'Kepala Divisi Penggemukan',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'Perumda Dharma Jaya'),
  'rendy.riyanto',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Rendy Riyanto',
  'admin',
  'Kepala Divisi Hub Logistik',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'Perumda Dharma Jaya'),
  'muhammad.ichsan',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Muhammad Ichsan',
  'admin',
  'Kepala Divisi Penjualan (Komersil)',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'Perumda Dharma Jaya'),
  'okto.hendri',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Okto Hendri Fahlefi',
  'admin',
  'Plt. Kepala Divisi Perdagangan',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'Perumda Dharma Jaya'),
  'privella.harlim',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Privella Harlim',
  'admin',
  'Kepala Divisi Pemasaran',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'Perumda Dharma Jaya'),
  'maulana.lazuardi',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Maulana Lazuardi',
  'admin',
  'Direktur Keuangan & SDM',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'Perumda Dharma Jaya'),
  'alifian.akhsan',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'Alifian Akhsan Afif',
  'admin',
  'Kepala Divisi Keuangan & Akuntansi',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (company_id, username, password_hash, name, role, position, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = 'Perumda Dharma Jaya'),
  'm.dzil',
  '$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6',
  'M Dzil Ikram Jani',
  'admin',
  'Plt. Kepala Divisi SDM & Umum',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  company_id = EXCLUDED.company_id,
  updated_at = CURRENT_TIMESTAMP;

