import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, CreditCard, Download, History, Clock, CheckCircle2, AlertCircle, Wallet, ArrowUpRight, ShieldCheck, ChevronRight, Receipt, Search, X, Lock, ArrowRight, Calendar, BookOpen, Banknote, BadgeCheck } from 'lucide-angular';
import { jsPDF } from 'jspdf';
import { FeeRecord } from '../../types';
import { trigger, transition, style, animate } from '@angular/animations';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { RazorpayService } from '../../services/razorpay.service';

@Component({
    selector: 'app-fees-page',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './fees-page.component.html',
    styleUrls: ['./fees-page.component.css'],
    animations: [
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(12px)' }),
                animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
            ])
        ]),
        trigger('modalAnimation', [
            transition(':enter', [
                style({ opacity: 0, transform: 'scale(0.9) translateY(20px)' }),
                animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.9) translateY(20px)' }))
            ])
        ])
    ]
})
export class FeesPageComponent implements OnInit {
    // Icons
    readonly CreditCard = CreditCard;
    readonly Download = Download;
    readonly History = History;
    readonly Clock = Clock;
    readonly CheckCircle2 = CheckCircle2;
    readonly AlertCircle = AlertCircle;
    readonly Wallet = Wallet;
    readonly ArrowUpRight = ArrowUpRight;
    readonly ShieldCheck = ShieldCheck;
    readonly ChevronRight = ChevronRight;
    readonly Receipt = Receipt;
    readonly Search = Search;
    readonly X = X;
    readonly Lock = Lock;
    readonly ArrowRight = ArrowRight;
    readonly Calendar = Calendar;
    readonly BookOpen = BookOpen;
    readonly Banknote = Banknote;
    readonly BadgeCheck = BadgeCheck;

    private api = inject(ApiService);
    private cdr = inject(ChangeDetectorRef);
    readonly authService = inject(AuthService);
    private razorpay = inject(RazorpayService);

    records: FeeRecord[] = [];
    isProcessing = false;
    isDownloading: string | null = null;
    showPayAllModal = false;
    isLoading = true;
    errorMsg = '';
    paymentError = '';
    lastPaymentId = '';

    // Razorpay-style payment form fields
    paymentStep: 'summary' | 'card' | 'otp' | 'processing' | 'success' = 'summary';
    cardNumber = '';
    cardExpiry = '';
    cardCvv = '';
    cardName = '';
    selectedMethod: 'card' | 'upi' | 'netbanking' = 'card';
    upiId = '';
    otpValue = '';
    cardError = '';
    processingText = '';

    ngOnInit() {
        this.isLoading = true;
        this.errorMsg = '';
        this.api.getFees().subscribe({
            next: (data) => {
                this.records = data || [];
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.errorMsg = err?.error?.message || 'Failed to load fee data. Please try again.';
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    // ── Computed totals ─────────────────────────────────────────
    get totalCourseFee(): number {
        return this.records.reduce((sum, f) => sum + f.amount, 0);
    }

    get amountPaid(): number {
        return this.records.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);
    }

    get amountDue(): number {
        return this.records.filter(f => f.status !== 'paid').reduce((sum, f) => sum + f.amount, 0);
    }

    get hasPendingFees(): boolean {
        return this.records.some(f => f.status === 'pending' || f.status === 'overdue');
    }

    get hasOverdue(): boolean {
        return this.records.some(f => f.status === 'overdue');
    }

    get paidRecords(): FeeRecord[] {
        return this.records
            .filter(f => f.status === 'paid')
            .sort((a, b) => new Date(b.paidDate!).getTime() - new Date(a.paidDate!).getTime());
    }

    // Group paid records by payment transaction (strips the _N suffix added for multi-record payments)
    get paymentGroups(): { baseId: string; date: string; totalAmount: number; method: string; fees: FeeRecord[] }[] {
        const groups = new Map<string, { date: string; totalAmount: number; method: string; fees: FeeRecord[] }>();
        for (const f of this.paidRecords) {
            const base = (f.transactionId || 'payment').replace(/_\d+$/, '');
            if (!groups.has(base)) {
                groups.set(base, { date: f.paidDate!, totalAmount: 0, method: f.method || 'Razorpay', fees: [] });
            }
            const g = groups.get(base)!;
            g.totalAmount += f.amount;
            g.fees.push(f);
        }
        return Array.from(groups.entries())
            .map(([id, g]) => ({ baseId: id, ...g }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    get paidPercent(): number {
        if (this.totalCourseFee === 0) return 0;
        return Math.round((this.amountPaid / this.totalCourseFee) * 100);
    }

    get feeStatus(): 'fully_paid' | 'overdue' | 'pending' {
        if (this.amountDue === 0 && this.records.length > 0) return 'fully_paid';
        if (this.hasOverdue) return 'overdue';
        return 'pending';
    }

    // ── Pay All ──────────────────────────────────────────────────
    openPaymentModal() {
        this.showPayAllModal = true;
        this.paymentStep = 'summary';
        this.paymentError = '';
        this.cardError = '';
        this.isProcessing = false;
        this.lastPaymentId = '';
    }

    /** Launch the real Razorpay Checkout modal.  Called when user clicks "Proceed to Pay". */
    async launchRazorpay() {
        const user = this.authService.currentUser();
        this.isProcessing = true;
        this.paymentStep = 'processing';
        this.processingText = 'Connecting to Razorpay...';
        this.cardError = '';
        this.cdr.detectChanges();

        try {
            // Opens the native Razorpay modal; resolves on payment success.
            const result = await this.razorpay.openCheckout({
                amount: this.amountDue,
                courseName: user?.course || 'Course',
                userName: user?.name || '',
                userEmail: user?.email || '',
            });

            this.processingText = 'Verifying payment...';
            this.cdr.detectChanges();

            // Verify signature & update DB on backend
            const verifyResult = await this.razorpay.verifyPayment(result);
            this.lastPaymentId = result.razorpay_payment_id;

            this.paymentStep = 'success';
            this.isProcessing = false;
            this.cdr.detectChanges();

            // Refresh fee data after a brief success screen
            setTimeout(() => {
                this.showPayAllModal = false;
                this.ngOnInit();
            }, 3000);

        } catch (err: any) {
            this.isProcessing = false;
            if (err?.message === 'cancelled') {
                // User closed the Razorpay modal — go back to summary
                this.paymentStep = 'summary';
            } else {
                this.paymentStep = 'summary';
                this.cardError = err?.message || 'Payment failed. Please try again.';
            }
            this.cdr.detectChanges();
        }
    }

    // Kept for template backward-compat
    proceedToCard() { this.launchRazorpay(); }
    confirmPayAll() { this.launchRazorpay(); }

    get cardNetwork(): string { return ''; }
    get formattedCard(): string { return ''; }
    onCardNumberInput(_e: Event) {}
    onExpiryInput(_e: Event) {}
    submitPayment() {}
    verifyOtpAndPay() {}

    generateReceipt(fee: FeeRecord) {
        this.isDownloading = fee.id;
        setTimeout(() => {
            try {
                const doc = new jsPDF();
                const pageWidth = doc.internal.pageSize.getWidth();
                const margin = 20;

                // Header
                doc.setFillColor(30, 41, 59);
                doc.rect(0, 0, pageWidth, 45, 'F');

                doc.setTextColor(255, 255, 255);
                doc.setFontSize(22);
                doc.setFont('helvetica', 'bold');
                doc.text("FEE RECEIPT", margin, 25);

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text("Campvia University - Official Receipt", margin, 35);

                // Receipt Details
                doc.setTextColor(30, 41, 59);
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text("Transaction Information", margin, 65);

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100, 116, 139);
                doc.text(`Transaction ID: ${fee.transactionId}`, margin, 75);
                doc.text(`Payment Date: ${fee.paidDate}`, margin, 82);
                doc.text(`Payment Method: ${fee.method}`, margin, 89);

                // Student Info
                doc.setTextColor(30, 41, 59);
                doc.setFont('helvetica', 'bold');
                doc.text("Student Details", margin + 100, 65);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100, 116, 139);
                const userName = this.authService.currentUser()?.name || 'Student';
                const userEmail = this.authService.currentUser()?.email || '';
                const userCourse = this.authService.currentUser()?.course || 'N/A';
                doc.text(`Name: ${userName}`, margin + 100, 75);
                doc.text(`ID: ${userEmail}`, margin + 100, 82);
                doc.text(`Course: ${userCourse}`, margin + 100, 89);

                // Table Header
                doc.setDrawColor(226, 232, 240);
                doc.setLineWidth(0.5);
                doc.line(margin, 105, pageWidth - margin, 105);

                doc.setTextColor(30, 41, 59);
                doc.setFont('helvetica', 'bold');
                doc.text("Description", margin, 115);
                doc.text("Amount", pageWidth - margin - 20, 115);

                doc.line(margin, 120, pageWidth - margin, 120);

                // Table Row
                doc.setFont('helvetica', 'normal');
                doc.text(fee.title, margin, 132);
                doc.text(`Rs.${fee.amount.toLocaleString()}`, pageWidth - margin - 20, 132);

                // Total
                doc.line(margin, 150, pageWidth - margin, 150);
                doc.setFont('helvetica', 'bold');
                doc.text("TOTAL PAID", margin, 162);
                doc.text(`Rs.${fee.amount.toLocaleString()}`, pageWidth - margin - 20, 162);

                // Footer
                const footerY = doc.internal.pageSize.getHeight() - 30;
                doc.setTextColor(148, 163, 184);
                doc.setFontSize(8);
                doc.text("This is an electronically generated receipt and does not require a physical signature.", margin, footerY);
                doc.text("© 2024 Campvia University. All rights reserved.", margin, footerY + 5);

                doc.save(`Receipt_${fee.transactionId}.pdf`);
            } catch (err) {
                console.error("PDF generation failed", err);
            } finally {
                this.isDownloading = null;
            }
        }, 1200);
    }

    generateGroupReceipt(group: { baseId: string; date: string; totalAmount: number; method: string; fees: FeeRecord[] }) {
        this.isDownloading = group.baseId;
        setTimeout(() => {
            try {
                const doc = new jsPDF();
                const pageWidth = doc.internal.pageSize.getWidth();
                const margin = 20;

                // Header
                doc.setFillColor(30, 41, 59);
                doc.rect(0, 0, pageWidth, 45, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(22);
                doc.setFont('helvetica', 'bold');
                doc.text("FEE RECEIPT", margin, 25);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text("Campvia University - Official Receipt", margin, 35);

                // Transaction Info
                doc.setTextColor(30, 41, 59);
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text("Transaction Information", margin, 65);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100, 116, 139);
                doc.text(`Transaction ID: ${group.baseId}`, margin, 75);
                doc.text(`Payment Date: ${group.date}`, margin, 82);
                doc.text(`Payment Method: ${group.method || 'Razorpay'}`, margin, 89);

                // Student Info
                doc.setTextColor(30, 41, 59);
                doc.setFont('helvetica', 'bold');
                doc.text("Student Details", margin + 100, 65);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100, 116, 139);
                const userName = this.authService.currentUser()?.name || 'Student';
                const userEmail = this.authService.currentUser()?.email || '';
                const userCourse = this.authService.currentUser()?.course || 'N/A';
                doc.text(`Name: ${userName}`, margin + 100, 75);
                doc.text(`ID: ${userEmail}`, margin + 100, 82);
                doc.text(`Course: ${userCourse}`, margin + 100, 89);

                // Table
                doc.setDrawColor(226, 232, 240);
                doc.setLineWidth(0.5);
                doc.line(margin, 105, pageWidth - margin, 105);
                doc.setTextColor(30, 41, 59);
                doc.setFont('helvetica', 'bold');
                doc.text("Description", margin, 115);
                doc.text("Amount", pageWidth - margin - 20, 115);
                doc.line(margin, 120, pageWidth - margin, 120);

                let y = 132;
                doc.setFont('helvetica', 'normal');
                for (const f of group.fees) {
                    doc.text(f.title, margin, y);
                    doc.text(`Rs.${f.amount.toLocaleString()}`, pageWidth - margin - 20, y);
                    y += 9;
                }

                // Total
                doc.line(margin, y + 6, pageWidth - margin, y + 6);
                doc.setFont('helvetica', 'bold');
                doc.text("TOTAL PAID", margin, y + 16);
                doc.text(`Rs.${group.totalAmount.toLocaleString()}`, pageWidth - margin - 20, y + 16);

                // Footer
                const footerY = doc.internal.pageSize.getHeight() - 30;
                doc.setTextColor(148, 163, 184);
                doc.setFontSize(8);
                doc.text("This is an electronically generated receipt and does not require a physical signature.", margin, footerY);
                doc.text("© 2024 Campvia University. All rights reserved.", margin, footerY + 5);

                doc.save(`Receipt_${group.baseId}.pdf`);
            } catch (err) {
                console.error("PDF generation failed", err);
            } finally {
                this.isDownloading = null;
            }
        }, 1200);
    }
}
