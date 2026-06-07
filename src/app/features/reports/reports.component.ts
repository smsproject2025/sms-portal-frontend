import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SmsService } from '../../core/services/sms.service';
import { PagedResponse, SmsLog, SmsStatus } from '../../shared/models/index';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fade-in">
      <div class="page-header">
        <h1>Delivery Reports</h1>
        <p>Track the status of all your SMS messages</p>
      </div>

      <!-- Filters -->
      <div class="card" style="margin-bottom:20px">
        <div class="filters">
          <div class="filter-status-tabs">
            @for (status of statusOptions; track status.value) {
              <button class="status-tab" [class.active]="selectedStatus === status.value"
                (click)="filterByStatus(status.value)">
                <span class="dot" [class]="status.dotClass"></span>
                {{ status.label }}
              </button>
            }
          </div>

          <div class="filter-right">
            <select class="form-control" style="width:auto" [(ngModel)]="pageSize" (change)="loadReports()">
              <option [value]="10">10 / page</option>
              <option [value]="20">20 / page</option>
              <option [value]="50">50 / page</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="card">
        @if (loading()) {
          <div class="loading-state">
            <div class="spinner-lg"></div>
            <span>Loading reports...</span>
          </div>
        } @else if (reports()?.content?.length) {
          <div style="overflow-x:auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Mobile</th>
                  <th>Message</th>
                  <th>Sender ID</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Cost</th>
                  <th>Sent At</th>
                </tr>
              </thead>
              <tbody>
                @for (log of reports()!.content; track log.id; let i = $index) {
                  <tr>
                    <td class="font-mono text-muted" style="font-size:12px">
                      {{ (currentPage * pageSize) + i + 1 }}
                    </td>
                    <td class="font-mono text-primary">{{ log.mobile }}</td>
                    <td>
                      <div class="msg-preview">{{ log.message }}</div>
                    </td>
                    <td>
                      <span class="badge badge-info">{{ log.senderId }}</span>
                    </td>
                    <td>
                      <span class="badge" [class]="getTypeBadge(log.type)">{{ log.type }}</span>
                    </td>
                    <td>
                      <span class="badge" [class]="getStatusBadge(log.status)">
                        {{ log.status }}
                      </span>
                    </td>
                    <td class="font-mono text-accent">₹{{ log.cost | number:'1.2-2' }}</td>
                    <td class="text-muted" style="font-size:12px">
                      {{ log.createdAt | date:'dd MMM, HH:mm' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="pagination-footer">
            <span class="total-text">
              Showing {{ (currentPage * pageSize) + 1 }}–{{ min((currentPage + 1) * pageSize, reports()!.totalElements) }}
              of {{ reports()!.totalElements | number }} records
            </span>
            <div class="pagination">
              <button [disabled]="currentPage === 0" (click)="goToPage(0)">
                <span class="material-icons" style="font-size:16px">first_page</span>
              </button>
              <button [disabled]="currentPage === 0" (click)="goToPage(currentPage - 1)">
                <span class="material-icons" style="font-size:16px">chevron_left</span>
              </button>

              @for (p of visiblePages(); track p) {
                <button [class.active]="p === currentPage" (click)="goToPage(p)">
                  {{ p + 1 }}
                </button>
              }

              <button [disabled]="currentPage >= reports()!.totalPages - 1" (click)="goToPage(currentPage + 1)">
                <span class="material-icons" style="font-size:16px">chevron_right</span>
              </button>
              <button [disabled]="currentPage >= reports()!.totalPages - 1" (click)="goToPage(reports()!.totalPages - 1)">
                <span class="material-icons" style="font-size:16px">last_page</span>
              </button>
            </div>
          </div>
        } @else {
          <div class="empty-state">
            <div class="icon">📊</div>
            <h3>No records found</h3>
            <p>Your SMS delivery reports will appear here once you start sending.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .filters {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }

    .filter-status-tabs {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }

    .status-tab {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 20px;
      border: 1px solid var(--border);
      background: var(--bg-elevated);
      color: var(--text-secondary);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: var(--transition);

      &.active { border-color: var(--accent); background: var(--accent-dim); color: var(--accent); }
      &:hover:not(.active) { background: var(--bg-hover); color: var(--text-primary); }
    }

    .dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      display: inline-block;
      &.green  { background: var(--green); }
      &.red    { background: var(--red); }
      &.accent { background: var(--accent); }
      &.yellow { background: var(--yellow); }
      &.muted  { background: var(--text-muted); }
    }

    .msg-preview {
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 13px;
      color: var(--text-secondary);
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px;
      gap: 16px;
      color: var(--text-muted);
    }

    .spinner-lg {
      width: 36px; height: 36px;
      border: 3px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .pagination-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 16px;
      margin-top: 16px;
      border-top: 1px solid var(--border);
      flex-wrap: wrap;
      gap: 12px;
    }

    .total-text { font-size: 12px; color: var(--text-muted); }
  `]
})
export class ReportsComponent implements OnInit {
  reports = signal<PagedResponse<SmsLog> | null>(null);
  loading = signal(true);
  currentPage = 0;
  pageSize = 20;
  selectedStatus: string = 'ALL';

  statusOptions = [
    { label: 'All', value: 'ALL', dotClass: 'muted' },
    { label: 'Queued', value: 'QUEUED', dotClass: 'yellow' },
    { label: 'Sent', value: 'SENT', dotClass: 'accent' },
    { label: 'Delivered', value: 'DELIVERED', dotClass: 'green' },
    { label: 'Failed', value: 'FAILED', dotClass: 'red' }
  ];

  constructor(private smsService: SmsService) {}

  ngOnInit(): void { this.loadReports(); }

  loadReports(): void {
    this.loading.set(true);
    const obs = this.selectedStatus === 'ALL'
      ? this.smsService.getReports(this.currentPage, this.pageSize)
      : this.smsService.getReportsByStatus(this.selectedStatus as SmsStatus, this.currentPage, this.pageSize);

    obs.subscribe({
      next: data => { this.reports.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  filterByStatus(status: string): void {
    this.selectedStatus = status;
    this.currentPage = 0;
    this.loadReports();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadReports();
  }

  visiblePages(): number[] {
    const total = this.reports()?.totalPages || 0;
    const start = Math.max(0, this.currentPage - 2);
    const end = Math.min(total - 1, this.currentPage + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  min(a: number, b: number): number { return Math.min(a, b); }

  getStatusBadge(status: SmsStatus): string {
    const map: Record<string, string> = {
      DELIVERED: 'badge-success', SENT: 'badge-info',
      QUEUED: 'badge-warning', FAILED: 'badge-danger', REJECTED: 'badge-danger'
    };
    return map[status] || 'badge-default';
  }

  getTypeBadge(type: string): string {
    const map: Record<string, string> = {
      PROMOTIONAL: 'badge-purple', TRANSACTIONAL: 'badge-info', OTP: 'badge-warning'
    };
    return map[type] || 'badge-default';
  }
}
