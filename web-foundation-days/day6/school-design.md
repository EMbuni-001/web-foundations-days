
# School Database Design

## Tables and Relationships
Our database consists of three tables:
1. **students**: Holds individual student details.
2. **courses**: Holds individual course details.
3. **enrolments**: This is our **join table**. 

**Relationships:**
* The relationship between a Student and an Enrolment is **One-to-Many** (one student can have many enrolments).
* The relationship between a Course and an Enrolment is **One-to-Many** (one course can have many enrolments).
* Because a Student can take many Courses, and a Course can have many Students, the relationship between Students and Courses is **Many-to-Many**. We need the `enrolments` join table to resolve this Many-to-Many relationship, storing the `student_id`, `course_id`, and the `grade` for that specific pairing.

## Indexing
I would add an index on the `student_id` column in the `enrolments` table:
`CREATE INDEX idx_enrolments_student_id ON enrolments(student_id);`
**Reason:** Just like the lesson notes explained with the phonebook analogy, an index makes reads much faster. Since we will frequently search for "all courses for a specific student", indexing `student_id` allows the database to jump straight to that student's records without scanning the entire enrolments table. *(Note: Primary keys and UNIQUE columns like email are indexed automatically, so we don't need to manually index them).*

## SQL vs. NoSQL Choice
I would choose a **SQL (Relational) Database** for this system. 
According to the lesson notes, SQL is excellent for data that is clearly structured with strict relationships. A school system has highly structured data (students, courses) with clear Many-to-Many relationships resolved by join tables. Furthermore, school records require strict rules (like unique emails and preventing duplicate enrolments) and data correctness (grades must be accurate). SQL databases enforce these rules via schemas and foreign keys, and support ACID transactions, making them the perfect fit over a flexible NoSQL document database.