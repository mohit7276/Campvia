import { Component, ElementRef, OnInit, OnDestroy, ViewChild, AfterViewInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { COURSES } from '../../constants';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

interface LandingCourse {
    _id: string;
    title: string;
    category: string;
    duration: string;
    image: string;
    description: string;
    rating: number;
}

@Component({
    selector: 'app-courses',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './courses.component.html',
    styleUrls: ['./courses.component.css']
})
export class CoursesComponent implements OnInit, OnDestroy, AfterViewInit {
    private api = inject(ApiService);
    private dataService = inject(DataService);
    private router = inject(Router);
    authService = inject(AuthService);

    filter = 'All';
    searchQuery = '';
    hasEntered = false;
    isLoading = true;

    // Single signal used for all users — always populated from the public landing endpoint
    landingCourses = signal<LandingCourse[]>([]);

    get categories(): string[] {
        return ['All', ...Array.from(new Set(this.landingCourses().map(c => c.category).filter(Boolean)))];
    }

    // Admin modal state
    isModalOpen = false;
    isSaving = false;
    isDeleteConfirmOpen = false;
    deleteTargetId = '';
    saveError = '';
    saveSuccess = '';

    // Toast notification
    toast = { visible: false, message: '', success: true };
    private toastTimer: any;
    showToast(message: string, success = true) {
        clearTimeout(this.toastTimer);
        this.toast = { visible: true, message, success };
        this.toastTimer = setTimeout(() => { this.toast.visible = false; }, 3000);
    }
    editingCourse: Partial<LandingCourse> & { isNew?: boolean } = {};
    previewError = false;
    imageUrlWarning = '';

    /** Detects search-page URLs and tries to extract the real direct image URL. */
    private extractDirectImageUrl(url: string): string | null {
        try {
            const p = new URL(url);
            // Google Images: google.com/imgres?imgurl=<actual-url>
            if (p.hostname.includes('google.') && p.pathname.includes('imgres')) {
                return p.searchParams.get('imgurl');
            }
            // Bing Images: bing.com/images/... with mediaurl param
            if (p.hostname.includes('bing.com') && p.searchParams.has('mediaurl')) {
                return p.searchParams.get('mediaurl');
            }
        } catch { }
        return null;
    }

    onImageUrlChange(url: string) {
        this.previewError = false;
        this.imageUrlWarning = '';
        if (!url) return;
        const extracted = this.extractDirectImageUrl(url);
        if (extracted) {
            // Auto-replace with the actual direct image URL
            this.editingCourse = { ...this.editingCourse, image: extracted };
            this.imageUrlWarning = '';
        } else if (
            url.includes('google.com/search') ||
            url.includes('google.com/imgres') ||
            url.includes('bing.com/images') ||
            url.includes('pinterest.') ||
            url.includes('instagram.com') ||
            url.includes('facebook.com')
        ) {
            this.imageUrlWarning = 'This looks like a search/social page URL, not a direct image. Right-click the image → "Copy image address" to get the real URL.';
        }
    }

    private observer: IntersectionObserver | null = null;
    @ViewChild('sectionRef') sectionRef!: ElementRef;

    ngOnInit() {
        this.loadCourses();
    }

    loadCourses() {
        this.isLoading = true;
        // Always use the public landing endpoint — same data for all users
        this.api.getLandingCourses().subscribe({
            next: (data: any[]) => {
                if (data && data.length > 0) {
                    this.landingCourses.set(data.map(c => ({
                        _id: c._id,
                        title: c.title || '',
                        category: c.category || '',
                        duration: c.duration || '',
                        image: this.extractDirectImageUrl(c.image) || c.image || '',
                        description: c.description || '',
                        rating: c.rating || 0
                    })));
                } else {
                    this.landingCourses.set(COURSES.map(c => ({ ...c, _id: c.id })));
                }
                this.isLoading = false;
            },
            error: () => {
                this.landingCourses.set(COURSES.map(c => ({ ...c, _id: c.id })));
                this.isLoading = false;
            }
        });
    }

    get filteredCourses(): LandingCourse[] {
        return this.landingCourses().filter(c => {
            const matchesCat = this.filter === 'All' || c.category === this.filter;
            const q = this.searchQuery.toLowerCase();
            const matchesSearch = c.title.toLowerCase().includes(q) ||
                c.description.toLowerCase().includes(q);
            return matchesCat && matchesSearch;
        });
    }

    setFilter(cat: string) {
        this.filter = cat;
    }

    applyNow() {
        this.router.navigate(['/register']);
    }

    get isAdmin(): boolean {
        return this.authService.currentUser()?.role === 'admin';
    }

    openAddModal() {
        this.previewError = false;
        this.imageUrlWarning = '';
        this.editingCourse = { isNew: true, title: '', category: '', duration: '', image: '', description: '', rating: 4.5 };
        this.saveError = '';
        this.saveSuccess = '';
        this.isModalOpen = true;
    }

    openEditModal(course: LandingCourse) {
        this.previewError = false;
        this.imageUrlWarning = '';
        this.editingCourse = { ...course, isNew: false };
        this.saveError = '';
        this.saveSuccess = '';
        this.isModalOpen = true;
    }

    closeModal() {
        this.isModalOpen = false;
        this.editingCourse = {};
    }

    saveCourse() {
        if (this.isSaving) return;
        const c = this.editingCourse;
        if (!c.title?.trim()) { this.saveError = 'Title is required.'; return; }
        if (!c.category?.trim()) { this.saveError = 'Category is required.'; return; }
        if (!c.duration?.trim()) { this.saveError = 'Duration is required.'; return; }
        if (!c.image?.trim()) { this.saveError = 'Image URL is required.'; return; }

        // Auto-fix any stored Google/Bing search page URLs before saving
        const cleanImage = this.extractDirectImageUrl(c.image) || c.image;
        c.image = cleanImage;

        this.saveError = '';
        this.isSaving = true;

        if (c.isNew) {
            const ts = Date.now().toString(36).toUpperCase();
            this.api.createLandingCourse({
                courseId: `LC-${ts}`,
                name: c.title,
                duration: c.duration,
                type: 'Undergraduate',
                subjects: [],
                totalFees: 0,
                title: c.title,
                category: c.category,
                image: c.image,
                description: c.description || '',
                rating: +(c.rating || 0)
            }).subscribe({
                next: () => {
                    this.loadCourses();         // reload landing signal
                    this.dataService.loadCourses(); // keep admin panel in sync
                    this.isSaving = false;
                    this.closeModal();
                    this.showToast('Course added successfully!');
                },
                error: (err: any) => {
                    this.saveError = err?.error?.message || 'Failed to save.';
                    this.isSaving = false;
                }
            });
        } else {
            // c._id is the mongo _id from the landing endpoint response
            this.api.updateLandingCourse(c._id!, {
                title: c.title,
                category: c.category,
                duration: c.duration,
                image: c.image,
                description: c.description || '',
                rating: +(c.rating || 0)
            }).subscribe({
                next: () => {
                    this.loadCourses();         // reload landing signal
                    this.dataService.loadCourses(); // keep admin panel in sync
                    this.isSaving = false;
                    this.closeModal();
                    this.showToast('Course updated successfully!');
                },
                error: (err: any) => {
                    this.saveError = err?.error?.message || 'Failed to update.';
                    this.isSaving = false;
                }
            });
        }
    }

    confirmDelete(courseId: string) {
        this.deleteTargetId = courseId;
        this.isDeleteConfirmOpen = true;
    }

    cancelDelete() {
        this.isDeleteConfirmOpen = false;
        this.deleteTargetId = '';
    }

    executeDelete() {
        const id = this.deleteTargetId; // mongo _id from landing endpoint
        this.api.deleteLandingCourse(id).subscribe({
            next: () => {
                this.loadCourses();         // reload landing signal
                this.dataService.loadCourses(); // keep admin panel in sync
                this.isDeleteConfirmOpen = false;
                this.deleteTargetId = '';
            },
            error: (err: any) => {
                alert(err?.error?.message || 'Failed to delete.');
                this.isDeleteConfirmOpen = false;
            }
        });
    }

    ngAfterViewInit() {
        this.observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !this.hasEntered) {
                    this.hasEntered = true;
                }
            },
            { threshold: 0.1 }
        );
        if (this.sectionRef?.nativeElement) {
            this.observer.observe(this.sectionRef.nativeElement);
        }
    }

    ngOnDestroy() {
        this.observer?.disconnect();
    }

    onImageError(event: any) {
        // Prevent infinite loop if the fallback URL also fails to load
        if (event.target.dataset.errorHandled) return;
        event.target.dataset.errorHandled = 'true';
        event.target.src = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80';
    }
}