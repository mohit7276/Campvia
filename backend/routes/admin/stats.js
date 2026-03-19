const router = require('express').Router();
const Student = require('../../models/Student');
const Faculty = require('../../models/Faculty');
const Course = require('../../models/Course');
const Fee = require('../../models/Fee');
const Notice = require('../../models/Notice');
const Contact = require('../../models/Contact');
const Assignment = require('../../models/Assignment');
const Exam = require('../../models/Exam');
const { auth, adminOrFaculty } = require('../../middleware/auth');
const { getAllowedCourseIds } = require('../../utils/facultyCourseAccess');

router.use(auth, adminOrFaculty);

// GET /api/admin/stats — aggregated dashboard statistics from DB
router.get('/', async (req, res) => {
  try {
    const allowedCourseIds = await getAllowedCourseIds(req);
    const isFacultyScoped = allowedCourseIds !== null;

    if (isFacultyScoped && allowedCourseIds.length === 0) {
      return res.json({
        counts: {
          totalStudents: 0,
          activeStudents: 0,
          totalFaculty: 0,
          activeFaculty: 0,
          totalCourses: 0,
          totalNotices: 0,
          unreadContacts: 0,
          totalContacts: 0,
          totalAssignments: 0,
          totalExams: 0
        },
        fees: {
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          overdueAmount: 0,
          totalRecords: 0,
          paidRecords: 0,
          pendingRecords: 0,
          overdueRecords: 0
        },
        recentStudents: [],
        recentNotices: [],
        recentContacts: []
      });
    }

    const studentFilter = isFacultyScoped ? { courseId: { $in: allowedCourseIds } } : {};
    const courseFilter = isFacultyScoped ? { courseId: { $in: allowedCourseIds } } : {};
    const facultyFilter = isFacultyScoped ? { courseIds: { $in: allowedCourseIds } } : {};
    const noticeFilter = isFacultyScoped
      ? { $or: [{ courseId: '' }, { courseId: { $exists: false } }, { courseId: { $in: allowedCourseIds } }] }
      : {};

    const scopedStudentIds = isFacultyScoped
      ? (await Student.find(studentFilter).select('_id').lean()).map((s) => s._id)
      : null;
    const feePipeline = [];
    if (isFacultyScoped) {
      feePipeline.push({ $match: { studentId: { $in: scopedStudentIds } } });
    }
    feePipeline.push({
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        paidAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] }
        },
        pendingAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] }
        },
        overdueAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, '$amount', 0] }
        },
        totalRecords: { $sum: 1 },
        paidRecords: {
          $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
        },
        pendingRecords: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        overdueRecords: {
          $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] }
        }
      }
    });

    const [
      totalStudents,
      activeStudents,
      totalFaculty,
      activeFaculty,
      totalCourses,
      totalNotices,
      unreadContacts,
      totalContacts,
      totalAssignments,
      totalExams,
      feeAgg,
      recentStudents,
      recentNotices,
      recentContacts
    ] = await Promise.all([
      Student.countDocuments(studentFilter),
      Student.countDocuments({ ...studentFilter, status: { $in: ['active', 'Active'] } }),
      Faculty.countDocuments(facultyFilter),
      Faculty.countDocuments({ ...facultyFilter, status: { $in: ['active', 'Active'] } }),
      Course.countDocuments(courseFilter),
      Notice.countDocuments(noticeFilter),
      isFacultyScoped ? Promise.resolve(0) : Contact.countDocuments({ read: false }),
      isFacultyScoped ? Promise.resolve(0) : Contact.countDocuments(),
      Assignment.countDocuments(courseFilter),
      Exam.countDocuments(courseFilter),
      Fee.aggregate(feePipeline),
      Student.find(studentFilter).select('name email course courseId status createdAt').sort({ createdAt: -1 }).limit(5).lean(),
      Notice.find(noticeFilter).select('title category date priority sender').sort({ createdAt: -1 }).limit(5).lean(),
      isFacultyScoped
        ? Promise.resolve([])
        : Contact.find().select('name email message read createdAt').sort({ createdAt: -1 }).limit(5).lean()
    ]);

    const fees = feeAgg[0] || {
      totalAmount: 0, paidAmount: 0, pendingAmount: 0, overdueAmount: 0,
      totalRecords: 0, paidRecords: 0, pendingRecords: 0, overdueRecords: 0
    };

    res.json({
      counts: {
        totalStudents,
        activeStudents,
        totalFaculty,
        activeFaculty,
        totalCourses,
        totalNotices,
        unreadContacts,
        totalContacts,
        totalAssignments,
        totalExams
      },
      fees,
      recentStudents,
      recentNotices,
      recentContacts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
