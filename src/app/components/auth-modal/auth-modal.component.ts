import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-auth-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './auth-modal.component.html',
    styleUrls: ['./auth-modal.component.css']
})
export class AuthModalComponent implements OnInit, OnDestroy, OnChanges {
    private authService = inject(AuthService);
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
    errorMessage = '';

    ngOnInit() { }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['isOpen']?.currentValue) {
            this.mode = this.initialMode;
            document.body.style.overflow = 'hidden';
        } else if (changes['isOpen'] && !changes['isOpen'].currentValue) {
            document.body.style.overflow = 'unset';
        }
    }

    ngOnDestroy() {
        document.body.style.overflow = 'unset';
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

        this.isLoading = true;

        try {
            if (this.mode === 'register') {
                await this.authService.registerWithApi(
                    this.name,
                    this.email,
                    this.password,
                    this.role
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
    }

    setRole(r: 'student' | 'faculty' | 'admin') {
        this.role = r;
        this.email = '';
        this.password = '';
        this.errorMessage = '';
    }
}
