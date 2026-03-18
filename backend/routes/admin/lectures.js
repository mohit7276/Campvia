const router = require('express').Router();
const Lecture = require('../../models/Lecture');
const Attendance = require('../../models/Attendance');
const Student = require('../../models/Student');
const { auth, adminOnly } = require('../../middleware/auth');

router.use(auth, adminOnly);

// Get lectures (filter by courseId, date)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.courseId) filter.courseId = req.query.courseId;
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
    const lecture = await Lecture.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lecture) return res.status(404).json({ message: 'Lecture not found' });
    res.json(lecture);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete lecture (also removes all linked attendance records)
router.delete('/:id', async (req, res) => {
  try {
    const lecture = await Lecture.findByIdAndDelete(req.params.id);
    if (!lecture) return res.status(404).json({ message: 'Lecture not found' });
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
    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) return res.status(404).json({ message: 'Lecture not found' });
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

// Start QR session
router.post('/:id/qr-session/start', async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) return res.status(404).json({ message: 'Lecture not found' });
    lecture.qrSession = {
      active: true,
      location: req.body.location
    };
    await lecture.save();
    res.json({ lectureId: lecture._id, subject: lecture.subject, location: req.body.location });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Stop QR session
router.post('/:id/qr-session/stop', async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) return res.status(404).json({ message: 'Lecture not found' });
    lecture.qrSession = { active: false, location: { lat: 0, lng: 0 } };
    await lecture.save();
    res.json({ message: 'QR session stopped' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
