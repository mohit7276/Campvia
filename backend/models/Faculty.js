const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ============================================
// FACULTY MODEL - Faculty credentials & profile
// ============================================
// Stores faculty login credentials and professional info.
// Faculty can be linked to courses they teach via courseIds[].
// Related collections: FacultyPost, Lecture

const facultySchema = new mongoose.Schema({
  // --- Authentication ---
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role:     { type: String, default: 'faculty', immutable: true },

  // --- Contact ---
  phone:   { type: String, default: '' },
  address: { type: String, default: '' },
  avatar:  { type: String, default: '' },

  // --- Professional Info ---
  department:  { type: String, default: '' },
  designation: { type: String, default: '' },
  office:      { type: String, default: '' },
  subjects:    [{ type: String }],              // Subjects they teach
  experience:  { type: String, default: '' },
  courseIds:    [{ type: String }],              // Course IDs they are assigned to (e.g. ["C01","C03"])

  // --- Status ---
  status: { type: String, enum: ['active', 'inactive', 'Active', 'Inactive', 'On Leave'], default: 'active' }
}, { timestamps: true });

// Hash password before saving
facultySchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
facultySchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Faculty', facultySchema);
