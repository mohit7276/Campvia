import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Calendar, Clock, MapPin, User, ChevronRight, Bell, AlertCircle, CheckCircle2, BookOpen, GraduationCap, TrendingUp, Trophy } from 'lucide-angular';
import { UserTodo, ScheduleItem } from '../../types';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-dashboard-home',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './dashboard-home.component.html',
    styleUrls: ['./dashboard-home.component.css']
})
export class DashboardHomeComponent implements OnInit, OnDestroy {
    private api = inject(ApiService);
    private cdr = inject(ChangeDetectorRef);
    constructor(public authService: AuthService) { }
    @Input() userTodos: UserTodo[] = [];
    @Output() changeSection = new EventEmitter<string>();

    // Icons
    readonly Calendar = Calendar;
    readonly Clock = Clock;
    readonly MapPin = MapPin;
    readonly User = User;
    readonly ChevronRight = ChevronRight;
    readonly Bell = Bell;
    readonly AlertCircle = AlertCircle;
    readonly CheckCircle2 = CheckCircle2;
    readonly BookOpen = BookOpen;
    readonly GraduationCap = GraduationCap;
    readonly TrendingUp = TrendingUp;
    readonly Trophy = Trophy;

    combinedSchedule: any[] = [];
    upcomingTests: any[] = [];
    attendanceData: any[] = [];
    noticesData: any[] = [];
    todayScheduledItems: any[] = [];
    todayAttendanceRecords: any[] = [];
    private refreshTimerId: ReturnType<typeof setInterval> | null = null;
    private timetableSubscription?: Subscription;
    private readonly handleWindowFocus = () => this.refreshDashboard();

    // Fees card
    totalPending: number = 0;
    overdueAmount: number = 0;
    hasOverdue: boolean = false;
    earliestDueDate: string = '';
    hasAnyFees: boolean = false;

    // Assignment card (student view)
    submittedCount: number = 0;
    pendingCount: number = 0;
    // Assignment card (faculty view)
    publishedCount: number = 0;
    closedCount: number = 0;

    // Academic analysis card
    gpa: number = 0;
    avgScore: number = 0;
    classRank: number = 0;
    hasScores: boolean = false;

    ngOnInit() {
        this.refreshDashboard();
        this.timetableSubscription = this.api.timetableChanged$.subscribe(() => this.refreshDashboard());
        this.refreshTimerId = window.setInterval(() => this.refreshDashboard(), 30000);
        window.addEventListener('focus', this.handleWindowFocus);
    }

    ngOnChanges() {
        this.calculateData();
    }

    ngOnDestroy() {
        this.timetableSubscription?.unsubscribe();
        window.removeEventListener('focus', this.handleWindowFocus);
        if (this.refreshTimerId !== null) {
            clearInterval(this.refreshTimerId);
        }
    }

    private refreshDashboard() {
        this.loadCardData();
        this.calculateData();
        this.loadTodayAttendanceCard();
    }

    loadCardData() {
        const user = this.authService.currentUser();
        if (!user) return;

        if (user.role === 'faculty') {
            // Published = dueDate >= today (still open); Closed = dueDate < today (past due)
            this.api.getFacultyAssignments().subscribe({
                next: (assignments: any[]) => {
                    if (!assignments) { assignments = []; }
                    const todayStr = new Date().toISOString().split('T')[0];
                    this.publishedCount = assignments.filter((a: any) => a.dueDate >= todayStr).length;
                    this.closedCount = assignments.filter((a: any) => a.dueDate < todayStr).length;
                    this.cdr.detectChanges();
                },
                error: () => { this.publishedCount = 0; this.closedCount = 0; this.cdr.detectChanges(); }
            });
            return;
        }

        if (user.role !== 'student') return;

        // Upcoming tests/exams card data (course-wise)
        this.api.getUpcomingTests().subscribe({
            next: (tests: any[]) => {
                this.upcomingTests = (tests || []).slice(0, 4).map((test: any) => ({
                    name: test.subject,
                    date: (test.date || '').toUpperCase(),
                    desc: test.description || test.title || '',
                    urgent: !!test.urgent
                }));
                this.cdr.detectChanges();
            },
            error: () => {
                this.upcomingTests = [];
                this.cdr.detectChanges();
            }
        });

        // Fees
        this.api.getFees().subscribe({
            next: (fees: any[]) => {
                if (!fees || fees.length === 0) {
                    this.hasAnyFees = false;
                    this.totalPending = 0;
                    this.overdueAmount = 0;
                    this.hasOverdue = false;
                    this.earliestDueDate = '';
                } else {
                    this.hasAnyFees = true;
                    const pending = fees.filter((f: any) => f.status !== 'paid');
                    const overdue = fees.filter((f: any) => f.status === 'overdue');
                    this.totalPending = pending.reduce((sum: number, f: any) => sum + (f.amount || 0), 0);
                    this.overdueAmount = overdue.reduce((sum: number, f: any) => sum + (f.amount || 0), 0);
                    this.hasOverdue = overdue.length > 0;
                    const sorted = pending.sort((a: any, b: any) =>
                        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
                    this.earliestDueDate = sorted.length > 0 ? sorted[0].dueDate : '';
                }
                this.cdr.detectChanges();
            },
            error: () => { this.hasAnyFees = false; this.cdr.detectChanges(); }
        });

        // Assignments
        this.api.getAssignments().subscribe({
            next: (assignments: any[]) => {
                if (!assignments) { assignments = []; }
                // Use myStatus (per-student) if available, else fall back to assignment status
                this.submittedCount = assignments.filter((a: any) => (a.myStatus || a.status) === 'submitted').length;
                this.pendingCount = assignments.filter((a: any) => (a.myStatus || a.status) !== 'submitted').length;
                this.cdr.detectChanges();
            },
            error: () => { this.submittedCount = 0; this.pendingCount = 0; this.cdr.detectChanges(); }
        });

        // GPA + score stats from the full user profile
        this.api.getMe().subscribe({
            next: (res: any) => {
                const u = res.user || res;
                this.gpa = u.gpa || 0;
                this.cdr.detectChanges();
            },
            error: () => {}
        });

        // Dynamic rank based on avgScore in same course
        this.api.getMyRank().subscribe({
            next: (res: any) => {
                this.classRank = res.rank || 0;
                this.cdr.detectChanges();
            },
            error: () => {}
        });

        // Average score from published exams
        this.api.getScores().subscribe({
            next: (exams: any[]) => {
                if (!exams || exams.length === 0) {
                    this.hasScores = false;
                    this.avgScore = 0;
                } else {
                    this.hasScores = true;
                    const token = sessionStorage.getItem('auth_token');
                    // Decode userId from token to find own scores
                    let userId = '';
                    try {
                        userId = JSON.parse(atob(token!.split('.')[1])).userId;
                    } catch { }
                    const scores: number[] = [];
                    for (const exam of exams) {
                        const result = (exam.studentResults || []).find(
                            (r: any) => r.studentId === userId || r.studentId?.toString() === userId
                        );
                        if (result && result.score != null) scores.push(result.score);
                    }
                    this.avgScore = scores.length > 0
                        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                        : 0;
                    this.hasScores = scores.length > 0;
                }
                this.cdr.detectChanges();
            },
            error: () => { this.hasScores = false; this.cdr.detectChanges(); }
        });
    }

    calculateData() {
        const todayStr = new Date().toISOString().split('T')[0];
        const user = this.authService.currentUser();
        const summary$ = user?.role === 'faculty'
            ? this.api.getFacultyDashboardSummary()
            : this.api.getDashboardSummary();

        summary$.subscribe((data: any) => {
            // Roadmap is built from timetable endpoints in loadTodayAttendanceCard().

            // Keep summary as fallback source for tests; student primary source is /tests/upcoming.
            if (this.upcomingTests.length === 0) {
                this.upcomingTests = (data.tests || data.upcomingTests || []).slice(0, 4).map((test: any) => ({
                    name: test.subject,
                    date: (test.date || '').toUpperCase(),
                    desc: test.description || test.title || '',
                    urgent: !!test.urgent
                }));
            }

            // Notices
            this.noticesData = (data.notices || []).map((n: any) => ({
                tag: n.category.charAt(0).toUpperCase() + n.category.slice(1),
                date: n.date,
                iconType: n.category === 'academic' ? 'clipboard' : n.category === 'event' ? 'target' : 'settings',
                title: n.title,
                color: n.category === 'academic' ? 'bg-blue-50 border-blue-200' : n.category === 'event' ? 'bg-purple-50 border-purple-200' : 'bg-amber-50 border-amber-200'
            }));
            this.cdr.detectChanges();
        });
    }

    loadTodayAttendanceCard() {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayDay = new Date().getDay();
        const role = this.authService.currentUser()?.role;

        if (role === 'faculty' || role === 'admin') {
            this.api.getAdminTimetable(undefined, todayDay).subscribe({
                next: (items: any[]) => {
                    this.todayScheduledItems = items || [];
                    this.buildRoadmapCardData();
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.todayScheduledItems = [];
                    this.buildRoadmapCardData();
                    this.cdr.detectChanges();
                }
            });
            return;
        }

        // Load attendance records and today's timetable in parallel
        this.api.getAttendance().subscribe({
            next: (records: any[]) => {
                this.todayAttendanceRecords = (records || []).filter((r: any) => r.date === todayStr);
                this.buildAttendanceCardData(todayStr, todayDay);
                this.cdr.detectChanges();
            },
            error: () => { this.buildAttendanceCardData(todayStr, todayDay); }
        });

        this.api.getTimetable(todayDay, todayStr).subscribe({
            next: (items: any[]) => {
                this.todayScheduledItems = items || [];
                this.buildRoadmapCardData();
                this.buildAttendanceCardData(todayStr, todayDay);
                this.cdr.detectChanges();
            },
            error: () => {
                this.todayScheduledItems = [];
                this.buildRoadmapCardData();
                this.buildAttendanceCardData(todayStr, todayDay);
            }
        });
    }

    private toMinutes(timeValue: string | undefined | null): number {
        if (!timeValue) return Number.MAX_SAFE_INTEGER;
        const value = timeValue.trim();
        if (!value) return Number.MAX_SAFE_INTEGER;

        const [timePart, modifierRaw] = value.split(' ');
        const [hRaw, mRaw] = timePart.split(':').map(Number);
        if (Number.isNaN(hRaw) || Number.isNaN(mRaw)) return Number.MAX_SAFE_INTEGER;

        const modifier = (modifierRaw || '').toUpperCase();
        let hours = hRaw;
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        return hours * 60 + mRaw;
    }

    private buildRoadmapCardData() {
        const role = this.authService.currentUser()?.role;

        const mapped = (this.todayScheduledItems || []).map((item: any) => ({
            time: item.time || '--:--',
            name: item.subject || 'Class',
            room: item.room || item.faculty || 'Class',
            duration: item.duration || (item.endTime ? `${item.time} - ${item.endTime}` : 'Session'),
            active: false,
            isTodo: false
        }));

        if (role === 'faculty' || role === 'admin') {
            // Timetable API already returns current day items for faculty/admin.
            this.combinedSchedule = mapped;
            return;
        }

        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();

        let activeIndex = -1;
        for (let i = 0; i < mapped.length; i++) {
            const start = this.toMinutes(mapped[i].time);
            const nextStart = i < mapped.length - 1 ? this.toMinutes(mapped[i + 1].time) : Number.MAX_SAFE_INTEGER;

            if (start <= nowMinutes && nowMinutes < nextStart) {
                activeIndex = i;
                break;
            }
            if (activeIndex === -1 && nowMinutes < start) {
                activeIndex = i;
                break;
            }
        }

        this.combinedSchedule = mapped.map((item, idx) => ({ ...item, active: idx === activeIndex }));
    }

    buildAttendanceCardData(todayStr: string, _todayDay: number) {
        const merged: any[] = [];

        // Add each scheduled class with its attendance status
        for (const item of this.todayScheduledItems) {
            const rec = this.todayAttendanceRecords.find((r: any) => r.subject === item.subject);
            merged.push({
                subject: item.subject,
                period: `${item.time} · ${item.faculty || 'Faculty'}`,
                status: rec ? (rec.status.charAt(0).toUpperCase() + rec.status.slice(1)) : 'Unmarked',
                time: item.time || '--:--',
                color: rec?.status === 'present' ? 'bg-emerald-100 text-emerald-700'
                     : rec?.status === 'absent'  ? 'bg-red-100 text-red-700'
                     : 'bg-slate-100 text-slate-500',
                date: todayStr
            });
        }

        // Add any QR-checked subjects not already covered by schedule
        for (const rec of this.todayAttendanceRecords) {
            if (!merged.some(m => m.subject === rec.subject)) {
                merged.push({
                    subject: rec.subject,
                    period: rec.timestamp ? `${rec.timestamp} Session` : 'Scheduled Session',
                    status: rec.status.charAt(0).toUpperCase() + rec.status.slice(1),
                    time: rec.timestamp || '--:--',
                    color: rec.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700',
                    date: todayStr
                });
            }
        }

        this.attendanceData = merged;
        this.cdr.detectChanges();
    }

    navigateTo(section: string) {
        this.changeSection.emit(section);
    }

    get todayDateDisplay() {
        return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
    }

    get todayFullDateDisplay() {
        return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', weekday: 'long' });
    }
}
