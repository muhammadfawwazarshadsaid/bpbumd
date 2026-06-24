DO $$
DECLARE
    v_company_id BIGINT;
BEGIN
    -- 1. Dapatkan ID Perusahaan
    SELECT id INTO v_company_id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)';

    IF v_company_id IS NOT NULL THEN
        -- 1. Hapus dokumen terkait sub_action_plans (jika ada)
        DELETE FROM documents 
        WHERE sub_action_plan_id IN (
            SELECT sap.id FROM sub_action_plans sap
            JOIN action_plans ap ON ap.id = sap.action_plan_id
            JOIN activity_groups ag ON ag.id = ap.activity_group_id
            JOIN strategies s ON s.id = ag.strategy_id
            JOIN aspects a ON a.id = s.aspect_id
            WHERE a.company_id = v_company_id
        );
        
        -- 2. Hapus persetujuan (approvals) terkait sub_action_plans (jika ada)
        DELETE FROM sub_action_plan_approvals 
        WHERE sub_action_plan_id IN (
            SELECT sap.id FROM sub_action_plans sap
            JOIN action_plans ap ON ap.id = sap.action_plan_id
            JOIN activity_groups ag ON ag.id = ap.activity_group_id
            JOIN strategies s ON s.id = ag.strategy_id
            JOIN aspects a ON a.id = s.aspect_id
            WHERE a.company_id = v_company_id
        );

        -- 3. Hapus sub_action_plans (jika ada)
        DELETE FROM sub_action_plans 
        WHERE action_plan_id IN (
            SELECT ap.id FROM action_plans ap
            JOIN activity_groups ag ON ag.id = ap.activity_group_id
            JOIN strategies s ON s.id = ag.strategy_id
            JOIN aspects a ON a.id = s.aspect_id
            WHERE a.company_id = v_company_id
        );

        -- 4. Hapus history activities terkait action_plans
        DELETE FROM history_activities
        WHERE action_plan_id IN (
            SELECT ap.id FROM action_plans ap
            JOIN activity_groups ag ON ag.id = ap.activity_group_id
            JOIN strategies s ON s.id = ag.strategy_id
            JOIN aspects a ON a.id = s.aspect_id
            WHERE a.company_id = v_company_id
        );

        -- 5. Hapus kpis terkait action_plans
        DELETE FROM kpis
        WHERE action_plan_id IN (
            SELECT ap.id FROM action_plans ap
            JOIN activity_groups ag ON ag.id = ap.activity_group_id
            JOIN strategies s ON s.id = ag.strategy_id
            JOIN aspects a ON a.id = s.aspect_id
            WHERE a.company_id = v_company_id
        );

        -- 6. Hapus dokumen terkait action_plans (jika ada)
        DELETE FROM documents 
        WHERE action_plan_id IN (
            SELECT ap.id FROM action_plans ap
            JOIN activity_groups ag ON ag.id = ap.activity_group_id
            JOIN strategies s ON s.id = ag.strategy_id
            JOIN aspects a ON a.id = s.aspect_id
            WHERE a.company_id = v_company_id
        );

        -- 7. Hapus action_plans 
        DELETE FROM action_plans 
        WHERE activity_group_id IN (
            SELECT ag.id FROM activity_groups ag
            JOIN strategies s ON s.id = ag.strategy_id
            JOIN aspects a ON a.id = s.aspect_id
            WHERE a.company_id = v_company_id
        );

        -- 8. Hapus activity_groups
        DELETE FROM activity_groups 
        WHERE strategy_id IN (
            SELECT s.id FROM strategies s
            JOIN aspects a ON a.id = s.aspect_id
            WHERE a.company_id = v_company_id
        );

        -- 9. Hapus strategies
        DELETE FROM strategies 
        WHERE aspect_id IN (
            SELECT id FROM aspects WHERE company_id = v_company_id
        );

        -- 10. Hapus aspect
        DELETE FROM aspects WHERE company_id = v_company_id;
    END IF;
END $$;
