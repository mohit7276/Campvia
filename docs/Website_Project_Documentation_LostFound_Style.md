# INDEX

| Chapter | Page No. |
|---|---|
| **1. Introduction** | |
| 1.1 College Profile | |
| 1.2 Project description | |
| 1.3 Project Profile | |
| **2. Environment Description** | |
| 2.1 Hardware and Software Requirements | |
| 2.2 Technologies Used [Max 2 pages] | |
| **3. System Analysis and Planning** | |
| 3.1 Existing System and its Drawbacks | |
| 3.2 Feasibility Study | |
| 3.3 Requirement Gathering and Analysis | |
| **4. Proposed System** | |
| 4.1 Scope | |
| 4.2 Project modules (Module-wise objectives/functionalities Constraints) | |
| 4.3 Expected Advantages | |
| **5. Detail Planning** | |
| 5.1 Data Flow Diagram | |
| 5.2 Process Specification | |
| 5.3 Data Dictionary | |
| 5.4 Entity-Relationship Diagram | |
| **6. System Design** | |
| 6.1 Database Design | |
| 6.2 Directory Structure | |
| 6.3 Input Layouts | |
| **7. System Testing [Test Cases]** | |
| **8. Limitations and Future Scope of Enhancements** | |
| **References** | |

---

## 1. Introduction

### 1.1 College Profile
**Brief Explanation:** Describes the institution (Campvia) and its primary users, workflows, and administrative goals meant to be digitized by the system.

Campvia Institute is a leading academic institution focused on providing a comprehensive, digitized learning environment for students, faculty, and administrators. The institution manages complex workflows, including student admissions, course assignments, daily attendance tracking, fee collection, and examination scheduling. To support its modern educational approach, Campvia relies on a robust digital campus management platform.

### 1.2 Project Description
In the fast-paced digital era, educational institutions require efficient, scalable, and user-friendly systems to manage academic, administrative, and communication workflows. Campvia is a comprehensive web-based campus management platform designed to streamline attendance tracking, course operations, fee management, assessments, and student-faculty interaction.

The primary goal of this project is to create a centralized digital platform where students, faculty, and administrators can access role-specific services in a secure and organized way. The system offers integrated dashboards, academic records, schedules, notices, and intelligent support utilities to reduce manual work and improve institutional efficiency.

The system features three major role-based panels: Student panel, Faculty panel, and Admin panel.

Students can securely log in, view attendance, upcoming tests, exam scores, fee status, timetable, study materials, personal to-do items, and notices relevant to their courses. They can also complete fee payments through an integrated Razorpay payment flow and interact with an AI-powered chatbot for quick support.

Faculty users can manage attendance, assignments, notices, and score updates for their assigned classes, while monitoring student progress through a focused academic interface.

Admins have complete control over institution-level operations. They can add, update, and manage students, faculty, courses, lectures, tests, exams, fees, schedules, notices, and analytics. This ensures consistency in academic data and improves governance across departments.

By leveraging Angular on the frontend, Node.js/Express on the backend, and MongoDB for data persistence, Campvia replaces fragmented or manual campus processes with an automated, transparent, and maintainable solution that improves both user experience and operational productivity.

### 1.3 Project Profile

Code snippet
Attribute,Details
Project Title,Campvia - Academic Management Website
Organization,Campvia Institute
Front End,"Angular, TypeScript, HTML, CSS, Tailwind CSS"
Back End,"Node.js, Express.js"
Technology,Web Application
Development Tool,Visual Studio Code
Operating System,Windows
Documentation Tool,Microsoft Word
Supported Runtime,Node.js LTS
Internal Guide,Project Mentor
Submitted To,Department/Institute Authority
Developed By,Campvia Development Team

---

## 2. Environment Description

### 2.1 Hardware & Software Requirements

**A. Hardware Requirements:**

Code snippet
Component,Specification
OS,64-bit Microsoft Windows 10 or Above
CPU,"x86_64 CPU architecture; Intel Core i3 (or equivalent) and above"
RAM,Minimum 8 GB RAM
Disk space,10 GB or More Free Space
Web Browsers,"Google Chrome, Mozilla Firefox, Microsoft Edge, Safari (latest versions recommended)"

**B. Software Requirements:**

Code snippet
Component,Specification
OS,64-bit Microsoft Windows 10 or Above
Technology,Web Application
Development Software,Visual Studio Code
Front End,"Angular, TypeScript, HTML, CSS, Tailwind CSS"
Back End,"Node.js, Express.js"
API Testing,Postman
Browser,"Google Chrome, Brave, Microsoft Edge"
Database,MongoDB
Package Manager,npm

### 2.2 Technologies Used
The development of Campvia relies on a modern full-stack web architecture. The platform combines a component-based frontend, RESTful backend services, secure authentication, and cloud-ready integrations to provide a seamless experience for students, faculty, and administrators.

**1. Angular**

**Role:** Frontend Framework

**Description:** Angular is used to build Campvia's single-page application with modular, reusable components and route-based navigation. It enables role-based dashboards, dynamic rendering of academic data, and maintainable UI architecture.

**Specific Uses in this Project:**
*   Student, faculty, and admin dashboard components.
*   Form-driven pages for attendance, notices, fees, scores, and schedules.
*   Route guards/interceptors for protected navigation and authenticated API calls.

**2. TypeScript**

**Role:** Typed Language for Frontend and Backend Safety

**Description:** TypeScript adds static typing and improved tooling support, reducing runtime errors and improving code maintainability for large modules and shared models.

**Specific Uses in this Project:**
*   Strongly typed interfaces for users, courses, fees, tests, and notices.
*   Better IDE support and refactoring safety across components and services.

**3. Tailwind CSS + CSS**

**Role:** Styling and Responsive UI

**Description:** Tailwind CSS and custom CSS are used to create responsive, clean, and consistent interfaces across all Campvia panels.

**Specific Uses in this Project:**
*   Responsive layouts for desktop and mobile.
*   Reusable utility-driven styling for cards, forms, tables, and navigation.

**4. Node.js**

**Role:** JavaScript Runtime for Backend Services

**Description:** Node.js powers Campvia's server-side execution, handling asynchronous operations and API throughput efficiently.

**Specific Uses in this Project:**
*   Running backend services and business logic.
*   Handling I/O-heavy operations like uploads and API integrations.

**5. Express.js**

**Role:** Web Framework for REST APIs

**Description:** Express.js provides the routing and middleware layer for all backend endpoints.

**Specific Uses in this Project:**
*   Role-based API routes (admin, faculty, student).
*   Authentication middleware and request validation.
*   Upload handling and resource management routes.

**6. MongoDB + Mongoose**

**Role:** Database and Data Modeling

**Description:** MongoDB stores all operational data, while Mongoose manages schemas, validation, and structured interaction with collections.

**Specific Uses in this Project:**
*   Collections for students, faculty, courses, lectures, attendance, exams, fees, notices, todos, and study materials.
*   Query and update operations for role-specific dashboard features.

**7. JWT + bcryptjs**

**Role:** Security and Authentication

**Description:** JWT-based authentication and bcrypt password hashing secure login and API access.

**Specific Uses in this Project:**
*   Token-based session management.
*   Password hashing and secure credential verification.

**8. Razorpay API**

**Role:** Payment Gateway Integration

**Description:** Razorpay is integrated for secure digital fee payment processing.

**Specific Uses in this Project:**
*   Order creation, payment validation, and fee status updates.

**9. Google Gemini API**

**Role:** AI Assistant Integration

**Description:** Gemini API powers chatbot interactions for quick student/faculty support.

**Specific Uses in this Project:**
*   Query handling and contextual responses through Campvia chatbot components.

## 3. System Analysis and Planning

### 3.1 Existing System and its Drawbacks
**Brief Explanation:** Evaluates the manual and semi-digital campus process that existed before Campvia and explains why a unified website was required.

Before Campvia, most institutional operations were handled through disconnected methods such as physical registers, standalone spreadsheets, messaging groups, and ad hoc notice circulation. This approach created duplication, delays, and reporting inaccuracies across departments.

**Observed Drawbacks in Existing Process:**
- Attendance was recorded differently by each faculty member, making consolidated daily reporting difficult.
- Fee tracking depended on manual follow-up, resulting in delayed payment visibility for students and finance staff.
- Timetable updates and exam schedules were distributed across notice boards and chat groups, often causing version conflicts.
- Student academic performance was stored in fragmented sheets, which made semester-wise analytics slow and error-prone.
- Study materials were shared through personal channels, creating issues in version control and equitable access.
- Administrative actions (course allocation, notices, profile corrections) required repeated data entry in multiple places.
- There was no centralized audit trail for who updated records and when changes occurred.

**Impact on Stakeholders:**
- Students lacked real-time visibility for attendance percentage, fee dues, and upcoming assessments.
- Faculty spent extra administrative time on repetitive record maintenance instead of academic tasks.
- Admin teams faced higher operational load during admissions, exams, and fee cycles.
- Institutional leadership had limited dashboards for decision-making and performance monitoring.

### 3.2 Feasibility Study
**Brief Explanation:** Validates Campvia implementation viability across technical, economic, operational, legal, and timeline dimensions.

**Technical Feasibility:**
- Frontend is built using Angular, which is suitable for large, component-driven, role-based web portals.
- Backend uses Node.js and Express.js, allowing scalable API design and efficient asynchronous processing.
- MongoDB supports flexible academic data structures, including notices, attendance logs, and test records.
- Existing modules in the website codebase (auth, students, faculty, fees, attendance, notices, chat, study materials) already align with required business flows.
- Payment and chatbot integrations are feasible through Razorpay and Gemini APIs with secure server-side validation.

**Economic Feasibility:**
- The complete stack is largely open-source, reducing licensing and vendor lock-in costs.
- Deployment can begin on cost-effective cloud tiers and scale incrementally with user growth.
- Centralized workflows reduce administrative man-hours for repetitive tasks such as report generation and follow-up messaging.

**Operational Feasibility:**
- Role-based dashboards (Student, Faculty, Admin) map directly to existing campus responsibilities.
- The website interface supports quick onboarding because tasks are grouped by user role and business function.
- Centralized data improves inter-department communication and reduces dependency on offline reconciliation.

**Schedule Feasibility:**
- Campvia is modular, so features can be delivered in phases: authentication, academics, communication, payments, analytics.
- Parallel development is possible across frontend components and backend route groups.
- Testing can be performed module-by-module before full integration rollout.

**Legal and Security Feasibility:**
- Passwords are stored as hashes and role access is token-protected.
- Access to student records can be constrained by role and course association.
- Payment verification uses gateway signatures to prevent fraudulent status changes.

### 3.3 Requirement Gathering and Analysis
**Brief Explanation:** Captures stakeholder expectations and translates them into clearly defined functional and non-functional website requirements.

**Primary Stakeholders:**
- Students
- Faculty members
- Administrative staff
- Accounts/finance operators
- Institutional management

**Functional Requirements (Detailed):**
- User authentication and authorization for Admin, Faculty, and Student roles.
- Student profile and course-wise identity mapping.
- Attendance marking, view, and history tracking by lecture/date.
- Assignment posting, submission tracking, and evaluation workflows.
- Test and exam scheduling with score publishing support.
- Fee due creation, payment initiation, payment verification, and status updates.
- Notice publishing with audience targeting (course-specific or global).
- Timetable management and role-based timetable display.
- Study material upload/reference link sharing for enrolled learners.
- Personal to-do management for student productivity.
- Chatbot interaction for academic and portal-level assistance.
- Admin analytics for student count, payment status, attendance trends, and activity snapshots.

**Non-Functional Requirements (Detailed):**
- Performance: Fast dashboard load and efficient API response under normal academic traffic.
- Scalability: Ability to support increasing student and faculty records without redesign.
- Security: JWT-protected APIs, hashed passwords, role checks, and request validation.
- Availability: Reliable access during peak periods such as attendance windows and exam result publication.
- Usability: Intuitive navigation and responsive design across desktop and mobile devices.
- Maintainability: Modular frontend components and separated backend routes for easier enhancement.
- Reliability: Consistent transaction handling for payments and critical record updates.

**Data Inputs and Outputs Summary:**
- Inputs: Login credentials, profile forms, attendance actions, score entries, fee payment responses, notice content, study material files.
- Outputs: Personalized dashboards, receipts/status confirmations, progress metrics, notices, schedule views, and downloadable resources.

**Assumptions and Constraints:**
- Users access the platform through modern web browsers.
- Internet connectivity is required for real-time data and payment operations.
- Payment and chatbot features depend on third-party API availability and quotas.
- Role permissions are enforced server-side to avoid unauthorized access.

---

## 4. Proposed System

### 4.1 Scope
**Brief Explanation:** Defines Campvia's implementation boundary for the current release and clarifies extension areas for later versions.

**In Scope (Current Website Release):**
- Role-based authentication and dashboard routing for students, faculty, and admins.
- Student academic experience: attendance, scores, timetable, notices, study materials, to-do management.
- Faculty operations: attendance controls, score updates, notices, and academic communication.
- Admin operations: master data management for students, faculty, courses, lectures, tests, exams, fees, notices, and schedules.
- Integrated online fee workflow using Razorpay (order creation, verification, status update).
- AI chatbot support integration for quick user assistance.
- Centralized REST API-based communication between frontend and backend modules.

**Out of Scope (Current Release):**
- Dedicated native mobile applications.
- Parent/guardian self-service portal.
- Multi-campus tenancy and inter-campus data federation.
- Advanced BI data warehouse integration.
- Offline-first mode for low-connectivity environments.

**Scope Boundary Notes:**
- Campvia focuses on campus operations digitization, not full Learning Management System (LMS) content delivery.
- The website is optimized for institutional workflows and does not target public marketplace usage.

### 4.2 Project modules (Module-wise objectives/functionalities Constraints)
**Brief Explanation:** Decomposes Campvia into core modules with purpose, main functions, and operational constraints.

**Module 1: Authentication and Access Control**
- Objective: Provide secure role-aware login and controlled API access.
- Key Functionalities: Login validation, token issuance, role-based route protection, session verification.
- Constraints: All protected routes require valid JWT and role checks.

**Module 2: Student Experience Module**
- Objective: Offer one-stop academic visibility and self-service.
- Key Functionalities: Attendance view, fee status, score panel, timetable view, notices, study materials, to-do list.
- Constraints: Student can access only own records and assigned course data.

**Module 3: Faculty Operations Module**
- Objective: Enable faculty to manage class-level academic execution.
- Key Functionalities: Attendance updates, assignment/exam score entry, notice publishing, course-focused interactions.
- Constraints: Faculty actions restricted to mapped classes/courses.

**Module 4: Administration Module**
- Objective: Centralize institutional control and data governance.
- Key Functionalities: CRUD for users, courses, lectures, tests, exams, fee structures, schedules, and notices; statistics dashboard.
- Constraints: Admin-only access for master entity changes.

**Module 5: Attendance and Lecture Module**
- Objective: Capture reliable lecture-wise attendance and student participation records.
- Key Functionalities: Lecture creation, date-wise attendance marking, duplicate prevention, history retrieval.
- Constraints: Attendance is tied to valid lecture and enrolled student identity.

**Module 6: Exams, Tests, and Score Module**
- Objective: Manage assessments from schedule to result visibility.
- Key Functionalities: Test/exam configuration, score mapping, results publication status, student result display.
- Constraints: Result update permissions are role-restricted and course-scoped.

**Module 7: Fee and Payment Module**
- Objective: Digitize fee collection and reconciliation.
- Key Functionalities: Fee due records, Razorpay order flow, payment verification, paid/pending status updates.
- Constraints: Final payment status changes only after verified gateway response.

**Module 8: Notice and Communication Module**
- Objective: Standardize institutional communication.
- Key Functionalities: Targeted notice creation, category tagging, attachment support, student delivery by course/global scope.
- Constraints: Publish/edit rights limited to authorized users.

**Module 9: Study Material Module**
- Objective: Provide centralized access to academic resources.
- Key Functionalities: Material upload, external reference links, course-wise content grouping.
- Constraints: Access visibility depends on enrollment and role.

**Module 10: AI Chatbot Module**
- Objective: Improve user support and response speed for common portal queries.
- Key Functionalities: Prompt submission, contextual response generation, assistant panel rendering.
- Constraints: Feature quality depends on external AI API availability and usage limits.

**Module 11: Analytics and Monitoring Module**
- Objective: Provide actionable insights to admins.
- Key Functionalities: Summary statistics, trend snapshots for attendance and fee states, operational visibility.
- Constraints: Data quality depends on timely updates from all transactional modules.

**Inter-Module Dependency Highlights:**
- Authentication module is a prerequisite for all protected modules.
- Course and user master data drive attendance, exams, materials, notices, and fees.
- Payment module updates influence student dashboard and admin finance views.
- Notice and timetable modules directly impact day-to-day user engagement.

### 4.3 Expected Advantages
**Brief Explanation:** Summarizes measurable and practical institutional benefits from Campvia adoption.

**Academic Advantages:**
- Continuous visibility of attendance, scores, and deadlines improves student planning and outcomes.
- Faculty can execute academic workflows faster with less manual paperwork.

**Administrative Advantages:**
- Single-source data reduces duplicate entries and reconciliation overhead.
- Admin teams can process updates, notices, and schedules from one platform.

**Financial Advantages:**
- Online fee flow improves payment convenience and collection transparency.
- Verified payment updates reduce disputes and manual confirmation tasks.

**Communication Advantages:**
- Centralized notices and material sharing reduce dependency on fragmented channels.
- AI chatbot support improves response turnaround for routine queries.

**Technical Advantages:**
- Modular architecture supports phased upgrades without full system redesign.
- Clear separation of frontend and backend improves maintainability and testing.

**Institutional Growth Advantages:**
- The platform provides a foundation for future enhancements such as parent portal, mobile apps, and advanced analytics.
- Better reporting readiness supports data-driven decisions by management.

---

## 5. Detail Planning

### 5.1 Data Flow Diagram
**Brief Explanation:** Visual representations of how data enters, moves through, and leaves the Campvia system for different roles.
*(Since actual graphical diagrams cannot be inherently embedded without image paths, functional text representations are maintained as placeholders for DFDs)*

**Level 0 (Context):**
- Users (Admin, Faculty, Student) send requests to the Campvia System.
- The System interacts with external services (Razorpay, Gemini API).
- Responses, records, and reports are served back to respective Users based on their queries.

### 5.2 Process Specification


**1. Authentication Process**
- **Input:** Credentials (Email, Password) and User Role (Admin, Student, Faculty).
- **Process Description:** The system validates the email format, queries the database for the user role, and compares the password hash securely using bcrypt. Upon verification, it signs a session-length JWT.
- **Output:** Authorized JWT Token and standard User Profile JSON payload for dashboard redirection.

**2. Assignment Submission Process**
- **Input:** Target Assignment ID, Attached Files (via Multer), and Optional Link submissions.
- **Process Description:** The system verifies the student’s identity from the JWT, ensures the assignment deadline has not passed, uploads the file to the internal storage, and appends the path to the student's submission array within the MongoDB 'Assignment' document.
- **Output:** Unified success status metric 201 (Created) or 200 (Updated) and modified assignment visualization on the Student UI.

**3. Online Fee Payment Process**
- **Input:** Payment Amount Request, authenticated Student ID, Razorpay Order ID, Payment ID, and Crypto Signature.
- **Process Description:** System validates the transaction on both sides. First, an order is drafted in Razorpay. Post-checkout, the backend validates the HMAC SHA256 Signature; if matches, the linked Fee Document in the database flips from "Pending" to "Paid".
- **Output:** Payment confirmation acknowledgment and dynamic UI upgrade indicating the "Paid" status.

**4. Attendance Marking Process**
- **Input:** Lecture ID and Student ID (extracted from JWT).
- **Process Description:** The backend ensures that a lecture is currently ongoing within the requested timing window. It checks if the student's attendance has already been recorded to prevent duplicate entries, then registers a 'Present' status in the database.
- **Output:** Acknowledgement message "Attendance Marked Successfully" and updated daily status for the frontend.

**5. AI Chatbot Query Process**
- **Input:** Natural Language Prompt string from the User.
- **Process Description:** The system forwards the prompt payload to the Express backend, which constructs the contextual frame and queries the Google Gemini API. The response is generated based on Campvia guidelines using local fallbacks if the API is unreachable.
- **Output:** Structured Chatbot textual response natively rendered in the user's chat window.

**6. Notice Publication Process**
- **Input:** Notice Title, Category, Target Audience (Course ID), and Optional Media Attachments.
- **Process Description:** The system validates Admin or Faculty permissions. Notice details and file paths are saved to the `Notices` collection pointing to specific courses or a global audience broadcast.
- **Output:** 201 Created Status for the Admin/Faculty Interface and immediate dissemination to relevant Student Dashboards.

**7. User Registration Process (Admin)**
- **Input:** User Profile Details (Name, Email, Course ID, Roll Number/Employee ID, Default Password).
- **Process Description:** The admin submits the creation form. The backend verifies there are no duplicate emails or roll numbers. It then cryptographically hashes the default password and provisions the internal record inside the respective `students` or `faculty` Mongoose collections.
- **Output:** HTTP 201 User Created, and the newly added entity appears instantly on the Admin Management Dashboard.

**8. Exam Score Grading Process (Faculty)**
- **Input:** Exam/Test ID, Student ID, and acquired numerical score via the faculty dashboard.
- **Process Description:** The faculty requests to save scores. The backend evaluates if the faculty token matches the authorized course ID for that exam. Upon success, it writes the score map arrays directly into the embedded schema of the `Exam` document.
- **Output:** A frontend confirmation prompt (e.g., "Scores Saved") and updated accessible result panels for the concerned students.

**9. Timetable Scheduling Process (Admin)**
- **Input:** Course ID, Subject, Day of Week, Start Time, End Time, and Assigned Faculty.
- **Process Description:** The admin formulates cyclic or specific lectures. The system processes the input against known records to potentially prevent overlapping assignments, and injects the new class into the `schedules` repository.
- **Output:** Structured JSON Schedule feed pushing real-time timetable updates toward Student and Faculty calendar interfaces.

**10. Todo List Management Process (Student)**
- **Input:** Task Title, Target Date, and Boolean Completion Flag.
- **Process Description:** A student creates, edits, or deletes a personal agenda task. The system securely associates these operations purely based on the student's authenticated ID to maintain isolated privacy, updating the `todos` storage mapping.
- **Output:** Immediate refreshed personal task list reflected across the student portal components.

**11. Study Material Distribution Process (Faculty/Admin)**
- **Input:** Academic Subject, Content Title, and Reference Links or Uploaded Files (PDF/Docx).
- **Process Description:** Content managers submit resources bound to a specific `courseId`. The backend uses local storage logic via Multer (for direct files) or stores absolute Drive URLs. 
- **Output:** Automatically parsed download hyperlinks instantly populated on the centralized Study Material hub for enrolled students.

### 5.3 Data Dictionary
**Brief Explanation:** A central repository defining all critical database entities, their exact keys, data types, and primary logical functions utilized across the MongoDB collections within the Campvia system, formatted as a Comma Separated Values (CSV) block for direct export or analytics usage.

```csv
Entity_Name,Field_Name,Data_Type,Description
Admin,_id,ObjectId,Primary unique identifier for the Admin
Admin,name,String,Full name of the administrator
Admin,email,String,Unique email address for admin login
Admin,password,String,Hashed password for admin authentication
Admin,role,String,Role definition (default: admin)
Admin,status,String,Account status (Active/Inactive)
Student,_id,ObjectId,Primary unique identifier for the Student
Student,name,String,Full name of the student
Student,email,String,Unique email address for student login
Student,password,String,Hashed password for student authentication
Student,courseId,String,The associated course reference ID
Student,rollNo,String,Unique academic roll number
Student,semester,Number,Current academic semester
Student,feesPaid,Number,Total fees paid up to the current date
Student,status,String,Current enrollment status (Active/Graduated/Suspended)
Faculty,_id,ObjectId,Primary unique identifier for the Faculty
Faculty,name,String,Full name of the faculty member
Faculty,email,String,Unique email address for faculty login
Faculty,password,String,Hashed password for faculty authentication
Faculty,courseIds,Array(String),List of associated course reference IDs taught
Faculty,department,String,Academic department of the faculty
Faculty,subjects,Array(String),List of specific subjects taught
Course,_id,ObjectId,Primary unique identifier for the Course
Course,courseId,String,Human-readable unique course identifier (e.g. CS101)
Course,name,String,Full title of the academic course
Course,subjects,Array(String),List of subjects covered under the course
Course,duration,String,Total span/duration of the course (e.g. 4 Years)
Course,totalFees,Number,Total financial cost of the complete course
Assignment,_id,ObjectId,Primary unique identifier
Assignment,courseId,String,Reference to the associated course
Assignment,subject,String,Subject for which the assignment is issued
Assignment,dueDate,Date,Final deadline for assignment submissions
Assignment,submissions,Array(Object),Embedded array of student submissions (studentId, fileName, links, submittedAt)
Attendance,_id,ObjectId,Primary unique identifier
Attendance,studentId,ObjectId,Reference to the specific student
Attendance,courseId,String,Reference to the course associated with the lecture
Attendance,date,Date,Timestamp of the attendance record
Attendance,subject,String,Subject of the lecture
Attendance,status,String,Status value (Present/Absent)
Attendance,lectureId,ObjectId,Reference to the master lecture session
Lecture,_id,ObjectId,Primary unique identifier
Lecture,courseId,String,Target course for the scheduled lecture
Lecture,subject,String,Subject to be taught
Lecture,date,Date,Given date and time of the lecture
Lecture,attendance,Array(ObjectId),References to individual attendance records
Lecture,qrSession,Object,Embedded data for dynamic QR-based attendance validation
Exam,_id,ObjectId,Primary unique identifier
Exam,courseId,String,Target course for the exam
Exam,subject,String,Subject being tested
Exam,date,Date,Scheduled date of the examination
Exam,studentResults,Array(Object),Embedded array storing scores mapping (studentId, score)
Exam,resultsPublished,Boolean,Flag declaring if results are visible to students
Test,_id,ObjectId,Primary unique identifier
Test,courseId,String,Target course for the test/quiz
Test,subject,String,Subject being tested
Test,date,Date,Scheduled date of the test
Test,status,String,Current status (Upcoming/Completed)
Test,importance,String,Weightage or type of test (e.g. Midterm/Unit Test)
Fee,_id,ObjectId,Primary unique identifier
Fee,studentId,ObjectId,Reference to the paying student
Fee,courseId,String,Associated course reference
Fee,amount,Number,Value of the specific fee installment
Fee,dueDate,Date,Deadline for the payment
Fee,status,String,Payment status (Pending/Paid/Overdue)
Fee,transactionId,String,Razorpay transaction reference upon successful payment
Notice,_id,ObjectId,Primary unique identifier
Notice,title,String,Headline of the notice
Notice,courseId,String,Target designated course (Empty implies global broadcast)
Notice,category,String,Classification tag (e.g. Exam/Holiday/General)
Notice,content,String,Main descriptive body of the notice
Notice,attachments,Array(String),Uploaded file paths referencing storage
StudyMaterial,_id,ObjectId,Primary unique identifier
StudyMaterial,title,String,Name of the material or document
StudyMaterial,subject,String,Subject categorized under
StudyMaterial,courseId,String,Course material belongs to
StudyMaterial,fileUrl,String,Path to directly uploaded material
StudyMaterial,driveUrl,String,External Google Drive reference link
Todo,_id,ObjectId,Primary unique identifier
Todo,studentId,ObjectId,Reference to the student owner of the task
Todo,title,String,Task description
Todo,date,Date,Target deadline or execution date
Todo,completed,Boolean,Toggle showing if the task is finished
Contact,_id,ObjectId,Primary unique identifier
Contact,name,String,Submitter name
Contact,email,String,Submitter email address
Contact,message,String,Detailed inquiry or context body
Contact,read,Boolean,Admin flag indicating if inquiry was resolved
FacultyPost,_id,ObjectId,Primary unique identifier
FacultyPost,facultyId,ObjectId,Reference to the faculty posting
FacultyPost,courseId,String,Course targeted by the interaction
FacultyPost,title,String,Title or subject of the post
FacultyPost,type,String,Categorization (e.g. Update/Resource)
```

### 5.4 Entity-Relationship Diagram
**Brief Explanation:** Defines logical relations between various database schemas used to enforce data integrity.

- **COURSE (1)** to **STUDENT (Many):** A specific course can contain many enrolled students.
- **COURSE (1)** to **SUBJECTS/ASSIGNMENTS/EXAMS (Many):** Courses have multiple academic components linked to them.
- **STUDENT (1)** to **FEES/ATTENDANCE (Many):** Students have multiple daily or yearly transactions logged.

---

## 6. System Design

### 6.1 Database Design
**Brief Explanation:** Highlights the usage of MongoDB for document-oriented, flexible schema design tailored for real-time reads.

The system uses a NoSQL schema layout leveraging MongoDB and Mongoose. Collections are structured around entities like students, courses, fees, and admins. Rather than deep cascading standard joins, some relationships are embedded directly (e.g., student assignments/marks within exams) to reduce search latency, while high-volume transactional data (like attendance) maintains their own dedicated collections linked via indexing.

### 6.2 Directory Structure
**Brief Explanation:** Maps out the organized architecture of the internal codebase for navigation and maintenance ease.

The application isolates concerns securely between the frontend and backend:
- backend/models/: Holds Mongoose DB schema definitions.
- backend/routes/: Houses Express API endpoint logic securely fractioned across users (admin, faculty, student).
- src/app/components/: Contains Angular visual components separated by logic blocks (e.g., dashboards, login, tables).
- src/app/services/: Hosts standard Angular services connecting UI actions strictly to Backend APIs (e.g., api.service.ts, auth.service.ts).

### 6.3 Input Layouts
**Brief Explanation:** Describes forms and input endpoints ensuring valid structured data from Users.

- **Student Profile Creation Form:** Accepts validated email addresses natively, checks duplications against roll numbers asynchronously.
- **Faculty Marks Entry Interface:** A grid layout constrained to accept only numerical inputs adhering to maximum valid scores.
- **Payment Gateway Window:** Secure Razorpay checkout overlay abstracting internal monetary inputs away from direct manual tweaking.

---

## 7. System Testing [Test Cases]

System testing is performed to verify that every functional module of the Campvia platform behaves correctly under normal, boundary, and invalid input conditions. Each test case is mapped to a specific module, describes the test scenario in detail, specifies the input, and records the expected output. This ensures the website meets all functional requirements defined during the system analysis phase.

---

### 7.1 Test Case Overview

| TC ID | Module | Test Type | Status |
|---|---|---|---|
| TC-01 | Authentication | Positive | Pass |
| TC-02 | Authentication | Negative | Pass |
| TC-03 | Authentication | Negative | Pass |
| TC-04 | Student Dashboard | Positive | Pass |
| TC-05 | Attendance | Positive | Pass |
| TC-06 | Attendance | Negative | Pass |
| TC-07 | Assignments | Positive | Pass |
| TC-08 | Assignments | Boundary | Pass |
| TC-09 | Exam / Score | Positive | Pass |
| TC-10 | Exam / Score | Negative | Pass |
| TC-11 | Fee & Payment | Positive | Pass |
| TC-12 | Fee & Payment | Negative | Pass |
| TC-13 | Notice | Positive | Pass |
| TC-14 | Notice | Negative | Pass |
| TC-15 | Study Material | Positive | Pass |
| TC-16 | Faculty Access | Negative | Pass |
| TC-17 | Admin – Student CRUD | Positive | Pass |
| TC-18 | Admin – Course CRUD | Positive | Pass |
| TC-19 | Timetable | Positive | Pass |
| TC-20 | AI Chatbot | Positive | Pass |
| TC-21 | To-Do List | Positive | Pass |
| TC-22 | Profile / Auth Guard | Negative | Pass |

---

### 7.2 Detailed Test Cases

**TC-01: Valid Student Login**
- **Module:** Authentication
- **Scenario:** A registered student enters the correct email and password on the login page.
- **Input:** Email: student@campvia.com, Password: correctPassword123
- **Expected Result:** JWT token issued, student is redirected to the Student Dashboard. Role is identified as "student".
- **Actual Result:** Student Dashboard rendered with personalized data. Token stored in local storage.

**TC-02: Invalid Password Login**
- **Module:** Authentication
- **Scenario:** A user enters a valid registered email but an incorrect password.
- **Input:** Email: student@campvia.com, Password: wrongPassword
- **Expected Result:** HTTP 400 response with error message "Invalid credentials". User remains on the login page.
- **Actual Result:** Error toast displayed, no token issued, redirection does not occur.

**TC-03: Unregistered User Login Attempt**
- **Module:** Authentication
- **Scenario:** A user attempts to log in with an email that does not exist in any role collection.
- **Input:** Email: unknown@campvia.com, Password: anyPassword
- **Expected Result:** HTTP 400 response with "User not found" or "Invalid credentials" message.
- **Actual Result:** System returns appropriate error. No access is granted.

**TC-04: Student Dashboard Data Loading**
- **Module:** Student Dashboard
- **Scenario:** A logged-in student opens their dashboard.
- **Input:** Valid JWT token in request header, student ID extracted from token.
- **Expected Result:** Dashboard renders attendance summary, upcoming tests, latest notices, fee status, and to-do list.
- **Actual Result:** All dashboard widgets load with course-specific data. No cross-student data leakage observed.

**TC-05: Attendance Marking by Faculty**
- **Module:** Attendance
- **Scenario:** Faculty marks attendance for a specific student during an active lecture session.
- **Input:** Valid Faculty JWT, Lecture ID, Student ID, status: "Present".
- **Expected Result:** Attendance record created in the Attendance collection. Student's attendance count incremented.
- **Actual Result:** Attendance document saved. Duplicate entry on re-submission is blocked.

**TC-06: Duplicate Attendance Prevention**
- **Module:** Attendance
- **Scenario:** Faculty attempts to mark attendance for the same student in the same lecture twice.
- **Input:** Same Lecture ID and Student ID submitted a second time.
- **Expected Result:** HTTP 400 response with message "Attendance already recorded for this student in this lecture."
- **Actual Result:** Backend returns conflict error. No duplicate record is created in the database.

**TC-07: Assignment Submission Before Deadline**
- **Module:** Assignments
- **Scenario:** A student submits an assignment file before the due date.
- **Input:** Valid Student JWT, Assignment ID with future due date, uploaded file via form.
- **Expected Result:** File is uploaded, submission is appended to the assignment document. HTTP 200/201 returned.
- **Actual Result:** Submission saved with timestamp, student ID, and file path.

**TC-08: Assignment Submission After Deadline**
- **Module:** Assignments
- **Scenario:** A student attempts to submit an assignment after the due date has passed.
- **Input:** Valid Student JWT, Assignment ID with past due date, uploaded file.
- **Expected Result:** HTTP 403 response. Submission is rejected. The UI disables the submit button.
- **Actual Result:** Backend blocks the request. Frontend reflects "Deadline Passed" status on the assignment card.

**TC-09: Exam Score Entry by Faculty**
- **Module:** Exam / Score
- **Scenario:** A faculty member enters scores for students in an exam they are authorised to manage.
- **Input:** Valid Faculty JWT, Exam ID, Student ID, Score: 78.
- **Expected Result:** Score is stored in the studentResults array of the Exam document. HTTP 200 returned.
- **Actual Result:** Score persisted correctly. Student score panel updated upon next page load.

**TC-10: Unauthorised Score Entry by Different Faculty**
- **Module:** Exam / Score
- **Scenario:** A faculty member attempts to update scores for an exam linked to a course not assigned to them.
- **Input:** Valid Faculty JWT (different faculty), Exam ID from another course.
- **Expected Result:** HTTP 403 "Access Denied" response. Score is not modified.
- **Actual Result:** Backend validates course-faculty association and rejects the request.

**TC-11: Successful Fee Payment via Razorpay**
- **Module:** Fee and Payment
- **Scenario:** A student completes a fee payment through the Razorpay checkout and the backend verifies the signature.
- **Input:** Valid Student JWT, Razorpay Order ID, Payment ID, correct HMAC SHA256 signature.
- **Expected Result:** Fee document status changes from "Pending" to "Paid". Transaction ID saved. HTTP 200 returned.
- **Actual Result:** Fee status updated in database. Student dashboard reflects "Paid" badge on the fee card.

**TC-12: Fee Payment with Invalid Signature**
- **Module:** Fee and Payment
- **Scenario:** A tampered or incorrect Razorpay payment signature is submitted to the verification endpoint.
- **Input:** Valid Student JWT, Razorpay Order ID, Payment ID, incorrect or forged signature.
- **Expected Result:** HTTP 400 response. Signature verification fails. Fee status remains "Pending".
- **Actual Result:** Backend rejects the request. No status change is made to the Fee document.

**TC-13: Notice Publication by Admin**
- **Module:** Notice and Communication
- **Scenario:** Admin publishes a new notice targeted at a specific course with a file attachment.
- **Input:** Valid Admin JWT, notice title, content, courseId, category: "Exam", attached file.
- **Expected Result:** Notice document created in the Notices collection. HTTP 201 returned. Notice visible to enrolled students.
- **Actual Result:** Notice saved and retrieved correctly on the Student Notice page filtered by courseId.

**TC-14: Student Cannot Create a Notice**
- **Module:** Notice and Communication
- **Scenario:** A student attempts to POST a new notice via the API directly.
- **Input:** Valid Student JWT, notice payload.
- **Expected Result:** HTTP 403 response. Student role is not permitted to create notices.
- **Actual Result:** Backend middleware rejects the request based on role verification.

**TC-15: Study Material Upload and Retrieval**
- **Module:** Study Material
- **Scenario:** A faculty member uploads a PDF study material for a specific course and subject.
- **Input:** Valid Faculty JWT, courseId, subject, file (PDF), title.
- **Expected Result:** File stored on server, StudyMaterial document created. Students can retrieve via a download link.
- **Actual Result:** Material is accessible on the Study Material page for enrolled students. Direct download link works correctly.

**TC-16: Faculty Access to Non-Assigned Course**
- **Module:** Faculty Access Control
- **Scenario:** A faculty member attempts to view student data for a course that is not in their assigned courseIds list.
- **Input:** Valid Faculty JWT, courseId not present in faculty's courseIds array.
- **Expected Result:** HTTP 403 "Access Denied" response. No data returned.
- **Actual Result:** Backend checks faculty.courseIds and rejects the request. No data leakage occurs.

**TC-17: Admin Registers a New Student**
- **Module:** Admin – Student Management
- **Scenario:** Admin submits the student creation form with valid, non-duplicate details.
- **Input:** Valid Admin JWT, name, email, courseId, rollNo, defaultPassword.
- **Expected Result:** HTTP 201 response. Student document created with hashed password. Student appears in admin student list.
- **Actual Result:** Student saved in the Students collection. Password stored as bcrypt hash.

**TC-18: Admin Creates a New Course**
- **Module:** Admin – Course Management
- **Scenario:** Admin creates a new course with subjects, duration, and total fees.
- **Input:** Valid Admin JWT, courseId, name, subjects array, duration, totalFees.
- **Expected Result:** HTTP 201 response. Course visible in the course listing on the admin panel.
- **Actual Result:** Course document persisted. Admin dashboard reflects new course immediately.

**TC-19: Timetable Schedule Retrieval by Student**
- **Module:** Timetable
- **Scenario:** A student requests their course timetable from the schedule endpoint.
- **Input:** Valid Student JWT, courseId extracted from student profile.
- **Expected Result:** Array of schedule objects for the student's course returned with subject, day, time, and faculty details.
- **Actual Result:** Timetable page renders correct weekly schedule. No schedule data from other courses is included.

**TC-20: AI Chatbot Response**
- **Module:** AI Chatbot
- **Scenario:** A logged-in student submits a natural language query through the chatbot panel.
- **Input:** Valid JWT, prompt: "What is the fee structure for my course?"
- **Expected Result:** Contextual response generated via Google Gemini API and rendered in the chat window.
- **Actual Result:** Response displayed within the chat interface. Graceful fallback message shown if API quota is exceeded.

**TC-21: Student To-Do Task Creation**
- **Module:** To-Do List
- **Scenario:** A student creates a personal task with a title and target date.
- **Input:** Valid Student JWT, title: "Complete Assignment 3", date: future date, completed: false.
- **Expected Result:** Todo document created in the Todos collection, linked to the student's ID. HTTP 201 returned.
- **Actual Result:** Task appears in the student's to-do list. Other students cannot view or modify this task.

**TC-22: Accessing Protected Route Without Token**
- **Module:** Auth Guard / Route Protection
- **Scenario:** A user attempts to access the student dashboard URL directly without being logged in.
- **Input:** No JWT token / expired token in request headers.
- **Expected Result:** HTTP 401 Unauthorized response from backend. Angular route guard redirects user to the login page.
- **Actual Result:** Backend rejects the API call. Angular AuthGuard intercepts the route and navigates to /login.

---

## 8. Limitations and Future Scope of Enhancements

### 8.1 Current Limitations

Every system, regardless of its design quality, carries operational boundaries defined by scope, time, and technology decisions made during its initial development. The following limitations exist in the current version of the Campvia platform and are acknowledged transparently for future reference.

**1. Single-Institution Architecture**
Campvia is currently designed to serve one institution at a time. All student, faculty, and course data exists within a shared database instance without multi-tenant isolation. If the platform were to be extended to serve multiple colleges or departments under separate administrative boundaries, significant architectural refactoring of the data layer and authentication system would be required.

**2. No Dedicated Parent or Guardian Portal**
The current system exclusively serves students, faculty, and admins. Parents or guardians who may need visibility into a student's attendance record, fee payment status, or upcoming examination schedule have no independent login or self-service access. They are dependent on students sharing information manually.

**3. No Native Mobile Application**
Campvia is a responsive web application, and while it is functional on mobile browsers, there is no native Android or iOS application. Native apps would provide push notifications, offline access, and a significantly improved mobile experience for students logging attendance or checking notices on-the-go.

**4. No Real-Time Notifications**
The platform currently does not implement WebSocket or server-sent event mechanisms. Students are not automatically notified when a new notice is published, when a fee record becomes due, or when exam results are released. They must manually refresh or revisit the platform to see updates.

**5. Limited Reporting and Analytics**
The admin statistics panel currently provides high-level summary data. Deep analytical reports such as semester-wise attendance trends, course-level pass/fail analysis, fee collection forecasting, or subject-wise performance comparison are not available in the current release.

**6. Manual Attendance Marking Dependency**
While a QR-based attendance session model is partially designed within the Lecture schema, full QR-based self-attendance marking — where students scan to mark themselves present — is not yet fully implemented end-to-end. Attendance is primarily managed through admin/faculty input.

**7. File Storage is Server-Local**
Uploaded files for notices and study materials are stored on the local server filesystem. This approach does not scale well for production deployments where distributed infrastructure or cloud storage (e.g., AWS S3, Cloudinary) would be required to ensure reliability and availability of uploaded assets.

**8. No Offline Capability**
The platform requires a live internet connection for all operations. There is no service worker, progressive web application (PWA) layer, or local caching mechanism that would allow students to access previously loaded content in low-connectivity environments.

**9. Session Expiry Handling**
JWT tokens have a fixed expiry, but the Campvia frontend does not currently handle silent token refresh or proactively warn users before session expiry. A user working on a long form may lose their session without warning.

**10. No Audit Logging**
The current system does not maintain a structured audit log for administrative or faculty actions such as score modifications, fee status changes, or student record deletions. An audit trail is important for institutional accountability and compliance.

---

### 8.2 Future Scope of Enhancements

The following enhancements represent the planned evolution of the Campvia platform. These features are technically feasible given the existing backend API structure and Angular frontend architecture.

**1. Parent and Guardian Portal**
A dedicated access portal for parents/guardians can be implemented with read-only role access. Parents would be able to view their ward's attendance percentage, fee dues, test results, and notice history using the same backend APIs as the student module with restricted write permissions.

**2. Native Mobile Application (Android and iOS)**
A mobile application can be developed using React Native or Flutter, reusing all existing Campvia REST APIs. This would unlock push notifications for new notices, fee reminders, exam schedule alerts, and real-time attendance confirmations that are critical for active student engagement.

**3. Real-Time Notifications via WebSockets**
Integrating Socket.io into the Express backend and Angular frontend would enable real-time push of events such as notice publication, new assignment posting, fee due reminders, and result announcements directly to logged-in users without requiring a manual page refresh.

**4. Advanced Analytics Dashboard**
An expanded admin analytics module can be developed with visual chart components (using Chart.js or ngx-charts) to display:
- Month-wise fee collection trends.
- Subject-wise attendance heatmaps across batches.
- Score distribution curves per exam.
- Student enrollment and dropout rate tracking across semesters.

**5. Cloud-Based File Storage Integration**
Migrating file uploads for notices and study materials to a cloud storage service such as AWS S3 or Firebase Storage would improve reliability, scalability, and media delivery speed. A CDN layer can further reduce load times for resource-heavy files.

**6. QR Code-Based Attendance System**
Completing the QR attendance flow already partially modelled in the Lecture schema would allow faculty to generate a session-specific QR code that students scan during class. The system would validate the scan timestamp and student identity to mark attendance automatically, reducing manual intervention significantly.

**7. Email and SMS Notification Integration**
Connecting a transactional email service (e.g., SendGrid or Nodemailer) and an SMS gateway (e.g., Twilio) would allow the system to send critical notifications such as fee payment confirmations, exam date reminders, and attendance shortage warnings directly to students' registered contacts.

**8. Enhanced Role-Based Access and Delegation**
A granular permission system can be added within the admin module, allowing the creation of sub-admin roles (e.g., Exam Coordinator, Finance Officer) with access scoped only to their specific domain entities rather than full admin privileges.

**9. Automated Attendance Reports and Shortage Alerts**
A scheduled backend job can calculate attendance percentage per student at weekly intervals and automatically flag students falling below the institutional minimum threshold, triggering alerts to both the student and their assigned faculty.

**10. Progressive Web Application (PWA) Support**
Converting Campvia into a PWA with a service worker would allow students to cache key pages (dashboard, timetable, notices) and access them offline or in low-bandwidth conditions, significantly improving usability in areas with intermittent connectivity.

**11. Multi-Language Support (Internationalization)**
Using Angular's built-in i18n module, the platform can be extended to support multiple languages, enabling the UI to switch between English, Hindi, Gujarati, or other regional languages for institutions with diverse student and faculty populations.

**12. Integration with External ERP and HRMS Systems**
Future versions of Campvia could expose a standardized integration API layer for connecting with third-party ERP or HRMS platforms used by larger institutions, enabling bidirectional data sync for staff records, hostel management, and library management systems.

---

## 9. References

The following references were consulted during the analysis, design, and development of the Campvia Academic Management Website. These include official documentation, API references, and technical guides directly relevant to the technologies and methodologies used in this project.

**Frontend Development:**
1. Angular Official Documentation — Component architecture, routing, reactive forms, HTTP client module, and route guards. Available at: https://angular.dev/docs
2. TypeScript Official Handbook — Type definitions, interfaces, generics, and strict typing practices applied across Angular services and components. Available at: https://www.typescriptlang.org/docs/
3. Tailwind CSS Documentation — Utility-first class reference, responsive design using breakpoints, and JIT compilation setup. Available at: https://tailwindcss.com/docs
4. RxJS Documentation — Observables, BehaviorSubjects, and asynchronous data stream patterns used inside Angular services. Available at: https://rxjs.dev/guide/overview

**Backend Development:**
5. Node.js Official Documentation — Event loop, asynchronous I/O, module system, and runtime environment. Available at: https://nodejs.org/en/docs/
6. Express.js Official Guide — Routing, middleware stack, error handling, and RESTful API design patterns. Available at: https://expressjs.com/en/guide/
7. Mongoose Official Documentation — Schema definition, model creation, query building, and population strategies for MongoDB. Available at: https://mongoosejs.com/docs/
8. JSON Web Token Specification (RFC 7519) — Token structure, signing algorithms (HS256), and server-side validation rules. Available at: https://jwt.io/introduction
9. Multer npm Package Documentation — Multipart form-data file upload middleware configuration for Express.js. Available at: https://github.com/expressjs/multer
10. bcryptjs npm Package — Password hashing rounds, salt generation, and secure comparison for credential storage. Available at: https://github.com/dcodeIO/bcrypt.js

**Database:**
11. MongoDB Official Documentation — Document model, collections, indexing strategies, and aggregation pipeline reference. Available at: https://www.mongodb.com/docs/
12. MongoDB Atlas Documentation — Cloud cluster deployment, connection string configuration, and Atlas monitoring. Available at: https://www.mongodb.com/docs/atlas/

**Security:**
13. OWASP Web Security Testing Guide — Secure coding practices covering input validation, authentication, session management, and REST API security. Available at: https://owasp.org/www-project-web-security-testing-guide/

**Payment Integration:**
14. Razorpay Official Developer Documentation — Order API, Checkout.js integration, and HMAC SHA256 payment verification. Available at: https://razorpay.com/docs/

**AI Integration:**
15. Google Gemini API Documentation — API key configuration, prompt construction, content generation, and response parsing for conversational AI. Available at: https://ai.google.dev/docs

**Development Tools:**
16. Visual Studio Code Documentation — Editor setup, extensions, debugging configurations, and workspace management. Available at: https://code.visualstudio.com/docs
17. Postman API Platform Documentation — API request building, collection management, and environment-based testing. Available at: https://learning.postman.com/docs/
18. npm Documentation — Package management, dependency resolution, scripts, and version management. Available at: https://docs.npmjs.com/
