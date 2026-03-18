const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ============================================
// STUDENT MODEL - Student credentials & profile
// ============================================
// Stores student login credentials and academic info.
// Each student is linked to a Course via courseId.
// Related collections: Attendance, Fee, Todo, Exam (results)

const studentSchema = new mongoose.Schema({
  // --- Authentication ---
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role:     { type: String, default: 'student', immutable: true },

  // --- Contact ---
  phone:   { type: String, default: '' },
  address: { type: String, default: '' },
  avatar:  { type: String, default: '' },

  // --- Academic Info (course-wise) ---
  courseId:  { type: String, default: '' },   // Links to Course.courseId (e.g. "C01")
  course:   { type: String, default: '' },    // Course name for display (e.g. "Computer Science")
  year:     { type: Number, default: 1 },
  semester: { type: Number, default: 1 },
  rollNo:   { type: String, default: '' },

  // --- Performance ---
  gpa:         { type: Number, default: 0 },
  avgScore:    { type: Number, default: 0 },
  classRank:   { type: Number, default: 0 },
  collegeRank: { type: Number, default: 0 },

  // --- Profile ---
  bio:            { type: String, default: '' },
  specialization: { type: String, default: '' },
  location:       { type: String, default: '' },

  // --- Financial ---
  feesPaid: { type: Number, default: 0 },

  // --- Status ---
  status: { type: String, enum: ['active', 'inactive', 'suspended', 'Active', 'Inactive', 'Graduating'], default: 'active' }
}, { timestamps: true });

// Hash password before saving
studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
studentSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Index for fast course-based student lookups (getStudentsByCourse)
studentSchema.index({ courseId: 1 });
// Normal (non-unique) index on rollNo for fast lookups — uniqueness enforced at app level
studentSchema.index({ rollNo: 1 }, { sparse: true });

module.exports = mongoose.model('Student', studentSchema);
