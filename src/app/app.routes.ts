import { Routes } from '@angular/router';
import { LandingComponent } from './components/landing/landing.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { StudyMaterialWrapperComponent } from './components/study-material-wrapper/study-material-wrapper.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';

export const routes: Routes = [
    { path: '', component: LandingComponent },
    { path: 'register', component: LandingComponent },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'admin', component: AdminDashboardComponent },
    { path: 'faculty', component: AdminDashboardComponent },
    { path: 'study-material', component: StudyMaterialWrapperComponent },
    { path: '**', redirectTo: '' }
];
