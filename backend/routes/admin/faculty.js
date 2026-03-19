const router = require('express').Router();
const Faculty = require('../../models/Faculty');
const Student = require('../../models/Student');
const Admin = require('../../models/Admin');
const FacultyPost = require('../../models/FacultyPost');
const { auth, adminOrFaculty } = require('../../middleware/auth');
const { getAllowedCourseIds, resolveToCanonicalCourseIds } = require('../../utils/facultyCourseAccess');

router.use(auth, adminOrFaculty);

// Helper: check email across all collections
async function isEmailTaken(email, excludeId) {
  const query = { email: email.toLowerCase() };
  const [s, f, a] = await Promise.all([
    Student.findOne(query), Faculty.findOne(query), Admin.findOne(query)
  ]);
  if (excludeId) {
    if (f && f._id.toString() === excludeId) return false;
  }
  return !!(s || f || a);
}

// Get all faculty
router.get('/', async (req, res) => {
  try {
    const allowedCourseIds = await getAllowedCourseIds(req);
    const filter = allowedCourseIds === null ? {} : { courseIds: { $in: allowedCourseIds } };
    const faculty = await Faculty.find(filter).select('-password');
    // Attach posts for each faculty
    const result = await Promise.all(faculty.map(async (f) => {
      const posts = await FacultyPost.find({ facultyId: f._id });
      return { ...f.toObject(), sharedPosts: posts };
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single faculty
router.get('/:id', async (req, res) => {
  try {
    const allowedCourseIds = await getAllowedCourseIds(req);
    const faculty = await Faculty.findById(req.params.id).select('-password');
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
    if (allowedCourseIds !== null) {
      const hasAnyAllowedCourse = (faculty.courseIds || []).some((cid) => allowedCourseIds.includes(String(cid)));
      if (!hasAnyAllowedCourse) {
        return res.status(403).json({ message: 'Access denied: not your course' });
      }
    }

    const posts = await FacultyPost.find({ facultyId: faculty._id });
    res.json({ ...faculty.toObject(), sharedPosts: posts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create faculty
router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, email, password, department, designation, phone, address, subjects, experience, office, courseIds } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (await isEmailTaken(email)) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const canonicalCourseIds = await resolveToCanonicalCourseIds(courseIds || []);

    const faculty = new Faculty({
      name, email, password,
      department: department || '', designation: designation || '',
      phone: phone || '', address: address || '',
      subjects: subjects || [], experience: experience || '',
      office: office || '', courseIds: canonicalCourseIds,
      status: 'active'
    });
    await faculty.save();
    const result = faculty.toObject();
    delete result.password;
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update faculty
router.put('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates = { ...req.body };

    if (updates.courseIds) {
      updates.courseIds = await resolveToCanonicalCourseIds(updates.courseIds);
    }
    
    // Check email uniqueness if email is being changed
    if (updates.email) {
      if (await isEmailTaken(updates.email, req.params.id)) {
        return res.status(400).json({ message: 'Email already in use by another account' });
      }
    }

    if (updates.password) {
      const bcrypt = require('bcryptjs');
      updates.password = await bcrypt.hash(updates.password, 10);
    } else {
      delete updates.password;
    }
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete faculty
router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await FacultyPost.deleteMany({ facultyId: req.params.id });
    const faculty = await Faculty.findByIdAndDelete(req.params.id);
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
    res.json({ message: 'Faculty deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
