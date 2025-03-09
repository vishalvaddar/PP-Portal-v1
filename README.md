# database name
- student
- DB_USER=postgres
DB_HOST=127.0.0.1
DB_DATABASE=dummydb
DB_PASSWORD=123
DB_PORT=5432
PORT=5000

- CREATE TABLE student (
    id SERIAL PRIMARY KEY,
    nmms_reg_number VARCHAR(50) NOT NULL,
    student_name VARCHAR(100) NOT NULL,
	medium VARCHAR(10) NOT NULL,
	parent_no VARCHAR(15),
	school_hm_no VARCHAR(15),
	school_name Varchar(100),
	school_type VARCHAR(50),
	district_name VARCHAR(50),
	block_name VARCHAR(50),
    gmat_score INT CHECK (gmat_score >= 0) NOT NULL,
    sat_score INT CHECK (sat_score >= 0) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


- To run the backend
	use -- "npm run dev" command

- To run Frontend
	use -- "npm start" command

	done by shashi