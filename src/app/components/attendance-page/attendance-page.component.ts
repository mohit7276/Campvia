import { Component, OnInit, Input, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, UserCheck, MapPin, Calendar, TrendingUp, AlertCircle, CheckCircle, XCircle, Crosshair, Clock, X, Lock, PieChart, BookOpen, ChevronLeft, History, ShieldCheck, Camera, Navigation, ArrowRight } from 'lucide-angular';
import { AttendanceRecord } from '../../types';
import { ApiService } from '../../services/api.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { DataService } from '../../services/data.service';

// Permanent Campus Location (Currently set to User's location in Ahmedabad)
const CAMPUS_LOCATION = { lat: 23.0258, lng: 72.5873 };


@Component({
    selector: 'app-attendance-page',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './attendance-page.component.html',
    styleUrls: ['./attendance-page.component.css'],
    animations: [
        trigger('fadeInUp', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(10px)' }),
                animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
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
export class AttendancePageComponent implements OnInit {
    // Icons
    readonly UserCheck = UserCheck;
    readonly MapPin = MapPin;
    readonly Calendar = Calendar;
    readonly TrendingUp = TrendingUp;
    readonly AlertCircle = AlertCircle;
    readonly CheckCircle = CheckCircle;
    readonly XCircle = XCircle;
    readonly Crosshair = Crosshair;
    readonly Clock = Clock;
    readonly X = X;
    readonly Lock = Lock;
    readonly PieChart = PieChart;
    readonly BookOpen = BookOpen;
    readonly ChevronLeft = ChevronLeft;
    readonly History = History;
    readonly ShieldCheck = ShieldCheck;
    readonly Camera = Camera;
    readonly Navigation = Navigation;
    readonly ArrowRight = ArrowRight;

    private api = inject(ApiService);
    private cdr = inject(ChangeDetectorRef);

    constructor(private dataService: DataService) { }

    @Input() initialScanId: string | null = null;

    viewMode: 'today' | 'subject' = 'today';
    records: AttendanceRecord[] = [];
    selectedSubject: string | null = null;

    // Scanner State
    isScannerOpen = false;
    scanStatus: 'idle' | 'finding' | 'ready' | 'success' | 'error' | 'location-denied' = 'idle';
    errorMessage = '';
    userLocation: { lat: number, lng: number, accuracy?: number } | null = null;
    pendingScanLecture: { lectureId: string; subject: string; date: string; time: string; instructor: string } | null = null;

    // Computed Stats
    stats = {
        rate: 0,
        present: 0,
        absent: 0,
        streak: 0
    };

    subjectSummaries: any[] = [];
    todayStr = new Date().toISOString().split('T')[0];

    ngOnInit() {
        this.api.getAttendance().subscribe(data => {
            this.records = data;
            this.calculateStats();
            this.calculateSubjectSummaries();
            this.cdr.detectChanges();
        });

    }

    calculateStats() {
        const presentCount = this.records.filter(r => r.status === 'present').length;
        const presentDates = Array.from(new Set(
            this.records.filter(r => r.status === 'present').map(r => r.date)
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
            rate: Math.round((presentCount / this.records.length) * 100) || 0,
            present: presentCount,
            absent: this.records.length - presentCount,
            streak: streakCount
        };
    }

    calculateSubjectSummaries() {
        const subjects: Record<string, { present: number; total: number }> = {};
        this.records.forEach(r => {
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

    setViewMode(mode: 'today' | 'subject') {
        this.viewMode = mode;
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
                    // Resolve currently published lecture after live location is verified.
                    setTimeout(() => this.simulateScan(), 1000);
                },
                (error) => {
                    this.scanStatus = 'location-denied';
                    let errorMsg = `GPS Error: ${error.message}`;
                    if (error.code === 1) { // PERMISSION_DENIED
                        errorMsg = "Browser blocked location. Please allow Location permissions in your browser settings.";
                    }
                    this.errorMessage = errorMsg;
                },
                { enableHighAccuracy: false, timeout: 15000, maximumAge: 0 }
            );
        } else {
            this.scanStatus = 'error';
            this.errorMessage = "Geolocation is not supported by your browser.";
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
                    this.records = [newRecord, ...this.records.filter(r => !(r.date === newRecord.date && r.subject === newRecord.subject))];
                    this.calculateStats();
                    this.calculateSubjectSummaries();
                    this.isScannerOpen = false;
                    this.scanStatus = 'idle';
                }, 1200);
            },
            error: (err) => {
                this.scanStatus = 'error';
                this.errorMessage = err?.error?.message || 'Unable to mark attendance right now.';
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
        return this.records.filter(r => r.date === this.todayStr);
    }

    get selectedSubjectRecords() {
        if (!this.selectedSubject) return [];
        return this.records
            .filter(r => r.subject === this.selectedSubject)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    getSelectedSubjectRate() {
        return this.subjectSummaries.find(s => s.name === this.selectedSubject)?.rate || 0;
    }
}
