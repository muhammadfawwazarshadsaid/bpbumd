DO $$
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

    -- Aspect
    INSERT INTO aspects (company_id, name, target_percentage)
    VALUES (v_company_id, 'Strategi Pendekatan Terhadap Fiskal dan Aset Penugasan', 100)
    RETURNING id INTO v_aspect_id;

    -- Strategy
    INSERT INTO strategies (aspect_id, name, code_order, target_percentage)
    VALUES (v_aspect_id, 'Menata ulang struktur pengalihan aset penugasan melalui kajian dan penetapan skema transaksi yang layak secara tata kelola dan fiskal', 'A.', 100)
    RETURNING id INTO v_strategy_id;

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Mengonsolidasikan kajian eksisting atas seluruh opsi pengalihan aset penugasan dan menetapkan Daftar Induk Aset Penugasan sebagai acuan tunggal', '1.A.1', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyusun Daftar Induk Aset Penugasan Jakpro yang memuat per aset: 
- Nama aset
- Dasar hukum penugasan
- Status eksisting
- Valuasi per aset menggunakan pendekatan biaya (Cost Approach), mencakup estimasi nilai penggantian aset dikurangi akumulasi penyusutan, karena nilai perolehan aset-aset penugasan perlu diverifikasi ulang kewajarannya
- Treatment yang direncanakan (pengalihan/monetisasi/PSO/evaluasi lanjutan)
- Milestone berikutnya 
- PIC
- Tanggal pembaruan terakhir', '1.A.1.1', 100, 'Daftar Induk Aset Penugasan Jakpro yang memuat per aset:
- Nama dan dasar hukum penugasan
- Status eksisting
- Rencana pengelolaan beserta justifikasi
- Tonggak tahapan berikutnya dan target tanggal
- Valuasi per aset (Cost Approach): nilai penggantian dan akumulasi penyusutan
- PIC
- Tanggal pembaruan terakhir', '- Kelengkapan cakupan aset penugasan dalam Daftar Induk
- Ketersediaan valuasi per aset menggunakan Cost Approach
- Kesesuaian rencana pengelolaan dengan kondisi terkini per aset', v_pic_id, '2026-09-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase aset penugasan yang terdokumentasi dalam Daftar Induk beserta valuasinya (target: 100%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Valuasi Cost Approach tersedia per aset (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Daftar Induk tersedia dan disetujui Direksi (Ya/Tidak, target: Q1)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyusun Dokumen Rangkuman Kondisi Aset Penugasan Eksisting Jakpro yang mendokumentasikan per aset: kondisi fisik aset pada awal penugasan (beginning condition), termasuk spesifikasi teknis dan nilai pada saat aset diserahkan Pemprov kepada Jakpro, serta kondisi fisik dan nilai buku terkini (ending condition), sehingga dapat terlihat depresiasi, kerusakan, dan investasi pemeliharaan yang telah dilakukan selama masa penugasan', '1.A.1.2', 100, 'Dokumen Rangkuman Kondisi Aset Penugasan Eksisting Jakpro yang memuat per aset:
- Kondisi awal: spesifikasi teknis, kondisi fisik, dan nilai pada saat penyerahan penugasan
- Kondisi Terkini: kondisi fisik terkini, nilai buku, tingkat penyusutan, dan catatan kerusakan/pemeliharaan
- Analisis kondisi awal vs terkini: investasi pemeliharaan yang telah dilakukan Jakpro
- Implikasi terhadap nilai transfer yang wajar', '- Kelengkapan rekonstruksi kondisi awal per aset
- Ketersediaan data kondisi terkini yang terverifikasi
- Konsistensi data kondisi aset dengan laporan keuangan Jakpro', v_pic_id, '2026-09-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase aset penugasan yang memiliki dokumentasi kondisi awal terlengkapi (target: 100%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Dokumen Rangkuman Kondisi Aset disetujui Direksi (Ya/Tidak, target: Q1)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyerahkan secara resmi Dokumen Rangkuman Kondisi Aset Penugasan Eksisting kepada BPAD sebagai bahan rujukan bersama dalam proses koordinasi pengalihan dan valuasi aset penugasan Jakpro', '1.A.1.3', 100, 'Bukti Penyerahan Resmi Dokumen Rangkuman Kondisi Aset Penugasan Eksisting kepada BPAD yang memuat:
- Tanda terima resmi dari BPAD
- Konfirmasi penerimaan dan validasi dari BPAD
- Catatan perbedaan data (jika ada) beserta resolusi yang disepakati', '- Kelengkapan dokumen yang diserahkan
- Konfirmasi penerimaan dan validasi oleh BPAD
- Ketiadaan perbedaan material antara data Jakpro dan catatan BPAD', v_pic_id, '2026-09-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Dokumen diterima dan dikonfirmasi BPAD (Ya/Tidak, target: Q1)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Tidak ada perbedaan material yang belum terselesaikan antara data Jakpro dan catatan BPAD (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengompilasi seluruh kajian, studi kelayakan, dan analisis yang pernah dilakukan atas tiga opsi pengalihan LRT Jakarta: 
(1) pengalihan ke PT MRT Jakarta, 
(2) pengurangan modal Pemprov DKI, dan 
(3) pembentukan entitas / SPV baru, ke dalam satu dokumen konsolidasi yang mencakup status terkini, hambatan implementasi, serta implikasi fiskal dan hukum masing-masing opsi', '1.A.1.4', 100, 'Dokumen Konsolidasi Kajian Pengalihan LRT Jakarta yang memuat per opsi:
- Ringkasan opsi: (1) Transfer ke PT MRT Jakarta, (2) Pengurangan modal Pemprov DKI, (3) Pembentukan entitas / SPV baru
- Status dan hambatan implementasi per opsi
- Implikasi fiskal dan hukum yang teridentifikasi
- Celah studi yang masih perlu diperdalam per opsi', '- Kelengkapan cakupan opsi yang pernah dikaji
- Kejelasan hambatan dan celah studi per opsi', v_pic_id, '2026-09-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Ketiga opsi pengalihan LRT Jakarta terdokumentasi lengkap (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Setiap opsi memiliki uraian hambatan yang spesifik dan berbasis fakta (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Mendokumentasikan justifikasi formal pemilihan skema pengurangan modal dan mengidentifikasi aspek kajian yang masih perlu diperkuat sebelum transaksi dieksekusi', '1.A.2', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyusun Dokumen Justifikasi Formal Pemilihan Skema Pengurangan Modal yang menjelaskan secara sistematis: (1) alasan skema pengurangan modal Pemprov DKI dipilih sebagai jalan yang ditempuh, (2) alasan opsi pengalihan ke PT MRT Jakarta dan opsi pembentukan entitas baru tidak dipilih, beserta hambatan dan risiko yang menjadi pertimbangannya, dan (3) dampak finansial pengurangan modal terhadap neraca Jakpro secara kuantitatif', '1.A.2.1', 100, 'Dokumen Justifikasi Formal Pemilihan Skema Pengurangan Modal yang memuat:
- Perbandingan ringkas ketiga opsi beserta kelemahan utama opsi yang tidak dipilih
- Alasan substantif pemilihan skema pengurangan modal (finansial, regulasi, tata kelola)
- Estimasi dampak pengurangan modal terhadap beban depresiasi neraca Jakpro (Rp/tahun)
- Konfirmasi tertulis BP BUMD atas justifikasi yang disusun', '- Kelengkapan justifikasi substantif atas pemilihan skema
- Kejelasan alasan tidak dipilihnya opsi lainnya
- Konfirmasi BP BUMD atas justifikasi', v_pic_id, '2026-09-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Dokumen justifikasi formal disetujui Direksi (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Justifikasi mencakup perbandingan eksplisit ketiga opsi (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Konfirmasi tertulis BP BUMD atas justifikasi diperoleh (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengidentifikasi aspek-aspek dalam kajian skema pengurangan modal yang masih perlu diperkuat atau diperjelas sebelum transaksi dapat dieksekusi, misalnya: 
- implikasi pajak pengurangan modal 
- kesiapan teknis reklasifikasi Saham Seri C, atau
- aspek legal yang belum sepenuhnya dikaji, dan menyusun rencana penyelesaian per aspek tersebut', '1.A.2.2', 100, 'Dokumen Identifikasi Celah Kajian Pengurangan Modal beserta Rencana Penyelesaian yang memuat per celah:
- Deskripsi aspek yang masih perlu diperkuat
- Dampak jika tidak diselesaikan sebelum transaksi
- Rencana penyelesaian: pendekatan, PIC, dan jadwal
- Prioritas berdasarkan dampak terhadap kelancaran transaksi', '- Kelengkapan identifikasi celah kajian yang masih ada
- Konkretnya rencana penyelesaian per celah', v_pic_id, '2026-09-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Seluruh celah kajian memiliki rencana penyelesaian yang konkret (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Dokumen identifikasi celah kajian disetujui Direksi (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melakukan pembahasan bersama dengan BP BUMD untuk memvalidasi justifikasi formal yang disusun Jakpro dan mengkonfirmasi secara resmi bahwa kedua pihak berada pada satu pemahaman atas skema yang akan ditempuh sebelum proses Rapimtas dan persiapan transaksi dimulai', '1.A.2.3', 100, 'Notulen Pembahasan Validasi Justifikasi Bersama BP BUMD yang memuat:
- Konfirmasi keselarasan pemahaman atas skema pengurangan modal
- Poin-poin yang disepakati dan yang memerlukan klarifikasi lebih lanjut
- Pernyataan kesiapan BP BUMD untuk mendukung proses selanjutnya', '- Keselarasan pemahaman antara Jakpro dan BP BUMD atas skema yang ditempuh
- Konfirmasi kesiapan BP BUMD untuk mendukung proses', v_pic_id, '2026-09-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Konfirmasi keselarasan pemahaman antara Jakpro dan BP BUMD terdokumentasi (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Pernyataan kesiapan BP BUMD tersedia sebelum Rapimtas diselenggarakan (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Menetapkan rekomendasi skema pengalihan aset penugasan melalui forum koordinasi resmi lintas pihak', '1.A.3', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyiapkan bahan Rapimtas yang komprehensif dan berorientasi keputusan, menyajikan justifikasi skema pengurangan modal, simulasi dampak finansial terhadap neraca Jakpro, rencana pelaksanaan bertahap beserta milestone, dan antisipasi pertanyaan kritis — sehingga Rapimtas dapat menghasilkan keputusan yang mengikat tanpa perlu putaran pembahasan ulang', '1.A.3.1', 100, 'Bahan Rapimtas yang memuat:
- Justifikasi skema pengurangan modal beserta ringkasan perbandingan dengan opsi lain
- Simulasi dampak finansial terhadap neraca Jakpro (perubahan beban depresiasi dan posisi ekuitas)
- Rencana pelaksanaan bertahap dengan milestone dan jadwal
- Risiko utama dan rencana mitigasinya', '- Kelengkapan bahan Rapimtas sebelum forum diselenggarakan
- Kesiapan antisipasi pertanyaan kritis dari peserta Rapimtas', v_pic_id, '2026-12-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Bahan Rapimtas disetujui Direksi sebelum disampaikan ke BP BUMD (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Bahan Rapimtas mencakup simulasi dampak finansial dan rencana pelaksanaan (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menghadiri Rapimtas dan mempresentasikan skema pengurangan modal Pemprov DKI secara terstruktur, memastikan seluruh pertanyaan dan keberatan peserta dapat dijawab dengan data yang solid sehingga Rapimtas menghasilkan keputusan/mandat resmi yang mengikat sebagai dasar hukum seluruh proses berikutnya', '1.A.3.2', 100, 'Keputusan / Notulen Rapimtas yang meratifikasi skema pengurangan modal Pemprov DKI atas Jakpro, yang memuat:
- Pernyataan ratifikasi skema pengurangan modal oleh Gubernur/Pemprov DKI
- Penugasan tindak lanjut per instansi beserta jadwal target
- Tanda tangan pejabat yang berwenang', '- Dihasilkannya keputusan mengikat dari Rapimtas atas skema pengurangan modal
- Kelengkapan penugasan tindak lanjut dalam keputusan/notulen Rapimtas', v_pic_id, '2026-12-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Rapimtas diselenggarakan sesuai jadwal (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Keputusan resmi yang meratifikasi skema pengurangan modal dihasilkan (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Seluruh tindak lanjut memiliki PIC dan jadwal yang jelas dalam keputusan/notulen (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Menyiapkan konsultan transaksi, melaksanakan penilaian aset independen oleh KJPP, dan memfinalisasi strategi transaksi LRT Jakarta', '1.A.4', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyusun kerangka pengadaan untuk konsultan transaksi (termasuk Kantor Jasa Penilai Publik/KJPP), meliputi ruang lingkup pekerjaan, kriteria seleksi, dan jadwal, kemudian melaksanakan proses seleksi dan penunjukan konsultan transaksi sesuai ketentuan pengadaan yang berlaku.', '1.A.4.1', 100, '- Kerangka Pengadaan Konsultan Transaksi (termasuk KJPP) yang disahkan Direksi
- Surat Penunjukan Resmi konsultan transaksi dan KJPP
- Dokumen Formal BP BUMD/Pemprov DKI yang mengizinkan Jakpro memulai persiapan transaksi', '- Kelengkapan kerangka pengadaan sebelum proses seleksi dimulai
- Ketepatan waktu penerbitan surat penunjukan konsultan
- Ketepatan waktu penerbitan dokumen formal oleh BP BUMD', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Konsultan transaksi dan KJPP resmi ditunjuk sebelum proses penilaian dimulai (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Dokumen formal dari BP BUMD/Pemprov DKI terbit tepat waktu (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melaksanakan penilaian aset LRT Jakarta oleh KJPP yang telah ditunjuk untuk menetapkan nilai wajar aset dalam konteks transaksi pengurangan modal, mencakup penilaian fisik, teknis, dan finansial, sebagai dasar penetapan nilai transaksi yang objektif dan dapat dipertanggungjawabkan', '1.A.4.2', 100, 'Laporan Penilaian Aset LRT Jakarta oleh KJPP yang memuat:
- Metodologi penilaian yang digunakan dan justifikasinya
- Nilai wajar aset dengan rincian per komponen
- Asumsi dan kondisi yang mempengaruhi penilaian
- Perbandingan dengan nilai buku yang tercatat di neraca Jakpro', '- Kepatuhan metodologi penilaian KJPP terhadap standar penilaian yang berlaku
- Kelengkapan cakupan komponen aset dalam laporan penilaian
- Ketepatan waktu penyelesaian laporan KJPP', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Laporan penilaian KJPP diterbitkan sesuai jadwal (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Laporan penilaian mencakup seluruh komponen aset LRT Jakarta (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Selisih antara nilai KJPP dan nilai buku neraca Jakpro terdokumentasi (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Memfinalisasi dokumen strategi transaksi pengurangan modal LRT Jakarta berdasarkan hasil penilaian KJPP, menetapkan nilai transaksi yang disepakati, conditions precedent yang harus terpenuhi sebelum transaksi dapat dieksekusi, serta jadwal pelaksanaan yang mengikat semua pihak', '1.A.4.3', 100, 'Dokumen Strategi Transaksi Final Pengurangan Modal LRT Jakarta yang memuat:
- Nilai transaksi berdasarkan hasil penilaian KJPP
- Mekanisme pengurangan modal yang disepakati
- Daftar conditions precedent beserta PIC dan target tanggal pemenuhan
- Jadwal pelaksanaan yang mengikat per tahapan
- Persetujuan formal dari BP BUMD/Pemprov DKI', '- Kelengkapan dokumen strategi transaksi sebelum proses korporasi dimulai
- Diperolehnya persetujuan formal BP BUMD atas strategi transaksi
- Kelengkapan daftar kondisi awal', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Dokumen Strategi Transaksi Final disetujui Direksi Jakpro dan BP BUMD (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Seluruh conditions precedent terdaftar dengan PIC dan jadwal yang jelas (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Dokumen tersedia sebelum pengajuan persetujuan ke Dewan Komisaris (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Menyiapkan dan menerbitkan seluruh instrumen regulasi sebagai landasan formal skema pengalihan aset penugasan', '1.A.5', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengidentifikasi seluruh instrumen regulasi yang diperlukan (Pergub, Kepgub, Perda, PKS, atau bentuk hukum lainnya) beserta urutan prioritas penerbitan berdasarkan dependensi antar instrumen', '1.A.5.1', 100, 'Daftar Instrumen Regulasi yang Diperlukan yang memuat per instrumen:
- Jenis instrumen
- Substansi yang harus diatur
- Pihak yang menerbitkan
- Ketergantungan dengan instrumen lain
- Target tanggal penerbitan', '- Kelengkapan pemetaan instrumen regulasi yang diperlukan
- Ketepatan urutan ketergantungan antar instrumen', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase instrumen regulasi yang dipetakan ketergantungannya secara lengkap (target: 100%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Daftar instrumen disetujui Direksi dan dikonfirmasi BP BUMD (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyiapkan draf seluruh dokumen hukum yang diperlukan bersama konsultan hukum dan divisi legal internal, termasuk penyesuaian dokumen korporasi Jakpro (AD/ART) jika dibutuhkan', '1.A.5.2', 100, '- Draf dan versi final seluruh instrumen regulasi (per instrumen)
- Dokumen korporasi Jakpro yang telah disesuaikan (AD/ART) jika diperlukan', '- Kelengkapan klausul setiap instrumen yang diterbitkan
- Ketepatan waktu penerbitan
- Jumlah revisi material per instrumen', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase instrumen regulasi yang berhasil diterbitkan dari total yang diidentifikasi (target: 100%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase instrumen yang terbit sesuai target tanggal', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Rata-rata jumlah revisi material per instrumen (target: ≤ 2 putaran)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Menyelesaikan seluruh proses korporasi yang diperlukan untuk sahnya pengurangan modal: reklasifikasi Saham Seri C, persetujuan DeKom, RUPS, dan penandatanganan PPJB', '1.A.6', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menuntaskan penyusunan reklasifikasi Saham Seri C Jakpro yang sedang berjalan, mencakup finalisasi definisi karakteristik saham, nilai nominal, hak-hak pemegang saham, mekanisme reklasifikasi, dan perubahan Anggaran Dasar', '1.A.6.1', 100, 'Dokumen Reklasifikasi Saham Seri C Jakpro yang telah difinalisasi dan memuat:
- Definisi dan karakteristik Saham Seri C yang baru
- Nilai nominal dan hak-hak pemegang saham Seri C
- Mekanisme dan prosedur reklasifikasi
- Perubahan Anggaran Dasar yang diperlukan beserta redaksi perubahannya
- Pendapat hukum atas kesesuaian reklasifikasi dengan ketentuan yang berlaku', '- Kelengkapan dokumentasi reklasifikasi sebelum pengajuan ke Dewan Komisaris
- Kesesuaian rancangan perubahan AD dengan hukum perseroan yang berlaku', v_pic_id, '2026-09-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Dokumen Reklasifikasi Saham Seri C disetujui Direksi (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Pendapat hukum atas reklasifikasi tersedia (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Dokumen siap disampaikan ke Dewan Komisaris sebelum proses persetujuan DeKom dimulai (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengajukan dan memperoleh persetujuan Dewan Komisaris (DeKom) Jakpro atas tiga agenda korporasi yang saling berkaitan: (1) pengurangan modal disetor Pemprov DKI, (2) pengalihan aset LRT Jakarta, dan (3) perubahan Anggaran Dasar terkait reklasifikasi Saham Seri C — sebagai prasyarat korporasi sebelum panggilan RUPS dapat diterbitkan', '1.A.6.2', 100, 'Risalah Rapat Dewan Komisaris yang mencatat persetujuan DeKom atas:
- Pengurangan modal disetor Pemprov DKI
- Pengalihan aset LRT Jakarta sesuai skema yang ditetapkan
- Perubahan Anggaran Dasar terkait reklasifikasi Saham Seri C', '- Diperolehnya persetujuan DeKom atas seluruh tiga agenda
- Kelengkapan dokumentasi risalah rapat
- Ketepatan waktu perolehan persetujuan sebelum jadwal RUPS', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persetujuan DeKom atas seluruh tiga agenda diperoleh (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Risalah Rapat DeKom tersedia dan ditandatangani (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persetujuan DeKom diperoleh sebelum batas waktu panggilan RUPS (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyelenggarakan seluruh rangkaian proses RUPS untuk memperoleh persetujuan pemegang saham atas tiga agenda: (1) pengurangan modal disetor Pemprov DKI, (2) pengalihan aset LRT Jakarta, dan (3) perubahan Anggaran Dasar terkait reklasifikasi Saham Seri C, mencakup penerbitan panggilan RUPS, pelaksanaan rapat, penetapan persetujuan, dan pengumuman hasil RUPS sesuai ketentuan hukum perseroan', '1.A.6.3', 100, '- Panggilan RUPS yang diterbitkan sesuai ketentuan (termasuk jadwal dan agenda)
- Risalah RUPS yang mencatat persetujuan pemegang saham atas seluruh agenda
- Pengumuman hasil RUPS yang diterbitkan sesuai ketentuan hukum perseroan', '- Kepatuhan penyelenggaraan RUPS terhadap ketentuan hukum perseroan
- Diperolehnya persetujuan pemegang saham atas seluruh tiga agenda
- Ketepatan waktu pengumuman hasil RUPS', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'RUPS diselenggarakan sesuai ketentuan hukum perseroan (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persetujuan pemegang saham atas seluruh tiga agenda diperoleh (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Risalah RUPS tersedia, ditandatangani, dan diumumkan tepat waktu (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menandatangani Perjanjian Pengikatan Jual Beli (PPJB) antara Jakpro dan Pemprov DKI sebagai dokumen pengikatan formal yang menegaskan komitmen kedua pihak atas pengurangan modal dan pengalihan aset LRT Jakarta, termasuk nilai transaksi, jadwal penyerahan, dan conditions precedent sebelum penandatanganan akta definitif', '1.A.6.4', 100, 'Perjanjian Pengikatan Jual Beli (PPJB) yang ditandatangani Jakpro dan Pemprov DKI, yang memuat:
- Nilai transaksi berdasarkan penilaian KJPP yang disepakati
- Jadwal dan mekanisme pengalihan aset
- Conditions precedent yang harus dipenuhi sebelum akta definitif
- Klausul penyelesaian sengketa dan force majeure', '- Kelengkapan klausul PPJB sebelum ditandatangani
- Kesesuaian PPJB dengan strategi transaksi final yang telah disetujui', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'PPJB ditandatangani oleh kedua pihak (Jakpro dan Pemprov DKI) (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'PPJB mencakup seluruh kondisi yang ditetapkan dalam strategi transaksi (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Penandatanganan PPJB terlaksana sesuai jadwal (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Melaksanakan pengurangan modal dan pengalihan aset LRT Jakarta sesuai seluruh dokumen dan regulasi yang telah diformalkan', '1.A.7', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melaksanakan pengurangan modal dan pengalihan aset LRT Jakarta sesuai PPJB, strategi transaksi, dan regulasi yang telah diformalkan', '1.A.7.1', 100, 'Laporan Pelaksanaan Pengurangan Modal dan Pengalihan Aset LRT Jakarta yang memuat:
- Kronologi proses dari inisiasi hingga selesai
- Daftar hambatan per tahap beserta cara penyelesaiannya
- Dampak aktual terhadap neraca Jakpro: perubahan beban depresiasi (Rp/tahun) dan posisi ekuitas
- Rekomendasi penyempurnaan mekanisme untuk proses serupa jika diperlukan', '- Kelancaran pelaksanaan sesuai dokumen yang diformalkan
- Dampak aktual terhadap neraca Jakpro
- Kelengkapan dokumentasi sebagai rekam jejak proses', v_pic_id, '2028-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Pengurangan modal dan pengalihan aset LRT Jakarta berhasil dilaksanakan sesuai dokumen (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Jumlah hambatan material yang tidak dapat diselesaikan (target: 0)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Perubahan nilai beban depresiasi di neraca Jakpro pasca pengalihan (Rp/tahun)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengelola periode penyelesaian keberatan kreditur Jakpro atas pengurangan modal disetor Pemprov DKI', '1.A.7.2', 100, 'Laporan Penyelesaian Periode Keberatan Kreditur yang memuat:
- Daftar keberatan yang masuk beserta identitas kreditur
- Cara penyelesaian per keberatan dan bukti penyelesaiannya
- Konfirmasi bahwa seluruh keberatan telah diselesaikan sesuai ketentuan
- Pernyataan hukum (legal clearance) bahwa proses dapat dilanjutkan ke tahap berikutnya', '- Ketuntasan penyelesaian seluruh keberatan kreditur dalam batas waktu yang ditetapkan
- Kepatuhan penyelesaian terhadap ketentuan hukum yang berlaku
- Tersedianya legal clearance untuk melanjutkan proses', v_pic_id, '2028-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Seluruh keberatan kreditur diselesaikan sebelum batas waktu yang ditetapkan hukum (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Legal clearance tersedia sebagai dasar melanjutkan proses pengalihan (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Jumlah keberatan yang tidak terselesaikan dalam batas waktu (target: 0)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengurus dan memperoleh persetujuan Menteri Hukum dan HAM atas perubahan Anggaran Dasar Jakpro terkait pengurangan modal disetor, sebagai syarat sah legalitas perubahan korporasi Jakpro yang diperlukan dalam proses pengalihan aset LRT Jakarta', '1.A.7.3', 100, 'Surat Keputusan Menteri Hukum dan HAM yang menyetujui perubahan Anggaran Dasar Jakpro terkait pengurangan modal disetor', '- Ketepatan waktu pengurusan persetujuan MenkumHAM
- Kelengkapan berkas permohonan yang disampaikan ke Kementerian
- Tidak adanya penolakan atau permintaan revisi berkas lebih dari satu kali', v_pic_id, '2028-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'SK MenkumHAM atas perubahan AD Jakpro diperoleh sesuai jadwal (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Tidak ada dokumen yang dikembalikan untuk diperbaiki lebih dari 1 kali (target terpenuhi: Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menandatangani akta pengalihan bangunan dan aset LRT Jakarta serta perubahan Perjanjian Penugasan antara Jakpro dan Pemprov DKI yang menegaskan secara hukum perpindahan kepemilikan dan tanggung jawab atas aset LRT Jakarta', '1.A.7.4', 100, '- Akta Pengalihan Bangunan/Aset LRT Jakarta yang ditandatangani Jakpro dan Pemprov DKI
- Perubahan Perjanjian Penugasan yang mencerminkan status kepemilikan aset setelah pengalihan
- Kepgub Pengurangan Modal Disetor Pemprov DKI (diterbitkan BP BUMD/Pemprov)
- Perubahan Pergub Penugasan Aset kepada Jakpro (diterbitkan BP BUMD/Pemprov)', '- Kelengkapan seluruh dokumen akhir pengalihan sebelum penandatanganan
- Penandatanganan seluruh dokumen oleh semua pihak yang berwenang
- Konsistensi isi akta dengan PPJB dan strategi transaksi yang disepakati', v_pic_id, '2028-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Akta Pengalihan Aset LRT Jakarta ditandatangani oleh Jakpro dan Pemprov DKI (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Perubahan Perjanjian Penugasan ditandatangani (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Kepgub dan perubahan Pergub diterbitkan (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Seluruh dokumen akhir tersedia dalam 5 hari kerja setelah penandatanganan (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Mengevaluasi efektivitas skema pengalihan dan memperbarui Daftar Induk Aset Penugasan secara berkelanjutan', '1.A.8', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melakukan evaluasi efektivitas skema pengalihan aset yang sudah dilakukan (LRT Jakarta) berdasarkan dampak aktual yang terukur: perubahan depresiasi di neraca, kesesuaian dengan skema yang disepakati, dan isu-isu yang belum terselesaikan', '1.A.8.1', 100, 'Laporan Evaluasi Efektivitas Skema Pengalihan Aset LRT Jakarta dan aset penugasan lainnya yang memuat:
- Perubahan nilai depresiasi di neraca per aset yang dialihkan (sebelum vs sesudah)
- Kesesuaian realisasi dengan skema yang disepakati
- Isu yang belum terselesaikan dan rencana tindak lanjut', '- Akurasi penghitungan perubahan depresiasi per aset
- Kesesuaian realisasi dengan skema
- Kelengkapan tindak lanjut isu yang tersisa', v_pic_id, NULL, 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Perubahan nilai depresiasi aset penugasan di neraca Jakpro pasca pengalihan (Rp/tahun)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Laporan evaluasi disetujui Direksi dan disampaikan ke BP BUMD (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase isu tersisa yang memiliki rencana tindak lanjut (target: 100%)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyusun rekomendasi penyesuaian mekanisme pengalihan untuk aset penugasan berikutnya (JIS, JIV, TIM dan aset lainnya) berdasarkan hasil evaluasi dan perkembangan bisnis', '1.A.8.2', 100, 'Dokumen Rekomendasi Penyesuaian Mekanisme Pengalihan Aset Penugasan berikutnya yang memuat:
- Temuan evaluasi yang menjadi dasar rekomendasi
- Penyesuaian yang direkomendasikan per aspek mekanisme
- Aset berikutnya yang akan menggunakan mekanisme yang disempurnakan', '- Relevansi rekomendasi dengan temuan evaluasi
- Tingkat implementasi rekomendasi pada pengalihan berikutnya', v_pic_id, NULL, 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase rekomendasi penyesuaian yang diimplementasikan pada pengalihan aset berikutnya (target: ≥ 80%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Rekomendasi disetujui Direksi (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Memperbarui Daftar Induk Aset Penugasan setiap kali ada perubahan status, penambahan aset baru dari Pemprov, atau perubahan rencana pengelolaan yang disepakati', '1.A.8.3', 100, 'Daftar Induk Aset Penugasan versi terbaru yang dilengkapi catatan perubahan yang mendokumentasikan setiap pembaruan beserta alasan dan tanggalnya', '- Ketepatan waktu pembaruan Daftar Induk
- Kelengkapan catatan perubahan', v_pic_id, NULL, 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase pembaruan Daftar Induk dalam ≤ 5 hari kerja setelah perubahan status (target: 100%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Catatan perubahan tersedia dan terdokumentasi (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Strategy
    INSERT INTO strategies (aspect_id, name, code_order, target_percentage)
    VALUES (v_aspect_id, 'Penguatan struktur tarif aset penugasan untuk memperjelas pemisahan fungsi layanan dan dasar pengelolaan aset', 'B.', 100)
    RETURNING id INTO v_strategy_id;

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Memetakan kondisi eksisting tarif, model subsidi, dan profil finansial seluruh aset penugasan Jakpro sebagai dasar data utama', '1.B.1', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melakukan inventarisasi menyeluruh atas struktur tarif eksisting seluruh aset penugasan (misalnya: JIS, JIV, TIM), mencakup dasar hukum penetapan tarif, besaran tarif aktual, mekanisme penyesuaian, dan perbandingan tarif terhadap biaya operasional aktual per aset', '1.B.1.1', 100, 'Peta Tarif Eksisting per Aset Penugasan (JIS, JIV, TIM) yang memuat informasi:
- Dasar hukum tarif yang berlaku
- Komponen dan besaran tarif aktual
- Mekanisme dan frekuensi penyesuaian tarif
- Selisih antara tarif dan biaya operasional aktual (Rp/unit layanan)', '- Kelengkapan daftar tarif per aset (JIS, JIV, TIM)
- Ketersediaan data selisih tarif vs biaya operasional per aset', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase aset penugasan yang memiliki daftar tarif terdokumentasi lengkap (target: 100%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Selisih tarif vs biaya operasional tersedia per aset (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mendokumentasikan model subsidi yang diterima Jakpro dari Pemprov per aset, mencakup dasar penetapan, besaran yang dijanjikan vs yang terealisasi, dan frekuensi keterlambatan pencairan', '1.B.1.2', 100, 'Dokumentasi Model Subsidi per Aset Penugasan yang memuat:
- Dasar penetapan subsidi (regulasi atau perjanjian)
- Besaran subsidi yang dijanjikan vs yang terealisasi (historis 3 tahun)
- Mekanisme dan jadwal pencairan
- Frekuensi dan nilai keterlambatan atau kekurangan pencairan', '- Kelengkapan data realisasi subsidi historis
- Ketersediaan data selisih subsidi dijanjikan vs terealisasi', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase data subsidi per aset yang mencakup realisasi historis ≥ 3 tahun (target: 100%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Selisih rata-rata antara subsidi yang dijanjikan vs terealisasi terdokumentasi per aset (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyusun Rekap Keuangan Aset Penugasan yang mencantumkan per aset: pendapatan aktual, biaya operasional, depresiasi, subsidi yang diterima, dan posisi laba/rugi operasional, beserta tata kelola pembaruan yang jelas', '1.B.1.3', 100, 'Rekap Keuangan Aset Penugasan (diperbarui secara berkala) yang memuat per aset:
- Pendapatan operasional aktual
- Biaya operasional (rincian per komponen utama)
- Depresiasi
- Realisasi subsidi
- Posisi laba/rugi operasional bersih
- Status validasi data (terverifikasi/estimasi)
- Tanggal pembaruan terakhir dan jadwal pembaruan berikutnya', '- Kelengkapan data keuangan per aset
- Ketepatan tata kelola pembaruan
- Ketersediaan status validasi data', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase data keuangan per aset yang tervalidasi dengan laporan keuangan audited (target: ≥ 90%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Rekap Keuangan disetujui Direksi sebagai data dasar resmi (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Tata kelola pembaruan terdokumentasi dan disepakati (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Mengembangkan metodologi pengukuran dampak ekonomi aset penugasan sebagai dasar justifikasi subsidi berulang', '1.B.2', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyusun kerangka metodologi pengukuran dampak ekonomi menggunakan pendekatan Analisis Input-Output dan Analisis Biaya-Manfaat untuk mengukur kontribusi aset penugasan terhadap perekonomian DKI Jakarta', '1.B.2.1', 100, 'Kerangka Metodologi Pengukuran Dampak Ekonomi Aset Penugasan (JIS, JIV, TIM) yang memuat:
- Pendekatan metodologi beserta justifikasi pemilihan
- Definisi operasional setiap kategori dampak
- Sumber data dan asumsi utama yang digunakan
- Keterbatasan metodologi dan cara mengatasinya', '- Kelengkapan dokumentasi metodologi
- Ketersediaan analisis sensitivitas untuk asumsi utama', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Kerangka metodologi terdokumentasi lengkap (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase asumsi utama yang memiliki analisis sensitivitas (target: 100%)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menerapkan metodologi untuk mengukur dampak ekonomi aset penugasan prioritas (JIS, JIV, TIM) meliputi penciptaan lapangan kerja, kontribusi terhadap PDRB DKI, serta nilai manfaat ekonomi bersih termasuk untuk sektor kebudayaan dan olahraga', '1.B.2.2', 100, 'Laporan Analisis Dampak Ekonomi per Aset Penugasan Prioritas yang memuat per aset:
- Nilai ekonomi total (Rp) dan penciptaan lapangan kerja
- Kontribusi terhadap PDRB DKI per kategori dampak
- Nilai manfaat ekonomi bersih dengan skenario dasar dan sensitivitas', '- Kelengkapan analisis dampak per aset prioritas
- Validasi metodologi oleh BP BUMD
- Ketersediaan skenario sensitivitas', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase aset penugasan prioritas yang memiliki analisis dampak ekonomi lengkap (target: 100%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Metodologi divalidasi BP BUMD secara tertulis (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Skenario sensitivitas tersedia untuk setiap aset prioritas (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Merancang dan melaksanakan survei pencapaian dampak dan kepuasan pelanggan atas layanan JIS, JIV, dan TIM, mengukur kepuasan pengguna, persepsi nilai layanan, dan willingness-to-pay, sebagai bukti empiris yang memperkuat justifikasi penyesuaian tarif dan penambahan subsidi dari Pemprov', '1.B.2.3', 100, 'Laporan Survei Pencapaian Dampak dan Kepuasan Pelanggan JIS, JIV, dan TIM yang memuat per aset:
- Metodologi survei (instrumen, sampel, periode)
- Skor kepuasan pelanggan per dimensi layanan
- Persepsi nilai layanan vs tarif yang berlaku
- Willingness-to-pay pada berbagai skenario tarif
- Rekomendasi penyesuaian tarif berdasarkan hasil survei', '- Kecukupan ukuran sampel untuk mewakili pengguna per aset
- Kegunaan hasil survei sebagai dasar justifikasi tarif/subsidi', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Survei terlaksana dengan tingkat respons yang representatif per aset (target: ≥ 200 responden per aset)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Hasil survei digunakan sebagai bahan resmi dalam negosiasi tarif/subsidi dengan Pemprov (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyusun narasi justifikasi subsidi per aset (JIS, JIV, TIM) yang menghubungkan dampak ekonomi terukur, hasil survei kepuasan pelanggan, dan kebutuhan subsidi Pemprov', '1.B.2.4', 100, 'Narasi Justifikasi Subsidi per Aset Penugasan (JIS, JIV, TIM) yang memuat per aset:
- Pernyataan nilai ekonomi secara kuantitatif
- Hasil survei kepuasan dan willingness-to-pay sebagai pendukung
- Penjelasan mengapa tarif tidak dapat menutup biaya operasional sepenuhnya
- Kebutuhan subsidi minimum agar aset tidak menggerus likuiditas Jakpro', '- Kejelasan hubungan antara nilai ekonomi, hasil survei, dan kebutuhan subsidi per aset
- Kesiapan narasi sebagai bahan negosiasi resmi', v_pic_id, '2028-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Narasi justifikasi tersedia untuk JIS, JIV, dan TIM (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Narasi digunakan sebagai bahan resmi dalam negosiasi subsidi dengan Pemprov (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Merumuskan struktur tarif berbasis pemisahan fungsi layanan publik dan komersial beserta mekanisme PSO', '1.B.3', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Merumuskan prinsip pemisahan fungsi PSO dan fungsi komersial untuk setiap aset penugasan, mendefinisikan secara operasional apa yang termasuk mandat PSO dan apa yang merupakan kegiatan komersial Jakpro dari setiap aset penugasan Jakpro. Misalnya: penggunaan TIM untuk kegiatan seni non-komersial, penggunaan JIS untuk event olahraga yang disubsidi Pemprov) dan mana yang merupakan kegiatan komersial Jakpro', '1.B.3.1', 100, 'Dokumen Prinsip Pemisahan Fungsi PSO dan Komersial per Aset Penugasan Aset (JIS, JIV, TIM) yang memuat:
- Definisi operasional fungsi PSO per aset
- Definisi operasional fungsi komersial per aset
- Kriteria untuk menentukan apakah kegiatan termasuk PSO atau komersial
- Mekanisme penanganan kegiatan yang bersifat campuran', '- Kelengkapan definisi PSO dan komersial per aset (JIS, JIV, TIM)
- Penerimaan definisi oleh BP BUMD', v_pic_id, '2028-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase aset penugasan yang memiliki definisi PSO dan komersial yang terdokumentasi secara operasional (target: 100%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Definisi disepakati bersama BP BUMD (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengembangkan proposal struktur tarif per aset yang memisahkan komponen tarif PSO dari komponen tarif komersial, beserta formula kompensasi PSO yang terukur dan dapat diverifikasi secara independen', '1.B.3.2', 100, 'Proposal Struktur Tarif Baru per Aset Penugasan yang memuat per aset:
- Komponen tarif PSO (besaran, dasar penghitungan, mekanisme penyesuaian berkala)
- Komponen tarif komersial (besaran dan target pendapatan)
- Formula kompensasi PSO yang terukur dan dapat diverifikasi secara independen
- Proyeksi dampak finansial terhadap Jakpro dan Pemprov', '- Kemampuan verifikasi formula kompensasi PSO secara independen
- Kejelasan dampak finansial proyeksi', v_pic_id, '2028-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Kejelasan dan verifiabilitas formula kompensasi PSO (Ya/Tidak — dapat dihitung oleh pihak ketiga)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Estimasi pengurangan subsidi implisit dengan struktur tarif baru tersedia (Rp/tahun)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengembangkan panduan model pendapatan baru untuk aset inti sebagai bagian dari skema kerja sama yang dikembangkan, memastikan pemisahan fungsi PSO tidak membatasi potensi monetisasi aset inti', '1.B.3.3', 100, 'Panduan Model Monetisasi Komersial per Aset Penugasan yang memuat per aset yang akan diselaraskan dengan strategi 2B:
- Inventaris peluang monetisasi komersial yang teridentifikasi
- Estimasi potensi pendapatan per peluang (Rp/tahun)
- Syarat dan kondisi agar monetisasi tidak melanggar mandat PSO
- Potensi pengurangan kebutuhan subsidi jika peluang komersial dioptimalkan', '- Jumlah peluang monetisasi komersial yang teridentifikasi per aset
- Estimasi dampak monetisasi terhadap pengurangan kebutuhan subsidi', v_pic_id, '2028-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Jumlah peluang monetisasi komersial yang teridentifikasi per aset (JIS, JIV, TIM)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Panduan monetisasi komersial disetujui Direksi (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Estimasi pengurangan kebutuhan subsidi jika peluang komersial dioptimalkan (Rp/tahun)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Menyelaraskan dan mengesahkan struktur tarif/PSO bersama Pemprov DKI dan BP BUMD', '1.B.4', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyiapkan bahan presentasi dan negosiasi atas proposal struktur tarif/PSO kepada BP BUMD dan Pemprov, termasuk simulasi dampak finansial untuk berbagai skenario', '1.B.4.1', 100, '- Notulen Forum Penyelarasan Tarif/PSO per forum
- Dokumen Keputusan Resmi (Pergub/Kepgub) yang mengesahkan Struktur Tarif/PSO per aset penugasan', '- Jumlah putaran forum penyelarasan
- Kelengkapan mekanisme pencairan dalam keputusan resmi
- Cakupan aset dalam keputusan resmi', v_pic_id, '2028-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Jumlah putaran forum penyelarasan hingga kesepakatan tercapai', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Keputusan resmi atas struktur tarif/PSO diterbitkan (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase aset penugasan yang memiliki struktur tarif/PSO yang telah disahkan formal (target: 100% aset prioritas)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Melaksanakan implementasi struktur tarif / PSO pada aset penugasan prioritas', '1.B.5', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melaksanakan implementasi struktur tarif/PSO yang telah disahkan pada aset penugasan prioritas secara bertahap, termasuk penyesuaian sistem pencatatan keuangan internal untuk memisahkan pendapatan PSO dan komersial', '1.B.5.1', 100, 'Laporan Implementasi Struktur Tarif/PSO per kuartal yang memuat per aset:
- Status implementasi (berjalan sesuai desain/terdapat penyimpangan)
- Realisasi pendapatan PSO vs komersial
- Realisasi pencairan kompensasi PSO vs yang dijanjikan
- Hambatan yang muncul dan cara penyelesaiannya', '- Tingkat implementasi sesuai desain
- Kesesuaian realisasi pencairan PSO dengan formula
- Jumlah aset yang keluar dari status subsidi implisit', v_pic_id, '2028-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase aset penugasan prioritas yang telah mengimplementasikan struktur tarif/PSO (target: 100%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase realisasi kompensasi PSO dari formula yang disepakati (target: ≥ 95%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Jumlah aset penugasan yang keluar dari status subsidi implisit', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Memantau dan mendokumentasikan dampak implementasi per periode terhadap pendapatan Jakpro, realisasi pencairan kompensasi PSO, dan perubahan posisi laba/rugi per aset', '1.B.5.2', 100, 'Rekap Monitoring Implementasi Tarif/PSO triwulanan yang memuat:
- Tren pencairan kompensasi PSO aktual vs target per kuartal
- Tren pendapatan komersial per aset per kuartal
- Isu yang memerlukan tindak lanjut segera', '- Konsistensi pencairan kompensasi PSO dari Pemprov
- Penurunan nilai subsidi implisit per aset vs data dasar', v_pic_id, NULL, 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Jumlah keterlambatan pencairan kompensasi PSO dalam setahun (target: 0 keterlambatan material)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Penurunan nilai subsidi implisit per aset vs data dasar sebelum implementasi (Rp/tahun)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Mengevaluasi dampak finansial implementasi tarif / PSO dan memperbarui Profil Finansial Aset Penugasan secara berkelanjutan', '1.B.6.', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melakukan evaluasi dampak finansial pasca implementasi secara tahunan, membandingkan posisi laba/rugi per aset sebelum vs sesudah struktur tarif/PSO baru berlaku', '1.B.6..1', 100, 'Laporan Evaluasi Dampak Finansial Pasca Implementasi (tahunan) yang memuat:
- Perubahan pendapatan per aset sebelum vs sesudah struktur baru
- Perubahan posisi laba/rugi operasional per aset
- Rekapitulasi realisasi vs formula PSO yang disepakati
- Rekomendasi penyesuaian yang diperlukan', '- Konsistensi metodologi perhitungan sebelum dan sesudah implementasi
- Pengurangan kerugian operasional berulang pada aset penugasan', v_pic_id, NULL, 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Laporan evaluasi dampak finansial disetujui Direksi dan disampaikan ke BP BUMD (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Pengurangan kerugian operasional berulang pada aset penugasan (Rp/tahun)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyusun rekomendasi penyesuaian formula atau mekanisme PSO jika kondisi aktual menyimpang signifikan dari proyeksi awal', '1.B.6..2', 100, 'Dokumen Rekomendasi Penyesuaian Formula/Mekanisme PSO yang memuat:
- Penyimpangan aktual vs proyeksi yang menjadi dasar rekomendasi
- Penyesuaian yang direkomendasikan per parameter formula
- Dampak yang diharapkan dari penyesuaian terhadap posisi finansial per aset', '- Relevansi rekomendasi dengan data evaluasi
- Ketepatan waktu pengajuan rekomendasi', v_pic_id, NULL, 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Jumlah penyesuaian formula PSO yang diajukan berdasarkan data evaluasi (bukan reaktif)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Rekomendasi penyesuaian disetujui Pemprov (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Memperbarui Rekap Keuangan Aset Penugasan setiap kuartal untuk mencerminkan realisasi pendapatan PSO dan komersial terkini, realisasi pencairan subsidi, dan perubahan posisi laba/rugi per aset', '1.B.6..3', 100, 'Rekap Keuangan Aset Penugasan versi terbaru yang diperbarui setiap kuartal, dilengkapi catatan perubahan yang mendokumentasikan setiap pembaruan beserta tanggal dan alasannya', '- Ketepatan waktu pembaruan Rekap Keuangan
- Kelengkapan catatan perubahan', v_pic_id, NULL, 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase entri dalam Rekap Keuangan yang diperbarui tepat waktu setiap kuartal (target: 100%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Rata-rata jeda antara tutup buku kuartal dan pembaruan Rekap Keuangan (target: ≤ 15 hari kerja)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melakukan evaluasi bersama atas efektivitas implementasi tarif/PSO dari perspektif masing-masing pihak secara berkala', '1.B.6..4', 100, 'Notulen Evaluasi Bersama Efektivitas Implementasi Tarif/PSO yang memuat:
- Perspektif Jakpro atas efektivitas implementasi
- Perspektif BP BUMD atas kesesuaian dengan kebijakan Pemprov
- Kesepakatan tindak lanjut bersama', '- Keterlaksanaan evaluasi bersama sesuai jadwal
- Persentase tindak lanjut yang dieksekusi', v_pic_id, NULL, 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Evaluasi bersama terlaksana sesuai jadwal (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase tindak lanjut yang disepakati dan dieksekusi tepat waktu (target: ≥ 90%)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Aspect
    INSERT INTO aspects (company_id, name, target_percentage)
    VALUES (v_company_id, 'Optimalisasi Portofolio & Penguatan Kapabilitas Bernilai Tambah', 100)
    RETURNING id INTO v_aspect_id;

    -- Strategy
    INSERT INTO strategies (aspect_id, name, code_order, target_percentage)
    VALUES (v_aspect_id, 'Menetapkan prioritas portofolio untuk membedakan aset inti dan non-inti sebagai dasar penataan dan alokasi portofolio', 'A.', 100)
    RETURNING id INTO v_strategy_id;

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Menyusun kerangka segmentasi portofolio aset untuk membedakan aset core, non-core related, dan non-core non-related sebagai dasar arah perlakuan aset secara objektif dan konsisten dengan empat lini bisnis target Jakpro', '2.A.1.', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyusun kriteria penilaian portofolio yang mengukur keselarasan setiap aset/lini bisnis eksisting Jakpro terhadap empat lini bisnis target (Properti, Konstruksi/Infra, Energi Utilitas, ICT)', '2.A.1..1', 100, 'Dokumen Kriteria dan Bobot Penilaian Portofolio Jakpro yang memuat:
- Empat lini bisnis target sebagai acuan penilaian utama (Properti, Konstruksi/Infra, Energi Utilitas, ICT)
- Dimensi dampak arus kas (cash flow) beserta definisi operasional dan bobot
- Daftar dimensi penilaian lainnya dengan definisi operasional dan bobot
- Ketentuan khusus untuk aset penugasan yang tidak dapat dinilai semata-mata dari aspek finansial
- Konfirmasi tertulis BP BUMD atas kerangka kriteria', '- Kelengkapan dimensi penilaian beserta keselarasan dengan empat lini bisnis target
- Eksplisitnya dimensi cash flow dalam kriteria
- Konfirmasi BP BUMD atas kerangka kriteria', v_pic_id, '2026-12-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Empat lini bisnis target tercermin sebagai acuan utama dalam kriteria (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Dimensi dampak cash flow tersedia dalam kriteria (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Konfirmasi tertulis BP BUMD atas kerangka kriteria (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menetapkan metodologi penilaian parameter, indikator, dan threshold  agar klasifikasi portofolio dapat diterapkan secara konsisten pada seluruh aset dan lini bisnis Jakpro Group.', '2.A.1..2', 100, 'Matriks Penilaian Portofolio, yang memuat: 
- indikator per dimensi penilaian
- metode scoring/bobot dengan deskripsi konkret tiap level
- Threshold klasifikasi aset
- Aturan penilaian untuk aset penugasan dan aset komersial.
- Mekanisme resolusi untuk aset yang hasil penilaiannya aambigu
- Template penilaian yang siap digunakan per aset/ lini bisnis', '- Kejelasan indikator dan threshold penilaian
- Bobot dan scoring dapat diterapkan pada jenis aset yang berbeda
- Hasil penilaian dapat diinterpretasikan secara konsisten.', v_pic_id, '2026-12-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase indikator yang memiliki definisi dan threshold tertulis ≥ 100%', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Kerangka metodologi disetujui Direksi dan dikonfirmasi BP BUMD (Ya/ Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Menyiapkan basis data untuk profil portofolio aset untuk memastikan seluruh aset Jakpro Group dapat divaluasi secara lengkap, akurat, dan terstandarisasi', '2.A.2.', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengidentifikasi, mengumpulkan, dan mengonsolidasikan seluruh aset dalam portofolio Jakpro Group yang akan disegmentasi dan diklasifikasikan dari seluruh SBU ke dalam satu inventaris terpusat, mencakup aset penugasan dan aset komersial di bawah empat lini bisnis', '2.A.2..1', 100, '1. Daftar Lengkap Portofolio Aset, yang memuat per aset: 
- Identitas (nama, lokasi, jenis, klasifikasi sementara)
- Lini bisnis yang relevan (Properti, Konstruksi, Infra, Energi Utilitas, ICT)
- status penugasan/komersial
- status pemanfaatan saat ini.
- Sumber data yang digunakan
- Status kelengkapan data awal', '- Kelengkapan daftar aset perusahaan dan lini bisnis di semua SBU
- konsistensi daftar dengan data resmi perusahaan
- kejelasan status dasar tiap aset.
- Konfirmasi aset penugasan oleh BP BUMD', v_pic_id, '2026-12-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase aset/ lini bisnis yang dikonfirmasi BP BUMD yang telah masuk ke dalam daftar portofolio ≥ 100%', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Jumlah aset yang teridentifikasi tapi belum tekonfirmasi statusnya = 0.', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Memvalidasi kelengkapan dan akurasi data per aset/lini bisnis, mengidentifikasi setiap celah data, dan menetapkan rencana pengumpulan data untuk setiap celah yang ditemukan.', '2.A.2..2', 100, '1. Daftar Aset dan Lini Bisnis Jakpro Grup (versi final yang tervalidasi) yang memuat per aset/lini bisnis:
- Data finansial (nilai perolehan, depresiasi, nilai buku, pendapatan, biaya)
- Data legal (kepemilikan, perizinan, status sengketa)
- Data operasional (utilisasi, kondisi fisik, status operasional)
- Tabel Ketersediaan dan validitas data aset
- Daftar gap data dan action plan pelengkapan', '- Kelengkapan data per aset di semua dimensi
- kejelasan sumber dan validitas data
- template dapat dipakai secara seragam lintas aset.', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase aset dengan profil data minimum lengkap di semua dimensi ≥ X%', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase elemen data aset yang telah tervalidasi dengan dokumen ≥ X%', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase gap data yang memiliki action plan jelas ≥ 100%.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Daftar aset disetujui Direksi (Ya/ Tidak).', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Melakukan segmentasi dan menetapkan arah perlakuan portofolio aset agar Jakpro Group memiliki prioritas penataan aset yang selaras dengan fokus strategis dan alokasi sumber daya yang selaras dengan empat lini bisnis target', '2.A.3.', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melakukan penilaian dan pemetaan seluruh aset Jakpro Group menggunakan kerangka segmentasi yang telah disepakati.', '2.A.3..1', 100, '1. Hasil Scoring Portofolio Aset, yang memuat per aset: 
- skor tiap dimensi penilaian beserta justifikasi/ argumentasi tiap skoring
- skor total
- posisi dalam matriks segmentasi.
- peta segmentasi portofolio aset', '- Kesesuaian hasil segmentasi dengan data dasar
- konsistensi penilaian di semua aset dan lini bisnis
- peta segmentasi mudah dipahami dan dapat digunakan sebagai alat keputusan.', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase aset prioritas yang telah disegmentasi ≥ 100%', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Tingkat konsistensi hasil scoring antar evaluator ≥ X%.', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyusun Peta Klasifikasi Portofolio Jakpro Grup yang menggambarkan distribusi seluruh aset dan lini bisnis ke dalam empat lini bisnis target (core) vs non-core, dan menetapkan implikasi pengelolaan per kategori: inti dikembangkan dan dimonetisasi, non-inti disiapkan untuk exit.', '2.A.3..2', 100, 'Dokumen Arah Perlakuan Portofolio Aset, yang memuat per aset: 
- klasifikasi inti/non-inti
- arah perlakuan aset
- justifikasi strategis dan ekonomi
- implikasi organisasi dan tata kelola.', '- Kejelasan arah perlakuan tiap aset
- konsistensi arah perlakuan dengan hasil segmentasi
- justifikasi keputusan terdokumentasi memadai.', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase aset yang memiliki arah perlakuan jelas ≥ 100%', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Peta segmentasi dan arah portofolio disetujui Direksi (Ya/ Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Klasifikasi aset penugasan dikonfirmasikan BP BUMD )Ya/ Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Menetapkan arah exit untuk aset dan lini bisnis non-inti serta mengintegrasikan prioritas portofolio ke RJPP dan RKAP', '2.A.4', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menetapkan rencana exit konkret per aset dan lini bisnis non-inti: jika aset penugasan → mengacu mekanisme Strategi 1-A; jika aset komersial → mengkaji opsi likuidasi, divestasi, atau skema exit lainnya yang sesuai dengan ketentuan yang berlaku untuk BUMD DKI, [mekanisme exit aset komersial BUMD DKI perlu mengacu pada peraturan daerah/gubernur yang relevan]', '2.A.4.1', 100, 'Dokumen Rencana Exit Aset dan Lini Bisnis Non-Inti Jakpro yang memuat per aset non-inti:
- Mekanisme exit yang direkomendasikan beserta justifikasi
- Referensi ke Strategi 1-A untuk aset penugasan non-inti
- Opsi exit aset komersial: likuidasi/divestasi/[mekanisme lain sesuai regulasi daerah]
- Target jadwal dan tahapan exit
- Estimasi dampak terhadap neraca dan likuiditas Jakpro', '- Kelengkapan rencana exit per aset non-inti
- Ketersediaan referensi regulasi untuk mekanisme exit aset komersial', v_pic_id, '2028-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase aset non-inti yang memiliki rencana exit terdokumentasi dan disetujui (target: 100%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Rencana exit aset penugasan non-inti mengacu Strategi 1-A (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Rencana exit aset komersial mendapat konfirmasi kesesuaian dengan regulasi daerah (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengintegrasikan hasil klasifikasi portofolio ke dalam RJPP dan RKAP: alokasi CAPEX dan OPEX diarahkan ke aset inti (Properti, Konstruksi/Infra, Energi Utilitas, ICT), sementara aset non-inti tidak lagi menerima alokasi investasi baru.', '2.A.4.2', 100, 'Revisi RJPP dan RKAP yang mencerminkan hasil segmentasi portofolio yang mencakup:
- Perbandingan alokasi CAPEX/OPEX sebelum dan sesudah klasifikasi (per lini bisnis)
- Alokasi investasi yang diarahkan ke empat lini bisnis inti
- Penghentian alokasi investasi baru ke aset non-inti', '- Hasil segmentasi dapat digunakan dalam forum keputusan formal
- format bahan keputusan cukup jelas dan konsisten
- tidak ada keputusan portofolio material yang diambil tanpa dasar segmentasi.
- Perubahan proporsi alokasi ke lini bisnis inti vs non-inti
- Konsistensi RKAP dengan hasil klasifikasi portofolio', v_pic_id, '2028-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase keputusan portofolio yang menggunakan hasil segmentasi resmi ≥ X%', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Jumlah keputusan portofolio material tanpa rujukan segmentasi ≤ X.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'RJPP dan RKAP yang mencerminkan prioritisasi disetujui (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Menjalankan tinjauan portofolio berkala dan memperbarui Mapping Klasifikasi Portofolio secara berkelanjutan', '2.A.5.', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menetapkan mekanisme tinjauan portofolio berkala (minimal tahunan) yang mencakup evaluasi setiap aset/lini bisnis terhadap perkembangan empat lini bisnis target, perubahan kondisi bisnis, dan perkembangan agenda City Master Developer', '2.A.5..1', 100, 'Mekanisme Tinjauan Portofolio Berkala dalam SOP Jakpro yang memuat:
- Kriteria untuk reklasifikasi (termasuk jika ada lini bisnis baru yang masuk target atau perubahan kebijakan City Master Developer)
- Format dan template laporan tinjauan
- Jadwal pelaksanaan dan PIC
- Mekanisme persetujuan perubahan klasifikasi
- Laporan Tinjauan Portofolio Tahunan (ringkasan kondisi, reklasifikasi, rekomendasi ke Direksi)
- Peta Klasifikasi Portofolio Jakpro Grup versi terbaru dilengkapi catatan perubahan', '- Keterlaksanaan tinjauan sesuai jadwal
- Persentase rekomendasi yang ditindaklanjuti dalam RKAP berikutnya
- Ketepatan waktu pembaruan Mapping Klasifikasi Portofolio', v_pic_id, '2028-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Frekuensi tinjauan portofolio yang terlaksana sesuai jadwal (target: ≥ 1x per tahun)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase rekomendasi tinjauan yang ditindaklanjuti dalam RKAP berikutnya', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Pembaruan Mapping Klasifikasi dalam ≤ Xx hari kerja setelah tinjauan (target: 100%)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menetapkan dan melakukan evaluasi berkala atas relevansi segmentasi portofolio terhadap perubahan kondisi aset, pasar, penugasan, dan arah strategis perusahaan agar tetap sesuai dengan peran City Master Developer, serta mengintegrasikan hasilnya ke dalam siklus RKAP tahunan.', '2.A.5..2', 100, 'Mekanisme Tinjauan Portofolio Berkala dalam SOP Jakpro yang memuat:
- Kriteria untuk reklasifikasi (termasuk jika ada lini bisnis baru yang masuk target atau perubahan kebijakan CMD)
- Format dan template laporan tinjauan
- Jadwal pelaksanaan dan PIC
- Mekanisme persetujuan perubahan klasifikasi
- Laporan evaluasi berkala segmentasi portofolio
- Change log segmentasi portofolio', '- Evaluasi mencakup faktor perubahan yang relevan
- perubahan prioritas/aset terdokumentasi jelas
- hasil evaluasi dapat digunakan sebagai dasar update roadmap portofolio.', v_pic_id, NULL, 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase evaluasi segmentasi yang dilakukan sesuai jadwal ≥ 100%', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Waktu respons terhadap perubahan kondisi material ≤ X hari.', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Strategy
    INSERT INTO strategies (aspect_id, name, code_order, target_percentage)
    VALUES (v_aspect_id, 'Memperkuat kriteria pengelolaan kerja sama dan pengembangan aset melalui implementasi dan kolaborasi yang lebih tepat sasaran', 'B.', 100)
    RETURNING id INTO v_strategy_id;

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Menyusun kerangka kriteria pengelolaan kerja sama dan pengembangan aset untuk memastikan pemanfaatan aset dilakukan secara selektif, sesuai mandat, dan menciptakan nilai yang terukur', '2.B.1.', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyusun kerangka evaluasi kerja sama yang membedakan dua jalur monetisasi: 
(1) aset penugasan, penilaian difokuskan pada kesesuaian dengan hasil Feasibility Study dan pemenuhan target utilisasi PSO; 
(2) aset komersial, penilaian difokuskan pada nilai ekonomi, margin kontribusi, dan potensi pendapatan berulang', '2.B.1..1', 100, 'Dokumen Kerangka Evaluasi Kerja Sama Jakpro yang memuat:
- Jalur evaluasi aset penugasan: dimensi kesesuaian FS, pemenuhan PSO, potensi komersial di atas PSO
- Jalur evaluasi aset komersial: dimensi nilai ekonomi, margin, potensi recurring revenue
- Nilai ambang batas minimum per jalur
- Template penilaian per jalur yang siap digunakan', '- Kejelasan perbedaan pendekatan evaluasi aset penugasan vs komersial
- Penerimaan kerangka oleh Direksi dan BP BUMD', v_pic_id, '2026-12-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Kerangka evaluasi membedakan jalur aset penugasan dan komersial secara eksplisit (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Kerangka disetujui Direksi dan BP BUMD (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menetapkan parameter, threshold, dan aturan keputusan untuk menentukan apakah suatu usulan kerja sama/pengembangan layak dilanjutkan, ditunda, direvisi, atau ditolak.', '2.B.1..2', 100, 'Dokumen Parameter dan Threshold Kerja Sama Aset, yang memuat: 
- indikator wajib per usulan kerja sama
- threshold kelayakan minimum
- red flag criteria
- kondisi yang memerlukan eskalasi/review khusus
', '- Threshold dan red flag criteria dijelaskan dengan jelas
- aturan keputusan dapat diterapkan secara konsisten
- tidak ada area abu-abu dalam tindak lanjut usulan.', v_pic_id, '2026-12-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase parameter yang memiliki threshold jelas ≥ 100%', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Daftar negatif dan mekanisme pengecualian disahkan oleh Direksi (Ya/ Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'N/A', '2.B.1..3', 100, 'Instrumen Regulasi atas Perpanjangan Batas Durasi Kontrak Sewa Aset BUMD DKI yang memuat:
- Ketentuan durasi baru yang berlaku
- Kondisi dan persyaratan yang harus dipenuhi untuk kontrak jangka panjang
- Mekanisme evaluasi dan perpanjangan kontrak
- Tanggal berlaku', '- Ketepatan waktu penerbitan instrumen regulasi
- Cakupan instrumen regulasi (berlaku untuk seluruh BUMD DKI termasuk Jakpro)', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Instrumen regulasi durasi kontrak sewa diterbitkan (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Durasi maksimal kontrak sewa aset BUMD ditingkatkan menjadi ≥ 10 tahun (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Melakukan inventarisasi dan evaluasi seluruh kerja sama eksisting Jakpro Grup', '2.B.2.', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengumpulkan dan mengonsolidasikan seluruh perjanjian kerja sama eksisting di Jakpro Grup dari seluruh SBU ke dalam satu Daftar Induk Kerja Sama yang terpusat', '2.B.2..1', 100, 'Daftar Induk Kerja Sama Eksisting Jakpro Grup yang memuat per kerja sama:
- Identitas (nama mitra, jenis kerja sama, aset/lini bisnis yang terlibat)
- Nilai dan struktur finansial
- Tanggal mulai dan berakhir
- Status aktual pelaksanaan
- Dasar hukum', '- Kelengkapan cakupan kerja sama aktif di semua SBU
- Jumlah kerja sama di lapangan yang tidak ada dalam Daftar Induk', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase kerja sama eksisting yang terdokumentasi dalam Daftar Induk (target: 100%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Jumlah kerja sama yang teridentifikasi di lapangan tetapi tidak ada di Daftar Induk (target: 0)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengevaluasi setiap kerja sama eksisting menggunakan kerangka evaluasi yang telah ditetapkan, dan mengklasifikasikan ke dalam kategori: lanjut, restrukturisasi, atau terminasi', '2.B.2..2', 100, 'Hasil Evaluasi Kerja Sama Eksisting yang memuat per kerja sama:
- Jalur evaluasi yang digunakan (penugasan/komersial)
- Skor evaluasi per dimensi
- Kategori (lanjut/restrukturisasi/terminasi) beserta justifikasi
- Rekomendasi tindak lanjut spesifik', '- Konsistensi penerapan jalur evaluasi yang tepat per kerja sama
- Kualitas justifikasi rekomendasi per kategori', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase kerja sama yang dievaluasi menggunakan kerangka yang ditetapkan (target: 100%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Inventaris dan hasil evaluasi disetujui Direksi (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Menetapkan strategi monetisasi aset penugasan (JIS, JIV, TIM) berbasis pemenuhan Feasibility Study, pengelolaan venue profesional, dan akselerasi menuju kemandirian finansial SBU', '2.B.3.', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menelaah hasil Feasibility Study JIS, JIV, dan TIM untuk mengidentifikasi target utilisasi, target pendapatan, dan asumsi operasional yang seharusnya sudah tercapai, membandingkan kondisi aktual dengan target FS untuk mengetahui gap yang harus diatasi', '2.B.3..1', 100, 'Laporan Analisis Gap FS vs Realisasi untuk JIS, JIV, dan TIM yang memuat per aset:
- Target utilisasi dan pendapatan dalam FS vs realisasi aktual
- Identifikasi gap yang harus diatasi
- Faktor-faktor yang menyebabkan gap (termasuk hambatan aksesibilitas ke lokasi)
- Prioritas gap yang harus diselesaikan terlebih dahulu', '- Kelengkapan analisis gap FS vs realisasi per aset
- Identifikasi hambatan aksesibilitas yang membatasi komersialisasi', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Analisis gap FS vs realisasi tersedia untuk JIS, JIV, dan TIM (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Seluruh faktor penyebab gap teridentifikasi termasuk faktor aksesibilitas (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyusun program kerja sama dan monetisasi untuk menutup gap antara realisasi aktual dan target FS per aset, dengan memprioritaskan pencarian mitra dan promotor yang dapat menjalankan peran layaknya yang dibayangkan Jakpro dalam Feasibility Study, termasuk program event komersial JIS, optimalisasi jadwal JIV, dan revitalisasi TIM', '2.B.3..2', 100, 'Program Kerja Sama dan Monetisasi untuk Menutup Gap FS per Aset yang memuat per aset (JIS, JIV, TIM):
- Program/kerja sama yang direkomendasikan untuk menutup gap
- Target mitra/promotor yang sesuai dengan skenario dalam FS
- Estimasi kontribusi pendapatan per program (Rp/tahun)
- Jadwal implementasi per program', '- Kesesuaian program dengan gap yang teridentifikasi per aset
- Estimasi kontribusi pendapatan per program', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Jumlah program kerja sama/monetisasi yang direkomendasikan per aset', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Program disetujui Direksi dan dikonfirmasi selaras dengan mandat aset oleh BP BUMD (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengidentifikasi dan menindaklanjuti peluang kerja sama venue management untuk JIS (Jakarta International Stadium) dan Velodrome, aktif menjajaki dan bernegosiasi dengan operator venue management profesional termasuk yang berminat dari pihak asing, dengan tujuan menemukan mitra yang dapat mengelola venue secara penuh sesuai standar internasional yang dibayangkan dalam FS', '2.B.3..3', 100, 'Laporan Penjajakan dan Negosiasi Venue Management JIS dan Velodrome yang memuat per calon mitra:
- Profil dan rekam jejak operator
- Model kerja sama yang diusulkan (full management/partial/fee-based)
- Proyeksi finansial dari model kerja sama yang diusulkan
- Status negosiasi dan langkah lanjutan', '- Jumlah operator venue management yang dijajaki
- Kualitas dan kesesuaian profil operator dengan kebutuhan JIS dan Velodrome', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Jumlah operator venue management yang dijajaki secara serius (target: ≥ 3 operator)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Term sheet atau letter of intent venue management diterima dari setidaknya 1 operator (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengidentifikasi dan mengusulkan penyelesaian hambatan aksesibilitas sebagai prasyarat komersialisasi aset penugasan, termasuk memetakan kebutuhan infrastruktur pendukung yang belum tuntas sejak awal pembangunan aset (misalnya akses transportasi, infrastruktur utilitas, dan konektivitas), dan mengkoordinasikan penyelesaiannya dengan OPD terkait', '2.B.3..4', 100, 'Dokumen Peta Hambatan Aksesibilitas Aset Penugasan Jakpro yang memuat per aset (JIS, JIV, TIM):
- Infrastruktur pendukung yang belum tuntas (transportasi, utilitas, konektivitas)
- Estimasi dampak hambatan terhadap tingkat komersialisasi
- Rekomendasi penyelesaian per hambatan beserta OPD yang bertanggung jawab
- Rencana tindak lanjut koordinasi dengan OPD', '- Kelengkapan identifikasi hambatan aksesibilitas per aset
- Komitmen OPD terkait atas penyelesaian hambatan', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Hambatan aksesibilitas per aset terdokumentasi (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'OPD terkait berkomitmen untuk menyelesaikan hambatan aksesibilitas dalam jadwal yang disepakati (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menetapkan tolak ukur finansial kemandirian per SBU yang mengelola aset penugasan (JIS, JIV, TIM), mendefinisikan kondisi minimal yang harus dicapai SBU agar dapat beroperasi secara mandiri (spin-off) tanpa subsidi internal dari korporat Jakpro, termasuk ambang batas EBITDA, tingkat utilisasi, dan kemandirian arus kas', '2.B.3..5', 100, 'Dokumen Tolak Ukur Finansial Kemandirian SBU Aset Penugasan yang memuat per SBU (JIS, JIV, TIM):
- Ambang batas EBITDA minimum untuk kemandirian finansial
- Target tingkat utilisasi minimum
- Target kemandirian arus kas (cash flow self-sufficient)
- Kondisi dan mekanisme aktivasi spin-off ketika tolak ukur tercapai
- Konsekuensi jika tolak ukur tidak tercapai dalam jangka waktu yang ditetapkan', '- Kelengkapan tolak ukur per SBU aset penugasan
- Kejelasan mekanisme aktivasi spin-off', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Tolak ukur finansial kemandirian tersedia per SBU (JIS, JIV, TIM) (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Mekanisme aktivasi spin-off terdokumentasi dan disetujui Direksi (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Mengembangkan model pendapatan baru untuk aset komersial inti (Properti, Konstruksi/Infra, Energi Utilitas, ICT)', '2.B.4.', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Memetakan model pendapatan eksisting untuk setiap lini bisnis komersial inti (Properti, Konstruksi/Infra, Energi Utilitas, ICT) dan mengidentifikasi peluang pendapatan baru, termasuk: 
(1) pendapatan berulang: kontrak layanan jangka panjang, sewa aset/lahan, manajemen properti; 
(2) pendapatan satu kali besar: naming rights, konsesi jangka panjang, divestasi partial aset', '2.B.4..1', 100, 'Peta Model Pendapatan Eksisting dan Peluang Baru per Lini Bisnis Komersial Inti yang memuat per lini bisnis:
- Model pendapatan eksisting beserta estimasi kontribusi saat ini
- Peluang pendapatan berulang baru yang teridentifikasi
- Peluang pendapatan satu kali besar yang teridentifikasi
- Estimasi potensi pendapatan per peluang', '- Kelengkapan pemetaan model pendapatan eksisting per lini bisnis
- Jumlah peluang pendapatan baru yang teridentifikasi per kategori', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Jumlah peluang pendapatan berulang baru yang teridentifikasi per lini bisnis komersial inti', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Jumlah peluang pendapatan satu kali besar yang teridentifikasi', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Peta model pendapatan disetujui Direksi (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengembangkan proposal model pendapatan baru per lini bisnis komersial inti yang paling menjanjikan, termasuk skema kerja sama yang diperlukan, estimasi nilai, dan jadwal eksekusi', '2.B.4..2', 100, 'Proposal Model Pendapatan Baru per Lini Bisnis Komersial Inti yang memuat per model baru:
- Lini bisnis dan aset yang menjadi basis model
- Deskripsi model pendapatan (berulang/satu kali besar)
- Skema kerja sama yang diperlukan
- Estimasi nilai pendapatan
- Jadwal dan langkah eksekusi', '- Kesiapan proposal untuk ditindaklanjuti ke tahap eksekusi
- Keseimbangan antara model berulang dan satu kali besar', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Jumlah proposal model pendapatan baru yang siap ditindaklanjuti per lini bisnis', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Estimasi total pendapatan potensial dari model baru (Rp/tahun)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Proposal disetujui Direksi (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Mengintegrasikan kerangka evaluasi ke dalam proses persetujuan Direksi dan melaksanakan kerja sama baru', '2.B.5', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Merevisi SOP persetujuan investasi/kerja sama untuk mewajibkan penggunaan kerangka evaluasi dua jalur (penugasan dan komersial) sebagai prasyarat sebelum proposal dapat diajukan ke Direksi, dan melaksanakan sosialisasi kepada tim business development seluruh SBU.', '2.B.5.1', 100, '- Revisi SOP Persetujuan Kerja Sama yang mewajibkan kerangka evaluasi dua jalur
- Template Proposal Kerja Sama Standar Jakpro Grup per jalur (penugasan/komersial)
- Dokumentasi program sosialisasi dan hasil evaluasi kompetensi tim business development', '- Penerapan kerangka evaluasi pada seluruh proposal kerja sama baru
- Penurunan pertanyaan klarifikasi Direksi per proposal', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase proposal kerja sama baru yang menggunakan jalur evaluasi yang tepat (target: 100%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Rata-rata jumlah pertanyaan klarifikasi Direksi per proposal (target: menurun vs data dasar)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengeksekusi kerja sama baru menggunakan panduan skema dan template kontrak yang mencakup KPI finansial mitra yang terukur dan, untuk kerja sama komersial murni, ketentuan jaminan pendapatan minimum yang dapat diverifikasi secara independen.', '2.B.5.2', 100, 'Daftar Kerja Sama Baru yang Dieksekusi beserta ringkasan ketentuan utama (KPI finansial mitra, nilai jaminan pendapatan minimum untuk kerja sama komersial murni).', '- Kelengkapan klausul KPI finansial dalam kontrak baru
- Jumlah kerja sama baru yang dieksekusi', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase kontrak kerja sama komersial murni baru yang memuat ketentuan jaminan pendapatan minimum (target: 100%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Jumlah kerja sama baru yang dieksekusi per lini bisnis inti per periode', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyusun dan mengesahkan SOP Pemanfaatan Aset Jakpro yang mengatur secara eksplisit mekanisme penggunaan seluruh aset Jakpro oleh pihak manapun,  termasuk OPD dan lembaga pemerintah lainnya, yang mewajibkan pemberitahuan resmi minimal [X] hari sebelum penggunaan, persetujuan tertulis dari Jakpro, dan pembayaran kompensasi sesuai tarif yang berlaku dan pengecualian hanya bila Jakpro menyepakati', '2.B.5.3', 100, 'SOP Pemanfaatan Aset Jakpro yang disahkan Direksi yang memuat:
- Ketentuan pemberitahuan dan persetujuan wajib sebelum penggunaan
- Mekanisme penetapan dan pembayaran kompensasi (tidak ada penggunaan gratis tanpa dasar hukum yang sah)
- Protokol penanganan pelanggaran (termasuk penggunaan tanpa izin oleh OPD)
- Mekanisme sosialisasi ke seluruh pemangku kepentingan termasuk OPD', '- Ketegasan ketentuan pemberitahuan dan kompensasi dalam SOP
- Cakupan sosialisasi SOP ke OPD yang relevan
- Penurunan insiden penggunaan aset tanpa izin', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'SOP Pemanfaatan Aset disahkan Direksi (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'SOP dikonfirmasi berlaku terhadap OPD oleh BP BUMD (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Penurunan insiden penggunaan aset Jakpro tanpa izin pasca implementasi SOP (target: 0 insiden per tahun)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Menjalankan tinjauan berkala kinerja kerja sama dan memperbarui Daftar Induk Kerja Sama', '2.B.6', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melaksanakan tinjauan dua kali setahun atas seluruh portofolio kerja sama aktif menggunakan kerangka evaluasi yang ditetapkan, dan menerapkan mekanisme tindakan korektif terstruktur untuk mitra yang kinerjanya di bawah target', '2.B.6.1', 100, 'Laporan Tinjauan Berkala Kinerja Kerja Sama (dua kali setahun) yang memuat:
- Status kinerja per kerja sama vs KPI yang disepakati
- Mitra yang menerima pemberitahuan kinerja di bawah target
- Status rencana tindakan korektif dari mitra dalam periode perbaikan
- Kerja sama yang direkomendasikan untuk restrukturisasi atau terminasi', '- Keterlaksanaan tinjauan sesuai jadwal
- Persentase mitra yang dimonitor menggunakan KPI yang disepakati', v_pic_id, NULL, 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Frekuensi tinjauan berkala kerja sama (target: ≥ 2x per tahun)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase mitra yang dimonitor kinerjanya menggunakan KPI yang disepakati (target: 100%)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Memperbarui Daftar Induk Kerja Sama setiap kali ada perubahan status, kerja sama baru ditambahkan, yang direstrukturisasi diperbarui, yang diterminasi diarsipkan', '2.B.6.2', 100, 'Daftar Induk Kerja Sama versi terbaru dilengkapi catatan perubahan yang mendokumentasikan setiap perubahan status beserta tanggal dan alasannya', '- Ketepatan waktu pembaruan Daftar Induk
- Peningkatan kontribusi pendapatan dari kerja sama yang dioptimalkan', v_pic_id, NULL, 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase pembaruan Daftar Induk dalam ≤ 5 hari kerja setelah perubahan status (target: 100%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Peningkatan kontribusi pendapatan dari kerja sama yang dievaluasi dan dioptimalkan (Rp/tahun)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Strategy
    INSERT INTO strategies (aspect_id, name, code_order, target_percentage)
    VALUES (v_aspect_id, 'Mengembangkan kapabilitas kunci secara terarah untuk mendukung ekspansi bisnis yang selaras dengan arah pengembangan value chain', 'C.', 100)
    RETURNING id INTO v_strategy_id;

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Mengidentifikasi dan menetapkan arah kapabilitas kunci, serta kebutuhan peran strategis agar pengembangan SDM selaras dengan kebutuhan Jakpro sebagai strategic holding dan city master developer.', '2.C.1.', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengkonsolidasikan dan menyusun peran strategis Human Capital untuk masing-masing entitas ketika Jakpro berperan sebagai strategic holding dan city master developer', '2.C.1..1', 100, 'Buku strategi Human Capital Jakpro Holding dan Anak Usaha, yang memuat:
- Peran strategis human capital
- Tanggung jawab dan peran masing-masing HC holding dan anak usaha
- Jalur komando

(Contoh peran strategis: HC Jakpro Induk berperan menyusun strategi high-level untuk keseluruhan holding dan anak usaha; HC anak usaha menerjemahkan strategi menjadi komponen yang lebih terfokuskan pada konteks masing-masing Anak Usaha)', '- Kesesuaian peran strategis Human Capital Jakpro dan Anak Usaha terhadap arah transformasi Jakpro menjadi strategic holding dan City Master Developer', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Minimal X kali hasil rapat konsolidasi HC Jakpro Induk dan Anak Usaha terdokumentasi', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Buku strategi Human Capital disetujui oleh Direksi Jakpro Induk dan Anak Usaha (Ya/ Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyusun kamus kompetensi dalam rencana jangka panjang kapabilitas SDM  Jakpro berdasarkan dua peran: strategic holding (misal: manajemen portofolio, pengawasan kinerja anak usaha, alokasi modal, dan tata kelola grup) dan city master developer (misal: pengembangan lahan dan properti, manajemen konsesi infrastruktur, kerja sama investasi, dan pengelolaan ekosistem kawasan).', '2.C.1..2', 100, 'Dokumen Arah Kapabilitas Strategis Perusahaan, yang memuat: 
- Tujuan pengembangan kapabilitas Jakpro
- Kamus kompetensi yang dibutuhkan Jakpro sebagai strategic holding
- Kamus kompetensi yang dibutuhkan Jakpro sebagai city master developer
- Prioritisasi pengembangan (kritis/ penting/ pendukung)
- implikasi terhadap peran existing.
- Kapabilitas yang dikembangkan internal vs. melalu kemitraan (tanpa rekrutmen eksternal)

(Contoh prioritisasi pengembangan: regulatory management)', '- Kelengkapan kompetensi/ kapabilitas untuk mendukung Jakpro dengan bentuk strategic holding dan sebagai city master developer
- Pemetaan implikasi terhadap peran existing.
- Penerimaan dokumen arah kapabilitas oleh Direksi', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Teridentifikasinya komptensi/ kapabilitas untuk kedua kebutuhan strategic holding dan city master developer (Ya/ Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Dokumen arah kapabilitas strategis perusahaan disetujui oleh Direksi (Ya/ Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menetapkan indikator untuk masing-masing domain dalam kamus kompetensi dalam dokumen arah kapabilitas strategis Jakpro', '2.C.1..3', 100, 'Kelengkapan kapabilitas dalam domain kapabilitas dokumen arah kapabilitas strategis perusahaan yang mencakup:
- Nama kapabilitas dan definisi operasional
- Indikator kapabilitas per level
- Kaitan dengan empat lini bisnis target
- Jalur pemenuhan: pelatihan ulang atau kemitraan strategis', '- Kejelasan setiap kapabilitas dan indikator per level kapabilitas', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Kelengkapan kapabilitas disetujui oleh Direksi (Ya/ Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Seluruh kapabilitas memiliki jalur pemenuhan (Ya/ Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mensosialisasikan program pengembangan kapabilitas terhadap Jakpro induk dan anak usaha untuk memastikan seluruh anggota "tau" terhadap gap kapabilitas yang dibutuhkan Jakpro menuju strategic holding dan city master developer', '2.C.1..4', 100, 'Rencana program sosialisasi pengembangan kapabilitas Jakpro, yang mencakup:
- Tujuan dilaksanakannya sosialisasi
- Dokumen/ media sosialisasi
- Timeline sosialisasi dilakukan terhadap seluruh pegawai Jakpro Induk dan Anak Usaha', '- Pemahaman entitas Jakpro induk dan anak usaha terkait adanya kebutuhan kapabilitas', v_pic_id, NULL, 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Acara sosialisasi dilaksanakan kepada seluruh perusahaan dan anak usaha (Ya/ Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase SDM level manajerial ke atas mengetahui adanya program pengembangan kapabilitas (target: >XX%)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Melakukan pemetaan kapabilitas SDM existing untuk mengidentifikasi gap, potensi redeploy, kebutuhan retrain/ upskill, atau selective hiring secara objektif', '2.C.2.', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melakukan penilaian kesenjangan kapabilitas (gap analysis) secara menyeluruh terhadap SDM eksisting Jakpro, mencakup seluruh level manajerial ke atas sebagai prioritas, menggunakan metode yang objektif berbasis bukti kinerja atau uji kompetensi.', '2.C.2..1', 100, 'Laporan Kesenjangan Kapabilitas SDM Jakpro yang memuat per posisi/fungsi:
- Kapabilitas eksisting (level aktual per domain)
- Kapabilitas yang dibutuhkan untuk peran Strategic Holding/ City Master Developer (level target)
- Kesenjangan per domain dan prioritas pengembangan
- Klasifikasi SDM: siap/perlu pelatihan ulang/perlu redeployment dari unit lain/ peran tidak tersedia, dibutuhkan selective hiring', '- Cakupan penilaian terhadap SDM level manajerial ke atas
- Objektivitas metode penilaian', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase SDM level manajerial ke atas yang dinilai menggunakan Kerangka Kapabilitas (target: 100%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Laporan kesenjangan kapabilitas disetujui Direksi (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Memetakan posisi SDM eksisting terhadap kebutuhan peran dalam struktur organisasi Strategic Holding dan City Master Developer', '2.C.2..2', 100, 'Peta SDM Jakpro dalam Konteks Transisi ke Strategic Holding dan City Master Developer yang memuat:
- Posisi yang berlebihan pasca transisi beserta jumlah SDM terdampak
- Posisi baru yang diperlukan untuk peran Strategic Holding/City Master Developer
- SDM yang berpotensi dipindahkan perannya beserta tingkat kesiapannya
- Estimasi implikasi terhadap struktur biaya SDM (Rp/tahun)', '- Kejelasan identifikasi posisi berlebihan dan posisi baru
- Ketersediaan analisis implikasi biaya SDM pasca transisi', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Jumlah posisi baru yang dibutuhkan untuk peran Strategic Holding/City Master Developer', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Implikasi biaya SDM pasca transisi terhitung (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Mempersiapkan dan menyesuaikan Tata Jabatan Perusahaan yang terstandarisasi', '2.C.3.', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengkonsolidasikan data fasilitas dan ketentuan pegawai eksisting Jakpro Induk dan Anak Usaha sebagai bahan dasar pertimbangan penyusunan tata jabatan perusahaan', '2.C.3..1', 100, 'Data fasilitas dan ketentuan pegawai untuk setiap entitas di Jakpro holding, termasuk tapi tidak terbatas pada:
- Daftar posisi/ jabatan manajerial beserta job grading/ level
- Kualifikasi jabatan
- Job description eksisting
- Compensation & benefits', '- Kelengkapan informasi fasilitas dan ketentuan pegawai eksisting Jakpro holding', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Kelengkapan informasi job architecture Jakpro Induk dan Anak Usaha (target: 100%)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyusun Tata Jabatan Perusahaan yang terstandarisasi untuk diaplikasikan ke seluruh holding Jakpro', '2.C.3..2', 100, 'Tata Jabatan Perusahaan terstandarisasi untuk holding Jakpro, yang mencakup, tapi tidak terbatas pada:
- Struktur Jabatan (Direksi/ Manajerial/ Fungsional/ Operasional)
- Klasifikasi Jabatan (Operasional/ Penunjang/ Teknis/ Pengawasan)
- Jenjang jabatan (contoh: Manager, Supervisor, dan lainnya)
- Job description
- Persyaratan kualifikasi jabatan (contoh: pendidikan, pengalaman kerja, kompetensi teknis, sertifikasi)
- Pola Hubungan Jabatan
- Paket compensation  & benefits (termasuk skala dan range upah)
- Jenjang karir dan pergerakan jabatan', '- Kejelasan ketentuan pekerjaan untuk setiap posisi di Jakpro holding', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Arsitektur pekerjaan disetujui oleh Direksi Jakpro (Ya/ Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Menjalankan redeploy, retrain dan upskill, serta selective hiring secara terarah untuk mengisi kebutuhan fungsi strategis dengan memaksimalkan tenaga kerja internal', '2.C.4.', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyusun program redeployment untuk SDM dengan peran dan posisi yang overlapping berdasarkan kecocokan profil dan hasil penilaian kesenjangan.', '2.C.4..1', 100, 'Program Redeployment SDM Jakpro yang memuat per SDM yang dipindahkan:
- Posisi asal dan posisi tujuan (peran Strategic Holding atau City Master Developer)
- Justifikasi kecocokan profil
- Proses dan jadwal perpindahan
- Program pendampingan selama masa transisi peran', '- Kelengkapan program redeployment per SDM yang terdampak
- Kesesuaian posisi tujuan dengan kebutuhan bisnis yang nyata', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase SDM yang akan dipindahkan perannya yang memiliki program terdokumentasi = 100%', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Program redeployment disetujui Direksi (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Merancang program retrain dan upskill  yang spesifik per kesenjangan kapabilitas yang teridentifikasi', '2.C.4..2', 100, 'Program Retraining dan Upskilling SDM Jakpro yang memuat per kesenjangan kapabilitas:
- Keterampilan baru yang ditargetkan (contoh: manajemen portofolio, analisis investasi, strukturisasi JV)
- Modul dan kurikulum pelatihan
- Metode pembelajaran dan pelaksana (internal atau mitra pelatihan eksternal)
- Histori training yang pernah dilaksanakan sebelumnya
- Target kompetensi yang harus dicapai
- Jadwal pelaksanaan', '- Kesesuaian modul pelatihan dengan keterampilan yang dibutuhkan peran Strategic Holding/City Master Developer
- Kelengkapan program untuk kesenjangan kapabilitas prioritas', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase kesenjangan kapabilitas prioritas yang memiliki program pelatihan ulang terdokumentasi (target: ≥ 90%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Program pelatihan ulang disetujui Direksi (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melaksanakan program redeployment sesuai rencana: memindahkan SDM ke posisi baru, memberikan pengenalan peran yang komprehensif, dan pendampingan awal.', '2.C.4..3', 100, 'Laporan Pelaksanaan Program Redeployment yang memuat per SDM:
- Status perpindahan (selesai/dalam proses)
- Tanggal efektif perpindahan ke posisi
- Hasil penilaian kesiapan awal di posisi baru (setelah 1 dan 3 bulan)', '- Persentase SDM yang berhasil dipindahkan dengan kinerja memadai
- Kesesuaian posisi tujuan dengan kebutuhan bisnis aktual', v_pic_id, '2030-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase SDM yang berhasil dipindahkan dengan penilaian kinerja memadai di posisi baru (target: ≥ 90%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Waktu yang dibutuhkan SDM untuk mencapai kinerja standar di posisi baru', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melaksanakan program retraining dan upskilling secara bertahap berdasarkan prioritas dan mengaitkan langsung dengan proyek atau kerja sama aktif Jakpro agar keterampilan baru langsung diaplikasikan.', '2.C.4..4', 100, 'Laporan Pelaksanaan Program Pelatihan Ulang (per sesi/modul) yang memuat:
- Peserta dan tingkat kehadiran
- Hasil evaluasi kompetensi sebelum dan sesudah pelatihan
- Rekam jejak penerapan keterampilan baru dalam proyek/kerja sama aktif Jakpro', '- Peningkatan skor kompetensi sebelum vs sesudah pelatihan
- Bukti penerapan keterampilan baru dalam proyek/kerja sama aktif', v_pic_id, '2030-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase peserta yang mencapai target kompetensi (target: ≥ 80%)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melaksanakan selective hiring berdasarkan prioritas: Membuka lowongan pekerjaan, menyeleksi calon kandidat melalui tahapan rekrutmen, merekrut calon terpilih, dan melakukan onboarding  apabila dibutuhkan', '2.C.4..5', 100, 'Laporan Pelaksanaan Selective Hiring yang memuat:
- Calon kandidat, kualifikasi, serta rekam jejak karir
- Progres tahapan seleksi dan penilaian (Lulus/ Tidak Lulus, Nilai untuk Masing-Masing Komponen)
- Hasil penilaian masa probation setelah kandidat direkrut', '- Persentase pemenuhan kapabilitas yang tidak tersedia secara internal
- Kesiapan kandidat dalam proses transformasi Jakpro', v_pic_id, '2030-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase gap kapabilitas yang tidak tersedia secara internal terpenuhi dengan selective hiring (target: 100%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Kesiapan kandidat untuk melakukan pekerjaan di posisi baru (Ya/ Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Membangun mekanisme monitoring, evaluasi, dan institusionalisasi kapabilitas agar penguatan SDM menjadi bagian dari tata kelola yang berkelanjutan', '2.C.5.', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melakukan monitoring atas penempatan, pengembangan, dan performa SDM dalam fungsi strategis untuk menilai efektivitas redeploy dan retrain.', '2.C.5..1', 100, 'Laporan Evaluasi Efektivitas Program Kapabilitas (tahunan) yang memuat:
- Kapabilitas yang terbukti dimanfaatkan dalam proyek/kerja sama aktif
- Kapabilitas yang dibangun namun belum dimanfaatkan beserta analisis penyebabnya
- Rekomendasi lanjutkan/modifikasi/hentikan per program', '- Pengukuran dampak berdasarkan indikator bisnis nyata
- Persentase program yang dievaluasi efektivitasnya setiap tahun', v_pic_id, NULL, 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase program kapabilitas yang dievaluasi efektivitasnya setiap tahun (target: 100%)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melaksanakan evaluasi berkala atas dampak program pelatihan ulang dan redeployment terhadap kinerja bisnis nyata Jakpro', '2.C.5..2', 100, 'Laporan Evaluasi Efektivitas Program Kapabilitas (tahunan) yang memuat:
- Kapabilitas yang terbukti dimanfaatkan dalam proyek/kerja sama aktif
- Kapabilitas yang dibangun namun belum dimanfaatkan beserta analisis penyebabnya
- Rekomendasi lanjutkan/modifikasi/hentikan per program', '- Pengukuran dampak berdasarkan indikator bisnis nyata
- Persentase program yang dievaluasi efektivitasnya setiap tahun', v_pic_id, NULL, 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase program kapabilitas yang dievaluasi efektivitasnya setiap tahun (target: 100%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Penurunan biaya konsultan eksternal untuk fungsi strategis inti (Rp/tahun)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengintegrasikan penguatan kapabilitas ke dalam proses manajemen SDM dan transformasi agar kebutuhan kapabilitas strategis terus diperbarui dan dijaga keberlanjutannya.', '2.C.5..3', 100, '- Peta Kapabilitas Kritis yang Perlu Dilembagakan
- Panduan Operasional dan Buku Pedoman per Domain Kapabilitas Strategic Holding dan City Master Developer', '- Kelengkapan dokumentasi per kapabilitas kritis
- Persentase domain kapabilitas tanpa ketergantungan individu tunggal', v_pic_id, NULL, 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase kapabilitas kritis yang memiliki panduan operasional/buku pedoman terdokumentasi (target: 100%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase domain kapabilitas yang tidak memiliki ketergantungan individu tunggal (target: 100%)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Aspect
    INSERT INTO aspects (company_id, name, target_percentage)
    VALUES (v_company_id, 'Penguatan Sistem Operational & Digital Backbone', 100)
    RETURNING id INTO v_aspect_id;

    -- Strategy
    INSERT INTO strategies (aspect_id, name, code_order, target_percentage)
    VALUES (v_aspect_id, 'Pelaksanaan PMO transformasi sebagai fasilitator utama dan titik eskalasi dalam pelaksanaan inisiatif transformasi korporasi', 'A.', 100)
    RETURNING id INTO v_strategy_id;

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Menyusun fondasi tata kelola PMO transformasi untuk memastikan mandat, peran, struktur kerja, dan mekanisme koordinasi PMO berjalan jelas serta tidak tumpang tindih dengan fungsi eksisting Jakpro', '3.A.1.', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Pembentukan SK Gubernur terkait tim PMO lintas pemangku kepentingan yang kemudian diturunkan ke dalam Ingub atau Insekda, termasuk rencana aksi dan milestone yang terintegrasi serta berurutan. SK Gubernur perlu menetapkan pelibatan Jakpro dalam tim PMO eksternal dengan multi-stakeholder untuk proyek-proyek strategis.', '3.A.1..1', 100, '1. SK Gubernur tentang Pembentukan Tim PMO Transformasi Lintas Pemangku Kepentingan yang memuat:
- Daftar anggota PMO (Pemprov DKI, BP BUMD, Jakpro, dan pemangku kepentingan strategis terkait).
- Ruang lingkup mandat PMO.
- Proyek strategis yang berada dalam pengawalan PMO.
- Penugasan resmi yang menetapkan Jakpro sebagai tim PMO eksternal multi-stakeholder untuk program strategis.

2. Ingub/Insekda turunan yang menjabarkan:
- Rencana aksi lintas instansi.
- Timeline dan milestone berurutan.
- Mekanisme koordinasi dan pelaporan.', '- Kejelasan mandat PMO, tidak tumpang tindih dengan fungsi eksisting BUMD, dan adanya jalur eskalasi formal.
- Jumlah regulasi yang diterbitkan (SK dan Ingub/Insekda) dan jumlah proyek strategis yang tercakup dalam roadmap PMO.', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'SK Gubernur telah diterbitkan (Ya/Tidak).', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'SK Gubernur PMO diterbitkan maksimal X bulan sejak inisiasi program.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Ingub/Insekda turunan telah diterbitkan (Ya/Tidak).', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Ingub/Insekda turunan diterbitkan ≤ X bulan setelah SK Gubernur', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Minimal X% proyek strategis Jakpro tercantum dalam roadmap PMO dan memiliki milestone aktif.', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyusun dokumen mandat PMO Transformasi Jakpro yang mendefinisikan secara eksplisit: peran sebagai fasilitator lintas inisiatif, kewenangan untuk mengakselerasi isu yang bergantung pada keputusan Pemprov (termasuk penerbitan Peraturan atau Surat Tugas terkait pengalihan LRT Jakarta, formalisasi tarif/PSO, dan transformasi ke Strategic Holding), serta jalur eskalasi formal ke Gubernur', '3.A.1..2', 100, 'Dokumen Mandat PMO Transformasi Jakpro yang memuat:
- Peran PMO: fasilitator, koordinator, titik eskalasi ke Gubernur
- Kewenangan PMO termasuk jalur akselerasi ke Gubernur untuk isu strategis
- Daftar jenis isu yang dapat dieskalasi langsung ke Gubernur (contoh: Peraturan pengalihan LRT, Surat Tugas CMD, formalisasi tarif/PSO)
- Mekanisme hubungan dengan Direksi dan unit kerja Jakpro', '- Kejelasan jalur eskalasi ke Gubernur untuk isu-isu transformasi kunci
- Ketersediaan daftar jenis isu yang dapat dieskalasi langsung', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Dokumen mandat disetujui Direksi (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Jalur eskalasi ke Gubernur terdefinisi konkret termasuk jenis isu yang dapat dieskalasi (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Pengaturan tim ad hoc PMO lintas divisi yang bersifat fleksibel namun akuntabel dengan penugasan formal, pelibatan seluruh fungsi terkait, serta pengaturan insentif dan mekanisme reward-punishment untuk pihak yang terlibat dalam transformasi (misal: pelaksana PMO dan eksekutor inisiatif) agar mendorong kepemilikan bersama (sense of responsibility) atas agenda transformasi.', '3.A.1..3', 100, '1. Dokumen terkait Pembentukan Tim Ad Hoc PMO Transformasi, mencakup:
- Nama anggota lintas divisi.
- Peran dan tanggung jawab spesifik.
- Masa penugasan dan KPI individu/tim.

2. RACI Matrix PMO Transformasi untuk seluruh inisiatif prioritas.

3. Skema insentif dan evaluasi kinerja PMO, terintegrasi ke sistem penilaian karyawan (reward & corrective action), mencakup, tapi tidak terbatas pada:
- Pelaksana peran PMO
- Eksekutor inisiatif transformasi', '- Kejelasan akuntabilitas individu dan lintas fungsi serta keterkaitan kinerja PMO dengan sistem evaluasi SDM.
', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Minimal X% divisi kunci Jakpro terwakili dalam tim ad hoc PMO.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, '100% inisiatif transformasi prioritas memiliki PIC lintas fungsi dan RACI yang terdokumentasi.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Skema insentif PMO diimplementasikan dan digunakan dalam penilaian kinerja tahunan.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Progress ketercapaian agenda transformasi dan insentif yang terpakai (target: XX%)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menetapkan struktur internal PMO termasuk komposisi tim, peran Ketua PMO, dan Penanggung Jawab Penghubung per klaster inisiatif (Klaster Fiskal/Aset, Klaster Portofolio/Kapabilitas, Klaster Sistem/Digital, Klaster Organisasi/Tata Kelola) dengan mempertimbangkan potensi tumpang tindih dengan struktur eksisting Jakpro', '3.A.1..4', 100, '- Struktur Tim PMO Transformasi beserta pembagian per klaster inisiatif (termasuk RACI matrix)
- SK Direksi tentang Pembentukan dan Tata Kerja PMO Transformasi Jakpro
- Instrumen Formal BP BUMD yang mengakui peran PMO Jakpro
- Asesmen potensi tumpang tindih struktur dan peran PMO dengan struktur eksisting Jakpro', '- Kejelasan struktur kerja dan jalur eskalasi PMO.
- Seluruh inisiatif prioritas memiliki accountable owner.
- Potensi tumpang tindih peran teridentifikasi dengan jelas.', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'SK Direksi PMO Transformasi diterbitkan (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Instrumen formal BP BUMD diterbitkan (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Pelaksanaan fungsi PMO mencakup kebutuhan koordinasi terhadap aktivitas internal korporasi dan eksternal, dengan berkomunikasi dengan pemangku kepentingan eksternal untuk monitoring aset-aset penugasan.', '3.A.1..5', 100, '1. Kerangka kerja koordinasi PMO internal-eksternal, mencakup:
- Forum koordinasi rutin (bulanan/kuartalan).
- Jalur komunikasi dan eskalasi isu.

2. Notulen dan laporan koordinasi resmi dengan pemangku kepentingan eksternal (Regulator, mitra proyek, dll.).

3. Log isu dan eskalasi PMO lengkap dengan status penyelesaian.', '', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Menyusun peta jalan transformasi yang terintegrasi, mekanisme pemantauan, dan risk register Transformasi', '3.A.2.', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Merumuskan peta jalan transformasi di tingkat Direksi untuk selanjutnya didelegasikan secara terstruktur kepada VP/direktorat terkait untuk menjadi acuan pelaksanaan, sekaligus dikaitkan langsung dengan KPI Direksi.', '3.A.2..1', 100, 'Peta Jalan Transformasi Terintegrasi Jakpro yang mencakup:
- Timeline keseluruhan 10 inisiatif Jakpro
- Prioritisasi dan ketergantungan antar inisiatif
- Deadline dan target penyelesaian setiap inisiatif (termasuk tonggak approval Pemprov)
- PMO Charter untuk masing-masing inisiatif Transformasi Jakpro', '- Kelengkapan peta jalan mencakup seluruh 10 inisiatif
- Ketepatan identifikasi tonggak yang bergantung pada keputusan Pemprov', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Peta jalan disetujui Direksi dan BP BUMD (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Seluruh tonggak yang bergantung pada keputusan Pemprov teridentifikasi dan ditandai (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Memanfaatkan mekanisme insentif dan bonus secara terarah untuk masing-masing peran dalam transformasi Jakpro sebagai pendorong pencapaian KPI transformasi yang telah ditetapkan.

(misal: peran tim ad-hoc PMO, peran eksekutor inisiatif, peran agent of change)', '3.A.2..2', 100, '1. Dokumen Skema Insentif Berbasis KPI Transformasi, mencakup:
- Komponen KPI transformasi 
- Bobot kontribusi 
- Panduan Operasional Penilaian Insentif Transformasi, termasuk metode pengukuran dan validasi capaian.
- Peran dalam agenda transformasi (misal: tim ad-hoc PMO, peran eksekutor inisiatif, peran agent of change)

2. KPI Transformasi yang terintegrasi ke sistem penilaian kinerja perusahaan.', '- Kejelasan metode pengukuran.
- Stimulus pelaksanaan inisiatif terimplementasi secara efektif dalam pelaksanaan agenda transformasi', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Skema insentif berbasis KPI transformasi disetujui dan diimplementasikan (Ya/Tidak).', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Bobot KPI transformasi telah dirumuskan (Ya/Tidak).', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, '≥ X% target KPI transformasi Direksi tercapai per tahun buku.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Efektivitas insentif dalam pencapaian target KPI transformasi (target: ≥ X%)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyusun program charter yang berperan sebagai landasan penetapan tujuan (goal setting) baik untuk PMO charter maupun transformation charter yang dikembangkan dan dikelola oleh Tim PMO.', '3.A.2..3', 100, 'Program Charter Transformasi yang disusun oleh Tim PMO dan disahkan Direksi, memuat:
- Tujuan strategis program transformasi (strategic objectives).
- Ruang lingkup program dan batasan.
- Target outcome dan measurable success criteria.
- Keterkaitan dengan peta jalan transformasi dan KPI Direksi.
- Struktur tata kelola program (sponsor, program owner, PMO).
- Daftar inisiatif/proyek di bawah program beserta prioritasnya.

2. PMO Program Charter yang menjabarkan:
- Mandat dan peran PMO dalam mengelola keseluruhan program transformasi.
- Mekanisme pengendalian, pelaporan, dan eskalasi lintas inisiatif.', '- Kejelasan tujuan program.
- Konsistensi dengan peta jalan serta KPI Direksi.
- Jumlah program transformasi prioritas yang telah memiliki program charter disahkan.', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, '100% program transformasi strategis memiliki Program Charter yang disahkan Direksi.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Program Charter mencakup ≥ X% inisiatif transformasi prioritas dalam peta jalan.', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melakukan standarisasi terkait pemberian strategi mitigasi untuk setiap risk register transformasi untuk memastikan konsistensi, keterukuran, dan efektivitas pengelolaan risiko.', '3.A.2..4', 100, '1. Template Risk Register Transformasi Terstandar, mencakup:
- Kategori risiko (strategis, finansial, regulasi, operasional, reputasi).
- Skoring risiko (likelihood-impact).
- Risk owner dan escalation trigger.

2. Panduan Standar Penyusunan Strategi Mitigasi Risiko, termasuk fallback plan dan early warning indicator.

3. Risk Register Terintegrasi Transformasi, diperbarui secara periodik dan digunakan oleh PMO.', '- Ketepatan identifikasi risiko dan relevansi strategi mitigasi.
- Persentase inisiatif transformasi yang tercakup dalam risk register terstandar.', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Template dan panduan risk register transformasi disahkan (Ya/Tidak).', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, '100% inisiatif transformasi memiliki risk register dengan mitigasi terdokumentasi.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, '≥ X% risiko tinggi memiliki rencana mitigasi aktif dan risk owner yang jelas.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Penurunan eksposur risiko agregat (risk exposure index) minimal X% dalam X bulan.', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyusun alat kerja kerja, mekanisme pemantauan (termasuk cadence forum PMO, SOP penyelesaian isu, dan lainnya), serta jalur eskalasi yang jelas untuk memastikan keberjalanan PMO yang terstandarisasi dan terstruktur.', '3.A.2..5', 100, '1. Buku standar kerja PMO transformasi yang mencakup
- SLA untuk masing-masing aksi
- Pedoman klasifikasi status implementasi (on-track, at risk, delayed, blocked)
- Template  dan panduan penggunaan tools PMO
- Mekanisme monitoring PMO
- Kalender forum PMO (termasuk cadence, forum, peserta, dan PIC)', '- Kelengkapan template terhadap kebutuhan monitoring implementasi.
- Konsistensi format antar tools PMO.
- Kemudahan penggunaan tools oleh seluruh workstream.
- Kejelasan definisi sehingga tidak menimbulkan interpretasi berbeda.
- Kesesuaian kategori isu dengan hambatan implementasi riil.
- Standar status dan dapat diterapkan lintas workstream', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Mekanisme pemantauan pertama kali diterapkan sesuai jadwal (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase unit yang menyampaikan status tepat waktu (target: 100%)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Menjalankan fungsi PMO dalam pengawalan implementasi, koordinasi lintas fungsi, dan penyelesaian bottleneck untuk memastikan inisiatif transformasi bergerak sesuai prioritas dan target', '3.A.3.', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menjalankan fungsi orkestrasi PMO yang mencakup:
- Memantau dan mengkonsolidasikan progres inisiatif terhadap peta jalan
- Mengidentifikasi hambatan secara proaktif
- Mengkoordinasikan penyelesaian hambatan', '3.A.3..1', 100, '1 Laporan Status Implementasi Transformasi, yang memuat per workstream/inisiatif:
- milestone utama
- status progres
- deviasi waktu/biaya bila ada
- isu utama
- kebutuhan dukungan manajemen
- hambatan yang dihadapi

2. Batasan penyelesaian fungsi PMO. 
', '- Kelengkapan informasi progres lintas workstream.
- Ketepatan waktu konsolidasi laporan.
- Kemampuan laporan menunjukkan deviasi dan prioritas tindak lanjut secara jelas.
- Kelengkapan action tracker untuk masing-masing hambatan', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase workstream yang menyampaikan update tepat waktu ≥ X%.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Waktu konsolidasi laporan PMO ≤ X hari setelah cut-off pelaporan.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase dari 10 inisiatif yang berjalan sesuai jadwal per periode tinjauan (target: ≥ 80%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Rata-rata waktu penyelesaian isu yang dieskalasi ke PMO (target: menurun setiap triwulan)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Memimpin forum tinjauan berkala dan memastikan setiap forum menghasilkan keputusan atau tindak lanjut yang konkret', '3.A.3..2', 100, 'Action Tracker Forum PMO, yang memuat:
- daftar action item
- asal forum/rapat
- PIC
- due date
- status open / closed / overdue
- catatan progres
- Rekapitulasi tindak lanjut forum', '- Kelengkapan pencatatan action item.
- Kejelasan PIC dan due date.
- Konsistensi pembaruan status tindak lanjut.', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase action item yang closed on time ≥ X%.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Jumlah action item overdue ≤ X.', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengelola perubahan implementasi yang bersifat material agar perubahan scope, timeline, atau resource tidak berjalan informal dan tetap terdokumentasi.', '3.A.3..3', 100, '1. Register Perubahan Implementasi, yang memuat:
- jenis perubahan (scope/timeline/resource/approach)
- alasan perubahan
- dampak terhadap milestone dan target
- pihak yang mengusulkan
- pihak yang menyetujui
- status implementasi perubahan
- Dokumen justifikasi perubahan implementasi', '- Seluruh perubahan material terdokumentasi formal.
- Dampak perubahan dijelaskan dengan jelas.
- Persetujuan perubahan tercatat sesuai tata kelola.', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase perubahan material yang terdokumentasi formal ≥ 100%.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Jumlah perubahan tanpa approval resmi = 0 / ≤ X.', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Memfasilitasi eskalasi isu transformasi Jakpro kepada Pemprov', '3.A.3..4', 100, 'Daftar Isu Strategis yang Memerlukan Keputusan/Peraturan Gubernur per periode yang memuat per isu:
- Deskripsi isu dan inisiatif yang terhambat
- Jenis keputusan/Peraturan yang dibutuhkan dari Pemprov
- Level eskalasi yang diperlukan
- Status eskalasi dan jadwal target keputusan
- Bahan Rapat per Isu yang Dieskalasi (ringkas, berorientasi keputusan)
- Dokumentasi Keputusan/Peraturan Gubernur per isu beserta rencana tindak lanjut Jakpro', '- Kelengkapan identifikasi isu yang memerlukan keputusan Gubernur/Pemprov
- Jumlah isu yang mendapat keputusan dalam jadwal yang ditetapkan', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Jumlah isu strategis yang berhasil mendapatkan keputusan/Peraturan dari Pemprov per periode', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Rata-rata waktu dari eskalasi ke keputusan Gubernur (hari)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Mengevaluasi efektivitas PMO dan melembagakan fungsi pengendalian transformasi dalam tata kelola Jakpro', '3.A.4.', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melakukan evaluasi komprehensif atas efektivitas PMO Transformasi Jakpro, mencakup:
- Inisiatif yang berhasil dipercepat atau dibuka hambatannya melalui jalur eskalasi ke Gubernur.
- Kualitas koordinasi lintas divisi.
- Efektivitas mekanisme pemantauan.
- Evaluasi potensi tumpang tindih fungsi PMO dengan divisi eksisting (misalnya Divisi Corporate Planning) melalui identifikasi tugas pokok dan fungsi monitoring yang telah berjalan, serta asesmen atas otoritas dan kapabilitas divisi tersebut untuk menjalankan fungsi PMO secara menyeluruh.', '3.A.4..1', 100, '1. Laporan Evaluasi Efektivitas PMO Transformasi Jakpro yang memuat:
- Jumlah isu yang berhasil dieskalasi ke Gubernur dan mendapat keputusan.
- Jumlah inisiatif yang berhasil masuk tahap implementasi setelah difasilitasi PMO.
- Fungsi PMO yang efektif dan layak dilembagakan.
- Fungsi yang tidak efektif dan perlu dihentikan.

2. Dokumen Analisis Tumpang Tindih Fungsi PMO dengan Divisi Eksisting, khususnya Divisi Corporate Planning, yang memuat:
- Pemetaan tugas pokok dan fungsi monitoring yang telah dijalankan.
- Asesmen otoritas, kapasitas SDM, proses, dan kapabilitas sistem Divisi Corporate Planning untuk menjalankan fungsi PMO secara end‑to‑end.
- Rekomendasi desain fungsi pengendalian transformasi (tetap sebagai PMO terpisah atau dilekatkan ke divisi eksisting).', '- Jumlah inisiatif yang berhasil masuk tahap implementasi setelah difasilitasi PMO.
- Kepuasan Direksi atas fungsi PMO.
- Rekomendasi desain fungsi pengendalian transformasi ditetapkan maksimal X bulan setelah evaluasi selesai.', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase inisiatif prioritas yang berhasil masuk tahap implementasi setelah difasilitasi PMO', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Kepuasan Direksi atas fungsi PMO (target: ≥ X% dari survei internal)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengintegrasikan fungsi pengendalian transformasi (pemantauan progres inisiatif, koordinasi lintas divisi, dan eskalasi ke Gubernur) ke dalam tata kelola Strategic Holding Jakpro sebagai fungsi permanen.', '3.A.4..2', 100, 'Dokumen Pelembagaan Fungsi Pengendalian Transformasi dalam Tata Kelola Strategic Holding Jakpro yang memuat:
- Fungsi-fungsi yang dilembagakan
- Penempatan dalam struktur organisasi
- Mekanisme pembiayaan berkelanjutan', '- Perubahan terdokumentasi dengan jelas.
- Perubahan sesuai hasil evaluasi.
- Keterlacakan perubahan dari versi sebelumnya terjaga.', v_pic_id, '2029-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Fungsi pengendalian transformasi terintegrasi ke dalam tata kelola Jakpro (Ya/Tidak, target: Y2–Y3)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Dokumen pelembagaan disahkan Direksi (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mendokumentasikan pembelajaran implementasi untuk menjadi referensi penguatan pengawalan transformasi di periode berikutnya, termasuk pendalaman evaluasi terhadap knowledge management system yang sedang dikembangkan dari aspek prosedur, people and culture, SOP, serta pemanfaatannya sebagai sarana pembelajaran organisasi.', '3.A.4..3', 100, '1. Dokumen Lesson Learned PMO, yang memuat:
- praktik yang berjalan efektif
- hambatan yang berulang
- pola penyelesaian yang berhasil / tidak berhasil
- rekomendasi penguatan untuk periode berikutnya.

2. Laporan Evaluasi Knowledge Management System yang sedang dikembangkan, mencakup:
- Aspek prosedur dan SOP.
- Kesiapan people dan culture (adopsi, perilaku berbagi pengetahuan).
- Peran Knowledge Management System dalam mendukung fungsi PMO dan pengendalian transformasi.

3. Rencana aksi peningkatan Knowledge Management System sebagai knoweldge base transformasi.', '- Kejelasan pembelajaran yang diambil dari implementasi.
- Relevansi pembelajaran terhadap penguatan PMO ke depan.
- Lesson learned dapat digunakan sebagai referensi tindakan nyata.', v_pic_id, NULL, 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase inisiatif prioritas yang memiliki lesson learned terdokumentasi ≥ X%.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase rekomendasi lesson learned yang diadopsi pada periode berikutnya ≥ X%.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Dokumen lessons learned telah diselesaikan (Ya/Tidak).', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Laporan evaluasi Knowledge Management System diselesaikan (Ya/Tidak).', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, '≥ X% inisiatif transformasi memiliki pembelajaran yang terdokumentasi dalam Knowledge Management System.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Tingkat pemanfaatan Knowledge Management System oleh unit terkait meningkat ≥ X% dalam X bulan.', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Strategy
    INSERT INTO strategies (aspect_id, name, code_order, target_percentage)
    VALUES (v_aspect_id, 'Mengimplementasikan platform digital treintegrasi untuk menyatukan informasi aset, proyek, keuangan, dan kinerja manajemen', 'B.', 100)
    RETURNING id INTO v_strategy_id;

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Menetapkan kebutuhan bisnis, ruang lingkup, dan tata kelola platform digital terintegrasi agar pengembangan sistem selaras dengan kebutuhan pengambilan keputusan dan pengawasan perusahaan', '3.B.1.', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyusun kerangka kebutuhan bisnis platform digital terintegrasi yang mencakup domain aset, proyek, keuangan, dan kinerja manajemen sebagai dasar pengembangan sistem yang terarah dan relevan bagi kebutuhan perusahaan.', '3.B.1..1', 100, '1. Dokumen Kebutuhan Bisnis Platform Digital, yang memuat:
- tujuan implementasi platform digital
- daftar domain informasi yang dicakup (aset, proyek, keuangan, KPI)
- permasalahan existing yang ingin diselesaikan
- kebutuhan pengguna utama per fungsi
- prioritas use case implementasi tahap awal', '- Kelengkapan kebutuhan bisnis terhadap seluruh domain utama.
- Kejelasan hubungan antara kebutuhan bisnis dan masalah existing.
- Kesesuaian prioritas informasi dengan kebutuhan pengambilan keputusan.', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase domain informasi prioritas yang terdokumentasi lengkap ≥ 100%.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Tingkat persetujuan manajemen atas kebutuhan bisnis platform ≥ X%.', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menetapkan ruang lingkup implementasi platform dan prioritas use case agar pengembangan dilakukan secara bertahap dan sesuai kapasitas organisasi.', '3.B.1..2', 100, '1. Dokumen Ruang Lingkup Implementasi Platform, yang memuat:
- modul yang termasuk tahap awal
- modul yang masuk tahap lanjutan
- batasan implementasi awal
- dependensi antar modul
- Daftar prioritas use case', '- Kejelasan ruang lingkup implementasi tahap awal vs lanjutan.
- Prioritas use case disusun secara logis dan realistis.
- Terdapat hubungan yang jelas antara prioritas use case dan kebutuhan manajemen.', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase use case prioritas yang telah ditetapkan secara formal ≥ 100%.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Jumlah perubahan ruang lingkup tahap awal tanpa persetujuan ≤ X.', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyusun tata kelola implementasi platform digital agar pengembangan, integrasi data, dan penggunaan sistem memiliki pemilik yang jelas.', '3.B.1..3', 100, 'Dokumen Governance Implementasi Platform, yang memuat:
- sponsor bisnis implementasi
- system owner
- business owner per domain
- data owner per domain
- forum steering / forum operasional implementasi
- Matriks peran implementasi platform', '- Kejelasan peran pemilik bisnis, pemilik sistem, dan pemilik data.
- Tidak ada domain yang tidak memiliki owner.
- Hubungan kerja implementasi tergambar jelas.', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase domain utama yang memiliki business owner dan data owner ≥ 100%.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Jumlah isu kepemilikan data/sistem yang belum terselesaikan ≤ X kasus.', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melakukan prioritisasi integrasi sistem pada dua platform quick win (contoh: Manage Enterprise dan Manage asset), serta dibahas dan disepakati bersama antara Jakpro dan BP BUMD.', '3.B.1..4', 100, '1. Dokumen Integrasi Platform Quick Win, yang merinci:
- Integrasi sistem untuk platform Manage Enterprise dan Asset Manage.
- Sumber data utama, dependensi sistem, dan alur integrasi data.
- Nota Kesepahaman Teknis (Technical Agreement) antara Jakpro dan BP BUMD terkait akses data dan utilisasi platform.', '- Relevansi data dengan kebutuhan pengawasan BP BUMD, kejelasan batasan akses, dan keandalan dashboard.', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Integrasi 2 platform quick win (Manage Enterprise dan Asset Management) selesai dan beroperasi dalam X bulan (Ya/Tidak).', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melakukan kajian dan penetapan prioritas business process selanjutnya yang akan didigitalisasi secara berkala.', '3.B.1..5', 100, '1. Dokumen Kajian Digitalisasi Business Process, yang memuat:
a. Daftar seluruh business process utama dan pendukung Jakpro.
b. Penilaian masing‑masing proses berdasarkan kriteria terstandar, meliputi:
- Dampak strategis terhadap pengambilan keputusan dan kinerja perusahaan.
- Tingkat kompleksitas dan kesiapan proses.
- Kesiapan data, sistem, dan integrasi.
- Potensi efisiensi dan risiko implementasi.
c. Temuan utamadan peluang nilai tambah dari digitalisasi setiap proses.
d. Daftar Prioritas Business Process untuk Digitalisasi, yang memuat:
- Urutan prioritas business process yang akan didigitalisasi.
- Justifikasi penetapan prioritas untuk setiap proses.
- Penetapan pemilik proses (process owner) dan estimasi fase implementasi.', '- Tingkat kelengkapan dan konsistensi metodologi kajian (kriteria penilaian, pembobotan, dan justifikasi).
- Relevansi prioritas business process dengan kebutuhan strategis pengambilan keputusan, efisiensi operasional, dan arah transformasi digital Jakpro.
- Kejelasan penetapan process owner dan kesiapan implementasi.
- Persentase business process utama dan pendukung yang telah dikaji secara formal.
- Jumlah business process yang ditetapkan secara eksplisit dalam daftar prioritas digitalisasi.', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, '≥ X% business process utama telah dikaji dan terdokumentasi.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Dokumen daftar prioritas resmi yang disahkan manajemen (Ya/Tidak).', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, '100% business process yang diprioritaskan memiliki justifikasi berbasis hasil kajian terdokumentasi (Ya/Tidak).', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, '≥ X% business process yang didigitalisasi (berdasarkan prioritas) menunjukkan peningkatan efisiensi proses atau kualitas pengambilan keputusan sesuai business case.', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Menyiapkan fondasi data dan desain sistem untuk memastikan platform digital dibangun di atas data yang terstandarisasi , akurat, dan dapat diintegrasikan', '3.B.2.', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengidentifikasi sumber data, pemilik data, dan kondisi kualitas data existing untuk seluruh domain utama yang akan diintegrasikan ke dalam platform.', '3.B.2..1', 100, '1. Inventarisasi Sumber Data Platform, yang memuat per domain:
- nama sumber data / sistem / file existing
- unit pemilik data
- frekuensi update
- format data
- status data (aktif/tidak aktif/manual)
- Tabel ketersediaan dan validitas data', '- Kelengkapan identifikasi sumber data untuk seluruh domain.
- Kejelasan status ketersediaan dan validitas data.
- Tabel data dapat digunakan sebagai dasar cleansing dan integrasi.', v_pic_id, '2028-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase elemen data prioritas yang telah teridentifikasi sumber dan PIC-nya ≥ X%.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase data prioritas yang status validitasnya telah dipetakan ≥ X%.', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menetapkan standar definisi data, master data, dan aturan kualitas data untuk mencegah perbedaan definisi antar unit dan meningkatkan konsistensi informasi.', '3.B.2..2', 100, '1. Dokumen Master Data, yang memuat:
- nama elemen data
- definisi data
- rumus/perhitungan bila relevan
- satuan data
- sumber data resmi
- pemilik data
- pedoman kualitas data', '- Tidak terdapat definisi ganda pada data kritikal.
- Master data disusun konsisten lintas fungsi.
- Aturan kualitas data cukup jelas untuk diterapkan.', v_pic_id, '2028-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase elemen data kritikal yang memiliki definisi tunggal ≥ X%.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Jumlah konflik definisi data antar unit ≤ X kasus.', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyusun desain kebutuhan sistem dan arsitektur integrasi agar pengembangan platform memiliki arah teknis dan bisnis yang jelas.', '3.B.2..3', 100, 'Dokumen Business Requirement / Functional Requirement, yang memuat:
- kebutuhan input data, proses/ workflow, dashboard/ reporting, notifikasi, dan kebutuhan hak akses
- Dokumen arsitektur integrasi', '- Kebutuhan sistem terdefinisi lengkap untuk domain prioritas.
- Arsitektur integrasi menggambarkan alur data secara jelas.
- Kebutuhan kontrol dan monitoring telah tercakup dalam desain.', v_pic_id, '2028-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase requirement prioritas yang terdokumentasi lengkap ≥ X%.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase sumber data prioritas yang telah memiliki desain integrasi ≥ X%.', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Mengintegrasikan kebutuhan monitoring kinerja dan pengawasan pemangku kepentingan ke dalam desain dan pemanfaatan platform digital', '3.B.3.', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melakukan komunikasi dan koordinasi terstruktur dengan BP BUMD terkait proses monitoring kinerja serta data dan informasi yang diperlukan, termasuk format pemantauan kinerja, untuk selanjutnya mempertimbangkan pemanfaatan platform eksisting seperti SI BUMD sebagai sarana monitoring terintegrasi.', '3.B.3..1', 100, 'Kesepakatan Format Monitoring dan Pelaporan Kinerja, berupa:
- Template dashboard dan/atau laporan kinerja yang disepakati bersama.
- Standar format data, visualisasi, dan periode pelaporan.', '- Tingkat kejelasan dan kelengkapan kebutuhan monitoring BP BUMD yang terdokumentasi.
- Tingkat keselarasan format monitoring dengan kebutuhan pengawasan strategis BP BUMD.', v_pic_id, '2028-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, '100% indikator kinerja prioritas BP BUMD memiliki format pelaporan dan visualisasi yang disepakati.', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengintegrasikan BP BUMD dalam sarana monitoring terintegrasi dengan memberikan akses ke platform digital untuk melakukan sistem pengawasan', '3.B.3..2', 100, 'Daftar Kebutuhan dan Akses Data BP BUMD, mencakup:
- Daftar fitur data yang dapat diakses (aset, proyek, keuangan, KPI).
- Level akses (contoh: read‑only, dashboarding, dll.).
- Batasan pemanfaatan dan ketentuan keamanan data.', '- Jumlah data domain dan indikator yang terintegrasi serta tersedia bagi BP BUMD.', v_pic_id, '2028-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Mengembangkan, menguji, dan menerapkan platform digital terintegrasi agar informasi manajemen dapat digunakan secara operasional dan berskala', '3.B.4.', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengembangkan atau mengonfigurasi platform digital sesuai kebutuhan bisnis dan desain sistem yang telah disepakati (seperti dashboard management).', '3.B.4..1', 100, '1. Platform / Prototype Sistem, yang mencakup modul prioritas untuk:
- monitoring aset, proyek, keuangan utama, dan KPI manajemen
- Konfigurasi hak akses pengguna
- Audit trail aktivitas sistem', '- Kesesuaian fitur yang dibangun dengan requirement yang disetujui.
- Kejelasan pengaturan hak akses.
- Ketersediaan jejak audit untuk aktivitas penting.', v_pic_id, '2029-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase fitur/modul prioritas yang selesai dibangun sesuai requirement ≥ X%.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase role pengguna yang telah dikonfigurasi sesuai hak akses ≥ X%.', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyiapkan data awal, melakukan cleansing, dan memigrasikan data prioritas ke dalam platform agar sistem dapat digunakan dengan basis data yang memadai.', '3.B.4..2', 100, 'Dokumen data migrasi, yang memuat:
- Data migrasi awal platform
- Status data yang berhasil/ sedang dalam progres/ gagal dimigrasikan
- Tindak lanjut perbaikan', '- Kelengkapan data migrasi untuk domain prioritas.
- Tingkat error data hasil migrasi.
- Kejelasan tindak lanjut atas exception data.', v_pic_id, '2029-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase data prioritas yang berhasil dimigrasikan ≥ X%.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Tingkat error data hasil migrasi ≤ X%.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase exception data yang memiliki PIC penyelesaian ≥ 100%.', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melakukan pengujian sistem, validasi pengguna, dan pilot implementasi sebelum platform digunakan secara lebih luas.', '3.B.4..3', 100, 'Dokumen UAT (User Acceptance Test), yang memuat:
- skenario uji per modul
- hasil uji per skenario
- defect / error yang ditemukan
- status penyelesaian defect
- Laporan pilot implementasi', '- Kecukupan cakupan skenario uji.
- Defect kritikal diidentifikasi dan ditangani.
- Hasil pilot memberikan masukan yang dapat ditindaklanjuti.', v_pic_id, '2029-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase skenario UAT yang berhasil lulus ≥ X%.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase defect kritikal yang closed sebelum roll-out ≥ X%.', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menerapkan platform digital kepada pengguna prioritas dan memastikan pengguna memahami cara kerja sistem dalam proses manajemen sehari-hari dengan melakukan change management. dan pelatihan pengguna', '3.B.4..4', 100, 'Materi Pelatihan Pengguna Platform, yang memuat, tapi tidak terbatas pada:
- panduan penggunaan per role
- langkah input/update data
- cara membaca dashboard
- cara menarik laporan
- Manual/ FAQ', '- Materi pelatihan sesuai kebutuhan tiap role pengguna.
- Tingkat pemahaman pengguna setelah pelatihan.
- Manual pengguna cukup jelas untuk dipakai mandiri.', v_pic_id, '2029-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase pengguna prioritas yang telah dilatih ≥ X%.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Tingkat kelulusan asesmen pemahaman pengguna ≥ X%.', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Menjaga utilisasi, kualitas data, dan pengembangan berkelanjutan platform afar sistem tetap relevan dan digunakan secara konsisten dalam skala yang lebih besar', '3.B.5.', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melakukan monitoring berkala atas penggunaan platform, kualitas data, dan keandalan sistem untuk memastikan platform benar-benar digunakan dan informasinya dapat dipercaya.', '3.B.5..1', 100, 'Laporan Monitoring Utilisasi Platform, yang memuat:
- jumlah user aktif
- frekuensi akses dashboard
- modul yang paling/kurang digunakan
- unit dengan utilisasi tertinggi/terendah
- Laporan kualitas data berkala', '- Kualitas monitoring utilisasi cukup rinci untuk menunjukkan area lemah penggunaan.
- Kualitas data dievaluasi secara konsisten.
- Temuan utilisasi dan kualitas data dapat ditindaklanjuti.', v_pic_id, NULL, 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase user prioritas yang aktif menggunakan sistem ≥ X%.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase indikator utama dengan data lengkap ≥ X%.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Tingkat akurasi data prioritas ≥ X%.', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengidentifikasi kebutuhan penyempurnaan sistem dan menindaklanjuti perbaikan agar platform tetap relevan terhadap kebutuhan manajemen dan dinamika implementasi.', '3.B.5..2', 100, 'Daftar Area Penyempurnaan Platform, yang memuat:
- fitur yang perlu ditingkatkan
- kendala penggunaan
- kebutuhan integrasi tambahan
- gap laporan/dashboard
- prioritas perbaikan
- Roadmap enhancement platform', '- Kejelasan area penyempurnaan dan prioritasnya.
- Kesesuaian enhancement dengan kebutuhan pengguna dan manajemen.
- Terdapat dasar evaluasi yang jelas untuk perubahan.', v_pic_id, NULL, 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Jumlah enhancement prioritas yang teridentifikasi ≥ X.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase enhancement prioritas yang memiliki rencana tindak lanjut ≥ X%.', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengintegrasikan penggunaan platform ke dalam forum manajemen dan proses pelaporan resmi agar sistem menjadi bagian dari tata kelola korporat, bukan sekadar alat tambahan.', '3.B.5..3', 100, 'Mekanisme Resmi Penggunaan Platform dalam Forum Manajemen, yang memuat:
- forum yang wajib menggunakan dashboard/platform
- jenis laporan yang ditarik dari sistem
- PIC update sebelum forum', '- Kejelasan integrasi platform ke forum manajemen.
- Konsistensi laporan resmi yang bersumber dari sistem.
- Tingkat ketergantungan pada kompilasi manual menurun.', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase forum manajemen yang menggunakan output platform resmi ≥ X%.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Penurunan waktu kompilasi laporan manual ≥ X%.', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Strategy
    INSERT INTO strategies (aspect_id, name, code_order, target_percentage)
    VALUES (v_aspect_id, 'Pengembangan bisnis proses melalui penetapan mekanisme approval dan otorisasi lintas entitas sebagai bagian dari tata kelola grup', 'C.', 100)
    RETURNING id INTO v_strategy_id;

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Memetakan proses bisnis eksisting Jakpro dan menilai relevansinya dengan peran City Master Developer', '3.C.1.', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengidentifikasi dan mengompilasi seluruh proses bisnis eksisting Jakpro yang telah dipetakan dalam working deck, dan mengelompokkannya berdasarkan domain (misal: strategic planning, asset anagement, business development, dan lainnya)', '3.C.1..1', 100, 'Daftar Proses Bisnis Eksisting Jakpro yang telah dikompilasi dari working deck, dikelompokkan per domain, beserta status relevansinya dengan peran City Master Developer (awal).', '- Kelengkapan kompilasi proses bisnis dari working deck
- Kesesuaian pengelompokan per domain', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Seluruh proses bisnis dari working deck teridentifikasi dan terkompilasi (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Daftar disetujui pimpinan unit yang relevan dan Direksi (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengevaluasi relevansi setiap proses bisnis eksisting Jakpro terhadap kebutuhan peran City Master Developer — menentukan: (1) proses yang masih relevan dan dapat dipertahankan, (2) proses yang perlu diperbarui karena peran CMD mengubah cara kerja, dan (3) proses baru yang perlu dibuat karena belum ada dalam proses eksisting Jakpro.', '3.C.1..2', 100, 'Hasil Evaluasi Relevansi Proses Bisnis Jakpro vs Kebutuhan City Master Developer yang memuat per proses:
- Kategori: relevan dipertahankan / perlu diperbarui / perlu dibuat baru
- Justifikasi: mengapa proses ini relevan/tidak relevan untuk peran CMD
- Perubahan spesifik yang dibutuhkan untuk proses yang perlu diperbarui', '- Kelengkapan evaluasi relevansi per proses
- Kejelasan justifikasi per kategorisasi', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Kuantifikasi dampak terdokumentasi dan disetujui pimpinan unit (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Peringkat prioritas proses yang diperbarui tersedia (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Merancang proses bisnis baru dan diperbarui sesuai Kebutuhan City Master Developer', '3.C.2.', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Merancang desain proses baru untuk proses-proses yang perlu diperbarui atau dibuat baru, dengan fokus pada proses-proses kritis peran City Master Developer

(Misal: pengembangan kawasan/ lahan, manajemen konsesi infrastruktur)', '3.C.2..1', 100, 'Desain Proses Baru/Diperbarui per proses prioritas yang memuat:
- Diagram alur kerja baru yang mencerminkan cara kerja City Master Developer
- Persetujuan yang dipertahankan beserta justifikasi
- Persetujuan yang dihapus dari proses lama beserta justifikasi
- Pemisahan peran Jakpro korporat vs anak usaha yang eksplisit
- Waktu siklus target vs kondisi eksisting', '- Kesesuaian desain proses dengan cara kerja City Master Developer
- Pengurangan titik persetujuan vs kondisi eksisting', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase proses prioritas yang memiliki desain baru terdokumentasi (target: 100%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase pengurangan titik persetujuan vs kondisi eksisting (target: ≥ 20%)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Memvalidasi desain proses baru melalui lokakarya lintas divisi yang melibatkan pemilik proses aktual, memastikan desain secara eksplisit mendefinisikan peran Jakpro korporat (sebagai City Master Developer) vs peran anak usaha.', '3.C.2..2', 100, 'Notulen Lokakarya Validasi Desain per proses prioritas yang memuat:
- Peserta
- Masukan yang diakomodasi dan yang tidak beserta alasan
- Versi desain yang disepakati', '- Penerimaan desain oleh pimpinan unit dan Direksi
- Persentase lokakarya yang mencapai kesepakatan', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Desain proses disetujui pimpinan unit dan Direksi (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase lokakarya yang mencapai kesepakatan tanpa penundaan', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Menetapkan matriks persetujuan dan otorisasi lintas entitas sesuai dengan peran city master developer untuk mengurang bottleneck pengambilan keputusan dan approval', '3.C.3.', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melakukan pemetaan proses existing dan bottleneck approval lintas fungsi/entitas untuk mengidentifikasi titik hambatan, duplikasi, dan approval yang tidak bernilai tambah.', '3.C.3..1', 100, 'Peta Proses Approval Existing, yang berisi:
- Mekanisme approval  existing
- Pemetaan bottleneck dan root-cause
- Pemetaan jenis keputusan', '- Kelengkapan pemetaan proses existing.
- Bottleneck utama teridentifikasi dengan jelas.
- Hubungan antara bottleneck dan dampak proses dapat dijelaskan.', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase proses approval prioritas yang telah dipetakan end-to-end ≥ X%.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Jumlah bottleneck utama yang terdokumentasi ≥ X.', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyusun kerangka matriks  kewenangan approval dan otorisasi lintas entitas yang mengatur siapa berwenang menyetujui, menelaah, atau memberikan rekomendasi atas keputusan material perusahaan.', '3.C.3..2', 100, 'Matriks Persetujuan dan Otorisasi City Master Developer Jakpro yang memuat per jenis keputusan:
- Deskripsi jenis keputusan
- Nilai/skala yang menentukan level kewenangan
- Pihak yang berwenang per level (Jakpro korporat/anak usaha/Direksi)
- Dokumen pendukung yang wajib ada
- Kondisi dan jalur eskalasi', '- Kelengkapan cakupan keputusan dalam ekosistem City Master Developer
- Kejelasan batas kewenangan', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase jenis keputusan material dalam ekosistem CMD yang tercakup (target: 100%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Jumlah keputusan yang tidak memiliki pemilik jelas (target: 0)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengintegrasikan matriks persetujuan ke dalam desain proses bisnis baru, dan memperoleh konfirmasi dari fungsi legal atas kesesuaian dengan AD/ART dan regulasi yang berlaku.', '3.C.3..3', 100, '- Bukti Tinjauan Legal atas kesesuaian matriks
- Matriks yang terintegrasi dengan desain proses bisnis dalam satu dokumen terpadu', '- Kesesuaian matriks dengan tata kelola yang baik
- Penerimaan oleh Direksi dan BP BUMD', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Matriks disetujui Direksi dan dikonfirmasi BP BUMD (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Tidak ada pertentangan dengan AD/ART atau regulasi yang berlaku (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Mengimplementasikan proses bisnis dan mekanisme approval secara bertahap, mulai dari uji coba sampai full scale rollout', '3.C.4.', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melakukan uji coba implementasi proses bisnis dan mekanisme approval  berdasarkan proses bisnis yang paling kritis untuk dilakukan', '3.C.4..1', 100, 'Laporan Pelaksanaan Uji Coba per proses yang memuat:
- SOP Proses BIsnis City Master Developer
- Proses yang diuji coba, proyek/kerja sama aktif yang digunakan sebagai konteks
- Penyimpangan dari desain baru beserta penyebab
- Hambatan yang ditemukan dan cara penyelesaian
- Perbandingan waktu siklus aktual uji coba vs kondisi eksisting
Desain Proses yang Disempurnakan (versi siap penerapan) yang memuat:
- Kelemahan yang ditemukan dalam uji coba
- Penyempurnaan yang dilakukan
- Konfirmasi versi yang disempurnakan lebih baik dari desain awal', '- Persentase proses prioritas CMD yang melalui uji coba
- Pengurangan waktu siklus vs kondisi eksisting', v_pic_id, NULL, 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase jenis keputusan prioritas yang telah memiliki approval matrix resmi ≥ 100%.', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase pihak terkait yang telah mengikuti sosialisasi ≥ X%.', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyempurnakan desain proses berdasarkan pembelajaran dari uji coba sebelum diterapkan ke seluruh divisi.', '3.C.4..2', 100, 'Desain Proses yang Disempurnakan (versi siap penerapan) yang memuat:
- Kelemahan yang ditemukan dalam uji coba
- Penyempurnaan yang dilakukan
- Konfirmasi versi yang disempurnakan lebih baik dari desain awal', '- Jumlah penyempurnaan dari uji coba
- Penerimaan desain yang disempurnakan', v_pic_id, NULL, 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Jumlah penyempurnaan desain dari uji coba', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Desain yang disempurnakan disetujui pimpinan unit dan Direksi (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengesahkan dan melaksanakan penerapan SOP secara bertahap ke seluruh divisi dan SBU yang relevan, disertai sosialisasi dan pembinaan yang memastikan seluruh pemilik proses memahami cara kerjanya dalam konteks City Master Developer.', '3.C.4..3', 100, 'SOP Proses Bisnis City Master Developer, yang memuat:
- Diagram alur yang telah disahkan
- Matriks persetujuan yang terintegrasi
- Waktu siklus standar setiap tahap
- Mekanisme eskalasi
- Dokumentasi Program Sosialisasi dan Pembinaan SOP', '- Pengesahan SOP sebelum diberlakukan
- Konfirmasi BP BUMD atas SOP yang relevan
- Cakupan sosialisasi sebelum SOP diberlakukan
- Tingkat kelulusan evaluasi pemahaman', v_pic_id, NULL, 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'SOP proses bisnis disahkan Direksi (Ya/ Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase divisi yang mendapat sosialisasi sebelum SOP diberlakukan (target: 100%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase pemilik proses yang lulus evaluasi pemahaman (target: ≥ 90%)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Mengevaluasi efektivitas SOP dan matriks approval  dan melakukan continuous improvement agar proses tetap relevan, efektif, dan mendukung kebutuhan scale-up organisasi', '3.C.5.', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menjalankan evaluasi berkala atas efektivitas SOP yang diterapkan dan matriks approval — mengukur apakah proses yang diperbarui benar-benar meningkatkan kecepatan eksekusi peran CMD dibanding kondisi eksisting sebelum pembaruan.', '3.C.5..1', 100, 'Laporan Evaluasi Berkala Efektivitas SOP CMD (tahunan) yang memuat:
- Tingkat kepatuhan implementasi per divisi
- Perubahan waktu siklus aktual vs kondisi eksisting (sebelum pembaruan)
- Penurunan eskalasi ad-hoc
- Rekomendasi revisi SOP yang diperlukan', '- Persentase divisi yang menerapkan SOP sesuai standar
- Penurunan waktu siklus vs kondisi eksisting', v_pic_id, NULL, 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase divisi yang menerapkan SOP CMD sesuai standar (target: ≥ 90%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Penurunan rata-rata waktu siklus vs kondisi eksisting sebelum pembaruan (target: ≥ X%)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Memperbarui dan mengesahkan revisi SOP atau matriks approval  untuk memastikan SOP dan matriks approval selalu update dan berjalan sesuai dengan perkembangan Jakpro', '3.C.5..2', 100, 'Revisi SOP atau matriks approval, yang berisi:
- Kondisi as-is dan to-be
- Asesmen dampak perubahan', '- Dampak revisi SOP atau matriks approval', v_pic_id, NULL, 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Revisi SOP disahkan oleh Direksi dan pihak terkait (Ya/ Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase dampak perubahan SOP atau matriks approval terhadap efektivitas dan efisiensi proses bisnis (%)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Aspect
    INSERT INTO aspects (company_id, name, target_percentage)
    VALUES (v_company_id, 'Penguatan Organisasi dan Tata Kelola', 100)
    RETURNING id INTO v_aspect_id;

    -- Strategy
    INSERT INTO strategies (aspect_id, name, code_order, target_percentage)
    VALUES (v_aspect_id, 'Mengalihkan peran korporasi dari eksekutor menjadi pengelola portofolio strategis melalui penataan struktur dan organisasi berbasis kluster bisnis', 'A.', 100)
    RETURNING id INTO v_strategy_id;

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Mendefinisikan model operasional perusahaan strategic holding dan pembagian peran holding vs anak usaha secara eksplisit', '4.A.1', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melakukan aspiration gathering kepada Bappeda sebagai City Master Developer Jakarta untuk menyatukan arahan dan peran strategis untuk masing-masing pihak', '4.A.1.1', 100, 'Dokumen Aspirasi dan Arah Pengembangan City Master Developer Jakarta yang memuat:
- Ringkasan hasil minimal X sesi FGD dengan Bappeda (contoh: 3 sesi FGD)
- Peta prioritas kawasan dan sektor (TOD, properti strategis, infrastruktur kota, dll.)
- Pembagian peran strategis antara Jakpro dan Bappeda
- Daftar ekspektasi peran Jakpro sebagai holding vs entitas pelaksana
- Implikasi kebijakan terhadap portofolio bisnis Jakpro', 'Tingkat eksplisitnya arahan peran Jakpro.', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Minimal X FGD resmi dengan Bappeda terdokumentasi (contoh: 3 jumlah FGD, target: 100% tercapai)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Dokumen aspirasi yang telah disahkan', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyusun kajian peluang serta melakukan pemetaan potensi bisnis City Master Developer', '4.A.1.2', 100, 'Laporan Kajian Peluang Bisnis City Master Developer Jakarta berisi:
- Daftar peluang bisnis terkurasi
- Analisis kelayakan awal (strategic fit, estimasi IRR, risiko utama)
- Peta lokasi/kawasan potensial
- Klasifikasi peluang (contoh: invest, co-invest, dll.)', '- Kedalaman analisis finansial dan strategis
- Jumlah peluang yang dianalisis secara komparatif dan berbasis data ', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Kajian peluang telah tersedia (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Jumlah peluang bisnis tervalidasi awal', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Peluang memiliki estimasi finansial kasar (range IRR & CAPEX) (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Peluang terpetakan ke dalam kluster bisnis Jakpro', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melakukan rekonsiliasi antara peluang bisnis yang teridentifikasi dengan kapabilitas Jakpro', '4.A.1.3', 100, 'Matriks Business Opportunity-Capability Fit Jakpro yang memetakan setiap peluang terhadap kapabilitas inti Jakpro (keuangan, asset base, SDM, tata kelola, dll.), lengkap dengan rekomendasi: direct holding role, subsidiary execution, atau strategic partnership.', 'Objektivitas penilaian kapabilitas dan kejelasan rekomendasi.', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Matriks Business Opportunity tersedia (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'X% peluang bisnis memiliki penilaian capability-fit', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, '≥ X% peluang dikategorikan “layak dijalankan” dengan skema holding/anak usaha yang jelas', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Memastikan keselarasan dengan dukungan legislatif dan eksekutif untuk menjamin ketercapaian implementasi', '4.A.1.4', 100, 'Dokumen “Policy & Stakeholder Alignment” yang mencakup:
- Policy brief untuk DPRD dan Pemprov
- Daftar regulasi yang perlu diterbitkan/diubah
- Peta pemangku kepentingan dan strategi engagement
- Notulen dan surat dukungan formal', '- Kejelasan implikasi kebijakan dan kekuatan legitimasi dukungan
- Jumlah institusi kunci yang memberikan persetujuan atau dukungan tertulis', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Policy brief resmi disampaikan ke DPRD dan Pemprov (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Surat dukungan formal (eksekutif/legislatif) diperoleh', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, '0 blocker regulasi kritis sebelum implementasi model strategic holding', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mendefinisikan model operasional target Jakpro sebagai perusahaan strategic holding, mencakup: prinsip-prinsip perusahaan strategic holding, fungsi-fungsi yang tetap berada di holding vs yang didelegasikan ke anak usaha, dan cara perusahaan holding menciptakan nilai tanpa menjalankan operasional langsung', '4.A.1.5', 100, 'Dokumen Operating Model Target Perusahaan Strategic Holding Jakpro yang memuat:
- Definisi perusahaan Strategic Holding dalam konteks Jakpro
- Fungsi-fungsi yang menjadi domain perusahaan strategic holding vs domain anak usaha
- Cara perusahaan strategic holding menciptakan nilai untuk grup secara keseluruhan', '- Kejelasan dan kelengkapan model operasional target
- Penerimaan model oleh Direksi dan BP BUMD', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Model operasional target disetujui Direksi dan BP BUMD (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Waktu penyusunan (target: selesai Q3', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Memetakan secara eksplisit pembagian fungsi perusahaan holding vs anak usaha untuk setiap domain utama: perencanaan strategis, pengelolaan aset, keuangan dan investasi, SDM, tata kelola, dan operasional bisnis', '4.A.1.6', 100, 'Matriks Pembagian Fungsi Perusahaan Holding vs Anak Usaha yang memuat per domain:
- Fungsi yang menjadi tanggung jawab perusahaan holding
- Fungsi yang didelegasikan ke anak usaha
- Fungsi yang bersifat bersama (perusahaan holding dan anak usaha berkolaborasi)
- Klausul pengecualian untuk aset penugasan atau kondisi khusus

Penegasan peran perusahaan holding sebagai berikut:
- Menentukan arah gerak bisnis Jakpro Group secara keseluruhan, termasuk penetapan strategi portofolio dan pemberian arahan strategis kepada klaster bisnis dan anak usaha
- Memastikan anak usaha siap menjalankan aktivitas bisnis serta mencapai rights to play dan rights to win, termasuk kesiapan kapabilitas SDM, struktur organisasi, tata kelola, dan model bisnis
- Mengelola strategi komersialisasi Jakpro Group, termasuk strategi monetisasi aset dan peluang bisnis lintas klaster
- Menyusun strategi SDM untuk level holding', '- Kelengkapan pembagian tanggung jawab per domain fungsi
- Penerimaan matriks oleh BP BUMD', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase domain fungsi yang memiliki pembagian tanggung jawab yang eksplisit dan tidak ambigu (target: 100%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Matriks pembagian fungsi dikonfirmasi BP BUMD (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Menyusun roadmap transisi organisasi dari perusahaan induk operasional ke perusahaan Strategic Holding beserta mekanisme tata kelola transisi', '4.A.2', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyusun roadmap transisi korporasi yang menjabarkan perubahan struktural secara bertahap, mencakup: fungsi yang pertama kali dialihkan ke anak usaha, fungsi yang diperkuat di perusahaan induk, dan jadwal per tahapan perubahan', '4.A.2.1', 100, 'Roadmap Transisi korporasi Jakpro ke Perusahaan Strategic Holding yang memuat:
- Tahapan transisi beserta perubahan struktural per tahap
- Jadwal per tahap
- Fungsi yang dipindahkan ke anak usaha per tahap
- Fungsi yang diperkuat di perusahaan induk per tahap
- Titik keputusan yang memerlukan persetujuan Pemprov/BP BUMD', '- Kelengkapan roadmap transisi
- Penerimaan roadmap oleh Direksi dan BP BUMD', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Roadmap transisi korporasi disetujui Direksi dan BP BUMD (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Seluruh tahapan transisi memiliki jadwal yang terdokumentasi (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melakukan update Rencana Bisnis Jangka Panjang Perusahaan (RBJPP)', '4.A.2.2', 100, 'Dokumen RBJPP Revisi, dengan cakupan:
a. Penyesuaian visi, misi, dan arah strategis perusahaan induk sebagai Strategic Holding 
b. Pemutakhiran peran dan fungsi perusahaan induk vs anak usaha, termasuk: 
- Fungsi strategis yang dipertahankan/diperkuat di holding (mis. strategi korporasi, investasi, manajemen portofolio, governance).
- Fungsi operasional yang dialihkan ke anak usaha.
c. Revisi strategi pertumbuhan jangka panjang, termasuk:
- Strategi pengelolaan portofolio anak usaha.
- Strategi sinergi antar entitas grup.
d. Penyesuaian proyeksi keuangan jangka panjang (laba, arus kas, kebutuhan investasi) yang mencerminkan model Strategic Holding.
e. Integrasi roadmap transisi organisasi ke dalam milestone RBJPP (timeline 5-10 tahun).
f. Identifikasi risiko strategis utama pasca-transisi dan mitigasinya.', '- RBJPP Revisi yang konsisten dengan arah kebijakan transformasi menjadi Strategic Holding
- Memiliki asumsi strategis dan keuangan yang jelas, terdokumentasi, dan dapat ditelusuri
- Dokumen memenuhi standar regulasi dan praktik tata kelola BUMD', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Dokumen RBJPP Revisi 100% selesai dan disetujui secara formal paling lambat (tanggal/bulan/tahun tertentu)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menetapkan mekanisme tata kelola transisi yang memastikan: (a) eksekusi roadmap dipantau oleh PMO, (b) setiap perubahan struktural yang material melalui proses persetujuan yang jelas sebelum dieksekusi, dan (c) ada mekanisme mundur jika perubahan menimbulkan masalah yang tidak diantisipasi', '4.A.2.3', 100, 'Mekanisme Tata Kelola Transisi Korporasi yang memuat:
- Pihak yang memantau progres roadmap transisi
- Proses persetujuan untuk setiap perubahan struktural material
- Kriteria keberhasilan per tahapan transisi
- Kondisi yang memicu peninjauan ulang atau mundur', '- Kelengkapan mekanisme tata kelola transisi
- Pengesahan mekanisme oleh Direksi', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Mekanisme tata kelola transisi disahkan Direksi (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Seluruh komponen mekanisme terdefinisi secara konkret (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Mengeksekusi perubahan struktural perusahaan induk secara bertahap sesuai roadmap', '4.A.3', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengeksekusi perubahan struktural sesuai urutan roadmap, mencakup pembentukan atau penguatan fungsi-fungsi baru yang diperlukan oleh perusahaan induk, penetapan mandat entitas anak usaha yang lebih jelas, dan pemisahan tanggung jawab operasional dari level perusahaan induk ke anak usaha secara bertahap', '4.A.3.1', 100, 'Laporan Pelaksanaan Perubahan Struktural per tahap roadmap yang memuat:
- Perubahan yang dieksekusi
- Tanggal berlaku
- Dampak terhadap unit kerja yang terdampak
- Hambatan yang muncul selama eksekusi dan cara penyelesaiannya', '- Persentase tahapan roadmap transisi yang berhasil dieksekusi sesuai jadwal
- Kelancaran perubahan struktural tanpa gangguan operasional', v_pic_id, '2030-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase tahapan roadmap transisi yang berhasil dieksekusi sesuai jadwal (target: ≥ 80%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Jumlah gangguan operasional yang timbul akibat perubahan struktural (target: 0 gangguan material)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menetapkan mandat entitas yang jelas untuk setiap anak usaha Jakpro dalam Daftar Mandat Entitas (Setiap anak usaha akan bertanggung jawab menjalankan lini bisnis apa) beserta KPI utama yang mencerminkan mandat tersebut. Daftar ini diperbarui setiap kali ada perubahan peran atau penambahan entitas', '4.A.3.2', 100, 'Daftar Mandat Entitas Jakpro Grup (diperbarui secara berkala jika diperlukan) yang memuat per entitas anak usaha:
- Nama entitas dan bidang usaha
- Mandat strategis yang ditetapkan perusahaan induk kepada anak usaha
- Batasan kewenangan entitas anak vs perusahaan induk
- KPI utama yang mencerminkan mandat
- Tanggal pembaruan terakhir', '- Kelengkapan mandat entitas per anak usaha
- Keselarasan KPI utama dengan mandat strategis
- Penerimaan Daftar Mandat Entitas oleh Direksi dan BP BUMD', v_pic_id, '2030-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase entitas anak usaha yang memiliki mandat terdokumentasi dalam Daftar Mandat Entitas (target: 100%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Daftar Mandat Entitas disetujui Direksi dan BP BUMD (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'KPI utama per entitas mencerminkan mandat strategis (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengeksekusi perubahan desain struktur organisasi korporat Jakpro sesuai model Strategic Holding: memperkuat fungsi-fungsi yang menjadi inti peran Strategic Holding (manajemen portofolio, pengawasan kinerja anak usaha, alokasi modal, tata kelola grup) dan memindahkan fungsi-fungsi operasional ke anak usaha yang relevan', '4.A.3.3', 100, 'Desain Struktur Organisasi Jakpro sebagai Strategic Holding yang memuat:
- Struktur baru yang mencerminkan fungsi Strategic Holding
- Fungsi yang diperkuat di korporat (beserta justifikasi)
- Fungsi yang dipindahkan ke anak usaha (beserta justifikasi)
- Referensi ke profil SDM dari program redeployment 2-C', '- Kesesuaian struktur baru dengan model Strategic Holding
- Konsistensi dengan program redeployment SDM dari 2-C', v_pic_id, '2030-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Desain struktur organisasi baru disetujui Direksi (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Konsistensi dengan profil SDM dari program redeployment 2-C terkonfirmasi (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Menyesuaikan sistem insentif dan KPI untuk seluruh entitas agar selaras dengan peran perusahaan Strategic Holding', '4.A.4', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Merancang kerangka KPI perusahaan induk yang mencerminkan peran strategisnya: mencakup KPI nilai grup, KPI pengawasan anak usaha (kepatuhan terhadap mandat, kualitas tata kelola), dan KPI transformasi (pencapaian tonggak roadmap)', '4.A.4.1', 100, 'Kerangka KPI Perusahaan Strategic Holding Jakpro yang memuat:
- KPI nilai grup beserta formula dan sumber data
- KPI pengawasan anak usaha beserta metode pengukuran
- KPI transformasi beserta target dan jadwal
- Mekanisme kaskade ke level di bawahnya', '- Kesesuaian KPI dengan peran perusahaan Strategic Holding
- Keselarasan kerangka KPI dengan sistem KPI BP BUMD', v_pic_id, '2028-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Kerangka KPI perusahaan induk disetujui Direksi (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Kerangka KPI perusahaan induk dikonfirmasi selaras dengan sistem KPI BP BUMD (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Memperbarui Daftar KPI seluruh entitas Jakpro Grup untuk memastikan setiap entitas memiliki KPI yang konsisten dengan mandatnya, mendukung tujuan grup, dan mendorong kolaborasi antar entitas', '4.A.4.2', 100, 'Daftar KPI seluruh entitas Jakpro Grup yang diperbarui yang memuat per entitas:
- Daftar KPI dengan formula dan target per periode
- Pemetaan antara KPI entitas dan KPI perusahaan induk yang didukung
- KPI kolaborasi antar entitas (jika ada)', '- Kelengkapan pembaruan KPI seluruh entitas
- Keselarasan KPI entitas dengan model perusahaan Strategic Holding', v_pic_id, '2028-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase entitas yang memiliki KPI yang telah diperbarui dan selaras dengan model perusahaan Strategic Holding (target: 100%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Daftar KPI seluruh entitas disetujui Direksi (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Mengimplementasikan tata kelola grup termasuk mekanisme pengawasan anak usaha oleh perusahaan induk', '4.A.5', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menetapkan Kerangka Tata Kelola Grup yang mengatur: frekuensi dan format pelaporan anak usaha ke perusahaan induk, mekanisme persetujuan perusahaan induk atas keputusan material anak usaha, mekanisme eskalasi dari anak usaha ke perusahaan induk, dan forum pengawasan berkala', '4.A.5.1', 100, 'Kerangka Tata Kelola Grup Jakpro yang memuat:
- Mekanisme dan format pelaporan anak usaha ke perusahaan induk (bulanan/triwulanan/tahunan)
- Nilai ambang keputusan anak usaha yang memerlukan persetujuan perusahaan induk
- Mekanisme dan format pelaporan perusahaan induk ke BP BUMD
- Forum pengawasan berkala beserta agenda dan peserta standar
- Jalur eskalasi dari anak usaha ke perusahaan induk ke BP BUMD', '- Kelengkapan kerangka tata kelola grup
- Integrasi format pelaporan ke BP BUMD dengan format pelaporan internal Jakpro
- Penerimaan kerangka oleh Direksi dan BP BUMD', v_pic_id, NULL, 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Kerangka Tata Kelola Grup disetujui Direksi dan dikonfirmasi BP BUMD (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Format pelaporan ke BP BUMD terintegrasi dengan format pelaporan internal (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Rata-rata waktu respons perusahaan induk atas permintaan persetujuan anak usaha (target: ≤ X hari kerja)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengimplementasikan forum pengawasan berkala (Rapat Koordinasi Direksi Perusahaan Induk-Anak Usaha, Forum Tinjauan Kinerja) dan memastikan setiap forum menghasilkan keputusan atau tindak lanjut yang konkret', '4.A.5.2', 100, 'Dokumentasi Forum Pengawasan Berkala (notulen per forum) yang memuat:
- Peserta dan tingkat kehadiran
- Agenda yang dibahas
- Keputusan dan tindak lanjut yang disepakati
- Status tindak lanjut dari forum sebelumnya', '- Keterlaksanaan forum pengawasan sesuai jadwal
- Tingkat penyelesaian tindak lanjut dari forum sebelumnya', v_pic_id, NULL, 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Frekuensi forum pengawasan yang terlaksana sesuai jadwal (target: 100%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Tingkat penyelesaian tindak lanjut dari forum sebelumnya (target: ≥ 80%)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Menyesuaikan struktur pendanaan dan alokasi modal sesuai model perusahaan Strategic Holding', '4.A.6.', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menetapkan kebijakan alokasi modal grup Jakpro yang mendefinisikan: prinsip alokasi modal ke anak usaha berdasarkan empat lini bisnis target, mekanisme dan kriteria untuk investasi baru di anak usaha menggunakan kerangka evaluasi dari Strategi 2-B, dan cara korporat memutuskan prioritas jika terjadi persaingan kebutuhan modal antar entitas', '4.A.6..1', 100, 'Kebijakan Alokasi Modal Grup Jakpro yang memuat:
- Prinsip alokasi modal ke empat lini bisnis target
- Mekanisme dan kriteria investasi di anak usaha (menggunakan kerangka evaluasi 2-B)
- Mekanisme penetapan prioritas jika terjadi persaingan modal
- Batasan yang selaras dengan ketentuan penggunaan PMD', '- Kelengkapan kebijakan alokasi modal grup
- Kewajiban penggunaan kerangka evaluasi investasi dalam kebijakan seperti yang ditetapkan dalam strategi 2B', v_pic_id, '2028-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Kebijakan alokasi modal grup disetujui Direksi dan BP BUMD (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Kebijakan mewajibkan penggunaan kerangka evaluasi investasi dari 2-B (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menelaah dan menyesuaikan struktur pendanaan setiap entitas agar selaras dengan peran dan mandatnya dalam model perusahaan Strategic Holding dan City Master Developer, termasuk mengidentifikasi entitas yang pendanaannya relatif lebih banyak relatif terhadap kebutuhannya atau yang memerlukan restrukturisasi pendanaan', '4.A.6..2', 100, 'Laporan Penelaahan Struktur Pendanaan Seluruh Entitas Jakpro Grup yang memuat per entitas:
- Kondisi pendanaan eksisting vs kebutuhan berdasarkan mandat
- Rekomendasi penyesuaian
- Rencana implementasi', '- Kelengkapan penelaahan struktur pendanaan per entitas
- Konkretnya rekomendasi penyesuaian yang dihasilkan', v_pic_id, '2028-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase entitas yang memiliki struktur pendanaan yang selaras dengan mandatnya berdasarkan penelaahan (target: 100%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Penelaahan menghasilkan rekomendasi konkret yang berbeda dari kondisi eksisting (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Mengevaluasi efektivitas transisi perusahaan Jakpro secara berkala dan memperbarui Daftar Mandat Entitas serta Daftar KPI', '4.A.7.', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melaksanakan evaluasi komprehensif atas progres dan efektivitas transisi ke perusahaan Strategic Holding, mencakup: kemajuan roadmap vs rencana, perubahan nyata dalam cara perusahaan induk berinteraksi dengan anak usaha, peningkatan kualitas pengawasan, dan hambatan yang belum terselesaikan', '4.A.7..1', 100, 'Laporan Evaluasi Efektivitas Transisi Perusahaan Strategic Holding (tahunan) yang memuat:
a. Persentase tonggak roadmap yang berhasil dieksekusi vs rencana
b. Perubahan nyata dalam kualitas pengawasan anak usaha
c. Efisiensi alokasi modal
d. Hambatan yang memerlukan penyesuaian roadmap
e. Hasil analisis akar permasalahan (Root Cause Analysis/RCA) awal, yang disusun berdasarkan:
- Kajian kinerja, tata kelola, dan operasional dari Laporan Tahunan (Annual Report) periode 3–5 tahun terakhir.
- Identifikasi isu strategis non‑finansial dan finansial yang secara material menghambat pertumbuhan dan keberlanjutan perusahaan dan anak usaha
f. Penetapan strategic objectives anak usaha sebagai turunan langsung dari strategic objectives holding dalam mendukung pencapaian tujuan korporasi
g. Keselarasan KPI korporasi anak usaha dan holding untuk mengatasi bottleneack lintas divisi dan anak usaha ', '- Penggunaan kondisi awal yang jelas sebagai pembanding evaluasi
- Persentase tonggak roadmap yang berhasil dieksekusi sesuai jadwal', v_pic_id, '2030-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Laporan evaluasi efektivitas transisi disetujui Direksi (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase tonggak roadmap yang berhasil dieksekusi sesuai jadwal (target: ≥ 80%)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyusun rekomendasi penyesuaian roadmap, model operasional, atau mekanisme tata kelola berdasarkan hasil evaluasi dan memastikan penyesuaian tersebut mendapatkan persetujuan yang diperlukan sebelum dieksekusi', '4.A.7..2', 100, 'Dokumen Rekomendasi Penyesuaian roadmap/Model Operasional/Tata Kelola yang memuat:
- Temuan evaluasi yang menjadi dasar rekomendasi
- Perubahan yang direkomendasikan
- Dampak terhadap jadwal dan sumber daya
- Persetujuan yang diperlukan', '- Relevansi rekomendasi dengan temuan evaluasi
- Tingkat implementasi rekomendasi setelah disetujui', v_pic_id, '2030-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Rekomendasi penyesuaian disetujui oleh pihak yang berwenang (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase rekomendasi penyesuaian yang dieksekusi setelah disetujui (target: ≥ 90%)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Memperbarui Daftar Mandat Entitas dan Daftar KPI setiap kali terjadi: perubahan mandat entitas akibat roadmap transisi, penambahan atau penonaktifan entitas, revisi KPI berdasarkan hasil evaluasi, atau perubahan bobot/target KPI', '4.A.7..3', 100, '- Daftar Mandat Entitas versi terbaru
- Daftar KPI seluruh entitas versi terbaru
Keduanya dilengkapi catatan perubahan yang mendokumentasikan setiap perubahan beserta alasan dan tanggal berlakunya', '- Ketepatan waktu pembaruan kedua daftar setelah setiap keputusan yang relevan
- Kelengkapan catatan perubahan', v_pic_id, NULL, 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase pembaruan Daftar Mandat Entitas dan Daftar KPI dalam ≤ 10 hari kerja setelah keputusan yang relevan (target: 100%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Catatan perubahan tersedia dan terdokumentasi (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Strategy
    INSERT INTO strategies (aspect_id, name, code_order, target_percentage)
    VALUES (v_aspect_id, 'Menetapkan mekanisme pengelolaan stakeholder yang terstruktur melalui single point of contact  dan forum koordinasi berkala', 'B.', 100)
    RETURNING id INTO v_strategy_id;

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Memetakan pemangku kepentingan strategis Jakpro beserta profil kepentingan dan isu yang perlu dikelola', '4.B.1', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melakukan identifikasi dan klasifikasi seluruh pemangku kepentingan strategis Jakpro (seperti Gubernur, DPRD, OPD, BP BUMD, komunitas, investor, mitra bisnis, media) berdasarkan tingkat pengaruh, tingkat keterlibatan yang diinginkan, dan risiko jika hubungan tidak dikelola dengan baik', '4.B.1.1', 100, 'Peta Pemangku Kepentingan Strategis Jakpro (diperbarui secara berkala) yang memuat per pemangku kepentingan:
- Identitas dan peran
- Tingkat pengaruh terhadap Jakpro
- Tingkat kepentingan pada Jakpro
- Harapan utama terhadap Jakpro
- Risiko jika hubungan tidak dikelola
- PIC di Jakpro yang mengelola hubungan

Contoh Klasifikasi:
- High power high interest: Pak Gubernur, Pak Wagub, Sekda, Asisten Perekonomian, Asisten Pembangunan, DPRD (ketua & wakil ketua, komisi B & C), BP BUMD, BPKD, Bappenda, Bappeda, BPAD, Dishub, Dinas Kebudayaan (DLH), Dinas Ciptaka, Dispora, DBM, Investor strategis dan kreditur
- High power low interest: BPK, BPKP, Inspektorat, Kejati, Kementerian2 yang relevan, dan regulator sektor yang relevan
- Low power high interest: NGO, komunitas-komunitas, masyarakat terdampak, akademisi & pakar, media massa,
- Low power low interest: Masyarakat umum', '- Kelengkapan cakupan pemangku kepentingan yang teridentifikasi
- Penerimaan Peta Pemangku Kepentingan oleh Direksi', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Peta Pemangku Kepentingan Strategis disetujui Direksi (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Jumlah pemangku kepentingan yang teridentifikasi namun belum pernah masuk dalam radar manajemen Jakpro sebelumnya', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melakukan analisis akar masalah atas inisiatif-inisiatif Jakpro yang telah direncanakan selama beberapa tahun terakhir namun belum terlaksana karena ketergantungan pada pihak eksternal, mengidentifikasi pola hambatan komunikasi dan kelompok pemangku kepentingan mana yang paling sering menjadi titik kemacetan.', '4.B.1.2', 100, 'Laporan Analisis Akar Masalah Hambatan Inisiatif Jakpro yang memuat:
- Daftar inisiatif yang terhambat beserta durasi keterhambatan
- Identifikasi kelompok pemangku kepentingan yang menjadi titik kemacetan per inisiatif
- Pola hambatan komunikasi yang teridentifikasi
- Rekomendasi prioritas hubungan yang harus diperbaiki terlebih dahulu', '- Kelengkapan analisis akar masalah per inisiatif yang terhambat
- Kejelasan pola hambatan komunikasi yang teridentifikasi', v_pic_id, '2027-03-31', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Seluruh inisiatif yang terhambat karena pihak eksternal teranalisis akar masalahnya (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Pola hambatan komunikasi terdokumentasi dan disetujui Direksi (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Menetapkan prinsip, model, dan struktur pengelolaan pemangku kepentingan termasuk penunjukan Single Point of Contact (SPOC) formal', '4.B.2', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menetapkan struktur Satu Pintu Komunikasi yang mendefinisikan: siapa yang menjadi titik kontak tunggal untuk setiap kelompok pemangku kepentingan utama, batasan tanggung jawab, mekanisme penerusan pertanyaan atau isu ke divisi yang relevan, dan standar waktu respons per kategori isu', '4.B.2.1', 100, 'Dokumen Struktur Satu Pintu Komunikasi Jakpro yang memuat per kelompok pemangku kepentingan:
- Nama dan jabatan penanggungjawab komunikasi Jakpro
- Pengganti jika penanggungjawab utama tidak tersedia
- Batasan tanggung jawab penanggungjawab komunikasi
- Mekanisme penerusan ke divisi yang relevan
- Standar waktu respons per kategori isu 

*Contoh Alur Penanggung Jawab Komunikasi per Kelompok Pemangku Kepentingan:
- Pemerintah Daerah dan Regulator = Corporate Secretary (Corsec)
- Investor dan Lembaga Pembiayaan = Divisi 
- Accounting, Tax, dan Investment
- Mitra Bisnis Strategis = Divisi Business Development
- Mitra Bisnis Operasional = SBU Office terkait
- Media (low power, high interest) = Corporate Secretary 
- Media (low power, low interest) = SBU pemilik venue', '- Kelengkapan struktur Satu Pintu Komunikasi
- Kesesuaian standar waktu respons dengan kapasitas aktual
- Pengkomunikasian struktur ke seluruh pemangku kepentingan utama', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Struktur Satu Pintu Komunikasi disahkan Direksi dan dikomunikasikan ke seluruh pemangku kepentingan utama (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase pertanyaan yang diselesaikan dalam standar waktu respons yang ditetapkan (target: ≥ 90%)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Mengembangkan protokol dan panduan komunikasi pemangku kepentingan yang memastikan konsistensi pesan dan profesionalisme dalam setiap interaksi, termasuk panduan untuk situasi krisis atau isu sensitif', '4.B.2.2', 100, 'Protokol Komunikasi Pemangku Kepentingan yang memuat:
- Panduan umum komunikasi (prinsip-prinsip yang selalu diikuti)
- Panduan komunikasi per saluran (tatap muka, tertulis, media)
- Panduan komunikasi krisis (siapa yang berbicara, batasan pesan, kapan eskalasi)', '- Kelengkapan panduan komunikasi per saluran dan per situasi
- Pengujian protokol komunikasi krisis sebelum diberlakukan', v_pic_id, '2027-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Protokol komunikasi pemangku kepentingan disahkan Direksi (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase tim yang berinteraksi dengan pemangku kepentingan yang telah menerima pengenalan atas protokol komunikasi (target: 100%)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Membangun dan mengoperasionalkan forum koordinasi berkala beserta mekanisme eskalasi isu strategis', '4.B.3', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Menyusun Rencana Keterlibatan Pemangku Kepentingan Tahunan yang mencakup: kalender keterlibatan, format interaksi yang tepat per kelompok, tema kunci yang ingin dikomunikasikan, dan mekanisme pengumpulan umpan balik', '4.B.3.1', 100, 'Rencana Keterlibatan Pemangku Kepentingan Tahunan Jakpro yang memuat:
- Kalender keterlibatan (siapa, kapan, format apa, tema apa)
- Mekanisme pengumpulan umpan balik dari pemangku kepentingan
- Alokasi sumber daya untuk keterlibatan
- Mekanisme pembaruan rencana jika terjadi perubahan dinamika pemangku kepentingan
- Penetapan tema komunikasi utama per triwulan, yang diselaraskan dengan prioritas strategis perusahaan, dinamika proyek, dan isu kunci pemangku kepentingan pada masing-masing periode', '- Sifat proaktif program keterlibatan
- Persentase keterlibatan dalam rencana yang terlaksana sesuai jadwal', v_pic_id, '2028-06-30', 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Program keterlibatan bersifat proaktif (menjangkau pemangku kepentingan berdasarkan jadwal, bukan hanya saat ada keperluan) (Ya/Tidak)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase keterlibatan dalam rencana yang terlaksana sesuai jadwal (target: ≥ 85%)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melaksanakan keterlibatan berkala sesuai rencana, mendokumentasikan setiap interaksi penting, dan menganalisis umpan balik yang diterima untuk diintegrasikan dalam keputusan bisnis Jakpro', '4.B.3.2', 100, 'Rekap Pelaksanaan Keterlibatan Pemangku Kepentingan per triwulan yang memuat:
- Keterlibatan yang terlaksana vs yang direncanakan
- Ringkasan temuan umpan balik pemangku kepentingan
- Isu-isu yang muncul dari keterlibatan dan rencana tindak lanjut', '- Persentase keterlibatan yang terlaksana sesuai jadwal
- Persentase umpan balik yang ditindaklanjuti dalam keputusan bisnis', v_pic_id, NULL, 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase keterlibatan yang terlaksana sesuai jadwal (target: ≥ 85% dari yang direncanakan)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase umpan balik pemangku kepentingan yang ditindaklanjuti dalam keputusan bisnis (target: ≥ 70%)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Activity Group
    INSERT INTO activity_groups (strategy_id, name, code_order, target_percentage)
    VALUES (v_strategy_id, 'Mengevaluasi efektivitas mekanisme pengelolaan pemangku kepentingan dan memperbarui Peta Pemangku Kepentingan secara berkelanjutan', '4.B.4', 100)
    RETURNING id INTO v_ag_id;

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Melaksanakan evaluasi berkala atas kualitas hubungan dengan pemangku kepentingan utama menggunakan survei atau mekanisme umpan balik yang terstruktur dan memberikan gambaran yang objektif atas tingkat kepercayaan dan kepuasan', '4.B.4.1', 100, 'Laporan Evaluasi Kualitas Hubungan Pemangku Kepentingan (tahunan) yang memuat:
- Skor kepercayaan dan kepuasan per kelompok pemangku kepentingan
- Perubahan vs kondisi awal dan periode sebelumnya
- Faktor-faktor yang berkontribusi pada peningkatan atau penurunan
- Rekomendasi perbaikan yang konkret per segmen', '- Tingkat respons survei dari pemangku kepentingan utama
- Tren skor kepercayaan pemangku kepentingan', v_pic_id, NULL, 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Survei pemangku kepentingan tahunan terlaksana dengan tingkat respons yang representatif (target: ≥ 70% dari pemangku kepentingan utama memberikan respons)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Tren skor kepercayaan pemangku kepentingan (target: meningkat per periode evaluasi)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

    -- Action Plan
    INSERT INTO action_plans (activity_group_id, name, code_order, target_percentage, output, indicator, pic_user_id, target_end_date, status)
    VALUES (v_ag_id, 'Memperbarui Peta Pemangku Kepentingan secara berkala untuk mencerminkan: perubahan komposisi, pergeseran tingkat pengaruh atau kepentingan, perubahan harapan, serta pembelajaran dari evaluasi kualitas hubungan', '4.B.4.2', 100, 'Peta Pemangku Kepentingan versi terbaru dilengkapi catatan perubahan yang mendokumentasikan setiap perubahan (pemangku kepentingan baru, perubahan tingkat pengaruh/kepentingan, perubahan harapan) beserta tanggal dan alasan perubahan', '- Ketepatan waktu pembaruan Peta Pemangku Kepentingan
- Kelengkapan catatan perubahan', v_pic_id, NULL, 'belum mulai')
    RETURNING id INTO v_ap_id;
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Persentase pembaruan Peta Pemangku Kepentingan dalam ≤ 10 hari kerja setelah evaluasi atau kejadian signifikan (target: 100%)', 'belum mulai');
    INSERT INTO kpis (action_plan_id, name, status) VALUES (v_ap_id, 'Catatan perubahan tersedia dan terdokumentasi (Ya/Tidak)', 'belum mulai');
    INSERT INTO history_activities (action_plan_id, user_id, description)
    VALUES (v_ap_id, v_pic_id, 'Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)');

END $$;
