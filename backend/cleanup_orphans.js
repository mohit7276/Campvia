const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Course = require('./models/Course');
  const Assignment = require('./models/Assignment');
  const Exam = require('./models/Exam');
  const Test = require('./models/Test');

  const courses = await Course.find({}, 'courseId').lean();
  const validIds = courses.map(c => c.courseId);
  console.log('Valid courseIds:', validIds);

  const delA = await Assignment.deleteMany({ courseId: { $nin: validIds } });
  const delE = await Exam.deleteMany({ courseId: { $nin: validIds } });
  const delT = await Test.deleteMany({ courseId: { $nin: validIds } });

  console.log('Deleted assignments:', delA.deletedCount);
  console.log('Deleted exams:', delE.deletedCount);
  console.log('Deleted tests:', delT.deletedCount);

  const remaining = await Assignment.countDocuments();
  const remainingE = await Exam.countDocuments();
  console.log('Remaining assignments:', remaining);
  console.log('Remaining exams:', remainingE);

  mongoose.disconnect();
});
