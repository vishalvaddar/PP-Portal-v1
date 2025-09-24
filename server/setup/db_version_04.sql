-- Drop all tables if exist
DROP TABLE IF EXISTS 
    pp.tab_assignment_history,
    pp.batch_coordinator_batches,
    pp.batch,
    pp.cohort,
    pp.student_interview,
    pp.interviewer,
    pp.home_verification,
    pp.rejection_reasons,
    pp.applicant_exam_attendance,
    pp.exam_results,
    pp.applicant_exam,
    pp.examination,
    pp.applicant_shortlist_info,
    pp.shortlist_batch_jurisdiction,
    pp.shortlist_batch,
    pp.shortlist_criteria,
    pp.pp_exam_centre,
    pp.sibling_education,
    pp.applicant_secondary_info,
    pp.applicant_primary_info,
    pp.institute,
    pp.institute_type,
    pp.officer_desig,
    pp.edudesig,
    pp.eduofficer,
    pp.jurisdiction,
    pp.jurisdiction_type,
    pp.user_role,
    pp.role,
    pp.user,
    pp.tab_inventory,
    pp.student_master,
    pp.system_config,
    pp.subject,
    pp.platform,
    pp.timetable_slot
CASCADE;

-- Drop sequences
DROP SEQUENCE IF EXISTS 
    pp.user_id_seq,
    pp.role_id_seq,
    pp.jurisdiction_code_seq,
    pp.officer_id_seq,
    pp.desig_id_seq,
    pp.institute_id_seq,
    pp.applicant_id_seq,
    pp.criteria_id_seq,
    pp.verification_id_seq,
    pp.interviewer_id_seq,
    pp.interview_id_seq,
    pp.evaluation_id_seq,
    pp.shortlist_batch_id_seq,
    pp.sibling_education_seq,
    pp.pp_exam_centre_seq,
    pp.shortlist_info_seq,
    pp.examination_seq,
    pp.cohort_seq,
    pp.batch_id_seq,
    pp.tab_id_seq,
    pp.student_id_seq,
    pp.subject_seq,
    pp.platform_seq,
    pp.timetable_slot_seq
CASCADE;

-- Drop schema
DROP SCHEMA IF EXISTS pp CASCADE;

-- Recreate schema
CREATE SCHEMA IF NOT EXISTS pp;

-- Recreate sequences
CREATE SEQUENCE pp.user_id_seq             START 1;
CREATE SEQUENCE pp.role_id_seq             START 1;
CREATE SEQUENCE pp.jurisdiction_code_seq   START 1;
CREATE SEQUENCE pp.officer_id_seq          START 1;
CREATE SEQUENCE pp.desig_id_seq            START 1;
CREATE SEQUENCE pp.institute_id_seq        START 1;
CREATE SEQUENCE pp.applicant_id_seq        START 1;
CREATE SEQUENCE pp.criteria_id_seq         START 1;
CREATE SEQUENCE pp.verification_id_seq     START 1;
CREATE SEQUENCE pp.interviewer_id_seq      START 1;
CREATE SEQUENCE pp.interview_id_seq        START 1;
CREATE SEQUENCE pp.evaluation_id_seq       START 1;
CREATE SEQUENCE pp.shortlist_batch_id_seq  START 1;
CREATE SEQUENCE pp.sibling_education_seq   START 1;
CREATE SEQUENCE pp.pp_exam_centre_seq      START 1;
CREATE SEQUENCE pp.shortlist_info_seq      START 1;
CREATE SEQUENCE pp.examination_seq         START 1;
CREATE SEQUENCE pp.cohort_seq              START 1;
CREATE SEQUENCE pp.batch_id_seq            START 1;   -- for pp.batch.batch_id
CREATE SEQUENCE pp.tab_id_seq              START 1;   -- for pp.tab_inventory.tab_id
CREATE SEQUENCE pp.student_id_seq          START 1;   -- for pp.student_master.student_id
CREATE SEQUENCE pp.subject_seq             START 1;
CREATE SEQUENCE pp.platform_seq            START 1;
CREATE SEQUENCE pp.timetable_slot_seq      START 1;


CREATE TABLE pp.user (
    user_id      numeric(8,0)    PRIMARY KEY DEFAULT nextval('pp.user_id_seq'),
    user_name    varchar(100)    NOT NULL,
    enc_password varchar(300),
    locked_yn    char(1)
);

-- Role Table
CREATE TABLE pp.role (
    role_id     numeric(4,0) PRIMARY KEY DEFAULT nextval('pp.role_id_seq'),
    role_name   varchar(100) NOT NULL, 
    active_yn   char(1)
);

CREATE TABLE pp.user_role (
    user_id numeric(8,0) REFERENCES pp.user(user_id),
    role_id numeric(4,0) REFERENCES pp.role(role_id),
    PRIMARY KEY (user_id, role_id)
);

-- Jurisdiction Type
CREATE TABLE pp.jurisdiction_type (
    juris_type  varchar(100) PRIMARY KEY
);

-- Jurisdiction (Self-Referencing)
CREATE TABLE pp.jurisdiction (
    juris_code      numeric(14,0) PRIMARY KEY DEFAULT nextval('pp.jurisdiction_code_seq'),
    juris_name      varchar(200),
    juris_type      varchar(100) REFERENCES pp.jurisdiction_type(juris_type),
    parent_juris    numeric(14,0) REFERENCES pp.jurisdiction(juris_code)
);

-- Education Officer
CREATE TABLE pp.eduofficer (
    officer_id    numeric(14,0) PRIMARY KEY DEFAULT nextval('pp.officer_id_seq'),
    officer_name  varchar(100),
    phone1        varchar(15),
    phone2        varchar(15),
    email         varchar(100)
);

-- Designation
CREATE TABLE pp.edudesig (
    desig_id    numeric(14,0) PRIMARY KEY DEFAULT nextval('pp.desig_id_seq'),
    desig_name  varchar(100)
);

CREATE TABLE pp.officer_desig (
    officer_id  numeric(14,0) REFERENCES pp.eduofficer(officer_id),
    juris_code  numeric(14,0) REFERENCES pp.jurisdiction(juris_code),
    desig_id    numeric(14,0) REFERENCES pp.edudesig(desig_id),
    other_desig varchar(100),
    PRIMARY KEY (officer_id, desig_id, juris_code)
);

-- Institute Type
CREATE TABLE pp.institute_type (
    institute_type_id   numeric(4,0) PRIMARY KEY,
    institute_type_name varchar(100) NOT NULL
);

-- Institute
CREATE TABLE pp.institute (
    institute_id           numeric(14,0) PRIMARY KEY DEFAULT nextval('pp.institute_id_seq'),
    dise_code              numeric(13,0) UNIQUE,
    institute_name         varchar(200),
    address                varchar(200),
    email                  varchar(200),
    contact_no             varchar(12),
    institute_type_id      numeric(4,0) REFERENCES pp.institute_type(institute_type_id),
    juris_code             numeric(14,0) REFERENCES pp.jurisdiction(juris_code)
);

-- Applicant Tables
CREATE TABLE pp.applicant_primary_info (
    applicant_id       numeric(14,0) PRIMARY KEY DEFAULT nextval('pp.applicant_id_seq'),
    nmms_year          numeric(4,0),
    nmms_reg_number    numeric(11,0) UNIQUE NOT NULL,
    app_state          numeric(12,0) REFERENCES pp.jurisdiction(juris_code),
    district           numeric(12,0) REFERENCES pp.jurisdiction(juris_code),
    nmms_block         numeric(12,0) REFERENCES pp.jurisdiction(juris_code),
    student_name       varchar(200),
    father_name        varchar(200),
    mother_name        varchar(100),
    gmat_score         numeric(2,0),
    sat_score          numeric(2,0),
    gender             char(1) CHECK (gender IN ('M', 'F', 'O')),
    medium             varchar(50),
    aadhaar            varchar(12),
    DOB                date,
    home_address       varchar(200),
    family_income_total numeric(7,0),
    contact_no1        varchar(12),
    contact_no2        varchar(12),
    current_institute_dise_code  numeric(14,0) REFERENCES pp.institute(dise_code),
    previous_institute_dise_code numeric(14,0) REFERENCES pp.institute(dise_code)
);

CREATE TABLE pp.applicant_secondary_info (
    applicant_id            numeric(14,0) PRIMARY KEY REFERENCES pp.applicant_primary_info(applicant_id),
    village                 varchar(100),
    father_occupation       varchar(100),
    mother_occupation       varchar(100),
    father_education        varchar(100),
    mother_education        varchar(100),
    household_size          numeric(3,0),
    own_house               char(1) CHECK (own_house IN ('Y', 'N')),
    smart_phone_home        char(1) CHECK (smart_phone_home IN ('Y', 'N')),
    internet_facility_home  char(1) CHECK (internet_facility_home IN ('Y', 'N')),
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
    favorite_teacher_phone  varchar(12)
);

CREATE TABLE pp.sibling_education (
    sibling_id        numeric(14,0) PRIMARY KEY DEFAULT nextval('pp.sibling_education_seq'),
    applicant_id      numeric(14,0) REFERENCES pp.applicant_primary_info(applicant_id) ON DELETE CASCADE,
    sibling_type      char(1) NOT NULL CHECK (sibling_type IN ('B', 'S')),
    education_status  varchar(255)
);

CREATE TABLE pp.pp_exam_centre (
    pp_exam_centre_id     numeric(10,0) PRIMARY KEY DEFAULT nextval('pp.pp_exam_centre_seq'),
    pp_exam_centre_name   varchar(200) NOT NULL
);

CREATE TABLE pp.shortlist_criteria (
    criteria_id   numeric(3,0) PRIMARY KEY DEFAULT nextval('pp.criteria_id_seq'),
    criteria      varchar(500)
);

CREATE TABLE pp.shortlist_batch (
    shortlist_batch_id   numeric(6,0) PRIMARY KEY DEFAULT nextval('pp.shortlist_batch_id_seq'),
    shortlist_batch_name varchar(100) NOT NULL,
    description          varchar(200),
    created_on           timestamp DEFAULT now(),
    criteria_id          numeric(3,0) REFERENCES pp.shortlist_criteria(criteria_id),
    frozen_yn            char(1) DEFAULT 'N' CHECK (frozen_yn IN ('Y','N'))
);


CREATE TABLE pp.shortlist_batch_jurisdiction (
    shortlist_batch_id numeric(6,0) REFERENCES pp.shortlist_batch(shortlist_batch_id) ON DELETE CASCADE,
    juris_code         numeric(12,0) REFERENCES pp.jurisdiction(juris_code) ON DELETE CASCADE,
    PRIMARY KEY (shortlist_batch_id, juris_code)
);

-- Shortlist Information
CREATE TABLE pp.applicant_shortlist_info (
    shortlist_info_id  numeric(14,0) PRIMARY KEY DEFAULT nextval('pp.shortlist_info_seq'),
    applicant_id       numeric(14,0) REFERENCES pp.applicant_primary_info(applicant_id),
    shortlisted_yn     char(1) CHECK (shortlisted_yn IN ('Y', 'N'))
);

CREATE TABLE pp.examination (
    exam_id            numeric(14,0) PRIMARY KEY DEFAULT nextval('pp.examination_seq'),
    exam_name          varchar(100) NOT NULL,
    exam_date          date NOT NULL,
    pp_exam_centre_id  numeric(10,0) REFERENCES pp.pp_exam_centre(pp_exam_centre_id),
    frozen_yn          char(1) DEFAULT 'N' CHECK (frozen_yn IN ('Y','N'))
);

CREATE TABLE pp.applicant_exam (
    applicant_id      numeric(14,0) PRIMARY KEY REFERENCES pp.applicant_primary_info(applicant_id),
    exam_id           numeric(14,0) REFERENCES pp.examination(exam_id),
    pp_hall_ticket_no varchar(20)   UNIQUE
);

CREATE TABLE pp.exam_results (
    applicant_id     numeric(14,0) REFERENCES pp.applicant_primary_info(applicant_id),
    pp_exam_score    numeric(3,0),
    pp_exam_cleared  char(1) CHECK (pp_exam_cleared IN ('Y', 'N')),
	interview_required_yn char(1) CHECK (interview_required_yn IN ('Y','N'))
);

CREATE TABLE pp.applicant_exam_attendance
(
    applicant_id         numeric(14,0) REFERENCES pp.applicant_primary_info(applicant_id),
    pp_exam_appeared_yn  char(1) CHECK (pp_exam_appeared_yn IN ('Y', 'N'))
);

-- Rejection Reasons
CREATE TABLE pp.rejection_reasons (
    rej_reason_id    numeric(4,0) PRIMARY KEY,  
    rejection_reason varchar(200) NOT NULL
);

-- Home Verification
CREATE TABLE pp.home_verification (
    verification_id        numeric(12,0) PRIMARY KEY DEFAULT nextval('pp.verification_id_seq'),
    applicant_id           numeric(14,0) REFERENCES pp.applicant_primary_info(applicant_id),
    date_of_verification   date,
    remarks                varchar(200),
    status                 varchar(10) CHECK (status IN ('Pending','Scheduled', 'Rejected','Accepted')),
    verified_by            varchar(100),
    next_verification_date date,
    rejection_reason_id    numeric(4,0) REFERENCES pp.rejection_reasons(rej_reason_id),
    verification_type      varchar(20) CHECK (verification_type IN ('Physical', 'Virtual'))
);

-- Interviewer
CREATE TABLE pp.interviewer (
    interviewer_id    numeric(10,0) PRIMARY KEY DEFAULT nextval('pp.interviewer_id_seq'),
    interviewer_name  varchar(200),
    email             varchar(100),
    mobile1           varchar(12),
    mobile2           varchar(12),
    active_status     char(1) CHECK (active_status IN ('Y', 'N'))
);

-- Student Interview
CREATE TABLE pp.student_interview (
    interview_id               numeric(12,0) PRIMARY KEY DEFAULT nextval('pp.interview_id_seq'),
    applicant_id               numeric(14,0) REFERENCES pp.applicant_primary_info(applicant_id),
    interviewer_id             numeric(10,0) REFERENCES pp.interviewer(interviewer_id),
    interview_date             date,
    interview_time             time,
    interview_mode             varchar(20) CHECK (interview_mode IN ('Online', 'Offline')),
    interview_round            int,
    status                     varchar(15) CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'Rescheduled')),
    life_goals_and_zeal        numeric(3,1),
    commitment_to_learning     numeric(3,1),
    integrity                  numeric(3,1),
    communication_skills       numeric(3,1),
    interview_result           varchar(15) CHECK (interview_result IN ('Accepted', 'Rejected')),
    home_verification_req_yn   char(1) CHECK (home_verification_req_yn IN ('Y', 'N')) DEFAULT 'N'
);


CREATE TABLE pp.cohort (
    cohort_number      integer PRIMARY KEY DEFAULT nextval('pp.cohort_seq'),
    cohort_name        varchar(100),
    start_date         date,
    end_date           date,
    description        text
);

CREATE TABLE pp.batch (
    batch_id        integer PRIMARY KEY DEFAULT nextval('pp.batch_id_seq'),
    batch_name      varchar(100),
    cohort_number   integer REFERENCES pp.cohort(cohort_number),
    UNIQUE (cohort_number, batch_name)
);

CREATE TABLE pp.batch_coordinator_batches
(
    user_id     numeric(8,0) REFERENCES pp.user(user_id),
    batch_id    integer REFERENCES pp.batch(batch_id),
    PRIMARY KEY (user_id, batch_id)
);


CREATE TABLE pp.tab_inventory (
    tab_id          numeric(10,0) PRIMARY KEY DEFAULT nextval('pp.tab_id_seq'),
    serial_number   varchar(100) UNIQUE NOT NULL,
    brand           varchar(50),
    model           varchar(50),
    status          varchar(20) 
                    CHECK (status IN ('available', 'assigned', 'returned', 'damaged', 'lost')) 
                    DEFAULT 'available',
    remarks         text
);


CREATE TABLE pp.tab_assignment_history (
    tab_id         integer REFERENCES pp.tab_inventory(tab_id),
    applicant_id   numeric(14,0) REFERENCES pp.applicant_primary_info(applicant_id),
    assignment_date date NOT NULL,
    return_date     date,
    PRIMARY KEY (tab_id, applicant_id, assignment_date)
);


CREATE TABLE pp.student_master (
    student_id                   numeric(14,0) PRIMARY KEY DEFAULT nextval('pp.student_id_seq'),  
    applicant_id                 numeric(14,0) UNIQUE REFERENCES pp.applicant_primary_info(applicant_id),  
    enr_id                       numeric(11,0) UNIQUE,    
    student_name                 varchar(200),
    father_name                  varchar(200),
    mother_name                  varchar(100),
    gender                       char(1) CHECK (gender IN ('M', 'F', 'O')),
  
    batch_id                     integer REFERENCES pp.batch(batch_id), 
    sim_name                     varchar(10),
    student_email                varchar(150),
    parent_email                 varchar(150),
    photo_link                   text,
    home_address                 varchar(200),

    contact_no1                  varchar(12),
    contact_no2                  varchar(12),

    current_institute_dise_code  numeric(14,0) REFERENCES pp.institute(dise_code),
    previous_institute_dise_code numeric(14,0) REFERENCES pp.institute(dise_code)
);

CREATE TABLE pp.system_config (
    id SERIAL PRIMARY KEY,
    academic_year VARCHAR(9) NOT NULL,  -- e.g. "2025-26"
    phase VARCHAR(50) NOT NULL,         -- e.g. "Admissions in Progress"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE pp.system_config
ADD CONSTRAINT chk_academic_year_format
CHECK (academic_year ~ '^[0-9]{4}-[0-9]{2,4}$');


CREATE TABLE pp.subject (
    subject_id    integer PRIMARY KEY DEFAULT nextval('pp.subject_seq'),
    subject_name  varchar(100) NOT NULL UNIQUE
);

CREATE TABLE pp.platform (
    platform_id   integer PRIMARY KEY DEFAULT nextval('pp.platform_seq'),
    platform_name varchar(100) NOT NULL UNIQUE
);

CREATE TABLE pp.timetable_slot (
    slot_id       integer PRIMARY KEY DEFAULT nextval('pp.timetable_slot_seq'),
    
    -- Foreign key to your existing batch table
    batch_id      integer REFERENCES pp.batch(batch_id) ON DELETE CASCADE,
    
    -- Foreign key to your existing user table (assuming teachers are users)
    teacher_id    numeric(8,0) REFERENCES pp.user(user_id) ON DELETE SET NULL,
    
    -- Foreign keys to the new tables created above
    subject_id    integer REFERENCES pp.subject(subject_id) ON DELETE SET NULL,
    platform_id   integer REFERENCES pp.platform(platform_id) ON DELETE SET NULL,
    
    day_of_week   varchar(10) NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time    time NOT NULL,
    end_time      time,
    
    -- Ensures that a teacher cannot be scheduled for two classes at the same time
    UNIQUE (teacher_id, day_of_week, start_time)
);
