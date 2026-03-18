const mongoose = require('mongoose');

// ============================================
// NOTICE MODEL - Announcements & notifications
// ============================================
// Notices can be general or course-specific.
// courseId is optional — empty means visible to all.

const attachmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url:  { type: String, required: true },
  type: { type: String, enum: ['image', 'pdf', 'doc', 'link', 'other'], default: 'other' }
}, { _id: false });

const noticeSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  category:    { type: String, enum: ['general', 'academic', 'event'], default: 'general' },
  courseId:    { type: String, default: '' },
  date:        { type: String, default: () => new Date().toISOString().split('T')[0] },
  sender:      { type: String, default: '' },
  role:        { type: String, default: '' },
  content:     { type: String, default: '' },
  priority:    { type: String, enum: ['high', 'normal'], default: 'normal' },
  attachment:  { type: String, default: '' },       // Legacy field kept for compat
  attachments: { type: [attachmentSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Notice', noticeSchema);
