import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';
import { HeroComponent } from '../hero/hero.component';
import { StatsComponent } from '../stats/stats.component';
import { AboutComponent } from '../about/about.component';
import { CoursesComponent } from '../courses/courses.component';
import { ContactComponent } from '../contact/contact.component';
import { FooterComponent } from '../footer/footer.component';
import { AuthModalComponent } from '../auth-modal/auth-modal.component';
import { ChatBotComponent } from '../chat-bot/chat-bot.component';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [
        CommonModule,
        NavbarComponent,
        HeroComponent,
        StatsComponent,
        AboutComponent,
        CoursesComponent,
        ContactComponent,
        FooterComponent,
        AuthModalComponent,
        ChatBotComponent
    ],
    templateUrl: './landing.component.html',
    styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {
    scrolled = false;
    scrollProgress = 0;
    authOpen = false;
    authMode: 'login' | 'register' = 'login';
    chatOpen = false;

    scanLectureId: string | null = null;
    scanToken: string | null = null;
    private readonly pendingScanStorageKey = 'pending_scan_lecture_id';
    private readonly pendingScanTokenStorageKey = 'pending_scan_qr_token';

    constructor(
        public authService: AuthService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit() {
        this.checkScroll();
        this.route.queryParams.subscribe(params => {
            if (params['scan']) {
                const scanId = String(params['scan']);
                const token = params['qr'] ? String(params['qr']) : '';
                this.scanLectureId = scanId;
                this.scanToken = token || null;
                sessionStorage.setItem(this.pendingScanStorageKey, scanId);
                if (token) {
                    sessionStorage.setItem(this.pendingScanTokenStorageKey, token);
                }
                // Force open login if there's a scan intent and not logged in
                if (!this.authService.isLoggedIn()) {
                    this.openAuth('login');
                } else if (this.authService.currentUser()?.role === 'student') {
                    const queryParams: Record<string, string> = { scan: this.scanLectureId };
                    if (this.scanToken) queryParams['qr'] = this.scanToken;
                    this.router.navigate(['/dashboard'], { queryParams });
                }
            } else {
                const persistedScanId = sessionStorage.getItem(this.pendingScanStorageKey);
                const persistedScanToken = sessionStorage.getItem(this.pendingScanTokenStorageKey);
                if (persistedScanId) {
                    this.scanLectureId = persistedScanId;
                }
                if (persistedScanToken) {
                    this.scanToken = persistedScanToken;
                }
            }
        });
    }

    @HostListener('window:scroll', [])
    onWindowScroll() {
        this.checkScroll();
    }

    checkScroll() {
        this.scrolled = window.scrollY > 20;
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (window.scrollY / totalHeight) * 100;
        this.scrollProgress = progress;
    }

    openAuth(mode: 'login' | 'register') {
        this.authMode = mode;
        this.authOpen = true;
    }

    closeAuth() {
        this.authOpen = false;
    }

    handleLoginSuccess(event: { role: any, email: string }) {
        this.authOpen = false;

        const role = this.authService.currentUser()?.role || event.role;

        if (role === 'admin' || role === 'faculty') {
            this.router.navigate([role === 'faculty' ? '/faculty' : '/admin']);
            return;
        }

        if (this.scanLectureId) {
            const queryParams: Record<string, string> = { scan: this.scanLectureId };
            if (this.scanToken) queryParams['qr'] = this.scanToken;
            this.router.navigate(['/dashboard'], { queryParams });
            return;
        }

        this.router.navigate(['/dashboard']);
    }

    handleLogout() {
        this.authService.logout();
    }

    handleDashboardClick() {
        if (this.authService.isLoggedIn()) {
            const currentRole = this.authService.currentUser()?.role;
            if (currentRole === 'admin' || currentRole === 'faculty') {
                this.router.navigate([currentRole === 'faculty' ? '/faculty' : '/admin']);
            } else {
                const queryParams: Record<string, string> = {};
                if (this.scanLectureId) queryParams['scan'] = this.scanLectureId;
                if (this.scanToken) queryParams['qr'] = this.scanToken;
                this.router.navigate(['/dashboard'], { queryParams });
            }
        } else {
            this.openAuth('login');
        }
    }

    toggleChat() {
        this.chatOpen = !this.chatOpen;
    }

    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}
