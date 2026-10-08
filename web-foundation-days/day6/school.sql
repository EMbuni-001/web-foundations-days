PRAGMA foreign_keys = ON;

-- Fix sqliteonline's error by safely removing existing tables to prevent "already exists" errors
DROP TABLE IF EXISTS enrolments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;

-- 1. Students table
CREATE TABLE students (
  id    INTEGER PRIMARY KEY,
  name  TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE  
);

-- 2. Courses table
CREATE TABLE courses (
  id    INTEGER PRIMARY KEY,
  title TEXT NOT NULL
);

-- 3. Enrollment table (The Join Table)
CREATE TABLE enrolments (
  student_id INTEGER NOT NULL,
  course_id  INTEGER NOT NULL,
  grade      TEXT, -- e.g., 'A', 'B', 'Pass'
  
  PRIMARY KEY (student_id, course_id), 
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Students
INSERT INTO students (name, email) VALUES ('Gladys Otieno', 'got2026@example.com');
INSERT INTO students (name, email) VALUES ('Joel Kwemei', 'jkwemei@example.com');
INSERT INTO students (name, email) VALUES ('Mary Wahu', 'wahu@example.com');

-- Courses
INSERT INTO courses (title) VALUES ('Food Nutrition');
INSERT INTO courses (title) VALUES ('Philosophical Principles');
INSERT INTO courses (title) VALUES ('Airline Management');

-- Enrolments
-- Gladys Otieno Food Nutrition Course
INSERT INTO enrolments (student_id, course_id, grade) VALUES (1, 1, 'A');
INSERT INTO enrolments (student_id, course_id, grade) VALUES (1, 2, 'B');
-- Joel Kwemei Philosophical Principles Course 
INSERT INTO enrolments (student_id, course_id, grade) VALUES (2, 1, 'A');
-- Mary Wahu Airline Management Course
INSERT INTO enrolments (student_id, course_id, grade) VALUES (3, 2, 'B');
INSERT INTO enrolments (student_id, course_id, grade) VALUES (3, 3, 'A');

-- QUERY 1: All courses for one student (by name)
-- Join students to enrolments and courses
SELECT courses.title 
FROM students
JOIN enrolments ON students.id = enrolments.student_id
JOIN courses ON enrolments.course_id = courses.id
WHERE students.name = 'Gladys Otieno';

-- QUERY 2: All students on one course
-- Join courses to enrolments and students
SELECT students.name 
FROM courses
JOIN enrolments ON courses.id = enrolments.course_id
JOIN students ON enrolments.student_id = students.id
WHERE courses.title = 'Food Nutrition';

-- QUERY 3: The number of students per course
-- GROUP BY and COUNT
SELECT courses.title, COUNT(enrolments.student_id) AS student_count
FROM courses
LEFT JOIN enrolments ON courses.id = enrolments.course_id
GROUP BY courses.id;

-- QUERY 4: Students who have no enrolments
-- Use LEFT JOIN to keep all students, then filter for NULL enrolments.
SELECT students.name
FROM students
LEFT JOIN enrolments ON students.id = enrolments.student_id
WHERE enrolments.course_id IS NULL; 

-- QUERY 5: Update enrolment grade
UPDATE enrolments 
SET grade = 'A+' 
WHERE student_id = 2 AND course_id = 1;