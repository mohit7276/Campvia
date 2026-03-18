require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
const path = require('path');

const app = express();

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Allow non-browser clients and same-origin requests with no origin header.
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  }
}));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // legacy compat

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');
    // Drop the old broken unique+partialFilter rollNo index if it exists, so the
    // non-unique sparse index defined in the schema can be created cleanly.
    try {
      const Student = require('./models/Student');
      const indexes = await Student.collection.indexes();
      const badIdx = indexes.find(idx =>
        idx.unique === true && idx.key && idx.key.rollNo !== undefined
      );
      if (badIdx) {
        await Student.collection.dropIndex(badIdx.name);
        console.log('Dropped old unique rollNo index:', badIdx.name);
      }
    } catch (e) {
      // Non-fatal — just log
      console.log('Index cleanup note:', e.message);
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin/students', require('./routes/admin/students'));
app.use('/api/admin/faculty', require('./routes/admin/faculty'));
app.use('/api/admin/courses', require('./routes/admin/courses'));
app.use('/api/admin/assignments', require('./routes/admin/assignments'));
app.use('/api/admin/lectures', require('./routes/admin/lectures'));
app.use('/api/admin/exams', require('./routes/admin/exams'));
app.use('/api/admin/timetable', require('./routes/admin/timetable'));
app.use('/api/admin/tests', require('./routes/admin/tests'));
app.use('/api/admin/fees', require('./routes/admin/fees'));
app.use('/api/admin/stats', require('./routes/admin/stats'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/student', require('./routes/student'));
app.use('/api/faculty', require('./routes/faculty'));
app.use('/api/notices', require('./routes/notices'));
app.use('/api/study-materials', require('./routes/studyMaterials'));
app.use('/api/todos', require('./routes/todos'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/landing/courses', require('./routes/landingCourses'));

// Root route for uptime checks and quick browser verification.
app.get('/', (req, res) => {
  res.json({
    message: 'Campvia backend is running',
    api: '/api',
    health: '/api/health',
  });
});

// Health check
app.get('/api', (req, res) => {
  res.json({ message: 'Campvia API is running', health: '/api/health' });
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
