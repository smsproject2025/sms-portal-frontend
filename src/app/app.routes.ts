import { Routes } from '@angular/router';
import { authGuard, adminGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'send-sms',
        loadComponent: () => import('./features/send-sms/send-sms.component').then(m => m.SendSmsComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent)
      },
      {
        path: 'wallet',
        loadComponent: () => import('./features/wallet/wallet.component').then(m => m.WalletComponent)
      },
      {
        path: 'sender-ids',
        loadComponent: () => import('./features/sender-id/sender-id.component').then(m => m.SenderIdComponent)
      },
      {
        path: 'whatsapp',
        loadComponent: () => import('./features/whatsapp/whatsapp.component').then(m => m.WhatsAppComponent)
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
