import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Trophy, Target, TrendingUp, Users, School, ChevronRight, Calendar, Medal, Activity, X, Search, Filter, ArrowRight, BookOpen, PieChart, Brain, Microscope, Palette, Binary, Shapes, Clock, Eye, FileText, Award } from 'lucide-angular';
import { ExamRecord, ExamResult } from '../../types';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-score-page',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './score-page.component.html',
    styleUrls: ['./score-page.component.css'],
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
export class ScorePageComponent implements OnInit {
    // Icons
    readonly Trophy = Trophy;
    readonly Award = Award;
    readonly Clock = Clock;
    readonly Calendar = Calendar;
    readonly FileText = FileText;
    readonly Search = Search;
    readonly Eye = Eye;
    readonly X = X;

    searchQuery = '';
    selectedCourseId = '';
    userCourseName = '';

    allTests: ExamRecord[] = [];
    isResultModalOpen = false;
    selectedTest: ExamRecord | null = null;

    private api = inject(ApiService);
    private cdr = inject(ChangeDetectorRef);

    constructor(
        private authService: AuthService,
        private dataService: DataService
    ) { }

    ngOnInit() {
        this.api.getScores().subscribe(data => {
            this.allTests = data;
            const currentUser = this.authService.currentUser();
            if (currentUser) {
                const myTest = this.allTests.find((t: ExamRecord) =>
                    t.studentResults.some(r => r.studentId === currentUser.email)
                );

                if (myTest) {
                    this.selectedCourseId = myTest.courseId;
                    const course = this.dataService.courses().find(c => c.id === myTest.courseId);
                    this.userCourseName = course ? course.name : 'Your Course';
                } else {
                    // Use user's courseId or first available course
                    const userCourseId = currentUser.courseId;
                    if (userCourseId) {
                        this.selectedCourseId = userCourseId;
                        const course = this.dataService.courses().find(c => c.id === userCourseId);
                        this.userCourseName = course ? course.name : 'Your Course';
                    } else if (this.dataService.courses().length > 0) {
                        this.selectedCourseId = this.dataService.courses()[0].id;
                        this.userCourseName = this.dataService.courses()[0].name;
                    } else {
                        this.selectedCourseId = '';
                        this.userCourseName = 'No Course';
                    }
                }
            }
            this.cdr.detectChanges();
        });
    }

    get filteredResults(): ExamRecord[] {
        let filtered = this.allTests.filter(t =>
            t.courseId === this.selectedCourseId &&
            t.status === 'completed' &&
            t.resultsPublished
        );

        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
                t.title.toLowerCase().includes(q) ||
                t.subject.toLowerCase().includes(q)
            );
        }
        return filtered;
    }

    openResultModal(test: ExamRecord) {
        this.selectedTest = test;
        this.isResultModalOpen = true;
    }

    closeResultModal() {
        this.isResultModalOpen = false;
        this.selectedTest = null;
    }

    getStudentScore(test: ExamRecord): number | null {
        const currentUserEmail = this.authService.currentUser()?.email;
        const result = test.studentResults.find(r => r.studentId === currentUserEmail);
        return result ? result.score : null;
    }

    getGrade(score: number | null): string {
        if (score === null) return 'N/A';
        if (score >= 90) return 'A+';
        if (score >= 80) return 'A';
        if (score >= 70) return 'B';
        if (score >= 60) return 'C';
        return 'D';
    }
}
