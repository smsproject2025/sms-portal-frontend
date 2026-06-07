import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { WhatsAppService, WaCampaign, WaTemplate, PagedResponse } from '../../core/services/whatsapp.service';

@Component({
  selector: 'app-wa-campaigns',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DecimalPipe],
  template: `
    <div class="campaigns-layout">

      <!-- Create Campaign -->
      <div class="card">
        <div class="card__header"><span class="card__title">New Campaign</span></div>

        <form [formGroup]="form" (ngSubmit)="createCampaign()">
          <div class="form-group">
            <label>Campaign Name *</label>
            <input type="text" class="form-control" formControlName="name"
              placeholder="Diwali Offer 2024">
          </div>

          <div class="form-group">
            <label>Description</label>
            <input type="text" class="form-control" formControlName="description"
              placeholder="Optional description">
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label>Message Type</label>
              <select class="form-control" formControlName="messageType">
                <option value="TEXT">Text Message</option>
                <option value="TEMPLATE">Template Message</option>
                <option value="IMAGE">Image</option>
                <option value="DOCUMENT">Document</option>
                <option value="VIDEO">Video</option>
              </select>
            </div>
            <div class="form-group">
              <label>Target Tag <span class="text-muted">(blank = all)</span></label>
              <input type="text" class="form-control" formControlName="targetTags"
                placeholder="vip, newsletter…">
            </div>
          </div>

          <!-- Message Content based on type -->
          @if (form.get('messageType')?.value === 'TEXT') {
            <div class="form-group">
              <label>Message *</label>
              <textarea class="form-control" formControlName="message" rows="4"
                placeholder="Hello {{name}}, check out our latest offers!"></textarea>
            </div>
          }

          @if (form.get('messageType')?.value === 'TEMPLATE') {
            <div class="form-row-2">
              <div class="form-group">
                <label>Template Name *</label>
                <select class="form-control" formControlName="templateName">
                  <option value="">-- Select template --</option>
                  @for (t of approvedTemplates(); track t.id) {
                    <option [value]="t.name">{{ t.name }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label>Language</label>
                <select class="form-control" formControlName="templateLanguage">
                  <option value="en_US">English (US)</option>
                  <option value="hi">Hindi</option>
                  <option value="mr">Marathi</option>
                </select>
              </div>
            </div>
          }

          @if (['IMAGE','DOCUMENT','VIDEO'].includes(form.get('messageType')?.value || '')) {
            <div class="form-group">
              <label>Media URL *</label>
              <input type="url" class="form-control" formControlName="mediaUrl"
                placeholder="https://example.com/file.jpg">
            </div>
            <div class="form-group">
              <label>Caption</label>
              <input type="text" class="form-control" formControlName="caption"
                placeholder="Optional caption">
            </div>
            @if (form.get('messageType')?.value === 'DOCUMENT') {
              <div class="form-group">
                <label>Filename</label>
                <input type="text" class="form-control" formControlName="filename"
                  placeholder="brochure.pdf">
              </div>
            }
          }

          <!-- Schedule -->
          <div class="form-group">
            <label>Schedule At <span class="text-muted">(leave blank to save as draft)</span></label>
            <input type="datetime-local" class="form-control" formControlName="scheduledAt">
          </div>

          <button type="submit" class="btn btn-wa w-full" [disabled]="form.invalid || creating()">
            @if (creating()) { <span class="spinner-sm"></span> Creating... }
            @else { <span class="material-icons">campaign</span> Create Campaign }
          </button>
        </form>
      </div>

      <!-- Campaign List -->
      <div class="card">
        <div class="card__header">
          <span class="card__title">Campaigns</span>
          <span class="text-muted" style="font-size:12px">{{ campaigns()?.totalElements || 0 }} total</span>
        </div>

        @if (loading()) {
          <div class="loading-center"><div class="spinner-lg"></div></div>
        } @else if (campaigns()?.content?.length) {
          <div class="campaign-list">
            @for (c of campaigns()!.content; track c.id) {
              <div class="campaign-card" [class]="'status-' + c.status.toLowerCase()">
                <div class="camp-header">
                  <div>
                    <div class="camp-name">{{ c.name }}</div>
                    <div class="camp-desc text-muted">{{ c.description }}</div>
                  </div>
                  <span class="badge" [class]="getCampaignBadge(c.status)">{{ c.status }}</span>
                </div>

                <div class="camp-meta">
                  <span><span class="material-icons">message</span> {{ c.messageType }}</span>
                  @if (c.targetTags) {
                    <span><span class="material-icons">label</span> {{ c.targetTags }}</span>
                  }
                  @if (c.scheduledAt) {
                    <span><span class="material-icons">schedule</span>
                      {{ c.scheduledAt | date:'dd MMM, HH:mm' }}</span>
                  }
                </div>

                @if (c.status === 'COMPLETED' || c.status === 'RUNNING') {
                  <div class="camp-stats">
                    <div class="cst"><span class="cst-val font-mono">{{ c.totalTargeted }}</span><span class="cst-lbl">Targeted</span></div>
                    <div class="cst"><span class="cst-val font-mono text-accent">{{ c.totalSent }}</span><span class="cst-lbl">Sent</span></div>
                    <div class="cst"><span class="cst-val font-mono text-green">{{ c.totalDelivered }}</span><span class="cst-lbl">Delivered</span></div>
                    <div class="cst"><span class="cst-val font-mono text-purple">{{ c.totalRead }}</span><span class="cst-lbl">Read</span></div>
                    <div class="cst"><span class="cst-val font-mono text-red">{{ c.totalFailed }}</span><span class="cst-lbl">Failed</span></div>
                    <div class="cst"><span class="cst-val font-mono text-yellow">₹{{ c.totalCost | number:'1.2-2' }}</span><span class="cst-lbl">Cost</span></div>
                  </div>
                }

                <div class="camp-actions">
                  @if (c.status === 'DRAFT' || c.status === 'SCHEDULED') {
                    <button class="btn btn-sm btn-wa" (click)="launch(c)"
                      [disabled]="launching() === c.id">
                      @if (launching() === c.id) { <span class="spinner-sm"></span> }
                      @else { <span class="material-icons" style="font-size:14px">rocket_launch</span> }
                      Launch Now
                    </button>
                  }
                  @if (c.status !== 'RUNNING') {
                    <button class="btn btn-sm btn-danger" (click)="deleteCampaign(c)">
                      <span class="material-icons" style="font-size:14px">delete</span>
                    </button>
                  }
                </div>
              </div>
            }
          </div>

          <div class="pagination-footer">
            <span class="text-muted" style="font-size:12px">{{ campaigns()!.totalElements }} total</span>
            <div class="pagination">
              <button [disabled]="page === 0" (click)="goPage(page - 1)">
                <span class="material-icons" style="font-size:16px">chevron_left</span>
              </button>
              <span>{{ page + 1 }} / {{ campaigns()!.totalPages }}</span>
              <button [disabled]="campaigns()!.last" (click)="goPage(page + 1)">
                <span class="material-icons" style="font-size:16px">chevron_right</span>
              </button>
            </div>
          </div>
        } @else {
          <div class="empty-state">
            <div class="icon">📣</div>
            <h3>No campaigns yet</h3>
            <p>Create your first WhatsApp broadcast campaign.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .campaigns-layout { display: grid; grid-template-columns: 380px 1fr; gap: 20px; align-items: start; }
    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

    .btn-wa {
      background: #25d366; color: #fff; font-weight: 600;
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      padding: 10px 20px; border-radius: var(--radius-md); border: none;
      cursor: pointer; font-size: 14px; transition: var(--transition);
      &:hover:not(:disabled) { background: #20c45a; }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .spinner-sm {
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
      border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block;
    }
    .spinner-lg {
      width: 32px; height: 32px; border: 3px solid var(--border);
      border-top-color: #25d366; border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .loading-center { display: flex; justify-content: center; padding: 60px; }

    .campaign-list { display: flex; flex-direction: column; gap: 12px; }

    .campaign-card {
      border: 1px solid var(--border); border-radius: var(--radius-md);
      padding: 16px; transition: var(--transition);
      &.status-completed { border-left: 3px solid var(--green); }
      &.status-running   { border-left: 3px solid var(--accent); }
      &.status-draft     { border-left: 3px solid var(--text-muted); }
      &.status-scheduled { border-left: 3px solid var(--yellow); }
      &.status-failed    { border-left: 3px solid var(--red); }
    }

    .camp-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
    .camp-name { font-size: 14px; font-weight: 600; color: var(--text-primary); }
    .camp-desc { font-size: 12px; margin-top: 2px; }

    .camp-meta {
      display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
      font-size: 11px; color: var(--text-muted); margin-bottom: 10px;
      span { display: flex; align-items: center; gap: 3px; }
      .material-icons { font-size: 13px; }
    }

    .camp-stats {
      display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px;
      background: var(--bg-elevated); border-radius: var(--radius-sm);
      padding: 8px; margin-bottom: 10px; text-align: center;
    }
    .cst {
      .cst-val { font-size: 14px; font-weight: 700; display: block; }
      .cst-lbl { font-size: 9px; color: var(--text-muted); text-transform: uppercase; }
    }

    .camp-actions { display: flex; gap: 8px; }

    .pagination-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding-top: 16px; margin-top: 16px; border-top: 1px solid var(--border);
    }

    @media (max-width: 1024px) {
      .campaigns-layout { grid-template-columns: 1fr; }
      .camp-stats { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 640px) { .form-row-2 { grid-template-columns: 1fr; } }
  `]
})
export class WaCampaignsComponent implements OnInit {
  campaigns = signal<PagedResponse<WaCampaign> | null>(null);
  approvedTemplates = signal<WaTemplate[]>([]);
  loading = signal(false);
  creating = signal(false);
  launching = signal<number | null>(null);
  page = 0;

  form = this.fb.group({
    name:             ['', Validators.required],
    description:      [''],
    messageType:      ['TEXT', Validators.required],
    targetTags:       [''],
    message:          [''],
    templateName:     [''],
    templateLanguage: ['en_US'],
    mediaUrl:         [''],
    caption:          [''],
    filename:         [''],
    scheduledAt:      ['']
  });
name: any;

  constructor(
    private fb: FormBuilder,
    private waService: WhatsAppService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadCampaigns();
    this.waService.getTemplates().subscribe(tpls =>
      this.approvedTemplates.set(tpls.filter(t => t.status === 'APPROVED')));
  }

  loadCampaigns(): void {
    this.loading.set(true);
    this.waService.getCampaigns(this.page).subscribe({
      next: d => { this.campaigns.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  createCampaign(): void {
    if (this.form.invalid) return;
    this.creating.set(true);
    this.waService.createCampaign(this.form.value).subscribe({
      next: res => {
        this.creating.set(false);
        if (res.success) {
          this.toastr.success('Campaign created!');
          this.form.reset({ messageType: 'TEXT', templateLanguage: 'en_US' });
          this.loadCampaigns();
        } else {
          this.toastr.error(res.message);
        }
      },
      error: err => { this.creating.set(false); this.toastr.error(err.error?.message || 'Failed'); }
    });
  }

  launch(c: WaCampaign): void {
    if (!confirm(`Launch campaign "${c.name}" now? This will send to all targeted opted-in contacts.`)) return;
    this.launching.set(c.id);
    this.waService.launchCampaign(c.id).subscribe({
      next: res => {
        this.launching.set(null);
        if (res.success) { this.toastr.success('Campaign launched!'); this.loadCampaigns(); }
        else this.toastr.error(res.message);
      },
      error: err => { this.launching.set(null); this.toastr.error(err.error?.message || 'Launch failed'); }
    });
  }

  deleteCampaign(c: WaCampaign): void {
    if (!confirm(`Delete campaign "${c.name}"?`)) return;
    this.waService.deleteCampaign(c.id).subscribe({
      next: () => { this.toastr.success('Deleted'); this.loadCampaigns(); }
    });
  }

  goPage(p: number): void { this.page = p; this.loadCampaigns(); }

  getCampaignBadge(s: string): string {
    return { COMPLETED: 'badge-success', RUNNING: 'badge-info', SCHEDULED: 'badge-warning',
             DRAFT: 'badge-default', FAILED: 'badge-danger', CANCELLED: 'badge-danger' }[s] || 'badge-default';
  }
}
