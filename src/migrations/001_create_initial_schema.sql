-- =========================
-- MASTER TABLE: SECTOR
-- =========================
CREATE TABLE sectors (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================
-- MASTER TABLE: COMPANY
-- =========================
CREATE TABLE companies (
    id BIGSERIAL PRIMARY KEY,
    sector_id BIGINT NULL,
    name VARCHAR(255) NOT NULL,
    company_code INT UNIQUE,
    company_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    logo VARCHAR(255),

    CONSTRAINT fk_companies_sector
        FOREIGN KEY (sector_id)
        REFERENCES sectors(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_companies_company_type
        CHECK (company_type IN ('bpbumd', 'bumd', 'lainnya'))
);


-- =========================
-- USERS
-- =========================
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    position VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_users_role
        CHECK (role IN ('admin', 'user'))
);


-- =========================
-- ASPECT
-- =========================
CREATE TABLE aspects (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'belum mulai',
    weight NUMERIC(5,2),
    progress_percentage NUMERIC(5,2),
    target_percentage NUMERIC(5,2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_aspects_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_aspects_status
        CHECK (status IN (
            'belum mulai',
            'dalam progres',
            'selesai',
            'selesai terlambat',
            'terlambat'
        ))
);


-- =========================
-- STRATEGY
-- =========================
CREATE TABLE strategies (
    id BIGSERIAL PRIMARY KEY,
    aspect_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    code_order VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'belum mulai',
    weight NUMERIC(5,2),
    progress_percentage NUMERIC(5,2),
    target_percentage NUMERIC(5,2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_strategies_aspect
        FOREIGN KEY (aspect_id)
        REFERENCES aspects(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_strategies_status
        CHECK (status IN (
            'belum mulai',
            'dalam progres',
            'selesai',
            'selesai terlambat',
            'terlambat'
        ))
);



-- =========================
-- ACTIVITY GROUP
-- =========================
CREATE TABLE activity_groups (
    id BIGSERIAL PRIMARY KEY,
    strategy_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    code_order VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'belum mulai',
    weight NUMERIC(5,2),
    progress_percentage NUMERIC(5,2),
    target_percentage NUMERIC(5,2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_activity_groups_strategy
        FOREIGN KEY (strategy_id)
        REFERENCES strategies(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_activity_groups_status
        CHECK (status IN (
            'belum mulai',
            'dalam progres',
            'selesai',
            'selesai terlambat',
            'terlambat'
        ))
);

-- =========================
-- ACTION PLAN
-- =========================
CREATE TABLE action_plans (
    id BIGSERIAL PRIMARY KEY,
    activity_group_id BIGINT NOT NULL,
    pic_user_id BIGINT NULL,
    name TEXT NOT NULL,
    code_order VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'belum mulai',
    weight NUMERIC(5,2),
    progress_percentage NUMERIC(5,2),
    target_percentage NUMERIC(5,2),
    start_date DATE,
    end_date DATE,
    target_end_date DATE,
    output TEXT,
    indicator TEXT,
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_action_plans_activity_group
        FOREIGN KEY (activity_group_id)
        REFERENCES activity_groups(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_action_plans_pic_user
        FOREIGN KEY (pic_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_action_plans_status
        CHECK (status IN (
            'belum mulai',
            'dalam progres',
            'selesai',
            'selesai terlambat',
            'terlambat'
        ))
);


-- =========================
-- SUB ACTION PLAN
-- =========================
CREATE TABLE sub_action_plans (
    id BIGSERIAL PRIMARY KEY,
    action_plan_id BIGINT NOT NULL,
    pic_user_id BIGINT NULL,
    submitted_by_user_id BIGINT NULL,
    name TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pengajuan',
    submitted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sub_action_plans_action_plan
        FOREIGN KEY (action_plan_id)
        REFERENCES action_plans(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_sub_action_plans_pic_user
        FOREIGN KEY (pic_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_sub_action_plans_submitted_by_user
        FOREIGN KEY (submitted_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_sub_action_plans_status
        CHECK (status IN (
            'pengajuan',
            'verifikasi',
            'selesai',
            'terlambat',
            'ditolak'
        ))
);


-- =========================
-- SUB ACTION PLAN APPROVAL
-- =========================
CREATE TABLE sub_action_plan_approvals (
    id BIGSERIAL PRIMARY KEY,
    sub_action_plan_id BIGINT NOT NULL,
    approver_user_id BIGINT NOT NULL,
    approval_order INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'menunggu',
    notes TEXT,
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sub_action_plan_approvals_sub_action_plan
        FOREIGN KEY (sub_action_plan_id)
        REFERENCES sub_action_plans(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_sub_action_plan_approvals_approver_user
        FOREIGN KEY (approver_user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_sub_action_plan_approvals_order
        CHECK (approval_order IN (1, 2)),

    CONSTRAINT chk_sub_action_plan_approvals_status
        CHECK (status IN ('menunggu', 'setujui', 'tolak')),

    CONSTRAINT uq_sub_action_plan_approver
        UNIQUE (sub_action_plan_id, approver_user_id),

    CONSTRAINT uq_sub_action_plan_approval_order
        UNIQUE (sub_action_plan_id, approval_order)
);


-- =========================
-- KPI
-- =========================
CREATE TABLE kpis (
    id BIGSERIAL PRIMARY KEY,
    action_plan_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'belum mulai',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_kpis_action_plan
        FOREIGN KEY (action_plan_id)
        REFERENCES action_plans(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_kpis_status
        CHECK (status IN (
            'belum mulai',
            'dalam progres',
            'tercapai',
            'tidak tercapai'
        ))
);

-- =========================
-- DOCUMENT
-- =========================
CREATE TABLE documents (
    id BIGSERIAL PRIMARY KEY,
    action_plan_id BIGINT NULL,
    sub_action_plan_id BIGINT NULL,
    uploaded_by_user_id BIGINT NULL,
    verified_by_user_id BIGINT NULL,

    name VARCHAR(255) NOT NULL,
    description TEXT,
    original_file_name VARCHAR(255),
    file_type VARCHAR(50),
    file_size BIGINT,
    file_path TEXT NOT NULL,

    status VARCHAR(50) NOT NULL DEFAULT 'diunggah',
    rejection_reason TEXT,

    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_documents_action_plan
        FOREIGN KEY (action_plan_id)
        REFERENCES action_plans(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_documents_sub_action_plan
        FOREIGN KEY (sub_action_plan_id)
        REFERENCES sub_action_plans(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_documents_uploaded_by_user
        FOREIGN KEY (uploaded_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_documents_verified_by_user
        FOREIGN KEY (verified_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_documents_status
        CHECK (status IN (
            'draf',
            'diunggah',
            'terverifikasi',
            'ditolak',
            'diarsipkan'
        )),

    CONSTRAINT chk_documents_only_one_parent
        CHECK (
            (
                action_plan_id IS NOT NULL
                AND sub_action_plan_id IS NULL
            )
            OR
            (
                action_plan_id IS NULL
                AND sub_action_plan_id IS NOT NULL
            )
        )
);


-- =========================
-- HISTORY ACTIVITY
-- =========================
CREATE TABLE history_activities (
    id BIGSERIAL PRIMARY KEY,
    action_plan_id BIGINT NULL,
    sub_action_plan_id BIGINT NULL,
    user_id BIGINT NULL,
    description TEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_history_activities_action_plan
        FOREIGN KEY (action_plan_id)
        REFERENCES action_plans(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_history_activities_sub_action_plan
        FOREIGN KEY (sub_action_plan_id)
        REFERENCES sub_action_plans(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_history_activities_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_history_activities_only_one_parent
        CHECK (
            (
                action_plan_id IS NOT NULL
                AND sub_action_plan_id IS NULL
            )
            OR
            (
                action_plan_id IS NULL
                AND sub_action_plan_id IS NOT NULL
            )
        )
);