const router = require('express').Router();
const Assignment = require('../../models/Assignment');
const Student = require('../../models/Student');
const { auth, adminOnly } = require('../../middleware/auth');

router.use(auth, adminOnly);

async function buildCourseSubmissionRoster(assignmentDoc) {
  const assignment = assignmentDoc.toObject ? assignmentDoc.toObject() : assignmentDoc;
  const students = await Student.find({ courseId: assignment.courseId }).select('_id name').lean();

  const existingByStudentId = new Map(
    (assignment.submissions || []).map((s) => {
      const sid = (s.studentId && s.studentId.toString) ? s.studentId.toString() : String(s.studentId || '');
      return [sid, s];
    })
  );

  return students.map((student) => {
    const sid = student._id.toString();
    const existing = existingByStudentId.get(sid);
    if (existing) {
      return {
        ...existing,
        studentId: sid,
        studentName: existing.studentName || student.name,
        status: existing.status || 'pending'
      };
    }

    return {
      studentId: sid,
      studentName: student.name,
      status: 'pending',
      links: [],
      fileName: '',
      submittedAt: null
    };
  });
}

// Get all assignments (optionally filter by courseId)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.courseId) filter.courseId = req.query.courseId;
    const assignments = await Assignment.find(filter).sort({ dueDate: -1 });
    const hydrated = await Promise.all(
      assignments.map(async (assignment) => ({
        ...(assignment.toObject ? assignment.toObject() : assignment),
        submissions: await buildCourseSubmissionRoster(assignment)
      }))
    );
    res.json(hydrated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create assignment
router.post('/', async (req, res) => {
  try {
    const assignment = new Assignment(req.body);
    await assignment.save();
    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update assignment
router.put('/:id', async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete assignment
router.delete('/:id', async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    res.json({ message: 'Assignment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get submissions for an assignment
router.get('/:id/submissions', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    const roster = await buildCourseSubmissionRoster(assignment);
    res.json(roster);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update submission status
router.put('/:id/submissions/:studentId', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    const targetStudentId = req.params.studentId;
    const sub = assignment.submissions.find(s => s.studentId && s.studentId.toString() === targetStudentId);

    if (sub) {
      sub.status = req.body.status;
    } else if (req.body.status === 'submitted') {
      const student = await Student.findById(targetStudentId).select('name').lean();
      assignment.submissions.push({
        studentId: targetStudentId,
        studentName: student?.name || 'Student',
        status: 'submitted',
        submittedAt: new Date(),
        links: [],
        fileName: ''
      });
    }

    await assignment.save();
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
