const mongoose = require('mongoose');

// ============================================
// ATTENDANCE MODEL - Student attendance records
// ============================================
// Tracks per-student, per-subject attendance.
// Linked to both Student and Course for easy filtering.

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  courseId:  { type: String, default: '' },                    // Links to Course.courseId
  date:      { type: String, required: true },
  subject:   { type: String, required: true },
  status:    { type: String, enum: ['present', 'absent'], required: true },
  timestamp: { type: String, default: '' },
  lectureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lecture' }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
