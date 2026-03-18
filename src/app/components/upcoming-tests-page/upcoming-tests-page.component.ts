import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    LucideAngularModule, Calendar, Search, Clock, MapPin, Filter,
    Target, Award, ChevronRight, ShieldCheck, CheckCircle2, Trophy,
    TrendingUp, ChevronDown, BookOpen, FileText, Star, X
} from 'lucide-angular';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

export interface ExamItem {
    id: string;
    title: string;
    subject: string;
    type: string;
    date: string;
    duration: string;
    status: string;
    courseId: string;
}

export interface ExamResult {
    id: string;
    title: string;
    subject: string;
    type: string;
    date: string;
    duration: string;
    myScore: number | null;
    hasMyResult: boolean;
    courseId: string;
}

@Component({
    selector: 'app-upcoming-tests-page',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './upcoming-tests-page.component.html',
    styleUrls: ['./upcoming-tests-page.component.css'],
    animations: [
        trigger('listAnimation', [
            transition('* => *', [
                query(':enter', [
                    style({ opacity: 0, transform: 'translateX(-10px)' }),
                    stagger(50, [
                        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
                    ])
                ], { optional: true })
            ])
        ]),
        trigger('fadeAnimation', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(8px)' }),
                animate('250ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
            ])
        ])
    ]
})
export class UpcomingTestsPageComponent implements OnInit {
    readonly Calendar = Calendar;
    readonly Search = Search;
    readonly Clock = Clock;
    readonly MapPin = MapPin;
    readonly Filter = Filter;
    readonly Target = Target;
    readonly Award = Award;
    readonly ChevronRight = ChevronRight;
    readonly ShieldCheck = ShieldCheck;
    readonly CheckCircle2 = CheckCircle2;
    readonly Trophy = Trophy;
    readonly TrendingUp = TrendingUp;
    readonly ChevronDown = ChevronDown;
    readonly BookOpen = BookOpen;
    readonly FileText = FileText;
    readonly Star = Star;
    readonly X = X;

    private api = inject(ApiService);
    private auth = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);

    activeTab: 'upcoming' | 'results' = 'upcoming';
    searchQuery = '';
    filterType = 'All';

    allUpcoming: ExamItem[] = [];
    allResults: ExamResult[] = [];

    testTypes = ['All', 'Quiz', 'Midterm', 'Final', 'Assessment'];

    ngOnInit() {
        this.loadUpcoming();
        this.loadResults();
    }

    loadUpcoming() {
        this.api.getUpcomingTests().subscribe({
            next: (data: any[]) => {
                this.allUpcoming = data.map((t: any) => ({
                    id: t._id || t.id,
                    title: t.title || t.subject || t.description || '',
                    subject: t.subject,
                    type: t.type || 'Quiz',
                    date: t.date,
                    duration: t.duration || '',
                    status: t.status || 'upcoming',
                    courseId: t.courseId || ''
                }));
                this.cdr.detectChanges();
            }
        });
    }

    loadResults() {
        this.api.getScores().subscribe({
            next: (data: any[]) => {
                this.allResults = data.map((e: any) => ({
                    id: e._id || e.id,
                    title: e.title || e.subject,
                    subject: e.subject,
                    type: e.type || 'Quiz',
                    date: e.date,
                    duration: e.duration || '',
                    myScore: e.myScore ?? null,
                    hasMyResult: e.hasMyResult || false,
                    courseId: e.courseId || ''
                }));
                this.cdr.detectChanges();
            }
        });
    }

    get filteredUpcoming(): ExamItem[] {
        return this.allUpcoming.filter(t => {
            const matchSearch = t.subject.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                t.title.toLowerCase().includes(this.searchQuery.toLowerCase());
            const matchType = this.filterType === 'All' || t.type === this.filterType;
            return matchSearch && matchType;
        });
    }

    get filteredResults(): ExamResult[] {
        return this.allResults.filter(t => {
            if (!t.hasMyResult) return false;
            const matchSearch = t.subject.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                t.title.toLowerCase().includes(this.searchQuery.toLowerCase());
            const matchType = this.filterType === 'All' || t.type === this.filterType;
            return matchSearch && matchType;
        });
    }

    setTab(tab: 'upcoming' | 'results') {
        this.activeTab = tab;
        this.searchQuery = '';
        this.filterType = 'All';
    }

    setFilter(type: string) {
        this.filterType = type;
    }

    getScoreColor(score: number | null): string {
        if (score === null) return 'text-slate-400';
        if (score >= 80) return 'text-emerald-600';
        if (score >= 60) return 'text-amber-600';
        return 'text-rose-600';
    }

    getScoreBg(score: number | null): string {
        if (score === null) return 'bg-slate-100';
        if (score >= 80) return 'bg-emerald-50 border-emerald-200';
        if (score >= 60) return 'bg-amber-50 border-amber-200';
        return 'bg-rose-50 border-rose-200';
    }

    getGrade(score: number | null): string {
        if (score === null) return '-';
        if (score >= 90) return 'A+';
        if (score >= 80) return 'A';
        if (score >= 70) return 'B';
        if (score >= 60) return 'C';
        if (score >= 50) return 'D';
        return 'F';
    }

    get avgScore(): string {
        const withScores = this.allResults.filter(r => r.myScore !== null);
        if (!withScores.length) return '-';
        const avg = withScores.reduce((s, r) => s + (r.myScore as number), 0) / withScores.length;
        return avg.toFixed(1);
    }

    get resultCount(): number {
        return this.allResults.filter(r => r.hasMyResult).length;
    }
}
