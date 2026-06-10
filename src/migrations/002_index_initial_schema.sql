CREATE INDEX idx_companies_sector_id
ON companies(sector_id);

CREATE INDEX idx_companies_company_type
ON companies(company_type);

CREATE INDEX idx_users_company_id
ON users(company_id);

CREATE INDEX idx_aspects_company_id
ON aspects(company_id);

CREATE INDEX idx_strategies_aspect_id
ON strategies(aspect_id);

CREATE INDEX idx_activity_groups_strategy_id
ON activity_groups(strategy_id);

CREATE INDEX idx_action_plans_activity_group_id
ON action_plans(activity_group_id);

CREATE INDEX idx_action_plans_pic_user_id
ON action_plans(pic_user_id);

CREATE INDEX idx_sub_action_plans_action_plan_id
ON sub_action_plans(action_plan_id);

CREATE INDEX idx_sub_action_plans_pic_user_id
ON sub_action_plans(pic_user_id);

CREATE INDEX idx_sub_action_plans_submitted_by_user_id
ON sub_action_plans(submitted_by_user_id);

CREATE INDEX idx_sub_action_plans_status
ON sub_action_plans(status);

CREATE INDEX idx_sub_action_plan_approvals_sub_action_plan_id
ON sub_action_plan_approvals(sub_action_plan_id);

CREATE INDEX idx_sub_action_plan_approvals_approver_user_id
ON sub_action_plan_approvals(approver_user_id);

CREATE INDEX idx_sub_action_plan_approvals_status
ON sub_action_plan_approvals(status);

CREATE INDEX idx_kpis_action_plan_id
ON kpis(action_plan_id);

CREATE INDEX idx_documents_action_plan_id
ON documents(action_plan_id);

CREATE INDEX idx_documents_sub_action_plan_id
ON documents(sub_action_plan_id);

CREATE INDEX idx_history_activities_action_plan_id
ON history_activities(action_plan_id);

CREATE INDEX idx_history_activities_sub_action_plan_id
ON history_activities(sub_action_plan_id);

CREATE INDEX idx_aspects_status
ON aspects(status);

CREATE INDEX idx_strategies_status
ON strategies(status);

CREATE INDEX idx_activity_groups_status
ON activity_groups(status);

CREATE INDEX idx_action_plans_status
ON action_plans(status);