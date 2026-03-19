const router = require('express').Router();
const mongoose = require('mongoose');
const Lecture = require('../../models/Lecture');
const Attendance = require('../../models/Attendance');
const Student = require('../../models/Student');
const { auth, adminOrFaculty } = require('../../middleware/auth');
const {
  getAllowedCourseIds,
  isCourseAllowed,
  buildScopedCourseFilter
} = require('../../utils/facultyCourseAccess');

router.use(auth, adminOrFaculty);

function toNumberOrNaN(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

async function publishAttendanceSession(req, res) {
  try {
    const allowedCourseIds = await getAllowedCourseIds(req);
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid lecture ID for attendance publish' });
    }
    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) return res.status(404).json({ message: 'Lecture not found' });
    if (!isCourseAllowed(allowedCourseIds, lecture.courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }

    const lat = toNumberOrNaN(req.body?.location?.lat);
    const lng = toNumberOrNaN(req.body?.location?.lng);
    const accuracy = toNumberOrNaN(req.body?.location?.accuracy);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ message: 'Valid live GPS location is required to publish attendance.' });
    }

    const location = {
      lat,
      lng,
      accuracy: Number.isNaN(accuracy) ? 0 : Math.max(0, Math.round(accuracy))
    };

    lecture.qrSession = {
      active: true,
      token: '',
      startedAt: new Date(),
      location
    };
    await lecture.save();

    res.json({
      lectureId: lecture._id,
      subject: lecture.subject,
      location,
      message: 'Attendance published'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function stopAttendanceSession(req, res) {
  try {
    const allowedCourseIds = await getAllowedCourseIds(req);
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid lecture ID for attendance stop' });
    }
    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) return res.status(404).json({ message: 'Lecture not found' });
    if (!isCourseAllowed(allowedCourseIds, lecture.courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }

    lecture.qrSession = { active: false, token: '', startedAt: null, location: { lat: 0, lng: 0, accuracy: 0 } };
    await lecture.save();
    res.json({ message: 'Attendance stopped' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Get lectures (filter by courseId, date)
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
    if (req.query.date) filter.date = req.query.date;
    const lectures = await Lecture.find(filter).sort({ date: -1, time: 1 });
    res.json(lectures);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create lecture
router.post('/', async (req, res) => {
  try {
    const allowedCourseIds = await getAllowedCourseIds(req);
    if (!isCourseAllowed(allowedCourseIds, req.body.courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }

    const lecture = new Lecture(req.body);
    await lecture.save();

    // Auto-create 'absent' attendance records for all students in this course
    if (lecture.courseId) {
      const students = await Student.find({ courseId: lecture.courseId }, '_id name');
      const attendanceDocs = students.map(s => ({
        studentId: s._id,
        courseId: lecture.courseId,
        date: lecture.date,
        subject: lecture.subject,
        status: 'absent',
        timestamp: '',
        lectureId: lecture._id
      }));
      if (attendanceDocs.length > 0) {
        await Attendance.insertMany(attendanceDocs, { ordered: false }).catch(() => {});
      }
    }

    res.status(201).json(lecture);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update lecture
router.put('/:id', async (req, res) => {
  try {
    const allowedCourseIds = await getAllowedCourseIds(req);
    const existing = await Lecture.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ message: 'Lecture not found' });
    if (!isCourseAllowed(allowedCourseIds, existing.courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }
    if (req.body.courseId && !isCourseAllowed(allowedCourseIds, req.body.courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }

    const lecture = await Lecture.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(lecture);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete lecture (also removes all linked attendance records)
router.delete('/:id', async (req, res) => {
  try {
    const allowedCourseIds = await getAllowedCourseIds(req);
    const existing = await Lecture.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ message: 'Lecture not found' });
    if (!isCourseAllowed(allowedCourseIds, existing.courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }

    const lecture = await Lecture.findByIdAndDelete(req.params.id);
    // Cascade-delete all attendance records tied to this lecture
    await Attendance.deleteMany({ lectureId: lecture._id });
    res.json({ message: 'Lecture deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update attendance for a lecture
router.put('/:id/attendance', async (req, res) => {
  try {
    const allowedCourseIds = await getAllowedCourseIds(req);
    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) return res.status(404).json({ message: 'Lecture not found' });
    if (!isCourseAllowed(allowedCourseIds, lecture.courseId)) {
      return res.status(403).json({ message: 'Access denied: not your course' });
    }

    lecture.attendance = req.body.attendance;
    await lecture.save();

    // Also sync to Attendance collection
    for (const a of req.body.attendance) {
      await Attendance.findOneAndUpdate(
        { studentId: a.studentId, lectureId: lecture._id },
        {
          studentId: a.studentId,
          courseId: lecture.courseId,
          date: lecture.date,
          subject: lecture.subject,
          status: a.present ? 'present' : 'absent',
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          lectureId: lecture._id
        },
        { upsert: true, new: true }
      );
    }

    res.json(lecture);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Publish/Stop attendance session
router.post('/:id/attendance/publish', publishAttendanceSession);
router.post('/:id/attendance/stop', stopAttendanceSession);

// Backward-compatible aliases for old QR endpoints
router.post('/:id/qr-session/start', publishAttendanceSession);
router.post('/:id/qr-session/stop', stopAttendanceSession);

module.exports = router;
