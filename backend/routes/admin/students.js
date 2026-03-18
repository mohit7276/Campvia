const router = require('express').Router();
const Student = require('../../models/Student');
const Faculty = require('../../models/Faculty');
const Admin = require('../../models/Admin');
const Fee = require('../../models/Fee');
const { ensureSemesterFeesForStudent } = require('../../utils/semesterFees');
const { auth, adminOnly } = require('../../middleware/auth');

router.use(auth, adminOnly);

// Helper: check email across all collections
async function isEmailTaken(email, excludeId) {
  const query = { email: email.toLowerCase() };
  const [s, f, a] = await Promise.all([
    Student.findOne(query), Faculty.findOne(query), Admin.findOne(query)
  ]);
  // If editing, allow the same user's email
  if (excludeId) {
    if (s && s._id.toString() === excludeId) return false;
  }
  return !!(s || f || a);
}

// Helper: check rollNo uniqueness among students
async function isRollNoTaken(rollNo, excludeId) {
  if (!rollNo || !rollNo.trim()) return false;
  const trimmed = rollNo.trim();
  // Find any student with this rollNo
  const students = await Student.find({ rollNo: trimmed }).select('_id').lean();
  if (!students || students.length === 0) return false;
  // If excludeId provided, ignore that student's own record
  if (excludeId) {
    const others = students.filter(s => s._id.toString() !== excludeId.toString());
    return others.length > 0;
  }
  return true;
}

// Helper: generate next roll number (simple sequential: 1, 2, 3, ...)
async function getNextRollNo() {
  // Find all numeric roll numbers, pick the highest + 1
  const students = await Student.find({ rollNo: { $regex: /^\d+$/ } }).select('rollNo').lean();
  if (!students.length) return '1';
  const max = Math.max(...students.map(s => parseInt(s.rollNo, 10) || 0));
  return String(max + 1);
}

// Helper: parse year string to number
function parseYear(y) {
  if (typeof y === 'number') return y;
  if (typeof y === 'string') {
    const match = y.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  }
  return 1;
}

// Helper: auto-generate fee records when a student is assigned a course
async function generateFeesForStudent(studentId, courseId) {
  await ensureSemesterFeesForStudent({ studentId, courseId });
}

// Get next suggested roll number
router.get('/next-roll-no', async (req, res) => {
  try {
    const rollNo = await getNextRollNo();
    res.json({ rollNo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check if a roll number is already taken
router.get('/check-roll-no', async (req, res) => {
  try {
    const { rollNo, excludeId } = req.query;
    if (!rollNo || !rollNo.trim()) {
      return res.status(400).json({ message: 'rollNo is required' });
    }
    const taken = await isRollNoTaken(rollNo.trim(), excludeId || null);
    res.json({ available: !taken, rollNo: rollNo.trim() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all students
router.get('/', async (req, res) => {
  try {
    const query = {};
    if (req.query.courseId) query.courseId = req.query.courseId;
    const students = await Student.find(query).select('-password').lean();
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single student
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('-password').lean();
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create student
router.post('/', async (req, res) => {
  try {
    const { name, email, password, course, courseId, year, phone, address, feesPaid, rollNo } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (await isEmailTaken(email)) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Roll number: use provided or auto-generate
    let finalRollNo = rollNo ? rollNo.trim() : await getNextRollNo();
    if (rollNo && rollNo.trim()) {
      if (await isRollNoTaken(rollNo.trim())) {
        return res.status(400).json({ message: `Roll number "${rollNo.trim()}" is already assigned to another student` });
      }
    }

    const student = new Student({
      name, email, password,
      course: course || '', courseId: courseId || '',
      year: parseYear(year),
      phone: phone || '', address: address || '',
      feesPaid: typeof feesPaid === 'boolean' ? (feesPaid ? 1 : 0) : (feesPaid || 0),
      rollNo: finalRollNo,
      status: 'active'
    });
    await student.save();

    // Auto-generate fee records if course assigned
    if (courseId) {
      await generateFeesForStudent(student._id, courseId);
    }

    const result = student.toObject();
    delete result.password;
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update student
router.put('/:id', async (req, res) => {
  try {
    const updates = { ...req.body };
    
    // Check email uniqueness if email is being changed
    if (updates.email) {
      if (await isEmailTaken(updates.email, req.params.id)) {
        return res.status(400).json({ message: 'Email already in use by another account' });
      }
    }

    // Check roll number uniqueness if being changed
    if (updates.rollNo && updates.rollNo.trim()) {
      if (await isRollNoTaken(updates.rollNo.trim(), req.params.id)) {
        return res.status(400).json({ message: `Roll number "${updates.rollNo.trim()}" is already assigned to another student` });
      }
      updates.rollNo = updates.rollNo.trim();
    }

    // Hash password if provided
    if (updates.password) {
      const bcrypt = require('bcryptjs');
      updates.password = await bcrypt.hash(updates.password, 10);
    } else {
      delete updates.password; // Don't clear existing password
    }

    // Convert year if provided as string
    if (updates.year) updates.year = parseYear(updates.year);
    
    // Convert feesPaid boolean to number
    if (typeof updates.feesPaid === 'boolean') {
      updates.feesPaid = updates.feesPaid ? 1 : 0;
    }

    // Check if courseId is being changed — need old student data first
    const oldStudent = await Student.findById(req.params.id);
    const courseChanged = oldStudent && updates.courseId && updates.courseId !== oldStudent.courseId;

    // Detect feesPaid change
    const oldFeesPaid = oldStudent ? !!oldStudent.feesPaid : null;
    const newFeesPaidRaw = updates.feesPaid;
    const feesPaidChanging = newFeesPaidRaw !== undefined && oldStudent;

    const student = await Student.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Auto-generate fee records if course changed
    if (courseChanged) {
      await generateFeesForStudent(student._id, updates.courseId);
    }

    // Sync Fee records when admin changes feesPaid status
    if (feesPaidChanging) {
      const newFeesPaid = !!newFeesPaidRaw;
      const today = new Date().toISOString().split('T')[0];
      if (newFeesPaid) {
        // Admin marked as fully paid — mark all fee records as paid
        await Fee.updateMany(
          { studentId: student._id, status: { $in: ['pending', 'overdue'] } },
          {
            $set: {
              status: 'paid',
              paidDate: today,
              transactionId: 'ADMIN_' + Date.now().toString(36).toUpperCase(),
              method: 'Admin Override'
            }
          }
        );
        // Set feesPaid to total amount of all fee records
        const allFees = await Fee.find({ studentId: student._id });
        const totalAmount = allFees.reduce((sum, f) => sum + (f.amount || 0), 0);
        await Student.findByIdAndUpdate(student._id, { feesPaid: totalAmount });
      } else {
        // Admin marked as pending — reset all paid fee records back to pending/overdue
        const paidFees = await Fee.find({ studentId: student._id, status: 'paid' });
        for (const fee of paidFees) {
          const isPastDue = fee.dueDate && new Date(fee.dueDate) < new Date();
          fee.status = isPastDue ? 'overdue' : 'pending';
          fee.paidDate = '';
          fee.transactionId = '';
          fee.method = '';
          await fee.save();
        }
      }
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete student (cascade-deletes all associated fee records)
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    // Remove all fee records that belong to this student
    await Fee.deleteMany({ studentId: req.params.id });
    res.json({ message: 'Student deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
