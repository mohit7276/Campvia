import { Component, Input, OnInit, OnChanges, AfterViewInit, inject, ChangeDetectorRef, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Clock, MapPin, User, ChevronLeft, ChevronRight, Calendar, RotateCcw, X, GraduationCap, Users, Bookmark, CheckCircle, XCircle, PieChart, BookOpen, AlertCircle, Camera, Navigation, ShieldCheck, History, TrendingUp, Crosshair, ArrowRight } from 'lucide-angular';
import { ScheduleItem, UserTodo, AttendanceRecord } from '../../types';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { ApiService } from '../../services/api.service';
import { DataService } from '../../services/data.service';

// Permanent Campus Location
const CAMPUS_LOCATION = { lat: 23.0258, lng: 72.5873 };

interface CombinedScheduleItem {
    id?: string;
    time: string;
    subject: string;
    room: string;
    duration: string;
    type: 'lecture' | 'lab' | 'seminar' | 'workshop' | 'todo';
    faculty: string;
    isTodo: boolean;
    completed?: boolean;
    attendanceStatus?: 'present' | 'absent' | 'unmarked';
}

@Component({
    selector: 'app-timetable-page',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './timetable-page.component.html',
    styleUrls: ['./timetable-page.component.css'],
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
                style({ opacity: 0 }),
                animate('300ms ease-out', style({ opacity: 1 }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ opacity: 0 }))
            ])
        ]),
        trigger('dateAnimation', [
            transition(':enter', [
                style({ opacity: 0, scale: 0.9 }),
                animate('300ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ opacity: 1, scale: 1 }))
            ])
        ]),
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('300ms ease-out', style({ opacity: 1 }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ opacity: 0 }))
            ])
        ])
    ]
})
export class TimetablePageComponent implements OnInit, OnChanges, AfterViewInit {
    @Input() userTodos: UserTodo[] = [];
    @Input() initialScanId: string | null = null;

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
    readonly CheckCircle = CheckCircle;
    readonly XCircle = XCircle;
    readonly PieChart = PieChart;
    readonly BookOpen = BookOpen;
    readonly AlertCircle = AlertCircle;
    readonly Camera = Camera;
    readonly Navigation = Navigation;
    readonly ShieldCheck = ShieldCheck;
    readonly History = History;
    readonly TrendingUp = TrendingUp;
    readonly Crosshair = Crosshair;
    readonly ArrowRight = ArrowRight;

    private api = inject(ApiService);
    private cdr = inject(ChangeDetectorRef);

    constructor(private dataService: DataService) { }

    // Timetable State
    selectedDate: Date = new Date();
    isCalendarOpen = false;
    viewDate: Date = new Date();
    calendarDays: (Date | null)[] = [];
    dateWindow: Date[] = [];
    currentSchedule: CombinedScheduleItem[] = [];
    private timetableCache: Record<string, ScheduleItem[]> = {};
    @ViewChildren('dateItem') dateItems!: QueryList<ElementRef<HTMLDivElement>>;

    // View Mode: 'schedule' shows timetable, 'attendance' shows attendance overview
    mainViewMode: 'schedule' | 'attendance' = 'schedule';

    // Attendance State
    attendanceRecords: AttendanceRecord[] = [];
    attendanceViewMode: 'today' | 'subject' = 'today';
    selectedSubject: string | null = null;
    stats = { rate: 0, present: 0, absent: 0, streak: 0 };
    subjectSummaries: any[] = [];
    todayStr = new Date().toISOString().split('T')[0];

    // Today's scheduled lectures (from timetable DB)
    todayScheduleItems: CombinedScheduleItem[] = [];

    // Scanner State
    isScannerOpen = false;
    scanStatus: 'idle' | 'finding' | 'ready' | 'success' | 'error' | 'location-denied' = 'idle';
    errorMessage = '';
    userLocation: { lat: number, lng: number, accuracy?: number } | null = null;
    pendingScanLecture: { lectureId: string; subject: string; date: string; time: string; instructor: string } | null = null;

    ngOnInit() {
        this.updateDateWindow();
        this.updateSchedule();
        this.generateCalendarDays();
        this.loadAttendance();
        this.loadTodaySchedule();

    }

    ngOnChanges() {
        this.updateSchedule();
    }

    ngAfterViewInit() {
        this.dateItems.changes.subscribe(() => this.centerSelectedDateCard(false));
        this.centerSelectedDateCard(false);
    }

    updateDateWindow(centerOnMobile = false) {
        const arr = [];
        for (let i = -3; i <= 3; i++) {
            const d = new Date(this.selectedDate);
            d.setDate(this.selectedDate.getDate() + i);
            arr.push(d);
        }
        this.dateWindow = arr;

        if (centerOnMobile) {
            this.centerSelectedDateCard(true);
        }
    }

    private centerSelectedDateCard(smooth: boolean) {
        if (typeof window === 'undefined' || window.innerWidth > 768 || !this.dateItems?.length) {
            return;
        }

        setTimeout(() => {
            const items = this.dateItems.toArray();
            const selectedIndex = this.dateWindow.findIndex(d => this.isSelected(d));
            if (selectedIndex < 0 || !items[selectedIndex]) {
                return;
            }

            items[selectedIndex].nativeElement.scrollIntoView({
                behavior: smooth ? 'smooth' : 'auto',
                block: 'nearest',
                inline: 'center'
            });
        }, 0);
    }

    updateSchedule() {
        const day = this.selectedDate.getDay();
        const dateStr = this.selectedDate.toISOString().split('T')[0];

        const buildSchedule = (rawClasses: ScheduleItem[]) => {
            const classes: CombinedScheduleItem[] = rawClasses.map(c => {
                // Find attendance record for this class on this date
                const attendanceRecord = this.attendanceRecords.find(
                    r => r.subject === c.subject && r.date === dateStr
                );
                return {
                    ...c,
                    isTodo: false,
                    type: (c.type as any) || 'lecture',
                    attendanceStatus: attendanceRecord ? attendanceRecord.status as 'present' | 'absent' : 'unmarked' as const
                };
            });

            const todos: CombinedScheduleItem[] = this.userTodos
                .filter(t => t.date === dateStr)
                .map(t => ({
                    id: t.id,
                    time: t.time,
                    subject: t.title,
                    room: t.subject || 'Personal',
                    duration: t.description || 'Task',
                    type: 'todo' as const,
                    faculty: 'You',
                    isTodo: true,
                    completed: t.completed
                }));

            this.currentSchedule = [...classes, ...todos].sort((a, b) => {
                const timeToMinutes = (t: string) => {
                    let [time, modifier] = t.split(' ');
                    let [hours, minutes] = time.split(':').map(Number);
                    if (modifier === 'PM' && hours < 12) hours += 12;
                    if (modifier === 'AM' && hours === 12) hours = 0;
                    return hours * 60 + minutes;
                };
                return timeToMinutes(a.time) - timeToMinutes(b.time);
            });
        };

        if (this.timetableCache[dateStr]) {
            buildSchedule(this.timetableCache[dateStr]);
        } else {
            this.api.getTimetable(day, dateStr).subscribe(data => {
                this.timetableCache[dateStr] = data || [];
                buildSchedule(this.timetableCache[dateStr]);
                this.cdr.detectChanges();
            });
        }
    }

    // ─── Attendance Methods ─────────────────────────────────

    loadTodaySchedule() {
        const todayDay = new Date().getDay();
        this.api.getTimetable(todayDay, this.todayStr).subscribe(data => {
            const items: ScheduleItem[] = data || [];
            this.todayScheduleItems = items.map(c => {
                const rec = this.attendanceRecords.find(
                    r => r.subject === c.subject && r.date === this.todayStr
                );
                return {
                    ...c,
                    isTodo: false,
                    type: (c.type as any) || 'lecture',
                    attendanceStatus: rec ? rec.status as 'present' | 'absent' : 'unmarked' as const
                };
            });
            this.cdr.detectChanges();
        });
    }

    loadAttendance() {
        this.api.getAttendance().subscribe(data => {
            this.attendanceRecords = data;
            this.calculateStats();
            this.calculateSubjectSummaries();
            // Refresh today's schedule with updated attendance status
            this.loadTodaySchedule();
            // Refresh schedule to show attendance status
            this.timetableCache = {};
            this.updateSchedule();
            this.cdr.detectChanges();
        });
    }

    calculateStats() {
        const presentCount = this.attendanceRecords.filter(r => r.status === 'present').length;
        const presentDates = Array.from(new Set(
            this.attendanceRecords.filter(r => r.status === 'present').map(r => r.date)
        )).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        let streakCount = 0;
        if (presentDates.length > 0) {
            streakCount = 1;
            for (let i = 0; i < presentDates.length - 1; i++) {
                const current = new Date(presentDates[i]);
                const next = new Date(presentDates[i + 1]);
                const diffTime = Math.abs(current.getTime() - next.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays === 1) streakCount++;
                else break;
            }
        }

        this.stats = {
            rate: Math.round((presentCount / this.attendanceRecords.length) * 100) || 0,
            present: presentCount,
            absent: this.attendanceRecords.length - presentCount,
            streak: streakCount
        };
    }

    calculateSubjectSummaries() {
        const subjects: Record<string, { present: number; total: number }> = {};
        this.attendanceRecords.forEach(r => {
            if (!subjects[r.subject]) subjects[r.subject] = { present: 0, total: 0 };
            subjects[r.subject].total++;
            if (r.status === 'present') subjects[r.subject].present++;
        });

        this.subjectSummaries = Object.entries(subjects).map(([name, stats]) => ({
            name,
            ...stats,
            rate: Math.round((stats.present / stats.total) * 100) || 0
        }));
    }

    setMainViewMode(mode: 'schedule' | 'attendance') {
        this.mainViewMode = mode;
        this.selectedSubject = null;
    }

    setAttendanceViewMode(mode: 'today' | 'subject') {
        this.attendanceViewMode = mode;
        this.selectedSubject = null;
    }

    handleStartScan() {
        this.isScannerOpen = true;
        this.errorMessage = '';
        this.pendingScanLecture = null;

        this.scanStatus = 'finding';

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                    setTimeout(() => this.simulateScan(), 1000);
                    this.cdr.detectChanges();
                },
                (error) => {
                    this.scanStatus = 'location-denied';
                    let errorMsg = `GPS Error: ${error.message}`;
                    if (error.code === 1) { // PERMISSION_DENIED
                        errorMsg = "Browser blocked location. Please allow Location permissions in your browser settings.";
                    }
                    this.errorMessage = errorMsg;
                    this.cdr.detectChanges();
                },
                { enableHighAccuracy: false, timeout: 15000, maximumAge: 0 }
            );
        } else {
            this.scanStatus = 'error';
            this.errorMessage = "Geolocation is not supported by your browser.";
            this.cdr.detectChanges();
        }
    }

    simulateScan() {
        if (!this.userLocation) return;

        this.api.previewAttendanceScan().subscribe({
            next: (preview) => {
                this.pendingScanLecture = {
                    lectureId: preview?.lectureId || '',
                    subject: preview?.subject || 'Lecture',
                    date: preview?.date || this.todayStr,
                    time: preview?.time || '--:--',
                    instructor: preview?.instructor || ''
                };
                this.scanStatus = 'ready';
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.scanStatus = 'error';
                this.errorMessage = err?.error?.message || 'Unable to find an active published lecture right now.';
                this.cdr.detectChanges();
            }
        });
    }

    confirmMarkPresent() {
        if (!this.userLocation || !this.pendingScanLecture) {
            this.scanStatus = 'error';
            this.errorMessage = 'Please find and verify lecture details before marking present.';
            this.cdr.detectChanges();
            return;
        }

        const activeSession = this.dataService.activeQrSession();
        const lectureId = this.pendingScanLecture.lectureId || '';

        this.api.markAttendance(lectureId, this.userLocation).subscribe({
            next: (attendance) => {
                this.scanStatus = 'success';
                const newRecord: AttendanceRecord = {
                    id: attendance?._id || Math.random().toString(36).slice(2, 11),
                    date: attendance?.date || this.todayStr,
                    subject: attendance?.subject || activeSession?.subject || 'Lecture',
                    status: attendance?.status || 'present',
                    timestamp: attendance?.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                };

                setTimeout(() => {
                    this.attendanceRecords = [newRecord, ...this.attendanceRecords.filter(r => !(r.date === newRecord.date && r.subject === newRecord.subject))];
                    this.calculateStats();
                    this.calculateSubjectSummaries();
                    this.isScannerOpen = false;
                    this.scanStatus = 'idle';
                    // Refresh schedule to reflect new attendance
                    this.timetableCache = {};
                    this.updateSchedule();
                    this.cdr.detectChanges();
                }, 1200);
            },
            error: (err) => {
                this.scanStatus = 'error';
                this.errorMessage = err?.error?.message || 'Unable to mark attendance right now.';
                this.cdr.detectChanges();
            }
        });
    }

    calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    get todayDateDisplay() {
        return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
    }

    get todaysRecords() {
        return this.attendanceRecords.filter(r => r.date === this.todayStr);
    }

    get todayTimelineItems(): Array<{ subject: string; time: string; faculty: string; type: string; room: string; attendanceStatus: 'present' | 'absent' | 'unmarked' }> {
        // Start with scheduled items from timetable
        const items: Array<{ subject: string; time: string; faculty: string; type: string; room: string; attendanceStatus: 'present' | 'absent' | 'unmarked' }> = this.todayScheduleItems
            .filter(s => !s.isTodo)
            .map(s => ({
                subject: s.subject,
                time: s.time,
                faculty: s.faculty,
                type: s.type,
                room: s.room,
                attendanceStatus: (() => {
                    const rec = this.attendanceRecords.find(r => r.subject === s.subject && r.date === this.todayStr);
                    return rec ? rec.status as 'present' | 'absent' : 'unmarked' as const;
                })()
            }));

        // Also include any QR-checked subjects not already in schedule
        for (const rec of this.todaysRecords) {
            if (!items.some(i => i.subject === rec.subject)) {
                items.push({
                    subject: rec.subject,
                    time: rec.timestamp || '',
                    faculty: '',
                    type: 'lecture',
                    room: '',
                    attendanceStatus: rec.status as 'present' | 'absent'
                });
            }
        }

        return items.sort((a, b) => {
            const timeToMin = (t: string) => {
                if (!t) return 9999;
                const parts = t.split(' ');
                if (parts.length < 2) return 9999;
                const [time, mod] = parts;
                let [h, m] = time.split(':').map(Number);
                if (mod === 'PM' && h < 12) h += 12;
                if (mod === 'AM' && h === 12) h = 0;
                return h * 60 + m;
            };
            return timeToMin(a.time) - timeToMin(b.time);
        });
    }

    get selectedSubjectRecords() {
        if (!this.selectedSubject) return [];
        return this.attendanceRecords
            .filter(r => r.subject === this.selectedSubject)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    getSelectedSubjectRate() {
        return this.subjectSummaries.find(s => s.name === this.selectedSubject)?.rate || 0;
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
        this.timetableCache = {};
        this.updateDateWindow(true);
        this.updateSchedule();
        this.generateCalendarDays();
        this.loadAttendance();
    }

    shiftDate(days: number) {
        const newDate = new Date(this.selectedDate);
        newDate.setDate(this.selectedDate.getDate() + days);
        this.selectedDate = newDate;
        this.viewDate = newDate;
        this.updateDateWindow(true);
        this.updateSchedule();
    }

    handleDateSelect(date: Date) {
        this.selectedDate = date;
        this.isCalendarOpen = false;
        this.updateDateWindow(true);
        this.updateSchedule();
    }

    // Calendar Logic
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
        return this.selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    get selectedWeekday() {
        return this.selectedDate.toLocaleDateString('en-GB', { weekday: 'long' });
    }

    get viewMonthDisplay() {
        return this.viewDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    }
}
