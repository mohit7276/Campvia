const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Notice = require('../models/Notice');
const { auth, adminOnly } = require('../middleware/auth');

// ── File Upload Setup ────────────────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'uploads', 'notices');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '_' + Math.round(Math.random() * 1e6);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    cb(null, allowed.test(ext));
  }
});

function getFileType(filename) {
  const ext = path.extname(filename).toLowerCase().replace('.', '');
  if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['doc','docx','xls','xlsx','ppt','pptx','txt'].includes(ext)) return 'doc';
  return 'other';
}

// Upload a file attachment for a notice (admin only)
router.post('/upload', auth, adminOnly, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const url = `/api/uploads/notices/${req.file.filename}`;
  const type = getFileType(req.file.originalname);
  res.json({ name: req.file.originalname, url, type });
});

// Normalize legacy /uploads/ URLs to /api/uploads/ so frontend proxy works
function normalizeNotice(n) {
  const obj = n.toObject ? n.toObject() : { ...n };
  const fix = url => (url && url.startsWith('/uploads/')) ? url.replace('/uploads/', '/api/uploads/') : url;
  if (obj.attachment) obj.attachment = fix(obj.attachment);
  if (Array.isArray(obj.attachments)) {
    obj.attachments = obj.attachments.map(a => ({ ...a, url: fix(a.url) }));
  }
  return obj;
}

// Get all notices (filtered by course for students)
router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    // If the user is a student with a courseId, only show general + their course notices
    if (req.user.role === 'student') {
      const courseId = req.user.courseId || '';
      if (!courseId) {
        // No course — only general (no courseId) notices
        filter = { $or: [{ courseId: '' }, { courseId: { $exists: false } }] };
      } else {
        filter = { $or: [{ courseId: '' }, { courseId: { $exists: false } }, { courseId }] };
      }
    }
    const notices = await Notice.find(filter).sort({ date: -1 });
    res.json(notices.map(normalizeNotice));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create notice (admin only)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const notice = new Notice(req.body);
    await notice.save();
    res.status(201).json(notice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update notice (admin only)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const notice = await Notice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!notice) return res.status(404).json({ message: 'Notice not found' });
    res.json(notice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete notice (admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) return res.status(404).json({ message: 'Notice not found' });
    res.json({ message: 'Notice deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
