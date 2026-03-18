import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, User, Phone, Mail, Trophy, GraduationCap, ChevronRight, X, ArrowLeft, IdCard, Hash, MapPin } from 'lucide-angular';
import { Classmate } from '../../types';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-classmates-page',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './classmates-page.component.html',
    styleUrls: ['./classmates-page.component.css'],
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
export class ClassmatesPageComponent implements OnInit {
    // Icons
    readonly Search = Search;
    readonly User = User;
    readonly Phone = Phone;
    readonly Mail = Mail;
    readonly Trophy = Trophy;
    readonly GraduationCap = GraduationCap;
    readonly ChevronRight = ChevronRight;
    readonly X = X;
    readonly Hash = Hash;
    readonly MapPin = MapPin;

    private api = inject(ApiService);
    private cdr = inject(ChangeDetectorRef);

    searchTerm = '';
    selectedStudent: Classmate | null = null;
    activeTab: 'stats' | 'contact' = 'stats';
    allClassmates: Classmate[] = [];
    filteredClassmates: Classmate[] = [];

    ngOnInit() {
        this.api.getClassmates().subscribe(data => {
            this.allClassmates = data;
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
        this.filteredClassmates = this.allClassmates.filter(student =>
            student.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            student.rollNo.includes(this.searchTerm)
        );
    }

    openStudent(student: Classmate) {
        this.selectedStudent = student;
        this.activeTab = 'stats';
    }

    closeStudent() {
        this.selectedStudent = null;
    }
}
