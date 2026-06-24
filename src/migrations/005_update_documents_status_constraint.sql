ALTER TABLE documents DROP CONSTRAINT IF EXISTS chk_documents_status;
ALTER TABLE documents ADD CONSTRAINT chk_documents_status CHECK (status IN ('draf', 'diunggah', 'verifikasi', 'terverifikasi', 'ditolak', 'diarsipkan'));
