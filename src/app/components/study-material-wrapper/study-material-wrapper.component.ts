import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { StudyMaterialPageComponent } from '../study-material-page/study-material-page.component';
import { AuthModalComponent } from '../auth-modal/auth-modal.component';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-study-material-wrapper',
    standalone: true,
    imports: [CommonModule, NavbarComponent, FooterComponent, StudyMaterialPageComponent, AuthModalComponent],
    template: `
    <div class="min-h-screen bg-slate-50">
      <app-navbar 
        [scrolled]="true" 
        [isLoggedIn]="authService.isLoggedIn()"
        [userRole]="authService.currentUser()?.role || 'student'"
        (authClick)="openAuth($event)"
        (logout)="handleLogout()"
        (dashboardClick)="handleDashboardClick()"
        (homeClick)="handleHomeClick()"
      ></app-navbar>
      
      <app-study-material-page [isDashboard]="false" (back)="handleHomeClick()"></app-study-material-page>
      
      <app-footer></app-footer>

      <app-auth-modal 
        [isOpen]="authOpen" 
        [initialMode]="authMode" 
        (close)="closeAuth()" 
        (loginSuccess)="handleLoginSuccess($event)"
      ></app-auth-modal>
    </div>
  `
})
export class StudyMaterialWrapperComponent {
    authOpen = false;
    authMode: 'login' | 'register' = 'login';

    constructor(public authService: AuthService, private router: Router) { }

    openAuth(mode: 'login' | 'register') {
        this.authMode = mode;
        this.authOpen = true;
    }

    closeAuth() {
        this.authOpen = false;
    }

    handleLoginSuccess(event: { role: any, email: string }) {
        this.authService.login(event.email, event.role);
        this.authOpen = false;
        // Stay on the current page
    }

    handleLogout() {
        this.authService.logout();
        this.router.navigate(['/']);
    }

    handleDashboardClick() {
        if (this.authService.isLoggedIn()) {
            const role = this.authService.currentUser()?.role;
            if (role === 'admin' || role === 'faculty') {
                this.router.navigate([role === 'faculty' ? '/faculty' : '/admin']);
            } else {
                this.router.navigate(['/dashboard']);
            }
        } else {
            this.openAuth('login');
        }
    }

    handleHomeClick() {
        this.router.navigate(['/']);
    }
}
