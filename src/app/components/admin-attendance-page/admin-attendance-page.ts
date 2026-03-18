import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, Calendar, Edit2, Trash2, CheckCircle, XCircle, Users, BookOpen, Clock, X, Search, ChevronLeft, QrCode } from 'lucide-angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { DataService, Course } from '../../services/data.service';
import { ApiService } from '../../services/api.service';

const CAMPUS_FALLBACK_LOCATION = { lat: 23.0258, lng: 72.5873 };

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
  selector: 'app-admin-attendance-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin-attendance-page.html',
  styleUrls: ['./admin-attendance-page.css'],
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
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
    ])
  ]
})
export class AdminAttendancePage implements OnInit {
  private api = inject(ApiService);
  readonly Plus = Plus;
  readonly Calendar = Calendar;
  readonly Edit2 = Edit2;
  readonly Trash2 = Trash2;
  readonly CheckCircle = CheckCircle;
  readonly XCircle = XCircle;
  readonly Users = Users;
  readonly BookOpen = BookOpen;
  readonly Clock = Clock;
  readonly X = X;
  readonly Search = Search;
  readonly ChevronLeft = ChevronLeft;
  readonly QrCode = QrCode;

  constructor(private dataService: DataService, private cdr: ChangeDetectorRef) { }

  get coursesList(): Course[] {
    return this.dataService.courses();
  }

  viewMode: 'today' | 'subject' = 'today';
  selectedCourseId: string = 'C01';
  searchQuery: string = '';

  todayStr = new Date().toISOString().split('T')[0];
  selectedSubject: string | null = null;

  lectures: Lecture[] = [];

  // Modals
  isLectureModalOpen = false;
  isAttendanceModalOpen = false;
  loadingAttendance = false;
  isQrModalOpen = false;
  currentQrLecture: Lecture | null = null;
  qrStatus: 'idle' | 'generating' | 'ready' | 'error' = 'idle';
  qrErrorMessage = '';
  qrScanUrl = '';

  get qrImageUrl(): string {
    if (!this.qrScanUrl) return '';
    return `https://quickchart.io/qr?size=240&text=${encodeURIComponent(this.qrScanUrl)}`;
  }

  // Form data
  isEditing = false;
  currentLectureId: string | null = null;
  formCourseId = 'C01';
  formSubject = '';
  formDate = this.todayStr;
  formTime = '10:00 AM';
  formInstructor = '';

  editingLecture: Lecture | null = null;
  saving = false;

  ngOnInit() {
    if (this.coursesList.length > 0) {
      this.selectedCourseId = this.coursesList[0].id;
    }
    this.loadLectures();
  }

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
          status: a.status
        }))
      }));
      this.cdr.detectChanges();
    });
  }

  get availableSubjects(): string[] {
    const c = this.coursesList.find(c => c.id === this.formCourseId);
    return c ? c.subjects : [];
  }

  get availableSubjectsForFilter(): string[] {
    const c = this.coursesList.find(c => c.id === this.selectedCourseId);
    return c ? c.subjects : [];
  }

  get filteredLectures(): Lecture[] {
    let filtered = this.lectures.filter(l => l.courseId === this.selectedCourseId);

    if (this.viewMode === 'today') {
      filtered = filtered.filter(l => l.date === this.todayStr);
    } else if (this.viewMode === 'subject' && this.selectedSubject) {
      filtered = filtered.filter(l => l.subject === this.selectedSubject);
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(l => l.subject.toLowerCase().includes(q) || l.instructor.toLowerCase().includes(q));
    }

    return filtered;
  }

  setViewMode(mode: 'today' | 'subject') {
    this.viewMode = mode;
    this.selectedSubject = null;
  }

  selectSubject(sub: string) {
    this.selectedSubject = sub;
  }

  openSubjectQrModal(subject: string, event?: Event) {
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
    this.openQrModal(syntheticLecture, event);
  }

  openAddLectureModal() {
    this.isEditing = false;
    this.currentLectureId = null;
    this.formCourseId = this.selectedCourseId;
    this.formSubject = this.availableSubjects.length > 0 ? this.availableSubjects[0] : '';
    this.formDate = this.todayStr;
    this.formTime = '10:00 AM';
    this.formInstructor = '';
    this.isLectureModalOpen = true;
  }

  openEditLectureModal(lecture: Lecture, event?: Event) {
    if (event) event.stopPropagation();
    this.isEditing = true;
    this.currentLectureId = lecture.id;
    this.formCourseId = lecture.courseId;
    this.formSubject = lecture.subject;
    this.formDate = lecture.date;
    this.formTime = lecture.time;
    this.formInstructor = lecture.instructor;
    this.isLectureModalOpen = true;
  }

  closeLectureModal() {
    this.isLectureModalOpen = false;
  }

  saveLecture() {
    if (this.saving) return;
    this.saving = true;
    const payload: any = {
      courseId: this.formCourseId,
      subject: this.formSubject,
      date: this.formDate,
      time: this.formTime,
      instructor: this.formInstructor
    };

    if (this.isEditing && this.currentLectureId) {
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
    // Deep copy so edits don't mutate the original until saved
    this.editingLecture = { ...lecture, attendance: lecture.attendance.map(a => ({ ...a })) };
    this.loadingAttendance = true;
    this.isAttendanceModalOpen = true;

    this.api.getStudentsByCourse(lecture.courseId).subscribe({
      next: (students: any[]) => {
        const courseStudentIds = new Set(students.map((s: any) => (s._id || s.id)?.toString()));
        // Remove attendance records for students no longer in this course
        this.editingLecture!.attendance = this.editingLecture!.attendance.filter(
          a => courseStudentIds.has(a.studentId)
        );
        // Add absent entry for current course students not yet in attendance list
        const existingIds = new Set(this.editingLecture!.attendance.map(a => a.studentId));
        for (const s of students) {
          const sid = (s._id || s.id)?.toString() || '';
          if (!existingIds.has(sid)) {
            this.editingLecture!.attendance.push({ studentId: sid, studentName: s.name, status: 'absent' });
          }
        }
        this.loadingAttendance = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loadingAttendance = false; this.cdr.detectChanges(); }
    });
  }

  closeAttendanceModal() {
    this.isAttendanceModalOpen = false;
    this.editingLecture = null;
  }

  // QR Code Logic
  openQrModal(lecture: Lecture, event?: Event) {
    if (event) event.stopPropagation();
    this.currentQrLecture = lecture;
    this.isQrModalOpen = true;
    this.qrStatus = 'generating';
    this.qrErrorMessage = '';
    this.qrScanUrl = '';
    this.cdr.detectChanges();

    const handleSuccess = (lat: number, lng: number) => {
      if (!lecture.id || lecture.id.startsWith('subject-')) {
        this.qrStatus = 'error';
        this.qrErrorMessage = 'Please create a lecture entry first, then generate QR.';
        this.cdr.detectChanges();
        return;
      }

      this.api.startQrSession(lecture.id, { lat, lng }).subscribe({
        next: (res: any) => {
          const sessionToken = res?.sessionToken || '';
          if (!sessionToken) {
            this.qrStatus = 'error';
            this.qrErrorMessage = 'Secure QR token missing. Please try again.';
            this.cdr.detectChanges();
            return;
          }
          const origin = (typeof window !== 'undefined' && window.location?.origin) ? window.location.origin : '';
          this.qrScanUrl = origin
            ? `${origin}/?scan=${encodeURIComponent(lecture.id)}&qr=${encodeURIComponent(sessionToken)}`
            : `/?scan=${encodeURIComponent(lecture.id)}&qr=${encodeURIComponent(sessionToken)}`;
          this.qrStatus = 'ready';
          this.dataService.startQrSession({
            lectureId: lecture.id,
            subject: lecture.subject,
            location: { lat, lng },
            sessionToken
          });
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.qrStatus = 'error';
          this.qrErrorMessage = err?.error?.message || 'Unable to start QR session.';
          this.cdr.detectChanges();
        }
      });
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
            console.warn('Geolocation failed or blocked, using campus fallback.', error);
            setTimeout(() => handleSuccess(CAMPUS_FALLBACK_LOCATION.lat, CAMPUS_FALLBACK_LOCATION.lng), 500);
            this.cdr.detectChanges();
          }
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );

      // Force fallback if hangs completely without erroring
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
    if (lectureId && !lectureId.startsWith('subject-')) {
      this.api.stopQrSession(lectureId).subscribe({ error: () => { } });
    }
    this.cdr.detectChanges();
  }

  toggleStudentAttendance(student: StudentAttendance) {
    student.status = student.status === 'present' ? 'absent' : 'present';
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

  getMockStudentsForCourse(courseId: string) {
    let students: any[] = [];
    this.api.getAdminStudents().subscribe((data: any[]) => {
      students = data.map(s => ({ id: s._id || s.id, name: s.name }));
    });
    return students;
  }

  getLectureAttendanceStats(lecture: Lecture) {
    const total = lecture.attendance.length;
    const present = lecture.attendance.filter(a => a.status === 'present').length;
    const absent = total - present;
    return { total, present, absent };
  }
}
