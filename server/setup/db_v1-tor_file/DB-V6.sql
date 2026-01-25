-- ==========================================
-- SCHEMA
-- ==========================================
DROP SCHEMA IF EXISTS pp CASCADE;
CREATE SCHEMA IF NOT EXISTS pp;

-- ==========================================
-- SEQUENCES
-- ==========================================
CREATE SEQUENCE pp.user_id_seq START 1;
CREATE SEQUENCE pp.role_id_seq START 1;
CREATE SEQUENCE pp.jurisdiction_code_seq START 1;
CREATE SEQUENCE pp.officer_id_seq START 1;
CREATE SEQUENCE pp.desig_id_seq START 1;
CREATE SEQUENCE pp.institute_type_id_seq START 1;
CREATE SEQUENCE pp.institute_id_seq START 1;
CREATE SEQUENCE pp.applicant_id_seq START 1;
CREATE SEQUENCE pp.criteria_id_seq START 1;
CREATE SEQUENCE pp.verification_id_seq START 1;
CREATE SEQUENCE pp.interviewer_id_seq START 1;
CREATE SEQUENCE pp.interview_id_seq START 1;
CREATE SEQUENCE pp.evaluation_id_seq START 1;
CREATE SEQUENCE pp.shortlist_batch_id_seq START 1;
CREATE SEQUENCE pp.sibling_education_seq START 1;
CREATE SEQUENCE pp.pp_exam_centre_seq START 1;
CREATE SEQUENCE pp.shortlist_info_seq START 1;
CREATE SEQUENCE pp.examination_seq START 1;
CREATE SEQUENCE pp.cohort_seq START 1;
CREATE SEQUENCE pp.batch_id_seq START 1;
CREATE SEQUENCE pp.tab_id_seq START 1;
CREATE SEQUENCE pp.student_id_seq START 1;
CREATE SEQUENCE pp.platform_seq START 1;
CREATE SEQUENCE IF NOT EXISTS pp.subject_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS pp.system_config_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS pp.platform_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS pp.teacher_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS pp.classroom_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS pp.timetable_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS pp.attendance_id_seq START 1;

-- ==========================================
-- USER AND ROLES
-- ==========================================
CREATE TABLE pp.user (
    user_id      numeric(8,0) PRIMARY KEY DEFAULT nextval('pp.user_id_seq'),
    user_name    varchar(100) NOT NULL UNIQUE,
    enc_password varchar(300),
    locked_yn    char(1) CHECK (locked_yn IN ('Y','N')),
    created_at   timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at   timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by numeric(8,0) REFERENCES pp.user(user_id),
    updated_by numeric(8,0) REFERENCES pp.user(user_id)
);

CREATE TABLE pp.role (
    role_id     numeric(4,0) PRIMARY KEY DEFAULT nextval('pp.role_id_seq'),
    role_name   varchar(100) NOT NULL UNIQUE,
    active_yn   char(1) CHECK (active_yn IN ('Y','N')),
    created_at  timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at  timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by numeric(8,0) REFERENCES pp.user(user_id),
    updated_by numeric(8,0) REFERENCES pp.user(user_id)
);

CREATE TABLE pp.user_role (
    user_id numeric(8,0) REFERENCES pp.user(user_id) ON DELETE CASCADE,
    role_id numeric(4,0) REFERENCES pp.role(role_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- ==========================================
-- JURISDICTIONS
-- ==========================================
CREATE TABLE pp.jurisdiction_type (
    juris_type varchar(100) PRIMARY KEY
);

CREATE TABLE pp.jurisdiction (
    juris_code   numeric(14,0) PRIMARY KEY ,
    juris_name   varchar(100),
    juris_type   varchar(100) REFERENCES pp.jurisdiction_type(juris_type),
    parent_juris numeric(14,0) REFERENCES pp.jurisdiction(juris_code),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by numeric(8,0) REFERENCES pp.user(user_id),
    updated_by numeric(8,0) REFERENCES pp.user(user_id)
);

-- ==========================================
-- EDU OFFICERS AND DESIGNATIONS
-- ==========================================
CREATE TABLE pp.eduofficer (
    officer_id   numeric(14,0) PRIMARY KEY DEFAULT nextval('pp.officer_id_seq'),
    officer_name varchar(100),
    phone1       varchar(15),
    phone2       varchar(15),
    email        varchar(100),
    created_at   timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at   timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by numeric(8,0) REFERENCES pp.user(user_id),
    updated_by numeric(8,0) REFERENCES pp.user(user_id)
);

CREATE TABLE pp.edudesig (
    desig_id    numeric(14,0) PRIMARY KEY DEFAULT nextval('pp.desig_id_seq'),
    desig_name  varchar(100),
    created_at  timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at  timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by numeric(8,0) REFERENCES pp.user(user_id),
    updated_by numeric(8,0) REFERENCES pp.user(user_id)
);

CREATE TABLE pp.officer_desig (
    officer_id  numeric(14,0) REFERENCES pp.eduofficer(officer_id) ON DELETE CASCADE,
    juris_code  numeric(14,0) REFERENCES pp.jurisdiction(juris_code) ON DELETE CASCADE,
    desig_id    numeric(14,0) REFERENCES pp.edudesig(desig_id) ON DELETE CASCADE,
    other_desig varchar(100),
    PRIMARY KEY (officer_id, desig_id, juris_code)
);

-- ==========================================
-- INSTITUTES
-- ==========================================


CREATE TABLE pp.institute (
    institute_id numeric(14,0) PRIMARY KEY DEFAULT nextval('pp.institute_id_seq'),
    dise_code varchar(15) UNIQUE,          -- school UDISE code
    institute_name varchar(200),              -- school_name
	institute_board varchar(20) CHECK (institute_board IN ('STATE','ICSE','CBSE','OTHER BOARD','INTERNATIONAL BOARD')),
    address varchar(200),                     -- school_address
    pin_code varchar(10),                     -- postal code
    email varchar(200),
    contact_no varchar(12),
    juris_code numeric(14,0) REFERENCES pp.jurisdiction(juris_code),
    management_type varchar(50) CHECK (management_type IN ('GOVERNMENT','PRIVATE AIDED','PRIVATE UNAIDED','OTHERS','NULL')),
    institute_management_type varchar(150) CHECK (institute_management_type IN ('UNRECOGNIZED','TRIBAL WELFARE DEPARTMENT','CENTRAL TIBETAN SCHOOLS','MINISTRY OF LABOR','SOCIAL WELFARE DEPARTMENT','DEPARTMENT OF EDUCATION','MADARSA RECOGNIZED','OTHER GOVT. MANAGED SCHOOLS','OTHER CENTRAL GOVT. SCHOOLS','SAINIK SCHOOL','LOCAL BODY','GOVERNMENT AIDED','RAILWAY SCHOOL','PRIVATE UNAIDED (RECOGNIZED)')),
    institute_category_name varchar(100) CHECK (institute_category_name IN ('SECONDARY ONLY','UPPER PRIMARY ONLY','UP. PR. SECONDARY AND HIGHER SEC','HIGHER SECONDARY ONLY','UPPER PR. AND SECONDARY','PR. WITH UP.PR. SEC. AND H.SEC.','SECONDARY WITH HIGHER SECONDARY','PRIMARY WITH UPPER PRIMARY','PR. UP PR. AND SECONDARY ONLY','PRIMARY')),
    institute_urban_or_rural varchar(50) CHECK (institute_urban_or_rural IN ('URBAN','RURAL')),
    class_from numeric(2,0),                     -- starting class (e.g. 1, 6, 8)
    class_to numeric(2,0),                       -- ending class (e.g. 5, 7, 10, 12)
    institute_type varchar(50) CHECK (institute_type IN ('CO EDUCATION','BOYS','GIRLS')),
    latitude decimal(10,15),                    -- GPS latitude
    longitude decimal(10,15),                   -- GPS longitude
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP, 
    created_by numeric(8,0) REFERENCES pp.user(user_id),
    updated_by numeric(8,0) REFERENCES pp.user(user_id)
);


CREATE TABLE pp.institute_medium (
    dise_code varchar(15) REFERENCES pp.institute(dise_code) ON DELETE CASCADE,
    medium    VARCHAR(10) 
);

-- ==========================================
-- APPLICANTS
-- ==========================================
CREATE TABLE pp.applicant_primary_info (
    applicant_id       numeric(14,0) PRIMARY KEY DEFAULT nextval('pp.applicant_id_seq'),
    nmms_year          numeric(4,0),
    nmms_reg_number    numeric(11,0) UNIQUE NOT NULL,
    app_state          numeric(12,0) REFERENCES pp.jurisdiction(juris_code),
    district           numeric(12,0) REFERENCES pp.jurisdiction(juris_code),
    nmms_block         numeric(12,0) REFERENCES pp.jurisdiction(juris_code),
    student_name       varchar(100),
    father_name        varchar(100),
    mother_name        varchar(100),
    gmat_score         numeric(2,0),
    sat_score          numeric(2,0),
    gender             char(1) CHECK (gender IN ('M','F','O')),
    medium             varchar(50),
    aadhaar            varchar(12),
    dob                date,
    home_address       varchar(200),
    family_income_total numeric(7,0),
    contact_no1        varchar(12),
    contact_no2        varchar(12),
    current_institute_dise_code  varchar(15) REFERENCES pp.institute(dise_code) ON DELETE SET NULL,
    previous_institute_dise_code varchar(15) REFERENCES pp.institute(dise_code) ON DELETE SET NULL,
    created_at         timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at         timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by numeric(8,0) REFERENCES pp.user(user_id),
    updated_by numeric(8,0) REFERENCES pp.user(user_id)
);

CREATE TABLE pp.applicant_secondary_info (
    applicant_id            numeric(14,0) PRIMARY KEY REFERENCES pp.applicant_primary_info(applicant_id) ON DELETE CASCADE,
    village                 varchar(100),
    father_occupation       varchar(100),
    mother_occupation       varchar(100),
    father_education        varchar(100),
    mother_education        varchar(100),
    household_size          numeric(3,0),
    own_house               char(1) CHECK (own_house IN ('Y','N')),
    smart_phone_home        char(1) CHECK (smart_phone_home IN ('Y','N')),
    internet_facility_home  char(1) CHECK (internet_facility_home IN ('Y','N')),
    career_goals            text,
    subjects_of_interest    text,
    transportation_mode     varchar(100),
    distance_to_school      numeric(5,2),
    num_two_wheelers        numeric(2,0) NOT NULL DEFAULT 0,
    num_four_wheelers       numeric(2,0) NOT NULL DEFAULT 0,
    irrigation_land         numeric(6,2) NOT NULL DEFAULT 0,
    neighbor_name           varchar(100),
    neighbor_phone          varchar(12),
    favorite_teacher_name   varchar(100),
    favorite_teacher_phone  varchar(12),
    created_at              timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at              timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by numeric(8,0) REFERENCES pp.user(user_id),
    updated_by numeric(8,0) REFERENCES pp.user(user_id)
);

CREATE TABLE pp.sibling_education (
    sibling_id   numeric(14,0) PRIMARY KEY DEFAULT nextval('pp.sibling_education_seq'),
    applicant_id numeric(14,0) REFERENCES pp.applicant_primary_info(applicant_id) ON DELETE CASCADE,
    sibling_name varchar(100),
    sibling_type char(1) NOT NULL CHECK (sibling_type IN ('B','S')),
    education    varchar(100) CHECK (education IN ('SSLC','PUC','DIPLOMA','DEGREE','POSTGRADUATE','OTHERS')),
    created_at   timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at   timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by numeric(8,0) REFERENCES pp.user(user_id),
    updated_by numeric(8,0) REFERENCES pp.user(user_id)
);

-- ==========================================
-- EXAM CENTRE
-- ==========================================
CREATE TABLE pp.pp_exam_centre (
    pp_exam_centre_id numeric(10,0) PRIMARY KEY DEFAULT nextval('pp.pp_exam_centre_seq'),
    pp_exam_centre_code varchar(20) UNIQUE, -- USHATAIBGM, CTEBGM, ADARSHADWD, etc.
    pp_exam_centre_name varchar(100) NOT NULL,
    address varchar(200),
    village varchar(100),
    pincode varchar(12),
    contact_person varchar(100),
    contact_phone varchar(12),
    contact_email varchar(200),
    sitting_capacity integer CHECK (sitting_capacity >= 0),
    active_yn char(1) NOT NULL DEFAULT 'Y' CHECK (active_yn IN ('Y','N')),
    latitude decimal(10,15),
    longitude decimal(10,15),
    google_map_link text GENERATED ALWAYS AS (
        CASE
            WHEN latitude IS NOT NULL AND longitude IS NOT NULL
            THEN 'https://www.google.com/maps/search/?api=1&query=' ||
                 replace(pp_exam_centre_name, ' ', '%20') || '%20' ||
                 latitude || ',' || longitude
            ELSE NULL
        END
    ) STORED,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by numeric(8,0) REFERENCES pp.user(user_id),
    updated_by numeric(8,0) REFERENCES pp.user(user_id),
    UNIQUE(contact_email, contact_phone)
);



-- ==========================================
-- SHORTLIST CRITERIA AND BATCHES
-- ==========================================
CREATE TABLE pp.shortlist_criteria (
    criteria_id numeric(3,0) PRIMARY KEY DEFAULT nextval('pp.criteria_id_seq'),
    criteria    varchar(500) UNIQUE,
    created_at  timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at  timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by numeric(8,0) REFERENCES pp.user(user_id),
    updated_by numeric(8,0) REFERENCES pp.user(user_id)
);

CREATE TABLE pp.shortlist_batch (
    shortlist_batch_id   numeric(6,0) PRIMARY KEY DEFAULT nextval('pp.shortlist_batch_id_seq'),
    shortlist_batch_name varchar(100) NOT NULL UNIQUE,
    description          varchar(200),
    created_on           timestamp DEFAULT now(),
    criteria_id          numeric(3,0) REFERENCES pp.shortlist_criteria(criteria_id) ON DELETE SET NULL,
    frozen_yn            char(1) DEFAULT 'N' CHECK (frozen_yn IN ('Y','N'))
);

CREATE TABLE pp.shortlist_batch_jurisdiction (
    shortlist_batch_id numeric(6,0) REFERENCES pp.shortlist_batch(shortlist_batch_id) ON DELETE CASCADE,
    juris_code         numeric(12,0) REFERENCES pp.jurisdiction(juris_code) ON DELETE CASCADE,
    PRIMARY KEY (shortlist_batch_id, juris_code)
);

CREATE TABLE pp.applicant_shortlist_info (
    shortlist_info_id numeric(14,0) PRIMARY KEY DEFAULT nextval('pp.shortlist_info_seq'),
    applicant_id      numeric(14,0) REFERENCES pp.applicant_primary_info(applicant_id),
    shortlisted_yn    char(1) CHECK (shortlisted_yn IN ('Y','N')),
    shortlist_batch_id numeric(6,0) REFERENCES pp.shortlist_batch(shortlist_batch_id) ON DELETE CASCADE,

    created_at   timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at   timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by numeric(8,0) REFERENCES pp.user(user_id),
    updated_by numeric(8,0) REFERENCES pp.user(user_id)
);

-- ==========================================
-- EXAMINATION
-- ==========================================
CREATE TABLE pp.examination (
    exam_id           numeric(14,0) PRIMARY KEY DEFAULT nextval('pp.examination_seq'),
    exam_name         varchar(100) NOT NULL,
    exam_date         date NOT NULL,
    exam_start_time   time NOT NULL,   -- new column
    exam_end_time     time NOT NULL,   -- new column
    pp_exam_centre_id numeric(10,0) REFERENCES pp.pp_exam_centre(pp_exam_centre_id),
    frozen_yn         char(1) DEFAULT 'N' CHECK (frozen_yn IN ('Y','N')), -- Do not permit deletion if Y
    created_at        timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at        timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by        numeric(8,0) REFERENCES pp.user(user_id),
    updated_by        numeric(8,0) REFERENCES pp.user(user_id)
);

-- Exam assigned for an applicant.
CREATE TABLE pp.applicant_exam (
    applicant_id      numeric(14,0) PRIMARY KEY REFERENCES pp.applicant_primary_info(applicant_id),
    exam_id           numeric(14,0) REFERENCES pp.examination(exam_id),
    pp_hall_ticket_no varchar(20) UNIQUE
);

CREATE TABLE pp.exam_results (
    applicant_id           numeric(14,0) REFERENCES pp.applicant_primary_info(applicant_id),
    pp_exam_score          numeric(3,0),
    pp_exam_cleared        char(1) CHECK (pp_exam_cleared IN ('Y','N')),
    interview_required_yn  char(1) CHECK (interview_required_yn IN ('Y','N'))
);

CREATE TABLE pp.applicant_exam_attendance (
    applicant_id        numeric(14,0) REFERENCES pp.applicant_primary_info(applicant_id),
    pp_exam_appeared_yn char(1) CHECK (pp_exam_appeared_yn IN ('Y','N'))
);

-- ==========================================
-- INTERVIEWS AND VERIFICATIONS
-- ==========================================
CREATE TABLE pp.rejection_reasons (
    rej_reason_id    numeric(4,0) PRIMARY KEY,
    rejection_reason varchar(200) NOT NULL
);

CREATE TABLE pp.interviewer (
    interviewer_id   numeric(10,0) PRIMARY KEY DEFAULT nextval('pp.interviewer_id_seq'),
    interviewer_name varchar(100),
    email            varchar(100),
    mobile1          varchar(12),
    mobile2          varchar(12),
    active_status    char(1) CHECK (active_status IN ('Y','N')),
    created_at   timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at   timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by numeric(8,0) REFERENCES pp.user(user_id),
    updated_by numeric(8,0) REFERENCES pp.user(user_id)
);

CREATE TABLE pp.student_interview (
    interview_id              numeric(12,0) PRIMARY KEY DEFAULT nextval('pp.interview_id_seq'),
    applicant_id              numeric(14,0) REFERENCES pp.applicant_primary_info(applicant_id),
    interviewer_id            numeric(10,0) REFERENCES pp.interviewer(interviewer_id),
    interview_date            date,
    interview_time            time,
    interview_mode            varchar(20) CHECK (interview_mode IN ('ONLINE','OFFLINE')),
    interview_round           int,
    status                    varchar(15) CHECK (status IN ('SCHEDULED','COMPLETED','CANCELLED','RESCHEDULED')),
    life_goals_and_zeal       numeric(3,1),
    commitment_to_learning    numeric(3,1),
    integrity                 numeric(3,1),
    communication_skills      numeric(3,1),
    interview_result          varchar(15) CHECK (interview_result IN ('SELECTED','REJECTED','NEXT ROUND')),
    home_verification_req_yn  char(1) CHECK (home_verification_req_yn IN ('Y','N')) DEFAULT 'N',
    created_at   timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at   timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by numeric(8,0) REFERENCES pp.user(user_id),
    updated_by numeric(8,0) REFERENCES pp.user(user_id),
    remarks                varchar(200)
);

CREATE TABLE pp.home_verification (
    verification_id        numeric(12,0) PRIMARY KEY DEFAULT nextval('pp.verification_id_seq'),
    applicant_id           numeric(14,0) REFERENCES pp.applicant_primary_info(applicant_id),
    date_of_verification   date,
    remarks                varchar(200),
    status                 varchar(10) CHECK (status IN ('PENDING','SCHEDULED','REJECTED','ACCEPTED')),
    verified_by            varchar(100),
    rejection_reason_id    numeric(4,0) REFERENCES pp.rejection_reasons(rej_reason_id),
    verification_type      varchar(20) CHECK (verification_type IN ('PHYSICAL','VIRTUAL')),
    created_at   timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at   timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by numeric(8,0) REFERENCES pp.user(user_id),
    updated_by numeric(8,0) REFERENCES pp.user(user_id)
);

-- ==========================================
-- STUDENTS, COHORTS, BATCHES
-- ==========================================
CREATE TABLE pp.applicant_result (
    applicant_id numeric(14,0) REFERENCES pp.applicant_primary_info(applicant_id),
    status       varchar(20) CHECK (status IN ('SELECTED','REJECTED')),
    remarks      varchar(200),
    created_at   timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at   timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by numeric(8,0) REFERENCES pp.user(user_id),
    updated_by numeric(8,0) REFERENCES pp.user(user_id)
);

CREATE TABLE pp.cohort (
    cohort_number integer PRIMARY KEY DEFAULT nextval('pp.cohort_seq'),
    cohort_name   varchar(100) UNIQUE,
    start_date    date,
    end_date      date,
    description   text,
    created_at   timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at   timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by numeric(8,0) REFERENCES pp.user(user_id),
    updated_by numeric(8,0) REFERENCES pp.user(user_id)
);

CREATE TABLE pp.batch (
    batch_id      integer PRIMARY KEY DEFAULT nextval('pp.batch_id_seq'),
    batch_name    varchar(100),
    cohort_number integer REFERENCES pp.cohort(cohort_number) ON DELETE CASCADE,
    UNIQUE(cohort_number, batch_name),
    created_at   timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at   timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by numeric(8,0) REFERENCES pp.user(user_id),
    updated_by numeric(8,0) REFERENCES pp.user(user_id)
);

CREATE TABLE pp.batch_coordinator_batches (
    user_id  numeric(8,0) REFERENCES pp.user(user_id),
    batch_id integer REFERENCES pp.batch(batch_id),
    PRIMARY KEY(user_id, batch_id)
);

-- ==========================================
-- TAB INVENTORY
-- ==========================================
CREATE TABLE pp.tab_inventory (
    tab_id        numeric(10,0) PRIMARY KEY DEFAULT nextval('pp.tab_id_seq'),
    serial_number varchar(100) UNIQUE NOT NULL,
    brand         varchar(50),
    model         varchar(50),
    status        varchar(20) CHECK (status IN ('AVAILABLE','ASSIGNED','RETURNED','DAMAGED','LOST')) DEFAULT 'AVAILABLE',
    remarks       text,
    created_at   timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at   timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by numeric(8,0) REFERENCES pp.user(user_id),
    updated_by numeric(8,0) REFERENCES pp.user(user_id)
);

CREATE TABLE pp.tab_assignment_history (
    tab_id         integer REFERENCES pp.tab_inventory(tab_id),
    applicant_id   numeric(14,0) REFERENCES pp.applicant_primary_info(applicant_id),
    assignment_date date NOT NULL,
    return_date     date NULL,
    PRIMARY KEY(tab_id, applicant_id, assignment_date),
    created_at   timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at   timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by numeric(8,0) REFERENCES pp.user(user_id),
    updated_by numeric(8,0) REFERENCES pp.user(user_id)
);


CREATE TABLE pp.student_master (
    student_id                  numeric(14,0) PRIMARY KEY DEFAULT nextval('pp.student_id_seq'),
    applicant_id                numeric(14,0) UNIQUE REFERENCES pp.applicant_primary_info(applicant_id),
    enr_id                      numeric(11,0) UNIQUE,
    student_name                varchar(100),
    father_name                 varchar(100),
    father_occupation           varchar(100),
    mother_name                 varchar(100),
    mother_occupation           varchar(100),
    gender                      char(1) CHECK (gender IN ('M','F','O')),
    batch_id                    integer REFERENCES pp.batch(batch_id),
    sim_name                    varchar(10),
    student_email               varchar(150),
    student_email_password      varchar(100),
    parent_email                varchar(150),
    photo_link                  text,
    home_address                varchar(200),
    contact_no1                 varchar(12),
    contact_no2                 varchar(12),
    current_institute_dise_code varchar(15) REFERENCES pp.institute(dise_code) ON DELETE SET NULL,
    previous_institute_dise_code varchar(15) REFERENCES pp.institute(dise_code) ON DELETE SET NULL,
    active_yn                   varchar(10) DEFAULT 'ACTIVE' CHECK (active_yn IN ('ACTIVE','INACTIVE')),
    recharge_status             varchar(20) CHECK (recharge_status IN ('GRANTED','NOT GRANTED')),
    sponsor                     varchar(100),
    teacher_name                varchar(100),
    teacher_mobile_number       varchar(12),
    created_at                  timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at                  timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by                  numeric(8,0) REFERENCES pp.user(user_id),
    updated_by                  numeric(8,0) REFERENCES pp.user(user_id)
);

-- ==========================================
-- SUBJECTS, CLASSROOMS, TIMETABLES
-- ==========================================
CREATE TABLE pp.subject (
    subject_id   integer PRIMARY KEY DEFAULT nextval('pp.subject_id_seq'),
    subject_code varchar(5) NOT NULL,
    subject_name varchar(100) NOT NULL UNIQUE,
    created_at   timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at   timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by   numeric(8,0) REFERENCES pp.user(user_id),
    updated_by   numeric(8,0) REFERENCES pp.user(user_id)
);

CREATE TABLE pp.teaching_platform (
    platform_id   integer PRIMARY KEY DEFAULT nextval('pp.platform_id_seq'),
    platform_name varchar(100) NOT NULL UNIQUE
);

CREATE TABLE pp.teacher (
    teacher_id     integer PRIMARY KEY DEFAULT nextval('pp.teacher_id_seq'),
    user_id        numeric(8,0) UNIQUE REFERENCES pp.user(user_id) ON DELETE CASCADE,
    qualification  varchar(150),
    experience_yrs int CHECK (experience_yrs >= 0),
    doj            date,  
    contact_no     varchar(12),
    created_at     timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at     timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by     numeric(8,0) REFERENCES pp.user(user_id),
    updated_by     numeric(8,0) REFERENCES pp.user(user_id)
);

CREATE TABLE pp.teacher_subject (
    teacher_id int REFERENCES pp.teacher(teacher_id) ON DELETE CASCADE,
    subject_id int REFERENCES pp.subject(subject_id) ON DELETE CASCADE,
    PRIMARY KEY (teacher_id, subject_id)
);

CREATE TABLE pp.classroom (
    classroom_id   integer PRIMARY KEY DEFAULT nextval('pp.classroom_id_seq'),
    classroom_name varchar(100) NOT NULL, -- PHY09-DEEKSHA-01, PHY09-DEEKSHA-02
    subject_id     int REFERENCES pp.subject(subject_id) ON DELETE SET NULL,
    teacher_id     int REFERENCES pp.teacher(teacher_id) ON DELETE SET NULL,
    platform_id    int REFERENCES pp.teaching_platform(platform_id) ON DELETE SET NULL,
    description    varchar(200),
    active_yn      char(1) DEFAULT 'Y' CHECK (active_yn IN ('Y','N')),
    class_link     varchar(150),
    created_at     timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at     timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by     numeric(8,0) REFERENCES pp.user(user_id),
    updated_by     numeric(8,0) REFERENCES pp.user(user_id)
);

-- A single classroom like PHY09-DEEKSHA-01 can be associated with multiple batches.
CREATE TABLE pp.classroom_batch (
    classroom_id int REFERENCES pp.classroom(classroom_id) ON DELETE CASCADE,
    batch_id     int REFERENCES pp.batch(batch_id) ON DELETE CASCADE,
    PRIMARY KEY(classroom_id, batch_id)
);

CREATE TABLE pp.timetable (
    timetable_id  integer PRIMARY KEY DEFAULT nextval('pp.timetable_id_seq'),
    classroom_id  int REFERENCES pp.classroom(classroom_id),
    day_of_week   varchar(10) CHECK(day_of_week IN ('SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY')),
    start_time    time NOT NULL,
    end_time      time NOT NULL,
    UNIQUE(classroom_id, day_of_week),
    created_at    timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at    timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by    numeric(8,0) REFERENCES pp.user(user_id),
    updated_by    numeric(8,0) REFERENCES pp.user(user_id)
);

CREATE TABLE pp.student_attendance (
    attendance_id integer PRIMARY KEY DEFAULT nextval('pp.attendance_id_seq'),
    student_id    numeric(14,0) REFERENCES pp.student_master(student_id) ON DELETE CASCADE,
    classroom_id  int REFERENCES pp.classroom(classroom_id),
    date          date NOT NULL,
    start_time    time NOT NULL,
    end_time      time NOT NULL,
    status        varchar(20) CHECK(status IN ('PRESENT','ABSENT','LATE JOINED','LEAVE')) NOT NULL,
    remarks       varchar(200),
    UNIQUE(student_id, date, classroom_id, start_time, end_time),
    created_at    timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at    timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by    numeric(8,0) REFERENCES pp.user(user_id),
    updated_by    numeric(8,0) REFERENCES pp.user(user_id)
);


CREATE TABLE pp.system_config (
    system_config_id  INTEGER PRIMARY KEY DEFAULT nextval('pp.system_config_id_seq'),
    academic_year     VARCHAR(9) NOT NULL,         -- e.g. "2025-26"
    phase             VARCHAR(50) NOT NULL,        -- e.g. "Admissions in Progress"
    is_active         BOOLEAN DEFAULT TRUE,        -- active/inactive toggle
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_academic_year_format 
        CHECK (academic_year ~ '^[0-9]{4}-[0-9]{2,4}$')  -- allows '2025-26' or '2025-2026'
);

CREATE OR REPLACE FUNCTION pp_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_system_config_timestamp
BEFORE UPDATE ON pp.system_config
FOR EACH ROW
EXECUTE FUNCTION pp_update_timestamp();




