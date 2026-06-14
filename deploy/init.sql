--
-- PostgreSQL database dump
--

\restrict 6fPKUhQ474UCahA7grad8xQ5AvVKcHiPogPVAXrcM57XPzOWPfXXa0M9D3n2Lce

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: bpbumd
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO bpbumd;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: bpbumd
--

COMMENT ON SCHEMA public IS '';


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: bpbumd
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_updated_at() OWNER TO bpbumd;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: action_plans; Type: TABLE; Schema: public; Owner: bpbumd
--

CREATE TABLE public.action_plans (
    id bigint NOT NULL,
    activity_group_id bigint NOT NULL,
    pic_user_id bigint,
    name text NOT NULL,
    code_order character varying(50),
    status character varying(50) DEFAULT 'belum mulai'::character varying NOT NULL,
    weight numeric(5,2),
    progress_percentage numeric(5,2),
    target_percentage numeric(5,2),
    start_date date,
    end_date date,
    target_end_date date,
    output text,
    indicator text,
    is_blocked boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_action_plans_status CHECK (((status)::text = ANY ((ARRAY['belum mulai'::character varying, 'dalam progres'::character varying, 'selesai'::character varying, 'selesai terlambat'::character varying, 'terlambat'::character varying])::text[])))
);


ALTER TABLE public.action_plans OWNER TO bpbumd;

--
-- Name: action_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: bpbumd
--

CREATE SEQUENCE public.action_plans_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.action_plans_id_seq OWNER TO bpbumd;

--
-- Name: action_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bpbumd
--

ALTER SEQUENCE public.action_plans_id_seq OWNED BY public.action_plans.id;


--
-- Name: activity_groups; Type: TABLE; Schema: public; Owner: bpbumd
--

CREATE TABLE public.activity_groups (
    id bigint NOT NULL,
    strategy_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    code_order character varying(50),
    status character varying(50) DEFAULT 'belum mulai'::character varying NOT NULL,
    weight numeric(5,2),
    progress_percentage numeric(5,2),
    target_percentage numeric(5,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_activity_groups_status CHECK (((status)::text = ANY ((ARRAY['belum mulai'::character varying, 'dalam progres'::character varying, 'selesai'::character varying, 'selesai terlambat'::character varying, 'terlambat'::character varying])::text[])))
);


ALTER TABLE public.activity_groups OWNER TO bpbumd;

--
-- Name: activity_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: bpbumd
--

CREATE SEQUENCE public.activity_groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_groups_id_seq OWNER TO bpbumd;

--
-- Name: activity_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bpbumd
--

ALTER SEQUENCE public.activity_groups_id_seq OWNED BY public.activity_groups.id;


--
-- Name: aspects; Type: TABLE; Schema: public; Owner: bpbumd
--

CREATE TABLE public.aspects (
    id bigint NOT NULL,
    company_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    status character varying(50) DEFAULT 'belum mulai'::character varying NOT NULL,
    progress_percentage numeric(5,2),
    target_percentage numeric(5,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_aspects_status CHECK (((status)::text = ANY ((ARRAY['belum mulai'::character varying, 'dalam progres'::character varying, 'selesai'::character varying, 'selesai terlambat'::character varying, 'terlambat'::character varying])::text[])))
);


ALTER TABLE public.aspects OWNER TO bpbumd;

--
-- Name: aspects_id_seq; Type: SEQUENCE; Schema: public; Owner: bpbumd
--

CREATE SEQUENCE public.aspects_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.aspects_id_seq OWNER TO bpbumd;

--
-- Name: aspects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bpbumd
--

ALTER SEQUENCE public.aspects_id_seq OWNED BY public.aspects.id;


--
-- Name: companies; Type: TABLE; Schema: public; Owner: bpbumd
--

CREATE TABLE public.companies (
    id bigint NOT NULL,
    sector_id bigint,
    name character varying(255) NOT NULL,
    company_code integer,
    company_type character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    logo character varying(255),
    CONSTRAINT chk_companies_company_type CHECK (((company_type)::text = ANY ((ARRAY['bpbumd'::character varying, 'bumd'::character varying, 'lainnya'::character varying])::text[])))
);


ALTER TABLE public.companies OWNER TO bpbumd;

--
-- Name: companies_id_seq; Type: SEQUENCE; Schema: public; Owner: bpbumd
--

CREATE SEQUENCE public.companies_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.companies_id_seq OWNER TO bpbumd;

--
-- Name: companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bpbumd
--

ALTER SEQUENCE public.companies_id_seq OWNED BY public.companies.id;


--
-- Name: documents; Type: TABLE; Schema: public; Owner: bpbumd
--

CREATE TABLE public.documents (
    id bigint NOT NULL,
    action_plan_id bigint,
    sub_action_plan_id bigint,
    uploaded_by_user_id bigint,
    verified_by_user_id bigint,
    name character varying(255) NOT NULL,
    description text,
    original_file_name character varying(255),
    file_type character varying(50),
    file_size bigint,
    file_path text NOT NULL,
    status character varying(50) DEFAULT 'diunggah'::character varying NOT NULL,
    rejection_reason text,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    verified_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_documents_only_one_parent CHECK ((((action_plan_id IS NOT NULL) AND (sub_action_plan_id IS NULL)) OR ((action_plan_id IS NULL) AND (sub_action_plan_id IS NOT NULL)))),
    CONSTRAINT chk_documents_status CHECK (((status)::text = ANY ((ARRAY['draf'::character varying, 'diunggah'::character varying, 'terverifikasi'::character varying, 'ditolak'::character varying, 'diarsipkan'::character varying])::text[])))
);


ALTER TABLE public.documents OWNER TO bpbumd;

--
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: bpbumd
--

CREATE SEQUENCE public.documents_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_id_seq OWNER TO bpbumd;

--
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bpbumd
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- Name: history_activities; Type: TABLE; Schema: public; Owner: bpbumd
--

CREATE TABLE public.history_activities (
    id bigint NOT NULL,
    action_plan_id bigint,
    sub_action_plan_id bigint,
    user_id bigint,
    description text NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_history_activities_only_one_parent CHECK ((((action_plan_id IS NOT NULL) AND (sub_action_plan_id IS NULL)) OR ((action_plan_id IS NULL) AND (sub_action_plan_id IS NOT NULL))))
);


ALTER TABLE public.history_activities OWNER TO bpbumd;

--
-- Name: history_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: bpbumd
--

CREATE SEQUENCE public.history_activities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.history_activities_id_seq OWNER TO bpbumd;

--
-- Name: history_activities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bpbumd
--

ALTER SEQUENCE public.history_activities_id_seq OWNED BY public.history_activities.id;


--
-- Name: kpis; Type: TABLE; Schema: public; Owner: bpbumd
--

CREATE TABLE public.kpis (
    id bigint NOT NULL,
    action_plan_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    status character varying(50) DEFAULT 'belum mulai'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_kpis_status CHECK (((status)::text = ANY ((ARRAY['belum mulai'::character varying, 'dalam progres'::character varying, 'tercapai'::character varying, 'tidak tercapai'::character varying])::text[])))
);


ALTER TABLE public.kpis OWNER TO bpbumd;

--
-- Name: kpis_id_seq; Type: SEQUENCE; Schema: public; Owner: bpbumd
--

CREATE SEQUENCE public.kpis_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.kpis_id_seq OWNER TO bpbumd;

--
-- Name: kpis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bpbumd
--

ALTER SEQUENCE public.kpis_id_seq OWNED BY public.kpis.id;


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: bpbumd
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    filename character varying(255) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.migrations OWNER TO bpbumd;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: bpbumd
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO bpbumd;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bpbumd
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: sectors; Type: TABLE; Schema: public; Owner: bpbumd
--

CREATE TABLE public.sectors (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.sectors OWNER TO bpbumd;

--
-- Name: sectors_id_seq; Type: SEQUENCE; Schema: public; Owner: bpbumd
--

CREATE SEQUENCE public.sectors_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sectors_id_seq OWNER TO bpbumd;

--
-- Name: sectors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bpbumd
--

ALTER SEQUENCE public.sectors_id_seq OWNED BY public.sectors.id;


--
-- Name: strategies; Type: TABLE; Schema: public; Owner: bpbumd
--

CREATE TABLE public.strategies (
    id bigint NOT NULL,
    aspect_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    code_order character varying(50),
    status character varying(50) DEFAULT 'belum mulai'::character varying NOT NULL,
    weight numeric(5,2),
    progress_percentage numeric(5,2),
    target_percentage numeric(5,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_strategies_status CHECK (((status)::text = ANY ((ARRAY['belum mulai'::character varying, 'dalam progres'::character varying, 'selesai'::character varying, 'selesai terlambat'::character varying, 'terlambat'::character varying])::text[])))
);


ALTER TABLE public.strategies OWNER TO bpbumd;

--
-- Name: strategies_id_seq; Type: SEQUENCE; Schema: public; Owner: bpbumd
--

CREATE SEQUENCE public.strategies_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.strategies_id_seq OWNER TO bpbumd;

--
-- Name: strategies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bpbumd
--

ALTER SEQUENCE public.strategies_id_seq OWNED BY public.strategies.id;


--
-- Name: sub_action_plan_approvals; Type: TABLE; Schema: public; Owner: bpbumd
--

CREATE TABLE public.sub_action_plan_approvals (
    id bigint NOT NULL,
    sub_action_plan_id bigint NOT NULL,
    approver_user_id bigint NOT NULL,
    approval_order integer NOT NULL,
    status character varying(50) DEFAULT 'menunggu'::character varying NOT NULL,
    notes text,
    approved_at timestamp without time zone,
    rejected_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_sub_action_plan_approvals_order CHECK ((approval_order = ANY (ARRAY[1, 2]))),
    CONSTRAINT chk_sub_action_plan_approvals_status CHECK (((status)::text = ANY ((ARRAY['menunggu'::character varying, 'setujui'::character varying, 'tolak'::character varying])::text[])))
);


ALTER TABLE public.sub_action_plan_approvals OWNER TO bpbumd;

--
-- Name: sub_action_plan_approvals_id_seq; Type: SEQUENCE; Schema: public; Owner: bpbumd
--

CREATE SEQUENCE public.sub_action_plan_approvals_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sub_action_plan_approvals_id_seq OWNER TO bpbumd;

--
-- Name: sub_action_plan_approvals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bpbumd
--

ALTER SEQUENCE public.sub_action_plan_approvals_id_seq OWNED BY public.sub_action_plan_approvals.id;


--
-- Name: sub_action_plans; Type: TABLE; Schema: public; Owner: bpbumd
--

CREATE TABLE public.sub_action_plans (
    id bigint NOT NULL,
    action_plan_id bigint NOT NULL,
    pic_user_id bigint,
    submitted_by_user_id bigint,
    name text NOT NULL,
    status character varying(50) DEFAULT 'pengajuan'::character varying NOT NULL,
    submitted_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_sub_action_plans_status CHECK (((status)::text = ANY ((ARRAY['pengajuan'::character varying, 'verifikasi'::character varying, 'selesai'::character varying, 'terlambat'::character varying, 'ditolak'::character varying])::text[])))
);


ALTER TABLE public.sub_action_plans OWNER TO bpbumd;

--
-- Name: sub_action_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: bpbumd
--

CREATE SEQUENCE public.sub_action_plans_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sub_action_plans_id_seq OWNER TO bpbumd;

--
-- Name: sub_action_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bpbumd
--

ALTER SEQUENCE public.sub_action_plans_id_seq OWNED BY public.sub_action_plans.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: bpbumd
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    company_id bigint,
    username character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    "position" character varying(255),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_users_role CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'user'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO bpbumd;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: bpbumd
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO bpbumd;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bpbumd
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: action_plans id; Type: DEFAULT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.action_plans ALTER COLUMN id SET DEFAULT nextval('public.action_plans_id_seq'::regclass);


--
-- Name: activity_groups id; Type: DEFAULT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.activity_groups ALTER COLUMN id SET DEFAULT nextval('public.activity_groups_id_seq'::regclass);


--
-- Name: aspects id; Type: DEFAULT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.aspects ALTER COLUMN id SET DEFAULT nextval('public.aspects_id_seq'::regclass);


--
-- Name: companies id; Type: DEFAULT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.companies ALTER COLUMN id SET DEFAULT nextval('public.companies_id_seq'::regclass);


--
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- Name: history_activities id; Type: DEFAULT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.history_activities ALTER COLUMN id SET DEFAULT nextval('public.history_activities_id_seq'::regclass);


--
-- Name: kpis id; Type: DEFAULT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.kpis ALTER COLUMN id SET DEFAULT nextval('public.kpis_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: sectors id; Type: DEFAULT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.sectors ALTER COLUMN id SET DEFAULT nextval('public.sectors_id_seq'::regclass);


--
-- Name: strategies id; Type: DEFAULT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.strategies ALTER COLUMN id SET DEFAULT nextval('public.strategies_id_seq'::regclass);


--
-- Name: sub_action_plan_approvals id; Type: DEFAULT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.sub_action_plan_approvals ALTER COLUMN id SET DEFAULT nextval('public.sub_action_plan_approvals_id_seq'::regclass);


--
-- Name: sub_action_plans id; Type: DEFAULT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.sub_action_plans ALTER COLUMN id SET DEFAULT nextval('public.sub_action_plans_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: action_plans; Type: TABLE DATA; Schema: public; Owner: bpbumd
--

COPY public.action_plans (id, activity_group_id, pic_user_id, name, code_order, status, weight, progress_percentage, target_percentage, start_date, end_date, target_end_date, output, indicator, is_blocked, created_at, updated_at) FROM stdin;
6	3	\N	Menyediakan akses terhadap seluruh dokumen kajian dan studi pengalihan aset penugasan yang berada di sisi BP BUMD atau Pemprov, termasuk kajian terdahulu atas opsi pengalihan LRT Jakarta (Jika ada)	1.A.1.1	belum mulai	\N	\N	100.00	\N	\N	2026-06-20	Daftar Induk Aset Penugasan Jakpro yang memuat per aset:\nNama dan dasar hukum penugasan\nStatus eksisting\nRencana pengelolaan beserta justifikasi\nTonggak tahapan berikutnya dan target tanggal\nValuasi per aset (Cost Approach): nilai penggantian dan akumulasi penyusutan\nPIC\nTanggal pembaruan terakhir	Kelengkapan cakupan aset penugasan dalam Daftar Induk\nKetersediaan valuasi per aset menggunakan Cost Approach\nKesesuaian rencana pengelolaan dengan kondisi terkini per aset	f	2026-06-14 14:55:06.015748	2026-06-14 14:55:06.015748
7	3	\N	Menyediakan akses terhadap seluruh dokumen serah terima aset penugasan dan dokumen kondisi awal aset yang tersimpan di BPAD untuk keperluan rekonstruksi kondisi aset	1.A.1.2	belum mulai	\N	\N	100.00	\N	\N	2026-06-20	Dokumen Rangkuman Kondisi Aset Penugasan Eksisting Jakpro yang memuat per aset:\nKondisi awal: spesifikasi teknis, kondisi fisik, dan nilai pada saat penyerahan penugasan\nKondisi Terkini: kondisi fisik terkini, nilai buku, tingkat penyusutan, dan catatan kerusakan/pemeliharaan\nAnalisis kondisi awal vs terkini: investasi pemeliharaan yang telah dilakukan Jakpro\nImplikasi terhadap nilai transfer yang wajar	Kelengkapan rekonstruksi kondisi awal per aset\nKetersediaan data kondisi terkini yang terverifikasi\nKonsistensi data kondisi aset dengan laporan keuangan Jakpro	f	2026-06-14 14:55:06.015748	2026-06-14 14:55:06.015748
8	3	\N	Menerima dan memvalidasi Dokumen Rangkuman Kondisi Aset Penugasan Eksisting dari Jakpro serta mengkonfirmasi kesesuaian data dengan catatan aset yang tersimpan di BPAD	1.A.1.3	belum mulai	\N	\N	100.00	\N	\N	2026-06-20	Bukti Penyerahan Resmi Dokumen Rangkuman Kondisi Aset Penugasan Eksisting kepada BPAD yang memuat:\nTanda terima resmi dari BPAD\nKonfirmasi penerimaan dan validasi dari BPAD\nCatatan perbedaan data (jika ada) beserta resolusi yang disepakati	Kelengkapan dokumen yang diserahkan\nKonfirmasi penerimaan dan validasi oleh BPAD\nKetiadaan perbedaan material antara data Jakpro dan catatan BPAD	f	2026-06-14 14:55:06.015748	2026-06-14 14:55:06.015748
9	3	6	Memberikan klarifikasi atas posisi dan pertimbangan yang pernah menghambat eksekusi masing-masing opsi pengalihan LRT Jakarta dari sisi Pemprov dan BP BUMD	1.A.1.4	selesai	\N	100.00	100.00	2026-06-14	2026-06-14	2026-06-20	Dokumen Konsolidasi Kajian Pengalihan LRT Jakarta yang memuat per opsi:\nRingkasan opsi: (1) Transfer ke PT MRT Jakarta, (2) Pengurangan modal Pemprov DKI, (3) Pembentukan entitas / SPV baru\nStatus dan hambatan implementasi per opsi\nImplikasi fiskal dan hukum yang teridentifikasi\nCelah studi yang masih perlu diperdalam per opsi	Kelengkapan cakupan opsi yang pernah dikaji\nKejelasan hambatan dan celah studi per opsi	f	2026-06-14 14:55:06.015748	2026-06-14 15:19:46.847022
\.


--
-- Data for Name: activity_groups; Type: TABLE DATA; Schema: public; Owner: bpbumd
--

COPY public.activity_groups (id, strategy_id, name, code_order, status, weight, progress_percentage, target_percentage, created_at, updated_at) FROM stdin;
3	3	Mengonsolidasikan kajian eksisting atas seluruh opsi pengalihan aset penugasan dan menetapkan Daftar Induk Aset Penugasan sebagai acuan tunggal	1.A.1	selesai	\N	0.00	100.00	2026-06-14 14:55:06.015748	2026-06-14 15:19:46.847022
\.


--
-- Data for Name: aspects; Type: TABLE DATA; Schema: public; Owner: bpbumd
--

COPY public.aspects (id, company_id, name, status, progress_percentage, target_percentage, created_at, updated_at) FROM stdin;
3	3	Strategi Pendekatan Terhadap Fiskal dan Aset Penugasan	selesai	0.00	100.00	2026-06-14 14:55:06.015748	2026-06-14 15:19:46.847022
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: bpbumd
--

COPY public.companies (id, sector_id, name, company_code, company_type, created_at, updated_at, logo) FROM stdin;
1	\N	BPBUMD	100	bpbumd	2026-06-14 14:11:34.436263	2026-06-14 14:11:34.436263	\N
4	\N	Garuda Indonesia (Persero) Tbk	102	lainnya	2026-06-14 14:20:07.527521	2026-06-14 14:20:07.527521	\N
3	1	PT Jakarta Propertindo (Jakpro)	101	bumd	2026-06-14 14:20:07.527521	2026-06-14 14:21:45.876916	/uploads/logos/logo-1781446905871-700148811.png
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: bpbumd
--

COPY public.documents (id, action_plan_id, sub_action_plan_id, uploaded_by_user_id, verified_by_user_id, name, description, original_file_name, file_type, file_size, file_path, status, rejection_reason, uploaded_at, verified_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: history_activities; Type: TABLE DATA; Schema: public; Owner: bpbumd
--

COPY public.history_activities (id, action_plan_id, sub_action_plan_id, user_id, description, updated_at) FROM stdin;
9	6	\N	\N	Rencana Aksi dibuat secara otomatis oleh sistem	2026-06-14 14:55:06.015748
10	7	\N	\N	Rencana Aksi dibuat secara otomatis oleh sistem	2026-06-14 14:55:06.015748
11	8	\N	\N	Rencana Aksi dibuat secara otomatis oleh sistem	2026-06-14 14:55:06.015748
12	9	\N	6	Rencana Aksi dibuat dan di-assign ke Tito Hadi Dewan (VP Strategic Plan & Program)	2026-06-14 14:55:06.015748
13	9	\N	6	KPI "Ketiga opsi pengalihan LRT Jakarta terdokumentasi lengkap (Ya/Tidak)" diset menjadi "belum mulai"	2026-06-14 14:55:06.015748
14	9	\N	6	KPI "Setiap opsi memiliki uraian hambatan yang spesifik dan berbasis fakta (Ya/Tidak)" diset menjadi "belum mulai"	2026-06-14 14:55:06.015748
15	9	\N	6	Mengajukan sub rencana aksi baru: tes	2026-06-14 15:01:38.066997
16	9	\N	5	Menyetujui (Approver 1) sub rencana aksi: tes	2026-06-14 15:02:37.128196
17	9	\N	4	Menyetujui (Approver 2) sub rencana aksi: tes	2026-06-14 15:02:58.979774
18	9	\N	6	Mengajukan sub rencana aksi baru: tes2	2026-06-14 15:03:36.694287
19	9	\N	6	Mengajukan sub rencana aksi baru: tes3	2026-06-14 15:03:56.008204
20	9	\N	5	Menolak sub rencana aksi: tes2. Alasan: tes	2026-06-14 15:05:36.09123
21	9	\N	5	Menyetujui (Approver 1) sub rencana aksi: tes3	2026-06-14 15:05:38.845342
22	9	\N	4	Menolak sub rencana aksi: tes3. Alasan: tes	2026-06-14 15:14:03.077056
23	9	\N	6	Menghapus sub rencana aksi: tes3	2026-06-14 15:15:07.662049
24	9	\N	6	Mengajukan ulang sub rencana aksi: tes2	2026-06-14 15:15:11.532839
25	9	\N	6	Memperbarui sub rencana aksi: tes2	2026-06-14 15:16:00.524455
26	9	\N	6	Menghapus sub rencana aksi: tes2	2026-06-14 15:17:19.798141
27	9	\N	6	Mengajukan sub rencana aksi baru: tesd	2026-06-14 15:17:32.95318
28	9	\N	5	Menolak sub rencana aksi: tesd. Alasan: ds	2026-06-14 15:17:48.397232
29	9	\N	6	Mengajukan ulang sub rencana aksi: tesd	2026-06-14 15:19:26.892503
30	9	\N	6	Menghapus sub rencana aksi: tesd 2cdsjncjsdjncnjwcdnjkwe	2026-06-14 15:19:46.847022
31	9	\N	6	Mengunggah dokumen: 20260402_Pj Anatomy Phase I_Business Continuity Planning	2026-06-14 15:22:54.061467
32	9	\N	6	Menghapus dokumen: 20260402_Pj Anatomy Phase I_Business Continuity Planning	2026-06-14 15:23:23.497164
33	9	\N	6	Mengunggah dokumen: 20260402_Pj Anatomy Phase I_Business Continuity Planning	2026-06-14 15:24:24.038711
34	9	\N	6	Mengunggah dokumen: Screenshot 2026-06-11 at 2.24.37 PM	2026-06-14 15:24:30.654867
35	9	\N	6	Menghapus dokumen: 20260402_Pj Anatomy Phase I_Business Continuity Planning	2026-06-14 15:24:41.872768
36	9	\N	6	Menghapus dokumen: Screenshot 2026-06-11 at 2.24.37 PM	2026-06-14 15:24:45.510658
\.


--
-- Data for Name: kpis; Type: TABLE DATA; Schema: public; Owner: bpbumd
--

COPY public.kpis (id, action_plan_id, name, status, created_at, updated_at) FROM stdin;
3	9	Ketiga opsi pengalihan LRT Jakarta terdokumentasi lengkap (Ya/Tidak)	belum mulai	2026-06-14 14:55:06.015748	2026-06-14 14:55:06.015748
4	9	Setiap opsi memiliki uraian hambatan yang spesifik dan berbasis fakta (Ya/Tidak)	belum mulai	2026-06-14 14:55:06.015748	2026-06-14 14:55:06.015748
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: bpbumd
--

COPY public.migrations (id, filename, executed_at) FROM stdin;
\.


--
-- Data for Name: sectors; Type: TABLE DATA; Schema: public; Owner: bpbumd
--

COPY public.sectors (id, name, code, created_at, updated_at) FROM stdin;
1	Properti	properti	2026-06-14 14:20:07.523679	2026-06-14 14:20:07.523679
2	Transportasi	transportasi	2026-06-14 14:20:07.523679	2026-06-14 14:20:07.523679
3	Perbankan	perbankan	2026-06-14 14:20:07.523679	2026-06-14 14:20:07.523679
4	Air Minum	air_minum	2026-06-14 14:20:07.523679	2026-06-14 14:20:07.523679
\.


--
-- Data for Name: strategies; Type: TABLE DATA; Schema: public; Owner: bpbumd
--

COPY public.strategies (id, aspect_id, name, code_order, status, weight, progress_percentage, target_percentage, created_at, updated_at) FROM stdin;
3	3	Menata ulang struktur pengalihan aset penugasan melalui kajian dan penetapan skema transaksi yang layak secara tata kelola dan fiskal	A	selesai	\N	0.00	100.00	2026-06-14 14:55:06.015748	2026-06-14 15:19:46.847022
\.


--
-- Data for Name: sub_action_plan_approvals; Type: TABLE DATA; Schema: public; Owner: bpbumd
--

COPY public.sub_action_plan_approvals (id, sub_action_plan_id, approver_user_id, approval_order, status, notes, approved_at, rejected_at, created_at, updated_at) FROM stdin;
1	1	5	1	setujui	\N	2026-06-14 15:02:37.128196	\N	2026-06-14 15:01:38.066997	2026-06-14 15:02:37.128196
2	1	4	2	setujui	\N	2026-06-14 15:02:58.979774	\N	2026-06-14 15:01:38.066997	2026-06-14 15:02:58.979774
\.


--
-- Data for Name: sub_action_plans; Type: TABLE DATA; Schema: public; Owner: bpbumd
--

COPY public.sub_action_plans (id, action_plan_id, pic_user_id, submitted_by_user_id, name, status, submitted_at, created_at, updated_at) FROM stdin;
1	9	6	6	tes	selesai	2026-06-14 15:01:38.066997	2026-06-14 15:01:38.066997	2026-06-14 15:02:58.979774
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: bpbumd
--

COPY public.users (id, company_id, username, password_hash, name, role, "position", is_active, created_at, updated_at) FROM stdin;
2	1	admin_bpbumd	$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6	Admin BPBUMD	admin	\N	t	2026-06-14 14:11:35.176042	2026-06-14 14:11:35.176042
4	1	hsyaeful397	$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6	Syaefuloh Hidayat	admin	Kepala BPBUMD	t	2026-06-14 14:20:07.617567	2026-06-14 14:20:07.617567
5	4	bimatesdayu	$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6	Bima Tesdayu	admin	Direktur Keuangan	t	2026-06-14 14:20:07.617567	2026-06-14 14:21:02.27383
6	3	tito.hadi	$2b$10$9dq730nG2sS3wI.iWjjWwOJlCMgw.uH4GEgQl8jd3FRi7ZWDVteP6	Tito Hadi Dewan	admin	VP Strategic Plan & Program	t	2026-06-14 14:20:07.617567	2026-06-14 14:21:45.876916
\.


--
-- Name: action_plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bpbumd
--

SELECT pg_catalog.setval('public.action_plans_id_seq', 9, true);


--
-- Name: activity_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bpbumd
--

SELECT pg_catalog.setval('public.activity_groups_id_seq', 3, true);


--
-- Name: aspects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bpbumd
--

SELECT pg_catalog.setval('public.aspects_id_seq', 3, true);


--
-- Name: companies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bpbumd
--

SELECT pg_catalog.setval('public.companies_id_seq', 4, true);


--
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bpbumd
--

SELECT pg_catalog.setval('public.documents_id_seq', 3, true);


--
-- Name: history_activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bpbumd
--

SELECT pg_catalog.setval('public.history_activities_id_seq', 36, true);


--
-- Name: kpis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bpbumd
--

SELECT pg_catalog.setval('public.kpis_id_seq', 4, true);


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bpbumd
--

SELECT pg_catalog.setval('public.migrations_id_seq', 1, false);


--
-- Name: sectors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bpbumd
--

SELECT pg_catalog.setval('public.sectors_id_seq', 4, true);


--
-- Name: strategies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bpbumd
--

SELECT pg_catalog.setval('public.strategies_id_seq', 3, true);


--
-- Name: sub_action_plan_approvals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bpbumd
--

SELECT pg_catalog.setval('public.sub_action_plan_approvals_id_seq', 8, true);


--
-- Name: sub_action_plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bpbumd
--

SELECT pg_catalog.setval('public.sub_action_plans_id_seq', 4, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bpbumd
--

SELECT pg_catalog.setval('public.users_id_seq', 6, true);


--
-- Name: action_plans action_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.action_plans
    ADD CONSTRAINT action_plans_pkey PRIMARY KEY (id);


--
-- Name: activity_groups activity_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.activity_groups
    ADD CONSTRAINT activity_groups_pkey PRIMARY KEY (id);


--
-- Name: aspects aspects_pkey; Type: CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.aspects
    ADD CONSTRAINT aspects_pkey PRIMARY KEY (id);


--
-- Name: companies companies_company_code_key; Type: CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_company_code_key UNIQUE (company_code);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: history_activities history_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.history_activities
    ADD CONSTRAINT history_activities_pkey PRIMARY KEY (id);


--
-- Name: kpis kpis_pkey; Type: CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.kpis
    ADD CONSTRAINT kpis_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_filename_key; Type: CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_filename_key UNIQUE (filename);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: sectors sectors_code_key; Type: CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_code_key UNIQUE (code);


--
-- Name: sectors sectors_pkey; Type: CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_pkey PRIMARY KEY (id);


--
-- Name: strategies strategies_pkey; Type: CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.strategies
    ADD CONSTRAINT strategies_pkey PRIMARY KEY (id);


--
-- Name: sub_action_plan_approvals sub_action_plan_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.sub_action_plan_approvals
    ADD CONSTRAINT sub_action_plan_approvals_pkey PRIMARY KEY (id);


--
-- Name: sub_action_plans sub_action_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.sub_action_plans
    ADD CONSTRAINT sub_action_plans_pkey PRIMARY KEY (id);


--
-- Name: sub_action_plan_approvals uq_sub_action_plan_approval_order; Type: CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.sub_action_plan_approvals
    ADD CONSTRAINT uq_sub_action_plan_approval_order UNIQUE (sub_action_plan_id, approval_order);


--
-- Name: sub_action_plan_approvals uq_sub_action_plan_approver; Type: CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.sub_action_plan_approvals
    ADD CONSTRAINT uq_sub_action_plan_approver UNIQUE (sub_action_plan_id, approver_user_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_action_plans_activity_group_id; Type: INDEX; Schema: public; Owner: bpbumd
--

CREATE INDEX idx_action_plans_activity_group_id ON public.action_plans USING btree (activity_group_id);


--
-- Name: idx_action_plans_pic_user_id; Type: INDEX; Schema: public; Owner: bpbumd
--

CREATE INDEX idx_action_plans_pic_user_id ON public.action_plans USING btree (pic_user_id);


--
-- Name: idx_action_plans_status; Type: INDEX; Schema: public; Owner: bpbumd
--

CREATE INDEX idx_action_plans_status ON public.action_plans USING btree (status);


--
-- Name: idx_activity_groups_status; Type: INDEX; Schema: public; Owner: bpbumd
--

CREATE INDEX idx_activity_groups_status ON public.activity_groups USING btree (status);


--
-- Name: idx_activity_groups_strategy_id; Type: INDEX; Schema: public; Owner: bpbumd
--

CREATE INDEX idx_activity_groups_strategy_id ON public.activity_groups USING btree (strategy_id);


--
-- Name: idx_aspects_company_id; Type: INDEX; Schema: public; Owner: bpbumd
--

CREATE INDEX idx_aspects_company_id ON public.aspects USING btree (company_id);


--
-- Name: idx_aspects_status; Type: INDEX; Schema: public; Owner: bpbumd
--

CREATE INDEX idx_aspects_status ON public.aspects USING btree (status);


--
-- Name: idx_companies_company_type; Type: INDEX; Schema: public; Owner: bpbumd
--

CREATE INDEX idx_companies_company_type ON public.companies USING btree (company_type);


--
-- Name: idx_companies_sector_id; Type: INDEX; Schema: public; Owner: bpbumd
--

CREATE INDEX idx_companies_sector_id ON public.companies USING btree (sector_id);


--
-- Name: idx_documents_action_plan_id; Type: INDEX; Schema: public; Owner: bpbumd
--

CREATE INDEX idx_documents_action_plan_id ON public.documents USING btree (action_plan_id);


--
-- Name: idx_documents_sub_action_plan_id; Type: INDEX; Schema: public; Owner: bpbumd
--

CREATE INDEX idx_documents_sub_action_plan_id ON public.documents USING btree (sub_action_plan_id);


--
-- Name: idx_history_activities_action_plan_id; Type: INDEX; Schema: public; Owner: bpbumd
--

CREATE INDEX idx_history_activities_action_plan_id ON public.history_activities USING btree (action_plan_id);


--
-- Name: idx_history_activities_sub_action_plan_id; Type: INDEX; Schema: public; Owner: bpbumd
--

CREATE INDEX idx_history_activities_sub_action_plan_id ON public.history_activities USING btree (sub_action_plan_id);


--
-- Name: idx_kpis_action_plan_id; Type: INDEX; Schema: public; Owner: bpbumd
--

CREATE INDEX idx_kpis_action_plan_id ON public.kpis USING btree (action_plan_id);


--
-- Name: idx_strategies_aspect_id; Type: INDEX; Schema: public; Owner: bpbumd
--

CREATE INDEX idx_strategies_aspect_id ON public.strategies USING btree (aspect_id);


--
-- Name: idx_strategies_status; Type: INDEX; Schema: public; Owner: bpbumd
--

CREATE INDEX idx_strategies_status ON public.strategies USING btree (status);


--
-- Name: idx_sub_action_plan_approvals_approver_user_id; Type: INDEX; Schema: public; Owner: bpbumd
--

CREATE INDEX idx_sub_action_plan_approvals_approver_user_id ON public.sub_action_plan_approvals USING btree (approver_user_id);


--
-- Name: idx_sub_action_plan_approvals_status; Type: INDEX; Schema: public; Owner: bpbumd
--

CREATE INDEX idx_sub_action_plan_approvals_status ON public.sub_action_plan_approvals USING btree (status);


--
-- Name: idx_sub_action_plan_approvals_sub_action_plan_id; Type: INDEX; Schema: public; Owner: bpbumd
--

CREATE INDEX idx_sub_action_plan_approvals_sub_action_plan_id ON public.sub_action_plan_approvals USING btree (sub_action_plan_id);


--
-- Name: idx_sub_action_plans_action_plan_id; Type: INDEX; Schema: public; Owner: bpbumd
--

CREATE INDEX idx_sub_action_plans_action_plan_id ON public.sub_action_plans USING btree (action_plan_id);


--
-- Name: idx_sub_action_plans_pic_user_id; Type: INDEX; Schema: public; Owner: bpbumd
--

CREATE INDEX idx_sub_action_plans_pic_user_id ON public.sub_action_plans USING btree (pic_user_id);


--
-- Name: idx_sub_action_plans_status; Type: INDEX; Schema: public; Owner: bpbumd
--

CREATE INDEX idx_sub_action_plans_status ON public.sub_action_plans USING btree (status);


--
-- Name: idx_sub_action_plans_submitted_by_user_id; Type: INDEX; Schema: public; Owner: bpbumd
--

CREATE INDEX idx_sub_action_plans_submitted_by_user_id ON public.sub_action_plans USING btree (submitted_by_user_id);


--
-- Name: idx_users_company_id; Type: INDEX; Schema: public; Owner: bpbumd
--

CREATE INDEX idx_users_company_id ON public.users USING btree (company_id);


--
-- Name: action_plans trg_action_plans_updated_at; Type: TRIGGER; Schema: public; Owner: bpbumd
--

CREATE TRIGGER trg_action_plans_updated_at BEFORE UPDATE ON public.action_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: activity_groups trg_activity_groups_updated_at; Type: TRIGGER; Schema: public; Owner: bpbumd
--

CREATE TRIGGER trg_activity_groups_updated_at BEFORE UPDATE ON public.activity_groups FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: aspects trg_aspects_updated_at; Type: TRIGGER; Schema: public; Owner: bpbumd
--

CREATE TRIGGER trg_aspects_updated_at BEFORE UPDATE ON public.aspects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: companies trg_companies_updated_at; Type: TRIGGER; Schema: public; Owner: bpbumd
--

CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: documents trg_documents_updated_at; Type: TRIGGER; Schema: public; Owner: bpbumd
--

CREATE TRIGGER trg_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: history_activities trg_history_activities_updated_at; Type: TRIGGER; Schema: public; Owner: bpbumd
--

CREATE TRIGGER trg_history_activities_updated_at BEFORE UPDATE ON public.history_activities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: kpis trg_kpis_updated_at; Type: TRIGGER; Schema: public; Owner: bpbumd
--

CREATE TRIGGER trg_kpis_updated_at BEFORE UPDATE ON public.kpis FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: sectors trg_sectors_updated_at; Type: TRIGGER; Schema: public; Owner: bpbumd
--

CREATE TRIGGER trg_sectors_updated_at BEFORE UPDATE ON public.sectors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: strategies trg_strategies_updated_at; Type: TRIGGER; Schema: public; Owner: bpbumd
--

CREATE TRIGGER trg_strategies_updated_at BEFORE UPDATE ON public.strategies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: sub_action_plan_approvals trg_sub_action_plan_approvals_updated_at; Type: TRIGGER; Schema: public; Owner: bpbumd
--

CREATE TRIGGER trg_sub_action_plan_approvals_updated_at BEFORE UPDATE ON public.sub_action_plan_approvals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: sub_action_plans trg_sub_action_plans_updated_at; Type: TRIGGER; Schema: public; Owner: bpbumd
--

CREATE TRIGGER trg_sub_action_plans_updated_at BEFORE UPDATE ON public.sub_action_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: public; Owner: bpbumd
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: action_plans fk_action_plans_activity_group; Type: FK CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.action_plans
    ADD CONSTRAINT fk_action_plans_activity_group FOREIGN KEY (activity_group_id) REFERENCES public.activity_groups(id) ON DELETE RESTRICT;


--
-- Name: action_plans fk_action_plans_pic_user; Type: FK CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.action_plans
    ADD CONSTRAINT fk_action_plans_pic_user FOREIGN KEY (pic_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: activity_groups fk_activity_groups_strategy; Type: FK CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.activity_groups
    ADD CONSTRAINT fk_activity_groups_strategy FOREIGN KEY (strategy_id) REFERENCES public.strategies(id) ON DELETE RESTRICT;


--
-- Name: aspects fk_aspects_company; Type: FK CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.aspects
    ADD CONSTRAINT fk_aspects_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE RESTRICT;


--
-- Name: companies fk_companies_sector; Type: FK CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT fk_companies_sector FOREIGN KEY (sector_id) REFERENCES public.sectors(id) ON DELETE SET NULL;


--
-- Name: documents fk_documents_action_plan; Type: FK CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT fk_documents_action_plan FOREIGN KEY (action_plan_id) REFERENCES public.action_plans(id) ON DELETE CASCADE;


--
-- Name: documents fk_documents_sub_action_plan; Type: FK CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT fk_documents_sub_action_plan FOREIGN KEY (sub_action_plan_id) REFERENCES public.sub_action_plans(id) ON DELETE CASCADE;


--
-- Name: documents fk_documents_uploaded_by_user; Type: FK CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT fk_documents_uploaded_by_user FOREIGN KEY (uploaded_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: documents fk_documents_verified_by_user; Type: FK CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT fk_documents_verified_by_user FOREIGN KEY (verified_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: history_activities fk_history_activities_action_plan; Type: FK CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.history_activities
    ADD CONSTRAINT fk_history_activities_action_plan FOREIGN KEY (action_plan_id) REFERENCES public.action_plans(id) ON DELETE CASCADE;


--
-- Name: history_activities fk_history_activities_sub_action_plan; Type: FK CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.history_activities
    ADD CONSTRAINT fk_history_activities_sub_action_plan FOREIGN KEY (sub_action_plan_id) REFERENCES public.sub_action_plans(id) ON DELETE CASCADE;


--
-- Name: history_activities fk_history_activities_user; Type: FK CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.history_activities
    ADD CONSTRAINT fk_history_activities_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: kpis fk_kpis_action_plan; Type: FK CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.kpis
    ADD CONSTRAINT fk_kpis_action_plan FOREIGN KEY (action_plan_id) REFERENCES public.action_plans(id) ON DELETE CASCADE;


--
-- Name: strategies fk_strategies_aspect; Type: FK CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.strategies
    ADD CONSTRAINT fk_strategies_aspect FOREIGN KEY (aspect_id) REFERENCES public.aspects(id) ON DELETE RESTRICT;


--
-- Name: sub_action_plan_approvals fk_sub_action_plan_approvals_approver_user; Type: FK CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.sub_action_plan_approvals
    ADD CONSTRAINT fk_sub_action_plan_approvals_approver_user FOREIGN KEY (approver_user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: sub_action_plan_approvals fk_sub_action_plan_approvals_sub_action_plan; Type: FK CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.sub_action_plan_approvals
    ADD CONSTRAINT fk_sub_action_plan_approvals_sub_action_plan FOREIGN KEY (sub_action_plan_id) REFERENCES public.sub_action_plans(id) ON DELETE CASCADE;


--
-- Name: sub_action_plans fk_sub_action_plans_action_plan; Type: FK CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.sub_action_plans
    ADD CONSTRAINT fk_sub_action_plans_action_plan FOREIGN KEY (action_plan_id) REFERENCES public.action_plans(id) ON DELETE RESTRICT;


--
-- Name: sub_action_plans fk_sub_action_plans_pic_user; Type: FK CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.sub_action_plans
    ADD CONSTRAINT fk_sub_action_plans_pic_user FOREIGN KEY (pic_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: sub_action_plans fk_sub_action_plans_submitted_by_user; Type: FK CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.sub_action_plans
    ADD CONSTRAINT fk_sub_action_plans_submitted_by_user FOREIGN KEY (submitted_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users fk_users_company; Type: FK CONSTRAINT; Schema: public; Owner: bpbumd
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: bpbumd
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

INSERT INTO public.migrations (filename) VALUES 
('001_create_initial_schema.sql'), 
('002_index_initial_schema.sql'), 
('003_trigger_auto_updated_at.sql') 
ON CONFLICT DO NOTHING;

\unrestrict 6fPKUhQ474UCahA7grad8xQ5AvVKcHiPogPVAXrcM57XPzOWPfXXa0M9D3n2Lce

