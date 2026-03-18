const router = require('express').Router();

// ── System prompt describing the Campvia platform ─────────────────────────────
const SYSTEM_INSTRUCTION = `You are Campvia AI, the official intelligent assistant for the Campvia Institute academic platform. 
Always answer questions about this platform accurately and helpfully.

## About Campvia Institute
Campvia is a modern digital higher education platform serving 15,000+ students globally. It combines technology and academia to deliver a complete campus management experience.

## Platform Features & Pages

### For Students (Student Dashboard):
- **Dashboard Home**: Overview of attendance, upcoming tests, assignments, fees, and notices at a glance.
- **Attendance**: View lecture-wise attendance records, percentage, and mark attendance using location. Minimum 75% attendance required for exams.
- **Assignments**: View, submit (file upload or links), and track all assignments with deadlines and submission status.
- **Timetable**: View daily and weekly class schedule with subject, faculty, room, and time details.
- **Scores / Grades**: View exam scores, marks per subject, and overall academic performance.
- **Upcoming Tests**: See scheduled tests, dates, subjects, and syllabi.
- **Fees**: View fee structure, due amounts, paid history, and pay fees online via multiple payment methods.
- **Notices**: Read official announcements and notices from administration and faculty.
- **Study Materials**: Access notes, PDFs, and resources uploaded by faculty, organized by subject.
- **Faculty**: View assigned faculty members, their subjects, and their posts/updates.
- **Classmates**: See fellow students in your batch/section.
- **To-Do List**: Personal task manager to add, edit, complete, and delete tasks/reminders.
- **Profile**: View and edit personal profile information.

### For Faculty:
- Faculty can log in and access a Faculty Dashboard.
- Can post updates visible to students.
- Can view their assigned courses and students.

### For Admin:
- Full admin dashboard to manage students, faculty, courses, assignments, lectures, exams, timetable, tests, fees, and stats.
- Can create notices, upload study materials, manage attendance records.

### Public Pages:
- **Landing / Home**: Introduction to the institute with hero section, programs, stats, about info, and contact.
- **Courses**: Browse available academic programs/courses offered.
- **About**: History, mission, and details about the institute.
- **Contact**: Contact form to reach campus support.

## Authentication
- Three roles: Student, Faculty, Admin.
- Login via Portal ID / Email and Password.
- Register as a new student.
- JWT-based session stored in sessionStorage.

## Technical Stack
- Frontend: Angular (TypeScript), Tailwind CSS
- Backend: Node.js, Express.js, MongoDB
- AI: Google Gemini API (that's me!)

## Guidelines
- Always be helpful, friendly, and concise.
- If asked about features, explain clearly which section/page the user should visit.
- For general knowledge questions, answer them accurately.
- Never make up features that don't exist on the platform.
- If unsure about something specific, guide the user to contact support via the Contact page.`;

// ── Gemini helper ──────────────────────────────────────────────────────────────
async function askGemini(message, history) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('No API key');

  const contents = [
    ...history.map(h => ({
      role: h.role,
      parts: [{ text: (h.parts && h.parts[0]) ? h.parts[0].text : (h.text || '') }]
    })),
    { role: 'user', parts: [{ text: message }] }
  ];

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents,
    generationConfig: { maxOutputTokens: 1024, temperature: 0.7 }
  };

  // Try models in priority order
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-flash-latest'];
  let lastErr;
  for (const model of models) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(timer);
      const data = await resp.json();
      if (!resp.ok) {
        lastErr = new Error(data.error?.message || resp.statusText);
        continue;
      }
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('All Gemini models failed');
}

// ── Smart local fallback ───────────────────────────────────────────────────────
function localFallback(message) {
  const msg = message.toLowerCase();

  const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
  if (greetings.some(g => msg.includes(g))) {
    return "Hello! I'm Campvia AI, your campus assistant. I can help with academic questions, campus info, study tips, and more. What would you like to know?";
  }
  if (msg.includes('fee') || msg.includes('payment') || msg.includes('tuition')) {
    return "For fee-related information, please visit the **Fees** section in your student dashboard. You can view due amounts and pay online directly from there.";
  }
  if (msg.includes('attendance')) {
    return "You can check your attendance records and mark attendance from the **Attendance** section in your dashboard. Classes require 75% attendance to be eligible for exams.";
  }
  if (msg.includes('assignment')) {
    return "Assignments are listed under the **Assignments** section in your dashboard. You can submit files or links directly. Make sure to submit before the deadline!";
  }
  if (msg.includes('timetable') || msg.includes('schedule') || msg.includes('class')) {
    return "Your class timetable is available in the **Timetable** section of your dashboard. It shows today's schedule and the full weekly view.";
  }
  if (msg.includes('exam') || msg.includes('test') || msg.includes('score') || msg.includes('grade') || msg.includes('result')) {
    return "Exam results and scores are available in the **Scores** section of your dashboard. Upcoming tests are listed under **Upcoming Tests**.";
  }
  if (msg.includes('notice') || msg.includes('announcement')) {
    return "All campus notices and announcements are available in the **Notices** section. Check there for the latest updates from administration.";
  }
  if (msg.includes('study material') || msg.includes('notes') || msg.includes('resource')) {
    return "Study materials uploaded by your faculty are available in the **Study Materials** section of your dashboard, organized by subject.";
  }
  if (msg.includes('contact') || msg.includes('support') || msg.includes('help desk')) {
    return "You can reach the campus support team via the **Contact** page. Fill in the form with your query and the team will get back to you shortly.";
  }
  if (msg.includes('password') || msg.includes('login') || msg.includes('account')) {
    return "If you're having trouble logging in, use the **Forgot Password** link on the login page. For account issues, contact administration through the Contact section.";
  }
  if (msg.includes('faculty') || msg.includes('professor') || msg.includes('teacher')) {
    return "You can view your faculty members and their posts in the **Faculty** section of your dashboard. You can see their subjects and any updates they've shared.";
  }
  if (msg.includes('todo') || msg.includes('task') || msg.includes('reminder')) {
    return "Keep track of your tasks using the **To-Do List** in your dashboard. You can add, edit, and mark tasks as complete to stay organized.";
  }
  if (msg.includes('what is') || msg.includes('define') || msg.includes('explain') || msg.includes('how does') || msg.includes('how to') || msg.includes('what are')) {
    return "That's a great question! To answer it with full AI capability, please update the GEMINI_API_KEY in your backend .env file with a fresh key from https://aistudio.google.com/app/apikey — it's free. Once updated, I can answer any question with full intelligence!";
  }
  if (msg.includes('thank')) {
    return "You're welcome! Is there anything else I can help you with?";
  }
  if (msg.includes('bye') || msg.includes('goodbye')) {
    return "Goodbye! Feel free to come back anytime you need help. Good luck with your studies!";
  }

  return `I'm currently running in limited mode because my AI engine needs a fresh API key. For campus-related questions (fees, attendance, assignments, timetable, scores, notices), I can help right away!\n\nFor full AI capability on any topic, please update GEMINI_API_KEY in the backend .env with a free key from: https://aistudio.google.com/app/apikey`;
}

// ── Route ──────────────────────────────────────────────────────────────────────
router.post('/message', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    try {
      const reply = await askGemini(message, history || []);
      return res.json({ reply });
    } catch (geminiErr) {
      console.warn('Gemini unavailable, using local fallback:', geminiErr.message);
      return res.json({ reply: localFallback(message) });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
