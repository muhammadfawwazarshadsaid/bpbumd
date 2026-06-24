-- =========================
-- ALTER NAME COLUMNS TO TEXT
-- =========================
-- Mengubah tipe data kolom name menjadi TEXT untuk mengakomodasi teks yang panjang dari impor Excel
ALTER TABLE aspects ALTER COLUMN name TYPE TEXT;
ALTER TABLE strategies ALTER COLUMN name TYPE TEXT;
ALTER TABLE activity_groups ALTER COLUMN name TYPE TEXT;
ALTER TABLE kpis ALTER COLUMN name TYPE TEXT;
