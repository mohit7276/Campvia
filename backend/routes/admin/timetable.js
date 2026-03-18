const router = require('express').Router();
const Schedule = require('../../models/Schedule');
const { auth, adminOnly } = require('../../middleware/auth');

router.use(auth, adminOnly);

// Get schedule (filter by courseId, day)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.courseId) filter.courseId = req.query.courseId;
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
    const item = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: 'Schedule item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete schedule item
router.delete('/:id', async (req, res) => {
  try {
    const item = await Schedule.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Schedule item not found' });
    res.json({ message: 'Schedule item deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
