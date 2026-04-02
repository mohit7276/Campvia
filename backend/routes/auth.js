const router = require('express').Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');
const Course = require('../models/Course');
const { auth } = require('../middleware/auth');

// Map role -> Model
function getModelForRole(role) {
  if (role === 'faculty') return Faculty;
  if (role === 'admin') return Admin;
  return Student; // default
}

// Helper: find user by email across all collections
async function findUserByEmail(email) {
  let user = await Student.findOne({ email });
  if (user) return user;
  user = await Faculty.findOne({ email });
  if (user) return user;
  user = await Admin.findOne({ email });
  return user;
}

function serializeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    courseId: user.courseId || '',
    courseIds: Array.isArray(user.courseIds) ? user.courseIds : [],
    course: user.course || '',
    semester: user.semester || '',
    status: user.status || 'active',
    avatar: user.avatar || ''
  };
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, courseId, courseTitle, courseName } = req.body;

    // Check if email exists in any collection
    const existing = await findUserByEmail(email);
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const Model = getModelForRole(role);

    const userData = { name, email, password };
    if (role === 'student') {
      const selectedCourseId = String(courseId || '').trim();
      const selectedCourseTitle = String(courseTitle || courseName || '').trim();
      const hasObjectIdValue = selectedCourseId && mongoose.Types.ObjectId.isValid(selectedCourseId);

      if (!selectedCourseId && !selectedCourseTitle) {
        return res.status(400).json({ message: 'Course is required' });
      }

      const course = await Course.findOne({
        $or: [
          ...(selectedCourseId ? [{ courseId: selectedCourseId }] : []),
          ...(hasObjectIdValue ? [{ _id: selectedCourseId }] : []),
          ...(selectedCourseTitle ? [{ title: selectedCourseTitle }] : []),
          ...(selectedCourseTitle ? [{ name: selectedCourseTitle }] : []),
        ]
      }).select('courseId name title').lean();
      if (!course) {
        return res.status(400).json({ message: 'Selected course is invalid' });
      }

      userData.courseId = course.courseId || selectedCourseId;
      userData.course = course.title && course.title.trim() ? course.title : course.name;
    }

    const user = new Model(userData);
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: serializeUser(user)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // If role is provided, authenticate strictly against that role collection.
    let user;
    if (role) {
      const Model = getModelForRole(role);
      user = await Model.findOne({ email });
    } else {
      user = await findUserByEmail(email);
    }

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: serializeUser(user)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
