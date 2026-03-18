import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    LucideAngularModule, Plus, Edit2, Trash2, Calendar, FileText,
    CheckCircle, XCircle, Search, Award, Clock, Users, BarChart2,
    Send, Lock, Unlock, BookOpen, ChevronDown, TrendingUp
} from 'lucide-angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { DataService, Course } from '../../services/data.service';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

export interface StudentResult {
    studentId: string;
    studentName: string;
    score: number | null;
}

export interface AdminExam {
    id: string;
    title: string;
    courseId: string;
    subject: string;
    date: string;
    duration: string;
    type: string;
    status: 'upcoming' | 'completed';
    resultsPublished: boolean;
    studentResults: StudentResult[];
}

export interface ScoringStudent {
    studentId: string;
    studentName: string;
    score: number | null;
}

@Component({
    selector: 'app-admin-upcoming-tests-page',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './admin-upcoming-tests-page.html',
    styleUrls: ['./admin-upcoming-tests-page.css'],
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
export class AdminUpcomingTestsPage implements OnInit {
    private api = inject(ApiService);
    private authService = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);

    readonly Plus = Plus;
    readonly Edit2 = Edit2;
    readonly Trash2 = Trash2;
    readonly Calendar = Calendar;
    readonly FileText = FileText;
    readonly CheckCircle = CheckCircle;
    readonly XCircle = XCircle;
    readonly Search = Search;
    readonly Award = Award;
    readonly Clock = Clock;
    readonly Users = Users;
    readonly BarChart2 = BarChart2;
    readonly Send = Send;
    readonly Lock = Lock;
    readonly Unlock = Unlock;
    readonly BookOpen = BookOpen;
    readonly ChevronDown = ChevronDown;
    readonly TrendingUp = TrendingUp;

    constructor(private dataService: DataService) {}

    get isFaculty(): boolean {
        return this.authService.currentUser()?.role === 'faculty';
    }

    get coursesList(): Course[] {
        return this.dataService.courses();
    }

    searchQuery = '';
    selectedCourseId = '';
    activeTab: 'exams' | 'scores' = 'exams';

    exams: AdminExam[] = [];

    isExamModalOpen = false;
    isEditing = false;
    currentExamId: string | null = null;
    formTitle = '';
    formCourseId = '';
    formSubject = '';
    formDate = '';
    formDuration = '';
    formType = 'Quiz';
    formStatus: 'upcoming' | 'completed' = 'upcoming';

    isScoringModalOpen = false;
    scoringExam: AdminExam | null = null;
    scoringStudents: ScoringStudent[] = [];
    loadingStudents = false;
    saving = false;

    ngOnInit() {
        if (this.coursesList.length > 0) {
            this.selectedCourseId = this.coursesList[0].id;
            this.formCourseId = this.coursesList[0].id;
        }
        this.loadExams();
    }

    loadExams() {
        const req = this.isFaculty
            ? this.api.getFacultyExams()
            : this.api.getAdminExams();
        req.subscribe((data: any[]) => {
            this.exams = data.map((e: any) => this.mapExam(e));
            this.cdr.detectChanges();
        });
    }

    mapExam(e: any): AdminExam {
        return {
            id: e._id || e.id,
            title: e.title || e.subject,
            courseId: e.courseId || '',
            subject: e.subject,
            date: e.date,
            duration: e.duration || '',
            type: e.type || 'Quiz',
            status: e.status || 'upcoming',
            resultsPublished: e.resultsPublished || false,
            studentResults: (e.studentResults || []).map((r: any) => ({
                studentId: r.studentId?.toString() || '',
                studentName: r.studentName || '',
                score: r.score ?? null
            }))
        };
    }

    get filteredExams(): AdminExam[] {
        let filtered = this.exams.filter(e => e.courseId === this.selectedCourseId);
        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            filtered = filtered.filter(e =>
                (e.title || '').toLowerCase().includes(q) ||
                e.subject.toLowerCase().includes(q)
            );
        }
        return filtered;
    }

    get upcomingExams(): AdminExam[] {
        return this.filteredExams.filter(e => e.status === 'upcoming' && !e.resultsPublished);
    }

    get completedExams(): AdminExam[] {
        return this.filteredExams.filter(e => e.status === 'completed' || e.resultsPublished);
    }

    get availableSubjects(): string[] {
        const c = this.coursesList.find(c => c.id === this.formCourseId);
        return c ? c.subjects : [];
    }

    openAddExamModal() {
        this.isEditing = false;
        this.currentExamId = null;
        this.formTitle = '';
        this.formCourseId = this.selectedCourseId;
        this.formSubject = this.availableSubjects.length > 0 ? this.availableSubjects[0] : '';
        this.formDate = '';
        this.formDuration = '60 mins';
        this.formType = 'Quiz';
        this.formStatus = 'upcoming';
        this.isExamModalOpen = true;
    }

    openEditExamModal(exam: AdminExam) {
        this.isEditing = true;
        this.currentExamId = exam.id;
        this.formTitle = exam.title;
        this.formCourseId = exam.courseId;
        this.formSubject = exam.subject;
        this.formDate = exam.date;
        this.formDuration = exam.duration;
        this.formType = exam.type;
        this.formStatus = exam.status;
        this.isExamModalOpen = true;
    }

    closeExamModal() { this.isExamModalOpen = false; }

    saveExam() {
        if (this.saving) return;
        this.saving = true;
        const payload: any = {
            title: this.formTitle,
            courseId: this.formCourseId,
            subject: this.formSubject,
            date: this.formDate,
            duration: this.formDuration,
            type: this.formType,
            status: this.formStatus
        };

        let req: any;
        if (this.isEditing && this.currentExamId) {
            req = this.isFaculty
                ? this.api.updateFacultyExam(this.currentExamId, payload)
                : this.api.updateAdminExam(this.currentExamId, payload);
        } else {
            req = this.isFaculty
                ? this.api.createFacultyExam(payload)
                : this.api.createAdminExam(payload);
        }

        req.subscribe({
            next: () => {
                this.loadExams();
                this.closeExamModal();
                this.saving = false;
                this.cdr.detectChanges();
            },
            error: () => { this.saving = false; this.cdr.detectChanges(); }
        });
    }

    deleteExam(id: string) {
        if (this.saving) return;
        if (!confirm('Delete this exam/test?')) return;
        this.saving = true;
        const req = this.isFaculty
            ? this.api.deleteFacultyExam(id)
            : this.api.deleteAdminExam(id);
        req.subscribe({
            next: () => { this.loadExams(); this.saving = false; this.cdr.detectChanges(); },
            error: () => { this.saving = false; this.cdr.detectChanges(); }
        });
    }

    openScoringModal(exam: AdminExam) {
        this.scoringExam = { ...exam, studentResults: exam.studentResults.map(r => ({ ...r })) };
        this.isScoringModalOpen = true;
        this.loadingStudents = true;
        this.scoringStudents = [];

        const studentsReq = this.isFaculty
            ? this.api.getFacultyStudentsForCourse(exam.courseId)
            : this.api.getStudentsByCourse(exam.courseId);

        studentsReq.subscribe({
            next: (students: any[]) => {
                this.scoringStudents = students.map((s: any) => {
                    const sid = (s._id || s.id)?.toString() || '';
                    const existing = exam.studentResults.find(r => r.studentId === sid);
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
        this.scoringExam = null;
    }

    saveScores() {
        if (!this.scoringExam || this.saving) return;
        this.saving = true;
        const studentResults = this.scoringStudents.map(s => ({
            studentId: s.studentId,
            studentName: s.studentName,
            score: s.score !== null && s.score !== undefined ? Number(s.score) : null
        }));

        const req = this.isFaculty
            ? this.api.updateFacultyExamScores(this.scoringExam.id, studentResults)
            : this.api.updateExamScores(this.scoringExam.id, studentResults);

        req.subscribe({
            next: () => {
                const idx = this.exams.findIndex(e => e.id === this.scoringExam!.id);
                if (idx > -1) {
                    this.exams[idx] = { ...this.exams[idx], studentResults: studentResults.map(r => ({ ...r })) };
                    this.scoringExam = { ...this.exams[idx] };
                }
                this.saving = false;
                this.cdr.detectChanges();
            },
            error: () => { this.saving = false; this.cdr.detectChanges(); }
        });
    }

    togglePublish(exam: AdminExam) {
        const newPublish = !exam.resultsPublished;
        const req = this.isFaculty
            ? this.api.publishFacultyExamResults(exam.id, newPublish)
            : this.api.publishExamResults(exam.id, newPublish);
        req.subscribe({
            next: () => {
                exam.resultsPublished = newPublish;
                const idx = this.exams.findIndex(e => e.id === exam.id);
                if (idx > -1) this.exams[idx].resultsPublished = newPublish;
                if (this.scoringExam && this.scoringExam.id === exam.id) {
                    this.scoringExam.resultsPublished = newPublish;
                }
                this.cdr.detectChanges();
            }
        });
    }

    getGradedCount(exam: AdminExam): number {
        return exam.studentResults.filter(r => r.score !== null && r.score !== undefined).length;
    }

    getAvgScore(exam: AdminExam): string {
        const graded = exam.studentResults.filter(r => r.score !== null && r.score !== undefined);
        if (!graded.length) return '-';
        const avg = graded.reduce((sum, r) => sum + (r.score as number), 0) / graded.length;
        return avg.toFixed(1);
    }

    get gradedScoringCount(): number {
        return this.scoringStudents.filter(s => s.score !== null && s.score !== undefined).length;
    }

    trackById(_i: number, item: AdminExam): string { return item.id; }
}
