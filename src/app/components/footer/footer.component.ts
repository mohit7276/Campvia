import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NAV_LINKS } from '../../constants';

@Component({
    selector: 'app-footer',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.css']
})
export class FooterComponent {
    navLinks = NAV_LINKS;
    socials = ['facebook', 'twitter', 'linkedin', 'instagram'];
}
