DO $$
DECLARE
    v_company_id BIGINT;
    v_pic_id BIGINT;
    v_aspect_id BIGINT;
    v_strategy_id BIGINT;
    v_ag_id BIGINT;
    v_ap1_id BIGINT;
    v_ap2_id BIGINT;
    v_ap3_id BIGINT;
    v_ap4_id BIGINT;
BEGIN
    -- 1. Get Company and PIC IDs
    SELECT id INTO v_company_id FROM companies WHERE name = 'PT Jakarta Propertindo (Jakpro)';
    SELECT id INTO v_pic_id FROM users WHERE username = 'tito.hadi';

    -- Cleanup previous mock data if exists
    DELETE FROM aspects WHERE company_id = v_company_id AND name = 'Strategi Pendekatan Terhadap Fiskal dan Aset Penugasan';

    -- 2. Insert Aspect
    INSERT INTO aspects (company_id, name, target_percentage)
    VALUES (v_company_id, 'Strategi Pendekatan Terhadap Fiskal dan Aset Penugasan', 100)
    RETURNING id INTO v_aspect_id;

    -- 3. Insert Strategy
    INSERT INTO strategies (aspect_id, name, code_order, target_percentage)
    VALUES (v_aspect_id, 'Menata ulang struktur pengalihan aset penugasan melalui kajian dan penetapan skema transaksi yang layak secara tata kelola dan fiskal', 'A', 100)
    RETURNING id INTO v_strategy_id;

    -- 4. Insert Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Mengonsolidasikan kajian eksisting atas seluruh opsi pengalihan aset penugasan dan menetapkan Daftar Induk Aset Penugasan sebagai acuan tunggal', '1.A.1', 100)
    RETURNING id INTO v_ag_id;

    -- 5. Insert Action Plans
    -- AP 1
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (
        v_ag_id,
        'Menyediakan akses terhadap seluruh dokumen kajian dan studi pengalihan aset penugasan yang berada di sisi BP BUMD atau Pemprov, termasuk kajian terdahulu atas opsi pengalihan LRT Jakarta (Jika ada)',
        '1.A.1.1',
        100,
        'Daftar Induk Aset Penugasan Jakpro yang memuat per aset:
Nama dan dasar hukum penugasan
Status eksisting
Rencana pengelolaan beserta justifikasi
Tonggak tahapan berikutnya dan target tanggal
Valuasi per aset (Cost Approach): nilai penggantian dan akumulasi penyusutan
PIC
Tanggal pembaruan terakhir',
        'Kelengkapan cakupan aset penugasan dalam Daftar Induk
Ketersediaan valuasi per aset menggunakan Cost Approach
Kesesuaian rencana pengelolaan dengan kondisi terkini per aset',
        NULL,
        '2026-06-20',
        'belum mulai'
    ) RETURNING id INTO v_ap1_id;

    -- AP 2
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (
        v_ag_id,
        'Menyediakan akses terhadap seluruh dokumen serah terima aset penugasan dan dokumen kondisi awal aset yang tersimpan di BPAD untuk keperluan rekonstruksi kondisi aset',
        '1.A.1.2',
        100,
        'Dokumen Rangkuman Kondisi Aset Penugasan Eksisting Jakpro yang memuat per aset:
Kondisi awal: spesifikasi teknis, kondisi fisik, dan nilai pada saat penyerahan penugasan
Kondisi Terkini: kondisi fisik terkini, nilai buku, tingkat penyusutan, dan catatan kerusakan/pemeliharaan
Analisis kondisi awal vs terkini: investasi pemeliharaan yang telah dilakukan Jakpro
Implikasi terhadap nilai transfer yang wajar',
        'Kelengkapan rekonstruksi kondisi awal per aset
Ketersediaan data kondisi terkini yang terverifikasi
Konsistensi data kondisi aset dengan laporan keuangan Jakpro',
        NULL,
        '2026-06-20',
        'belum mulai'
    ) RETURNING id INTO v_ap2_id;

    -- AP 3
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (
        v_ag_id,
        'Menerima dan memvalidasi Dokumen Rangkuman Kondisi Aset Penugasan Eksisting dari Jakpro serta mengkonfirmasi kesesuaian data dengan catatan aset yang tersimpan di BPAD',
        '1.A.1.3',
        100,
        'Bukti Penyerahan Resmi Dokumen Rangkuman Kondisi Aset Penugasan Eksisting kepada BPAD yang memuat:
Tanda terima resmi dari BPAD
Konfirmasi penerimaan dan validasi dari BPAD
Catatan perbedaan data (jika ada) beserta resolusi yang disepakati',
        'Kelengkapan dokumen yang diserahkan
Konfirmasi penerimaan dan validasi oleh BPAD
Ketiadaan perbedaan material antara data Jakpro dan catatan BPAD',
        NULL,
        '2026-06-20',
        'belum mulai'
    ) RETURNING id INTO v_ap3_id;

    -- AP 4 (with PIC)
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (
        v_ag_id,
        'Memberikan klarifikasi atas posisi dan pertimbangan yang pernah menghambat eksekusi masing-masing opsi pengalihan LRT Jakarta dari sisi Pemprov dan BP BUMD',
        '1.A.1.4',
        100,
        'Dokumen Konsolidasi Kajian Pengalihan LRT Jakarta yang memuat per opsi:
Ringkasan opsi: (1) Transfer ke PT MRT Jakarta, (2) Pengurangan modal Pemprov DKI, (3) Pembentukan entitas / SPV baru
Status dan hambatan implementasi per opsi
Implikasi fiskal dan hukum yang teridentifikasi
Celah studi yang masih perlu diperdalam per opsi',
        'Kelengkapan cakupan opsi yang pernah dikaji
Kejelasan hambatan dan celah studi per opsi',
        v_pic_id,
        '2026-06-20',
        'belum mulai'
    ) RETURNING id INTO v_ap4_id;

    -- 6. Insert KPIs for AP 4
    INSERT INTO kpis (action_plan_id, name, status)
    VALUES 
    (v_ap4_id, 'Ketiga opsi pengalihan LRT Jakarta terdokumentasi lengkap (Ya/Tidak)', 'belum mulai'),
    (v_ap4_id, 'Setiap opsi memiliki uraian hambatan yang spesifik dan berbasis fakta (Ya/Tidak)', 'belum mulai');

    -- 7. Insert History Activities
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES 
    (v_ap1_id, NULL, 'Rencana Aksi dibuat secara otomatis oleh sistem'),
    (v_ap2_id, NULL, 'Rencana Aksi dibuat secara otomatis oleh sistem'),
    (v_ap3_id, NULL, 'Rencana Aksi dibuat secara otomatis oleh sistem'),
    (v_ap4_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)'),
    (v_ap4_id, v_pic_id, 'KPI "Ketiga opsi pengalihan LRT Jakarta terdokumentasi lengkap (Ya/Tidak)" diset menjadi "belum mulai"'),
    (v_ap4_id, v_pic_id, 'KPI "Setiap opsi memiliki uraian hambatan yang spesifik dan berbasis fakta (Ya/Tidak)" diset menjadi "belum mulai"');

END $$;
