import { Component, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, DecimalPipe, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="layout" [class.sidebar-collapsed]="sidebarCollapsed()">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="brand">
            <span class="brand-icon">⚡</span>
            @if (!sidebarCollapsed()) {
              <span class="brand-name" style="font-size: 24px; font-weight: 700;">SMSPortal</span>
            }
          </div>
          <button class="collapse-btn" (click)="sidebarCollapsed.set(!sidebarCollapsed())">
            <span class="material-icons">{{ sidebarCollapsed() ? 'chevron_right' : 'chevron_left' }}</span>
          </button>
        </div>

        <!-- Wallet Balance -->
        @if (!sidebarCollapsed()) {
          <div class="wallet-badge">
            <div class="wallet-label">Wallet Balance</div>
            <div class="wallet-amount">₹{{ auth.currentUser()?.walletBalance | number:'1.2-2' }}</div>
            <a routerLink="/wallet" class="wallet-recharge">+ Recharge</a>
          </div>
        }

        <nav class="nav">
          @for (item of navItems; track item.route) {
            <a class="nav-item" [routerLink]="item.route" routerLinkActive="active"
              [routerLinkActiveOptions]="{exact: item.route === '/dashboard'}"
              [title]="sidebarCollapsed() ? item.label : ''">
              <span class="material-icons nav-icon">{{ item.icon }}</span>
              @if (!sidebarCollapsed()) {
                <span class="nav-label">{{ item.label }}</span>
              }
            </a>
          }

          @if (adminNavItems.length > 0) {
            @if (!sidebarCollapsed()) {
              <div class="nav-section-label">Admin</div>
            }
            @for (item of adminNavItems; track item.route) {
              <a class="nav-item admin-item" [routerLink]="item.route" routerLinkActive="active"
                [title]="sidebarCollapsed() ? item.label : ''">
                <span class="material-icons nav-icon">{{ item.icon }}</span>
                @if (!sidebarCollapsed()) {
                  <span class="nav-label">{{ item.label }}</span>
                }
              </a>
            }
          }
        </nav>

        <div class="sidebar-footer">
          <button class="nav-item logout-btn" (click)="logout()" [title]="sidebarCollapsed() ? 'Logout' : ''">
            <span class="material-icons nav-icon">logout</span>
            @if (!sidebarCollapsed()) {
              <span class="nav-label">Logout</span>
            }
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="main">
        <!-- Topbar -->
        <header class="topbar">
          <div class="topbar-left">
            <button class="mobile-menu-btn" (click)="mobileMenuOpen.set(!mobileMenuOpen())">
              <span class="material-icons">menu</span>
            </button>
            <div class="search-box">
              <span class="material-icons">search</span>
              <input type="text" placeholder="Search..." />
            </div>
          </div>

          <div class="topbar-right">
            <div class="balance-chip">
              <span class="material-icons">account_balance_wallet</span>
              ₹{{ auth.currentUser()?.walletBalance | number:'1.2-2' }}
            </div>

            <div class="user-menu" (click)="userMenuOpen.set(!userMenuOpen())">
              <div class="avatar">{{ initials }}</div>
              <div class="user-info">
                <span class="user-name">{{ auth.currentUser()?.name }}</span>
                <span class="user-role">{{ auth.currentUser()?.role }}</span>
              </div>
              <span class="material-icons">expand_more</span>

              @if (userMenuOpen()) {
                <div class="dropdown-menu">
                  <div class="dropdown-item" routerLink="/wallet">
                    <span class="material-icons">account_balance_wallet</span> Wallet
                  </div>
                  <div class="dropdown-divider"></div>
                  <div class="dropdown-item danger" (click)="logout()">
                    <span class="material-icons">logout</span> Logout
                  </div>
                </div>
              }
            </div>
          </div>
        </header>

        <!-- Page content -->
        <main class="content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .layout {
      display: flex;
      min-height: 100vh;
      background: var(--bg-base);
    }

    /* ── Sidebar ── */
    .sidebar {
      width: var(--sidebar-width);
      min-height: 100vh;
      background: var(--bg-surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      transition: width 0.2s ease;
      position: sticky;
      top: 0;
      height: 100vh;
      flex-shrink: 0;
    }

    .layout.sidebar-collapsed .sidebar { width: 64px; }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 16px;
      border-bottom: 1px solid var(--border);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-heading);
      font-weight: 800;
      font-size: 18px;
      overflow: hidden;
      white-space: nowrap;

      .brand-icon { font-size: 22px; flex-shrink: 0; }
    }

    .collapse-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 4px;
      border-radius: var(--radius-sm);
      display: flex;
      flex-shrink: 0;
      &:hover { color: var(--text-primary); background: var(--bg-hover); }
      .material-icons { font-size: 18px; }
    }

    .wallet-badge {
      margin: 16px 12px;
      background: var(--accent-dim);
      border: 1px solid rgba(0,229,255,0.15);
      border-radius: var(--radius-md);
      padding: 12px 14px;

      .wallet-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; }
      .wallet-amount { font-family: var(--font-mono); font-size: 20px; font-weight: 700; color: var(--accent); margin: 2px 0 8px; }
      .wallet-recharge {
        font-size: 11px;
        font-weight: 600;
        color: var(--accent);
        background: rgba(0,229,255,0.1);
        padding: 3px 10px;
        border-radius: 20px;
        display: inline-block;
        &:hover { background: rgba(0,229,255,0.2); }
      }
    }

    .nav {
      flex: 1;
      padding: 8px 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      transition: var(--transition);
      cursor: pointer;
      border: none;
      background: none;
      width: 100%;
      white-space: nowrap;
      overflow: hidden;

      &:hover { background: var(--bg-hover); color: var(--text-primary); }

      &.active {
        background: var(--accent-dim);
        color: var(--accent);
        .nav-icon { color: var(--accent); }
      }
    }

    .nav-icon { font-size: 20px; flex-shrink: 0; }
    .nav-label { font-size: 14px; }

    .nav-section-label {
      font-size: 10px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.12em;
      padding: 10px 12px 4px;
    }

    .admin-item { color: var(--purple); &.active { background: var(--purple-dim); color: var(--purple); } }

    /* WhatsApp nav item */
    a[routerLink="/whatsapp"].active {
      background: rgba(37,211,102,0.12);
      color: #25d366;
      
    }

    .sidebar-footer {
      padding: 8px;
      border-top: 1px solid var(--border);
    }

    .logout-btn { color: var(--text-muted); &:hover { color: var(--red); background: var(--red-dim); } }

    /* ── Main ── */
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    /* ── Topbar ── */
    .topbar {
      height: var(--topbar-height);
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .topbar-left { display: flex; align-items: center; gap: 16px; }
    .topbar-right { display: flex; align-items: center; gap: 16px; }

    .mobile-menu-btn {
      display: none;
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 6px;
      .material-icons { font-size: 22px; }
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 6px 12px;
      min-width: 240px;

      .material-icons { font-size: 18px; color: var(--text-muted); }
      input {
        background: none;
        border: none;
        outline: none;
        color: var(--text-primary);
        font-size: 13px;
        width: 100%;
        &::placeholder { color: var(--text-muted); }
      }
    }

    .balance-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--accent-dim);
      border: 1px solid rgba(0,229,255,0.2);
      border-radius: 20px;
      padding: 5px 12px;
      font-family: var(--font-mono);
      font-size: 13px;
      font-weight: 600;
      color: var(--accent);

      .material-icons { font-size: 16px; }
    }

    .user-menu {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      position: relative;
      padding: 6px 10px;
      border-radius: var(--radius-md);
      transition: var(--transition);

      &:hover { background: var(--bg-hover); }
      .material-icons { font-size: 18px; color: var(--text-muted); }
    }

    .avatar {
      width: 32px; height: 32px;
      border-radius: 50%;
      background: var(--accent-dim);
      border: 1px solid rgba(0,229,255,0.3);
      color: var(--accent);
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-heading);
    }

    .user-info {
      display: flex;
      flex-direction: column;
      .user-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
      .user-role { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; }
    }

    .dropdown-menu {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 6px;
      min-width: 160px;
      box-shadow: var(--shadow-lg);
      z-index: 200;
      animation: fadeIn 0.15s ease;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: var(--transition);
      .material-icons { font-size: 16px; }

      &:hover { background: var(--bg-hover); color: var(--text-primary); }
      &.danger:hover { background: var(--red-dim); color: var(--red); }
    }

    .dropdown-divider { height: 1px; background: var(--border); margin: 4px 0; }

    /* ── Page Content ── */
    .content {
      flex: 1;
      padding: 28px 28px;
      overflow-y: auto;
    }

    @media (max-width: 768px) {
      .sidebar { display: none; }
      .mobile-menu-btn { display: flex; }
      .search-box { display: none; }
      .content { padding: 16px; }
    }
  `]
})
export class LayoutComponent {
  sidebarCollapsed = signal(false);
  mobileMenuOpen = signal(false);
  userMenuOpen = signal(false);

  navItems: NavItem[] = [
    { label: 'Dashboard',  icon: 'dashboard',            route: '/dashboard' },
    { label: 'Send SMS',   icon: 'send',                  route: '/send-sms' },
    { label: 'WhatsApp',   icon: 'chat',            route: '/whatsapp' },
    { label: 'Reports',    icon: 'bar_chart',             route: '/reports' },
    { label: 'Wallet',     icon: 'account_balance_wallet', route: '/wallet' },
    { label: 'Sender IDs', icon: 'label',                route: '/sender-ids' },
  ];

  get adminNavItems(): NavItem[] {
    return this.auth.isAdmin() ? [{ label: 'Admin Panel', icon: 'admin_panel_settings', route: '/admin' }] : [];
  }

  get initials(): string {
    const name = this.auth.currentUser()?.name || '';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  constructor(public auth: AuthService, private router: Router) {}

  logout(): void {
    this.auth.logout();
  }
}
