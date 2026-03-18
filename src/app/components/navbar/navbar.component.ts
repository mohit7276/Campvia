import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NAV_LINKS } from '../../constants';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
    @Input() scrolled = false;
    @Input() isLoggedIn = false;
    @Input() userRole: string | undefined = 'student';
    @Output() authClick = new EventEmitter<'login' | 'register'>();
    @Output() logout = new EventEmitter<void>();
    @Output() dashboardClick = new EventEmitter<void>();
    @Output() homeClick = new EventEmitter<void>();

    isOpen = false;
    navLinks = NAV_LINKS;

    toggleMenu() {
        this.isOpen = !this.isOpen;
    }

    handleAuthClick(mode: 'login' | 'register') {
        this.authClick.emit(mode);
        this.isOpen = false;
    }

    handleLogout() {
        this.logout.emit();
        this.isOpen = false;
    }

    handleDashboardClick() {
        this.dashboardClick.emit();
        this.isOpen = false;
    }

    handleHomeClick() {
        if (this.homeClick.observers.length > 0) {
            this.homeClick.emit();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.isOpen = false;
    }
}
