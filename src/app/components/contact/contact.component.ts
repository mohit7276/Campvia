import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { finalize } from 'rxjs';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-contact',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './contact.component.html',
    styleUrls: ['./contact.component.css']
})
export class ContactComponent {
    private api = inject(ApiService);

    @ViewChild('contactForm') contactForm!: NgForm;

    name = '';
    email = '';
    message = '';

    isSending = false;
    successMsg = '';
    errorMsg = '';

    submitForm() {
        if (this.isSending) return;
        if (!this.name.trim()) { this.errorMsg = 'Please enter your name.'; return; }
        if (!this.email.trim()) { this.errorMsg = 'Please enter your email.'; return; }
        if (!this.message.trim()) { this.errorMsg = 'Please enter a message.'; return; }

        this.isSending = true;
        this.errorMsg = '';
        this.successMsg = '';

        this.api.submitContact({ name: this.name, email: this.email, message: this.message })
            .pipe(finalize(() => { this.isSending = false; }))
            .subscribe({
                next: () => {
                    this.successMsg = 'Your inquiry has been sent! We will get back to you soon.';
                    this.contactForm.resetForm();
                },
                error: (err: any) => {
                    this.errorMsg = err?.error?.message || 'Failed to send. Please try again.';
                }
            });
    }
}

