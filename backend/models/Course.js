const mongoose = require('mongoose');

// ============================================
// COURSE MODEL - Central hub for all academic data
// ============================================
// The Course is the core entity. All academic data
// (assignments, schedules, tests, exams, lectures,
// study materials, fees) are linked to a course
// via the courseId field.
//
// Related collections:
//   Student.courseId     → students enrolled in this course
//   Assignment.courseId  → assignments for this course
//   Schedule.courseId    → timetable for this course
//   Test.courseId        → tests for this course
//   Exam.courseId        → exams for this course
//   Lecture.courseId     → lectures for this course
//   StudyMaterial.courseId → materials for this course
//   Fee.courseId         → fee records for this course
//   Attendance.courseId  → attendance for this course

const courseSchema = new mongoose.Schema({
  // --- Identifier ---
  courseId: { type: String, required: true, unique: true },  // e.g. "C01", "C02"

  // --- Course Details ---
  name:     { type: String, required: true },                // e.g. "Computer Science"
  head:     { type: String, default: '' },                   // Department head name
  duration: { type: String, default: '' },                   // e.g. "4 years"
  type:     { type: String, default: 'Undergraduate' },      // Undergraduate / Postgraduate
  subjects: [{ type: String }],                              // List of subjects in this course
  totalFees: { type: Number, default: 0 },                   // Total course fees

  // --- Landing Page Display ---
  title:       { type: String, default: '' },
  category:    { type: String, default: '' },
  image:       { type: String, default: '' },
  description: { type: String, default: '' },
  rating:      { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
