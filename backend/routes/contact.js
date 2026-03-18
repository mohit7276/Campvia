const router = require('express').Router();
const Contact = require('../models/Contact');
const { auth, adminOnly } = require('../middleware/auth');

// PUBLIC — submit contact form
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required.' });
    }
    const contact = await Contact.create({ name, email, message });
    res.status(201).json({ message: 'Inquiry submitted successfully.', contact });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ADMIN — get all contact submissions
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ADMIN — mark as read/unread
router.patch('/:id/read', auth, adminOnly, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { read: req.body.read },
      { new: true }
    );
    if (!contact) return res.status(404).json({ message: 'Contact not found' });
    res.json(contact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ADMIN — delete a submission
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ message: 'Contact not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
