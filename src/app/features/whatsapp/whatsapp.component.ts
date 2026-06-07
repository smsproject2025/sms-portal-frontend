import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import {
  WhatsAppService, WaLog, WaStats, WaTemplate, WaMessageType, WaStatus, PagedResponse
} from '../../core/services/whatsapp.service';
import { AuthService } from '../../core/services/auth.service';
import { WaContactsComponent } from './wa-contacts.component';
import { WaCampaignsComponent } from './wa-campaigns.component';
import { WaInboxComponent } from './wa-inbox.component';

type WaTab = 'send' | 'logs' | 'templates' | 'contacts' | 'campaigns' | 'inbox';
type SendMode = 'text' | 'template' | 'media';

@Component({
  selector: 'app-whatsapp',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DecimalPipe,
            WaContactsComponent, WaCampaignsComponent, WaInboxComponent],
  template: `
    <div class="fade-in">
      <!-- Page Header -->
      <div class="page-header">
        <div class="flex-center gap-12">
          <div class="wa-icon-lg">
            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <div>
            <h1>WhatsApp Business</h1>
            <p>Send text, template & media messages via Meta Cloud API</p>
          </div>
        </div>
      </div>

      <!-- Stats Row -->
      @if (stats()) {
        <div class="grid grid-4" style="margin-bottom:24px">
          <div class="stat-card green">
            <div class="stat-card__icon green"><span class="material-icons">send</span></div>
            <div class="stat-card__value">{{ stats()!.totalSent | number }}</div>
            <div class="stat-card__label">Total Sent</div>
            <div class="stat-card__trend up">{{ stats()!.sentToday }} today</div>
          </div>
          <div class="stat-card accent">
            <div class="stat-card__icon accent"><span class="material-icons">done_all</span></div>
            <div class="stat-card__value">{{ stats()!.totalDelivered | number }}</div>
            <div class="stat-card__label">Delivered</div>
            <div class="stat-card__trend up">{{ stats()!.deliveryRate }}% rate</div>
          </div>
          <div class="stat-card purple">
            <div class="stat-card__icon purple"><span class="material-icons">visibility</span></div>
            <div class="stat-card__value">{{ stats()!.totalRead | number }}</div>
            <div class="stat-card__label">Read</div>
          </div>
          <div class="stat-card red">
            <div class="stat-card__icon red"><span class="material-icons">cancel</span></div>
            <div class="stat-card__value">{{ stats()!.totalFailed | number }}</div>
            <div class="stat-card__label">Failed</div>
          </div>
        </div>
      }

      <!-- Tabs -->
      <div class="tab-nav wa-tabs">
        <button class="tab-btn" [class.active]="activeTab() === 'send'" (click)="activeTab.set('send')">
          <span class="material-icons" style="font-size:15px;vertical-align:middle">send</span> Send
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'logs'" (click)="setLogsTab()">
          <span class="material-icons" style="font-size:15px;vertical-align:middle">list_alt</span> Logs
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'contacts'" (click)="activeTab.set('contacts')">
          <span class="material-icons" style="font-size:15px;vertical-align:middle">contacts</span> Contacts
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'campaigns'" (click)="activeTab.set('campaigns')">
          <span class="material-icons" style="font-size:15px;vertical-align:middle">campaign</span> Campaigns
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'templates'" (click)="activeTab.set('templates')">
          <span class="material-icons" style="font-size:15px;vertical-align:middle">description</span> Templates
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'inbox'" (click)="activeTab.set('inbox')">
          <span class="material-icons" style="font-size:15px;vertical-align:middle">inbox</span> Inbox
          @if (inboxUnread() > 0) {
            <span class="tab-badge">{{ inboxUnread() }}</span>
          }
        </button>
      </div>

      <!-- ══ SEND TAB ══════════════════════════════════════════════════ -->
      @if (activeTab() === 'send') {
        <div class="send-layout">
          <div class="card">
            <div class="card__header">
              <span class="card__title">Compose Message</span>
            </div>

            <div class="mode-tabs">
              <button class="mode-btn" [class.active]="sendMode() === 'text'" (click)="sendMode.set('text')">
                <span class="material-icons">chat_bubble</span> Text
              </button>
              <button class="mode-btn" [class.active]="sendMode() === 'template'" (click)="sendMode.set('template')">
                <span class="material-icons">description</span> Template
              </button>
              <button class="mode-btn" [class.active]="sendMode() === 'media'" (click)="sendMode.set('media')">
                <span class="material-icons">perm_media</span> Media
              </button>
            </div>

            <div class="form-group">
              <label>WhatsApp Numbers <span class="text-muted">(comma-separated with country code)</span></label>
              <textarea class="form-control" [(ngModel)]="mobilesInput" rows="3"
                placeholder="919876543210, 918123456789, ..."></textarea>
              <div style="font-size:11px;color:var(--text-muted);margin-top:4px">
                {{ mobileCount }} number(s) detected
              </div>
            </div>

            <!-- ── Text Mode ── -->
            @if (sendMode() === 'text') {
              <div class="form-group">
                <label>Message</label>
                <textarea class="form-control" [(ngModel)]="textMessage" rows="6"
                  placeholder="Type your WhatsApp message...&#10;&#10;Supports *bold*, _italic_, ~strikethrough~, &#96;&#96;&#96;code&#96;&#96;&#96;"></textarea>
                <div class="char-row">
                  <span class="text-muted" style="font-size:11px">Supports WA formatting: *bold* _italic_ ~strike~</span>
                  <span class="font-mono" style="font-size:11px;color:var(--text-muted)">{{ textMessage.length }} chars</span>
                </div>
              </div>
            }

            <!-- ── Template Mode ── -->
            @if (sendMode() === 'template') {
              <div class="form-row-2">
                <div class="form-group">
                  <label>Template Name</label>
                  <select class="form-control" [(ngModel)]="selectedTemplate">
                    <option value="">-- Select template --</option>
                    @for (t of approvedTemplates(); track t.id) {
                      <option [value]="t.name">{{ t.name }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label>Language</label>
                  <select class="form-control" [(ngModel)]="templateLanguage">
                    <option value="en_US">English (US)</option>
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="mr">Marathi</option>
                    <option value="gu">Gujarati</option>
                    <option value="ta">Tamil</option>
                  </select>
                </div>
              </div>
              @if (selectedTemplateBody) {
                <div class="template-preview">
                  <div class="tp-label">Template Preview</div>
                  <div class="tp-body">{{ selectedTemplateBody }}</div>
                </div>
              }
              <div class="form-group">
                <label>Parameters <span class="text-muted">(one per line for &#123;&#123;1&#125;&#125;, &#123;&#123;2&#125;&#125;…)</span></label>
                <textarea class="form-control" [(ngModel)]="templateParams" rows="4"
                  placeholder="John Doe&#10;ORD-12345&#10;₹999"></textarea>
              </div>
            }

            <!-- ── Media Mode ── -->
            @if (sendMode() === 'media') {
              <div class="form-group">
                <label>Media Type</label>
                <div class="media-type-row">
                  @for (mt of mediaTypes; track mt.value) {
                    <button class="media-type-btn" [class.active]="selectedMediaType === mt.value"
                      (click)="selectedMediaType = mt.value">
                      <span class="material-icons">{{ mt.icon }}</span> {{ mt.label }}
                    </button>
                  }
                </div>
              </div>
              <div class="form-group">
                <label>Media URL</label>
                <input type="url" class="form-control" [(ngModel)]="mediaUrl"
                  placeholder="https://example.com/image.jpg">
              </div>
              <div class="form-group">
                <label>Caption <span class="text-muted">(optional)</span></label>
                <input type="text" class="form-control" [(ngModel)]="mediaCaption"
                  placeholder="Optional caption">
              </div>
              @if (selectedMediaType === 'DOCUMENT') {
                <div class="form-group">
                  <label>Filename</label>
                  <input type="text" class="form-control" [(ngModel)]="mediaFilename"
                    placeholder="invoice.pdf">
                </div>
              }
            }

            @if (sendResult()) {
              <div class="alert" [class.alert-success]="sendResult()!.success"
                [class.alert-danger]="!sendResult()!.success">
                <span class="material-icons">{{ sendResult()!.success ? 'check_circle' : 'error' }}</span>
                <div>
                  <strong>{{ sendResult()!.success ? 'Queued!' : 'Error' }}</strong><br>
                  {{ sendResult()!.message }}
                  @if (sendResult()!.success && sendResult()!.data) {
                    &mdash; {{ sendResult()!.data.totalNumbers }} msg &#64; ₹{{ sendResult()!.data.totalCost | number:'1.2-2' }}
                  }
                </div>
              </div>
            }

            <div class="form-actions">
              <div class="cost-preview">
                <span class="text-muted">Est. Cost:</span>
                <span class="cost font-mono text-accent">₹{{ estimatedCost | number:'1.2-2' }}</span>
                <span class="text-muted" style="font-size:11px">(₹{{ currentRate }}/msg)</span>
              </div>
              <button class="btn btn-wa" (click)="send()" [disabled]="sending()">
                @if (sending()) { <span class="spinner-sm"></span> Sending... }
                @else {
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style="flex-shrink:0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Send via WhatsApp
                }
              </button>
            </div>
          </div>

          <!-- Info Panel -->
          <div class="info-col">
            <div class="card">
              <div class="card__header"><span class="card__title">Rates</span></div>
              <div class="rates">
                <div class="rate-item"><span>Text Message</span><span class="font-mono text-green">₹0.40</span></div>
                <div class="rate-item"><span>Template</span><span class="font-mono text-accent">₹0.55</span></div>
                <div class="rate-item"><span>Media</span><span class="font-mono text-yellow">₹0.60</span></div>
              </div>
            </div>
            <div class="card">
              <div class="card__header"><span class="card__title">Tips</span></div>
              <ul class="tips-list">
                <li><span class="material-icons text-green">check_circle</span> Always include country code (91 for India)</li>
                <li><span class="material-icons text-green">check_circle</span> Templates need Meta approval first</li>
                <li><span class="material-icons text-green">check_circle</span> Use *bold* _italic_ for formatting</li>
                <li><span class="material-icons text-green">check_circle</span> Media URLs must be publicly accessible</li>
                <li><span class="material-icons text-yellow">warning</span> Marketing needs opt-in consent</li>
              </ul>
            </div>
            <div class="card">
              <div class="card__header"><span class="card__title">Setup Status</span></div>
              <div class="setup-steps">
                <div class="step done">
                  <span class="step-icon done"><span class="material-icons">check</span></span>
                  Meta App created
                </div>
                <div class="step">
                  <span class="step-icon pending"><span class="material-icons">radio_button_unchecked</span></span>
                  Access token configured
                </div>
                <div class="step">
                  <span class="step-icon pending"><span class="material-icons">radio_button_unchecked</span></span>
                  Phone Number ID set
                </div>
                <div class="step">
                  <span class="step-icon pending"><span class="material-icons">radio_button_unchecked</span></span>
                  Webhook URL registered
                </div>
              </div>
              <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                target="_blank" class="btn btn-secondary btn-sm w-full" style="margin-top:12px">
                <span class="material-icons" style="font-size:14px">open_in_new</span> Meta Setup Docs
              </a>
            </div>
          </div>
        </div>
      }

      <!-- ══ LOGS TAB ══════════════════════════════════════════════════ -->
      @if (activeTab() === 'logs') {
        <div class="card">
          <div class="card__header">
            <span class="card__title">Message Logs</span>
            <div class="filter-tabs">
              @for (s of statusFilters; track s.value) {
                <button class="status-tab" [class.active]="logsFilter === s.value" (click)="filterLogs(s.value)">
                  <span class="dot" [class]="s.dot"></span> {{ s.label }}
                </button>
              }
            </div>
          </div>

          @if (logsLoading()) {
            <div class="loading-center"><div class="spinner-lg"></div></div>
          } @else if (logs()?.content?.length) {
            <div style="overflow-x:auto">
              <table class="data-table">
                <thead>
                  <tr><th>Mobile</th><th>Type</th><th>Content</th><th>Status</th><th>Cost</th><th>Sent</th><th>Delivered</th><th>Read</th></tr>
                </thead>
                <tbody>
                  @for (log of logs()!.content; track log.id) {
                    <tr>
                      <td class="font-mono" style="color:var(--text-primary)">+{{ log.mobile }}</td>
                      <td><span class="badge" [class]="getTypeBadge(log.messageType)">{{ log.messageType }}</span></td>
                      <td><div class="msg-clip">{{ log.message || log.templateName || log.mediaUrl || '—' }}</div></td>
                      <td><span class="wa-status" [class]="'ws-' + log.status.toLowerCase()">{{ getStatusIcon(log.status) }} {{ log.status }}</span></td>
                      <td class="font-mono text-accent">₹{{ log.cost | number:'1.2-2' }}</td>
                      <td class="text-muted" style="font-size:11px">{{ log.createdAt | date:'dd MMM, HH:mm' }}</td>
                      <td class="text-muted" style="font-size:11px">{{ log.deliveredAt ? (log.deliveredAt | date:'HH:mm') : '—' }}</td>
                      <td class="text-muted" style="font-size:11px">{{ log.readAt ? (log.readAt | date:'HH:mm') : '—' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <div class="pagination-footer">
              <span class="text-muted" style="font-size:12px">{{ logs()!.totalElements | number }} total</span>
              <div class="pagination">
                <button [disabled]="logsPage === 0" (click)="goLogsPage(logsPage - 1)">
                  <span class="material-icons" style="font-size:16px">chevron_left</span>
                </button>
                <span>{{ logsPage + 1 }} / {{ logs()!.totalPages }}</span>
                <button [disabled]="logs()!.last" (click)="goLogsPage(logsPage + 1)">
                  <span class="material-icons" style="font-size:16px">chevron_right</span>
                </button>
              </div>
            </div>
          } @else {
            <div class="empty-state">
              <div class="icon">💬</div><h3>No messages yet</h3>
              <p>Your WhatsApp message logs will appear here.</p>
            </div>
          }
        </div>
      }

      <!-- ══ CONTACTS TAB ══════════════════════════════════════════════ -->
      @if (activeTab() === 'contacts') {
        <app-wa-contacts />
      }

      <!-- ══ CAMPAIGNS TAB ══════════════════════════════════════════════ -->
      @if (activeTab() === 'campaigns') {
        <app-wa-campaigns />
      }

      <!-- ══ TEMPLATES TAB ══════════════════════════════════════════════ -->
      @if (activeTab() === 'templates') {
        <div class="templates-layout">
          <div class="card">
            <div class="card__header"><span class="card__title">Create Template</span></div>
            <div class="alert alert-info" style="margin-bottom:20px">
              <span class="material-icons">info</span>
              Templates must be submitted to Meta for approval. Approval takes 24–48 hours.
            </div>
            <form [formGroup]="templateForm" (ngSubmit)="submitTemplate()">
              <div class="form-row-2">
                <div class="form-group">
                  <label>Template Name</label>
                  <input type="text" class="form-control" formControlName="name" placeholder="order_confirmation">
                  <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Lowercase, underscores only</div>
                </div>
                <div class="form-group">
                  <label>Category</label>
                  <select class="form-control" formControlName="category">
                    <option value="MARKETING">Marketing</option>
                    <option value="UTILITY">Utility</option>
                    <option value="AUTHENTICATION">Authentication / OTP</option>
                  </select>
                </div>
              </div>
              <div class="form-row-2">
                <div class="form-group">
                  <label>Language</label>
                  <select class="form-control" formControlName="language">
                    <option value="en_US">English (US)</option>
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="mr">Marathi</option>
                    <option value="gu">Gujarati</option>
                    <option value="ta">Tamil</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>Template Body</label>
                <textarea class="form-control" formControlName="body" rows="5"
                  placeholder="Hello {{1}}, your order {{2}} has been placed. Total: {{3}}."></textarea>
                <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Use &#123;&#123;1&#125;&#125; &#123;&#123;2&#125;&#125; for dynamic values</div>
              </div>
              <button type="submit" class="btn btn-wa" [disabled]="tplSubmitting() || templateForm.invalid">
                @if (tplSubmitting()) { <span class="spinner-sm"></span> Submitting... }
                @else { <span class="material-icons">send</span> Submit for Approval }
              </button>
            </form>
          </div>
          <div class="card">
            <div class="card__header">
              <span class="card__title">My Templates</span>
              <span class="text-muted" style="font-size:12px">{{ templates().length }} total</span>
            </div>
            @if (templates().length) {
              <div class="template-list">
                @for (tpl of templates(); track tpl.id) {
                  <div class="template-item" [class.approved]="tpl.status === 'APPROVED'">
                    <div class="tpl-header">
                      <span class="tpl-name font-mono">{{ tpl.name }}</span>
                      <span class="badge" [class]="getTplBadge(tpl.status)">{{ tpl.status }}</span>
                    </div>
                    <div class="tpl-meta">
                      <span class="badge badge-default" style="font-size:10px">{{ tpl.category }}</span>
                      <span class="text-muted" style="font-size:11px">{{ tpl.language }}</span>
                    </div>
                    <div class="tpl-body">{{ tpl.body }}</div>
                    <div class="tpl-date text-muted">Created {{ tpl.createdAt | date:'dd MMM yyyy' }}</div>
                  </div>
                }
              </div>
            } @else {
              <div class="empty-state">
                <div class="icon">📝</div><h3>No templates yet</h3>
                <p>Create your first template to use with bulk campaigns.</p>
              </div>
            }
          </div>
        </div>
      }

      <!-- ══ INBOX TAB ══════════════════════════════════════════════════ -->
      @if (activeTab() === 'inbox') {
        <app-wa-inbox />
      }
    </div>
  `,
  styles: [`
    .wa-icon-lg {
      width: 52px; height: 52px; border-radius: var(--radius-lg);
      background: #25d366; display: flex; align-items: center; justify-content: center;
      color: #fff; flex-shrink: 0;
    }

    .wa-tabs { margin-bottom: 20px; }

    .tab-badge {
      display: inline-flex; align-items: center; justify-content: center;
      background: var(--red); color: #fff; font-size: 10px; font-weight: 700;
      width: 18px; height: 18px; border-radius: 50%; margin-left: 4px;
    }

    /* Active tab green for WA */
    .wa-tabs .tab-btn.active { background: rgba(37,211,102,0.12); color: #25d366; border-color: #25d366; }

    .send-layout { display: grid; grid-template-columns: 1fr 280px; gap: 20px; align-items: start; }
    .info-col { display: flex; flex-direction: column; gap: 16px; }
    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .char-row { display: flex; justify-content: space-between; margin-top: 6px; }

    .mode-tabs {
      display: flex; gap: 8px; margin-bottom: 20px; padding: 4px;
      background: var(--bg-elevated); border-radius: var(--radius-md); border: 1px solid var(--border);
    }
    .mode-btn {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 8px 12px; border-radius: var(--radius-sm); border: none;
      background: transparent; color: var(--text-secondary); font-size: 13px; font-weight: 500;
      cursor: pointer; transition: var(--transition);
      .material-icons { font-size: 16px; }
      &.active { background: #25d366; color: #fff; }
      &:hover:not(.active) { background: var(--bg-hover); color: var(--text-primary); }
    }

    .template-preview {
      background: #e8f5e9; border: 1px solid #a5d6a7;
      border-radius: var(--radius-md); padding: 14px 16px; margin-bottom: 20px;
      .tp-label { font-size: 10px; font-weight: 600; color: #2e7d32;
                  text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
      .tp-body  { font-size: 14px; color: #1b5e20; line-height: 1.6; white-space: pre-wrap; }
    }

    .media-type-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
    .media-type-btn {
      display: flex; align-items: center; gap: 6px; padding: 8px 14px;
      border-radius: var(--radius-md); border: 1px solid var(--border);
      background: var(--bg-elevated); color: var(--text-secondary);
      font-size: 12px; font-weight: 500; cursor: pointer; transition: var(--transition);
      .material-icons { font-size: 16px; }
      &.active { border-color: #25d366; background: rgba(37,211,102,0.1); color: #25d366; }
      &:hover:not(.active) { border-color: var(--border-light); color: var(--text-primary); }
    }

    .btn-wa {
      background: #25d366; color: #fff; font-weight: 600;
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 20px; border-radius: var(--radius-md); border: none;
      cursor: pointer; font-size: 14px; transition: var(--transition);
      &:hover:not(:disabled) { background: #20c45a; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(37,211,102,0.3); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .spinner-sm {
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
      border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block;
    }
    .spinner-lg {
      width: 32px; height: 32px; border: 3px solid var(--border);
      border-top-color: #25d366; border-radius: 50%; animation: spin 0.8s linear infinite;
    }

    .form-actions {
      display: flex; align-items: center; justify-content: space-between;
      padding-top: 20px; margin-top: 8px; border-top: 1px solid var(--border);
    }
    .cost-preview {
      display: flex; align-items: center; gap: 8px; font-size: 13px;
      .cost { font-size: 18px; font-weight: 700; }
    }

    .rates { display: flex; flex-direction: column; }
    .rate-item {
      display: flex; justify-content: space-between; padding: 10px 0;
      border-bottom: 1px solid var(--border); font-size: 12px;
      &:last-child { border-bottom: none; }
    }

    .tips-list {
      list-style: none; display: flex; flex-direction: column; gap: 10px;
      li { display: flex; align-items: flex-start; gap: 8px; font-size: 12px;
           color: var(--text-secondary); line-height: 1.5;
           .material-icons { font-size: 15px; flex-shrink: 0; margin-top: 1px; } }
    }

    .setup-steps { display: flex; flex-direction: column; gap: 10px; }
    .step { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--text-secondary);
            &.done { color: var(--green); } }
    .step-icon { width: 22px; height: 22px; border-radius: 50%;
                 display: flex; align-items: center; justify-content: center; flex-shrink: 0;
                 .material-icons { font-size: 13px; }
                 &.done    { background: var(--green-dim); color: var(--green); }
                 &.pending { background: var(--bg-hover); color: var(--text-muted); } }

    /* Logs */
    .filter-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
    .status-tab {
      display: flex; align-items: center; gap: 5px; padding: 5px 12px;
      border-radius: 20px; border: 1px solid var(--border); background: var(--bg-elevated);
      color: var(--text-secondary); font-size: 11px; font-weight: 500; cursor: pointer;
      transition: var(--transition);
      &.active { border-color: #25d366; background: rgba(37,211,102,0.1); color: #25d366; }
    }
    .dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block;
           &.green{background:var(--green)} &.accent{background:var(--accent)}
           &.purple{background:var(--purple)} &.red{background:var(--red)}
           &.yellow{background:var(--yellow)} &.muted{background:var(--text-muted)} }
    .msg-clip { max-width: 200px; overflow: hidden; text-overflow: ellipsis;
                white-space: nowrap; font-size: 12px; color: var(--text-secondary); }
    .wa-status { font-size: 11px; font-weight: 600; font-family: var(--font-mono);
                 padding: 2px 8px; border-radius: 20px;
                 &.ws-sent      { background: var(--accent-dim); color: var(--accent); }
                 &.ws-delivered { background: var(--green-dim);  color: var(--green); }
                 &.ws-read      { background: var(--purple-dim); color: var(--purple); }
                 &.ws-failed    { background: var(--red-dim);    color: var(--red); }
                 &.ws-queued    { background: var(--yellow-dim); color: var(--yellow); }
                 &.ws-rejected  { background: var(--red-dim);    color: var(--red); } }
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .pagination-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding-top: 16px; margin-top: 16px; border-top: 1px solid var(--border);
    }

    /* Templates */
    .templates-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }
    .template-list { display: flex; flex-direction: column; gap: 2px; }
    .template-item {
      padding: 14px 12px; border-radius: var(--radius-md); border: 1px solid var(--border);
      margin-bottom: 8px; transition: var(--transition);
      &.approved { border-color: rgba(37,211,102,0.3); background: rgba(37,211,102,0.03); }
      .tpl-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
      .tpl-name { font-size: 14px; font-weight: 700; color: var(--text-primary); letter-spacing: 0.05em; }
      .tpl-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
      .tpl-body { font-size: 12px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 8px; white-space: pre-wrap; }
      .tpl-date { font-size: 11px; color: var(--text-muted); }
    }

    @media (max-width: 1100px) {
      .send-layout { grid-template-columns: 1fr; }
      .info-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      .templates-layout { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .form-row-2 { grid-template-columns: 1fr; }
      .info-col { grid-template-columns: 1fr; }
    }
  `]
})
export class WhatsAppComponent implements OnInit {
  activeTab = signal<WaTab>('send');
  sendMode = signal<SendMode>('text');
  stats = signal<WaStats | null>(null);
  logs = signal<PagedResponse<WaLog> | null>(null);
  templates = signal<WaTemplate[]>([]);
  approvedTemplates = signal<WaTemplate[]>([]);
  sending = signal(false);
  logsLoading = signal(false);
  tplSubmitting = signal(false);
  sendResult = signal<any>(null);
  inboxUnread = signal(0);

  mobilesInput = '';
  textMessage = '';
  selectedTemplate = '';
  templateLanguage = 'en_US';
  templateParams = '';
  selectedMediaType: WaMessageType = 'IMAGE';
  mediaUrl = '';
  mediaCaption = '';
  mediaFilename = '';
  logsPage = 0;
  logsFilter = 'ALL';

  mediaTypes = [
    { value: 'IMAGE' as WaMessageType,    label: 'Image',    icon: 'image' },
    { value: 'DOCUMENT' as WaMessageType, label: 'Document', icon: 'description' },
    { value: 'VIDEO' as WaMessageType,    label: 'Video',    icon: 'videocam' },
    { value: 'AUDIO' as WaMessageType,    label: 'Audio',    icon: 'audiotrack' },
  ];

  statusFilters = [
    { label: 'All',       value: 'ALL',       dot: 'muted'  },
    { label: 'Queued',    value: 'QUEUED',    dot: 'yellow' },
    { label: 'Sent',      value: 'SENT',      dot: 'accent' },
    { label: 'Delivered', value: 'DELIVERED', dot: 'green'  },
    { label: 'Read',      value: 'READ',      dot: 'purple' },
    { label: 'Failed',    value: 'FAILED',    dot: 'red'    },
  ];

  templateForm = this.fb.group({
    name:     ['', [Validators.required, Validators.pattern(/^[a-z0-9_]+$/)]],
    category: ['MARKETING', Validators.required],
    language: ['en_US', Validators.required],
    body:     ['', Validators.required],
  });

  get mobileCount(): number {
    return this.mobilesInput.split(',').map(m => m.trim()).filter(m => m.length >= 10).length;
  }
  get currentRate(): number {
    return ({ text: 0.40, template: 0.55, media: 0.60 } as Record<string, number>)[this.sendMode()];
  }
  get estimatedCost(): number { return this.mobileCount * this.currentRate; }
  get selectedTemplateBody(): string {
    return this.approvedTemplates().find(t => t.name === this.selectedTemplate)?.body || '';
  }

  constructor(
    private fb: FormBuilder,
    private waService: WhatsAppService,
    private auth: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.waService.getStats().subscribe(s => this.stats.set(s));
    this.waService.getTemplates().subscribe(tpls => {
      this.templates.set(tpls);
      this.approvedTemplates.set(tpls.filter(t => t.status === 'APPROVED'));
    });
    this.waService.getUnreadCount().subscribe(r => this.inboxUnread.set(r.count));
  }

  setLogsTab(): void {
    this.activeTab.set('logs');
    if (!this.logs()) this.loadLogs();
  }

  send(): void {
    const mobiles = this.mobilesInput.split(',').map(m => m.trim()).filter(m => m);
    if (!mobiles.length) { this.toastr.error('Enter at least one number'); return; }
    this.sending.set(true);
    this.sendResult.set(null);

    const obs =
      this.sendMode() === 'text'     ? this.waService.sendText(mobiles, this.textMessage) :
      this.sendMode() === 'template' ? this.waService.sendTemplate(mobiles, this.selectedTemplate, this.templateLanguage,
                                          this.templateParams.split('\n').map(p => p.trim()).filter(p => p)) :
                                       this.waService.sendMedia(mobiles, this.mediaUrl, this.selectedMediaType, this.mediaCaption, this.mediaFilename);

    obs.subscribe({
      next: res => {
        this.sending.set(false);
        this.sendResult.set(res);
        if (res.success) {
          this.toastr.success(`${res.data.totalNumbers} WhatsApp message(s) queued!`);
          this.auth.updateBalance(res.data.remainingBalance);
          this.mobilesInput = ''; this.textMessage = '';
        }
      },
      error: err => {
        this.sending.set(false);
        this.sendResult.set({ success: false, message: err.error?.message || 'Send failed' });
      }
    });
  }

  loadLogs(): void {
    this.logsLoading.set(true);
    const obs = this.logsFilter === 'ALL'
      ? this.waService.getLogs(this.logsPage)
      : this.waService.getLogsByStatus(this.logsFilter as WaStatus, this.logsPage);
    obs.subscribe({ next: d => { this.logs.set(d); this.logsLoading.set(false); }, error: () => this.logsLoading.set(false) });
  }

  filterLogs(s: string): void { this.logsFilter = s; this.logsPage = 0; this.loadLogs(); }
  goLogsPage(p: number): void { this.logsPage = p; this.loadLogs(); }

  submitTemplate(): void {
    if (this.templateForm.invalid) return;
    this.tplSubmitting.set(true);
    const { name, language, body, category } = this.templateForm.value;
    this.waService.createTemplate(name!, language!, body!, category!).subscribe({
      next: res => {
        this.tplSubmitting.set(false);
        if (res.success) {
          this.toastr.success('Template submitted for Meta approval');
          this.templates.update(t => [res.data, ...t]);
          this.templateForm.reset({ category: 'MARKETING', language: 'en_US' });
        } else { this.toastr.error(res.message); }
      },
      error: err => { this.tplSubmitting.set(false); this.toastr.error(err.error?.message || 'Failed'); }
    });
  }

  getTypeBadge(t: WaMessageType): string {
    return ({TEXT:'badge-info',TEMPLATE:'badge-purple',IMAGE:'badge-success',
             DOCUMENT:'badge-warning',VIDEO:'badge-accent',AUDIO:'badge-default'} as Record<string,string>)[t] || 'badge-default';
  }
  getTplBadge(s: string): string {
    return ({APPROVED:'badge-success',PENDING:'badge-warning',REJECTED:'badge-danger'} as Record<string,string>)[s] || 'badge-default';
  }
  getStatusIcon(s: WaStatus): string {
    return ({SENT:'✓',DELIVERED:'✓✓',READ:'👁',FAILED:'✗',QUEUED:'⏳',REJECTED:'✗'} as Record<string,string>)[s] || '';
  }
}
