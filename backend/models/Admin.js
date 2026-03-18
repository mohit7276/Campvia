const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ============================================
// ADMIN MODEL - Admin credentials & profile
// ============================================
// Stores admin login credentials.
// Admins manage students, faculty, courses, and all academic data.

const adminSchema = new mongoose.Schema({
  // --- Authentication ---
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role:     { type: String, default: 'admin', immutable: true },

  // --- Contact ---
  phone:   { type: String, default: '' },
  address: { type: String, default: '' },
  avatar:  { type: String, default: '' },

  // --- Status ---
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

// Hash password before saving
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);
