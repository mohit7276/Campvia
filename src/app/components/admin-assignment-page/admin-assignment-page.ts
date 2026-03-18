import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, Edit2, Trash2, Folder, FileText, CheckCircle, XCircle, Search, Eye, Filter, ExternalLink, Clock, RotateCcw } from 'lucide-angular';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { DataService, Course } from '../../services/data.service';
import { ApiService } from '../../services/api.service';

export interface StudentSubmission {
  studentId: string;
  studentName: string;
  status: 'submitted' | 'pending';
  links?: { url: string; label: string }[];
  fileName?: string;
  submittedAt?: string;
}

export interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  description: string;
  submissions: StudentSubmission[];
}

export interface SubjectMap {
  name: string;
  assignments: Assignment[];
}

export interface CourseData {
  id: string;
  name: string;
  subjects: SubjectMap[];
}

@Component({
  selector: 'app-admin-assignment-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin-assignment-page.html',
  styleUrls: ['./admin-assignment-page.css'],
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(10px)' }))
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
export class AdminAssignmentPage implements OnInit {
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  // Icons
  readonly Plus = Plus;
  readonly Edit2 = Edit2;
  readonly Trash2 = Trash2;
  readonly Folder = Folder;
  readonly FileText = FileText;
  readonly CheckCircle = CheckCircle;
  readonly XCircle = XCircle;
  readonly Search = Search;
  readonly Eye = Eye;
  readonly Filter = Filter;
  readonly ExternalLink = ExternalLink;
  readonly RotateCcw = RotateCcw;
  readonly Clock = Clock;
  constructor(private dataService: DataService) { }

  _courses: CourseData[] = [];

  get courses(): CourseData[] {
    return this._courses;
  }

  selectedCourseId: string = '';
  searchQuery: string = '';

  // Modal State
  isAssignmentModalOpen = false;
  isViewSubmissionsModalOpen = false;

  // Assignment Form State
  isEditing = false;
  currentAssignmentId: string | null = null;
  formCourseId: string = '';
  formSubjectName: string = '';
  formTitle: string = '';
  formDueDate: string = '';
  formDescription: string = '';

  // Viewing Submissions
  viewingAssignment: Assignment | null = null;
  viewSubmissionsCourseId: string = '';
  viewSubmissionsSubjectName: string = '';
  saving = false;
  rejectingStudentId: string | null = null;
  adminStudents: any[] = [];

  ngOnInit() {
    this.loadAssignments();
  }

  loadAssignments() {
    // Load students + assignments, then build full roster (submitted + pending)
    const dsCourses = this.dataService.courses();
    this.api.getAdminStudents().subscribe((students: any[]) => {
      this.adminStudents = students || [];

      this.api.getAdminAssignments().subscribe((assignments: any[]) => {
        this._courses = dsCourses.map((dsCourse: Course) => {
          return {
            id: dsCourse.id,
            name: dsCourse.name,
            subjects: dsCourse.subjects.map(subName => {
              const subAssignments = assignments
                .filter((a: any) => a.courseId === dsCourse.id && a.subject === subName)
                .map((a: any) => ({
                  id: a._id || a.id,
                  title: a.title,
                  dueDate: a.dueDate,
                  description: a.description,
                  submissions: this.buildRosterForCourse(a.courseId, a.submissions || [])
                }));
              return { name: subName, assignments: subAssignments };
            })
          };
        });
        if (this._courses.length > 0 && !this._courses.find(c => c.id === this.selectedCourseId)) {
          this.selectedCourseId = this._courses[0].id;
        }
        this.cdr.detectChanges();
      });
    });
  }

  private normalizeSubmission(s: any): StudentSubmission {
    return {
      studentId: s.studentId?.toString?.() || s.studentId,
      studentName: s.studentName || '',
      status: s.status || 'pending',
      links: s.links || [],
      fileName: s.fileName || '',
      submittedAt: s.submittedAt
    };
  }

  private buildRosterForCourse(courseId: string, rawSubmissions: any[]): StudentSubmission[] {
    const normalized = (rawSubmissions || []).map(s => this.normalizeSubmission(s));
    const byId = new Map<string, StudentSubmission>();
    for (const s of normalized) byId.set(String(s.studentId), s);

    const enrolled = (this.adminStudents || []).filter((st: any) => (st.courseId || '') === (courseId || ''));
    const roster: StudentSubmission[] = enrolled.map((st: any) => {
      const sid = String(st._id || st.id || '');
      const existing = byId.get(sid);
      if (existing) return { ...existing, studentName: existing.studentName || st.name };
      return {
        studentId: sid,
        studentName: st.name || 'Student',
        status: 'pending',
        links: [],
        fileName: '',
        submittedAt: undefined
      };
    });

    // Keep any extra submission records that may belong to removed/old students
    for (const s of normalized) {
      if (!roster.some(r => String(r.studentId) === String(s.studentId))) roster.push(s);
    }

    return roster;
  }

  get selectedCourse(): CourseData | undefined {
    return this.courses.find(c => c.id === this.selectedCourseId);
  }

  get filteredSubjects(): SubjectMap[] {
    const course = this.selectedCourse;
    if (!course) return [];

    if (!this.searchQuery) return course.subjects;

    const query = this.searchQuery.toLowerCase();
    // Filter subjects or assignments inside subjects
    return course.subjects.map(subject => {
      const matchesSubject = subject.name.toLowerCase().includes(query);
      const matchingAssignments = subject.assignments.filter(a =>
        a.title.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query)
      );

      if (matchesSubject || matchingAssignments.length > 0) {
        return {
          ...subject,
          assignments: matchesSubject ? subject.assignments : matchingAssignments
        };
      }
      return null;
    }).filter(s => s !== null) as SubjectMap[];
  }

  // Modal actions
  openAddAssignmentModal(courseId: string, subjectName: string) {
    this.isEditing = false;
    this.currentAssignmentId = null;
    this.formCourseId = courseId;
    this.formSubjectName = subjectName;
    this.formTitle = '';
    this.formDueDate = '';
    this.formDescription = '';
    this.isAssignmentModalOpen = true;
  }

  openEditAssignmentModal(courseId: string, subjectName: string, assignment: Assignment) {
    this.isEditing = true;
    this.currentAssignmentId = assignment.id;
    this.formCourseId = courseId;
    this.formSubjectName = subjectName;
    this.formTitle = assignment.title;
    this.formDueDate = assignment.dueDate;
    this.formDescription = assignment.description;
    this.isAssignmentModalOpen = true;
  }

  closeAssignmentModal() {
    this.isAssignmentModalOpen = false;
  }

  saveAssignment() {
    if (this.saving) return;
    this.saving = true;
    const payload: any = {
      courseId: this.formCourseId,
      subject: this.formSubjectName,
      title: this.formTitle,
      dueDate: this.formDueDate,
      description: this.formDescription
    };

    if (this.isEditing && this.currentAssignmentId) {
      this.api.updateAdminAssignment(this.currentAssignmentId, payload).subscribe({
        next: () => {
          this.loadAssignments();
          this.closeAssignmentModal();
          this.saving = false;
          this.cdr.detectChanges();
        },
        error: () => { this.saving = false; this.cdr.detectChanges(); }
      });
    } else {
      this.api.createAdminAssignment(payload).subscribe({
        next: () => {
          this.loadAssignments();
          this.closeAssignmentModal();
          this.saving = false;
          this.cdr.detectChanges();
        },
        error: () => { this.saving = false; this.cdr.detectChanges(); }
      });
    }
  }

  deleteAssignment(courseId: string, subjectName: string, assignmentId: string) {
    if (this.saving) return;
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    this.saving = true;
    this.api.deleteAdminAssignment(assignmentId).subscribe({
      next: () => {
        this.loadAssignments();
        this.saving = false;
        this.cdr.detectChanges();
      },
      error: () => { this.saving = false; this.cdr.detectChanges(); }
    });
  }

  openSubmissionsModal(courseId: string, subjectName: string, assignment: Assignment) {
    this.viewSubmissionsCourseId = courseId;
    this.viewSubmissionsSubjectName = subjectName;
    this.viewingAssignment = {
      ...assignment,
      submissions: this.buildRosterForCourse(courseId, assignment.submissions || [])
    };
    this.isViewSubmissionsModalOpen = true;

    // Refresh with backend roster (submitted + pending) for this assignment.
    this.api.getAssignmentSubmissions(assignment.id).subscribe({
      next: (subs: any[]) => {
        if (!this.viewingAssignment || this.viewingAssignment.id !== assignment.id) return;
        this.viewingAssignment.submissions = this.buildRosterForCourse(courseId, subs || []);
        this.cdr.detectChanges();
      }
    });
  }

  closeSubmissionsModal() {
    this.isViewSubmissionsModalOpen = false;
    this.viewingAssignment = null;
  }

  toggleSubmissionStatus(studentId: string) {
    if (!this.viewingAssignment) return;
    const sub = this.viewingAssignment.submissions.find(s => s.studentId === studentId);
    if (!sub) return;
    const newStatus: 'submitted' | 'pending' = sub.status === 'submitted' ? 'pending' : 'submitted';
    this.api.updateSubmissionStatus(this.viewingAssignment.id, studentId, newStatus).subscribe(() => {
      sub.status = newStatus;
      this.cdr.detectChanges();
    });
  }

  rejectSubmission(studentId: string) {
    if (!this.viewingAssignment) return;
    this.rejectingStudentId = studentId;
    this.api.rejectSubmissionAsAdmin(this.viewingAssignment.id, studentId).subscribe({
      next: () => {
        const sub = this.viewingAssignment!.submissions.find(s => s.studentId === studentId);
        if (sub) sub.status = 'pending';
        this.rejectingStudentId = null;
        this.cdr.detectChanges();
      },
      error: () => { this.rejectingStudentId = null; }
    });
  }

  openLink(url?: string) {
    if (!url) return;
    window.open(url, '_blank', 'noopener');
  }

  getSubmissionStats(assignment: Assignment) {
    const total = assignment.submissions.length;
    const submitted = assignment.submissions.filter(s => s.status === 'submitted').length;
    const pending = total - submitted;
    const percentage = total === 0 ? 0 : Math.round((submitted / total) * 100);
    return { total, submitted, pending, percentage };
  }

  getSubmittedSubmissions(assignment: Assignment): StudentSubmission[] {
    return (assignment.submissions || []).filter(s => s.status === 'submitted');
  }

  getMockStudentsForCourse(courseId: string) {
    // Fetch from API - but since this is used in synchronous context, we return empty and load async
    let students: any[] = [];
    this.api.getAdminStudents().subscribe((data: any[]) => {
      students = data.map(s => ({ id: s._id || s.id, name: s.name }));
    });
    return students;
  }
}
