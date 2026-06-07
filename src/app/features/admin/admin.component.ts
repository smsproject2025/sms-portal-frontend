import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AdminService, AdminStats, AdminUser } from '../../core/services/admin.service';
import { PagedResponse, SenderID, SmsLog } from '../../shared/models/index';

type AdminTab = 'overview' | 'users' | 'sender-ids' | 'sms-logs';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fade-in">
      <div class="page-header">
        <h1>Admin Panel</h1>
        <p>Platform-wide management and oversight</p>
      </div>

      <div class="tab-nav">
        <button class="tab-btn" [class.active]="activeTab() === 'overview'" (click)="setTab('overview')">
          <span class="material-icons" style="font-size:15px;vertical-align:middle">dashboard</span> Overview
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'users'" (click)="setTab('users')">
          <span class="material-icons" style="font-size:15px;vertical-align:middle">people</span> Users
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'sender-ids'" (click)="setTab('sender-ids')">
          <span class="material-icons" style="font-size:15px;vertical-align:middle">label</span> Sender IDs
          @if (pendingCount() > 0) {
            <span class="tab-badge">{{ pendingCount() }}</span>
          }
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'sms-logs'" (click)="setTab('sms-logs')">
          <span class="material-icons" style="font-size:15px;vertical-align:middle">list_alt</span> SMS Logs
        </button>
      </div>

      <!-- ── Overview Tab ── -->
      @if (activeTab() === 'overview') {
        @if (stats()) {
          <div class="grid grid-4" style="margin-bottom:24px">
            <div class="stat-card accent">
              <div class="stat-card__icon accent"><span class="material-icons">people</span></div>
              <div class="stat-card__value">{{ stats()!.totalUsers | number }}</div>
              <div class="stat-card__label">Total Users</div>
              <div class="stat-card__trend up">{{ stats()!.activeUsers }} active</div>
            </div>
            <div class="stat-card green">
              <div class="stat-card__icon green"><span class="material-icons">send</span></div>
              <div class="stat-card__value">{{ stats()!.totalSmsSent | number }}</div>
              <div class="stat-card__label">Total SMS Sent</div>
            </div>
            <div class="stat-card yellow">
              <div class="stat-card__icon yellow"><span class="material-icons">today</span></div>
              <div class="stat-card__value">{{ stats()!.smsSentToday | number }}</div>
              <div class="stat-card__label">SMS Today</div>
            </div>
            <div class="stat-card purple">
              <div class="stat-card__icon purple"><span class="material-icons">pending_actions</span></div>
              <div class="stat-card__value">{{ pendingCount() }}</div>
              <div class="stat-card__label">Pending Sender IDs</div>
            </div>
          </div>
        }
      }

      <!-- ── Users Tab ── -->
      @if (activeTab() === 'users') {
        <div class="card">
          <div class="card__header">
            <span class="card__title">All Users</span>
            <span class="text-muted" style="font-size:12px">{{ users()?.totalElements || 0 }} total</span>
          </div>

          @if (loadingUsers()) {
            <div class="loading-center"><div class="spinner-lg"></div></div>
          } @else {
            <div style="overflow-x:auto">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Mobile</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (user of users()?.content; track user.id) {
                    <tr>
                      <td class="font-mono text-muted" style="font-size:11px">#{{ user.id }}</td>
                      <td style="font-weight:500;color:var(--text-primary)">{{ user.name }}</td>
                      <td class="text-secondary">{{ user.email }}</td>
                      <td class="font-mono">{{ user.mobile }}</td>
                      <td>
                        <span class="badge" [class]="user.role === 'ADMIN' ? 'badge-purple' : 'badge-info'">
                          {{ user.role }}
                        </span>
                      </td>
                      <td>
                        <span class="badge" [class]="user.active ? 'badge-success' : 'badge-danger'">
                          {{ user.active ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                      <td class="text-muted" style="font-size:12px">{{ user.createdAt | date:'dd MMM yyyy' }}</td>
                      <td>
                        <button class="btn btn-sm" [class]="user.active ? 'btn-danger' : 'btn-success'"
                          (click)="toggleUser(user)">
                          {{ user.active ? 'Deactivate' : 'Activate' }}
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <div class="pagination-footer">
              <span class="text-muted" style="font-size:12px">
                Page {{ usersPage + 1 }} of {{ users()?.totalPages || 1 }}
              </span>
              <div class="pagination">
                <button [disabled]="usersPage === 0" (click)="loadUsers(usersPage - 1)">
                  <span class="material-icons" style="font-size:16px">chevron_left</span>
                </button>
                <button [disabled]="users()?.last" (click)="loadUsers(usersPage + 1)">
                  <span class="material-icons" style="font-size:16px">chevron_right</span>
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- ── Sender IDs Tab ── -->
      @if (activeTab() === 'sender-ids') {
        <div class="card">
          <div class="card__header">
            <span class="card__title">Pending Sender ID Requests</span>
            @if (pendingCount() > 0) {
              <span class="badge badge-warning">{{ pendingCount() }} pending</span>
            }
          </div>

          @if (loadingSenderIds()) {
            <div class="loading-center"><div class="spinner-lg"></div></div>
          } @else if (senderIds()?.content?.length) {
            <div style="overflow-x:auto">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Sender ID</th>
                    <th>Requested By</th>
                    <th>Requested At</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (sid of senderIds()!.content; track sid.id) {
                    <tr>
                      <td>
                        <span class="sender-mono font-mono">{{ sid.senderId }}</span>
                      </td>
                      <td class="text-secondary">User #{{ sid.id }}</td>
                      <td class="text-muted" style="font-size:12px">
                        {{ sid.requestedAt | date:'dd MMM yyyy, HH:mm' }}
                      </td>
                      <td>
                        <span class="badge" [class]="getStatusBadge(sid.status)">{{ sid.status }}</span>
                      </td>
                      <td>
                        @if (sid.status === 'PENDING') {
                          <div class="action-btns">
                            <button class="btn btn-sm btn-success" (click)="approve(sid)">
                              <span class="material-icons" style="font-size:14px">check</span> Approve
                            </button>
                            <button class="btn btn-sm btn-danger" (click)="openReject(sid)">
                              <span class="material-icons" style="font-size:14px">close</span> Reject
                            </button>
                          </div>
                        } @else {
                          <span class="text-muted" style="font-size:12px">—</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="empty-state">
              <div class="icon">✅</div>
              <h3>No pending requests</h3>
              <p>All sender ID requests have been reviewed.</p>
            </div>
          }
        </div>

        <!-- Reject Modal -->
        @if (rejectModal()) {
          <div class="modal-backdrop" (click)="rejectModal.set(null)">
            <div class="modal-box" (click)="$event.stopPropagation()">
              <h3 style="margin-bottom:16px">Reject Sender ID</h3>
              <p class="text-secondary" style="margin-bottom:16px">
                Rejecting <strong class="text-accent font-mono">{{ rejectModal()!.senderId }}</strong>
              </p>
              <div class="form-group">
                <label>Reason</label>
                <textarea class="form-control" [(ngModel)]="rejectReason" rows="3"
                  placeholder="Reason for rejection..."></textarea>
              </div>
              <div class="modal-actions">
                <button class="btn btn-secondary" (click)="rejectModal.set(null)">Cancel</button>
                <button class="btn btn-danger" (click)="confirmReject()">Reject</button>
              </div>
            </div>
          </div>
        }
      }

      <!-- ── SMS Logs Tab ── -->
      @if (activeTab() === 'sms-logs') {
        <div class="card">
          <div class="card__header">
            <span class="card__title">All SMS Logs</span>
            <span class="text-muted" style="font-size:12px">{{ smsLogs()?.totalElements || 0 }} total</span>
          </div>

          @if (loadingLogs()) {
            <div class="loading-center"><div class="spinner-lg"></div></div>
          } @else if (smsLogs()?.content?.length) {
            <div style="overflow-x:auto">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Mobile</th>
                    <th>Message</th>
                    <th>Sender</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Cost</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  @for (log of smsLogs()!.content; track log.id) {
                    <tr>
                      <td class="font-mono text-muted" style="font-size:11px">#{{ log.id }}</td>
                      <td class="font-mono">{{ log.mobile }}</td>
                      <td><div class="msg-clip">{{ log.message }}</div></td>
                      <td><span class="badge badge-info">{{ log.senderId }}</span></td>
                      <td><span class="badge" [class]="getTypeBadge(log.type)">{{ log.type }}</span></td>
                      <td><span class="badge" [class]="getSmsBadge(log.status)">{{ log.status }}</span></td>
                      <td class="font-mono text-accent">₹{{ log.cost | number:'1.2-2' }}</td>
                      <td class="text-muted" style="font-size:11px">{{ log.createdAt | date:'dd MMM, HH:mm' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <div class="pagination-footer">
              <span class="text-muted" style="font-size:12px">
                Page {{ logsPage + 1 }} of {{ smsLogs()?.totalPages || 1 }}
              </span>
              <div class="pagination">
                <button [disabled]="logsPage === 0" (click)="loadLogs(logsPage - 1)">
                  <span class="material-icons" style="font-size:16px">chevron_left</span>
                </button>
                <button [disabled]="smsLogs()?.last" (click)="loadLogs(logsPage + 1)">
                  <span class="material-icons" style="font-size:16px">chevron_right</span>
                </button>
              </div>
            </div>
          } @else {
            <div class="empty-state">
              <div class="icon">📋</div>
              <h3>No SMS logs</h3>
              <p>Platform SMS logs will appear here.</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .tab-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--red);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      width: 18px; height: 18px;
      border-radius: 50%;
      margin-left: 4px;
    }

    .loading-center {
      display: flex;
      justify-content: center;
      padding: 60px;
    }

    .spinner-lg {
      width: 32px; height: 32px;
      border: 3px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .sender-mono {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.15em;
      color: var(--text-primary);
    }

    .action-btns { display: flex; gap: 6px; }

    .msg-clip {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 12px;
      color: var(--text-secondary);
    }

    .pagination-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 16px;
      margin-top: 16px;
      border-top: 1px solid var(--border);
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999;
      backdrop-filter: blur(4px);
    }

    .modal-box {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 28px;
      width: 420px;
      max-width: 90vw;
      box-shadow: var(--shadow-lg);
      animation: fadeIn 0.2s ease;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
  `]
})
export class AdminComponent implements OnInit {
  activeTab = signal<AdminTab>('overview');
  stats = signal<AdminStats | null>(null);
  users = signal<PagedResponse<AdminUser> | null>(null);
  senderIds = signal<PagedResponse<SenderID> | null>(null);
  smsLogs = signal<PagedResponse<SmsLog> | null>(null);
  pendingCount = signal(0);
  rejectModal = signal<SenderID | null>(null);
  rejectReason = '';

  loadingUsers = signal(false);
  loadingSenderIds = signal(false);
  loadingLogs = signal(false);

  usersPage = 0;
  senderIdsPage = 0;
  logsPage = 0;

  constructor(private adminService: AdminService, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.adminService.getStats().subscribe(s => this.stats.set(s));
    this.adminService.getPendingSenderIds(0, 1).subscribe(p => this.pendingCount.set(p.totalElements));
  }

  setTab(tab: AdminTab): void {
    this.activeTab.set(tab);
    if (tab === 'users' && !this.users()) this.loadUsers(0);
    if (tab === 'sender-ids' && !this.senderIds()) this.loadSenderIds(0);
    if (tab === 'sms-logs' && !this.smsLogs()) this.loadLogs(0);
  }

  loadUsers(page: number): void {
    this.usersPage = page;
    this.loadingUsers.set(true);
    this.adminService.getUsers(page).subscribe({
      next: d => { this.users.set(d); this.loadingUsers.set(false); },
      error: () => this.loadingUsers.set(false)
    });
  }

  loadSenderIds(page: number): void {
    this.senderIdsPage = page;
    this.loadingSenderIds.set(true);
    this.adminService.getPendingSenderIds(page).subscribe({
      next: d => { this.senderIds.set(d); this.loadingSenderIds.set(false); },
      error: () => this.loadingSenderIds.set(false)
    });
  }

  loadLogs(page: number): void {
    this.logsPage = page;
    this.loadingLogs.set(true);
    this.adminService.getAllSmsLogs(page).subscribe({
      next: d => { this.smsLogs.set(d); this.loadingLogs.set(false); },
      error: () => this.loadingLogs.set(false)
    });
  }

  toggleUser(user: AdminUser): void {
    this.adminService.toggleUserActive(user.id).subscribe({
      next: res => {
        if (res.success) {
          user.active = !user.active;
          this.toastr.success(res.data);
        }
      },
      error: () => this.toastr.error('Action failed')
    });
  }

  approve(sid: SenderID): void {
    this.adminService.approveSenderId(sid.id).subscribe({
      next: res => {
        if (res.success) {
          this.toastr.success(`Sender ID "${sid.senderId}" approved`);
          this.pendingCount.update(n => Math.max(0, n - 1));
          this.loadSenderIds(this.senderIdsPage);
        }
      },
      error: () => this.toastr.error('Approval failed')
    });
  }

  openReject(sid: SenderID): void {
    this.rejectModal.set(sid);
    this.rejectReason = '';
  }

  confirmReject(): void {
    const sid = this.rejectModal();
    if (!sid) return;
    this.adminService.rejectSenderId(sid.id, this.rejectReason).subscribe({
      next: res => {
        if (res.success) {
          this.toastr.success(`Sender ID "${sid.senderId}" rejected`);
          this.rejectModal.set(null);
          this.pendingCount.update(n => Math.max(0, n - 1));
          this.loadSenderIds(this.senderIdsPage);
        }
      },
      error: () => this.toastr.error('Rejection failed')
    });
  }

  getStatusBadge(s: string): string {
    return { APPROVED: 'badge-success', PENDING: 'badge-warning', REJECTED: 'badge-danger' }[s] || 'badge-default';
  }
  getTypeBadge(t: string): string {
    return { PROMOTIONAL: 'badge-purple', TRANSACTIONAL: 'badge-info', OTP: 'badge-warning' }[t] || 'badge-default';
  }
  getSmsBadge(s: string): string {
    return { DELIVERED: 'badge-success', SENT: 'badge-info', QUEUED: 'badge-warning', FAILED: 'badge-danger' }[s] || 'badge-default';
  }
}
