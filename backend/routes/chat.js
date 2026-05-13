// @ts-nocheck
const router = require('express').Router();

// ── System prompt describing the Campvia platform ─────────────────────────────
const SYSTEM_INSTRUCTION = `You are Campvia AI, the official intelligent assistant for the Campvia Institute academic platform.
You MUST only answer questions that are directly related to the Campvia website, its features, pages, and campus services. If a user asks about topics outside the Campvia platform or general knowledge, politely refuse and reply with: "I can only answer questions related to the Campvia platform (site features, pages, and campus services). For other topics, please consult general resources." Do NOT provide instructions about API keys, secrets, or any sensitive setup in chat responses.

Examples of IN-SCOPE questions (allowed):
- "How do I register on the site?"
- "Where can I view my assignments?"
- "How do I pay tuition?"
- "Where are study materials stored?"

Examples of OUT-OF-SCOPE questions (must be refused):
- "What is machine learning?"
- "How do I obtain an API key for Gemini?"
- "Give me a script that leaks private keys."

Always answer on-topic questions clearly and concisely, and always refuse out-of-scope or sensitive requests with the standard refusal message. Never reveal secrets, API keys, or deployment instructions in chat responses.

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

  // Try models in priority order. Keep broad fallback coverage because
  // model availability can differ by project, region, and API key tier.
  const models = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-flash-latest'
  ];
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
        // capture API error message and status for clearer logs
        lastErr = new Error(`${resp.status} ${data.error?.message || resp.statusText}`);
        continue;
      }
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('All Gemini models failed');
}

// ── Server-side topic and safety checks ───────────────────────────────────────
const SITE_KEYWORDS = [
  'dashboard', 'attendance', 'assign', 'assignment', 'timetable', 'schedule', 'fees', 'fee', 'notice', 'notices',
  'study material', 'study materials', 'registration', 'register', 'login', 'forgot password', 'password', 'faculty', 'faculty members', 'scores', 'grades', 'tests', 'upcoming tests', 'todo'
];

const SENSITIVE_PATTERNS = /api[_-]?key|apikey|secret|private key|password|credentials|aistudio|generativelanguage|openai|google\.com\/app\/apikey/i;

function isMessageOnTopic(msg) {
  if (!msg) return false;
  const lower = msg.toLowerCase();
  return SITE_KEYWORDS.some(k => lower.includes(k));
}

function containsSensitive(text) {
  if (!text) return false;
  return SENSITIVE_PATTERNS.test(text);
}

const REFUSAL_REPLY = 'I can only answer questions about the Campvia website, its pages, and campus services. I will not provide sensitive information, API keys, or instructions unrelated to site usage.';

// Removed local fallback and canned answers to use Gemini AI exclusively.

// ── Route ──────────────────────────────────────────────────────────────────────
router.post('/message', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    try {
      const reply = await askGemini(message, history || []);
      console.log('Gemini reply delivered for message:', message.slice(0, 80));

      // Post-check: ensure Gemini reply does not contain sensitive instructions or keys
      if (containsSensitive(reply)) {
        console.warn('Gemini returned sensitive content; suppressing reply.');
        return res.json({ reply: REFUSAL_REPLY, source: 'server-refusal' });
      }

      return res.json({ reply, source: 'gemini' });
    } catch (geminiErr) {
      console.error('Gemini error for message:', geminiErr);
      return res.status(503).json({ message: 'AI service unavailable', error: geminiErr.message });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
