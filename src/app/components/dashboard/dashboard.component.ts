import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { DashboardHomeComponent } from '../dashboard-home/dashboard-home.component';
import { AssignmentPageComponent } from '../assignment-page/assignment-page.component';
import { TimetablePageComponent } from '../timetable-page/timetable-page.component';
import { FeesPageComponent } from '../fees-page/fees-page.component';
import { UpcomingTestsPageComponent } from '../upcoming-tests-page/upcoming-tests-page.component';
import { NoticePageComponent } from '../notice-page/notice-page.component';
import { TodoListPageComponent } from '../todo-list-page/todo-list-page.component';
import { ClassmatesPageComponent } from '../classmates-page/classmates-page.component';
import { FacultyPageComponent } from '../faculty-page/faculty-page.component';
import { ProfilePageComponent } from '../profile-page/profile-page.component';
import { UserTodo } from '../../types';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        DashboardHomeComponent,
        AssignmentPageComponent,
        TimetablePageComponent,
        FeesPageComponent,
        UpcomingTestsPageComponent,
        NoticePageComponent,
        TodoListPageComponent,
        ClassmatesPageComponent,
        FacultyPageComponent,
        ProfilePageComponent
    ],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    private api = inject(ApiService);
    private cdr = inject(ChangeDetectorRef);
    activeSection = 'home';
    isSidebarOpen = false;
    initialScanId: string | null = null;
    private readonly pendingScanStorageKey = 'pending_scan_lecture_id';
    private readonly pendingScanTokenStorageKey = 'pending_scan_qr_token';

    navItems = [
        { id: 'home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Dashboard Home' },
        { id: 'profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', label: 'Student Profile' },
        { id: 'notices', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', label: 'Campus Notices' },
        { id: 'fees', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Fees Payment' },
        { id: 'plans', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', label: 'Personal To-Do List' },
        { id: 'classmates', icon: 'M6 9c-.553 0-1 .447-1 1v2H3.5C1.567 12 0 13.567 0 15.5V21c0 1.105.895 2 2 2h10c1.105 0 2-.895 2-2v-5.5c0-1.933-1.567-3.5-3.5-3.5H7v-2c0-.553-.447-1-1-1zm10 0c-.553 0-1 .447-1 1v2h-2.5c-1.933 0-3.5 1.567-3.5 3.5V21c0 1.105.895 2 2 2h10c1.105 0 2-.895 2-2v-5.5c0-1.933-1.567-3.5-3.5-3.5H17v-2c0-.553-.447-1-1-1z', label: 'Classmates Contact' },
        { id: 'faculty', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z', label: 'Faculty Details' },
        { id: 'assignments', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', label: 'Assignments' },
        { id: 'upcoming-tests', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Exams & Results' },
    ];

    userTodos: UserTodo[] = [];
    saving = false;
    noCourseAssigned = false;

    constructor(
        public authService: AuthService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit() {
        if (!this.authService.isLoggedIn()) {
            this.router.navigate(['/']);
            return;
        }

        // Always refresh user data from DB so admin changes (course assignment, etc.) are reflected
        this.authService.refreshUser().then(() => {
            const user = this.authService.currentUser();
            if (user && user.role === 'student' && (!user.courseId || user.courseId === '')) {
                this.noCourseAssigned = true;
            } else {
                this.noCourseAssigned = false;
            }
            this.cdr.detectChanges();
        });

        this.api.getTodos().subscribe(data => {
            this.userTodos = data.map((t: any) => ({ ...t, id: t._id || t.id }));
            this.cdr.detectChanges();
        });

        this.route.queryParams.subscribe(params => {
            if (params['scan'] !== undefined || params['qr'] !== undefined) {
                const scanId = params['scan'] ? String(params['scan']) : '';
                this.initialScanId = scanId;
                if (scanId) {
                    sessionStorage.setItem(this.pendingScanStorageKey, scanId);
                }
                const scanToken = params['qr'] ? String(params['qr']) : (params['token'] ? String(params['token']) : '');
                if (scanToken) {
                    sessionStorage.setItem(this.pendingScanTokenStorageKey, scanToken);
                } else {
                    sessionStorage.removeItem(this.pendingScanTokenStorageKey);
                }
                this.activeSection = 'timetable';
                return;
            }

            const persistedScanId = sessionStorage.getItem(this.pendingScanStorageKey);
            if (persistedScanId) {
                this.initialScanId = persistedScanId;
                this.activeSection = 'timetable';
            }
        });
    }

    toggleSidebar() {
        this.isSidebarOpen = !this.isSidebarOpen;
    }

    handleLogout() {
        this.authService.logout();
        this.router.navigate(['/']);
    }

    navigateTo(section: string) {
        // Study materials is intentionally removed from student dashboard.
        this.activeSection = (section === 'materials' || section === 'subjects') ? 'home' : section;
        if (window.innerWidth < 1024) {
            this.isSidebarOpen = false;
        }
    }

    handleAddTodo(todo: Omit<UserTodo, 'id' | 'completed'>) {
        if (this.saving) return;
        this.saving = true;
        this.api.createTodo({ ...todo, completed: false }).subscribe({
            next: (created: any) => {
                const newTodo: UserTodo = { ...todo, id: created._id || created.id, completed: false };
                this.userTodos = [...this.userTodos, newTodo];
                this.saving = false;
                this.cdr.detectChanges();
            },
            error: () => { this.saving = false; this.cdr.detectChanges(); }
        });
    }

    handleToggleTodo(id: string) {
        if (this.saving) return;
        const todo = this.userTodos.find(t => t.id === id);
        if (!todo) return;
        this.saving = true;
        this.api.updateTodo(id, { completed: !todo.completed }).subscribe({
            next: () => {
                this.userTodos = this.userTodos.map(t =>
                    t.id === id ? { ...t, completed: !t.completed } : t
                );
                this.saving = false;
                this.cdr.detectChanges();
            },
            error: () => { this.saving = false; this.cdr.detectChanges(); }
        });
    }

    handleDeleteTodo(id: string) {
        if (this.saving) return;
        this.saving = true;
        this.api.deleteTodo(id).subscribe({
            next: () => {
                this.userTodos = this.userTodos.filter(t => t.id !== id);
                this.saving = false;
                this.cdr.detectChanges();
            },
            error: () => { this.saving = false; this.cdr.detectChanges(); }
        });
    }

    handleUpdateTodo(event: { id: string, todo: Partial<UserTodo> }) {
        if (this.saving) return;
        this.saving = true;
        this.api.updateTodo(event.id, event.todo).subscribe({
            next: () => {
                this.userTodos = this.userTodos.map(t =>
                    t.id === event.id ? { ...t, ...event.todo } : t
                );
                this.saving = false;
                this.cdr.detectChanges();
            },
            error: () => { this.saving = false; this.cdr.detectChanges(); }
        });
    }

    handleBackToSite() {
        this.router.navigate(['/']);
    }
}
