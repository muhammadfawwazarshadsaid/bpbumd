CREATE TABLE document_approvals (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL,
    approver_user_id BIGINT NOT NULL,
    approval_order INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'menunggu',
    notes TEXT,
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_document_approvals_document
        FOREIGN KEY (document_id)
        REFERENCES documents(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_document_approvals_approver_user
        FOREIGN KEY (approver_user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_document_approvals_order
        CHECK (approval_order IN (1, 2)),

    CONSTRAINT chk_document_approvals_status
        CHECK (status IN ('menunggu', 'disetujui', 'ditolak'))
);

CREATE INDEX idx_document_approvals_document_id ON document_approvals(document_id);
CREATE INDEX idx_document_approvals_approver_user_id ON document_approvals(approver_user_id);
CREATE INDEX idx_document_approvals_status ON document_approvals(status);

CREATE TRIGGER trg_document_approvals_updated_at
BEFORE UPDATE ON document_approvals
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
