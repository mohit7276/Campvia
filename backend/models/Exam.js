const mongoose = require('mongoose');

// ============================================
// EXAM MODEL - Course-wise examinations
// ============================================
// Each exam belongs to a Course. Student results
// are stored in the studentResults array.

const examSchema = new mongoose.Schema({
  // --- Exam Info ---
  title:    { type: String, required: true },
  courseId: { type: String, required: true },                  // Links to Course.courseId
  subject:  { type: String, required: true },
  date:     { type: String, required: true },
  duration: { type: String, default: '' },
  type:     { type: String, default: 'Quiz' },
  status:   { type: String, enum: ['upcoming', 'completed'], default: 'upcoming' },
  resultsPublished: { type: Boolean, default: false },

  // --- Student Results ---
  studentResults: [{
    studentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    studentName: { type: String, default: '' },
    score:       { type: Number, default: null }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
