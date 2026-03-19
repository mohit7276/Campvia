const router = require('express').Router();
const Test = require('../../models/Test');
const { auth, adminOrFaculty } = require('../../middleware/auth');
const {
  getAllowedCourseIds,
  isCourseAllowed,
  buildScopedCourseFilter
} = require('../../utils/facultyCourseAccess');

router.use(auth, adminOrFaculty);

// Get tests (filter by courseId, status)
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
    const tests = await Test.find(filter).sort({ date: -1 });
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create test
router.post('/', async (req, res) => {
  try {
    const allowedCourseIds = await getAllowedCourseIds(req);
    if (!isCourseAllowed(allowedCourseIds, req.body.courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }

    const test = new Test(req.body);
    await test.save();
    res.status(201).json(test);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update test
router.put('/:id', async (req, res) => {
  try {
    const allowedCourseIds = await getAllowedCourseIds(req);
    const existing = await Test.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ message: 'Test not found' });
    if (!isCourseAllowed(allowedCourseIds, existing.courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }
    if (req.body.courseId && !isCourseAllowed(allowedCourseIds, req.body.courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }

    const test = await Test.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(test);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete test
router.delete('/:id', async (req, res) => {
  try {
    const allowedCourseIds = await getAllowedCourseIds(req);
    const existing = await Test.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ message: 'Test not found' });
    if (!isCourseAllowed(allowedCourseIds, existing.courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }

    const test = await Test.findByIdAndDelete(req.params.id);
    res.json({ message: 'Test deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
