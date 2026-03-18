const router = require('express').Router();
const StudyMaterial = require('../models/StudyMaterial');
const { auth } = require('../middleware/auth');

// Get study materials (filtered by course for students)
router.get('/', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.subject) filter.subject = req.query.subject;

    // If the user is a student, filter by their course
    if (req.user.role === 'student') {
      const courseId = req.user.courseId || '';
      if (!courseId) return res.json([]);
      filter.courseId = courseId;
    }

    const materials = await StudyMaterial.find(filter).sort({ uploadDate: -1 });
    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get unique subjects (filtered by course for students)
router.get('/subjects', auth, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'student') {
      const courseId = req.user.courseId || '';
      if (!courseId) return res.json([]);
      filter.courseId = courseId;
    }
    const materials = await StudyMaterial.find(filter);
    const subjects = [...new Set(materials.map(m => m.subject))];
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
