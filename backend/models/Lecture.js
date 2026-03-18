const mongoose = require('mongoose');

// ============================================
// LECTURE MODEL - Course-wise lectures
// ============================================
// Each lecture belongs to a Course. Tracks attendance
// per student and supports QR-based attendance sessions.

const lectureSchema = new mongoose.Schema({
  // --- Lecture Info ---
  courseId:   { type: String, required: true },                // Links to Course.courseId
  subject:    { type: String, required: true },
  date:       { type: String, required: true },
  time:       { type: String, default: '' },
  instructor: { type: String, default: '' },
  facultyId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },  // Optional ref to Faculty

  // --- Per-student attendance for this lecture ---
  attendance: [{
    studentId:   { type: String, required: true },
    studentName: { type: String, default: '' },
    present:     { type: Boolean, default: false }
  }],

  // --- QR Attendance Session ---
  qrSession: {
    active:   { type: Boolean, default: false },
    location: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 }
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Lecture', lectureSchema);
