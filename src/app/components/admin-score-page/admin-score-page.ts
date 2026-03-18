import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, Trash2, Calendar, FileText, CheckCircle, XCircle, Search, Award, Clock, Eye, Edit2 } from 'lucide-angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { DataService, Course } from '../../services/data.service';
import { ApiService } from '../../services/api.service';
import { ExamRecord, ExamResult } from '../../types';

@Component({
  selector: 'app-admin-score-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin-score-page.html',
  styleUrls: ['./admin-score-page.css'],
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
export class AdminScorePage implements OnInit {
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  readonly Plus = Plus;
  readonly Trash2 = Trash2;
  readonly Calendar = Calendar;
  readonly FileText = FileText;
  readonly CheckCircle = CheckCircle;
  readonly XCircle = XCircle;
  readonly Search = Search;
  readonly Award = Award;
  readonly Clock = Clock;
  readonly Eye = Eye;
  readonly Edit2 = Edit2;

  constructor(private dataService: DataService) { }

  get coursesList(): Course[] {
    return this.dataService.courses();
  }

  searchQuery: string = '';
  selectedCourseId: string = '';

  tests: ExamRecord[] = [];

  isScoringModalOpen = false;
  scoringTest: ExamRecord | null = null;
  scoringStudents: any[] = [];
  loadingStudents = false;
  saving = false;

  ngOnInit() {
    if (this.coursesList.length > 0) {
      this.selectedCourseId = this.coursesList[0].id;
    }
    this.loadExams();
  }

  loadExams() {
    this.api.getAdminExams().subscribe((data: any[]) => {
      this.tests = data.map((e: any) => ({
        id: e._id || e.id,
        courseId: e.courseId,
        subject: e.subject,
        title: e.title,
        date: e.date,
        duration: e.duration,
        type: e.type,
        status: e.status,
        resultsPublished: e.resultsPublished,
        studentResults: (e.studentResults || []).map((r: any) => ({
          studentId: r.studentId,
          studentName: r.studentName,
          score: r.score
        }))
      }));
      this.cdr.detectChanges();
    });
  }

  get filteredTests(): ExamRecord[] {
    let filtered = this.tests.filter(t => t.courseId === this.selectedCourseId && t.status === 'completed');

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(t => t.title.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q));
    }
    return filtered;
  }

  deleteTest(id: string, event?: Event) {
    if (event) event.stopPropagation();
    if (this.saving) return;
    if (confirm('Are you sure you want to delete this test permanently?')) {
      this.saving = true;
      this.api.deleteAdminExam(id).subscribe({
        next: () => {
          this.loadExams();
          this.saving = false;
          this.cdr.detectChanges();
        },
        error: () => { this.saving = false; this.cdr.detectChanges(); }
      });
    }
  }

  isTestModalOpen = false;
  isEditingTest = false;
  currentTestId: string | null = null;
  formTestCourseId = 'C01';
  formTestSubject = '';
  formTestTitle = '';
  formTestDate = new Date().toISOString().split('T')[0];
  formTestDuration = '60 mins';
  formTestType = 'Quiz';

  get availableSubjects(): string[] {
    const c = this.coursesList.find(c => c.id === this.formTestCourseId);
    return c ? c.subjects : [];
  }

  openAddTestModal() {
    this.isEditingTest = false;
    this.currentTestId = null;
    this.formTestCourseId = this.selectedCourseId;
    this.formTestSubject = this.availableSubjects.length > 0 ? this.availableSubjects[0] : '';
    this.formTestTitle = '';
    this.formTestDate = new Date().toISOString().split('T')[0];
    this.formTestDuration = '60 mins';
    this.formTestType = 'Quiz';
    this.isTestModalOpen = true;
  }

  openEditTestModal(test: ExamRecord, event?: Event) {
    if (event) event.stopPropagation();
    this.isEditingTest = true;
    this.currentTestId = test.id;
    this.formTestCourseId = test.courseId;
    this.formTestSubject = test.subject;
    this.formTestTitle = test.title;
    this.formTestDate = test.date;
    this.formTestDuration = test.duration;
    this.formTestType = test.type;
    this.isTestModalOpen = true;
  }

  closeTestModal() {
    this.isTestModalOpen = false;
  }

  saveTest() {
    if (this.saving) return;
    this.saving = true;
    const payload: any = {
      courseId: this.formTestCourseId,
      subject: this.formTestSubject,
      title: this.formTestTitle,
      date: this.formTestDate,
      duration: this.formTestDuration,
      type: this.formTestType,
      status: 'completed'
    };

    if (this.isEditingTest && this.currentTestId) {
      this.api.updateAdminExam(this.currentTestId, payload).subscribe({
        next: () => {
          this.loadExams();
          this.closeTestModal();
          this.saving = false;
          this.cdr.detectChanges();
        },
        error: () => { this.saving = false; this.cdr.detectChanges(); }
      });
    } else {
      this.api.createAdminExam(payload).subscribe({
        next: () => {
          this.loadExams();
          this.closeTestModal();
          this.saving = false;
          this.cdr.detectChanges();
        },
        error: () => { this.saving = false; this.cdr.detectChanges(); }
      });
    }
  }

  openScoringModal(test: ExamRecord) {
    this.scoringTest = { ...test };
    this.scoringStudents = [];
    this.loadingStudents = true;
    this.isScoringModalOpen = true;

    this.api.getStudentsByCourse(test.courseId).subscribe({
      next: (students: any[]) => {
        this.scoringStudents = students.map((s: any) => {
          const sid = (s._id || s.id)?.toString() || '';
          const existing = test.studentResults.find(
            (r: ExamResult) => r.studentId?.toString() === sid
          );
          return {
            studentId: sid,
            studentName: s.name,
            score: existing ? existing.score : null
          };
        });
        this.loadingStudents = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loadingStudents = false; this.cdr.detectChanges(); }
    });
  }

  closeScoringModal() {
    this.isScoringModalOpen = false;
    this.scoringTest = null;
    this.scoringStudents = [];
  }

  publishScores() {
    if (this.saving || !this.scoringTest) return;
    this.saving = true;
    const id = this.scoringTest.id;
    const studentResults = this.scoringStudents.map(s => ({
      studentId: s.studentId,
      studentName: s.studentName,
      score: s.score !== null && s.score !== undefined ? Number(s.score) : null
    }));
    this.api.updateExamScores(id, studentResults).subscribe({
      next: () => {
        this.loadExams();
        this.closeScoringModal();
        this.saving = false;
        this.cdr.detectChanges();
      },
      error: () => { this.saving = false; this.cdr.detectChanges(); }
    });
  }

  unpublishScores() {
    if (this.scoringTest) {
      this.scoringTest.resultsPublished = false;
    }
  }
}
