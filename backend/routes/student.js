const router = require('express').Router();
const mongoose = require('mongoose');
const { auth } = require('../middleware/auth');
const Assignment = require('../models/Assignment');
const Attendance = require('../models/Attendance');
const Fee = require('../models/Fee');
const Schedule = require('../models/Schedule');
const Test = require('../models/Test');
const Exam = require('../models/Exam');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const FacultyPost = require('../models/FacultyPost');
const Notice = require('../models/Notice');
const Lecture = require('../models/Lecture');
const { ensureSemesterFeesForStudent } = require('../utils/semesterFees');

router.use(auth);

// Helper: get the logged-in student's courseId (empty string if none)
function getStudentCourseId(req) {
  return (req.user && req.user.courseId) ? req.user.courseId : '';
}

function toNumberOrNaN(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function resolveLectureForScan({ requestedLectureId, requestedQrToken, studentCourseId }) {
  let lecture = null;

  if (requestedLectureId && mongoose.isValidObjectId(requestedLectureId)) {
    lecture = await Lecture.findById(requestedLectureId);
  }

  if (!lecture && requestedQrToken) {
    lecture = await Lecture.findOne({
      'qrSession.active': true,
      'qrSession.token': requestedQrToken
    });
  }

  if (!lecture && !requestedLectureId && !requestedQrToken && studentCourseId) {
    lecture = await Lecture.findOne({
      courseId: studentCourseId,
      'qrSession.active': true,
    }).sort({ 'qrSession.startedAt': -1, updatedAt: -1 });
  }

  return lecture;
}

// ===== ASSIGNMENTS =====
router.get('/assignments', async (req, res) => {
  try {
    const courseId = getStudentCourseId(req);
    if (!courseId) return res.json([]);

    const assignments = await Assignment.find({ courseId }).sort({ dueDate: -1 });
    // Annotate each assignment with the current student's submission status
    const studentId = req.user._id.toString();
    const result = assignments.map(a => {
      const obj = a.toObject();
      const mySub = (obj.submissions || []).find(
        s => s.studentId && s.studentId.toString() === studentId
      );
      obj.myStatus = mySub?.status === 'submitted' ? 'submitted' : 'pending';
      return obj;
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit assignment
router.post('/assignments/:id/submit', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    // Block submission/edit after due date
    const now = new Date();
    const due = new Date(assignment.dueDate);
    // Set due date to end of the day so students can submit on the due date itself
    due.setHours(23, 59, 59, 999);
    if (now > due) {
      return res.status(403).json({ message: 'Due date has passed. Submissions are closed.' });
    }

    assignment.status = 'submitted';
    assignment.submittedFile = req.body.fileName || 'submission.pdf';

    const links = Array.isArray(req.body.links) ? req.body.links : [];

    // Add to submissions array
    const existingSub = assignment.submissions.find(
      s => s.studentId && s.studentId.toString() === req.user._id.toString()
    );
    if (!existingSub) {
      assignment.submissions.push({
        studentId: req.user._id,
        studentName: req.user.name,
        fileName: req.body.fileName || '',
        links,
        status: 'submitted'
      });
    } else {
      existingSub.status = 'submitted';
      existingSub.fileName = req.body.fileName || existingSub.fileName || '';
      existingSub.links = links;
      existingSub.submittedAt = new Date();
    }

    await assignment.save();
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete submission
router.delete('/assignments/:id/submission', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    assignment.status = 'pending';
    assignment.submittedFile = '';
    assignment.submissions = assignment.submissions.filter(
      s => !s.studentId || s.studentId.toString() !== req.user._id.toString()
    );
    await assignment.save();
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== ATTENDANCE =====
// Helper: auto-sync attendance records with all lectures in the student's course
async function syncAttendanceWithLectures(studentId, courseId) {
  if (!courseId) return;
  const lectures = await Lecture.find({ courseId });
  for (const lecture of lectures) {
    const existing = await Attendance.findOne({
      studentId,
      $or: [
        { lectureId: lecture._id },
        { date: lecture.date, subject: lecture.subject }
      ]
    });
    if (!existing) {
      await Attendance.create({
        studentId,
        courseId,
        date: lecture.date,
        subject: lecture.subject,
        status: 'absent',
        timestamp: '',
        lectureId: lecture._id
      });
    } else if (!existing.lectureId) {
      // Link existing record to lecture if not linked
      existing.lectureId = lecture._id;
      await existing.save();
    }
  }
}

router.get('/attendance', async (req, res) => {
  try {
    const courseId = getStudentCourseId(req);
    await syncAttendanceWithLectures(req.user._id, courseId);
    const records = await Attendance.find({ studentId: req.user._id }).sort({ date: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/attendance/stats', async (req, res) => {
  try {
    const courseId = getStudentCourseId(req);
    await syncAttendanceWithLectures(req.user._id, courseId);
    const records = await Attendance.find({ studentId: req.user._id });
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = total - present;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    // Calculate streak
    const sorted = records.filter(r => r.status === 'present').sort((a, b) => new Date(b.date) - new Date(a.date));
    let streak = 0;
    for (const r of sorted) {
      if (r.status === 'present') streak++;
      else break;
    }

    // Subject-wise
    const subjectMap = {};
    for (const r of records) {
      if (!subjectMap[r.subject]) subjectMap[r.subject] = { present: 0, total: 0 };
      subjectMap[r.subject].total++;
      if (r.status === 'present') subjectMap[r.subject].present++;
    }
    const subjects = Object.entries(subjectMap).map(([subject, data]) => ({
      subject,
      present: data.present,
      total: data.total,
      percentage: Math.round((data.present / data.total) * 100),
      minRequirement: 75
    }));

    res.json({ rate, present, absent, total, streak, subjects });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/attendance/scan-preview', async (req, res) => {
  try {
    const { lectureId, qrToken } = req.body;
    const requestedLectureId = typeof lectureId === 'string' ? lectureId.trim() : '';
    const requestedQrToken = typeof qrToken === 'string' ? qrToken.trim() : '';
    const studentCourseId = getStudentCourseId(req);

    const lecture = await resolveLectureForScan({
      requestedLectureId,
      requestedQrToken,
      studentCourseId,
    });

    if (!lecture) return res.status(404).json({ message: 'Lecture not found or session has ended.' });

    if (studentCourseId && lecture.courseId && lecture.courseId !== studentCourseId) {
      return res.status(403).json({ message: 'Access denied: lecture does not belong to your course' });
    }

    if (!lecture.qrSession || !lecture.qrSession.active) {
      return res.status(400).json({ message: 'No active attendance session found' });
    }

    res.json({
      lectureId: lecture._id,
      subject: lecture.subject,
      date: lecture.date,
      time: lecture.time,
      instructor: lecture.instructor || '',
      courseId: lecture.courseId || '',
      qrToken: requestedQrToken || lecture.qrSession.token || '',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark attendance (QR scan)
router.post('/attendance/mark', async (req, res) => {
  try {
    const { lectureId, location, qrToken } = req.body;
    const requestedLectureId = typeof lectureId === 'string' ? lectureId.trim() : '';
    const requestedQrToken = typeof qrToken === 'string' ? qrToken.trim() : '';
    const studentCourseId = getStudentCourseId(req);

    const lecture = await resolveLectureForScan({
      requestedLectureId,
      requestedQrToken,
      studentCourseId,
    });

    if (!lecture) return res.status(404).json({ message: 'Lecture not found or session has ended.' });

    // Ensure student can only mark attendance for their own course sessions.
    if (studentCourseId && lecture.courseId && lecture.courseId !== studentCourseId) {
      return res.status(403).json({ message: 'Access denied: lecture does not belong to your course' });
    }

    if (!lecture.qrSession || !lecture.qrSession.active) {
      return res.status(400).json({ message: 'No active attendance session found' });
    }

    const publishedLat = toNumberOrNaN(lecture?.qrSession?.location?.lat);
    const publishedLng = toNumberOrNaN(lecture?.qrSession?.location?.lng);
    const publishedAccuracy = toNumberOrNaN(lecture?.qrSession?.location?.accuracy);
    const userLat = toNumberOrNaN(location?.lat);
    const userLng = toNumberOrNaN(location?.lng);
    const userAccuracy = toNumberOrNaN(location?.accuracy);

    if (Number.isNaN(publishedLat) || Number.isNaN(publishedLng)) {
      return res.status(400).json({ message: 'Attendance location is not published for this lecture.' });
    }

    if (publishedLat === 0 && publishedLng === 0) {
      return res.status(400).json({ message: 'Attendance location is invalid. Ask faculty to republish attendance from live GPS.' });
    }

    if (Number.isNaN(userLat) || Number.isNaN(userLng)) {
      return res.status(400).json({ message: 'Your live location is required to mark attendance.' });
    }

    const distanceMeters = calculateDistanceMeters(userLat, userLng, publishedLat, publishedLng);
    const userAccuracyMeters = Number.isNaN(userAccuracy) ? 0 : Math.max(0, Math.round(userAccuracy));
    const publishedAccuracyMeters = Number.isNaN(publishedAccuracy) ? 0 : Math.max(0, Math.round(publishedAccuracy));

    // Treat published and user GPS accuracy as uncertainty circles and add a small safety buffer.
    // This avoids false negatives on phones when GPS drifts indoors or near buildings.
    const adaptiveRadiusMeters = Math.max(
      90,
      Math.min(500, Math.round(userAccuracyMeters + publishedAccuracyMeters + 40))
    );

    if (distanceMeters > adaptiveRadiusMeters) {
      return res.status(403).json({
        message: `You are not within ${adaptiveRadiusMeters} meters of the published attendance location. Current distance is ${Math.round(distanceMeters)} meters.`
      });
    }

    const markTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Existing lecture record may be auto-created as 'absent'. Upgrade it to
    // 'present' instead of rejecting the scan.
    let attendance = await Attendance.findOne({ studentId: req.user._id, lectureId: lecture._id });
    if (attendance) {
      if (attendance.status === 'present') {
        return res.status(400).json({ message: 'Attendance already marked' });
      }
      attendance.status = 'present';
      attendance.timestamp = markTime;
      attendance.date = lecture.date;
      attendance.subject = lecture.subject;
      if (!attendance.courseId) attendance.courseId = lecture.courseId || '';
      await attendance.save();
    } else {
      attendance = new Attendance({
        studentId: req.user._id,
        courseId: lecture.courseId || '',
        date: lecture.date,
        subject: lecture.subject,
        status: 'present',
        timestamp: markTime,
        lectureId: lecture._id
      });
      await attendance.save();
    }

    // Update lecture attendance array
    const studentEntry = lecture.attendance.find(a => a.studentId === req.user._id.toString());
    if (studentEntry) {
      studentEntry.present = true;
    } else {
      lecture.attendance.push({
        studentId: req.user._id.toString(),
        studentName: req.user.name,
        present: true
      });
    }
    await lecture.save();

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== FEES =====
router.get('/fees', async (req, res) => {
  try {
    let fees;

    if (req.user.courseId) {
      fees = await ensureSemesterFeesForStudent({
        studentId: req.user._id,
        courseId: req.user.courseId
      });
    } else {
      fees = await Fee.find({ studentId: req.user._id }).sort({ dueDate: 1 });
    }

    res.json(fees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/fees/stats', async (req, res) => {
  try {
    const fees = await Fee.find({ studentId: req.user._id });
    const totalPaid = fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);
    const totalPending = fees.filter(f => f.status !== 'paid').reduce((sum, f) => sum + f.amount, 0);
    res.json({ totalPaid, totalPending });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Pay ALL pending/overdue fees at once
router.post('/fees/pay-all', async (req, res) => {
  try {
    const transactionBase = req.body.razorpayPaymentId || ('TXN' + Date.now().toString(36).toUpperCase());
    const paidDate = new Date().toISOString().split('T')[0];
    const fees = await Fee.find({ studentId: req.user._id, status: { $in: ['pending', 'overdue'] } });
    if (fees.length === 0) return res.json({ message: 'No pending fees', updated: 0 });
    let counter = 0;
    for (const fee of fees) {
      fee.status = 'paid';
      fee.paidDate = paidDate;
      fee.transactionId = fees.length > 1 ? transactionBase + '_' + (++counter) : transactionBase;
      fee.method = req.body.method || 'Razorpay';
      await fee.save();
    }
    // Sync Student.feesPaid — store total amount paid
    const allPaidFees = await Fee.find({ studentId: req.user._id, status: 'paid' });
    const totalPaidAmount = allPaidFees.reduce((sum, f) => sum + (f.amount || 0), 0);
    await Student.findByIdAndUpdate(req.user._id, { feesPaid: totalPaidAmount });
    res.json({ message: 'All fees paid successfully', updated: fees.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Pay fee
router.post('/fees/:id/pay', async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ message: 'Fee not found' });
    fee.status = 'paid';
    fee.paidDate = new Date().toISOString().split('T')[0];
    fee.transactionId = req.body.razorpayPaymentId || ('TXN' + Date.now().toString(36).toUpperCase());
    fee.method = req.body.method || 'Razorpay';
    await fee.save();
    // Sync Student.feesPaid — recalculate total amount paid across all fee records
    const allPaidFees = await Fee.find({ studentId: req.user._id, status: 'paid' });
    const totalPaidAmount = allPaidFees.reduce((sum, f) => sum + (f.amount || 0), 0);
    await Student.findByIdAndUpdate(req.user._id, { feesPaid: totalPaidAmount });
    res.json(fee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== TIMETABLE =====
router.get('/timetable', async (req, res) => {
  try {
    const courseId = getStudentCourseId(req);
    if (!courseId) return res.json([]);

    const day = req.query.day ? parseInt(req.query.day) : new Date().getDay();
    const dateStr = req.query.date || null; // Optional specific date e.g. 2025-02-25

    // Always include recurring weekly schedule for this day-of-week
    const schedules = await Schedule.find({ dayOfWeek: day, courseId }).sort({ time: 1 });
    const scheduleItems = schedules.map(s => ({
      ...s.toObject(),
      source: 'schedule'
    }));

    // Also include specific Lecture entries for this exact date (if date provided)
    let lectureItems = [];
    if (dateStr) {
      const lectures = await Lecture.find({ courseId, date: dateStr }).sort({ time: 1 });
      lectureItems = lectures.map(l => ({
        _id: l._id,
        courseId: l.courseId,
        subject: l.subject,
        time: l.time || '',
        endTime: '',
        room: '',
        duration: '',
        type: 'lecture',
        faculty: l.instructor || '',
        lectureId: l._id,
        source: 'lecture'
      }));
    }

    // Merge: if lecture entries exist for today's date, they are the ground truth.
    // Lecture entries override schedule entries for the same subject.
    // Schedule entries with no matching lecture entry are kept (upcoming/unrecorded).
    let combined;
    if (lectureItems.length > 0) {
      const lectureSubjects = new Set(lectureItems.map(l => l.subject));
      const scheduleOnly = scheduleItems.filter(s => !lectureSubjects.has(s.subject));
      combined = [...lectureItems, ...scheduleOnly];
    } else {
      combined = scheduleItems;
    }
    // Sort by time
    const timeToMin = (t) => {
      if (!t) return 0;
      const [timePart, modifier] = t.split(' ');
      let [h, m] = timePart.split(':').map(Number);
      if (modifier === 'PM' && h < 12) h += 12;
      if (modifier === 'AM' && h === 12) h = 0;
      return h * 60 + (m || 0);
    };
    combined.sort((a, b) => timeToMin(a.time) - timeToMin(b.time));
    res.json(combined);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== SCORES =====
router.get('/scores', async (req, res) => {
  try {
    const courseId = getStudentCourseId(req);
    if (!courseId) return res.json([]);

    const filter = { resultsPublished: true, courseId };
    const exams = await Exam.find(filter).sort({ date: -1 });
    const userId = req.user._id.toString();

    // Return only published exams where THIS student has been graded
    const result = exams
      .map(e => {
        const myResult = e.studentResults.find(r => r.studentId && r.studentId.toString() === userId);
        if (!myResult) return null; // exclude exams where student has no score
        const obj = e.toObject();
        obj.myScore = myResult.score;
        obj.hasMyResult = true;
        return obj;
      })
      .filter(Boolean);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/scores/:testId', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.testId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== TESTS =====
router.get('/tests/upcoming', async (req, res) => {
  try {
    const courseId = getStudentCourseId(req);
    if (!courseId) return res.json([]);

    // Return upcoming from Exam model (new unified system) plus legacy Test model
    const [exams, tests] = await Promise.all([
      Exam.find({ status: 'upcoming', courseId }).sort({ date: 1 }),
      Test.find({ status: 'upcoming', courseId }).sort({ date: 1 })
    ]);
    // Merge: exams take priority; include legacy tests not already covered
    res.json([...exams, ...tests]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/tests/past', async (req, res) => {
  try {
    const courseId = getStudentCourseId(req);
    if (!courseId) return res.json([]);

    const exams = await Exam.find({ status: 'completed', courseId }).sort({ date: -1 });
    const userId = req.user._id.toString();

    const pastTests = exams.filter(e =>
      e.studentResults.some(r => r.studentId && r.studentId.toString() === userId)
    ).map(e => {
      const myResult = e.studentResults.find(r => r.studentId && r.studentId.toString() === userId);
      return {
        _id: e._id,
        id: e._id,
        subject: e.subject,
        description: e.title,
        date: e.date,
        type: e.type,
        room: '',
        duration: e.duration,
        importance: 'medium',
        score: myResult ? myResult.score : null,
        classRank: 1,
        collegeRank: 1
      };
    });
    res.json(pastTests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper: compute avg score for each student in a course from published exam results
async function computeCourseAvgScores(courseId) {
  const students = await Student.find({ courseId }).select('_id');
  const studentIds = students.map(s => s._id.toString());

  // Count all published-results exams (same filter the /scores endpoint uses)
  const exams = await Exam.find({ courseId, resultsPublished: true });

  // Build a map: studentId -> list of scores
  const scoreMap = {};
  for (const id of studentIds) scoreMap[id] = [];
  for (const exam of exams) {
    for (const result of (exam.studentResults || [])) {
      const sid = result.studentId ? result.studentId.toString() : null;
      if (sid && scoreMap[sid] !== undefined && result.score != null) {
        scoreMap[sid].push(result.score);
      }
    }
  }

  // Compute avg for each student
  const avgMap = {};
  for (const id of studentIds) {
    const scores = scoreMap[id];
    avgMap[id] = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
  }
  return avgMap; // { studentId: avgScore }
}

// ===== MY RANK (dynamic, computed from exam results within course) =====
router.get('/my-rank', async (req, res) => {
  try {
    const courseId = getStudentCourseId(req);
    if (!courseId) return res.json({ rank: 0, totalStudents: 0, avgScore: 0 });

    const avgMap = await computeCourseAvgScores(courseId);
    const myId = req.user._id.toString();
    const totalStudents = Object.keys(avgMap).length;

    // Sort by avgScore descending; ties broken by studentId string for stability
    const sorted = Object.entries(avgMap).sort((a, b) => b[1] - a[1]);
    const idx = sorted.findIndex(([id]) => id === myId);

    res.json({
      rank: idx >= 0 ? idx + 1 : 0,
      totalStudents,
      avgScore: avgMap[myId] != null ? avgMap[myId] : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== CLASSMATES =====
router.get('/classmates', async (req, res) => {
  try {
    const courseId = getStudentCourseId(req);
    if (!courseId) return res.json([]);

    const [allStudents, avgMap] = await Promise.all([
      Student.find({ courseId }).select('-password'),
      computeCourseAvgScores(courseId)
    ]);

    // Build rank map: sort all students by computed avgScore descending
    const sorted = allStudents.slice().sort((a, b) =>
      (avgMap[b._id.toString()] || 0) - (avgMap[a._id.toString()] || 0)
    );
    const rankMap = new Map();
    sorted.forEach((s, i) => rankMap.set(s._id.toString(), i + 1));

    const myId = req.user._id.toString();
    const classmates = allStudents
      .filter(s => s._id.toString() !== myId)
      .map(s => ({
        _id: s._id,
        id: s._id,
        rollNo: s.rollNo || '',
        name: s.name,
        email: s.email,
        phone: s.phone || '',
        avatar: s.avatar || '',
        gpa: s.gpa || 0,
        avgScore: avgMap[s._id.toString()] || 0,
        classRank: rankMap.get(s._id.toString()) || 0,
        collegeRank: s.collegeRank || 0,
        bio: s.bio || '',
        specialization: s.specialization || '',
        location: s.location || ''
      }));
    res.json(classmates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== FACULTY =====
router.get('/faculty', async (req, res) => {
  try {
    const courseId = getStudentCourseId(req);
    if (!courseId) return res.json([]);

    const faculty = await Faculty.find({ courseIds: courseId }).select('-password');
    const result = await Promise.all(faculty.map(async (f) => {
      const posts = await FacultyPost.find({ facultyId: f._id });
      return {
        _id: f._id,
        id: f._id,
        name: f.name,
        designation: f.designation || '',
        department: f.department || '',
        email: f.email,
        phone: f.phone || '',
        avatar: f.avatar || '',
        office: f.office || '',
        bio: f.bio || '',
        subjects: f.subjects || [],
        experience: f.experience || '',
        sharedPosts: posts.map(p => ({ id: p._id, title: p.title, type: p.type, date: p.date }))
      };
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/faculty/:id/posts', async (req, res) => {
  try {
    const posts = await FacultyPost.find({ facultyId: req.params.id });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== DASHBOARD SUMMARY =====
router.get('/dashboard/summary', async (req, res) => {
  try {
    const courseId = getStudentCourseId(req);
    const today = new Date();
    const dayOfWeek = today.getDay() || 7; // 1=Mon ... 5=Fri
    const todayStr = today.toISOString().split('T')[0];

    if (!courseId) {
      // No course assigned — return empty data
      return res.json({ schedule: [], tests: [], attendance: [], notices: [] });
    }

    const [schedule, exams, legacyTests, attendance, notices] = await Promise.all([
      Schedule.find({ dayOfWeek: dayOfWeek <= 5 ? dayOfWeek : 1, courseId }).sort({ time: 1 }),
      Exam.find({ status: 'upcoming', courseId }).sort({ date: 1 }).limit(10),
      Test.find({ status: 'upcoming', courseId }).sort({ date: 1 }).limit(10),
      Attendance.find({ studentId: req.user._id, date: todayStr }),
      Notice.find({ $or: [{ courseId: '' }, { courseId: { $exists: false } }, { courseId }] }).sort({ date: -1 }).limit(5)
    ]);

    // Merge upcoming tests from both Exam and legacy Test models.
    const normalizedExams = exams.map(e => ({
      _id: e._id,
      subject: e.subject,
      description: e.title || '',
      date: e.date,
      type: e.type || 'Exam',
      duration: e.duration || '',
      urgent: false,
      status: 'upcoming'
    }));

    const mergedTests = [...normalizedExams, ...legacyTests];
    const toTime = (d) => {
      const ts = new Date(d).getTime();
      return Number.isNaN(ts) ? Number.MAX_SAFE_INTEGER : ts;
    };
    const tests = mergedTests.sort((a, b) => toTime(a.date) - toTime(b.date)).slice(0, 5);

    res.json({ schedule, tests, attendance, notices });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== PROFILE =====
// Get own profile
router.get('/profile', async (req, res) => {
  try {
    const student = await Student.findById(req.user._id).select('-password');
    if (!student) return res.status(404).json({ message: 'Profile not found' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update own profile
router.put('/profile', async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'address', 'avatar', 'bio', 'specialization', 'location'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    // Handle password change
    if (req.body.newPassword) {
      if (!req.body.currentPassword) {
        return res.status(400).json({ message: 'Current password is required to change password' });
      }
      const student = await Student.findById(req.user._id);
      const isMatch = await student.comparePassword(req.body.currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      const bcrypt = require('bcryptjs');
      updates.password = await bcrypt.hash(req.body.newPassword, 10);
    }

    const student = await Student.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    if (!student) return res.status(404).json({ message: 'Profile not found' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete own account
router.delete('/profile', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.user._id);
    if (!student) return res.status(404).json({ message: 'Profile not found' });
    // Clean up related data
    await Promise.all([
      Attendance.deleteMany({ studentId: req.user._id }),
      Fee.deleteMany({ studentId: req.user._id }),
    ]);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
