import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

interface PublicCourse {
    _id: string;
    courseId: string;
    name: string;
    title: string;
    category: string;
    duration: string;
}

@Component({
    selector: 'app-auth-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './auth-modal.component.html',
    styleUrls: ['./auth-modal.component.css']
})
export class AuthModalComponent implements OnInit, OnDestroy, OnChanges {
    private authService = inject(AuthService);
    private api = inject(ApiService);
    private cdr = inject(ChangeDetectorRef);

    @Input() isOpen = false;
    @Input() initialMode: 'login' | 'register' = 'login';
    @Output() close = new EventEmitter<void>();
    @Output() loginSuccess = new EventEmitter<{ role: 'student' | 'faculty' | 'admin', email: string }>();

    mode: 'login' | 'register' = 'login';
    role: 'student' | 'faculty' | 'admin' = 'student';
    isLoading = false;

    name = '';
    email = '';
    password = '';
    selectedCourseId = '';
    courseOptions: PublicCourse[] = [];
    coursesLoading = false;
    errorMessage = '';
    private courseCatalogSubscription?: Subscription;

    ngOnInit() {
        this.courseCatalogSubscription = this.api.courseCatalogChanged$.subscribe(() => {
            if (this.isOpen && this.mode === 'register') {
                this.loadCourses();
            }
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['isOpen']?.currentValue) {
            this.mode = this.initialMode;
            if (this.mode === 'register') {
                this.selectedCourseId = '';
            }
            document.body.style.overflow = 'hidden';
            if (this.mode === 'register') {
                this.loadCourses();
            }
        } else if (changes['isOpen'] && !changes['isOpen'].currentValue) {
            document.body.style.overflow = 'unset';
        }
    }

    ngOnDestroy() {
        document.body.style.overflow = 'unset';
        this.courseCatalogSubscription?.unsubscribe();
    }

    async handleSubmit() {
        this.errorMessage = '';

        if (!this.email || !this.password) {
            this.errorMessage = 'fill the details';
            return;
        }

        if (this.mode === 'register' && !this.name) {
            this.errorMessage = 'fill the details';
            return;
        }

        if (this.mode === 'register' && !this.selectedCourseId) {
            this.errorMessage = 'select a course';
            return;
        }

        this.isLoading = true;

        try {
            if (this.mode === 'register') {
                const selectedCourse = this.courseOptions.find(course => course.courseId === this.selectedCourseId);
                await this.authService.registerWithApi(
                    this.name,
                    this.email,
                    this.password,
                    this.role,
                    this.selectedCourseId,
                    selectedCourse?.title || selectedCourse?.name || ''
                );
            } else {
                await this.authService.loginWithApi(this.email, this.password, this.role);
            }

            this.isLoading = false;
            const user = this.authService.currentUser();
            this.loginSuccess.emit({
                role: user?.role || this.role,
                email: user?.email || this.email
            });
        } catch (err: any) {
            this.isLoading = false;
            if (err?.status === 400 || err?.status === 401) {
                this.errorMessage = 'Invalid details';
            } else {
                this.errorMessage = err?.error?.message || 'Login failed. Please check your credentials.';
            }
            this.cdr.detectChanges();
        }
    }

    setMode(m: 'login' | 'register') {
        this.mode = m;
        if (m === 'register' && this.courseOptions.length === 0) {
            this.selectedCourseId = '';
            this.loadCourses();
        } else if (m === 'register') {
            this.selectedCourseId = '';
        }
    }

    setRole(r: 'student' | 'faculty' | 'admin') {
        this.role = r;
        this.email = '';
        this.password = '';
        this.errorMessage = '';
    }

    private loadCourses() {
        if (this.coursesLoading) return;
        this.coursesLoading = true;

        this.api.getPublicCourses().subscribe({
            next: (courses: PublicCourse[]) => {
                this.courseOptions = Array.isArray(courses) ? courses : [];
                if (this.selectedCourseId && !this.courseOptions.some(course => course.courseId === this.selectedCourseId)) {
                    this.selectedCourseId = '';
                }
                this.coursesLoading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.courseOptions = [];
                this.coursesLoading = false;
                this.cdr.detectChanges();
            }
        });
    }
}
