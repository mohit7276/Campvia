import { Component, OnInit, Input, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, UserCheck, MapPin, Calendar, TrendingUp, AlertCircle, CheckCircle, XCircle, QrCode, Crosshair, Clock, X, Lock, PieChart, BookOpen, ChevronLeft, History, ShieldCheck, Camera, Navigation, ArrowRight } from 'lucide-angular';
import { AttendanceRecord } from '../../types';
import { ApiService } from '../../services/api.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { DataService, QrSession } from '../../services/data.service';

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
    readonly QrCode = QrCode;
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
    scanStatus: 'idle' | 'scanning' | 'ready' | 'success' | 'error' | 'location-denied' = 'idle';
    errorMessage = '';
    userLocation: { lat: number, lng: number } | null = null;
    pendingScanLecture: { lectureId: string; subject: string; date: string; time: string; instructor: string; qrToken: string } | null = null;
    private readonly pendingScanStorageKey = 'pending_scan_lecture_id';
    private readonly pendingScanTokenStorageKey = 'pending_scan_qr_token';

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

        if (this.initialScanId) {
            this.scanStatus = 'idle';
            const scanFromUrl = typeof window !== 'undefined'
                ? new URLSearchParams(window.location.search).get('scan')
                : null;
            const tokenFromUrl = typeof window !== 'undefined'
                ? new URLSearchParams(window.location.search).get('qr')
                : null;
            if (scanFromUrl && tokenFromUrl) {
                setTimeout(() => this.handleStartScan(), 300);
            }
        }
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

        const lectureId = this.resolveLectureId() || '';
        const qrToken = this.resolveQrToken();

        if (lectureId) {
            sessionStorage.setItem(this.pendingScanStorageKey, lectureId);
        }
        if (qrToken) {
            sessionStorage.setItem(this.pendingScanTokenStorageKey, qrToken);
        } else {
            sessionStorage.removeItem(this.pendingScanTokenStorageKey);
        }

        this.scanStatus = 'scanning';

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
                    // Simulate scan after getting location
                    setTimeout(() => this.simulateScan(), 2000);
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

        const lectureId = this.resolveLectureId() || '';
        const qrToken = this.resolveQrToken();

        if (!lectureId && !qrToken) {
            this.scanStatus = 'error';
            this.errorMessage = 'Scan a valid QR code first to load lecture details.';
            this.cdr.detectChanges();
            return;
        }

        this.api.previewAttendanceScan(lectureId, qrToken || '').subscribe({
            next: (preview) => {
                this.pendingScanLecture = {
                    lectureId: preview?.lectureId || lectureId,
                    subject: preview?.subject || 'Lecture',
                    date: preview?.date || this.todayStr,
                    time: preview?.time || '--:--',
                    instructor: preview?.instructor || '',
                    qrToken: preview?.qrToken || qrToken || ''
                };
                this.scanStatus = 'ready';
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.scanStatus = 'error';
                this.errorMessage = err?.error?.message || 'Unable to verify lecture details from QR.';
                this.cdr.detectChanges();
            }
        });
    }

    confirmMarkPresent() {
        if (!this.userLocation || !this.pendingScanLecture) {
            this.scanStatus = 'error';
            this.errorMessage = 'Please scan and verify lecture details before marking present.';
            this.cdr.detectChanges();
            return;
        }

        const activeSession = this.dataService.activeQrSession();
        const lectureId = this.pendingScanLecture.lectureId || '';
        const qrToken = this.pendingScanLecture.qrToken || '';

        this.api.markAttendance(lectureId, this.userLocation, qrToken || '').subscribe({
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
                    sessionStorage.removeItem(this.pendingScanStorageKey);
                    sessionStorage.removeItem(this.pendingScanTokenStorageKey);
                }, 1200);
            },
            error: (err) => {
                this.scanStatus = 'error';
                this.errorMessage = err?.error?.message || 'Unable to mark attendance right now.';
            }
        });
    }

    private resolveLectureId(): string | null {
        if (typeof window !== 'undefined') {
            const scanFromUrl = new URLSearchParams(window.location.search).get('scan');
            if (scanFromUrl) {
                return scanFromUrl;
            }
        }

        const activeSession = this.dataService.activeQrSession();
        if (activeSession?.lectureId) {
            return activeSession.lectureId;
        }

        if (this.initialScanId) {
            return this.initialScanId;
        }

        const persistedScanId = sessionStorage.getItem(this.pendingScanStorageKey);
        if (persistedScanId) {
            return persistedScanId;
        }

        return null;
    }

    private resolveQrToken(): string | null {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tokenFromUrl = params.get('qr') || params.get('token');

            // If the current URL represents a scan intent, trust only the token present in that URL.
            // This prevents stale sessionStorage tokens from causing false mismatch errors.
            if (params.has('scan') || tokenFromUrl) {
                return tokenFromUrl ? tokenFromUrl : null;
            }

            if (tokenFromUrl) {
                return tokenFromUrl;
            }
        }

        const activeSession = this.dataService.activeQrSession();
        if (activeSession?.sessionToken) {
            return activeSession.sessionToken;
        }

        const persistedToken = sessionStorage.getItem(this.pendingScanTokenStorageKey);
        if (persistedToken) {
            return persistedToken;
        }

        return null;
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
