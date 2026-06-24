const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile('./src/migrations/mock/Matriks Jakpro Business Continuity Planning_File_Final Version.xlsx');
const sheet = workbook.Sheets['Full'];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

let sql = `DO $$
DECLARE
    v_company_id BIGINT;
    v_pic_id BIGINT;
    v_aspect_id BIGINT;
    v_strategy_id BIGINT;
    v_ag_id BIGINT;
    v_ap_id BIGINT;
BEGIN
    -- 1. Get Company
    SELECT id INTO v_company_id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)';

    -- Get PIC ID
    SELECT id INTO v_pic_id FROM users WHERE username = 'tito.hadi';

`;

let currentAspek = '';
let currentStrategi = '';
let currentAG = '';
let currentApSeq = 0;

function escapeSql(str) {
    if (!str) return '';
    return str.toString().replace(/'/g, "''");
}

function getEndDate(timeline) {
    if (!timeline) return null;
    const t = timeline.toString().toUpperCase();
    
    // Cek dari tahun terjauh (Y4) sampai terdekat (Y1)
    // Asumsi tahun fiskal mengikuti kuartal (Y1 berakhir Juni 2027)
    if (t.includes('Y4')) return '2030-06-30';
    if (t.includes('Y3')) return '2029-06-30';
    if (t.includes('Y2')) return '2028-06-30';
    if (t.includes('Y1')) return '2027-06-30';
    
    // Cek dari Quarter terjauh (Q4) sampai terdekat (Q1)
    // Berdasarkan info: Q1 mulai 1 Juli dan berakhir 30 September
    if (t.includes('Q4')) return '2027-06-30'; // Akhir Q4
    if (t.includes('Q3')) return '2027-03-31'; // Akhir Q3
    if (t.includes('Q2')) return '2026-12-31'; // Akhir Q2
    if (t.includes('Q1')) return '2026-09-30'; // Akhir Q1
    
    if (t.includes('BERKALA')) return null;

    return null;
}

function extractCodeOrder(text) {
    if (!text) return 'Z';
    const match = text.match(/^([\d\.A-Z]+)\s/);
    if (match) return match[1];
    return 'Z';
}

function cleanText(text) {
    if (!text) return '';
    return text.replace(/^([\d\.A-Z]+)\s/, '').trim();
}

// Data typically starts from row 4 or 5. We'll start from 4 as before.
for (let i = 4; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const aspekRaw = row[2];
    const strategiRaw = row[3];
    const agRaw = row[4];
    const apRaw = row[5];
    const outputRaw = row[7];
    const timelineRaw = row[9];
    const indicatorRaw = row[10];
    const kpiRaw = row[11];

    if (!apRaw) continue; // Skip if no Action Plan

    if (aspekRaw && cleanText(aspekRaw) !== cleanText(currentAspek)) {
        currentAspek = aspekRaw;
        const name = escapeSql(cleanText(currentAspek));
        sql += `    -- Aspect\n    INSERT INTO aspects (company_id, name, target_percentage)\n    VALUES (v_company_id, '${name}', 100)\n    RETURNING id INTO v_aspect_id;\n\n`;
    }

    if (strategiRaw && cleanText(strategiRaw) !== cleanText(currentStrategi)) {
        currentStrategi = strategiRaw;
        const name = escapeSql(cleanText(currentStrategi));
        const code = escapeSql(extractCodeOrder(currentStrategi));
        sql += `    -- Strategy\n    INSERT INTO strategies (aspect_id, name, code_order, target_percentage)\n    VALUES (v_aspect_id, '${name}', '${code}', 100)\n    RETURNING id INTO v_strategy_id;\n\n`;
    }

    if (agRaw && cleanText(agRaw) !== cleanText(currentAG)) {
        currentAG = agRaw;
        currentApSeq = 0; // Reset counter for new AG
        const name = escapeSql(cleanText(currentAG));
        const code = escapeSql(extractCodeOrder(currentAG));
        sql += `    -- Activity Group\n    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)\n    VALUES (v_strategy_id, '${name}', '${code}', 100)\n    RETURNING id INTO v_ag_id;\n\n`;
    }

    currentApSeq++;
    const agCodeOrder = extractCodeOrder(currentAG);
    const apName = escapeSql(cleanText(apRaw));
    const apCode = escapeSql(`${agCodeOrder}.${currentApSeq}`);
    const apOutput = escapeSql(outputRaw);
    const apIndicator = escapeSql(indicatorRaw);
    const apEnd = getEndDate(timelineRaw);
    const apEndSql = apEnd ? `'${apEnd}'` : 'NULL';

    sql += `    -- Action Plan\n    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)\n    VALUES (v_ag_id, '${apName}', '${apCode}', 100, '${apOutput}', '${apIndicator}', v_pic_id, ${apEndSql}, 'belum mulai')\n    RETURNING id INTO v_ap_id;\n`;

    if (kpiRaw) {
        const kpis = kpiRaw.toString().split('\n').map(k => k.replace(/^-/, '').trim()).filter(k => k);
        for (const kpi of kpis) {
            sql += `    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, '${escapeSql(kpi)}', 'belum mulai');\n`;
        }
    }

    sql += `    INSERT INTO history_activities (action_plan_id, user_id, description)\n    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');\n\n`;
}

sql += `END $$;\n`;

fs.writeFileSync('./src/migrations/mock/006_mock_data_jakpro_final.sql', sql);
console.log('Done generating 006_mock_data_jakpro_final.sql');
