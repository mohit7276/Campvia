const Fee = require('../models/Fee');
const Course = require('../models/Course');

function parseCourseYears(duration) {
  if (typeof duration === 'number' && duration > 0) return duration;
  if (typeof duration === 'string') {
    const match = duration.match(/(\d+)/);
    if (match) {
      const years = parseInt(match[1], 10);
      if (years > 0) return years;
    }
  }
  return 4;
}

function buildSemesterPlan(totalFees, years) {
  const totalSemesters = years * 2;
  const totalCents = Math.max(0, Math.round(Number(totalFees || 0) * 100));
  const baseCents = Math.floor(totalCents / totalSemesters);
  const remainder = totalCents - (baseCents * totalSemesters);
  const currentYear = new Date().getFullYear();
  const now = new Date();

  const rows = [];
  for (let index = 0; index < totalSemesters; index++) {
    const yearIndex = Math.floor(index / 2) + 1;
    const semesterIndex = (index % 2) + 1;
    const semesterLabel = `Year ${yearIndex} - Semester ${semesterIndex}`;
    const dueYear = currentYear + (yearIndex - 1);
    const dueMonth = semesterIndex === 1 ? '01' : '07';
    const dueDate = `${dueYear}-${dueMonth}-15`;
    const amountCents = baseCents + (index < remainder ? 1 : 0);
    rows.push({
      title: `Tuition Fee - ${semesterLabel}`,
      semester: semesterLabel,
      amount: amountCents / 100,
      dueDate,
      status: new Date(dueDate) < now ? 'overdue' : 'pending',
      category: 'tuition'
    });
  }

  return rows;
}

async function ensureSemesterFeesForStudent({ studentId, courseId, forceRegenerate = false }) {
  if (!studentId || !courseId) return [];

  const course = await Course.findOne({ courseId });
  if (!course || !course.totalFees || course.totalFees <= 0) {
    return Fee.find({ studentId, courseId }).sort({ dueDate: 1 });
  }

  const years = parseCourseYears(course.duration);
  let existing = await Fee.find({ studentId, courseId });

  const canonicalSemesterPattern = /^Year\s+\d+\s+-\s+Semester\s+[12]$/i;
  const hasCanonical = existing.some(f => canonicalSemesterPattern.test(f.semester || ''));
  const hasPaid = existing.some(f => f.status === 'paid');

  if (forceRegenerate || (existing.length > 0 && !hasCanonical && !hasPaid)) {
    await Fee.deleteMany({ studentId, courseId, status: { $ne: 'paid' } });
    existing = await Fee.find({ studentId, courseId });
  }

  // If only legacy paid records exist, keep them untouched to avoid accidental data loss.
  if (!hasCanonical && hasPaid && !forceRegenerate) {
    return Fee.find({ studentId, courseId }).sort({ dueDate: 1 });
  }

  const existingSemesters = new Set(
    existing
      .map(f => f.semester)
      .filter(s => canonicalSemesterPattern.test(s || ''))
  );

  // Deduplicate: if a semester already has a paid record AND a non-paid record, remove the non-paid duplicate
  const semesterStatus = new Map();
  for (const f of existing) {
    const sem = (f.semester || '').trim();
    if (!canonicalSemesterPattern.test(sem)) continue;
    if (!semesterStatus.has(sem)) {
      semesterStatus.set(sem, f);
    } else {
      const existing_f = semesterStatus.get(sem);
      // Keep paid over pending; delete the duplicate
      const keepId = (f.status === 'paid' && existing_f.status !== 'paid') ? existing_f._id : f._id;
      await Fee.deleteOne({ _id: keepId });
      if (f.status === 'paid' && existing_f.status !== 'paid') semesterStatus.set(sem, f);
    }
  }
  // Refresh existing after dedup
  existing = await Fee.find({ studentId, courseId });
  const dedupedSemesters = new Set(
    existing
      .map(f => f.semester)
      .filter(s => canonicalSemesterPattern.test(s || ''))
  );

  const semesterRows = buildSemesterPlan(course.totalFees, years);
  const rowsToInsert = semesterRows
    .filter(row => !dedupedSemesters.has(row.semester))
    .map(row => ({
      studentId,
      courseId,
      title: row.title,
      amount: row.amount,
      dueDate: row.dueDate,
      status: row.status,
      category: row.category,
      semester: row.semester
    }));

  if (rowsToInsert.length > 0) {
    await Fee.insertMany(rowsToInsert);
  }

  return Fee.find({ studentId, courseId }).sort({ dueDate: 1 });
}

module.exports = {
  ensureSemesterFeesForStudent,
  parseCourseYears
};
