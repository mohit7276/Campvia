import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminAssignmentPage } from '../admin-assignment-page/admin-assignment-page';
import { AdminUpcomingTestsPage } from '../admin-upcoming-tests-page/admin-upcoming-tests-page';
import { NoticePageComponent } from '../notice-page/notice-page.component';
import { AdminTimetablePage } from '../admin-timetable-page/admin-timetable-page';
import { DataService } from '../../services/data.service';
import { DashboardHomeComponent } from '../dashboard-home/dashboard-home.component';
import { UserTodo } from '../../types';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        AdminAssignmentPage,
        AdminUpcomingTestsPage,
        NoticePageComponent,
        AdminTimetablePage,
        DashboardHomeComponent,
        FormsModule
    ],
    templateUrl: './admin-dashboard.component.html',
    styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
    private api = inject(ApiService);
    private cdr = inject(ChangeDetectorRef);

    isSidebarOpen = false;
    activeSection = 'overview';

    // Live dashboard stats from DB
    statsLoading = true;
    adminStats: any = {
        counts: { totalStudents: 0, activeStudents: 0, totalFaculty: 0, activeFaculty: 0, totalCourses: 0, totalNotices: 0, unreadContacts: 0, totalContacts: 0, totalAssignments: 0, totalExams: 0 },
        fees: { totalAmount: 0, paidAmount: 0, pendingAmount: 0, overdueAmount: 0, totalRecords: 0, paidRecords: 0, pendingRecords: 0, overdueRecords: 0 },
        recentStudents: [],
        recentNotices: [],
        recentContacts: []
    };


    navItems = [
        { id: 'overview', label: 'Overview', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
        { id: 'students', label: 'Manage Students', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
        { id: 'faculty', label: 'Manage Faculty', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
        { id: 'courses', label: 'Departments & Courses', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
        { id: 'notices', label: 'Notices & Alerts', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
        { id: 'assignments', label: 'Manage Assignments', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
        { id: 'upcoming-tests', label: 'Exams & Tests', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        { id: 'timetable', label: 'Timetable & Lectures', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
        { id: 'settings', label: 'Portal Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
        { id: 'contact-inquiries', label: 'Contact Inquiries', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
        { id: 'fees', label: 'Manage Fees', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' }
    ];

    userTodos: UserTodo[] = [];

    students: any[] = [];

    faculty: any[] = [];

    get coursesList() {
        return this.dataService.courses();
    }

    studentSearchQuery = '';
    facultySearchQuery = '';
    courseSearchQuery = '';
    saveError = '';
    saveSuccess = '';
    saving = false;

    // Toast notification
    toast = { visible: false, message: '', success: true };
    private toastTimer: any;
    showToast(message: string, success = true) {
        clearTimeout(this.toastTimer);
        this.toast = { visible: true, message, success };
        this.cdr.detectChanges();
        this.toastTimer = setTimeout(() => {
            this.toast.visible = false;
            this.cdr.detectChanges();
        }, 3000);
    }

    get filteredStudents() {
        if (!this.studentSearchQuery) return this.students;
        const query = this.studentSearchQuery.toLowerCase();
        return this.students.filter(student =>
            (student.name || '').toLowerCase().includes(query) ||
            (student.email || '').toLowerCase().includes(query) ||
            (student.course || '').toLowerCase().includes(query)
        );
    }

    get filteredFaculty() {
        if (!this.facultySearchQuery) return this.faculty;
        const query = this.facultySearchQuery.toLowerCase();
        return this.faculty.filter(member =>
            (member.name || '').toLowerCase().includes(query) ||
            (member.email || '').toLowerCase().includes(query) ||
            (member.department || '').toLowerCase().includes(query) ||
            (member.designation || '').toLowerCase().includes(query)
        );
    }

    get filteredCourses() {
        if (!this.courseSearchQuery) return this.coursesList;
        const query = this.courseSearchQuery.toLowerCase();
        return this.coursesList.filter(course =>
            course.name.toLowerCase().includes(query) ||
            course.id.toLowerCase().includes(query) ||
            course.head.toLowerCase().includes(query) ||
            course.type.toLowerCase().includes(query)
        );
    }

    constructor(public authService: AuthService, public router: Router, private dataService: DataService) { }

    ngOnInit() {
        const role = this.authService.currentUser()?.role;
        if (!this.authService.isLoggedIn() || (role !== 'admin' && role !== 'faculty')) {
            this.router.navigate(['/']);
            return;
        }
        this.dataService.loadCourses();
        this.loadStudents();
        this.loadFaculty();
        this.loadTodos();
        this.loadStats();
        // Silently pre-fetch fees in the background so the fees section opens instantly
        this.api.getAdminFees().subscribe({
            next: (data: any[]) => {
                this.adminFees = data.map(fee => {
                    const sid = fee.studentId?._id?.toString() || fee.studentId?.toString() || '';
                    return { ...fee, studentName: this.studentNameMap.get(sid) || 'Unknown' };
                });
                this._feesSummaryDirty = true;
            }
        });
    }

    loadTodos() {
        this.api.getTodos().subscribe({
            next: (data: any[]) => {
                this.userTodos = data.map((t: any) => ({ ...t, id: t._id || t.id }));
                this.cdr.detectChanges();
            },
            error: () => {
                this.userTodos = [];
                this.cdr.detectChanges();
            }
        });
    }

    loadStats() {
        this.statsLoading = true;
        this.api.getAdminStats().subscribe({
            next: (data: any) => {
                this.adminStats = data;
                this.statsLoading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.statsLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    formatCurrency(amount: number): string {
        if (amount >= 10000000) return '₹' + (amount / 10000000).toFixed(1) + 'Cr';
        if (amount >= 100000) return '₹' + (amount / 100000).toFixed(1) + 'L';
        if (amount >= 1000) return '₹' + (amount / 1000).toFixed(1) + 'K';
        return '₹' + amount.toFixed(0);
    }

    get feeCollectionPercent(): number {
        const total = this.adminStats?.fees?.totalAmount || 0;
        const paid = this.adminStats?.fees?.paidAmount || 0;
        return total > 0 ? Math.round((paid / total) * 100) : 0;
    }

    timeAgo(dateStr: string): string {
        if (!dateStr) return '';
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now.getTime() - date.getTime();
        const mins = Math.floor(diffMs / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return mins + 'm ago';
        const hours = Math.floor(mins / 60);
        if (hours < 24) return hours + 'h ago';
        const days = Math.floor(hours / 24);
        if (days < 30) return days + 'd ago';
        return date.toLocaleDateString();
    }

    /** O(1) lookup map: studentId → name, rebuilt after students load */
    private studentNameMap = new Map<string, string>();
    /** Per-course student cache to avoid re-fetching for the same course */
    private courseStudentsCache = new Map<string, any[]>();

    loadStudents() {
        this.api.getAdminStudents().subscribe(data => {
            this.students = data;
            // Rebuild O(1) lookup map
            this.studentNameMap.clear();
            for (const s of data) this.studentNameMap.set(s._id, s.name);
            // Re-enrich any already-loaded fees
            if (this.adminFees.length > 0) {
                this.adminFees = this.adminFees.map(f => ({
                    ...f,
                    studentName: this.studentNameMap.get(f.studentId?._id || f.studentId) || f.studentName || 'Unknown'
                }));
                this._feesSummaryDirty = true;
            }
            this.cdr.detectChanges();
        });
    }

    loadFaculty() {
        this.api.getAdminFaculty().subscribe(data => {
            this.faculty = data;
            this.cdr.detectChanges();
        });
    }

    toggleSidebar() {
        this.isSidebarOpen = !this.isSidebarOpen;
    }

    navigateTo(sectionId: string) {
        this.activeSection = sectionId;
        if (window.innerWidth < 1024) {
            this.isSidebarOpen = false;
        }
        // Refresh stats whenever landing on or returning to overview, assignments, or exams
        if (sectionId === 'overview' || sectionId === 'assignments' || sectionId === 'upcoming-tests') {
            this.loadStats();
        }
        if (sectionId === 'contact-inquiries') {
            this.loadContacts();
        }
        if (sectionId === 'fees') {
            // Block faculty from accessing fee management
            if (this.authService.currentUser()?.role !== 'admin') {
                this.activeSection = 'overview';
                return;
            }
            // Always auto-sync missing fee records, then refresh list
            this.syncAdminFeesForEnrolledStudents();
        }
    }

    handleLogout() {
        this.authService.logout();
        this.router.navigate(['/']);
    }

    deleteStudent(id: string) {
        if (this.saving) return;
        if (confirm('Are you sure you want to completely remove this student?')) {
            this.saving = true;
            this.api.deleteAdminStudent(id).subscribe({
                next: () => {
                    this.students = this.students.filter(s => s._id !== id);
                    // Remove this student's fee records from local cache so fees page stays in sync
                    this.adminFees = this.adminFees.filter(f => {
                        const sid = f.studentId?._id?.toString() || f.studentId?.toString() || '';
                        return sid !== id;
                    });
                    this._feesSummaryDirty = true;
                    this.saving = false;
                    this.showToast('Student removed successfully.');
                },
                error: () => { this.saving = false; this.cdr.detectChanges(); }
            });
        }
    }

    isStudentModalOpen = false;
    currentStudent: any = null;
    isViewingStudent = false;
    originalStudentId: string | null = null;
    rollNoCheckStatus: 'idle' | 'checking' | 'available' | 'taken' = 'idle';
    rollNoCheckError = '';

    // Helper to generate new ID
    generateStudentId(): string {
        const ids = this.students.map(s => parseInt(s.id.replace('S', ''), 10));
        const maxId = ids.length ? Math.max(...ids) : 1000;
        return `S${maxId + 1}`;
    }

    openAddStudentModal() {
        this.currentStudent = {
            name: '',
            course: '',
            courseId: '',
            year: '1st Year',
            status: 'Active',
            email: '',
            password: '',
            phone: '',
            address: '',
            feesPaid: false,
            rollNo: ''
        };
        this.originalStudentId = null;
        this.isViewingStudent = false;
        this.saveError = '';
        this.saveSuccess = '';
        this.rollNoCheckStatus = 'idle';
        this.rollNoCheckError = '';
        this.isStudentModalOpen = true;
        // Auto-fetch next roll number and mark as verified
        this.api.getNextAdminRollNo().subscribe({
            next: (data: any) => {
                this.currentStudent.rollNo = data.rollNo;
                this.rollNoCheckStatus = 'available';
                this.cdr.detectChanges();
            },
            error: () => {}
        });
    }

    openEditStudentModal(student: any) {
        const courseId = student.courseId || this.findCourseIdByName(student.course);
        this.currentStudent = { ...student, courseId, password: '', rollNo: student.rollNo || '' };
        this.originalStudentId = student._id || student.id;
        this.isViewingStudent = false;
        this.saveError = '';
        this.saveSuccess = '';
        this.rollNoCheckStatus = student.rollNo ? 'available' : 'idle';
        this.rollNoCheckError = '';
        this.ensureStudentYearWithinCourseDuration();
        this.isStudentModalOpen = true;
    }

    onRollNoInput() {
        this.rollNoCheckStatus = 'idle';
        this.rollNoCheckError = '';
    }

    verifyRollNo() {
        const rollNo = this.currentStudent?.rollNo?.trim();
        if (!rollNo) {
            this.rollNoCheckError = 'Please enter a roll number to verify.';
            this.rollNoCheckStatus = 'taken';
            return;
        }
        this.rollNoCheckStatus = 'checking';
        this.rollNoCheckError = '';
        const excludeId = this.originalStudentId || undefined;
        this.api.checkAdminRollNo(rollNo, excludeId).subscribe({
            next: (data: any) => {
                this.rollNoCheckStatus = data.available ? 'available' : 'taken';
                this.rollNoCheckError = data.available ? '' : `Roll number "${rollNo}" is already assigned to another student.`;
                this.cdr.detectChanges();
            },
            error: () => {
                this.rollNoCheckStatus = 'idle';
                this.rollNoCheckError = 'Could not verify. Please try again.';
                this.cdr.detectChanges();
            }
        });
    }

    onStudentCourseChange() {
        if (!this.currentStudent?.courseId) return;
        const course = this.coursesList.find(c => c.courseId === this.currentStudent.courseId || c.id === this.currentStudent.courseId);
        if (course) this.currentStudent.course = course.name;
        this.ensureStudentYearWithinCourseDuration();
    }

    private getOrdinalYearLabel(year: number): string {
        if (year === 1) return '1st Year';
        if (year === 2) return '2nd Year';
        if (year === 3) return '3rd Year';
        return `${year}th Year`;
    }

    private parseCourseDurationYears(duration: string): number {
        if (!duration) return 4;
        const match = duration.match(/\d+/);
        if (!match) return 4;
        const years = Number(match[0]);
        return Number.isFinite(years) && years > 0 ? years : 4;
    }

    private parseStudentYearValue(value: any): number {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value === 'string') {
            const match = value.match(/\d+/);
            if (match) {
                const year = Number(match[0]);
                if (Number.isFinite(year) && year > 0) return year;
            }
        }
        return 1;
    }

    get studentYearOptions(): string[] {
        const selectedCourseId = this.currentStudent?.courseId;
        const selectedCourse = this.coursesList.find(c => (c.courseId || c.id) === selectedCourseId);
        const maxYears = this.parseCourseDurationYears(selectedCourse?.duration || '');
        return Array.from({ length: maxYears }, (_, i) => this.getOrdinalYearLabel(i + 1));
    }

    private ensureStudentYearWithinCourseDuration() {
        if (!this.currentStudent) return;
        const options = this.studentYearOptions;
        if (!options.length) return;
        const currentYear = this.parseStudentYearValue(this.currentStudent.year);
        const clampedYear = Math.min(Math.max(currentYear, 1), options.length);
        this.currentStudent.year = this.getOrdinalYearLabel(clampedYear);
    }

    private findCourseIdByName(courseName: string): string {
        if (!courseName) return '';
        const course = this.coursesList.find(c => c.name.toLowerCase() === courseName.toLowerCase());
        return course?.courseId || course?.id || '';
    }

    openViewStudentModal(student: any) {
        this.openEditStudentModal(student);
        this.isViewingStudent = true;
    }

    closeStudentModal() {
        this.isStudentModalOpen = false;
        this.currentStudent = null;
        this.originalStudentId = null;
    }

    saveStudent() {
        if (!this.currentStudent || this.saving) return;
        this.saveError = '';
        this.saveSuccess = '';

        // Validation
        if (!this.currentStudent.name?.trim()) {
            this.saveError = 'Name is required';
            return;
        }
        if (!this.currentStudent.email?.trim()) {
            this.saveError = 'Email is required for login credentials';
            return;
        }
        if (!this.currentStudent.courseId) {
            this.saveError = 'Please select a course from the list';
            return;
        }
        if (!this.originalStudentId && !this.currentStudent.password?.trim()) {
            this.saveError = 'Password is required for new student';
            return;
        }
        if (this.currentStudent.rollNo?.trim() && this.rollNoCheckStatus !== 'available') {
            this.saveError = 'Please verify the roll number before saving.';
            return;
        }
        if (this.rollNoCheckStatus === 'taken') {
            this.saveError = this.rollNoCheckError || 'Roll number is already taken.';
            return;
        }

        this.onStudentCourseChange();
        const payload = { ...this.currentStudent };
        // Don't send empty password on edit (backend won't update it)
        if (this.originalStudentId && !payload.password) {
            delete payload.password;
        }

        if (!this.originalStudentId) {
            // Add new
            this.saving = true;
            this.api.createAdminStudent(payload).subscribe({
                next: (data) => {
                    this.students = [...this.students, data];
                    this.studentNameMap.set(data._id, data.name);
                    this._feesSummaryDirty = true;
                    // Reload fees so auto-generated records for this new student appear
                    this.loadAdminFees();
                    this.saving = false;
                    this.closeStudentModal();
                    this.showToast('Student created successfully!');
                },
                error: (err) => {
                    this.saveError = err?.error?.message || 'Failed to create student';
                    this.saving = false;
                    this.cdr.detectChanges();
                }
            });
        } else {
            // Edit existing
            this.saving = true;
            this.api.updateAdminStudent(this.originalStudentId, payload).subscribe({
                next: (data) => {
                    const index = this.students.findIndex(s => s._id === this.originalStudentId);
                    if (index !== -1) {
                        const updatedStudents = [...this.students];
                        updatedStudents[index] = data;
                        this.students = updatedStudents;
                    }
                    this.studentNameMap.set(data._id, data.name);
                    this._feesSummaryDirty = true;
                    // Reload fees in case course changed and new fees were generated
                    this.loadAdminFees();
                    this.saving = false;
                    this.closeStudentModal();
                    this.showToast('Student updated successfully!');
                },
                error: (err) => {
                    this.saveError = err?.error?.message || 'Failed to update student';
                    this.saving = false;
                    this.cdr.detectChanges();
                }
            });
        }
    }

    deleteFaculty(id: string) {
        if (this.saving) return;
        if (confirm('Are you sure you want to completely remove this faculty member?')) {
            this.saving = true;
            this.api.deleteAdminFaculty(id).subscribe({
                next: () => {
                    this.faculty = this.faculty.filter(f => f._id !== id);
                    this.saving = false;
                    this.showToast('Faculty member removed successfully.');
                },
                error: () => { this.saving = false; this.cdr.detectChanges(); }
            });
        }
    }

    isFacultyModalOpen = false;
    currentFaculty: any = null;
    isViewingFaculty = false;
    originalFacultyId: string | null = null;

    generateFacultyId(): string {
        const ids = this.faculty.map(f => parseInt(f.id.replace('F', ''), 10));
        const maxId = ids.length ? Math.max(...ids) : 100;
        return `F${(maxId + 1).toString().padStart(2, '0')}`;
    }

    openAddFacultyModal() {
        this.currentFaculty = {
            name: '',
            department: '',
            designation: '',
            status: 'Active',
            email: '',
            password: '',
            phone: '',
            address: '',
            courseIds: []
        };
        this.originalFacultyId = null;
        this.isViewingFaculty = false;
        this.saveError = '';
        this.saveSuccess = '';
        this.isFacultyModalOpen = true;
    }

    openEditFacultyModal(member: any) {
        this.currentFaculty = { ...member, password: '', courseIds: member.courseIds || [] };
        this.originalFacultyId = member._id || member.id;
        this.isViewingFaculty = false;
        this.saveError = '';
        this.saveSuccess = '';
        this.isFacultyModalOpen = true;
    }

    openViewFacultyModal(member: any) {
        this.openEditFacultyModal(member);
        this.isViewingFaculty = true;
    }

    closeFacultyModal() {
        this.isFacultyModalOpen = false;
        this.currentFaculty = null;
        this.originalFacultyId = null;
    }

    toggleFacultyCourse(courseId: string, event: Event) {
        const checked = (event.target as HTMLInputElement).checked;
        if (!this.currentFaculty) return;
        const ids: string[] = this.currentFaculty.courseIds ? [...this.currentFaculty.courseIds] : [];
        if (checked && !ids.includes(courseId)) {
            ids.push(courseId);
        } else if (!checked) {
            const idx = ids.indexOf(courseId);
            if (idx !== -1) ids.splice(idx, 1);
        }
        this.currentFaculty = { ...this.currentFaculty, courseIds: ids };
    }

    saveFaculty() {
        if (!this.currentFaculty || this.saving) return;
        this.saveError = '';
        this.saveSuccess = '';

        // Validation
        if (!this.currentFaculty.name?.trim()) {
            this.saveError = 'Name is required';
            return;
        }
        if (!this.currentFaculty.email?.trim()) {
            this.saveError = 'Email is required for login credentials';
            return;
        }
        if (!this.currentFaculty.courseIds || this.currentFaculty.courseIds.length === 0) {
            this.saveError = 'Please select at least one course';
            return;
        }
        if (!this.originalFacultyId && !this.currentFaculty.password?.trim()) {
            this.saveError = 'Password is required for new faculty';
            return;
        }

        const payload = { ...this.currentFaculty };
        // Don't send empty password on edit
        if (this.originalFacultyId && !payload.password) {
            delete payload.password;
        }

        if (!this.originalFacultyId) {
            // Add new
            this.saving = true;
            this.api.createAdminFaculty(payload).subscribe({
                next: (data) => {
                    this.faculty = [...this.faculty, data];
                    this.saving = false;
                    this.closeFacultyModal();
                    this.showToast('Faculty created successfully!');
                },
                error: (err) => {
                    this.saveError = err?.error?.message || 'Failed to create faculty';
                    this.saving = false;
                    this.cdr.detectChanges();
                }
            });
        } else {
            // Edit existing
            this.saving = true;
            this.api.updateAdminFaculty(this.originalFacultyId, payload).subscribe({
                next: (data) => {
                    const index = this.faculty.findIndex(f => f._id === this.originalFacultyId);
                    if (index !== -1) {
                        const updatedFaculty = [...this.faculty];
                        updatedFaculty[index] = data;
                        this.faculty = updatedFaculty;
                    }
                    this.saving = false;
                    this.closeFacultyModal();
                    this.showToast('Faculty updated successfully!');
                },
                error: (err) => {
                    this.saveError = err?.error?.message || 'Failed to update faculty';
                    this.saving = false;
                    this.cdr.detectChanges();
                }
            });
        }
    }

    // Courses Logic
    isCourseModalOpen = false;
    currentCourse: any = null;
    isViewingCourse = false;
    originalCourseId: string | null = null;
    adminPreviewError = false;
    adminImageUrlWarning = '';

    /** Detects search-page URLs and tries to extract the real direct image URL. */
    private extractDirectImageUrl(url: string): string | null {
        try {
            const p = new URL(url);
            if (p.hostname.includes('google.') && p.pathname.includes('imgres')) {
                return p.searchParams.get('imgurl');
            }
            if (p.hostname.includes('bing.com') && p.searchParams.has('mediaurl')) {
                return p.searchParams.get('mediaurl');
            }
        } catch { }
        return null;
    }

    onAdminImageUrlChange(url: string) {
        this.adminPreviewError = false;
        this.adminImageUrlWarning = '';
        if (!url) return;
        const extracted = this.extractDirectImageUrl(url);
        if (extracted) {
            this.currentCourse.image = extracted;
            this.adminImageUrlWarning = '';
        } else if (
            url.includes('google.com/search') ||
            url.includes('google.com/imgres') ||
            url.includes('bing.com/images') ||
            url.includes('pinterest.') ||
            url.includes('instagram.com') ||
            url.includes('facebook.com')
        ) {
            this.adminImageUrlWarning = 'This looks like a search/social page URL, not a direct image. Right-click the image → "Copy image address" to get the real URL.';
        }
    }

    newSubjectName = '';
    editSubjectIndex: number | null = null;
    editSubjectName = '';

    deleteCourse(id: string) {
        if (confirm('Are you sure you want to completely remove this course?')) {
            this.dataService.deleteCourse(id);
        }
    }

    generateCourseId(): string {
        const ids = this.coursesList
            .map(c => parseInt(((c as any).courseId || c.id || '').replace('C', ''), 10))
            .filter(n => !isNaN(n));
        const maxId = ids.length ? Math.max(...ids) : 100;
        return `C${(maxId + 1).toString().padStart(2, '0')}`;
    }

    openAddCourseModal() {
        this.currentCourse = {
            id: this.generateCourseId(),
            name: '',
            head: '',
            duration: '',
            type: 'Undergraduate',
            totalFees: 0,
            subjects: [],
            // Landing page fields
            title: '',
            category: '',
            image: '',
            description: '',
            rating: 4.5
        };
        this.originalCourseId = null;
        this.isViewingCourse = false;
        this.adminPreviewError = false;
        this.adminImageUrlWarning = '';
        this.resetSubjectEditing();
        this.isCourseModalOpen = true;
    }

    openEditCourseModal(course: any) {
        this.currentCourse = {
            ...course,
            subjects: [...(course.subjects || [])],
            title: course.title || course.name || '',
            category: course.category || '',
            image: course.image || '',
            description: course.description || '',
            rating: course.rating || 0
        };
        this.originalCourseId = course.id;
        this.isViewingCourse = false;
        this.adminPreviewError = false;
        this.adminImageUrlWarning = '';
        this.resetSubjectEditing();
        this.isCourseModalOpen = true;
    }

    openViewCourseModal(course: any) {
        this.openEditCourseModal(course);
        this.isViewingCourse = true;
    }

    closeCourseModal() {
        this.isCourseModalOpen = false;
        this.currentCourse = null;
        this.originalCourseId = null;
        this.adminPreviewError = false;
        this.adminImageUrlWarning = '';
        this.resetSubjectEditing();
    }

    saveCourse() {
        if (!this.currentCourse) return;

        // Auto-fix any stored Google/Bing search page URLs before saving
        if (this.currentCourse.image) {
            const cleaned = this.extractDirectImageUrl(this.currentCourse.image);
            if (cleaned) this.currentCourse.image = cleaned;
        }

        if (!this.originalCourseId) {
            // Add new
            if (!this.currentCourse.id) {
                this.currentCourse.id = this.generateCourseId();
            }
            this.dataService.addCourse({ ...this.currentCourse });
        } else {
            // Edit existing
            this.dataService.updateCourse({ ...this.currentCourse });
        }
        this.closeCourseModal();
    }

    // Subject Management Methods inside Modal
    resetSubjectEditing() {
        this.newSubjectName = '';
        this.editSubjectIndex = null;
        this.editSubjectName = '';
    }

    addSubject() {
        if (this.newSubjectName.trim()) {
            this.currentCourse.subjects.push(this.newSubjectName.trim());
            this.newSubjectName = '';
        }
    }

    removeSubject(index: number) {
        this.currentCourse.subjects.splice(index, 1);
        if (this.editSubjectIndex === index) {
            this.cancelEditSubject();
        } else if (this.editSubjectIndex !== null && index < this.editSubjectIndex) {
            this.editSubjectIndex--;
        }
    }

    startEditingSubject(index: number) {
        this.editSubjectIndex = index;
        this.editSubjectName = this.currentCourse.subjects[index];
    }

    saveEditedSubject() {
        if (this.editSubjectIndex !== null && this.editSubjectName.trim()) {
            this.currentCourse.subjects[this.editSubjectIndex] = this.editSubjectName.trim();
        }
        this.cancelEditSubject();
    }

    cancelEditSubject() {
        this.editSubjectIndex = null;
        this.editSubjectName = '';
    }

    // ===== CONTACT INQUIRIES =====
    contacts: any[] = [];
    contactsLoading = false;
    contactSearchQuery = '';

    get filteredContacts() {
        if (!this.contactSearchQuery) return this.contacts;
        const q = this.contactSearchQuery.toLowerCase();
        return this.contacts.filter(c =>
            (c.name || '').toLowerCase().includes(q) ||
            (c.email || '').toLowerCase().includes(q) ||
            (c.message || '').toLowerCase().includes(q)
        );
    }

    loadContacts() {
        this.contactsLoading = true;
        this.api.getAdminContacts().subscribe({
            next: (data: any[]) => {
                this.contacts = data;
                this.contactsLoading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.contacts = [];
                this.contactsLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    toggleContactRead(contact: any) {
        this.api.markContactRead(contact._id, !contact.read).subscribe({
            next: (updated: any) => {
                contact.read = updated.read;
                this.cdr.detectChanges();
            }
        });
    }

    deleteContactInquiry(id: string) {
        if (!confirm('Delete this inquiry?')) return;
        this.api.deleteContact(id).subscribe({
            next: () => {
                this.contacts = this.contacts.filter(c => c._id !== id);
                this.cdr.detectChanges();
            }
        });
    }

    // ===== FEE MANAGEMENT =====
    adminFees: any[] = [];
    feesLoading = false;
    feeSearchQuery = '';
    feeCourseFilter = '';
    isFeeModalOpen = false;
    currentFee: any = null;
    originalFeeId: string | null = null;
    feeSaveError = '';
    feeSaveSuccess = '';
    feeSaving = false;
    feeModalCourseId = '';
    feeModalStudents: any[] = [];
    feeModalStudentsLoading = false;
    expandedFeeStudentId: string | null = null;
    paidInputByStudent: Record<string, string> = {};

    // Memoization for the expensive studentFeesSummary computation
    private _feesSummaryCache: any[] = [];
    private _feesSummaryDirty = true;
    private _feesSummaryLastSearch = '';
    private _feesSummaryLastCourse = '';
    private _feesSummaryLastCount = -1;
    private _feesSummaryLastStudentCount = -1;

    // Build student fee summary driven by the students list (same source as Manage Students)
    // Every student shows up; fee records are joined on top.
    get studentFeesSummary(): any[] {
        // Only recompute when inputs actually changed
        if (
            !this._feesSummaryDirty &&
            this._feesSummaryLastSearch === this.feeSearchQuery &&
            this._feesSummaryLastCourse === this.feeCourseFilter &&
            this._feesSummaryLastCount === this.adminFees.length &&
            this._feesSummaryLastStudentCount === this.students.length
        ) {
            return this._feesSummaryCache;
        }

        this._feesSummaryLastSearch = this.feeSearchQuery;
        this._feesSummaryLastCourse = this.feeCourseFilter;
        this._feesSummaryLastCount = this.adminFees.length;
        this._feesSummaryLastStudentCount = this.students.length;
        this._feesSummaryDirty = false;

        // Build a course name lookup (courseId → {name, totalFees})
        const courseMap = new Map(this.coursesList.map(c => [c.id, { name: c.name, totalFees: c.totalFees || 0 }]));

        // Build a fee index: studentId → fee[]
        const feeIndex = new Map<string, any[]>();
        for (const f of this.adminFees) {
            const sid = f.studentId?._id?.toString() || f.studentId?.toString() || '';
            if (!sid) continue;
            if (!feeIndex.has(sid)) feeIndex.set(sid, []);
            feeIndex.get(sid)!.push(f);
        }

        // Start from the full students list so every student is represented
        let result = this.students.map(s => {
            const sid = s._id?.toString() || '';
            const fees = feeIndex.get(sid) || [];
            const courseId = s.courseId || '';
            const courseInfo = courseMap.get(courseId);
            const courseName = courseInfo?.name || s.course || '—';
            // Use the course's totalFees as the canonical total (same as what students see)
            const courseTotalFees = courseInfo?.totalFees || 0;
            let paidAmount = 0, pendingAmount = 0, overdueAmount = 0;
            for (const f of fees) {
                if (f.status === 'paid') paidAmount += f.amount || 0;
                else if (f.status === 'overdue') overdueAmount += f.amount || 0;
                else pendingAmount += f.amount || 0;
            }
            // totalAmount = course fee (canonical), not sum of records (avoids duplicate record inflation)
            const totalAmount = courseTotalFees || (paidAmount + pendingAmount + overdueAmount);
            const remainingDue = Math.max(0, totalAmount - paidAmount);
            return {
                studentId: sid,
                studentName: s.name || 'Unknown',
                courseName,
                courseId,
                totalAmount,
                paidAmount,
                pendingAmount,
                overdueAmount,
                remainingDue,
                fees
            };
        });

        // Apply course filter
        if (this.feeCourseFilter) {
            result = result.filter(e => e.courseId === this.feeCourseFilter);
        }

        // Apply search filter (match name, course, or any fee title/category)
        if (this.feeSearchQuery) {
            const q = this.feeSearchQuery.toLowerCase();
            result = result.filter(e =>
                (e.studentName || '').toLowerCase().includes(q) ||
                (e.courseName || '').toLowerCase().includes(q) ||
                (e.courseId || '').toLowerCase().includes(q) ||
                e.fees.some((f: any) =>
                    (f.title || '').toLowerCase().includes(q) ||
                    (f.category || '').toLowerCase().includes(q)
                )
            );
        }

        this._feesSummaryCache = result.sort((a, b) => a.studentName.localeCompare(b.studentName));
        return this._feesSummaryCache;
    }

    isStudentFeePaid(student: any): boolean {
        const studentId = (student?._id || student?.id || '').toString();
        if (!studentId) return !!student?.feesPaid;

        const summary = this.studentFeesSummary.find(e => e.studentId === studentId);
        if (!summary) return !!student?.feesPaid;

        return Number(summary.remainingDue || 0) <= 0;
    }

    toggleFeeStudentExpand(studentId: string) {
        this.expandedFeeStudentId = this.expandedFeeStudentId === studentId ? null : studentId;
    }

    addPaidAmountForStudent(entry: any) {
        const rawAmount = this.paidInputByStudent[entry.studentId];
        const amount = Number(rawAmount);

        if (!Number.isFinite(amount) || amount <= 0) {
            this.showToast('Enter a valid paid amount.', false);
            return;
        }

        const remainingDue = Math.max(0, Number(entry.remainingDue || 0));
        if (remainingDue <= 0) {
            this.showToast('No due amount left for this student.', false);
            return;
        }

        if (amount > remainingDue) {
            this.showToast(`Paid amount cannot exceed remaining due (₹${remainingDue.toLocaleString()}).`, false);
            return;
        }

        const payload = {
            studentId: entry.studentId,
            courseId: entry.courseId || '',
            title: 'Manual Paid Amount',
            amount,
            dueDate: new Date().toISOString().split('T')[0],
            status: 'paid',
            category: 'Tuition',
            semester: 'Manual Payment',
            paidDate: new Date().toISOString().split('T')[0],
            method: 'Admin Manual Entry'
        };

        this.api.createAdminFee(payload).subscribe({
            next: (data: any) => {
                const sid = data.studentId?.toString() || data.studentId;
                const name = this.studentNameMap.get(sid) ?? this.students.find(s => s._id === sid)?.name ?? entry.studentName ?? 'Unknown';
                this.adminFees = [{ ...data, studentName: name }, ...this.adminFees];
                this._feesSummaryDirty = true;
                this.paidInputByStudent[entry.studentId] = '';
                this.loadStats();
                this.showToast('Paid amount added successfully.');
                this.cdr.detectChanges();
            },
            error: (err: any) => {
                this.showToast(err?.error?.message || 'Could not add paid amount.', false);
                this.cdr.detectChanges();
            }
        });
    }

    loadAdminFees() {
        this.feesLoading = true;
        this.api.getAdminFees().subscribe({
            next: (data: any[]) => {
                // Use O(1) lookup map; fall back to linear scan if map not yet built
                this.adminFees = data.map(fee => {
                    const sid = fee.studentId?._id?.toString() || fee.studentId?.toString() || '';
                    const name = this.studentNameMap.get(sid)
                        ?? this.students.find(s => s._id === sid)?.name
                        ?? 'Unknown';
                    return { ...fee, studentName: name };
                });
                this._feesSummaryDirty = true;
                this.feesLoading = false;
                this.cdr.detectChanges();
            },
            error: () => { this.feesLoading = false; this.cdr.detectChanges(); }
        });
    }

    syncAdminFeesForEnrolledStudents() {
        this.feesLoading = true;
        this.api.syncAdminFeesForEnrolledStudents().subscribe({
            next: () => this.loadAdminFees(),
            error: () => this.loadAdminFees()
        });
    }

    openAddFeeModal(presetStudentId?: string) {
        const student = presetStudentId ? this.adminFees.find(f => {
            const sid = f.studentId?._id || f.studentId;
            return sid === presetStudentId;
        }) : null;
        const studentFromDirectory = presetStudentId ? this.students.find(s => s._id === presetStudentId) : null;
        const courseId = student
            ? (student.courseId?._id || student.courseId || '')
            : (studentFromDirectory?.courseId || '');
        this.currentFee = {
            studentId: presetStudentId || '',
            courseId,
            title: '',
            amount: 0,
            dueDate: new Date().toISOString().split('T')[0],
            status: 'pending',
            category: 'Tuition',
            semester: ''
        };
        this.originalFeeId = null;
        this.feeSaveError = '';
        this.feeSaveSuccess = '';
        this.feeModalCourseId = courseId;
        if (courseId) {
            this.onFeeModalCourseChange();
        } else {
            this.feeModalStudents = [];
        }
        this.isFeeModalOpen = true;
    }

    openEditFeeModal(fee: any) {
        const sid = fee.studentId?._id || fee.studentId;
        this.currentFee = { ...fee, studentId: sid };
        this.originalFeeId = fee._id;
        this.feeSaveError = '';
        this.feeSaveSuccess = '';
        // Pre-load course & students for edit (use cache)
        this.feeModalCourseId = fee.courseId || '';
        if (this.feeModalCourseId) {
            const cached = this.courseStudentsCache.get(this.feeModalCourseId);
            if (cached) {
                this.feeModalStudents = cached;
            } else {
                this.feeModalStudentsLoading = true;
                this.api.getStudentsByCourse(this.feeModalCourseId).subscribe({
                    next: (students: any[]) => {
                        this.courseStudentsCache.set(this.feeModalCourseId, students);
                        this.feeModalStudents = students;
                        this.feeModalStudentsLoading = false;
                        this.cdr.detectChanges();
                    },
                    error: () => { this.feeModalStudentsLoading = false; this.cdr.detectChanges(); }
                });
            }
        } else {
            this.feeModalStudents = [];
        }
        this.isFeeModalOpen = true;
    }

    closeFeeModal() {
        this.isFeeModalOpen = false;
        this.currentFee = null;
        this.originalFeeId = null;
        this.feeModalCourseId = '';
        this.feeModalStudents = [];
    }

    onFeeModalCourseChange() {
        this.currentFee.studentId = '';
        this.currentFee.courseId = this.feeModalCourseId;
        if (!this.feeModalCourseId) {
            this.feeModalStudents = [];
            return;
        }
        // Use cached students for this course if available
        const cached = this.courseStudentsCache.get(this.feeModalCourseId);
        if (cached) {
            this.feeModalStudents = cached;
            return;
        }
        this.feeModalStudentsLoading = true;
        this.api.getStudentsByCourse(this.feeModalCourseId).subscribe({
            next: (students: any[]) => {
                this.courseStudentsCache.set(this.feeModalCourseId, students);
                this.feeModalStudents = students;
                this.feeModalStudentsLoading = false;
                this.cdr.detectChanges();
            },
            error: () => { this.feeModalStudentsLoading = false; this.cdr.detectChanges(); }
        });
    }

    onFeeStudentChange() {
        if (!this.currentFee?.studentId) return;
        this.currentFee.courseId = this.feeModalCourseId;
    }

    saveFee() {
        if (!this.currentFee || this.feeSaving) return;
        this.feeSaveError = '';
        this.feeSaveSuccess = '';
        if (!this.currentFee.studentId) { this.feeSaveError = 'Please select a student'; return; }
        if (!this.currentFee.title?.trim()) { this.feeSaveError = 'Title is required'; return; }
        if (!this.currentFee.amount || this.currentFee.amount <= 0) { this.feeSaveError = 'Amount must be greater than 0'; return; }
        if (!this.currentFee.dueDate) { this.feeSaveError = 'Due date is required'; return; }

        this.feeSaving = true;
        const payload = { ...this.currentFee };

        if (!this.originalFeeId) {
            this.api.createAdminFee(payload).subscribe({
                next: (data: any) => {
                    const sid = data.studentId?.toString() || data.studentId;
                    const name = this.studentNameMap.get(sid) ?? this.students.find(s => s._id === sid)?.name ?? 'Unknown';
                    this.adminFees = [{ ...data, studentName: name }, ...this.adminFees];
                    this._feesSummaryDirty = true;
                    this.feeSaving = false;
                    this.closeFeeModal();
                    this.loadStats();
                    this.showToast('Fee record created!');
                },
                error: (err: any) => {
                    this.feeSaveError = err?.error?.message || 'Failed to create fee';
                    this.feeSaving = false;
                    this.cdr.detectChanges();
                }
            });
        } else {
            this.api.updateAdminFee(this.originalFeeId, payload).subscribe({
                next: (data: any) => {
                    const idx = this.adminFees.findIndex(f => f._id === this.originalFeeId);
                    if (idx !== -1) {
                        const updated = [...this.adminFees];
                        updated[idx] = { ...data, studentName: this.adminFees[idx].studentName };
                        this.adminFees = updated;
                    }
                    this._feesSummaryDirty = true;
                    this.feeSaving = false;
                    this.closeFeeModal();
                    this.loadStats();
                    this.showToast('Fee record updated!');
                },
                error: (err: any) => {
                    this.feeSaveError = err?.error?.message || 'Failed to update fee';
                    this.feeSaving = false;
                    this.cdr.detectChanges();
                }
            });
        }
    }

    deleteAdminFee(id: string) {
        if (!confirm('Delete this fee record?')) return;
        this.api.deleteAdminFee(id).subscribe({
            next: () => {
                this.adminFees = this.adminFees.filter(f => f._id !== id);
                this._feesSummaryDirty = true;
                this.loadStats();
                this.showToast('Fee record deleted.');
            }
        });
    }

    deleteAllFeesForStudent(studentId: string, studentName: string) {
        const fees = this.adminFees.filter(f => (f.studentId?._id || f.studentId) === studentId);
        if (!fees.length) return;
        if (!confirm(`Delete all ${fees.length} fee records for ${studentName}? This cannot be undone.`)) return;
        let remaining = fees.length;
        let anyError = false;
        fees.forEach(fee => {
            this.api.deleteAdminFee(fee._id).subscribe({
                next: () => {
                    this.adminFees = this.adminFees.filter(f => f._id !== fee._id);
                    this._feesSummaryDirty = true;
                    remaining--;
                    if (remaining === 0) {
                        this.expandedFeeStudentId = null;
                        this.loadStats();
                        this.showToast(anyError ? 'Some records could not be deleted.' : `All fees for ${studentName} deleted.`);
                    }
                },
                error: () => { anyError = true; remaining--; }
            });
        });
    }

    feeCountByStatus(fees: any[], ...statuses: string[]): number {
        return fees.filter(f => statuses.includes(f.status)).length;
    }

    // ── Bulk fee update ──────────────────────────────────────────
    isBulkFeeModalOpen = false;
    bulkFeeEntry: any = null;
    bulkFeeSaving = false;
    bulkFeeError = '';

    openBulkFeeModal(entry: any) {
        this.bulkFeeEntry = entry;
        this.bulkFeeError = '';
        this.isBulkFeeModalOpen = true;
    }

    closeBulkFeeModal() {
        this.isBulkFeeModalOpen = false;
        this.bulkFeeEntry = null;
        this.bulkFeeSaving = false;
        this.bulkFeeError = '';
    }

    saveBulkFeeStatus(status: 'paid' | 'pending') {
        if (!this.bulkFeeEntry || this.bulkFeeSaving) return;
        const fees = this.bulkFeeEntry.fees as any[];
        if (!fees.length) return;
        this.bulkFeeSaving = true;
        this.bulkFeeError = '';
        let remaining = fees.length;
        let anyError = false;
        const paidDate = status === 'paid' ? new Date().toISOString().split('T')[0] : null;
        fees.forEach(fee => {
            const payload = { ...fee, status, ...(paidDate ? { paidDate } : { paidDate: null }) };
            this.api.updateAdminFee(fee._id, payload).subscribe({
                next: (data: any) => {
                    const idx = this.adminFees.findIndex(f => f._id === fee._id);
                    if (idx !== -1) {
                        const updated = [...this.adminFees];
                        updated[idx] = { ...data, studentName: this.adminFees[idx].studentName };
                        this.adminFees = updated;
                    }
                    remaining--;
                    if (remaining === 0) {
                        this._feesSummaryDirty = true;
                        this.bulkFeeSaving = false;
                        if (anyError) {
                            this.bulkFeeError = 'Some records could not be updated.';
                        } else {
                            this.closeBulkFeeModal();
                            this.loadStats();
                            this.showToast(`All fees marked as ${status}.`);
                        }
                        this.cdr.detectChanges();
                    }
                },
                error: () => {
                    anyError = true;
                    remaining--;
                    if (remaining === 0) {
                        this.bulkFeeSaving = false;
                        this.bulkFeeError = 'Some records could not be updated.';
                        this.cdr.detectChanges();
                    }
                }
            });
        });
    }

}
