const Faculty = require('../models/Faculty');
const Course = require('../models/Course');

function normaliseCourseIds(courseIds) {
  if (!Array.isArray(courseIds)) return [];
  return courseIds.map((id) => String(id || '').trim()).filter(Boolean);
}

async function resolveToCanonicalCourseIds(rawCourseIds) {
  const ids = normaliseCourseIds(rawCourseIds);
  if (!ids.length) return [];

  const allCourses = await Course.find({}, 'courseId name').lean();
  const byCourseId = new Map();
  const byName = new Map();

  for (const c of allCourses) {
    const cid = String(c.courseId || '').trim();
    const cname = String(c.name || '').trim();
    if (cid) byCourseId.set(cid.toLowerCase(), cid);
    if (cname) byName.set(cname.toLowerCase(), cid || cname);
  }

  const canonical = [];
  for (const raw of ids) {
    const key = raw.toLowerCase();
    const resolved = byCourseId.get(key) || byName.get(key) || raw;
    canonical.push(resolved);
  }

  return Array.from(new Set(canonical));
}

async function getFacultyCourseIds(user) {
  if (!user || user.role !== 'faculty') return [];

  const fromUser = normaliseCourseIds(user.courseIds);
  if (fromUser.length) return resolveToCanonicalCourseIds(fromUser);

  // Legacy fallback for older tokens that only carry one courseId.
  const legacyCourseId = String(user.courseId || '').trim();
  if (legacyCourseId) return resolveToCanonicalCourseIds([legacyCourseId]);

  const faculty = await Faculty.findById(user._id).select('courseIds').lean();
  return resolveToCanonicalCourseIds(faculty?.courseIds);
}

async function getAllowedCourseIds(req) {
  if (req.user?.role === 'admin') return null;
  return getFacultyCourseIds(req.user);
}

function isCourseAllowed(allowedCourseIds, courseId) {
  if (allowedCourseIds === null) return true;
  return allowedCourseIds.includes(String(courseId || '').trim());
}

function buildScopedCourseFilter(baseFilter, allowedCourseIds) {
  if (allowedCourseIds === null) return { ...baseFilter };
  return {
    ...baseFilter,
    courseId: { $in: allowedCourseIds }
  };
}

module.exports = {
  getAllowedCourseIds,
  getFacultyCourseIds,
  resolveToCanonicalCourseIds,
  isCourseAllowed,
  buildScopedCourseFilter
};
