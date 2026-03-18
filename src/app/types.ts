export interface Course {
    id: string;
    title: string;
    category: string;
    duration: string;
    image: string;
    description: string;
    rating: number;
}

export interface StatItem {
    label: string;
    value: string;
    suffix: string;
}

export interface NavLink {
    name: string;
    href: string;
}

export interface SubmissionLink {
    url: string;
    label: string;
}

export interface AssignmentSubmission {
    studentId: string;
    studentName: string;
    fileName?: string;
    links?: SubmissionLink[];
    submittedAt?: string;
    status: 'submitted' | 'pending';
}

export interface Assignment {
    id: string;
    title: string;
    subject: string;
    courseId?: string;
    dueDate: string;
    status: 'pending' | 'submitted';
    description: string;
    submittedFile?: string;
    submissions?: AssignmentSubmission[];
    // Current student's own submission data (populated by frontend)
    myLinks?: SubmissionLink[];
    myFileName?: string;
}

export interface ScheduleItem {
    id: string;
    time: string;
    subject: string;
    room: string;
    duration: string;
    type: 'lecture' | 'lab' | 'seminar';
    faculty: string;
    active?: boolean;
}

export interface StudentScore {
    id: number;
    name: string;
    score: number;
    class: string;
    trend: 'up' | 'down' | 'stable';
    isUser?: boolean;
}

export interface StudyMaterial {
    id: string;
    title: string;
    subject: string;
    category: string;
    fileUrl: string;
    driveUrl?: string;
    uploadDate: string;
    size: string;
}

export interface HistoricalRank {
    year: string;
    rank: number;
    percentile: number;
    gpa: number;
}

export interface AttendanceRecord {
    id: string;
    date: string;
    subject: string;
    status: 'present' | 'absent';
    timestamp?: string;
}

export interface SubjectAttendance {
    subject: string;
    present: number;
    total: number;
    percentage: number;
    minRequirement?: number;
}

export interface FeeRecord {
    id: string;
    title: string;
    amount: number;
    dueDate: string;
    status: 'paid' | 'pending' | 'overdue';
    category: string;
    semester?: string;
    paidDate?: string;
    transactionId?: string;
    method?: string;
}

export interface TestItem {
    id: string;
    subject: string;
    description: string;
    date: string;
    type: string;
    room: string;
    duration: string;
    importance: 'high' | 'medium' | 'low';
    urgent?: boolean;
}

export interface NoticeAttachment {
    name: string;
    url: string;
    type: 'image' | 'pdf' | 'doc' | 'link' | 'other';
}

export interface Notice {
    id: string;
    title: string;
    category: string;
    date: string;
    sender: string;
    role: string;
    content: string;
    priority: 'high' | 'normal';
    attachment?: string;
    attachments?: NoticeAttachment[];
}

export interface Classmate {
    id: string;
    rollNo: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
    gpa: number;
    avgScore: number;
    classRank: number;
    collegeRank: number;
    bio: string;
    specialization: string;
    location?: string;
}

export interface Faculty {
    id: string;
    name: string;
    designation: string;
    department: string;
    email: string;
    phone: string;
    avatar?: string;
    office: string;
    bio: string;
    subjects: string[];
    experience: string;
    sharedPosts?: Array<{
        id: string;
        title: string;
        type: 'pdf' | 'link' | 'video';
        date: string;
    }>;
}

export interface UserTodo {
    id: string;
    title: string;
    date: string;
    time: string;
    subject?: string;
    description: string;
    completed: boolean;
}

export interface ExamResult {
    studentId: string;
    studentName: string;
    score: number | null;
}

export interface ExamRecord {
    id: string;
    title: string;
    courseId: string;
    subject: string;
    date: string;
    duration: string;
    type: string;
    status: 'upcoming' | 'completed';
    resultsPublished: boolean;
    studentResults: ExamResult[];
}
