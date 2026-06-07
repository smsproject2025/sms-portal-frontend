import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { WhatsAppService, WaInboxMessage, PagedResponse } from '../../core/services/whatsapp.service';

@Component({
  selector: 'app-wa-inbox',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    <div class="card">
      <div class="card__header">
        <div class="flex-center gap-12">
          <span class="card__title">Incoming Messages</span>
          @if (unreadCount() > 0) {
            <span class="unread-badge">{{ unreadCount() }} unread</span>
          }
        </div>
        <div class="flex-center gap-8">
          @if (unreadCount() > 0) {
            <button class="btn btn-sm btn-secondary" (click)="markAllRead()">
              <span class="material-icons" style="font-size:14px">done_all</span>
              Mark all read
            </button>
          }
          <button class="btn btn-sm btn-secondary" (click)="loadInbox()">
            <span class="material-icons" style="font-size:14px">refresh</span>
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-center"><div class="spinner-lg"></div></div>
      } @else if (messages()?.content?.length) {
        <div class="inbox-list">
          @for (msg of messages()!.content; track msg.id) {
            <div class="inbox-item" [class.unread]="msg.readStatus === 'UNREAD'"
              (click)="openMessage(msg)">
              <div class="inbox-avatar">
                {{ getInitial(msg.fromName || msg.fromMobile) }}
              </div>
              <div class="inbox-body">
                <div class="inbox-header">
                  <span class="inbox-from">
                    {{ msg.fromName || ('+' + msg.fromMobile) }}
                  </span>
                  <span class="inbox-time text-muted">
                    {{ msg.receivedAt | date:'dd MMM, HH:mm' }}
                  </span>
                </div>
                <div class="inbox-mobile text-muted">+{{ msg.fromMobile }}</div>
                <div class="inbox-preview">
                  @if (msg.messageType === 'text') {
                    {{ msg.body }}
                  } @else {
                    <span class="media-label">
                      <span class="material-icons">{{ getMediaIcon(msg.messageType) }}</span>
                      {{ msg.messageType | titlecase }} message
                    </span>
                  }
                </div>
              </div>
              <div class="inbox-badge-col">
                @if (msg.readStatus === 'UNREAD') {
                  <span class="unread-dot"></span>
                }
                <span class="type-badge badge badge-default" style="font-size:10px">
                  {{ msg.messageType }}
                </span>
              </div>
            </div>
          }
        </div>

        <div class="pagination-footer">
          <span class="text-muted" style="font-size:12px">
            {{ messages()!.totalElements | number }} messages
          </span>
          <div class="pagination">
            <button [disabled]="page === 0" (click)="goPage(page - 1)">
              <span class="material-icons" style="font-size:16px">chevron_left</span>
            </button>
            <span>{{ page + 1 }} / {{ messages()!.totalPages }}</span>
            <button [disabled]="messages()!.last" (click)="goPage(page + 1)">
              <span class="material-icons" style="font-size:16px">chevron_right</span>
            </button>
          </div>
        </div>

        <!-- Message Detail Modal -->
        @if (selectedMessage()) {
          <div class="modal-backdrop" (click)="selectedMessage.set(null)">
            <div class="modal-box" (click)="$event.stopPropagation()">
              <div class="modal-header">
                <div>
                  <div class="modal-title">Message from +{{ selectedMessage()!.fromMobile }}</div>
                  @if (selectedMessage()!.fromName) {
                    <div class="text-muted" style="font-size:12px">{{ selectedMessage()!.fromName }}</div>
                  }
                </div>
                <button class="btn btn-icon btn-secondary" (click)="selectedMessage.set(null)">
                  <span class="material-icons">close</span>
                </button>
              </div>
              <div class="modal-content">
                <div class="msg-meta">
                  <span class="badge badge-info">{{ selectedMessage()!.messageType }}</span>
                  <span class="text-muted" style="font-size:12px">
                    {{ selectedMessage()!.receivedAt | date:'dd MMM yyyy, HH:mm:ss' }}
                  </span>
                </div>
                @if (selectedMessage()!.body) {
                  <div class="msg-bubble">{{ selectedMessage()!.body }}</div>
                }
                @if (selectedMessage()!.mediaUrl) {
                  <div class="media-preview">
                    @if (selectedMessage()!.messageType === 'image') {
                      <img [src]="selectedMessage()!.mediaUrl" alt="media" style="max-width:100%;border-radius:8px">
                    } @else {
                      <a [href]="selectedMessage()!.mediaUrl" target="_blank" class="btn btn-secondary">
                        <span class="material-icons">download</span>
                        Download {{ selectedMessage()!.messageType }}
                      </a>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        }
      } @else {
        <div class="empty-state">
          <div class="icon">📥</div>
          <h3>Inbox is empty</h3>
          <p>Incoming WhatsApp messages will appear here when customers reply.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .unread-badge {
      background: var(--red); color: #fff; font-size: 11px; font-weight: 700;
      padding: 2px 8px; border-radius: 20px;
    }

    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .spinner-lg {
      width: 32px; height: 32px; border: 3px solid var(--border);
      border-top-color: #25d366; border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .inbox-list { display: flex; flex-direction: column; }

    .inbox-item {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 14px 8px; border-bottom: 1px solid var(--border);
      cursor: pointer; transition: var(--transition); border-radius: var(--radius-sm);

      &:hover { background: var(--bg-hover); }
      &:last-child { border-bottom: none; }
      &.unread { background: rgba(37,211,102,0.04); }
      &.unread .inbox-from { font-weight: 700; color: var(--text-primary); }
    }

    .inbox-avatar {
      width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
      background: #25d366; color: #fff; font-weight: 700; font-size: 16px;
      display: flex; align-items: center; justify-content: center;
      font-family: var(--font-heading);
    }

    .inbox-body { flex: 1; min-width: 0; }
    .inbox-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px; }
    .inbox-from { font-size: 14px; font-weight: 500; color: var(--text-primary); }
    .inbox-time { font-size: 11px; }
    .inbox-mobile { font-size: 11px; margin-bottom: 4px; font-family: var(--font-mono); }
    .inbox-preview {
      font-size: 13px; color: var(--text-secondary);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 400px;
    }
    .media-label { display: flex; align-items: center; gap: 4px; .material-icons { font-size: 14px; } }

    .inbox-badge-col { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
    .unread-dot { width: 8px; height: 8px; border-radius: 50%; background: #25d366; }

    .pagination-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding-top: 16px; margin-top: 16px; border-top: 1px solid var(--border);
    }

    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.7);
      display: flex; align-items: center; justify-content: center;
      z-index: 999; backdrop-filter: blur(4px);
    }
    .modal-box {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: 24px; width: 480px;
      max-width: 92vw; box-shadow: var(--shadow-lg); animation: fadeIn 0.2s ease;
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--border);
    }
    .modal-title { font-size: 16px; font-weight: 700; font-family: var(--font-heading); }
    .modal-content { display: flex; flex-direction: column; gap: 12px; }
    .msg-meta { display: flex; align-items: center; gap: 8px; }
    .msg-bubble {
      background: var(--bg-elevated); border: 1px solid var(--border);
      border-radius: var(--radius-md); padding: 12px 16px;
      font-size: 14px; line-height: 1.6; white-space: pre-wrap;
      border-left: 3px solid #25d366;
    }
    .media-preview { display: flex; flex-direction: column; gap: 8px; }
  `]
})
export class WaInboxComponent implements OnInit {
  messages = signal<PagedResponse<WaInboxMessage> | null>(null);
  unreadCount = signal(0);
  selectedMessage = signal<WaInboxMessage | null>(null);
  loading = signal(false);
  page = 0;

  constructor(private waService: WhatsAppService, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.loadInbox();
    this.waService.getUnreadCount().subscribe(r => this.unreadCount.set(r.count));
  }

  loadInbox(): void {
    this.loading.set(true);
    this.waService.getInbox(this.page).subscribe({
      next: d => { this.messages.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openMessage(msg: WaInboxMessage): void {
    this.selectedMessage.set(msg);
    if (msg.readStatus === 'UNREAD') {
      this.waService.markRead(msg.id).subscribe(() => {
        msg.readStatus = 'READ';
        this.unreadCount.update(n => Math.max(0, n - 1));
      });
    }
  }

  markAllRead(): void {
    this.waService.markAllRead().subscribe(() => {
      this.toastr.success('All messages marked as read');
      this.unreadCount.set(0);
      this.loadInbox();
    });
  }

  goPage(p: number): void { this.page = p; this.loadInbox(); }

  getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  getMediaIcon(type: string): string {
    return { image: 'image', video: 'videocam', audio: 'audiotrack',
             document: 'description', sticker: 'emoji_emotions' }[type] || 'attachment';
  }
}
