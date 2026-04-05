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
    if (req.query.day !== undefined) filter.dayOfWeek = parseInt(req.query.day, 10);
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
    const courseId = typeof req.body.courseId === 'string' ? req.body.courseId.trim() : '';
    const subject = typeof req.body.subject === 'string' ? req.body.subject.trim() : '';
    const time = typeof req.body.time === 'string' ? req.body.time.trim() : '';
    const endTime = typeof req.body.endTime === 'string' ? req.body.endTime.trim() : '';
    const room = typeof req.body.room === 'string' ? req.body.room.trim() : '';
    const faculty = typeof req.body.faculty === 'string' ? req.body.faculty.trim() : '';
    const type = typeof req.body.type === 'string' ? req.body.type.trim() : '';
    const dayOfWeek = Number(req.body.dayOfWeek);

    if (!courseId || !subject || !time || Number.isNaN(dayOfWeek)) {
      return res.status(400).json({ message: 'courseId, subject, dayOfWeek, and time are required.' });
    }

    if (!isCourseAllowed(allowedCourseIds, courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }

    const item = new Schedule({
      ...req.body,
      courseId,
      subject,
      time,
      endTime,
      room,
      faculty,
      type: type || 'lecture',
      dayOfWeek
    });
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    console.error('Timetable POST Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update schedule item
router.put('/:id', async (req, res) => {
  try {
    const allowedCourseIds = await getAllowedCourseIds(req);
    const courseId = typeof req.body.courseId === 'string' ? req.body.courseId.trim() : '';
    const subject = typeof req.body.subject === 'string' ? req.body.subject.trim() : '';
    const time = typeof req.body.time === 'string' ? req.body.time.trim() : '';
    const endTime = typeof req.body.endTime === 'string' ? req.body.endTime.trim() : '';
    const room = typeof req.body.room === 'string' ? req.body.room.trim() : '';
    const faculty = typeof req.body.faculty === 'string' ? req.body.faculty.trim() : '';
    const type = typeof req.body.type === 'string' ? req.body.type.trim() : '';
    const dayOfWeek = req.body.dayOfWeek !== undefined ? Number(req.body.dayOfWeek) : undefined;

    const existing = await Schedule.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ message: 'Schedule item not found' });
    if (!isCourseAllowed(allowedCourseIds, existing.courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }
    if (courseId && !isCourseAllowed(allowedCourseIds, courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }

    const updatePayload = {
      ...req.body,
      ...(courseId ? { courseId } : {}),
      ...(subject ? { subject } : {}),
      ...(time ? { time } : {}),
      ...(endTime ? { endTime } : {}),
      ...(room ? { room } : {}),
      ...(faculty ? { faculty } : {}),
      ...(type ? { type } : {}),
      ...(dayOfWeek !== undefined && !Number.isNaN(dayOfWeek) ? { dayOfWeek } : {})
    };

    const item = await Schedule.findByIdAndUpdate(req.params.id, updatePayload, { new: true });
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
