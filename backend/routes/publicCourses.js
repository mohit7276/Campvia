const router = require('express').Router();
const Course = require('../models/Course');

// Public course list for registration dropdowns and other unauthenticated views.
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({})
      .select('courseId name title category duration')
      .sort({ name: 1, title: 1 })
      .lean();

    res.json(courses.map((course) => ({
      _id: course._id,
      courseId: course.courseId,
      name: course.name || '',
      title: course.title || '',
      category: course.category || '',
      duration: course.duration || ''
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;