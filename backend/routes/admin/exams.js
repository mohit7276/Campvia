const router = require('express').Router();
const Exam = require('../../models/Exam');
const { auth, adminOrFaculty } = require('../../middleware/auth');
const {
  getAllowedCourseIds,
  isCourseAllowed,
  buildScopedCourseFilter
} = require('../../utils/facultyCourseAccess');

router.use(auth, adminOrFaculty);

// Get exams (filter by courseId, status)
router.get('/', async (req, res) => {
  try {
    const allowedCourseIds = await getAllowedCourseIds(req);
    const filter = buildScopedCourseFilter({}, allowedCourseIds);
    if (req.query.courseId) {
      if (!isCourseAllowed(allowedCourseIds, req.query.courseId)) {
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

// Create exam
router.post('/', async (req, res) => {
  try {
    const allowedCourseIds = await getAllowedCourseIds(req);
    if (!isCourseAllowed(allowedCourseIds, req.body.courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }

    const exam = new Exam(req.body);
    await exam.save();
    res.status(201).json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update exam
router.put('/:id', async (req, res) => {
  try {
    const allowedCourseIds = await getAllowedCourseIds(req);
    const existing = await Exam.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ message: 'Exam not found' });
    if (!isCourseAllowed(allowedCourseIds, existing.courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }
    if (req.body.courseId && !isCourseAllowed(allowedCourseIds, req.body.courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }

    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete exam
router.delete('/:id', async (req, res) => {
  try {
    const allowedCourseIds = await getAllowedCourseIds(req);
    const existing = await Exam.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ message: 'Exam not found' });
    if (!isCourseAllowed(allowedCourseIds, existing.courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }

    const exam = await Exam.findByIdAndDelete(req.params.id);
    res.json({ message: 'Exam deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update scores for an exam
router.put('/:id/scores', async (req, res) => {
  try {
    const allowedCourseIds = await getAllowedCourseIds(req);
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (!isCourseAllowed(allowedCourseIds, exam.courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }

    exam.studentResults = req.body.studentResults;
    await exam.save();
    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Publish/unpublish results
router.put('/:id/publish', async (req, res) => {
  try {
    const allowedCourseIds = await getAllowedCourseIds(req);
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (!isCourseAllowed(allowedCourseIds, exam.courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }

    exam.resultsPublished = req.body.publish;
    await exam.save();
    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
