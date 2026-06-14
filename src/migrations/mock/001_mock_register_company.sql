INSERT INTO sectors (name, code)
VALUES
('Properti', 'properti'),
('Transportasi', 'transportasi'),
('Perbankan', 'perbankan'),
('Air Minum', 'air_minum')
ON CONFLICT (code) DO NOTHING;

INSERT INTO companies (sector_id, name, company_code, company_type)
VALUES
((SELECT id FROM sectors WHERE code = 'properti'), 'PT Jakarta Propertindo (Jakpro)', 101, 'bumd'),
(NULL, 'Garuda Indonesia (Persero) Tbk', 102, 'lainnya')
ON CONFLICT (company_code) DO NOTHING;