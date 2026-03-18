import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, Trash2, CheckCircle2, Circle, Calendar, Clock, BookText, AlignLeft, X, Pencil } from 'lucide-angular';
import { UserTodo } from '../../types';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
    selector: 'app-todo-list-page',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './todo-list-page.component.html',
    styleUrls: ['./todo-list-page.component.css'],
    animations: [
        trigger('listAnimation', [
            transition('* => *', [
                query(':enter', [
                    style({ opacity: 0, scale: 0.95, height: 0 }),
                    stagger(50, [
                        animate('300ms ease-out', style({ opacity: 1, scale: 1, height: '*' }))
                    ])
                ], { optional: true }),
                query(':leave', [
                    animate('300ms ease-in', style({ opacity: 0, scale: 0.95, height: 0 }))
                ], { optional: true })
            ])
        ]),
        trigger('modalAnimation', [
            transition(':enter', [
                style({ opacity: 0, transform: 'scale(0.95)' }),
                animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
            ]),
            transition(':leave', [
                animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
            ])
        ])
    ]
})
export class TodoListPageComponent implements OnInit {
    @Input() todos: UserTodo[] = [];
    @Output() addTodo = new EventEmitter<Omit<UserTodo, 'id' | 'completed'>>();
    @Output() toggleTodo = new EventEmitter<string>();
    @Output() updateTodo = new EventEmitter<{ id: string, todo: Partial<UserTodo> }>();
    @Output() deleteTodo = new EventEmitter<string>();

    // Icons
    readonly Plus = Plus;
    readonly Trash2 = Trash2;
    readonly CheckCircle2 = CheckCircle2;
    readonly Circle = Circle;
    readonly Calendar = Calendar;
    readonly Clock = Clock;
    readonly BookText = BookText;
    readonly AlignLeft = AlignLeft;
    readonly X = X;
    readonly Pencil = Pencil;

    isModalOpen = false;
    editingId: string | null = null;
    newTodo = {
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        subject: '',
        description: ''
    };

    ngOnInit() { }

    // Local handler wrappers to emit events
    onToggleTodo(id: string) {
        this.todos = this.todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
        this.toggleTodo.emit(id);
    }

    onDeleteTodo(id: string) {
        this.todos = this.todos.filter(t => t.id !== id);
        this.deleteTodo.emit(id);
    }

    handleEdit(todo: UserTodo) {
        this.editingId = todo.id;
        this.newTodo = {
            title: todo.title,
            date: todo.date,
            time: todo.time,
            subject: todo.subject || '',
            description: todo.description || ''
        };
        this.isModalOpen = true;
    }

    closeModal() {
        this.isModalOpen = false;
        this.editingId = null;
        this.newTodo = {
            title: '',
            date: new Date().toISOString().split('T')[0],
            time: '',
            subject: '',
            description: ''
        };
    }

    handleSubmit() {
        if (!this.newTodo.title || !this.newTodo.date || !this.newTodo.time) return;

        if (this.editingId) {
            this.todos = this.todos.map(t => t.id === this.editingId ? { ...t, ...this.newTodo } : t);
            this.updateTodo.emit({ id: this.editingId, todo: this.newTodo });
        } else {
            const todo: UserTodo = {
                id: Date.now().toString(),
                completed: false,
                ...this.newTodo
            };
            this.todos = [todo, ...this.todos];
            this.addTodo.emit(this.newTodo);
        }

        this.closeModal();
    }
}
