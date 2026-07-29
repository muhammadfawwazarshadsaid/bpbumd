-- =========================
-- ADD SOFT DELETE AND RESTORE
-- =========================

-- Add deleted_at and deleted_by_user_id to action_plans
ALTER TABLE action_plans ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE action_plans ADD COLUMN deleted_by_user_id BIGINT NULL;
ALTER TABLE action_plans
  ADD CONSTRAINT fk_action_plans_deleted_by_user
  FOREIGN KEY (deleted_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Add deleted_at and deleted_by_user_id to sub_action_plans
ALTER TABLE sub_action_plans ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE sub_action_plans ADD COLUMN deleted_by_user_id BIGINT NULL;
ALTER TABLE sub_action_plans
  ADD CONSTRAINT fk_sub_action_plans_deleted_by_user
  FOREIGN KEY (deleted_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Add metadata JSONB to history_activities to store references for restored items
ALTER TABLE history_activities ADD COLUMN metadata JSONB NULL;
