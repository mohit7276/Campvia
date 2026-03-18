const router = require('express').Router();
const Fee = require('../../models/Fee');
const Student = require('../../models/Student');
const { ensureSemesterFeesForStudent } = require('../../utils/semesterFees');
const { auth, adminOnly } = require('../../middleware/auth');

router.use(auth, adminOnly);

// Get all fees (optionally filtered by studentId or courseId)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.studentId) filter.studentId = req.query.studentId;
    if (req.query.courseId)  filter.courseId  = req.query.courseId;
    if (req.query.status)    filter.status    = req.query.status;
    const fees = await Fee.find(filter).sort({ dueDate: -1 }).lean();
    res.json(fees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Auto-generate missing semester fees for all enrolled students
router.post('/sync-auto', async (req, res) => {
  try {
    const students = await Student.find({ courseId: { $exists: true, $ne: '' } })
      .select('_id courseId')
      .lean();

    let createdRecords = 0;
    let processedStudents = 0;

    for (const student of students) {
      const before = await Fee.countDocuments({ studentId: student._id, courseId: student.courseId });
      await ensureSemesterFeesForStudent({
        studentId: student._id,
        courseId: student.courseId,
        forceRegenerate: false
      });
      const after = await Fee.countDocuments({ studentId: student._id, courseId: student.courseId });
      createdRecords += Math.max(0, after - before);
      processedStudents += 1;
    }

    res.json({
      message: 'Auto fee sync completed',
      processedStudents,
      createdRecords
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single fee record
router.get('/:id', async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id).lean();
    if (!fee) return res.status(404).json({ message: 'Fee not found' });
    res.json(fee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create fee record
router.post('/', async (req, res) => {
  try {
    const { studentId, courseId, title, amount, dueDate, status, category, semester } = req.body;
    if (!studentId || !title || !amount || !dueDate) {
      return res.status(400).json({ message: 'studentId, title, amount, and dueDate are required' });
    }
    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const fee = new Fee({ studentId, courseId: courseId || '', title, amount, dueDate, status: status || 'pending', category: category || '', semester: semester || '' });
    await fee.save();
    res.status(201).json(fee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update fee record
router.put('/:id', async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates._id;
    const fee = await Fee.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!fee) return res.status(404).json({ message: 'Fee not found' });
    res.json(fee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete fee record
router.delete('/:id', async (req, res) => {
  try {
    const fee = await Fee.findByIdAndDelete(req.params.id);
    if (!fee) return res.status(404).json({ message: 'Fee not found' });
    res.json({ message: 'Fee deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate/refresh fees for a student (auto-creates based on course totalFees)
router.post('/generate/:studentId', async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    if (!student.courseId) return res.status(400).json({ message: 'Student has no course assigned' });

    const fees = await ensureSemesterFeesForStudent({
      studentId: student._id,
      courseId: student.courseId,
      forceRegenerate: true
    });

    res.json({ message: `Generated semester-wise fees`, fees });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
