import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface CacheEntry<T> { data: T; ts: number; }

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = environment.apiBaseUrl;
  private readonly TTL_MS = 45_000; // 45 seconds
  private cache = new Map<string, CacheEntry<any>>();

  constructor(private http: HttpClient) {}

  /** Return cached response if fresh, otherwise fetch and cache. */
  private get$<T>(url: string): Observable<T> {
    const entry = this.cache.get(url);
    if (entry && Date.now() - entry.ts < this.TTL_MS) {
      return of(entry.data as T);
    }
    return this.http.get<T>(url, { headers: this.getHeaders() }).pipe(
      tap(data => this.cache.set(url, { data, ts: Date.now() }))
    );
  }

  /** Invalidate all cache entries whose key starts with the given prefix. */
  private bust(prefix: string) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) this.cache.delete(key);
    }
  }

  private getHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }

  private getHeadersNoContentType(): HttpHeaders {
    const token = sessionStorage.getItem('auth_token');
    return new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }

  // ===== AUTH =====
  login(email: string, password: string, role: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, { email, password, role }, { headers: this.getHeaders() });
  }

  register(name: string, email: string, password: string, role: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/register`, { name, email, password, role }, { headers: this.getHeaders() });
  }

  getMe(): Observable<any> {
    return this.http.get(`${this.baseUrl}/auth/me`, { headers: this.getHeaders() });
  }

  // ===== STUDENT =====
  getAssignments(): Observable<any> {
    return this.get$(`${this.baseUrl}/student/assignments`);
  }

  submitAssignment(id: string, fileName: string, links: { url: string; label: string }[] = []): Observable<any> {
    this.bust(`${this.baseUrl}/student/assignments`);
    return this.http.post(`${this.baseUrl}/student/assignments/${id}/submit`, { fileName, links }, { headers: this.getHeaders() });
  }

  deleteSubmission(id: string): Observable<any> {
    this.bust(`${this.baseUrl}/student/assignments`);
    return this.http.delete(`${this.baseUrl}/student/assignments/${id}/submission`, { headers: this.getHeaders() });
  }

  getAttendance(): Observable<any> {
    return this.get$(`${this.baseUrl}/student/attendance`);
  }

  getAttendanceStats(): Observable<any> {
    return this.get$(`${this.baseUrl}/student/attendance/stats`);
  }

  markAttendance(lectureId: string, location: any, qrToken: string = ''): Observable<any> {
    this.bust(`${this.baseUrl}/student/attendance`);
    return this.http.post(`${this.baseUrl}/student/attendance/mark`, { lectureId, location, qrToken }, { headers: this.getHeaders() });
  }

  previewAttendanceScan(lectureId: string = '', qrToken: string = ''): Observable<any> {
    return this.http.post(`${this.baseUrl}/student/attendance/scan-preview`, { lectureId, qrToken }, { headers: this.getHeaders() });
  }

  getFees(): Observable<any> {
    return this.get$(`${this.baseUrl}/student/fees`);
  }

  getFeesStats(): Observable<any> {
    return this.get$(`${this.baseUrl}/student/fees/stats`);
  }

  payFee(id: string, method: string = 'Online', razorpayPaymentId?: string): Observable<any> {
    this.bust(`${this.baseUrl}/student/fees`);
    return this.http.post(`${this.baseUrl}/student/fees/${id}/pay`, { method, razorpayPaymentId }, { headers: this.getHeaders() });
  }

  payAllFees(method: string = 'Online', razorpayPaymentId?: string): Observable<any> {
    this.bust(`${this.baseUrl}/student/fees`);
    return this.http.post(`${this.baseUrl}/student/fees/pay-all`, { method, razorpayPaymentId }, { headers: this.getHeaders() });
  }

  getTimetable(day?: number, date?: string): Observable<any> {
    const params: string[] = [];
    if (day !== undefined) params.push(`day=${day}`);
    if (date) params.push(`date=${date}`);
    const q = params.length ? `?${params.join('&')}` : '';
    return this.get$(`${this.baseUrl}/student/timetable${q}`);
  }

  getScores(courseId?: string): Observable<any> {
    const q = courseId ? `?courseId=${courseId}` : '';
    return this.get$(`${this.baseUrl}/student/scores${q}`);
  }

  getUpcomingTests(): Observable<any> {
    return this.get$(`${this.baseUrl}/student/tests/upcoming`);
  }

  getPastTests(): Observable<any> {
    return this.get$(`${this.baseUrl}/student/tests/past`);
  }

  getClassmates(): Observable<any> {
    return this.get$(`${this.baseUrl}/student/classmates`);
  }

  getMyRank(): Observable<any> {
    return this.get$(`${this.baseUrl}/student/my-rank`);
  }

  getFaculty(): Observable<any> {
    return this.get$(`${this.baseUrl}/student/faculty`);
  }

  getFacultyPosts(facultyId: string): Observable<any> {
    return this.get$(`${this.baseUrl}/student/faculty/${facultyId}/posts`);
  }

  getDashboardSummary(): Observable<any> {
    return this.get$(`${this.baseUrl}/student/dashboard/summary`);
  }

  getFacultyDashboardSummary(): Observable<any> {
    return this.get$(`${this.baseUrl}/faculty/dashboard/summary`);
  }

  // ===== STUDENT PROFILE =====
  getProfile(): Observable<any> {
    return this.get$(`${this.baseUrl}/student/profile`);
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/student/profile`, data, { headers: this.getHeaders() });
  }

  deleteAccount(): Observable<any> {
    return this.http.delete(`${this.baseUrl}/student/profile`, { headers: this.getHeaders() });
  }

  // ===== NOTICES =====
  private mapNotice(n: any) {
    return { ...n, id: n._id || n.id };
  }

  getNotices(): Observable<any> {
    return this.get$<any[]>(`${this.baseUrl}/notices`).pipe(
      map(notices => notices.map(n => this.mapNotice(n)))
    );
  }

  createNotice(notice: any): Observable<any> {
    this.bust(`${this.baseUrl}/notices`);
    return this.http.post(`${this.baseUrl}/notices`, notice, { headers: this.getHeaders() }).pipe(
      map(n => this.mapNotice(n))
    );
  }

  uploadNoticeFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/notices/upload`, formData, {
      headers: this.getHeadersNoContentType()
    });
  }

  updateNotice(id: string, notice: any): Observable<any> {
    this.bust(`${this.baseUrl}/notices`);
    return this.http.put(`${this.baseUrl}/notices/${id}`, notice, { headers: this.getHeaders() }).pipe(
      map(n => this.mapNotice(n))
    );
  }

  deleteNotice(id: string): Observable<any> {
    this.bust(`${this.baseUrl}/notices`);
    return this.http.delete(`${this.baseUrl}/notices/${id}`, { headers: this.getHeaders() });
  }

  // ===== STUDY MATERIALS =====
  getStudyMaterials(subject?: string): Observable<any> {
    const q = subject ? `?subject=${encodeURIComponent(subject)}` : '';
    return this.get$(`${this.baseUrl}/study-materials${q}`);
  }

  getStudyMaterialSubjects(): Observable<any> {
    return this.get$(`${this.baseUrl}/study-materials/subjects`);
  }

  // ===== TODOS =====
  getTodos(): Observable<any> {
    return this.get$(`${this.baseUrl}/todos`);
  }

  createTodo(todo: any): Observable<any> {
    this.bust(`${this.baseUrl}/todos`);
    return this.http.post(`${this.baseUrl}/todos`, todo, { headers: this.getHeaders() });
  }

  updateTodo(id: string, todo: any): Observable<any> {
    this.bust(`${this.baseUrl}/todos`);
    return this.http.put(`${this.baseUrl}/todos/${id}`, todo, { headers: this.getHeaders() });
  }

  deleteTodo(id: string): Observable<any> {
    this.bust(`${this.baseUrl}/todos`);
    return this.http.delete(`${this.baseUrl}/todos/${id}`, { headers: this.getHeaders() });
  }

  // ===== CHAT =====
  sendChatMessage(message: string, history: any[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/chat/message`, { message, history }, { headers: this.getHeaders() });
  }

  // ===== ADMIN STATS =====
  getAdminStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/stats`, { headers: this.getHeaders() });
  }

  // ===== ADMIN STUDENTS =====
  getAdminStudents(): Observable<any> {
    return this.get$(`${this.baseUrl}/admin/students`);
  }

  createAdminStudent(student: any): Observable<any> {
    this.bust(`${this.baseUrl}/admin/students`);
    return this.http.post(`${this.baseUrl}/admin/students`, student, { headers: this.getHeaders() });
  }

  updateAdminStudent(id: string, student: any): Observable<any> {
    this.bust(`${this.baseUrl}/admin/students`);
    return this.http.put(`${this.baseUrl}/admin/students/${id}`, student, { headers: this.getHeaders() });
  }

  deleteAdminStudent(id: string): Observable<any> {
    this.bust(`${this.baseUrl}/admin/students`);
    return this.http.delete(`${this.baseUrl}/admin/students/${id}`, { headers: this.getHeaders() });
  }

  getNextAdminRollNo(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/students/next-roll-no`, { headers: this.getHeaders() });
  }

  checkAdminRollNo(rollNo: string, excludeId?: string): Observable<any> {
    const q = excludeId ? `?rollNo=${encodeURIComponent(rollNo)}&excludeId=${excludeId}` : `?rollNo=${encodeURIComponent(rollNo)}`;
    return this.http.get(`${this.baseUrl}/admin/students/check-roll-no${q}`, { headers: this.getHeaders() });
  }

  // ===== ADMIN FACULTY =====
  getAdminFaculty(): Observable<any> {
    return this.get$(`${this.baseUrl}/admin/faculty`);
  }

  createAdminFaculty(faculty: any): Observable<any> {
    this.bust(`${this.baseUrl}/admin/faculty`);
    return this.http.post(`${this.baseUrl}/admin/faculty`, faculty, { headers: this.getHeaders() });
  }

  updateAdminFaculty(id: string, faculty: any): Observable<any> {
    this.bust(`${this.baseUrl}/admin/faculty`);
    return this.http.put(`${this.baseUrl}/admin/faculty/${id}`, faculty, { headers: this.getHeaders() });
  }

  deleteAdminFaculty(id: string): Observable<any> {
    this.bust(`${this.baseUrl}/admin/faculty`);
    return this.http.delete(`${this.baseUrl}/admin/faculty/${id}`, { headers: this.getHeaders() });
  }

  // ===== ADMIN COURSES =====
  getAdminCourses(): Observable<any> {
    return this.get$(`${this.baseUrl}/admin/courses`);
  }

  createAdminCourse(course: any): Observable<any> {
    this.bust(`${this.baseUrl}/admin/courses`);
    return this.http.post(`${this.baseUrl}/admin/courses`, course, { headers: this.getHeaders() });
  }

  updateAdminCourse(id: string, course: any): Observable<any> {
    this.bust(`${this.baseUrl}/admin/courses`);
    return this.http.put(`${this.baseUrl}/admin/courses/${id}`, course, { headers: this.getHeaders() });
  }

  deleteAdminCourse(id: string): Observable<any> {
    this.bust(`${this.baseUrl}/admin/courses`);
    return this.http.delete(`${this.baseUrl}/admin/courses/${id}`, { headers: this.getHeaders() });
  }

  addSubjectToCourse(courseId: string, subject: string): Observable<any> {
    this.bust(`${this.baseUrl}/admin/courses`);
    return this.http.post(`${this.baseUrl}/admin/courses/${courseId}/subjects`, { subject }, { headers: this.getHeaders() });
  }

  removeSubjectFromCourse(courseId: string, subject: string): Observable<any> {
    this.bust(`${this.baseUrl}/admin/courses`);
    return this.http.delete(`${this.baseUrl}/admin/courses/${courseId}/subjects/${encodeURIComponent(subject)}`, { headers: this.getHeaders() });
  }

  // ===== FACULTY ASSIGNMENTS =====
  getFacultyAssignments(): Observable<any> {
    return this.get$(`${this.baseUrl}/faculty/assignments`);
  }

  getFacultyAssignmentSubmissions(id: string): Observable<any> {
    return this.get$(`${this.baseUrl}/faculty/assignments/${id}/submissions`);
  }

  rejectSubmissionAsFaculty(assignmentId: string, studentId: string): Observable<any> {
    this.bust(`${this.baseUrl}/faculty/assignments`);
    return this.http.put(`${this.baseUrl}/faculty/assignments/${assignmentId}/submissions/${studentId}/reject`, {}, { headers: this.getHeaders() });
  }

  // ===== ADMIN ASSIGNMENTS =====
  getAdminAssignments(courseId?: string): Observable<any> {
    const q = courseId ? `?courseId=${courseId}` : '';
    return this.get$(`${this.baseUrl}/admin/assignments${q}`);
  }

  createAdminAssignment(assignment: any): Observable<any> {
    this.bust(`${this.baseUrl}/admin/assignments`);
    return this.http.post(`${this.baseUrl}/admin/assignments`, assignment, { headers: this.getHeaders() });
  }

  updateAdminAssignment(id: string, assignment: any): Observable<any> {
    this.bust(`${this.baseUrl}/admin/assignments`);
    return this.http.put(`${this.baseUrl}/admin/assignments/${id}`, assignment, { headers: this.getHeaders() });
  }

  deleteAdminAssignment(id: string): Observable<any> {
    this.bust(`${this.baseUrl}/admin/assignments`);
    return this.http.delete(`${this.baseUrl}/admin/assignments/${id}`, { headers: this.getHeaders() });
  }

  getAssignmentSubmissions(id: string): Observable<any> {
    // Always fetch fresh roster (submitted + pending) for modal accuracy.
    return this.http.get(`${this.baseUrl}/admin/assignments/${id}/submissions`, { headers: this.getHeaders() });
  }

  updateSubmissionStatus(assignmentId: string, studentId: string, status: 'submitted' | 'pending'): Observable<any> {
    this.bust(`${this.baseUrl}/admin/assignments`);
    this.bust(`${this.baseUrl}/admin/assignments/${assignmentId}/submissions`);
    return this.http.put(`${this.baseUrl}/admin/assignments/${assignmentId}/submissions/${studentId}`, { status }, { headers: this.getHeaders() });
  }

  rejectSubmissionAsAdmin(assignmentId: string, studentId: string): Observable<any> {
    return this.updateSubmissionStatus(assignmentId, studentId, 'pending');
  }

  // ===== ADMIN LECTURES =====
  getAdminLectures(courseId?: string, date?: string): Observable<any> {
    const params: string[] = [];
    if (courseId) params.push(`courseId=${courseId}`);
    if (date) params.push(`date=${date}`);
    const q = params.length ? `?${params.join('&')}` : '';
    return this.get$(`${this.baseUrl}/admin/lectures${q}`);
  }

  createAdminLecture(lecture: any): Observable<any> {
    this.bust(`${this.baseUrl}/admin/lectures`);
    return this.http.post(`${this.baseUrl}/admin/lectures`, lecture, { headers: this.getHeaders() });
  }

  updateAdminLecture(id: string, lecture: any): Observable<any> {
    this.bust(`${this.baseUrl}/admin/lectures`);
    return this.http.put(`${this.baseUrl}/admin/lectures/${id}`, lecture, { headers: this.getHeaders() });
  }

  deleteAdminLecture(id: string): Observable<any> {
    this.bust(`${this.baseUrl}/admin/lectures`);
    return this.http.delete(`${this.baseUrl}/admin/lectures/${id}`, { headers: this.getHeaders() });
  }

  updateLectureAttendance(id: string, attendance: any[]): Observable<any> {
    this.bust(`${this.baseUrl}/admin/lectures`);
    return this.http.put(`${this.baseUrl}/admin/lectures/${id}/attendance`, { attendance }, { headers: this.getHeaders() });
  }

  publishAttendance(lectureId: string, location: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/lectures/${lectureId}/attendance/publish`, { location }, { headers: this.getHeaders() });
  }

  stopPublishedAttendance(lectureId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/lectures/${lectureId}/attendance/stop`, {}, { headers: this.getHeaders() });
  }

  startQrSession(lectureId: string, location: any): Observable<any> {
    return this.publishAttendance(lectureId, location);
  }

  stopQrSession(lectureId: string): Observable<any> {
    return this.stopPublishedAttendance(lectureId);
  }

  // ===== ADMIN EXAMS =====
  getAdminExams(courseId?: string, status?: string): Observable<any> {
    const params: string[] = [];
    if (courseId) params.push(`courseId=${courseId}`);
    if (status) params.push(`status=${status}`);
    const q = params.length ? `?${params.join('&')}` : '';
    return this.get$(`${this.baseUrl}/admin/exams${q}`);
  }

  createAdminExam(exam: any): Observable<any> {
    this.bust(`${this.baseUrl}/admin/exams`);
    return this.http.post(`${this.baseUrl}/admin/exams`, exam, { headers: this.getHeaders() });
  }

  updateAdminExam(id: string, exam: any): Observable<any> {
    this.bust(`${this.baseUrl}/admin/exams`);
    return this.http.put(`${this.baseUrl}/admin/exams/${id}`, exam, { headers: this.getHeaders() });
  }

  deleteAdminExam(id: string): Observable<any> {
    this.bust(`${this.baseUrl}/admin/exams`);
    return this.http.delete(`${this.baseUrl}/admin/exams/${id}`, { headers: this.getHeaders() });
  }

  updateExamScores(id: string, studentResults: any[]): Observable<any> {
    this.bust(`${this.baseUrl}/admin/exams`);
    return this.http.put(`${this.baseUrl}/admin/exams/${id}/scores`, { studentResults }, { headers: this.getHeaders() });
  }

  publishExamResults(id: string, publish: boolean): Observable<any> {
    this.bust(`${this.baseUrl}/admin/exams`);
    return this.http.put(`${this.baseUrl}/admin/exams/${id}/publish`, { publish }, { headers: this.getHeaders() });
  }

  getStudentsByCourse(courseId: string): Observable<any> {
    // Bypass cache — always fetch fresh list so modals show current enrollment
    return this.http.get<any[]>(`${this.baseUrl}/admin/students?courseId=${encodeURIComponent(courseId)}`, { headers: this.getHeaders() });
  }

  getFacultyStudentsForCourse(courseId: string): Observable<any> {
    return this.get$(`${this.baseUrl}/faculty/courses/${courseId}/students`);
  }

  // ===== FACULTY EXAMS =====
  getFacultyExams(courseId?: string, status?: string): Observable<any> {
    const params: string[] = [];
    if (courseId) params.push(`courseId=${courseId}`);
    if (status) params.push(`status=${status}`);
    const q = params.length ? `?${params.join('&')}` : '';
    return this.get$(`${this.baseUrl}/faculty/exams${q}`);
  }

  createFacultyExam(exam: any): Observable<any> {
    this.bust(`${this.baseUrl}/faculty/exams`);
    return this.http.post(`${this.baseUrl}/faculty/exams`, exam, { headers: this.getHeaders() });
  }

  updateFacultyExam(id: string, exam: any): Observable<any> {
    this.bust(`${this.baseUrl}/faculty/exams`);
    return this.http.put(`${this.baseUrl}/faculty/exams/${id}`, exam, { headers: this.getHeaders() });
  }

  deleteFacultyExam(id: string): Observable<any> {
    this.bust(`${this.baseUrl}/faculty/exams`);
    return this.http.delete(`${this.baseUrl}/faculty/exams/${id}`, { headers: this.getHeaders() });
  }

  updateFacultyExamScores(id: string, studentResults: any[]): Observable<any> {
    this.bust(`${this.baseUrl}/faculty/exams`);
    return this.http.put(`${this.baseUrl}/faculty/exams/${id}/scores`, { studentResults }, { headers: this.getHeaders() });
  }

  publishFacultyExamResults(id: string, publish: boolean): Observable<any> {
    this.bust(`${this.baseUrl}/faculty/exams`);
    return this.http.put(`${this.baseUrl}/faculty/exams/${id}/publish`, { publish }, { headers: this.getHeaders() });
  }

  // ===== ADMIN TIMETABLE =====
  bustTimetableAndLecturesCache() {
    this.bust(`${this.baseUrl}/admin/timetable`);
    this.bust(`${this.baseUrl}/admin/lectures`);
  }

  getAdminTimetable(courseId?: string, day?: number): Observable<any> {
    const params: string[] = [];
    if (courseId) params.push(`courseId=${courseId}`);
    if (day !== undefined) params.push(`day=${day}`);
    const q = params.length ? `?${params.join('&')}` : '';
    return this.get$(`${this.baseUrl}/admin/timetable${q}`);
  }

  createAdminSchedule(schedule: any): Observable<any> {
    this.bust(`${this.baseUrl}/admin/timetable`);
    return this.http.post(`${this.baseUrl}/admin/timetable`, schedule, { headers: this.getHeaders() });
  }

  updateAdminSchedule(id: string, schedule: any): Observable<any> {
    this.bust(`${this.baseUrl}/admin/timetable`);
    return this.http.put(`${this.baseUrl}/admin/timetable/${id}`, schedule, { headers: this.getHeaders() });
  }

  deleteAdminSchedule(id: string): Observable<any> {
    this.bust(`${this.baseUrl}/admin/timetable`);
    return this.http.delete(`${this.baseUrl}/admin/timetable/${id}`, { headers: this.getHeaders() });
  }

  // ===== ADMIN TESTS =====
  getAdminTests(courseId?: string, status?: string): Observable<any> {
    const params: string[] = [];
    if (courseId) params.push(`courseId=${courseId}`);
    if (status) params.push(`status=${status}`);
    const q = params.length ? `?${params.join('&')}` : '';
    return this.get$(`${this.baseUrl}/admin/tests${q}`);
  }

  createAdminTest(test: any): Observable<any> {
    this.bust(`${this.baseUrl}/admin/tests`);
    return this.http.post(`${this.baseUrl}/admin/tests`, test, { headers: this.getHeaders() });
  }

  updateAdminTest(id: string, test: any): Observable<any> {
    this.bust(`${this.baseUrl}/admin/tests`);
    return this.http.put(`${this.baseUrl}/admin/tests/${id}`, test, { headers: this.getHeaders() });
  }

  deleteAdminTest(id: string): Observable<any> {
    this.bust(`${this.baseUrl}/admin/tests`);
    return this.http.delete(`${this.baseUrl}/admin/tests/${id}`, { headers: this.getHeaders() });
  }

  // ===== ADMIN FEES =====
  getAdminFees(studentId?: string, courseId?: string): Observable<any> {
    const params: string[] = [];
    if (studentId) params.push(`studentId=${studentId}`);
    if (courseId) params.push(`courseId=${courseId}`);
    const q = params.length ? `?${params.join('&')}` : '';
    return this.get$(`${this.baseUrl}/admin/fees${q}`);
  }

  createAdminFee(fee: any): Observable<any> {
    this.bust(`${this.baseUrl}/admin/fees`);
    return this.http.post(`${this.baseUrl}/admin/fees`, fee, { headers: this.getHeaders() });
  }

  updateAdminFee(id: string, fee: any): Observable<any> {
    this.bust(`${this.baseUrl}/admin/fees`);
    return this.http.put(`${this.baseUrl}/admin/fees/${id}`, fee, { headers: this.getHeaders() });
  }

  deleteAdminFee(id: string): Observable<any> {
    this.bust(`${this.baseUrl}/admin/fees`);
    return this.http.delete(`${this.baseUrl}/admin/fees/${id}`, { headers: this.getHeaders() });
  }

  syncAdminFeesForEnrolledStudents(): Observable<any> {
    this.bust(`${this.baseUrl}/admin/fees`);
    return this.http.post(`${this.baseUrl}/admin/fees/sync-auto`, {}, { headers: this.getHeaders() });
  }

  generateFeesForStudent(studentId: string): Observable<any> {
    this.bust(`${this.baseUrl}/admin/fees`);
    return this.http.post(`${this.baseUrl}/admin/fees/generate/${studentId}`, {}, { headers: this.getHeaders() });
  }

  // ===== LANDING PAGE COURSES (public) =====
  getLandingCourses(): Observable<any> {
    return this.http.get(`${this.baseUrl}/landing/courses`);
  }

  // Admin updates landing page fields (title, category, image, description, rating) on a course
  updateLandingCourse(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/admin/courses/${id}`, data, { headers: this.getHeaders() });
  }

  createLandingCourse(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/courses`, data, { headers: this.getHeaders() });
  }

  deleteLandingCourse(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/admin/courses/${id}`, { headers: this.getHeaders() });
  }

  // ===== CONTACT FORM =====
  submitContact(data: { name: string; email: string; message: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/contact`, data);
  }

  getAdminContacts(): Observable<any> {
    return this.http.get(`${this.baseUrl}/contact`, { headers: this.getHeaders() });
  }

  markContactRead(id: string, read: boolean): Observable<any> {
    return this.http.patch(`${this.baseUrl}/contact/${id}/read`, { read }, { headers: this.getHeaders() });
  }

  deleteContact(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/contact/${id}`, { headers: this.getHeaders() });
  }
}
