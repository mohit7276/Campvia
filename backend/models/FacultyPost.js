const mongoose = require('mongoose');

// ============================================
// FACULTY POST MODEL - Faculty shared resources
// ============================================
// Posts shared by faculty members (PDFs, links, videos).

const facultyPostSchema = new mongoose.Schema({
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
  courseId:  { type: String, default: '' },                    // Optional: Links to Course.courseId
  title:     { type: String, required: true },
  type:      { type: String, enum: ['pdf', 'link', 'video'], default: 'pdf' },
  date:      { type: String, default: () => new Date().toISOString().split('T')[0] }
}, { timestamps: true });

module.exports = mongoose.model('FacultyPost', facultyPostSchema);
