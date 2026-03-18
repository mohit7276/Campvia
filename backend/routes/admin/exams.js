const router = require('express').Router();
const Exam = require('../../models/Exam');
const { auth, adminOnly } = require('../../middleware/auth');

router.use(auth, adminOnly);

// Get exams (filter by courseId, status)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.courseId) filter.courseId = req.query.courseId;
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
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete exam
router.delete('/:id', async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json({ message: 'Exam deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update scores for an exam
router.put('/:id/scores', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
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
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    exam.resultsPublished = req.body.publish;
    await exam.save();
    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
