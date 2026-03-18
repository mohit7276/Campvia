const mongoose = require('mongoose');

// ============================================
// STUDY MATERIAL MODEL - Course-wise resources
// ============================================
// Study materials (PDFs, links, videos) organized by course.

const studyMaterialSchema = new mongoose.Schema({
  title:      { type: String, required: true },
  subject:    { type: String, required: true },
  courseId:   { type: String, default: '' },                   // Links to Course.courseId
  category:   { type: String, default: '' },
  fileUrl:    { type: String, default: '#' },
  driveUrl:   { type: String, default: '' },
  uploadDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  size:       { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);
