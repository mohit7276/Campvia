import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, User, Phone, Mail, Building2, GraduationCap, ChevronRight, X, Briefcase, MapPin, BookOpen, Trophy, FileText, ExternalLink, PlayCircle } from 'lucide-angular';
import { Faculty } from '../../types';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-faculty-page',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './faculty-page.component.html',
    styleUrls: ['./faculty-page.component.css'],
    animations: [
        trigger('listAnimation', [
            transition('* => *', [
                query(':enter', [
                    style({ opacity: 0, scale: 0.9, transform: 'translateY(10px)' }),
                    stagger(50, [
                        animate('300ms ease-out', style({ opacity: 1, scale: 1, transform: 'translateY(0)' }))
                    ])
                ], { optional: true })
            ])
        ]),
        trigger('modalAnimation', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('300ms ease-out', style({ opacity: 1 }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ opacity: 0 }))
            ])
        ])
    ]
})
export class FacultyPageComponent implements OnInit {
    // Icons
    readonly Search = Search;
    readonly User = User;
    readonly Phone = Phone;
    readonly Mail = Mail;
    readonly Building2 = Building2;
    readonly GraduationCap = GraduationCap;
    readonly ChevronRight = ChevronRight;
    readonly X = X;
    readonly Briefcase = Briefcase;
    readonly MapPin = MapPin;
    readonly BookOpen = BookOpen;
    readonly Trophy = Trophy;
    readonly FileText = FileText;
    readonly ExternalLink = ExternalLink;
    readonly PlayCircle = PlayCircle;

    private api = inject(ApiService);
    private cdr = inject(ChangeDetectorRef);

    searchTerm = '';
    selectedFaculty: Faculty | null = null;
    activeTab: 'profile' | 'resources' | 'connect' = 'profile';
    allFaculty: Faculty[] = [];
    filteredFaculty: Faculty[] = [];

    ngOnInit() {
        this.api.getFaculty().subscribe(data => {
            this.allFaculty = data;
            this.updateSearch();
            this.cdr.detectChanges();
        });
    }

    getInitials(name: string): string {
        return (name || '?').trim().split(' ').filter(w => w).map(w => w[0]).slice(0, 2).join('').toUpperCase();
    }

    getAvatarColor(name: string): string {
        const colors = ['#2563eb','#7c3aed','#059669','#dc2626','#d97706','#0891b2','#db2777','#65a30d'];
        return colors[(name?.charCodeAt(0) || 0) % colors.length];
    }

    updateSearch() {
        this.filteredFaculty = this.allFaculty.filter(prof =>
            prof.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            prof.department.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
    }

    openFaculty(prof: Faculty) {
        this.selectedFaculty = prof;
        this.activeTab = 'profile';
    }

    closeFaculty() {
        this.selectedFaculty = null;
    }
}
