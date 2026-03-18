import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { timeout, catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { ApiService } from '../../services/api.service';

interface Message {
    role: 'user' | 'model';
    text: string;
    sources?: { title: string; uri: string }[];
}

@Component({
    selector: 'app-chat-bot',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './chat-bot.component.html',
    styleUrls: ['./chat-bot.component.css']
})
export class ChatBotComponent implements OnInit {
    @Input() isOpen = false;
    @Output() close = new EventEmitter<void>();
    @ViewChild('messagesEnd') messagesEndRef!: ElementRef;

    messages: Message[] = [
        { role: 'model', text: 'Hello! I am Campvia AI, a versatile intelligence assistant. I can help you with campus inquiries, complex academic questions, or anything else you’d like to know. How can I assist you today?' }
    ];
    input = '';
    isLoading = false;
    chatHistory: any[] = [];

    private api = inject(ApiService);
    private cdr = inject(ChangeDetectorRef);

    ngOnInit() {
        this.scrollToBottom();
    }

    scrollToBottom() {
        try {
            this.messagesEndRef?.nativeElement?.scrollIntoView({ behavior: "smooth" });
        } catch (err) { }
    }

    async handleSendMessage() {
        if (!this.input.trim() || this.isLoading) return;

        const userMessage = this.input.trim();
        this.input = '';

        // Build history from existing messages BEFORE adding the new user message
        this.chatHistory = this.messages
            .filter((msg, index) => !(index === 0 && msg.role === 'model'))
            .map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.text }]
            }));

        this.messages.push({ role: 'user', text: userMessage });
        this.isLoading = true;
        this.cdr.detectChanges();
        setTimeout(() => this.scrollToBottom(), 50);

        this.api.sendChatMessage(userMessage, this.chatHistory).pipe(
            timeout(30000),
            catchError((error) => {
                console.error('Chat Error:', error);
                const msg = error?.name === 'TimeoutError'
                    ? 'Request timed out. Please try again.'
                    : 'I encountered an error. Please try again.';
                return of({ reply: msg });
            }),
            finalize(() => {
                this.isLoading = false;
                this.cdr.detectChanges();
                setTimeout(() => this.scrollToBottom(), 50);
            })
        ).subscribe((data: any) => {
            if (data?.reply || data?.text) {
                this.messages.push({ role: 'model', text: data.reply || data.text });
            }
            this.cdr.detectChanges();
            setTimeout(() => this.scrollToBottom(), 50);
        });
    }

    clearChat() {
        this.messages = [{ role: 'model', text: 'History cleared. What else can I help you with?' }];
    }
}
