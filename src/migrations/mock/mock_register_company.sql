INSERT INTO sectors (name, code)
VALUES
('Properti', 'properti'),
('Transportasi', 'transportasi'),
('Perbankan', 'perbankan'),
('Air Minum', 'air_minum')
ON CONFLICT (code) DO NOTHING;

INSERT INTO companies (sector_id, name, company_code, company_type)
VALUES
(NULL, 'BPBUMD', 100, 'bpbumd'),
((SELECT id FROM sectors WHERE code = 'properti'), 'Jakpro', 101, 'bumd')
ON CONFLICT (company_code) DO NOTHING;