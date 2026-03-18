import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private api = inject(ApiService);

    // Using signals for reactive state
    isLoggedIn = signal(false);
    currentUser = signal<{ name: string; email: string; role: 'student' | 'faculty' | 'admin'; courseId?: string; course?: string; semester?: string | number; status?: string; avatar?: string } | null>(null);

    constructor() {
        // Restore session from sessionStorage (per-tab)
        const token = sessionStorage.getItem('auth_token');
        const userData = sessionStorage.getItem('auth_user');
        if (token && userData) {
            try {
                const user = JSON.parse(userData);
                this.isLoggedIn.set(true);
                this.currentUser.set(user);
            } catch {
                sessionStorage.removeItem('auth_token');
                sessionStorage.removeItem('auth_user');
            }
        }
    }

    loginWithApi(email: string, password: string, role: 'student' | 'faculty' | 'admin' = 'student'): Promise<any> {
        return new Promise((resolve, reject) => {
            this.api.login(email, password, role).subscribe({
                next: (res: any) => {
                    sessionStorage.setItem('auth_token', res.token);
                    const user = { name: res.user.name, email: res.user.email, role: res.user.role, courseId: res.user.courseId || '', course: res.user.course || '', semester: res.user.semester || '', status: res.user.status || 'active', avatar: res.user.avatar || '' };
                    sessionStorage.setItem('auth_user', JSON.stringify(user));
                    this.isLoggedIn.set(true);
                    this.currentUser.set(user);
                    resolve(res);
                },
                error: (err: any) => reject(err)
            });
        });
    }

    registerWithApi(name: string, email: string, password: string, role: 'student' | 'faculty' | 'admin' = 'student'): Promise<any> {
        return new Promise((resolve, reject) => {
            this.api.register(name, email, password, role).subscribe({
                next: (res: any) => {
                    sessionStorage.setItem('auth_token', res.token);
                    const user = { name: res.user.name, email: res.user.email, role: res.user.role, courseId: res.user.courseId || '', course: res.user.course || '', semester: res.user.semester || '', status: res.user.status || 'active', avatar: res.user.avatar || '' };
                    sessionStorage.setItem('auth_user', JSON.stringify(user));
                    this.isLoggedIn.set(true);
                    this.currentUser.set(user);
                    resolve(res);
                },
                error: (err: any) => reject(err)
            });
        });
    }

    login(email: string, role: 'student' | 'faculty' | 'admin' = 'student') {
        this.isLoggedIn.set(true);
        this.currentUser.set({
            name: role === 'admin' ? 'Administrator' : role === 'faculty' ? 'Faculty Member' : 'Student User',
            email: email,
            role: role
        });
    }

    logout() {
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_user');
        this.isLoggedIn.set(false);
        this.currentUser.set(null);
    }

    /** Re-fetch user data from the server and update the session. */
    refreshUser(): Promise<void> {
        return new Promise((resolve) => {
            this.api.getMe().subscribe({
                next: (res: any) => {
                    if (res?.user) {
                        const u = res.user;
                        const user = {
                            name: u.name,
                            email: u.email,
                            role: u.role,
                            courseId: u.courseId || '',
                            course: u.course || '',
                            semester: u.semester || '',
                            status: u.status || 'active',
                            avatar: u.avatar || ''
                        };
                        sessionStorage.setItem('auth_user', JSON.stringify(user));
                        this.currentUser.set(user);
                    }
                    resolve();
                },
                error: () => resolve()
            });
        });
    }
}
