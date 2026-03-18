import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-profile-page',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './profile-page.component.html',
    styleUrls: ['./profile-page.component.css']
})
export class ProfilePageComponent implements OnInit {
    private api = inject(ApiService);
    private cdr = inject(ChangeDetectorRef);
    private authService = inject(AuthService);
    private router = inject(Router);

    profile: any = null;
    loading = true;
    saving = false;

    profileRank: number = 0;
    profileAvgScore: number = 0;

    isEditing = false;
    editForm: any = {};

    // Password change
    showPasswordModal = false;
    currentPassword = '';
    newPassword = '';
    confirmPassword = '';
    passwordError = '';
    passwordSuccess = '';

    // Delete account
    showDeleteModal = false;

    // Messages
    successMessage = '';
    errorMessage = '';

    ngOnInit() {
        this.loadProfile();
    }

    loadProfile() {
        this.loading = true;
        this.api.getProfile().subscribe({
            next: (data: any) => {
                this.profile = data;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.loading = false;
                this.errorMessage = 'Failed to load profile';
                this.cdr.detectChanges();
            }
        });
        this.api.getMyRank().subscribe({
            next: (res: any) => {
                this.profileRank = res.rank || 0;
                this.profileAvgScore = res.avgScore || 0;
                this.cdr.detectChanges();
            },
            error: () => {}
        });
    }

    startEditing() {
        this.editForm = {
            name: this.profile.name || '',
            phone: this.profile.phone || '',
            address: this.profile.address || '',
            bio: this.profile.bio || '',
            specialization: this.profile.specialization || '',
            location: this.profile.location || '',
            avatar: this.profile.avatar || ''
        };
        this.isEditing = true;
        this.successMessage = '';
        this.errorMessage = '';
    }

    cancelEditing() {
        this.isEditing = false;
        this.editForm = {};
    }

    saveProfile() {
        if (this.saving) return;
        this.saving = true;
        this.successMessage = '';
        this.errorMessage = '';

        this.api.updateProfile(this.editForm).subscribe({
            next: (data: any) => {
                this.profile = data;
                this.isEditing = false;
                this.saving = false;
                this.successMessage = 'Profile updated successfully!';
                // Update auth service user data
                const currentUser = this.authService.currentUser();
                if (currentUser) {
                    const updated = { ...currentUser, name: data.name };
                    this.authService.currentUser.set(updated);
                    sessionStorage.setItem('auth_user', JSON.stringify(updated));
                }
                this.cdr.detectChanges();
                setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
            },
            error: (err: any) => {
                this.saving = false;
                this.errorMessage = err?.error?.message || 'Failed to update profile';
                this.cdr.detectChanges();
            }
        });
    }

    openPasswordModal() {
        this.showPasswordModal = true;
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.passwordError = '';
        this.passwordSuccess = '';
    }

    closePasswordModal() {
        this.showPasswordModal = false;
    }

    changePassword() {
        if (this.saving) return;
        this.passwordError = '';
        this.passwordSuccess = '';

        if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
            this.passwordError = 'All fields are required';
            return;
        }
        if (this.newPassword.length < 6) {
            this.passwordError = 'New password must be at least 6 characters';
            return;
        }
        if (this.newPassword !== this.confirmPassword) {
            this.passwordError = 'New passwords do not match';
            return;
        }

        this.saving = true;
        this.api.updateProfile({
            currentPassword: this.currentPassword,
            newPassword: this.newPassword
        }).subscribe({
            next: () => {
                this.saving = false;
                this.passwordSuccess = 'Password changed successfully!';
                this.cdr.detectChanges();
                setTimeout(() => { this.closePasswordModal(); this.cdr.detectChanges(); }, 1500);
            },
            error: (err: any) => {
                this.saving = false;
                this.passwordError = err?.error?.message || 'Failed to change password';
                this.cdr.detectChanges();
            }
        });
    }

    openDeleteModal() {
        this.showDeleteModal = true;
    }

    closeDeleteModal() {
        this.showDeleteModal = false;
    }

    deleteAccount() {
        if (this.saving) return;
        this.saving = true;
        this.api.deleteAccount().subscribe({
            next: () => {
                this.saving = false;
                this.authService.logout();
                this.router.navigate(['/']);
            },
            error: (err: any) => {
                this.saving = false;
                this.errorMessage = err?.error?.message || 'Failed to delete account';
                this.cdr.detectChanges();
            }
        });
    }

    getInitials(): string {
        if (!this.profile?.name) return '?';
        return this.profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }

    getStatusColor(): string {
        const s = (this.profile?.status || '').toLowerCase();
        if (s === 'active') return 'bg-emerald-50 text-emerald-600 border-emerald-200';
        if (s === 'inactive') return 'bg-slate-50 text-slate-600 border-slate-200';
        if (s === 'suspended') return 'bg-red-50 text-red-600 border-red-200';
        if (s === 'graduating') return 'bg-blue-50 text-blue-600 border-blue-200';
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
}
