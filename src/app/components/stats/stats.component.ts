import { Component, ElementRef, OnInit, OnDestroy, ViewChild, AfterViewInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { STATS } from '../../constants';

@Component({
    selector: 'app-stats',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './stats.component.html',
    styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit, OnDestroy, AfterViewInit {
    stats = STATS;
    isVisible = false;
    private observer: IntersectionObserver | null = null;

    @ViewChild('container') containerRef!: ElementRef;

    constructor(private zone: NgZone, private cdr: ChangeDetectorRef) {}

    ngOnInit() {}

    ngAfterViewInit() {
        this.observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !this.isVisible) {
                    // Run inside Angular's zone so change detection picks it up
                    // in the correct cycle — prevents NG0100
                    this.zone.run(() => {
                        this.isVisible = true;
                        this.cdr.markForCheck();
                    });
                }
            },
            { threshold: 0.1 }
        );

        if (this.containerRef?.nativeElement) {
            this.observer.observe(this.containerRef.nativeElement);
        }
    }

    ngOnDestroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}
