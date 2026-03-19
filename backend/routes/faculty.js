const router = require('express').Router();
const { auth } = require('../middleware/auth');
const Assignment = require('../models/Assignment');
const Exam = require('../models/Exam');
const Student = require('../models/Student');
const Schedule = require('../models/Schedule');
const Notice = require('../models/Notice');
const {
  getFacultyCourseIds,
  isCourseAllowed,
  buildScopedCourseFilter
} = require('../utils/facultyCourseAccess');

router.use(auth);

// GET /api/faculty/assignments
// Returns all assignments for courses this faculty teaches
router.get('/assignments', async (req, res) => {
  try {
    const courseIds = await getFacultyCourseIds(req.user);
    if (!courseIds.length) return res.json([]);

    const assignments = await Assignment.find({ courseId: { $in: courseIds } }).sort({ dueDate: -1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/faculty/assignments/:id/submissions
// Returns the full submissions list (including links) for a single assignment
router.get('/assignments/:id/submissions', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    // Verify this faculty teaches the course
    const courseIds = await getFacultyCourseIds(req.user);
    if (!courseIds.includes(assignment.courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }

    res.json(assignment.submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/faculty/assignments/:id/submissions/:studentId/reject
// Faculty rejects a submission — resets it to pending so student can resubmit
router.put('/assignments/:id/submissions/:studentId/reject', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    const courseIds = await getFacultyCourseIds(req.user);
    if (!courseIds.includes(assignment.courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }

    const sub = assignment.submissions.find(s => s.studentId && s.studentId.toString() === req.params.studentId);
    if (sub) {
      sub.status = 'pending';
      await assignment.save();
    }
    res.json({ message: 'Submission rejected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== EXAM ROUTES ====================

// GET /api/faculty/exams  — all exams for faculty's courses
router.get('/exams', async (req, res) => {
  try {
    const courseIds = await getFacultyCourseIds(req.user);
    if (!courseIds.length) return res.json([]);
    const filter = buildScopedCourseFilter({}, courseIds);
    if (req.query.courseId) {
      if (!isCourseAllowed(courseIds, req.query.courseId)) {
        return res.status(403).json({ message: 'Access denied: not your course' });
      }
      filter.courseId = req.query.courseId;
    }
    if (req.query.status) filter.status = req.query.status;
    const exams = await Exam.find(filter).sort({ date: -1 });
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/faculty/exams
router.post('/exams', async (req, res) => {
  try {
    const courseIds = await getFacultyCourseIds(req.user);
    if (!isCourseAllowed(courseIds, req.body.courseId)) {
      return res.status(403).json({ message: 'Not your course' });
    }
    const exam = new Exam(req.body);
    await exam.save();
    res.status(201).json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/faculty/exams/:id
router.put('/exams/:id', async (req, res) => {
  try {
    const courseIds = await getFacultyCourseIds(req.user);
    const existing = await Exam.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ message: 'Exam not found' });
    if (!isCourseAllowed(courseIds, existing.courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }
    if (req.body.courseId && !isCourseAllowed(courseIds, req.body.courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }

    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/faculty/exams/:id
router.delete('/exams/:id', async (req, res) => {
  try {
    const courseIds = await getFacultyCourseIds(req.user);
    const existing = await Exam.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ message: 'Exam not found' });
    if (!isCourseAllowed(courseIds, existing.courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }

    const exam = await Exam.findByIdAndDelete(req.params.id);
    res.json({ message: 'Exam deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/faculty/exams/:id/scores  — save student scores
router.put('/exams/:id/scores', async (req, res) => {
  try {
    const courseIds = await getFacultyCourseIds(req.user);
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (!isCourseAllowed(courseIds, exam.courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }
    exam.studentResults = req.body.studentResults;
    await exam.save();
    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/faculty/exams/:id/publish  — publish or unpublish results
router.put('/exams/:id/publish', async (req, res) => {
  try {
    const courseIds = await getFacultyCourseIds(req.user);
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (!isCourseAllowed(courseIds, exam.courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }
    exam.resultsPublished = req.body.publish;
    await exam.save();
    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/faculty/dashboard/summary
// Returns today's schedule, upcoming exams, and notices for the faculty's courses
router.get('/dashboard/summary', async (req, res) => {
  try {
    const courseIds = await getFacultyCourseIds(req.user);
    if (!courseIds.length) {
      return res.json({ schedule: [], tests: [], notices: [] });
    }

    const today = new Date();
    const dayOfWeek = today.getDay() || 7; // 1=Mon ... 7=Sun
    const todayStr = today.toISOString().split('T')[0];

    const [schedule, exams, notices] = await Promise.all([
      Schedule.find({ dayOfWeek: dayOfWeek <= 5 ? dayOfWeek : 1, courseId: { $in: courseIds } }).sort({ time: 1 }).lean(),
      Exam.find({ courseId: { $in: courseIds }, date: { $gte: todayStr }, status: { $ne: 'completed' } }).sort({ date: 1 }).limit(5).lean(),
      Notice.find({ $or: [{ courseId: '' }, { courseId: { $exists: false } }, { courseId: { $in: courseIds } }] }).sort({ date: -1 }).limit(5).lean()
    ]);

    // Normalise exams to the same shape the front-end expects from the student Test model
    const tests = exams.map(e => ({
      _id: e._id,
      subject: e.subject || e.title || 'Exam',
      date: e.date,
      description: e.description || e.courseId || '',
      urgent: e.date === todayStr
    }));

    res.json({ schedule, tests, notices });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/faculty/courses/:courseId/students  — students enrolled in a course
router.get('/courses/:courseId/students', async (req, res) => {
  try {
    const courseIds = await getFacultyCourseIds(req.user);
    if (!isCourseAllowed(courseIds, req.params.courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }

    const students = await Student.find({ courseId: req.params.courseId }).select('_id name email');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
