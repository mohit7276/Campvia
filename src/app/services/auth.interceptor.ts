import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, EMPTY } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token is stale/invalid — clear auth state and redirect to home.
        // Return EMPTY to stop the error cascading to every component's error handler.
        const wasLoggedIn = authService.isLoggedIn();
        authService.logout();
        if (wasLoggedIn) {
          router.navigate(['/']);
        }
        return EMPTY;
      }
      return throwError(() => error);
    })
  );
};
