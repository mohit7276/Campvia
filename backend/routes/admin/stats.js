const router = require('express').Router();
const Student = require('../../models/Student');
const Faculty = require('../../models/Faculty');
const Course = require('../../models/Course');
const Fee = require('../../models/Fee');
const Notice = require('../../models/Notice');
const Contact = require('../../models/Contact');
const Assignment = require('../../models/Assignment');
const Exam = require('../../models/Exam');
const { auth, adminOnly } = require('../../middleware/auth');

router.use(auth, adminOnly);

// GET /api/admin/stats — aggregated dashboard statistics from DB
router.get('/', async (req, res) => {
  try {
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
      Student.countDocuments(),
      Student.countDocuments({ status: { $in: ['active', 'Active'] } }),
      Faculty.countDocuments(),
      Faculty.countDocuments({ status: { $in: ['active', 'Active'] } }),
      Course.countDocuments(),
      Notice.countDocuments(),
      Contact.countDocuments({ read: false }),
      Contact.countDocuments(),
      // Only count assignments/exams for courses that currently exist
      Course.find({}, 'courseId').lean().then(async (courses) => {
        const validIds = courses.map(c => c.courseId);
        return Assignment.countDocuments({ courseId: { $in: validIds } });
      }),
      Course.find({}, 'courseId').lean().then(async (courses) => {
        const validIds = courses.map(c => c.courseId);
        return Exam.countDocuments({ courseId: { $in: validIds } });
      }),
      Fee.aggregate([
        {
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
        }
      ]),
      Student.find().select('name email course courseId status createdAt').sort({ createdAt: -1 }).limit(5).lean(),
      Notice.find().select('title category date priority sender').sort({ createdAt: -1 }).limit(5).lean(),
      Contact.find().select('name email message read createdAt').sort({ createdAt: -1 }).limit(5).lean()
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
