import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SenderIdService } from '../../core/services/sender-id.service';
import { SenderID } from '../../shared/models/index';

@Component({
  selector: 'app-sender-id',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fade-in">
      <div class="page-header">
        <h1>Sender IDs</h1>
        <p>Request and manage your custom SMS sender identifiers</p>
      </div>

      <div class="sender-layout">
        <!-- Request Form -->
        <div class="card">
          <div class="card__header">
            <span class="card__title">Request New Sender ID</span>
          </div>

          <div class="alert alert-info" style="margin-bottom:20px">
            <span class="material-icons">info</span>
            <div>Sender IDs must be 6 characters (e.g. SMSPTL). Approval takes 24–48 hours after admin review.</div>
          </div>

          <form [formGroup]="form" (ngSubmit)="requestSenderId()">
            <div class="form-group">
              <label>Sender ID</label>
              <div class="sender-input-wrap">
                <input type="text" class="form-control" formControlName="senderId"
                  placeholder="e.g. MYBIZ" maxlength="6" style="text-transform:uppercase"
                  [class.is-invalid]="submitted && f['senderId'].errors">
                <span class="char-hint font-mono">{{ form.get('senderId')?.value?.length || 0 }}/6</span>
              </div>
              @if (submitted && f['senderId'].errors?.['required']) {
                <div class="form-error"><span class="material-icons">error_outline</span> Sender ID is required</div>
              }
              @if (submitted && f['senderId'].errors?.['pattern']) {
                <div class="form-error"><span class="material-icons">error_outline</span> Only letters allowed (6 chars)</div>
              }
            </div>

            <button type="submit" class="btn btn-primary" [disabled]="loading()">
              @if (loading()) { <span class="spinner-sm"></span> Submitting... }
              @else { <span class="material-icons">add</span> Submit Request }
            </button>
          </form>

          <!-- Guidelines -->
          <div class="divider"></div>
          <div class="guidelines">
            <h4 style="font-size:13px;font-weight:600;margin-bottom:12px;color:var(--text-secondary)">
              Guidelines
            </h4>
            <ul>
              <li><span class="material-icons text-green">check</span> Exactly 6 alphabetic characters</li>
              <li><span class="material-icons text-green">check</span> Must represent your brand/business</li>
              <li><span class="material-icons text-green">check</span> No spaces or special characters</li>
              <li><span class="material-icons text-red">close</span> Generic names like "SENDER" will be rejected</li>
              <li><span class="material-icons text-red">close</span> Trademarked names without ownership proof</li>
            </ul>
          </div>
        </div>

        <!-- List -->
        <div class="card">
          <div class="card__header">
            <span class="card__title">My Sender IDs</span>
            <span class="text-muted" style="font-size:12px">{{ senderIds().length }} total</span>
          </div>

          @if (listLoading()) {
            <div style="padding:40px;text-align:center;color:var(--text-muted)">
              <div class="spinner-lg" style="margin:0 auto 12px"></div>
              Loading...
            </div>
          } @else if (senderIds().length) {
            <div class="sender-list">
              @for (sid of senderIds(); track sid.id) {
                <div class="sender-item">
                  <div class="sender-badge">{{ sid.senderId }}</div>
                  <div class="sender-meta">
                    <span class="badge" [class]="getStatusBadge(sid.status)">{{ sid.status }}</span>
                    @if (sid.reason) {
                      <span class="sender-reason text-muted">{{ sid.reason }}</span>
                    }
                  </div>
                  <div class="sender-date text-muted">
                    Requested {{ sid.requestedAt | date:'dd MMM yyyy' }}
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="empty-state">
              <div class="icon">🏷️</div>
              <h3>No sender IDs yet</h3>
              <p>Submit a request to get your custom sender ID approved.</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sender-layout {
      display: grid;
      grid-template-columns: 380px 1fr;
      gap: 20px;
      align-items: start;
    }

    .sender-input-wrap {
      position: relative;
      .form-control { padding-right: 48px; font-family: var(--font-mono); font-size: 16px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; }
    }

    .char-hint {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 11px;
      color: var(--text-muted);
    }

    .spinner-sm {
      width: 14px; height: 14px;
      border: 2px solid rgba(0,0,0,0.3);
      border-top-color: #000;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }

    .spinner-lg {
      width: 28px; height: 28px;
      border: 2px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .guidelines ul {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 8px;

      li {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: var(--text-secondary);
        .material-icons { font-size: 16px; }
      }
    }

    .sender-list { display: flex; flex-direction: column; gap: 2px; }

    .sender-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 8px;
      border-radius: var(--radius-md);
      border-bottom: 1px solid var(--border);
      transition: var(--transition);

      &:last-child { border-bottom: none; }
      &:hover { background: var(--bg-hover); }
    }

    .sender-badge {
      font-family: var(--font-mono);
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: 0.15em;
      min-width: 90px;
    }

    .sender-meta {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .sender-reason { font-size: 12px; font-style: italic; }
    .sender-date { font-size: 11px; white-space: nowrap; }

    @media (max-width: 1024px) {
      .sender-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class SenderIdComponent implements OnInit {
  form = this.fb.group({
    senderId: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{6}$/)]]
  });

  senderIds = signal<SenderID[]>([]);
  loading = signal(false);
  listLoading = signal(true);
  submitted = false;

  get f() { return this.form.controls; }

  constructor(
    private fb: FormBuilder,
    private senderIdService: SenderIdService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void { this.loadSenderIds(); }

  loadSenderIds(): void {
    this.listLoading.set(true);
    this.senderIdService.getMySenderIds().subscribe({
      next: ids => { this.senderIds.set(ids); this.listLoading.set(false); },
      error: () => this.listLoading.set(false)
    });
  }

  requestSenderId(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    const id = (this.form.get('senderId')?.value || '').toUpperCase();
    this.loading.set(true);

    this.senderIdService.requestSenderId(id).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success) {
          this.toastr.success('Sender ID request submitted!');
          this.form.reset();
          this.submitted = false;
          this.loadSenderIds();
        } else {
          this.toastr.error(res.message);
        }
      },
      error: err => {
        this.loading.set(false);
        this.toastr.error(err.error?.message || 'Request failed');
      }
    });
  }

  getStatusBadge(status: string): string {
    return { APPROVED: 'badge-success', PENDING: 'badge-warning', REJECTED: 'badge-danger' }[status] || 'badge-default';
  }
}
