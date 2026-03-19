const router = require('express').Router();
const Schedule = require('../../models/Schedule');
const { auth, adminOrFaculty } = require('../../middleware/auth');
const {
  getAllowedCourseIds,
  isCourseAllowed,
  buildScopedCourseFilter
} = require('../../utils/facultyCourseAccess');

router.use(auth, adminOrFaculty);

// Get schedule (filter by courseId, day)
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
    if (req.query.day) filter.dayOfWeek = parseInt(req.query.day);
    const schedules = await Schedule.find(filter).sort({ dayOfWeek: 1, time: 1 });
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create schedule item
router.post('/', async (req, res) => {
  try {
    const allowedCourseIds = await getAllowedCourseIds(req);
    if (!isCourseAllowed(allowedCourseIds, req.body.courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }

    const item = new Schedule(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update schedule item
router.put('/:id', async (req, res) => {
  try {
    const allowedCourseIds = await getAllowedCourseIds(req);
    const existing = await Schedule.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ message: 'Schedule item not found' });
    if (!isCourseAllowed(allowedCourseIds, existing.courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }
    if (req.body.courseId && !isCourseAllowed(allowedCourseIds, req.body.courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }

    const item = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete schedule item
router.delete('/:id', async (req, res) => {
  try {
    const allowedCourseIds = await getAllowedCourseIds(req);
    const existing = await Schedule.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ message: 'Schedule item not found' });
    if (!isCourseAllowed(allowedCourseIds, existing.courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }

    const item = await Schedule.findByIdAndDelete(req.params.id);
    res.json({ message: 'Schedule item deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
