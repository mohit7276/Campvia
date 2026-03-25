import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./components/landing/landing.component').then((m) => m.LandingComponent),
    },
    {
        path: 'dashboard',
        loadComponent: () =>
            import('./components/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    },
    {
        path: 'admin',
        loadComponent: () =>
            import('./components/admin-dashboard/admin-dashboard.component').then(
                (m) => m.AdminDashboardComponent
            ),
    },
    {
        path: 'faculty',
        loadComponent: () =>
            import('./components/admin-dashboard/admin-dashboard.component').then(
                (m) => m.AdminDashboardComponent
            ),
    },
    {
        path: 'study-material',
        loadComponent: () =>
            import('./components/study-material-wrapper/study-material-wrapper.component').then(
                (m) => m.StudyMaterialWrapperComponent
            ),
    },
    { path: '**', redirectTo: '' },
];
