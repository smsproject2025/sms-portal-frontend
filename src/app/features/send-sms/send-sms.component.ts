import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { SmsService } from '../../core/services/sms.service';
import { SenderIdService } from '../../core/services/sender-id.service';
import { AuthService } from '../../core/services/auth.service';
import { SenderID } from '../../shared/models/index';

@Component({
  selector: 'app-send-sms',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fade-in">
      <div class="page-header">
        <h1>Send SMS</h1>
        <p>Send promotional, transactional or OTP messages</p>
      </div>

      <div class="tab-nav">
        <button class="tab-btn" [class.active]="activeTab() === 'quick'" (click)="activeTab.set('quick')">
          <span class="material-icons" style="font-size:16px;vertical-align:middle">send</span> Quick SMS
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'bulk'" (click)="activeTab.set('bulk')">
          <span class="material-icons" style="font-size:16px;vertical-align:middle">upload_file</span> Bulk CSV
        </button>
      </div>

      <div class="send-layout">
        <!-- Form Panel -->
        <div class="card">
          @if (activeTab() === 'quick') {
            <div class="card__header">
              <span class="card__title">Compose Message</span>
              <span class="char-count font-mono" [class.warn]="charCount > 140" [class.over]="charCount > 160">
                {{ charCount }}/160
              </span>
            </div>
            <form [formGroup]="smsForm" (ngSubmit)="sendQuick()">
              <div class="form-group">
                <label>Mobile Numbers <span class="text-muted">(comma-separated)</span></label>
                <textarea class="form-control" formControlName="mobiles" rows="3"
                  placeholder="9876543210, 9123456789, ..."
                  [class.is-invalid]="submitted && sf['mobiles'].errors"></textarea>
                @if (submitted && sf['mobiles'].errors) {
                  <div class="form-error"><span class="material-icons">error_outline</span> At least one number required</div>
                }
                <div style="font-size:11px;color:var(--text-muted);margin-top:4px">
                  {{ mobileCount }} number(s) detected
                </div>
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label>Sender ID</label>
                  <select class="form-control" formControlName="senderId"
                    [class.is-invalid]="submitted && sf['senderId'].errors">
                    @for (sid of approvedSenderIds(); track sid.id) {
                      <option [value]="sid.senderId">{{ sid.senderId }}</option>
                    }
                    @if (approvedSenderIds().length === 0) {
                      <option value="" disabled>No approved sender IDs</option>
                    }
                  </select>
                </div>

                <div class="form-group">
                  <label>SMS Type</label>
                  <select class="form-control" formControlName="type">
                    <option value="PROMOTIONAL">Promotional (₹0.15/SMS)</option>
                    <option value="TRANSACTIONAL">Transactional (₹0.25/SMS)</option>
                    <option value="OTP">OTP (₹0.20/SMS)</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>Message</label>
                <textarea class="form-control" formControlName="message" rows="5"
                  placeholder="Type your message here..."
                  [class.is-invalid]="submitted && sf['message'].errors"
                  (input)="updateCharCount()"></textarea>
                @if (submitted && sf['message'].errors) {
                  <div class="form-error"><span class="material-icons">error_outline</span> Message is required</div>
                }
              </div>

              @if (result()) {
                <div class="alert" [class.alert-success]="result()!.success" [class.alert-danger]="!result()!.success">
                  <span class="material-icons">{{ result()!.success ? 'check_circle' : 'error' }}</span>
                  <div>
                    <strong>{{ result()!.success ? 'Queued successfully!' : 'Error' }}</strong><br>
                    {{ result()!.message }}
                    @if (result()!.success && result()!.data) {
                      &mdash; {{ result()!.data.totalNumbers }} SMS &#64; ₹{{ result()!.data.totalCost | number:'1.2-2' }}
                    }
                  </div>
                </div>
              }

              <div class="form-actions">
                <div class="cost-preview">
                  <span class="text-muted">Estimated Cost:</span>
                  <span class="cost font-mono text-accent">₹{{ estimatedCost | number:'1.2-2' }}</span>
                </div>
                <button type="submit" class="btn btn-primary" [disabled]="loading()">
                  @if (loading()) { <span class="spinner-sm"></span> Sending... }
                  @else { <span class="material-icons">send</span> Send SMS }
                </button>
              </div>
            </form>
          }

          @if (activeTab() === 'bulk') {
            <div class="card__header">
              <span class="card__title">Bulk SMS via CSV</span>
            </div>
            <form [formGroup]="bulkForm" (ngSubmit)="sendBulk()">
              <!-- CSV Upload -->
              <div class="form-group">
                <label>Upload CSV File</label>
                <div class="file-drop" [class.has-file]="csvFile()"
                  (click)="csvInput.click()"
                  (dragover)="$event.preventDefault()"
                  (drop)="onFileDrop($event)">
                  @if (csvFile()) {
                    <span class="material-icons text-accent">description</span>
                    <span class="text-primary">{{ csvFile()!.name }}</span>
                    <span class="text-muted" style="font-size:12px">{{ (csvFile()!.size / 1024 | number:'1.0-1') }} KB</span>
                  } @else {
                    <span class="material-icons" style="font-size:40px;color:var(--text-muted)">cloud_upload</span>
                    <span class="text-secondary">Drop CSV here or click to browse</span>
                    <span class="text-muted" style="font-size:12px">First column must be mobile numbers</span>
                  }
                </div>
                <input #csvInput type="file" accept=".csv" style="display:none" (change)="onFileSelect($event)">
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label>Sender ID</label>
                  <select class="form-control" formControlName="senderId">
                    @for (sid of approvedSenderIds(); track sid.id) {
                      <option [value]="sid.senderId">{{ sid.senderId }}</option>
                    }
                  </select>
                </div>

                <div class="form-group">
                  <label>SMS Type</label>
                  <select class="form-control" formControlName="type">
                    <option value="PROMOTIONAL">Promotional</option>
                    <option value="TRANSACTIONAL">Transactional</option>
                    <option value="OTP">OTP</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>Message</label>
                <textarea class="form-control" formControlName="message" rows="5"
                  placeholder="Your message to all numbers in the CSV..."></textarea>
              </div>

              @if (result()) {
                <div class="alert" [class.alert-success]="result()!.success" [class.alert-danger]="!result()!.success">
                  <span class="material-icons">{{ result()!.success ? 'check_circle' : 'error' }}</span>
                  {{ result()!.message }}
                </div>
              }

              <div class="form-actions">
                <button type="submit" class="btn btn-primary" [disabled]="loading() || !csvFile()">
                  @if (loading()) { <span class="spinner-sm"></span> Uploading... }
                  @else { <span class="material-icons">rocket_launch</span> Send Bulk SMS }
                </button>
              </div>
            </form>
          }
        </div>

        <!-- Info Panel -->
        <div class="info-panel">
          <div class="card">
            <div class="card__header"><span class="card__title">SMS Rates</span></div>
            <div class="rates">
              <div class="rate-item">
                <span class="rate-type">Promotional</span>
                <span class="rate-price font-mono">₹0.15/SMS</span>
              </div>
              <div class="rate-item">
                <span class="rate-type">Transactional</span>
                <span class="rate-price font-mono">₹0.25/SMS</span>
              </div>
              <div class="rate-item">
                <span class="rate-type">OTP</span>
                <span class="rate-price font-mono">₹0.20/SMS</span>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card__header"><span class="card__title">Tips</span></div>
            <ul class="tips-list">
              <li><span class="material-icons text-accent">info</span> Max 160 characters per SMS</li>
              <li><span class="material-icons text-accent">info</span> Separate numbers with commas</li>
              <li><span class="material-icons text-accent">info</span> DND numbers will be filtered</li>
              <li><span class="material-icons text-accent">info</span> CSV: first column = mobile</li>
              <li><span class="material-icons text-accent">info</span> Sender ID must be approved</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .send-layout {
      display: grid;
      grid-template-columns: 1fr 280px;
      gap: 20px;
      align-items: start;
    }

    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

    .char-count {
      font-size: 12px;
      color: var(--text-muted);
      &.warn { color: var(--yellow); }
      &.over { color: var(--red); }
    }

    .file-drop {
      border: 2px dashed var(--border);
      border-radius: var(--radius-lg);
      padding: 40px 24px;
      text-align: center;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      transition: var(--transition);

      &:hover, &.has-file {
        border-color: var(--accent);
        background: var(--accent-dim);
      }
    }

    .form-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 8px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
    }

    .cost-preview {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      .cost { font-size: 18px; font-weight: 700; }
    }

    .spinner-sm {
      width: 14px; height: 14px;
      border: 2px solid rgba(0,0,0,0.3);
      border-top-color: #000;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }

    .rates { display: flex; flex-direction: column; gap: 2px; }

    .rate-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid var(--border);
      &:last-child { border-bottom: none; }

      .rate-type { font-size: 13px; color: var(--text-secondary); }
      .rate-price { color: var(--accent); font-size: 14px; }
    }

    .tips-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;

      li {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        font-size: 12px;
        color: var(--text-secondary);
        line-height: 1.5;

        .material-icons { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
      }
    }

    @media (max-width: 1024px) {
      .send-layout { grid-template-columns: 1fr; }
      .info-panel { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    }

    @media (max-width: 600px) {
      .form-row-2 { grid-template-columns: 1fr; }
      .info-panel { grid-template-columns: 1fr; }
    }
  `]
})
export class SendSmsComponent implements OnInit {
  activeTab = signal<'quick' | 'bulk'>('quick');
  loading = signal(false);
  submitted = false;
  charCount = 0;
  csvFile = signal<File | null>(null);
  approvedSenderIds = signal<SenderID[]>([]);
  result = signal<any>(null);

  smsForm = this.fb.group({
    mobiles: ['', Validators.required],
    message: ['', Validators.required],
    senderId: ['', Validators.required],
    type: ['PROMOTIONAL']
  });

  bulkForm = this.fb.group({
    message: ['', Validators.required],
    senderId: ['', Validators.required],
    type: ['PROMOTIONAL']
  });

  get sf() { return this.smsForm.controls; }

  get mobileCount(): number {
    const val = this.smsForm.get('mobiles')?.value || '';
    return val.split(',').map((m: string) => m.trim()).filter((m: string) => m.length >= 10).length;
  }

  get estimatedCost(): number {
    const rates: Record<string, number> = { PROMOTIONAL: 0.15, TRANSACTIONAL: 0.25, OTP: 0.20 };
    const type = this.smsForm.get('type')?.value || 'PROMOTIONAL';
    return this.mobileCount * rates[type];
  }

  constructor(
    private fb: FormBuilder,
    private smsService: SmsService,
    private senderIdService: SenderIdService,
    private auth: AuthService,
    private toastr: ToastrService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.senderIdService.getMySenderIds().subscribe(ids => {
      const approved = ids.filter(s => s.status === 'APPROVED');
      this.approvedSenderIds.set(approved);
      if (approved.length > 0) {
        this.smsForm.get('senderId')?.setValue(approved[0].senderId);
        this.bulkForm.get('senderId')?.setValue(approved[0].senderId);
      }
    });

    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'bulk') this.activeTab.set('bulk');
    });
  }

  updateCharCount(): void {
    this.charCount = this.smsForm.get('message')?.value?.length || 0;
  }

  sendQuick(): void {
    this.submitted = true;
    this.result.set(null);
    if (this.smsForm.invalid) return;

    const mobiles = (this.smsForm.get('mobiles')?.value || '')
      .split(',').map((m: string) => m.trim()).filter((m: string) => m);

    this.loading.set(true);
    this.smsService.sendSms({
      mobiles,
      message: this.smsForm.get('message')?.value || '',
      senderId: this.smsForm.get('senderId')?.value || '',
      type: this.smsForm.get('type')?.value as any
    }).subscribe({
      next: res => {
        this.loading.set(false);
        this.result.set(res);
        if (res.success) {
          this.toastr.success(`${res.data.totalNumbers} SMS queued!`);
          this.auth.updateBalance(res.data.remainingBalance);
          this.smsForm.get('mobiles')?.reset();
          this.smsForm.get('message')?.reset();
          this.submitted = false;
        }
      },
      error: err => {
        this.loading.set(false);
        this.result.set({ success: false, message: err.error?.message || 'Failed to send SMS' });
      }
    });
  }

  sendBulk(): void {
    if (!this.csvFile() || this.bulkForm.invalid) return;
    this.loading.set(true);
    this.result.set(null);

    this.smsService.sendBulkCsv(
      this.csvFile()!,
      this.bulkForm.get('senderId')?.value || '',
      this.bulkForm.get('message')?.value || '',
      this.bulkForm.get('type')?.value || 'PROMOTIONAL'
    ).subscribe({
      next: res => {
        this.loading.set(false);
        this.result.set(res);
        if (res.success) this.toastr.success(`Bulk SMS queued: ${res.data.totalNumbers} numbers`);
      },
      error: err => {
        this.loading.set(false);
        this.result.set({ success: false, message: err.error?.message || 'Bulk send failed' });
      }
    });
  }

  onFileSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.csvFile.set(file);
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file?.name.endsWith('.csv')) this.csvFile.set(file);
    else this.toastr.error('Please upload a CSV file');
  }
}
