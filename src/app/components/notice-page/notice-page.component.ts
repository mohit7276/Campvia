import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Megaphone, Search, FileText, Download, Calendar, User, ShieldCheck, Info, AlertTriangle, X, ArrowDownToLine, Upload, Image, Link, File, FileArchive } from 'lucide-angular';
import { jsPDF } from 'jspdf';
import { Notice } from '../../types';
import { AuthService } from '../../services/auth.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-notice-page',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './notice-page.component.html',
    styleUrls: ['./notice-page.component.css'],
    animations: [
        trigger('listAnimation', [
            transition('* => *', [
                query(':enter', [
                    style({ opacity: 0, transform: 'translateY(10px)' }),
                    stagger(50, [
                        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
                    ])
                ], { optional: true })
            ])
        ]),
        trigger('modalAnimation', [
            transition(':enter', [
                style({ opacity: 0, transform: 'scale(0.95) translateY(20px)' }),
                animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.95) translateY(20px)' }))
            ])
        ]),
        trigger('statsAnimation', [
            transition(':enter', [
                query(':enter', [
                    style({ opacity: 0, transform: 'translateY(10px)' }),
                    stagger(50, [
                        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
                    ])
                ], { optional: true })
            ])
        ])
    ]
})
export class NoticePageComponent implements OnInit {
    // Icons
    readonly Megaphone = Megaphone;
    readonly Search = Search;
    readonly FileText = FileText;
    readonly Download = Download;
    readonly Calendar = Calendar;
    readonly User = User;
    readonly ShieldCheck = ShieldCheck;
    readonly Info = Info;
    readonly AlertTriangle = AlertTriangle;
    readonly X = X;
    readonly ArrowDownToLine = ArrowDownToLine;
    readonly Upload = Upload;
    readonly Image = Image;
    readonly Link = Link;
    readonly File = File;
    readonly FileArchive = FileArchive;

    activeView: 'all' | 'academic' = 'all';
    searchQuery = '';
    selectedNotice: Notice | null = null;
    isDownloading: string | null = null;

    private api = inject(ApiService);
    private cdr = inject(ChangeDetectorRef);

    allNotices: Notice[] = [];
    filteredNotices: Notice[] = [];
    stats = { total: 0, urgent: 0, recent: 0 };

    constructor(public authService: AuthService) { }

    ngOnInit() {
        this.api.getNotices().subscribe(data => {
            this.allNotices = data;
            this.updateStats();
            this.updateFilteredNotices();
            this.cdr.detectChanges();
        });
    }

    updateStats() {
        this.stats = {
            total: this.allNotices.length,
            urgent: this.allNotices.filter(n => n.priority === 'high').length,
            recent: this.allNotices.filter(n => new Date(n.date).getTime() > new Date('2024-05-20').getTime()).length
        };
    }

    updateFilteredNotices() {
        this.filteredNotices = this.allNotices.filter(n => {
            const matchesSearch = n.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                n.content.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                n.sender.toLowerCase().includes(this.searchQuery.toLowerCase());
            const matchesView = this.activeView === 'all' || n.category === 'academic';
            return matchesSearch && matchesView;
        });
    }

    handleViewChange(view: 'all' | 'academic') {
        this.activeView = view;
        this.updateFilteredNotices();
    }

    handleDownload(notice: Notice) {
        this.isDownloading = notice.id;

        setTimeout(() => {
            try {
                const doc = new jsPDF();
                const margin = 20;
                const pageWidth = doc.internal.pageSize.getWidth();
                const contentWidth = pageWidth - (margin * 2);

                // Header Decoration
                doc.setFillColor(30, 41, 59); // Slate-900
                doc.rect(0, 0, pageWidth, 40, 'F');

                doc.setTextColor(255, 255, 255);
                doc.setFontSize(22);
                doc.setFont('helvetica', 'bold');
                doc.text("UNIVERSITY NOTICE", margin, 26);

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text("CAMPVIA UNIVERSITY - OFFICIAL DOCUMENTATION", margin, 34);

                // Content Header
                doc.setTextColor(30, 41, 59);
                doc.setFontSize(18);
                doc.setFont('helvetica', 'bold');
                doc.text(notice.title, margin, 60);

                // Meta Info
                doc.setFontSize(10);
                doc.setTextColor(100, 116, 139);
                doc.text(`Date Posted: ${notice.date}`, margin, 70);
                doc.text(`From: ${notice.sender} (${notice.role.toUpperCase()})`, margin, 75);
                doc.text(`Category: ${notice.category.toUpperCase()}`, margin, 80);

                // Separator
                doc.setDrawColor(226, 232, 240);
                doc.line(margin, 88, pageWidth - margin, 88);

                // Body Content
                doc.setTextColor(51, 65, 85);
                doc.setFontSize(12);
                doc.setFont('helvetica', 'normal');

                const splitText = doc.splitTextToSize(notice.content, contentWidth);
                doc.text(splitText, margin, 100);

                // Footer
                const footerY = doc.internal.pageSize.getHeight() - 20;
                doc.setFontSize(9);
                doc.setTextColor(148, 163, 184);
                doc.text("This is an electronically generated document from the Campvia University Student Portal.", margin, footerY);

                doc.save(`${notice.title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
            } catch (err) {
                console.error("Failed to generate PDF", err);
                alert("Could not generate PDF. Please try again.");
            } finally {
                this.isDownloading = null;
            }
        }, 1000);
    }

    // Admin Management Methods
    isManageModalOpen = false;
    currentManageNotice: Notice | any = null;
    isEditingNotice = false;
    saving = false;
    uploadingFile = false;
    newLinkUrl = '';
    newLinkName = '';

    generateNoticeId(): string {
        const ids = this.allNotices.map(n => parseInt(n.id.replace('n', ''), 10));
        const maxId = ids.length ? Math.max(...ids) : 100;
        return `n${maxId + 1}`;
    }

    openAddNoticeModal() {
        this.currentManageNotice = {
            id: '',
            title: '',
            content: '',
            date: new Date().toISOString().split('T')[0],
            sender: this.authService.currentUser()?.name || 'Administrator',
            role: 'admin',
            priority: 'normal',
            category: 'general',
            attachment: '',
            attachments: []
        };
        this.isEditingNotice = false;
        this.newLinkUrl = '';
        this.newLinkName = '';
        this.isManageModalOpen = true;
    }

    openEditNoticeModal(notice: Notice) {
        this.currentManageNotice = {
            ...notice,
            attachments: (notice as any).attachments ? [...(notice as any).attachments] : []
        };
        this.isEditingNotice = true;
        this.newLinkUrl = '';
        this.newLinkName = '';
        this.isManageModalOpen = true;
    }

    closeManageModal() {
        this.isManageModalOpen = false;
        this.currentManageNotice = null;
        this.isEditingNotice = false;
        this.newLinkUrl = '';
        this.newLinkName = '';
    }

    onFileSelected(event: any) {
        const file: File = event.target.files[0];
        if (!file || !this.currentManageNotice) return;
        this.uploadingFile = true;
        this.cdr.detectChanges();
        this.api.uploadNoticeFile(file).subscribe({
            next: (attachment: any) => {
                if (!this.currentManageNotice.attachments) this.currentManageNotice.attachments = [];
                this.currentManageNotice.attachments.push(attachment);
                this.uploadingFile = false;
                // Reset file input so same file can be re-selected
                event.target.value = '';
                this.cdr.detectChanges();
            },
            error: () => {
                this.uploadingFile = false;
                this.cdr.detectChanges();
            }
        });
    }

    addLink() {
        const url = this.newLinkUrl.trim();
        if (!url) return;
        if (!this.currentManageNotice.attachments) this.currentManageNotice.attachments = [];
        const name = this.newLinkName.trim() || url;
        this.currentManageNotice.attachments.push({ name, url, type: 'link' });
        this.newLinkUrl = '';
        this.newLinkName = '';
    }

    removeAttachmentItem(index: number) {
        if (this.currentManageNotice?.attachments) {
            this.currentManageNotice.attachments.splice(index, 1);
        }
    }

    removeAttachment() {
        if (this.currentManageNotice) {
            this.currentManageNotice.attachment = '';
        }
    }

    getAttachmentIcon(type: string) {
        switch (type) {
            case 'image': return this.Image;
            case 'pdf': return this.FileText;
            case 'link': return this.Link;
            case 'doc': return this.File;
            default: return this.FileArchive;
        }
    }

    getAttachmentIconColor(type: string): string {
        switch (type) {
            case 'image': return 'text-purple-500';
            case 'pdf': return 'text-rose-500';
            case 'link': return 'text-blue-500';
            case 'doc': return 'text-indigo-500';
            default: return 'text-slate-400';
        }
    }

    openAttachment(attachment: any) {
        if (attachment.type === 'link') {
            window.open(attachment.url, '_blank');
        } else {
            window.open(attachment.url, '_blank');
        }
    }

    saveNotice() {
        if (!this.currentManageNotice || this.saving) return;
        this.saving = true;

        if (this.currentManageNotice.date && this.currentManageNotice.date.includes('-')) {
            const d = new Date(this.currentManageNotice.date);
            this.currentManageNotice.date = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        }

        if (this.isEditingNotice) {
            this.api.updateNotice(this.currentManageNotice.id, this.currentManageNotice).subscribe({
                next: (data) => {
                    const index = this.allNotices.findIndex(n => n.id === this.currentManageNotice.id);
                    if (index !== -1) {
                        this.allNotices[index] = data;
                    }
                    this.updateStats();
                    this.updateFilteredNotices();
                    this.saving = false;
                    this.closeManageModal();
                    this.cdr.detectChanges();
                },
                error: () => { this.saving = false; this.cdr.detectChanges(); }
            });
        } else {
            this.api.createNotice(this.currentManageNotice).subscribe({
                next: (data) => {
                    this.allNotices = [data, ...this.allNotices];
                    this.updateStats();
                    this.updateFilteredNotices();
                    this.saving = false;
                    this.closeManageModal();
                    this.cdr.detectChanges();
                },
                error: () => { this.saving = false; this.cdr.detectChanges(); }
            });
        }
    }

    deleteNotice(id: string) {
        if (this.saving) return;
        if (confirm('Are you sure you want to completely remove this notice?')) {
            this.saving = true;
            this.api.deleteNotice(id).subscribe({
                next: () => {
                    this.allNotices = this.allNotices.filter(n => n.id !== id);
                    this.updateStats();
                    this.updateFilteredNotices();
                    this.saving = false;
                    this.cdr.detectChanges();
                },
                error: () => { this.saving = false; this.cdr.detectChanges(); }
            });
        }
    }
}
