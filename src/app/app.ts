import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private title = inject(Title);
  private auth = inject(AuthService);

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        const role = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        this.title.setTitle(`Campvia | ${role}`);
      } else {
        this.title.setTitle('Campvia');
      }
    });
  }
}
