require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ============================================
// DATABASE SEED SCRIPT
// ============================================
// Creates sample data organized course-wise
// with separate collections for Student, Faculty, Admin.
//
// Database Structure:
// ┌──────────────────────────────────────────────────┐
// │  CREDENTIALS (separate per role)                 │
// │    admins     → Admin credentials & profile      │
// │    faculties  → Faculty credentials & profile    │
// │    students   → Student credentials & profile    │
// ├──────────────────────────────────────────────────┤
// │  COURSE (central hub)                            │
// │    courses    → All courses with subjects        │
// ├──────────────────────────────────────────────────┤
// │  COURSE-WISE ACADEMIC DATA                       │
// │    assignments     → per course                  │
// │    schedules       → timetable per course        │
// │    tests           → upcoming tests per course   │
// │    exams           → exams & results per course  │
// │    lectures        → lectures per course         │
// │    studymaterials  → resources per course        │
// │    attendances     → student attendance per course│
// │    fees            → student fees per course     │
// ├──────────────────────────────────────────────────┤
// │  OTHER DATA                                      │
// │    notices         → announcements (optional course)│
// │    todos           → student personal tasks      │
// │    facultyposts    → faculty shared resources    │
// └──────────────────────────────────────────────────┘

const Admin = require('./models/Admin');
const Faculty = require('./models/Faculty');
const Student = require('./models/Student');
const Course = require('./models/Course');
const Assignment = require('./models/Assignment');
const Attendance = require('./models/Attendance');
const Fee = require('./models/Fee');
const Schedule = require('./models/Schedule');
const Test = require('./models/Test');
const Notice = require('./models/Notice');
const StudyMaterial = require('./models/StudyMaterial');
const Todo = require('./models/Todo');
const Exam = require('./models/Exam');
const Lecture = require('./models/Lecture');
const FacultyPost = require('./models/FacultyPost');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Check if database already has data — skip seeding if so
  const existingAdmin = await Admin.countDocuments();
  const existingStudents = await Student.countDocuments();
  if (existingAdmin > 0 || existingStudents > 0) {
    console.log('Database already contains data — skipping seed to preserve existing records.');
    console.log('  (Run "node seed.js --force" to wipe and re-seed.)');
    await mongoose.disconnect();
    return;
  }

  // Only clear & seed when DB is empty (or --force flag is passed)
  if (process.argv.includes('--force')) {
    await Promise.all([
      Admin.deleteMany({}), Faculty.deleteMany({}), Student.deleteMany({}),
      Course.deleteMany({}), Assignment.deleteMany({}), Attendance.deleteMany({}),
      Fee.deleteMany({}), Schedule.deleteMany({}), Test.deleteMany({}),
      Notice.deleteMany({}), StudyMaterial.deleteMany({}), Todo.deleteMany({}),
      Exam.deleteMany({}), Lecture.deleteMany({}), FacultyPost.deleteMany({})
    ]);
    console.log('Cleared all collections (--force)');
  } else {
    console.log('Seeding fresh database...');
  }

  // =============================================
  // 1. ADMIN CREDENTIALS
  // =============================================
  // Admin.create() triggers pre-save hook → auto-hashes password
  const admin = await Admin.create({
    name: 'Administrator',
    email: 'admin@campvia.edu',
    password: 'Admin123',
    status: 'active'
  });
  console.log('✓ Admin created');

  // =============================================
  // 2. FACULTY CREDENTIALS
  // =============================================
  // Faculty.insertMany() skips middleware → pre-hash passwords
  const hashedFaculty = await bcrypt.hash('faculty123', 10);

  const facultyUsers = await Faculty.insertMany([
    {
      name: 'Dr. Sarah Wilson', email: 'sarah.wilson@campvia.edu', password: hashedFaculty,
      department: 'English', designation: 'Professor',
      phone: '+1-555-0201', office: 'Room 305',
      subjects: ['English Language', 'Literature'],
      experience: '15 years', courseIds: ['C01', 'C02'], status: 'active',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80'
    },
    {
      name: 'Prof. Michael Brown', email: 'michael.brown@campvia.edu', password: hashedFaculty,
      department: 'Mathematics', designation: 'Associate Professor',
      phone: '+1-555-0202', office: 'Room 210',
      subjects: ['Advanced Mathematics', 'Statistics'],
      experience: '12 years', courseIds: ['C03', 'C01'], status: 'active',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80'
    },
    {
      name: 'Eng. Alice Cooper', email: 'alice.cooper@campvia.edu', password: hashedFaculty,
      department: 'Computer Science', designation: 'Senior Lecturer',
      phone: '+1-555-0203', office: 'Room 315',
      subjects: ['Computer Science', 'Data Structures', 'Algorithms'],
      experience: '10 years', courseIds: ['C01', 'C05'], status: 'active',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80'
    },
    {
      name: 'Dr. Robert Blake', email: 'robert.blake@campvia.edu', password: hashedFaculty,
      department: 'Science', designation: 'Professor',
      phone: '+1-555-0204', office: 'Lab 101',
      subjects: ['Applied Science', 'Physics'],
      experience: '20 years', courseIds: ['C04', 'C01'], status: 'active',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80'
    }
  ]);
  console.log('✓ Faculty created (4)');

  // =============================================
  // 3. STUDENT CREDENTIALS
  // =============================================
  // Student.insertMany() skips middleware → pre-hash passwords
  const hashedStudent = await bcrypt.hash('student123', 10);

  const studentUsers = await Student.insertMany([
    {
      name: 'Sarah Jenkins', email: 'student@campvia.edu', password: hashedStudent,
      courseId: 'C01', course: 'Computer Science', year: 3, semester: 5,
      rollNo: 'CS2021001', gpa: 3.85, classRank: 2, collegeRank: 15,
      phone: '+1-555-0101', bio: 'Passionate about AI and Machine Learning.',
      specialization: 'Artificial Intelligence', location: 'New York',
      status: 'active', feesPaid: 24800
    },
    {
      name: 'John Doe', email: 'john.doe@campvia.edu', password: hashedStudent,
      courseId: 'C01', course: 'Computer Science', year: 3, semester: 5,
      rollNo: 'CS2021002', gpa: 3.5, classRank: 5, collegeRank: 32,
      phone: '+1-555-0102', bio: 'Full-stack developer in training.',
      specialization: 'Web Development', location: 'Boston',
      status: 'active', feesPaid: 24800
    },
    {
      name: 'Jane Smith', email: 'jane.smith@campvia.edu', password: hashedStudent,
      courseId: 'C02', course: 'Information Tech', year: 2, semester: 3,
      rollNo: 'IT2022001', gpa: 3.72, classRank: 1, collegeRank: 8,
      phone: '+1-555-0103', bio: 'Cybersecurity enthusiast.',
      specialization: 'Network Security', location: 'San Francisco',
      status: 'active', feesPaid: 12000
    },
    {
      name: 'Robert Johnson', email: 'robert.johnson@campvia.edu', password: hashedStudent,
      courseId: 'C01', course: 'Computer Science', year: 3, semester: 5,
      rollNo: 'CS2021003', gpa: 3.92, classRank: 1, collegeRank: 5,
      phone: '+1-555-0104', bio: 'Competitive programmer and open-source contributor.',
      specialization: 'Software Engineering', location: 'Chicago',
      status: 'active', feesPaid: 24800
    },
    {
      name: 'Emily Davis', email: 'emily.davis@campvia.edu', password: hashedStudent,
      courseId: 'C03', course: 'Mathematics', year: 1, semester: 1,
      rollNo: 'MA2023001', gpa: 3.60, classRank: 3, collegeRank: 22,
      phone: '+1-555-0105', bio: 'Aspiring data scientist.',
      specialization: 'Data Science', location: 'Seattle',
      status: 'active', feesPaid: 0
    },
    {
      name: 'Michael Lee', email: 'michael.lee@campvia.edu', password: hashedStudent,
      courseId: 'C01', course: 'Computer Science', year: 2, semester: 3,
      rollNo: 'CS2022004', gpa: 3.45, classRank: 8, collegeRank: 45,
      phone: '+1-555-0106', bio: 'Game development and graphics programming.',
      specialization: 'Game Development', location: 'Austin',
      status: 'active', feesPaid: 12800
    }
  ]);

  const mainStudent = studentUsers[0]; // Sarah Jenkins (courseId: C01)
  console.log('✓ Students created (6)');

  // =============================================
  // 4. COURSES (central hub)
  // =============================================
  await Course.insertMany([
    {
      courseId: 'C01', name: 'Computer Science', head: 'Dr. Alan Turing', duration: '4 Years',
      type: 'Undergraduate',
      subjects: ['Data Structures', 'Algorithms', 'Operating Systems', 'Database Management', 'English Language'],
      totalFees: 48000,
      title: 'Advanced Computer Science', category: 'Engineering',
      image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
      description: 'Master the fundamentals of AI, Machine Learning, and Cloud Architecture.', rating: 4.9
    },
    {
      courseId: 'C02', name: 'Information Tech', head: 'Prof. Marie Curie', duration: '3 Years',
      type: 'Undergraduate',
      subjects: ['Software Engineering', 'Computer Networks', 'Web Technologies'],
      totalFees: 36000,
      title: 'Global Business Strategy', category: 'Management',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
      description: 'Develop strategic leadership skills and global economic research.', rating: 4.7
    },
    {
      courseId: 'C03', name: 'Mathematics', head: 'Dr. John Nash', duration: '2 Years',
      type: 'Postgraduate',
      subjects: ['Advanced Calculus', 'Linear Algebra', 'Game Theory', 'Statistics'],
      totalFees: 24000,
      title: 'Interaction Design', category: 'Arts',
      image: 'https://images.unsplash.com/photo-1561070791-26c11d6d9e3d?auto=format&fit=crop&w=800&q=80',
      description: 'Cognitive psychology and digital aesthetics for next-gen interfaces.', rating: 4.8
    },
    {
      courseId: 'C04', name: 'Genomic Engineering', head: 'Dr. James Watson', duration: '4 Years',
      type: 'Undergraduate',
      subjects: ['Molecular Biology', 'Genetics', 'Biochemistry', 'Applied Science'],
      totalFees: 52000,
      title: 'Genomic Engineering', category: 'Science',
      image: 'https://images.unsplash.com/photo-1532187875605-2fe35851142b?auto=format&fit=crop&w=800&q=80',
      description: 'Investigate frontiers of molecular biology and genetic therapeutics.', rating: 4.6
    },
    {
      courseId: 'C05', name: 'Cyber Security', head: 'Prof. Ada Lovelace', duration: '4 Years',
      type: 'Undergraduate',
      subjects: ['Ethical Hacking', 'Network Security', 'Cryptography'],
      totalFees: 50000,
      title: 'Cyber Security Operations', category: 'Engineering',
      image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
      description: 'Elite career in digital defense with ethical hacking protocols.', rating: 4.9
    },
    {
      courseId: 'C06', name: 'Economics', head: 'Dr. Paul Krugman', duration: '3 Years',
      type: 'Undergraduate',
      subjects: ['Microeconomics', 'Macroeconomics', 'Econometrics'],
      totalFees: 32000,
      title: 'Economics & Policy', category: 'Management',
      image: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80',
      description: 'Analyze complex global markets and formulate economic policies.', rating: 4.5
    }
  ]);
  console.log('✓ Courses created (6)');

  // =============================================
  // 5. FACULTY POSTS (linked to Faculty)
  // =============================================
  await FacultyPost.insertMany([
    { facultyId: facultyUsers[0]._id, courseId: 'C01', title: 'Grammar Essentials Guide', type: 'pdf', date: '2024-05-15' },
    { facultyId: facultyUsers[0]._id, courseId: 'C02', title: 'Writing Workshop Recording', type: 'video', date: '2024-05-10' },
    { facultyId: facultyUsers[1]._id, courseId: 'C03', title: 'Calculus Problem Set', type: 'pdf', date: '2024-05-18' },
    { facultyId: facultyUsers[1]._id, courseId: 'C01', title: 'Khan Academy Playlist', type: 'link', date: '2024-05-12' },
    { facultyId: facultyUsers[2]._id, courseId: 'C01', title: 'DSA Cheat Sheet', type: 'pdf', date: '2024-05-20' },
    { facultyId: facultyUsers[2]._id, courseId: 'C01', title: 'System Design Lecture', type: 'video', date: '2024-05-14' },
    { facultyId: facultyUsers[3]._id, courseId: 'C04', title: 'Physics Lab Manual', type: 'pdf', date: '2024-05-08' }
  ]);
  console.log('✓ Faculty posts created (7)');

  // =============================================
  // 6. ASSIGNMENTS (course-wise)
  // =============================================
  await Assignment.insertMany([
    {
      title: 'Data Structures Lab Report', subject: 'Data Structures', courseId: 'C01',
      dueDate: '2024-05-25', status: 'pending',
      description: 'Write a comprehensive lab report on implementing Binary Search Trees and AVL Trees.'
    },
    {
      title: 'Algorithm Analysis Paper', subject: 'Algorithms', courseId: 'C01',
      dueDate: '2024-05-28', status: 'pending',
      description: 'Analyze time complexity of three sorting algorithms with empirical data.'
    },
    {
      title: 'Calculus Problem Set #4', subject: 'Advanced Calculus', courseId: 'C03',
      dueDate: '2024-06-01', status: 'pending',
      description: 'Complete problems 1-20 from Chapter 8: Integration Techniques.'
    },
    {
      title: 'English Essay: Modern Literature', subject: 'English Language', courseId: 'C01',
      dueDate: '2024-05-20', status: 'submitted',
      description: 'Write a 2000-word essay on the evolution of post-modern literary techniques.',
      submissions: [{
        studentId: mainStudent._id,
        studentName: 'Sarah Jenkins',
        fileName: 'modern_lit_essay.docx',
        status: 'submitted'
      }]
    },
    {
      title: 'Network Security Report', subject: 'Computer Networks', courseId: 'C02',
      dueDate: '2024-06-05', status: 'pending',
      description: 'Document findings from the network vulnerability scanning lab exercise.'
    },
    {
      title: 'Molecular Biology Lab', subject: 'Molecular Biology', courseId: 'C04',
      dueDate: '2024-06-10', status: 'pending',
      description: 'Document the results of the DNA extraction experiment and gel electrophoresis analysis.'
    }
  ]);
  console.log('✓ Assignments created (6)');

  // =============================================
  // 8. FEES (student + course-wise)
  // =============================================
  const today = new Date().toISOString().split('T')[0];
  await Fee.insertMany([
    // Sarah Jenkins (C01)
    { studentId: mainStudent._id, courseId: 'C01', title: 'Tuition Fee - Fall 2024', amount: 12000, dueDate: '2024-08-15', status: 'paid', category: 'Tuition', semester: 'Fall 2024', paidDate: '2024-08-10', transactionId: 'TXN001ABC', method: 'Online' },
    { studentId: mainStudent._id, courseId: 'C01', title: 'Library & Lab Fee', amount: 800, dueDate: '2024-08-20', status: 'paid', category: 'Facilities', semester: 'Fall 2024', paidDate: '2024-08-15', transactionId: 'TXN002DEF', method: 'Online' },
    { studentId: mainStudent._id, courseId: 'C01', title: 'Tuition Fee - Spring 2025', amount: 12000, dueDate: '2025-01-15', status: 'pending', category: 'Tuition', semester: 'Spring 2025' },
    { studentId: mainStudent._id, courseId: 'C01', title: 'Hostel Fee - Spring 2025', amount: 4500, dueDate: '2025-01-10', status: 'overdue', category: 'Hostel', semester: 'Spring 2025' },
    { studentId: mainStudent._id, courseId: 'C01', title: 'Examination Fee', amount: 500, dueDate: '2025-03-01', status: 'pending', category: 'Examination', semester: 'Spring 2025' },
    // Jane Smith (C02)
    { studentId: studentUsers[2]._id, courseId: 'C02', title: 'Tuition Fee - Fall 2024', amount: 12000, dueDate: '2024-08-15', status: 'paid', category: 'Tuition', semester: 'Fall 2024', paidDate: '2024-08-12', transactionId: 'TXN003GHI', method: 'Bank Transfer' }
  ]);
  console.log('✓ Fee records created (6)');

  // =============================================
  // 9. SCHEDULE / TIMETABLE (course-wise)
  // =============================================
  await Schedule.insertMany([
    // === Course C01: Computer Science ===
    { courseId: 'C01', dayOfWeek: 1, time: '08:00 AM', endTime: '08:45 AM', subject: 'English Language', room: 'Room 122', duration: '45 mins', type: 'lecture', faculty: 'Dr. Sarah Wilson' },
    { courseId: 'C01', dayOfWeek: 1, time: '09:00 AM', endTime: '09:45 AM', subject: 'Database Management', room: 'Room 122', duration: '45 mins', type: 'lecture', faculty: 'Prof. Michael Brown' },
    { courseId: 'C01', dayOfWeek: 1, time: '10:00 AM', endTime: '10:45 AM', subject: 'Data Structures', room: 'Room 315', duration: '45 mins', type: 'seminar', faculty: 'Eng. Alice Cooper' },
    { courseId: 'C01', dayOfWeek: 2, time: '09:00 AM', endTime: '09:45 AM', subject: 'Algorithms', room: 'Room 315', duration: '45 mins', type: 'lecture', faculty: 'Eng. Alice Cooper' },
    { courseId: 'C01', dayOfWeek: 2, time: '11:00 AM', endTime: '12:30 PM', subject: 'Operating Systems', room: 'Lab 201', duration: '90 mins', type: 'lab', faculty: 'Dr. Robert Blake' },
    { courseId: 'C01', dayOfWeek: 3, time: '09:00 AM', endTime: '10:30 AM', subject: 'Data Structures', room: 'Lab 315', duration: '90 mins', type: 'lab', faculty: 'Eng. Alice Cooper' },
    { courseId: 'C01', dayOfWeek: 4, time: '08:00 AM', endTime: '09:30 AM', subject: 'Algorithms', room: 'Room 315', duration: '90 mins', type: 'lecture', faculty: 'Eng. Alice Cooper' },
    { courseId: 'C01', dayOfWeek: 5, time: '10:00 AM', endTime: '11:30 AM', subject: 'English Language', room: 'Auditorium', duration: '90 mins', type: 'lecture', faculty: 'Dr. Sarah Wilson' },
    // === Course C02: Information Tech ===
    { courseId: 'C02', dayOfWeek: 1, time: '10:00 AM', endTime: '11:30 AM', subject: 'Software Engineering', room: 'Room 208', duration: '90 mins', type: 'lecture', faculty: 'Dr. Sarah Wilson' },
    { courseId: 'C02', dayOfWeek: 3, time: '02:00 PM', endTime: '04:00 PM', subject: 'Computer Networks', room: 'Lab 101', duration: '120 mins', type: 'lab', faculty: 'Eng. Alice Cooper' },
    // === Course C03: Mathematics ===
    { courseId: 'C03', dayOfWeek: 2, time: '09:00 AM', endTime: '10:30 AM', subject: 'Advanced Calculus', room: 'Room 210', duration: '90 mins', type: 'lecture', faculty: 'Prof. Michael Brown' },
    { courseId: 'C03', dayOfWeek: 4, time: '11:00 AM', endTime: '12:30 PM', subject: 'Linear Algebra', room: 'Room 210', duration: '90 mins', type: 'lecture', faculty: 'Prof. Michael Brown' },
    // === Course C04: Genomic Engineering ===
    { courseId: 'C04', dayOfWeek: 3, time: '10:00 AM', endTime: '12:00 PM', subject: 'Molecular Biology', room: 'Lab 101', duration: '120 mins', type: 'lab', faculty: 'Dr. Robert Blake' },
    { courseId: 'C04', dayOfWeek: 5, time: '02:00 PM', endTime: '03:30 PM', subject: 'Applied Science', room: 'Lab 101', duration: '90 mins', type: 'lecture', faculty: 'Dr. Robert Blake' }
  ]);
  console.log('✓ Schedule created (14 slots)');

  // =============================================
  // 10. TESTS / UPCOMING QUIZZES (course-wise)
  // =============================================
  await Test.insertMany([
    { subject: 'Data Structures', courseId: 'C01', description: 'Binary Trees & Graph Traversals Quiz.', date: '27 May', type: 'Quiz', room: 'Lab 302', duration: '45 mins', importance: 'medium', urgent: true, status: 'upcoming' },
    { subject: 'Algorithms', courseId: 'C01', description: 'Dynamic Programming Assessment.', date: '02 Jun', type: 'Assessment', room: 'Room 315', duration: '120 mins', importance: 'high', urgent: false, status: 'upcoming' },
    { subject: 'English Language', courseId: 'C01', description: 'Grammar Essentials Final Exam. Cover all modules 1-8.', date: '03 Jun', type: 'Final', room: 'Hall A', duration: '90 mins', importance: 'high', urgent: false, status: 'upcoming' },
    { subject: 'Software Engineering', courseId: 'C02', description: 'Agile & Scrum methodology quiz.', date: '05 Jun', type: 'Quiz', room: 'Room 208', duration: '30 mins', importance: 'medium', urgent: false, status: 'upcoming' },
    { subject: 'Advanced Calculus', courseId: 'C03', description: 'Integration techniques mid-term.', date: '10 Jun', type: 'Midterm', room: 'Room 210', duration: '60 mins', importance: 'high', urgent: false, status: 'upcoming' },
    { subject: 'Molecular Biology', courseId: 'C04', description: 'DNA Replication & Transcription Quiz.', date: '12 Jun', type: 'Quiz', room: 'Lab 101', duration: '45 mins', importance: 'medium', urgent: false, status: 'upcoming' }
  ]);
  console.log('✓ Tests created (6)');

  // =============================================
  // 11. NOTICES (optional course link)
  // =============================================
  await Notice.insertMany([
    { title: 'Mid-Semester Break Announcement', category: 'general', courseId: '', date: '2024-05-22', sender: 'Administrative Office', role: 'admin', content: 'Please be advised that the university will remain closed for the mid-semester break from May 25th to May 30th. All classes will resume on May 31st.', priority: 'high', attachment: 'academic_calendar_v2.pdf' },
    { title: 'Revised Examination Guidelines', category: 'academic', courseId: '', date: '2024-05-20', sender: 'Prof. Michael Brown', role: 'faculty', content: 'The guidelines for the upcoming final examinations have been updated to include instructions for the digital submission portion.', priority: 'high', attachment: 'exam_guidelines_2024.pdf' },
    { title: 'CS Lab Maintenance Notice', category: 'academic', courseId: 'C01', date: '2024-05-21', sender: 'Eng. Alice Cooper', role: 'faculty', content: 'The CS Lab (Room 315) will be closed for maintenance on May 24th. All lab sessions will be moved to Room 208.', priority: 'normal' },
    { title: 'Annual Tech Symposium 2024', category: 'event', courseId: '', date: '2024-05-18', sender: 'Student Affairs', role: 'admin', content: 'Registration for the Annual Tech Symposium is now open. Submit abstracts by June 5th.', priority: 'normal', attachment: 'symposium_schedule.pdf' },
    { title: 'Library Extended Hours', category: 'general', courseId: '', date: '2024-05-15', sender: 'Library Management', role: 'admin', content: 'Starting next week, the central library will be open 24/7 during the final project submission period.', priority: 'normal' },
    { title: 'New Research Methodology Workshop', category: 'academic', courseId: 'C03', date: '2024-05-12', sender: 'Prof. Michael Brown', role: 'faculty', content: 'A mandatory workshop on advanced research methodologies for Mathematics students will be held in Auditorium 2 this Friday at 10:00 AM.', priority: 'normal', attachment: 'workshop_materials.pdf' }
  ]);
  console.log('✓ Notices created (6)');

  // =============================================
  // 12. STUDY MATERIALS (course-wise)
  // =============================================
  await StudyMaterial.insertMany([
    // C01 - Computer Science
    { title: 'Data Structures & Algorithms', subject: 'Data Structures', courseId: 'C01', category: 'E-Book', fileUrl: '#', uploadDate: '2024-05-18', size: '15.8 MB' },
    { title: 'Operating Systems Concepts', subject: 'Operating Systems', courseId: 'C01', category: 'Lecture Slides', fileUrl: '#', uploadDate: '2024-05-10', size: '4.5 MB' },
    { title: 'Database Design Patterns', subject: 'Database Management', courseId: 'C01', category: 'E-Book', fileUrl: '#', uploadDate: '2024-05-08', size: '3.2 MB' },
    { title: 'React.js Best Practices', subject: 'Algorithms', courseId: 'C01', category: 'E-Book', fileUrl: '#', uploadDate: '2024-04-20', size: '1.2 MB' },
    // C02 - Information Tech
    { title: 'Software Engineering Fundamentals', subject: 'Software Engineering', courseId: 'C02', category: 'E-Book', fileUrl: '#', uploadDate: '2024-05-15', size: '6.4 MB' },
    { title: 'Computer Networks Lab Manual', subject: 'Computer Networks', courseId: 'C02', category: 'Manual', fileUrl: '#', uploadDate: '2024-05-05', size: '2.8 MB' },
    // C03 - Mathematics
    { title: 'Advanced Calculus Notes', subject: 'Advanced Calculus', courseId: 'C03', category: 'Handwritten Notes', fileUrl: '#', uploadDate: '2024-05-20', size: '2.4 MB' },
    { title: 'Linear Algebra Review', subject: 'Linear Algebra', courseId: 'C03', category: 'E-Book', fileUrl: '#', uploadDate: '2024-05-15', size: '1.8 MB' },
    { title: 'Probability & Statistics', subject: 'Statistics', courseId: 'C03', category: 'Manual', fileUrl: '#', uploadDate: '2024-04-22', size: '2.9 MB' },
    // C04 - Genomic Engineering
    { title: 'Genetic Engineering Basics', subject: 'Genetics', courseId: 'C04', category: 'Notes', fileUrl: '#', uploadDate: '2024-04-28', size: '1.9 MB' },
    { title: 'Organic Chemistry Lab Manual', subject: 'Biochemistry', courseId: 'C04', category: 'Manual', fileUrl: '#', uploadDate: '2024-05-15', size: '4.2 MB' },
    { title: 'Physics for Engineers', subject: 'Applied Science', courseId: 'C04', category: 'Handwritten Notes', fileUrl: '#', uploadDate: '2024-05-12', size: '3.1 MB' },
    // C05 - Cyber Security
    { title: 'Ethical Hacking Guide', subject: 'Ethical Hacking', courseId: 'C05', category: 'E-Book', fileUrl: '#', uploadDate: '2024-05-10', size: '8.5 MB' },
    { title: 'Cryptography Fundamentals', subject: 'Cryptography', courseId: 'C05', category: 'Lecture Slides', fileUrl: '#', uploadDate: '2024-05-02', size: '3.7 MB' },
    // C06 - Economics
    { title: 'Macroeconomics 101', subject: 'Macroeconomics', courseId: 'C06', category: 'Lecture Slides', fileUrl: '#', uploadDate: '2024-05-05', size: '3.5 MB' },
    { title: 'Principles of Econometrics', subject: 'Econometrics', courseId: 'C06', category: 'E-Book', fileUrl: '#', uploadDate: '2024-04-30', size: '6.7 MB' }
  ]);
  console.log('✓ Study materials created (16)');

  // =============================================
  // 13. TODOS (student personal tasks)
  // =============================================
  await Todo.insertMany([
    { studentId: mainStudent._id, title: 'Complete DSA Assignment', date: today, time: '10:00 AM', subject: 'Data Structures', description: 'Finish the BST lab report documentation', completed: false },
    { studentId: mainStudent._id, title: 'Review Algorithms Notes', date: today, time: '02:00 PM', subject: 'Algorithms', description: 'Review dynamic programming before quiz', completed: false }
  ]);
  console.log('✓ Todos created (2)');

  // =============================================
  // 14. EXAMS WITH RESULTS (course-wise)
  // =============================================
  await Exam.insertMany([
    {
      title: 'Data Structures Quiz 1', courseId: 'C01', subject: 'Data Structures',
      date: '2024-10-10', duration: '60 mins', type: 'Quiz', status: 'completed', resultsPublished: true,
      studentResults: [
        { studentId: mainStudent._id, studentName: 'Sarah Jenkins', score: 95 },
        { studentId: studentUsers[1]._id, studentName: 'John Doe', score: 85 },
        { studentId: studentUsers[3]._id, studentName: 'Robert Johnson', score: 92 }
      ]
    },
    {
      title: 'Algorithms Midterm', courseId: 'C01', subject: 'Algorithms',
      date: '2024-11-15', duration: '90 mins', type: 'Midterm', status: 'completed', resultsPublished: true,
      studentResults: [
        { studentId: mainStudent._id, studentName: 'Sarah Jenkins', score: 91 },
        { studentId: studentUsers[1]._id, studentName: 'John Doe', score: 78 },
        { studentId: studentUsers[3]._id, studentName: 'Robert Johnson', score: 88 }
      ]
    },
    {
      title: 'Software Engineering Assessment', courseId: 'C02', subject: 'Software Engineering',
      date: '2024-09-05', duration: '45 mins', type: 'Assessment', status: 'completed', resultsPublished: true,
      studentResults: [
        { studentId: studentUsers[2]._id, studentName: 'Jane Smith', score: 88 }
      ]
    },
    {
      title: 'Calculus Final Exam', courseId: 'C03', subject: 'Advanced Calculus',
      date: '2024-12-20', duration: '120 mins', type: 'Final', status: 'completed', resultsPublished: false,
      studentResults: [
        { studentId: studentUsers[4]._id, studentName: 'Emily Davis', score: null }
      ]
    }
  ]);
  console.log('✓ Exams created (4)');

  // =============================================
  // 15. LECTURES (course-wise) + AUTO-GENERATED ATTENDANCE
  // =============================================
  const lectures = await Lecture.insertMany([
    {
      courseId: 'C01', subject: 'Data Structures', date: today, time: '10:00 AM',
      instructor: 'Eng. Alice Cooper', facultyId: facultyUsers[2]._id,
      attendance: [
        { studentId: mainStudent._id.toString(), studentName: 'Sarah Jenkins', present: true },
        { studentId: studentUsers[1]._id.toString(), studentName: 'John Doe', present: false },
        { studentId: studentUsers[3]._id.toString(), studentName: 'Robert Johnson', present: true }
      ]
    },
    {
      courseId: 'C01', subject: 'Algorithms', date: today, time: '01:00 PM',
      instructor: 'Eng. Alice Cooper', facultyId: facultyUsers[2]._id,
      attendance: [
        { studentId: mainStudent._id.toString(), studentName: 'Sarah Jenkins', present: true },
        { studentId: studentUsers[1]._id.toString(), studentName: 'John Doe', present: false }
      ]
    },
    {
      courseId: 'C01', subject: 'Algorithms', date: '2024-05-19', time: '09:00 AM',
      instructor: 'Eng. Alice Cooper', facultyId: facultyUsers[2]._id,
      attendance: [
        { studentId: mainStudent._id.toString(), studentName: 'Sarah Jenkins', present: true },
        { studentId: studentUsers[1]._id.toString(), studentName: 'John Doe', present: true }
      ]
    },
    {
      courseId: 'C01', subject: 'Database Management', date: '2024-05-19', time: '09:00 AM',
      instructor: 'Prof. Michael Brown', facultyId: facultyUsers[1]._id,
      attendance: [
        { studentId: mainStudent._id.toString(), studentName: 'Sarah Jenkins', present: true }
      ]
    },
    {
      courseId: 'C01', subject: 'English Language', date: '2024-05-19', time: '08:00 AM',
      instructor: 'Dr. Sarah Wilson', facultyId: facultyUsers[0]._id,
      attendance: [
        { studentId: mainStudent._id.toString(), studentName: 'Sarah Jenkins', present: false }
      ]
    },
    {
      courseId: 'C01', subject: 'Operating Systems', date: '2024-05-18', time: '02:00 PM',
      instructor: 'Dr. Robert Blake', facultyId: facultyUsers[3]._id,
      attendance: [
        { studentId: mainStudent._id.toString(), studentName: 'Sarah Jenkins', present: true }
      ]
    },
    {
      courseId: 'C01', subject: 'Data Structures', date: '2024-05-17', time: '11:00 AM',
      instructor: 'Eng. Alice Cooper', facultyId: facultyUsers[2]._id,
      attendance: [
        { studentId: mainStudent._id.toString(), studentName: 'Sarah Jenkins', present: true }
      ]
    },
    {
      courseId: 'C01', subject: 'Algorithms', date: '2024-05-16', time: '08:00 AM',
      instructor: 'Eng. Alice Cooper', facultyId: facultyUsers[2]._id,
      attendance: [
        { studentId: mainStudent._id.toString(), studentName: 'Sarah Jenkins', present: true }
      ]
    },
    {
      courseId: 'C01', subject: 'Data Structures', date: '2024-05-15', time: '10:00 AM',
      instructor: 'Eng. Alice Cooper', facultyId: facultyUsers[2]._id,
      attendance: [
        { studentId: mainStudent._id.toString(), studentName: 'Sarah Jenkins', present: false }
      ]
    },
    {
      courseId: 'C01', subject: 'Database Management', date: '2024-05-14', time: '09:00 AM',
      instructor: 'Prof. Michael Brown', facultyId: facultyUsers[1]._id,
      attendance: [
        { studentId: mainStudent._id.toString(), studentName: 'Sarah Jenkins', present: true }
      ]
    },
    {
      courseId: 'C02', subject: 'Computer Networks', date: today, time: '02:00 PM',
      instructor: 'Eng. Alice Cooper', facultyId: facultyUsers[2]._id,
      attendance: [
        { studentId: studentUsers[2]._id.toString(), studentName: 'Jane Smith', present: true }
      ]
    },
    {
      courseId: 'C02', subject: 'Software Engineering', date: '2024-05-20', time: '10:00 AM',
      instructor: 'Dr. Sarah Wilson', facultyId: facultyUsers[0]._id,
      attendance: [
        { studentId: studentUsers[2]._id.toString(), studentName: 'Jane Smith', present: true }
      ]
    }
  ]);
  console.log('✓ Lectures created (' + lectures.length + ')');

  // =============================================
  // 7. ATTENDANCE (auto-generated from lectures)
  // =============================================
  const attendanceDocs = [];
  for (const lecture of lectures) {
    for (const a of lecture.attendance) {
      attendanceDocs.push({
        studentId: a.studentId,
        courseId: lecture.courseId,
        date: lecture.date,
        subject: lecture.subject,
        status: a.present ? 'present' : 'absent',
        timestamp: a.present ? (lecture.time || '') : '',
        lectureId: lecture._id
      });
    }
  }
  await Attendance.insertMany(attendanceDocs);
  console.log('✓ Attendance records created (' + attendanceDocs.length + ')');

  // =============================================
  // SUMMARY
  // =============================================
  console.log('\n========================================');
  console.log('  DATABASE SEED COMPLETE');
  console.log('========================================');
  console.log('');
  console.log('Collections created:');
  console.log('  admins          : 1 admin');
  console.log('  faculties       : 4 faculty members');
  console.log('  students        : 6 students');
  console.log('  courses         : 6 courses (C01-C06)');
  console.log('  assignments     : 6 (linked to courses)');
  console.log('  attendances     : 12 records');
  console.log('  fees            : 6 records');
  console.log('  schedules       : 14 timetable slots');
  console.log('  tests           : 6 upcoming');
  console.log('  exams           : 4 with results');
  console.log('  lectures        : 3');
  console.log('  notices         : 6');
  console.log('  studymaterials  : 16');
  console.log('  todos           : 2');
  console.log('  facultyposts    : 7');
  console.log('');
  console.log('Login credentials:');
  console.log('  Admin:   admin@campvia.edu / Admin123');
  console.log('  Faculty: sarah.wilson@campvia.edu / faculty123');
  console.log('  Student: student@campvia.edu / student123');
  console.log('========================================');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
