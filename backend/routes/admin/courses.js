const router = require('express').Router();
const Course = require('../../models/Course');
const Assignment = require('../../models/Assignment');
const Exam = require('../../models/Exam');
const Test = require('../../models/Test');
const Lecture = require('../../models/Lecture');
const Schedule = require('../../models/Schedule');
const { auth, adminOrFaculty } = require('../../middleware/auth');
const { getAllowedCourseIds, isCourseAllowed } = require('../../utils/facultyCourseAccess');

router.use(auth, adminOrFaculty);

// Get all courses
router.get('/', async (req, res) => {
  try {
    const allowedCourseIds = await getAllowedCourseIds(req);
    const filter = allowedCourseIds === null ? {} : { courseId: { $in: allowedCourseIds } };
    const courses = await Course.find(filter);
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single course
router.get('/:id', async (req, res) => {
  try {
    const allowedCourseIds = await getAllowedCourseIds(req);
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (!isCourseAllowed(allowedCourseIds, course.courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create course
router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const course = new Course(req.body);
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update course
router.put('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete course
router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    // Cascade delete all records tied to this course
    const cid = course.courseId;
    await Promise.all([
      Assignment.deleteMany({ courseId: cid }),
      Exam.deleteMany({ courseId: cid }),
      Test.deleteMany({ courseId: cid }),
      Lecture.deleteMany({ courseId: cid }),
      Schedule.deleteMany({ courseId: cid }),
    ]);
    res.json({ message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add subject to course
router.post('/:id/subjects', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    course.subjects.push(req.body.subject);
    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove subject from course
router.delete('/:id/subjects/:subject', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    course.subjects = course.subjects.filter(s => s !== req.params.subject);
    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
