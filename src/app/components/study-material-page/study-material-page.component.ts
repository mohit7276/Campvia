import { Component, Input, Output, EventEmitter, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, BookOpen, FileText, Layout, Book, ArrowLeft, ChevronRight, GraduationCap, ExternalLink } from 'lucide-angular';
import { StudyMaterial } from '../../types';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-study-material-page',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './study-material-page.component.html',
    styleUrls: ['./study-material-page.component.css']
})
export class StudyMaterialPageComponent implements OnInit {
    @Input() isDashboard = false;
    @Output() back = new EventEmitter<void>();

    // Lucide Icons
    readonly Search = Search;
    readonly BookOpen = BookOpen;
    readonly FileText = FileText;
    readonly Layout = Layout;
    readonly Book = Book;
    readonly ArrowLeft = ArrowLeft;
    readonly ChevronRight = ChevronRight;
    readonly GraduationCap = GraduationCap;
    readonly ExternalLink = ExternalLink;

    private api = inject(ApiService);
    private cdr = inject(ChangeDetectorRef);

    searchTerm = '';
    view: 'subjects' | 'materials' = 'subjects';
    selectedSubject: string | null = null;

    subjects: string[] = [];
    allMaterials: StudyMaterial[] = [];
    filteredMaterials: StudyMaterial[] = [];

    readonly subjectMetadata: Record<string, { icon: any, color: string, bg: string }> = {
        'Mathematics': { icon: Book, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        'Computer Science': { icon: Layout, color: 'text-blue-600', bg: 'bg-blue-50' },
        'Science': { icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        'Arts': { icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
        'Management': { icon: BookOpen, color: 'text-rose-600', bg: 'bg-rose-50' },
        'default': { icon: Book, color: 'text-slate-600', bg: 'bg-slate-50' }
    };

    ngOnInit() {
        this.api.getStudyMaterials().subscribe(data => {
            this.allMaterials = data;
            this.subjects = [...new Set(this.allMaterials.map(m => m.subject))];
            this.updateFilteredMaterials();
            this.cdr.detectChanges();
        });
    }

    updateFilteredMaterials() {
        this.filteredMaterials = this.allMaterials.filter(m => {
            const matchesSearch = m.title.toLowerCase().includes(this.searchTerm.toLowerCase());
            const matchesSubject = !this.selectedSubject || m.subject === this.selectedSubject;
            return matchesSearch && matchesSubject;
        });
    }

    handleSubjectClick(subject: string) {
        this.selectedSubject = subject;
        this.view = 'materials';
        this.searchTerm = '';
        this.updateFilteredMaterials();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    handleBackToSubjects() {
        this.view = 'subjects';
        this.selectedSubject = null;
        this.searchTerm = '';
        this.updateFilteredMaterials();
    }

    getSubjectMeta(subject: string) {
        return this.subjectMetadata[subject] || this.subjectMetadata['default'];
    }

    getMaterialIcon(category: string) {
        if (category === 'E-Book') return Book;
        if (category === 'Handwritten Notes') return FileText;
        if (category === 'Manual') return BookOpen;
        return Layout;
    }

    getCount(subject: string) {
        return this.allMaterials.filter(m => m.subject === subject).length;
    }
}
