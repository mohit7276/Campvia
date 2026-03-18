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
    scanStatus: 'idle' | 'scanning' | 'success' | 'error' | 'location-denied' = 'idle';
    errorMessage = '';
    userLocation: { lat: number, lng: number } | null = null;

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
            // Wait slightly for UI to settle before attempting scan
            setTimeout(() => {
                this.handleStartScan();
            }, 500);
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
        this.scanStatus = 'scanning';
        this.isScannerOpen = true;
        this.errorMessage = '';

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
                    // Simulate scan after getting location
                    setTimeout(() => this.simulateScan(), 2000);
                },
                () => {
                    this.scanStatus = 'location-denied';
                    this.errorMessage = "Enable GPS to mark attendance.";
                },
                { enableHighAccuracy: true }
            );
        } else {
            this.scanStatus = 'error';
            this.errorMessage = "Geolocation unsupported.";
        }
    }

    simulateScan() {
        if (!this.userLocation) return;

        let activeSession = this.dataService.activeQrSession();

        // If not running in same browser window as admin, fake the session from URL param
        if (!activeSession && this.initialScanId) {
            activeSession = {
                lectureId: 'lxyz',
                subject: this.initialScanId,
                location: { lat: this.userLocation.lat + 0.00001, lng: this.userLocation.lng + 0.00001 } // slightly offset but within 10m
            };
        }

        if (!activeSession) {
            this.scanStatus = 'error';
            this.errorMessage = "No active attendance session found.";
            return;
        }

        const classroomDistance = this.calculateDistance(
            this.userLocation.lat, this.userLocation.lng,
            activeSession.location.lat, activeSession.location.lng
        );

        // Check if within 10 meters
        if (classroomDistance > 10) {
            this.scanStatus = 'error';
            this.errorMessage = `You are not within the 10-meter classroom radius. (Distance: ${classroomDistance.toFixed(1)}m)`;
            return;
        }

        const campusDistance = this.calculateDistance(
            this.userLocation.lat, this.userLocation.lng,
            CAMPUS_LOCATION.lat, CAMPUS_LOCATION.lng
        );

        // Check if within 50 meters of campus
        if (campusDistance > 50) {
            this.scanStatus = 'error';
            this.errorMessage = `You are not within the 50-meter campus radius. (Distance: ${campusDistance.toFixed(1)}m)`;
            return;
        }

        const currentSubject = activeSession.subject;
        if (this.records.some(r => r.date === this.todayStr && r.subject === currentSubject && r.status === 'present')) {
            this.scanStatus = 'error';
            this.errorMessage = "Attendance already logged for today.";
            return;
        }

        this.scanStatus = 'success';
        const newRecord: AttendanceRecord = {
            id: Math.random().toString(36).substr(2, 9),
            date: this.todayStr,
            subject: currentSubject,
            status: 'present',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setTimeout(() => {
            this.records = [newRecord, ...this.records];
            this.calculateStats();
            this.calculateSubjectSummaries();
            this.isScannerOpen = false;
            this.scanStatus = 'idle';
        }, 1500);
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
