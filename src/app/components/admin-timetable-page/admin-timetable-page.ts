import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Clock, MapPin, User, ChevronLeft, ChevronRight, Calendar, RotateCcw, X, GraduationCap, Users, Bookmark, Edit2, Trash2, Plus, XCircle, CheckCircle, BookOpen, Search, Send } from 'lucide-angular';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { DataService, Course } from '../../services/data.service';
import { ApiService } from '../../services/api.service';

const CAMPUS_FALLBACK_LOCATION = { lat: 23.0258, lng: 72.5873 };

export interface AdminScheduleItem {
  id: string;
  courseId: string;
  dayOfWeek: number;
  time: string;
  endTime: string;
  subject: string;
  room: string;
  type: 'lecture' | 'lab' | 'seminar' | 'workshop';
  faculty: string;
}

export interface StudentAttendance {
  studentId: string;
  studentName: string;
  status: 'present' | 'absent';
}

export interface Lecture {
  id: string;
  courseId: string;
  subject: string;
  date: string;
  time: string;
  instructor: string;
  attendance: StudentAttendance[];
}

@Component({
  selector: 'app-admin-timetable-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin-timetable-page.html',
  styleUrls: ['./admin-timetable-page.css'],
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, marginTop: '20px' }),
          stagger(50, [
            animate('300ms ease-out', style({ opacity: 1, marginTop: '0' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('modalAnimation', [
      transition(':enter', [
        style({ opacity: 0, scale: 0.95 }),
        animate('200ms ease-out', style({ opacity: 1, scale: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, scale: 0.95 }))
      ])
    ]),
    trigger('dateAnimation', [
      transition(':enter', [
        style({ opacity: 0, scale: 0.9 }),
        animate('300ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ opacity: 1, scale: 1 }))
      ])
    ])
  ],
  providers: [DatePipe]
})
export class AdminTimetablePage implements OnInit {
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  // Icons
  readonly Clock = Clock;
  readonly MapPin = MapPin;
  readonly User = User;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly Calendar = Calendar;
  readonly RotateCcw = RotateCcw;
  readonly X = X;
  readonly GraduationCap = GraduationCap;
  readonly Users = Users;
  readonly Bookmark = Bookmark;
  readonly Edit2 = Edit2;
  readonly Trash2 = Trash2;
  readonly Plus = Plus;
  readonly XCircle = XCircle;
  readonly CheckCircle = CheckCircle;
  readonly BookOpen = BookOpen;
  readonly Search = Search;
  readonly Send = Send;

  constructor(private dataService: DataService, private datePipe: DatePipe) { }

  get coursesList(): Course[] {
    return this.dataService.courses();
  }

  // Main tab: 'schedule' (recurring) or 'lectures' (date-specific with attendance)
  mainTab: 'schedule' | 'lectures' = 'schedule';

  selectedCourseId: string = 'C01';
  selectedDate: Date = new Date();
  isCalendarOpen = false;
  viewDate: Date = new Date();

  calendarDays: (Date | null)[] = [];
  dateWindow: Date[] = [];

  schedules: AdminScheduleItem[] = [];
  allFaculty: any[] = [];

  // Schedule Form
  isScheduleModalOpen = false;
  isEditing = false;
  currentScheduleId: string | null = null;
  saving = false;
  formCourseId = 'C01';
  formDayOfWeek = 1;
  formTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  formEndTime = new Date(new Date().getTime() + 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  formSubject = '';
  formRoom = 'Room 101';
  formType: 'lecture' | 'lab' | 'seminar' | 'workshop' = 'lecture';
  formFaculty = '';

  // ─── Lecture Management (merged from admin-attendance) ───
  lectures: Lecture[] = [];
  lectureViewMode: 'today' | 'subject' = 'today';
  lectureSearchQuery: string = '';
  selectedSubject: string | null = null;
  todayStr = new Date().toISOString().split('T')[0];

  // Lecture Form
  isLectureModalOpen = false;
  isLectureEditing = false;
  currentLectureId: string | null = null;
  lectureFormCourseId = 'C01';
  lectureFormSubject = '';
  lectureFormDate = '';
  lectureFormTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  lectureFormInstructor = '';

  // Attendance Modal
  isAttendanceModalOpen = false;
  editingLecture: Lecture | null = null;
  loadingAttendanceStudents = false;
  savingAttendance = false;

  // QR Modal
  isQrModalOpen = false;
  currentQrLecture: Lecture | null = null;
  qrStatus: 'idle' | 'generating' | 'ready' | 'error' = 'idle';
  qrErrorMessage = '';
  qrScanUrl = '';

  get qrImageUrl(): string {
    if (!this.qrScanUrl) return '';
    return `https://quickchart.io/qr?size=240&text=${encodeURIComponent(this.qrScanUrl)}`;
  }

  ngOnInit() {
    if (this.coursesList.length > 0) {
      this.selectedCourseId = this.coursesList[0].id;
      this.formCourseId = this.coursesList[0].id;
      this.lectureFormCourseId = this.coursesList[0].id;
    }
    this.lectureFormDate = this.todayStr;
    this.loadSchedules();
    this.loadLectures();
    this.api.getAdminFaculty().subscribe((data: any[]) => {
      this.allFaculty = data;
      this.cdr.detectChanges();
    });
    this.updateDateWindow();
    this.generateCalendarDays();
  }

  loadSchedules() {
    this.api.getAdminTimetable().subscribe((data: any[]) => {
      this.schedules = data.map((s: any) => ({
        id: s._id || s.id,
        courseId: s.courseId || '',
        dayOfWeek: s.dayOfWeek,
        time: s.time,
        endTime: s.endTime || '',
        subject: s.subject,
        room: s.room,
        type: s.type || 'lecture',
        faculty: s.faculty
      }));
      this.cdr.detectChanges();
    });
  }

  get currentSchedule(): AdminScheduleItem[] {
    const currentDay = this.selectedDate.getDay();
    return this.schedules
      .filter(s => s.courseId === this.selectedCourseId && s.dayOfWeek === currentDay)
      .sort((a, b) => {
        const timeToMinutes = (t: string) => {
          let [time, modifier] = t.split(' ');
          let [hours, minutes] = time.split(':').map(Number);
          if (modifier === 'PM' && hours < 12) hours += 12;
          if (modifier === 'AM' && hours === 12) hours = 0;
          return hours * 60 + minutes;
        };
        return timeToMinutes(a.time) - timeToMinutes(b.time);
      });
  }

  get availableSubjects(): string[] {
    const c = this.coursesList.find(c => c.id === this.formCourseId);
    return c ? c.subjects : [];
  }

  get facultyForScheduleCourse(): any[] {
    return this.allFaculty.filter(f =>
      f.courseIds && f.courseIds.includes(this.formCourseId)
    );
  }

  get facultyForLectureCourse(): any[] {
    return this.allFaculty.filter(f =>
      f.courseIds && f.courseIds.includes(this.lectureFormCourseId)
    );
  }

  // Date Carousel logic
  updateDateWindow() {
    const arr = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(this.selectedDate);
      d.setDate(this.selectedDate.getDate() + i);
      arr.push(d);
    }
    this.dateWindow = arr;
  }

  isSelected(date: Date): boolean {
    return date.toDateString() === this.selectedDate.toDateString();
  }

  isToday(date: Date): boolean {
    return date.toDateString() === new Date().toDateString();
  }

  goToToday() {
    const today = new Date();
    this.selectedDate = today;
    this.viewDate = today;
    this.updateDateWindow();
    this.generateCalendarDays();
    // Bust cache and reload fresh data from server
    this.api.bustTimetableAndLecturesCache();
    this.loadSchedules();
    this.loadLectures();
    this.cdr.detectChanges();
  }

  shiftDate(days: number) {
    const newDate = new Date(this.selectedDate);
    newDate.setDate(this.selectedDate.getDate() + days);
    this.selectedDate = newDate;
    this.viewDate = newDate;
    this.updateDateWindow();
  }

  handleDateSelect(date: Date) {
    this.selectedDate = date;
    this.isCalendarOpen = false;
    this.updateDateWindow();
  }

  // Modal Operations
  openAddScheduleModal() {
    this.isEditing = false;
    this.currentScheduleId = null;
    this.formCourseId = this.selectedCourseId;
    this.formDayOfWeek = this.selectedDate.getDay();
    this.formSubject = this.availableSubjects.length > 0 ? this.availableSubjects[0] : '';
    this.formTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    this.formEndTime = new Date(new Date().getTime() + 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    this.formRoom = '';
    this.formType = 'lecture';
    this.formFaculty = '';
    this.isScheduleModalOpen = true;
  }

  openEditScheduleModal(item: AdminScheduleItem) {
    this.isEditing = true;
    this.currentScheduleId = item.id;
    this.formCourseId = item.courseId;
    this.formDayOfWeek = item.dayOfWeek;
    this.formSubject = item.subject;
    this.formTime = item.time;
    this.formEndTime = item.endTime;
    this.formRoom = item.room;
    this.formType = item.type;
    this.formFaculty = item.faculty;
    this.isScheduleModalOpen = true;
  }

  closeScheduleModal() {
    this.isScheduleModalOpen = false;
  }

  saveSchedule() {
    if (this.saving) return;
    this.saving = true;
    const payload: any = {
      courseId: this.formCourseId,
      dayOfWeek: parseInt(this.formDayOfWeek.toString(), 10),
      subject: this.formSubject,
      time: this.formTime,
      endTime: this.formEndTime,
      room: this.formRoom,
      type: this.formType,
      faculty: this.formFaculty
    };

    if (this.isEditing && this.currentScheduleId) {
      this.api.updateAdminSchedule(this.currentScheduleId, payload).subscribe({
        next: () => {
          this.loadSchedules();
          this.closeScheduleModal();
          this.saving = false;
          this.cdr.detectChanges();
        },
        error: () => { this.saving = false; this.cdr.detectChanges(); }
      });
    } else {
      this.api.createAdminSchedule(payload).subscribe({
        next: () => {
          this.loadSchedules();
          this.closeScheduleModal();
          this.saving = false;
          this.cdr.detectChanges();
        },
        error: () => { this.saving = false; this.cdr.detectChanges(); }
      });
    }
  }

  deleteSchedule(id: string) {
    if (this.saving) return;
    if (confirm('Are you sure you want to delete this schedule item?')) {
      this.saving = true;
      this.api.deleteAdminSchedule(id).subscribe({
        next: () => {
          this.loadSchedules();
          this.saving = false;
          this.cdr.detectChanges();
        },
        error: () => { this.saving = false; this.cdr.detectChanges(); }
      });
    }
  }

  // Calendar Display Logic
  generateCalendarDays() {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    this.calendarDays = days;
  }

  changeMonth(offset: number) {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + offset, 1);
    this.generateCalendarDays();
  }

  get selectedDateDisplay() {
    return this.datePipe.transform(this.selectedDate, 'longDate');
  }

  get selectedWeekday() {
    return this.datePipe.transform(this.selectedDate, 'EEEE');
  }

  get viewMonthDisplay() {
    return this.datePipe.transform(this.viewDate, 'MMMM yyyy');
  }

  // ─── Lecture Management Methods ────────────────────────

  loadLectures() {
    this.api.getAdminLectures().subscribe((data: any[]) => {
      this.lectures = data.map((l: any) => ({
        id: l._id || l.id,
        courseId: l.courseId,
        subject: l.subject,
        date: l.date,
        time: l.time,
        instructor: l.instructor,
        attendance: (l.attendance || []).map((a: any) => ({
          studentId: a.studentId,
          studentName: a.studentName,
          // Backend Lecture model stores `present: boolean`, convert to status string
          status: (a.status ? a.status : (a.present ? 'present' : 'absent')) as 'present' | 'absent'
        }))
      }));
      this.cdr.detectChanges();
    });
  }

  get lectureAvailableSubjects(): string[] {
    const c = this.coursesList.find(c => c.id === this.lectureFormCourseId);
    return c ? c.subjects : [];
  }

  get lectureFilterSubjects(): string[] {
    const c = this.coursesList.find(c => c.id === this.selectedCourseId);
    return c ? c.subjects : [];
  }

  get filteredLectures(): Lecture[] {
    let filtered = this.lectures.filter(l => l.courseId === this.selectedCourseId);

    if (this.lectureViewMode === 'today') {
      filtered = filtered.filter(l => l.date === this.todayStr);

      // Merge timetable schedule items for today as virtual lectures
      const todayDay = new Date().getDay();
      const todaySchedule = this.schedules.filter(
        s => s.courseId === this.selectedCourseId && s.dayOfWeek === todayDay
      );
      for (const s of todaySchedule) {
        const alreadyExists = filtered.some(
          l => l.subject === s.subject && l.date === this.todayStr
        );
        if (!alreadyExists) {
          filtered = [
            ...filtered,
            {
              id: 'sched-' + s.id,
              courseId: s.courseId,
              subject: s.subject,
              date: this.todayStr,
              time: s.time,
              instructor: s.faculty,
              attendance: []
            }
          ];
        }
      }
    } else if (this.lectureViewMode === 'subject' && this.selectedSubject) {
      filtered = filtered.filter(l => l.subject === this.selectedSubject);

      // Also include timetable schedule items for the selected subject (all dates)
      const subjectSchedule = this.schedules.filter(
        s => s.courseId === this.selectedCourseId && s.subject === this.selectedSubject
      );
      for (const s of subjectSchedule) {
        const alreadyExists = filtered.some(l => l.subject === s.subject);
        if (!alreadyExists) {
          filtered = [
            ...filtered,
            {
              id: 'sched-' + s.id,
              courseId: s.courseId,
              subject: s.subject,
              date: this.todayStr,
              time: s.time,
              instructor: s.faculty,
              attendance: []
            }
          ];
        }
      }
    }

    if (this.lectureSearchQuery) {
      const q = this.lectureSearchQuery.toLowerCase();
      filtered = filtered.filter(l => l.subject.toLowerCase().includes(q) || l.instructor.toLowerCase().includes(q));
    }

    return filtered;
  }

  setLectureViewMode(mode: 'today' | 'subject') {
    this.lectureViewMode = mode;
    this.selectedSubject = null;
  }

  selectSubject(sub: string) {
    this.selectedSubject = sub;
  }

  openAddLectureModal() {
    this.isLectureEditing = false;
    this.currentLectureId = null;
    this.lectureFormCourseId = this.selectedCourseId;
    this.lectureFormSubject = this.lectureAvailableSubjects.length > 0 ? this.lectureAvailableSubjects[0] : '';
    this.lectureFormDate = this.todayStr;
    this.lectureFormTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    this.lectureFormInstructor = '';
    this.isLectureModalOpen = true;
  }

  openEditLectureModal(lecture: Lecture, event?: Event) {
    if (event) event.stopPropagation();
    this.isLectureEditing = true;
    this.currentLectureId = lecture.id;
    this.lectureFormCourseId = lecture.courseId;
    this.lectureFormSubject = lecture.subject;
    this.lectureFormDate = lecture.date;
    this.lectureFormTime = lecture.time;
    this.lectureFormInstructor = lecture.instructor;
    this.isLectureModalOpen = true;
  }

  closeLectureModal() {
    this.isLectureModalOpen = false;
  }

  saveLecture() {
    if (this.saving) return;
    this.saving = true;
    const payload: any = {
      courseId: this.lectureFormCourseId,
      subject: this.lectureFormSubject,
      date: this.lectureFormDate,
      time: this.lectureFormTime,
      instructor: this.lectureFormInstructor
    };

    if (this.isLectureEditing && this.currentLectureId) {
      this.api.updateAdminLecture(this.currentLectureId, payload).subscribe({
        next: () => {
          this.loadLectures();
          this.closeLectureModal();
          this.saving = false;
          this.cdr.detectChanges();
        },
        error: () => { this.saving = false; this.cdr.detectChanges(); }
      });
    } else {
      this.api.createAdminLecture(payload).subscribe({
        next: () => {
          this.loadLectures();
          this.closeLectureModal();
          this.saving = false;
          this.cdr.detectChanges();
        },
        error: () => { this.saving = false; this.cdr.detectChanges(); }
      });
    }
  }

  deleteLecture(id: string, event?: Event) {
    if (event) event.stopPropagation();
    if (this.saving) return;
    if (confirm('Are you sure you want to delete this lecture?')) {
      this.saving = true;
      this.api.deleteAdminLecture(id).subscribe({
        next: () => {
          this.loadLectures();
          this.saving = false;
          this.cdr.detectChanges();
        },
        error: () => { this.saving = false; this.cdr.detectChanges(); }
      });
    }
  }

  openAttendanceModal(lecture: Lecture) {
    // Clone lecture so edits are isolated
    this.editingLecture = { ...lecture, attendance: lecture.attendance.map(a => ({ ...a })) };
    this.isAttendanceModalOpen = true;
    this.loadingAttendanceStudents = true;

    const req = this.api.getStudentsByCourse(lecture.courseId);
    req.subscribe({
      next: (students: any[]) => {
        if (!this.editingLecture) return;
        this.editingLecture.attendance = students.map((s: any) => {
          const sid = (s._id || s.id)?.toString() || '';
          const existing = lecture.attendance.find(a => a.studentId === sid);
          return {
            studentId: sid,
            studentName: s.name || s.studentName || '',
            status: existing ? existing.status : 'absent' as 'absent'
          };
        });
        this.loadingAttendanceStudents = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loadingAttendanceStudents = false; this.cdr.detectChanges(); }
    });
  }

  closeAttendanceModal() {
    this.isAttendanceModalOpen = false;
    this.editingLecture = null;
    this.savingAttendance = false;
  }

  saveAttendance() {
    if (!this.editingLecture || this.savingAttendance) return;

    // Convert status string → present boolean expected by backend PUT /:id/attendance
    const attendancePayload = this.editingLecture.attendance.map(a => ({
      studentId: a.studentId,
      studentName: a.studentName,
      present: a.status === 'present'
    }));

    if (this.editingLecture.id.startsWith('sched-')) {
      // Create a real lecture record first (backend auto-creates absent Attendance docs)
      // then call /attendance to set the actual statuses
      this.savingAttendance = true;
      const payload: any = {
        courseId: this.editingLecture.courseId,
        subject: this.editingLecture.subject,
        date: this.editingLecture.date,
        time: this.editingLecture.time,
        instructor: this.editingLecture.instructor
      };
      this.api.createAdminLecture(payload).subscribe({
        next: (created: any) => {
          const newId = created._id || created.id;
          this.api.updateLectureAttendance(newId, attendancePayload).subscribe({
            next: () => {
              this.loadLectures();
              this.closeAttendanceModal();
              this.savingAttendance = false;
              this.cdr.detectChanges();
            },
            error: () => { this.savingAttendance = false; this.cdr.detectChanges(); }
          });
        },
        error: () => { this.savingAttendance = false; this.cdr.detectChanges(); }
      });
      return;
    }

    this.savingAttendance = true;
    // Use dedicated /attendance endpoint — this syncs to the Attendance collection
    // so students can see their present/absent status
    this.api.updateLectureAttendance(this.editingLecture.id, attendancePayload).subscribe({
      next: () => {
        const idx = this.lectures.findIndex(l => l.id === this.editingLecture!.id);
        if (idx > -1) this.lectures[idx].attendance = [...this.editingLecture!.attendance];
        this.savingAttendance = false;
        this.closeAttendanceModal();
        this.cdr.detectChanges();
      },
      error: () => { this.savingAttendance = false; this.cdr.detectChanges(); }
    });
  }

  toggleStudentAttendance(student: StudentAttendance) {
    student.status = student.status === 'present' ? 'absent' : 'present';
    this.cdr.detectChanges();
  }

  markAllPresent() {
    if (!this.editingLecture) return;
    this.editingLecture.attendance.forEach(a => a.status = 'present');
    this.cdr.detectChanges();
  }

  markAllAbsent() {
    if (!this.editingLecture) return;
    this.editingLecture.attendance.forEach(a => a.status = 'absent');
    this.cdr.detectChanges();
  }

  addNewStudentToLecture() {
    if (this.editingLecture) {
      this.editingLecture.attendance.unshift({
        studentId: '',
        studentName: '',
        status: 'absent'
      });
    }
  }

  removeStudentFromLecture(index: number) {
    if (this.editingLecture) {
      this.editingLecture.attendance.splice(index, 1);
    }
  }

  getLectureAttendanceStats(lecture: Lecture) {
    const total = lecture.attendance.length;
    const present = lecture.attendance.filter(a => a.status === 'present').length;
    const absent = total - present;
    return { total, present, absent };
  }

  openSubjectPublishModal(subject: string, event?: Event) {
    if (event) event.stopPropagation();
    const syntheticLecture: Lecture = {
      id: 'subject-' + subject,
      courseId: this.selectedCourseId,
      subject: subject,
      date: this.todayStr,
      time: 'Ongoing',
      instructor: 'Various',
      attendance: []
    };
    this.openPublishModal(syntheticLecture, event);
  }

  openPublishModal(lecture: Lecture, event?: Event) {
    if (event) event.stopPropagation();
    this.currentQrLecture = lecture;
    this.isQrModalOpen = true;
    this.qrStatus = 'generating';
    this.qrErrorMessage = '';
    this.qrScanUrl = '';
    this.cdr.detectChanges();

    const handleSuccess = (lat: number, lng: number) => {
      const startSessionForLecture = (lectureId: string, lectureSubject: string) => {
        this.api.publishAttendance(lectureId, { lat, lng }).subscribe({
          next: (res: any) => {
            this.qrScanUrl = '';
            this.qrStatus = 'ready';
            this.dataService.startQrSession({
              lectureId,
              subject: lectureSubject,
              location: { lat, lng }
            });
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.qrStatus = 'error';
            this.qrErrorMessage = err?.error?.message || 'Unable to publish attendance.';
            this.cdr.detectChanges();
          }
        });
      };

      const isVirtualLectureId = !lecture.id || lecture.id.startsWith('sched-') || lecture.id.startsWith('subject-');

      if (isVirtualLectureId) {
        const payload: any = {
          courseId: lecture.courseId,
          subject: lecture.subject,
          date: lecture.date || this.todayStr,
          time: lecture.time || 'Ongoing',
          instructor: lecture.instructor || 'Various'
        };

        this.api.createAdminLecture(payload).subscribe({
          next: (created: any) => {
            const newId = created?._id || created?.id;
            if (!newId) {
              this.qrStatus = 'error';
              this.qrErrorMessage = 'Lecture created but attendance could not be published.';
              this.cdr.detectChanges();
              return;
            }
            const normalizedLecture: Lecture = {
              id: newId,
              courseId: payload.courseId,
              subject: payload.subject,
              date: payload.date,
              time: payload.time,
              instructor: payload.instructor,
              attendance: lecture.attendance || []
            };
            this.currentQrLecture = normalizedLecture;
            this.lectures = [normalizedLecture, ...this.lectures.filter(l => l.id !== newId)];
            startSessionForLecture(newId, payload.subject);
          },
          error: (err) => {
            this.qrStatus = 'error';
            this.qrErrorMessage = err?.error?.message || 'Unable to create lecture for published attendance.';
            this.cdr.detectChanges();
          }
        });
        return;
      }

      startSessionForLecture(lecture.id, lecture.subject);
    };

    let resolved = false;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!resolved) {
            resolved = true;
            setTimeout(() => handleSuccess(position.coords.latitude, position.coords.longitude), 500);
          }
        },
        (error) => {
          if (!resolved) {
            resolved = true;
            console.warn('Geolocation failed, using campus fallback.', error);
            setTimeout(() => handleSuccess(CAMPUS_FALLBACK_LOCATION.lat, CAMPUS_FALLBACK_LOCATION.lng), 500);
            this.cdr.detectChanges();
          }
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.warn('Geolocation hung, using campus fallback.');
          handleSuccess(CAMPUS_FALLBACK_LOCATION.lat, CAMPUS_FALLBACK_LOCATION.lng);
          this.cdr.detectChanges();
        }
      }, 13000);
    } else {
      setTimeout(() => {
        resolved = true;
        handleSuccess(CAMPUS_FALLBACK_LOCATION.lat, CAMPUS_FALLBACK_LOCATION.lng);
      }, 500);
      this.cdr.detectChanges();
    }
  }

  closeQrModal() {
    const lectureId = this.currentQrLecture?.id;
    this.isQrModalOpen = false;
    this.currentQrLecture = null;
    this.qrScanUrl = '';
    this.dataService.stopQrSession();
    if (lectureId && !lectureId.startsWith('subject-') && !lectureId.startsWith('sched-')) {
      this.api.stopPublishedAttendance(lectureId).subscribe({ error: () => { } });
    }
    this.cdr.detectChanges();
  }
}
