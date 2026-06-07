import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReportService } from '../../core/services/sms.service';
import { DashboardStats } from '../../shared/models/index';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="fade-in">
      <div class="page-header">
        <h1>Dashboard</h1>
        <p>Your SMS campaign overview</p>
      </div>

      @if (loading()) {
        <div class="skeleton-grid grid grid-4">
          @for (i of [1,2,3,4]; track i) {
            <div class="skeleton-card"></div>
          }
        </div>
      } @else if (stats()) {
        <!-- Stats Grid -->
        <div class="grid grid-4" style="margin-bottom:24px">
          <div class="stat-card accent">
            <div class="stat-card__icon accent"><span class="material-icons">send</span></div>
            <div class="stat-card__value">{{ stats()!.totalSent | number }}</div>
            <div class="stat-card__label">Total Sent</div>
            <div class="stat-card__trend up">↑ {{ stats()!.sentToday | number }} today</div>
          </div>

          <div class="stat-card green">
            <div class="stat-card__icon green"><span class="material-icons">check_circle</span></div>
            <div class="stat-card__value">{{ stats()!.totalDelivered | number }}</div>
            <div class="stat-card__label">Delivered</div>
            <div class="stat-card__trend up">{{ stats()!.deliveryRate }}% rate</div>
          </div>

          <div class="stat-card red">
            <div class="stat-card__icon red"><span class="material-icons">cancel</span></div>
            <div class="stat-card__value">{{ stats()!.totalFailed | number }}</div>
            <div class="stat-card__label">Failed</div>
            <div class="stat-card__trend down">{{ stats()!.totalPending }} pending</div>
          </div>

          <div class="stat-card yellow">
            <div class="stat-card__icon yellow"><span class="material-icons">account_balance_wallet</span></div>
            <div class="stat-card__value">₹{{ stats()!.walletBalance | number:'1.2-2' }}</div>
            <div class="stat-card__label">Wallet Balance</div>
            <div class="stat-card__trend">₹{{ stats()!.totalSpent | number:'1.2-2' }} spent</div>
          </div>
        </div>

        <!-- Chart & Quick Actions -->
        <div class="grid grid-2" style="margin-bottom:24px">
          <!-- Chart -->
          <div class="card">
            <div class="card__header">
              <span class="card__title">SMS Activity — Last 7 Days</span>
            </div>
            <div class="chart-container">
              @if (stats()!.dailyStats.length > 0) {
                <div class="bar-chart">
                  @for (day of stats()!.dailyStats; track day.date) {
                    <div class="bar-group">
                      <div class="bars">
                        <div class="bar sent" [style.height.%]="getBarHeight(day.total)"
                          [title]="day.total + ' sent'"></div>
                        <div class="bar delivered" [style.height.%]="getBarHeight(day.delivered)"
                          [title]="day.delivered + ' delivered'"></div>
                      </div>
                      <span class="bar-label">{{ formatDate(day.date) }}</span>
                    </div>
                  }
                </div>
                <div class="chart-legend">
                  <span><span class="dot sent"></span> Sent</span>
                  <span><span class="dot delivered"></span> Delivered</span>
                </div>
              } @else {
                <div class="empty-state" style="padding:40px 0">
                  <span class="material-icons icon">bar_chart</span>
                  <p>No data for the last 7 days</p>
                </div>
              }
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="card">
            <div class="card__header">
              <span class="card__title">Quick Actions</span>
            </div>
            <div class="quick-actions">
              <a routerLink="/send-sms" class="action-item">
                <div class="action-icon accent"><span class="material-icons">send</span></div>
                <div class="action-text">
                  <div class="action-title">Send SMS</div>
                  <div class="action-desc">Quick single or bulk SMS</div>
                </div>
                <span class="material-icons action-arrow">chevron_right</span>
              </a>

              <a routerLink="/send-sms" [queryParams]="{tab:'bulk'}" class="action-item">
                <div class="action-icon purple"><span class="material-icons">upload_file</span></div>
                <div class="action-text">
                  <div class="action-title">Bulk Upload</div>
                  <div class="action-desc">Upload CSV of numbers</div>
                </div>
                <span class="material-icons action-arrow">chevron_right</span>
              </a>

              <a routerLink="/wallet" class="action-item">
                <div class="action-icon yellow"><span class="material-icons">add_card</span></div>
                <div class="action-text">
                  <div class="action-title">Recharge Wallet</div>
                  <div class="action-desc">Add balance via Razorpay</div>
                </div>
                <span class="material-icons action-arrow">chevron_right</span>
              </a>

              <a routerLink="/reports" class="action-item">
                <div class="action-icon green"><span class="material-icons">analytics</span></div>
                <div class="action-text">
                  <div class="action-title">Delivery Reports</div>
                  <div class="action-desc">Track all SMS status</div>
                </div>
                <span class="material-icons action-arrow">chevron_right</span>
              </a>

              <a routerLink="/sender-ids" class="action-item">
                <div class="action-icon accent"><span class="material-icons">label</span></div>
                <div class="action-text">
                  <div class="action-title">Sender IDs</div>
                  <div class="action-desc">Manage your sender IDs</div>
                </div>
                <span class="material-icons action-arrow">chevron_right</span>
              </a>
            </div>
          </div>
        </div>

        <!-- Delivery Rate Progress -->
        <div class="card">
          <div class="card__header">
            <span class="card__title">Overall Performance</span>
          </div>
          <div class="perf-grid">
            <div class="perf-item">
              <div class="flex-between" style="margin-bottom:8px">
                <span class="text-secondary" style="font-size:13px">Delivery Rate</span>
                <span class="font-mono text-accent">{{ stats()!.deliveryRate }}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill accent" [style.width.%]="stats()!.deliveryRate"></div>
              </div>
            </div>

            <div class="perf-item">
              <div class="flex-between" style="margin-bottom:8px">
                <span class="text-secondary" style="font-size:13px">Success Rate</span>
                <span class="font-mono text-green">
                  {{ stats()!.totalSent > 0 ? ((stats()!.totalDelivered / stats()!.totalSent) * 100 | number:'1.0-1') : '0' }}%
                </span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill green"
                  [style.width.%]="stats()!.totalSent > 0 ? (stats()!.totalDelivered / stats()!.totalSent) * 100 : 0"></div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .skeleton-grid { margin-bottom: 24px; }
    .skeleton-card {
      height: 120px;
      background: linear-gradient(90deg, var(--bg-card) 25%, var(--bg-hover) 50%, var(--bg-card) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .chart-container { padding: 8px 0; }

    .bar-chart {
      display: flex;
      align-items: flex-end;
      gap: 16px;
      height: 160px;
      padding-bottom: 24px;
      position: relative;

      &::before {
        content: '';
        position: absolute;
        bottom: 24px; left: 0; right: 0;
        height: 1px;
        background: var(--border);
      }
    }

    .bar-group {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      gap: 4px;

      .bars {
        flex: 1;
        width: 100%;
        display: flex;
        align-items: flex-end;
        gap: 2px;
      }
    }

    .bar {
      flex: 1;
      border-radius: 3px 3px 0 0;
      min-height: 4px;
      transition: height 0.5s ease;

      &.sent { background: rgba(0,229,255,0.4); }
      &.delivered { background: var(--accent); }
    }

    .bar-label {
      font-size: 10px;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .chart-legend {
      display: flex;
      gap: 16px;
      margin-top: 12px;
      font-size: 12px;
      color: var(--text-secondary);

      .dot {
        width: 8px; height: 8px;
        border-radius: 2px;
        display: inline-block;
        margin-right: 4px;
        &.sent { background: rgba(0,229,255,0.4); }
        &.delivered { background: var(--accent); }
      }
    }

    .quick-actions { display: flex; flex-direction: column; gap: 4px; }

    .action-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 8px;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: var(--transition);
      text-decoration: none;

      &:hover { background: var(--bg-hover); }
    }

    .action-icon {
      width: 36px; height: 36px;
      border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;

      .material-icons { font-size: 18px; }
      &.accent { background: var(--accent-dim); color: var(--accent); }
      &.green  { background: var(--green-dim);  color: var(--green); }
      &.yellow { background: var(--yellow-dim); color: var(--yellow); }
      &.purple { background: var(--purple-dim); color: var(--purple); }
    }

    .action-text { flex: 1; }
    .action-title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
    .action-desc { font-size: 11px; color: var(--text-muted); }
    .action-arrow { color: var(--text-muted); font-size: 18px; }

    .perf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }

    .progress-bar {
      height: 6px;
      background: var(--bg-elevated);
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 1s ease;

      &.accent { background: var(--accent); box-shadow: 0 0 8px rgba(0,229,255,0.4); }
      &.green  { background: var(--green); }
    }

    @media (max-width: 1024px) {
      .perf-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  stats = signal<DashboardStats | null>(null);
  loading = signal(true);

  constructor(private reportService: ReportService) {}

  ngOnInit(): void {
    this.reportService.getDashboardStats().subscribe({
      next: data => { this.stats.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  getBarHeight(value: number): number {
    const max = Math.max(...(this.stats()?.dailyStats.map(d => d.total) || [1]), 1);
    return (value / max) * 100;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  }
}
