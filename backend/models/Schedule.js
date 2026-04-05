const mongoose = require('mongoose');

// ============================================
// SCHEDULE MODEL - Course-wise timetable
// ============================================
// Weekly schedule entries for each course.
// dayOfWeek: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri

const scheduleSchema = new mongoose.Schema({
  courseId:   { type: String, required: true },                // Links to Course.courseId
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
  time:      { type: String, required: true },                 // Start time (e.g. "09:00")
  endTime:   { type: String, default: '' },                    // End time (e.g. "10:00")
  subject:   { type: String, required: true },
  room:      { type: String, default: '' },
  duration:  { type: String, default: '' },
  type:      { type: String, enum: ['lecture', 'lab', 'seminar', 'workshop'], default: 'lecture' },
  faculty:   { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
