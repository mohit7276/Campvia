const router = require('express').Router();
const Todo = require('../models/Todo');
const { auth } = require('../middleware/auth');

router.use(auth);

// Get all todos for current user
router.get('/', async (req, res) => {
  try {
    const todos = await Todo.find({ studentId: req.user._id }).sort({ date: -1 });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create todo
router.post('/', async (req, res) => {
  try {
    const todo = new Todo({ ...req.body, studentId: req.user._id });
    await todo.save();
    res.status(201).json(todo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update todo
router.put('/:id', async (req, res) => {
  try {
    const todo = await Todo.findOneAndUpdate(
      { _id: req.params.id, studentId: req.user._id },
      req.body,
      { new: true }
    );
    if (!todo) return res.status(404).json({ message: 'Todo not found' });
    res.json(todo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete todo
router.delete('/:id', async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, studentId: req.user._id });
    if (!todo) return res.status(404).json({ message: 'Todo not found' });
    res.json({ message: 'Todo deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
