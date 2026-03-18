const mongoose = require('mongoose');

// ============================================
// TEST MODEL - Course-wise tests/quizzes
// ============================================
// Upcoming and past tests organized by course.

const testSchema = new mongoose.Schema({
  subject:     { type: String, required: true },
  courseId:    { type: String, required: true },               // Links to Course.courseId
  description: { type: String, default: '' },
  date:        { type: String, required: true },
  type:        { type: String, default: 'Quiz' },
  room:        { type: String, default: '' },
  duration:    { type: String, default: '' },
  importance:  { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  urgent:      { type: Boolean, default: false },
  status:      { type: String, enum: ['upcoming', 'completed'], default: 'upcoming' }
}, { timestamps: true });

module.exports = mongoose.model('Test', testSchema);
