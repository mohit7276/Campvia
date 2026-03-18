import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    LucideAngularModule, FileText, Upload, CheckCircle, Clock, Search, X, Lock, Edit2, Trash2,
    AlertCircle, Link, Plus, Eye, ExternalLink, XCircle, RotateCcw, Users
} from 'lucide-angular';
import { Assignment, SubmissionLink, AssignmentSubmission } from '../../types';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-assignment-page',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './assignment-page.component.html',
    styleUrls: ['./assignment-page.component.css'],
    animations: [
        trigger('listAnimation', [
            transition('* => *', [
                query(':enter', [
                    style({ opacity: 0, scale: 0.95 }),
                    stagger(50, [
                        animate('300ms ease-out', style({ opacity: 1, scale: 1 }))
                    ])
                ], { optional: true })
            ])
        ]),
        trigger('modalAnimation', [
            transition(':enter', [
                style({ opacity: 0, transform: 'scale(0.9) translateY(20px)' }),
                animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.9) translateY(20px)' }))
            ])
        ])
    ]
})
export class AssignmentPageComponent implements OnInit {
    private api = inject(ApiService);
    private auth = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);

    // Icons
    readonly FileText = FileText;
    readonly Upload = Upload;
    readonly CheckCircle = CheckCircle;
    readonly Clock = Clock;
    readonly Search = Search;
    readonly X = X;
    readonly Lock = Lock;
    readonly Edit2 = Edit2;
    readonly Trash2 = Trash2;
    readonly AlertCircle = AlertCircle;
    readonly Link = Link;
    readonly Plus = Plus;
    readonly Eye = Eye;
    readonly ExternalLink = ExternalLink;
    readonly XCircle = XCircle;
    readonly RotateCcw = RotateCcw;
    readonly Users = Users;

    assignments: Assignment[] = [];
    filteredAssignments: Assignment[] = [];
    selectedAssignment: Assignment | null = null;
    searchQuery = '';
    isSubmitting = false;

    // Submission form — Google Drive link only
    driveLink = '';
    driveLinkTouched = false;
    submitError = '';

    // Faculty / admin submission viewer
    isFacultySubmissionsOpen = false;
    facultyViewAssignment: Assignment | null = null;
    facultySubmissions: AssignmentSubmission[] = [];
    loadingSubmissions = false;
    rejectingStudentId: string | null = null;

    get isFaculty(): boolean {
        return this.auth.currentUser()?.role === 'faculty';
    }

    ngOnInit() {
        this.loadAssignments();
    }

    loadAssignments() {
        if (this.isFaculty) {
            this.api.getFacultyAssignments().subscribe(data => {
                this.assignments = data.map((a: any) => this.mapAssignment(a));
                this.updateFilteredAssignments();
                this.cdr.detectChanges();
            });
        } else {
            this.api.getAssignments().subscribe(data => {
                this.assignments = data.map((a: any) => this.mapAssignment(a));
                this.updateFilteredAssignments();
                this.cdr.detectChanges();
            });
        }
    }

    mapAssignment(a: any): Assignment {
        // Backend annotates myStatus per-student on GET /assignments.
        // For faculty, use the overall assignment status.
        const myStatus: 'submitted' | 'pending' =
            this.isFaculty
                ? (a.status || 'pending')
                : (a.myStatus === 'submitted' ? 'submitted' : 'pending');

        // Try to find the student's own submission for prefilling the link
        const userId = this.auth.currentUser() as any;
        const myId = userId?._id || userId?.id || userId?.email || '';
        const mySub: any = (a.submissions || []).find((s: any) =>
            myStatus === 'submitted' &&
            s.status === 'submitted' &&
            (!myId || s.studentId?.toString() === myId?.toString())
        );

        return {
            id: a._id || a.id,
            title: a.title,
            subject: a.subject,
            courseId: a.courseId,
            dueDate: a.dueDate,
            description: a.description,
            status: myStatus,
            submittedFile: mySub?.fileName || '',
            myLinks: mySub?.links || [],
            myFileName: mySub?.fileName || '',
            submissions: a.submissions || []
        };
    }

    updateFilteredAssignments() {
        this.filteredAssignments = this.assignments.filter(a =>
            a.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            a.subject.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
    }

    isOverdue(dueDate: string | undefined): boolean {
        if (!dueDate) return false;
        const d = new Date(dueDate);
        d.setHours(23, 59, 59, 999);
        return d < new Date();
    }

    // -- Student submission --------------------------------------------
    openModal(assignment: Assignment) {
        this.selectedAssignment = assignment;
        this.submitError = '';
        this.driveLinkTouched = false;
        // Pre-fill existing Google Drive link if editing
        this.driveLink = (assignment.myLinks && assignment.myLinks.length > 0)
            ? assignment.myLinks[0].url
            : '';
    }

    closeModal() {
        if (!this.isSubmitting) {
            this.selectedAssignment = null;
            this.driveLink = '';
            this.driveLinkTouched = false;
            this.submitError = '';
        }
    }

    handleSubmit() {
        if (!this.selectedAssignment) return;
        this.driveLinkTouched = true;
        const url = this.driveLink.trim();
        if (!url) {
            this.submitError = 'Google Drive link is required.';
            return;
        }
        if (!url.startsWith('http')) {
            this.submitError = 'Please enter a valid URL starting with http:// or https://';
            return;
        }
        this.submitError = '';
        this.isSubmitting = true;
        const assignmentId = this.selectedAssignment.id;
        const links: SubmissionLink[] = [{ url, label: 'Google Drive' }];
        this.api.submitAssignment(assignmentId, '', links).subscribe({
            next: () => {
                // Immediately update the assignment in-memory — no re-mapping needed
                this.assignments = this.assignments.map(a =>
                    a.id === assignmentId
                        ? { ...a, status: 'submitted' as const, myLinks: links, myFileName: '' }
                        : a
                );
                this.isSubmitting = false;
                this.selectedAssignment = null;
                this.driveLink = '';
                this.driveLinkTouched = false;
                this.updateFilteredAssignments();
                this.cdr.detectChanges();
            },
            error: (err: any) => {
                this.submitError = err?.error?.message || 'Submission failed. Please try again.';
                this.isSubmitting = false;
            }
        });
    }

    handleDeleteSubmission(id: string) {
        this.api.deleteSubmission(id).subscribe(() => {
            this.assignments = this.assignments.map(a =>
                a.id === id ? { ...a, status: 'pending' as const, submittedFile: '', myLinks: [], myFileName: '' } : a
            );
            this.updateFilteredAssignments();
            this.cdr.detectChanges();
        });
    }

    // -- Faculty / admin review ----------------------------------------
    openFacultySubmissions(assignment: Assignment) {
        this.facultyViewAssignment = assignment;
        this.isFacultySubmissionsOpen = true;
        this.loadingSubmissions = true;
        this.facultySubmissions = [];
        this.api.getFacultyAssignmentSubmissions(assignment.id).subscribe({
            next: (subs: AssignmentSubmission[]) => {
                this.facultySubmissions = subs;
                this.loadingSubmissions = false;
                this.cdr.detectChanges();
            },
            error: () => { this.loadingSubmissions = false; }
        });
    }

    closeFacultySubmissions() {
        this.isFacultySubmissionsOpen = false;
        this.facultyViewAssignment = null;
        this.facultySubmissions = [];
    }

    rejectSubmission(studentId: string) {
        if (!this.facultyViewAssignment) return;
        this.rejectingStudentId = studentId;
        this.api.rejectSubmissionAsFaculty(this.facultyViewAssignment.id, studentId).subscribe({
            next: () => {
                this.facultySubmissions = this.facultySubmissions.map(s =>
                    s.studentId === studentId ? { ...s, status: 'pending' as const } : s
                );
                this.rejectingStudentId = null;
                this.cdr.detectChanges();
            },
            error: () => { this.rejectingStudentId = null; }
        });
    }

    openLink(url: string) {
        window.open(url, '_blank', 'noopener');
    }

    getSubmissionCount(assignment: Assignment): number {
        return (assignment.submissions || []).filter((s: any) => s.status === 'submitted').length;
    }

    getTotalCount(assignment: Assignment): number {
        return (assignment.submissions || []).length;
    }

    getSubmittedCount(): number {
        return this.facultySubmissions.filter(s => s.status === 'submitted').length;
    }

    getPendingCount(): number {
        return this.facultySubmissions.filter(s => s.status !== 'submitted').length;
    }
}
