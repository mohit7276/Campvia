const router = require('express').Router();
const Course = require('../models/Course');

/**
 * If the stored URL is a Google imgres or Bing search URL,
 * extract the real direct image URL from the query params.
 */
function sanitizeImageUrl(url) {
  if (!url) return url;
  try {
    const p = new URL(url);
    // Google Images: google.com/imgres?imgurl=<actual-url>
    if (p.hostname.includes('google.') && p.pathname.includes('imgres')) {
      const real = p.searchParams.get('imgurl');
      if (real) return decodeURIComponent(real);
    }
    // Bing Images: mediaurl param
    if (p.hostname.includes('bing.com') && p.searchParams.has('mediaurl')) {
      const real = p.searchParams.get('mediaurl');
      if (real) return decodeURIComponent(real);
    }
  } catch (_) { }
  return url;
}

// PUBLIC — get all courses that have an image set (landing page display)
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({ image: { $exists: true, $ne: '' } }).select(
      'courseId name title category duration image description rating'
    );
    // If a course has no explicit title, fall back to the course name
    const result = courses.map(c => ({
      _id: c._id,
      courseId: c.courseId,
      title: c.title && c.title.trim() ? c.title : c.name,
      category: c.category || '',
      duration: c.duration || '',
      image: sanitizeImageUrl(c.image),   // fix any stored Google/Bing search URLs
      description: c.description || '',
      rating: c.rating || 0
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
