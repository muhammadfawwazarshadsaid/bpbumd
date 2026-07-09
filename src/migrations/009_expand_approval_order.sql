-- =========================
-- EXPAND APPROVAL ORDER: remove hardcoded 2-limit
-- =========================

-- Drop the old constraint that limits approval_order to 1 or 2
ALTER TABLE sub_action_plan_approvals
  DROP CONSTRAINT IF EXISTS chk_sub_action_plan_approvals_order;

-- Add new constraint: approval_order must be >= 1 (no upper limit)
ALTER TABLE sub_action_plan_approvals
  ADD CONSTRAINT chk_sub_action_plan_approvals_order
  CHECK (approval_order >= 1);
