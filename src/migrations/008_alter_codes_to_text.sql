-- =========================
-- ALTER ALL CODE_ORDER TO TEXT
-- =========================
ALTER TABLE action_plans ALTER COLUMN code_order TYPE TEXT;
ALTER TABLE activity_groups ALTER COLUMN code_order TYPE TEXT;
ALTER TABLE strategies ALTER COLUMN code_order TYPE TEXT;
ALTER TABLE action_plans ALTER COLUMN status TYPE TEXT;
ALTER TABLE activity_groups ALTER COLUMN status TYPE TEXT;
ALTER TABLE strategies ALTER COLUMN status TYPE TEXT;
ALTER TABLE aspects ALTER COLUMN status TYPE TEXT;
