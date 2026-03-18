const mongoose = require('mongoose');

// ============================================
// FEE MODEL - Student fee records (course-wise)
// ============================================
// Each fee record belongs to a Student and a Course.

const feeSchema = new mongoose.Schema({
  studentId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  courseId:      { type: String, default: '' },                // Links to Course.courseId
  title:         { type: String, required: true },
  amount:        { type: Number, required: true },
  dueDate:       { type: String, required: true },
  status:        { type: String, enum: ['paid', 'pending', 'overdue'], default: 'pending' },
  category:      { type: String, default: '' },
  semester:      { type: String, default: '' },
  paidDate:      { type: String, default: '' },
  transactionId: { type: String, default: '' },
  method:        { type: String, default: '' }
}, { timestamps: true });

// Indexes for fast lookups by student and course
feeSchema.index({ studentId: 1, dueDate: -1 });
feeSchema.index({ courseId: 1 });

module.exports = mongoose.model('Fee', feeSchema);
