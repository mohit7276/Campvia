const mongoose = require('mongoose');

// ============================================
// TODO MODEL - Student personal tasks
// ============================================
// Each todo belongs to a Student (via studentId).

const todoSchema = new mongoose.Schema({
  studentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  title:       { type: String, required: true },
  date:        { type: String, default: () => new Date().toISOString().split('T')[0] },
  time:        { type: String, default: '' },
  subject:     { type: String, default: '' },
  description: { type: String, default: '' },
  completed:   { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Todo', todoSchema);
