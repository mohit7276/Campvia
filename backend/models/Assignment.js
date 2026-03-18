const mongoose = require('mongoose');

// ============================================
// ASSIGNMENT MODEL - Course-wise assignments
// ============================================
// Each assignment belongs to a Course (via courseId).
// Students submit work tracked in the submissions array.

const assignmentSchema = new mongoose.Schema({
  // --- Assignment Info ---
  title:       { type: String, required: true },
  subject:     { type: String, required: true },
  courseId:    { type: String, required: true },               // Links to Course.courseId
  dueDate:     { type: String, required: true },
  description: { type: String, default: '' },
  status:      { type: String, enum: ['pending', 'submitted'], default: 'pending' },

  // --- Student Submissions ---
  submissions: [{
    studentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    studentName: { type: String, default: '' },
    fileName:    { type: String, default: '' },
    links:       [{ url: { type: String }, label: { type: String, default: '' } }],
    submittedAt: { type: Date, default: Date.now },
    status:      { type: String, enum: ['submitted', 'pending'], default: 'pending' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
