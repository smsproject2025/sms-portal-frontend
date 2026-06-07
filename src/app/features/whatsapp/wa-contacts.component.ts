import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { WhatsAppService, WaContact, PagedResponse } from '../../core/services/whatsapp.service';

@Component({
  selector: 'app-wa-contacts',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DecimalPipe],
  template: `
    <div class="contacts-layout">

      <!-- Add Contact Panel -->
      <div>
        <!-- Stats -->
        @if (stats()) {
          <div class="contact-stats">
            <div class="cs-item">
              <span class="cs-val font-mono text-accent">{{ stats()!.total | number }}</span>
              <span class="cs-lbl">Total</span>
            </div>
            <div class="cs-item">
              <span class="cs-val font-mono text-green">{{ stats()!.optedIn | number }}</span>
              <span class="cs-lbl">Opted In</span>
            </div>
            <div class="cs-item">
              <span class="cs-val font-mono text-red">{{ stats()!.optedOut | number }}</span>
              <span class="cs-lbl">Opted Out</span>
            </div>
          </div>
        }

        <div class="card">
          <div class="card__header"><span class="card__title">Add Contact</span></div>
          <form [formGroup]="addForm" (ngSubmit)="addContact()">
            <div class="form-group">
              <label>WhatsApp Number *</label>
              <input type="text" class="form-control" formControlName="mobile"
                placeholder="919876543210">
              <div style="font-size:11px;color:var(--text-muted);margin-top:4px">
                Include country code (91 for India)
              </div>
            </div>
            <div class="form-group">
              <label>Name</label>
              <input type="text" class="form-control" formControlName="name" placeholder="John Doe">
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" class="form-control" formControlName="email" placeholder="john@example.com">
            </div>
            <div class="form-group">
              <label>Tags <span class="text-muted">(comma-separated)</span></label>
              <input type="text" class="form-control" formControlName="tags"
                placeholder="vip, newsletter, offer">
            </div>
            <button type="submit" class="btn btn-wa w-full" [disabled]="addForm.invalid || adding()">
              @if (adding()) { <span class="spinner-sm"></span> Adding... }
              @else { <span class="material-icons">person_add</span> Add Contact }
            </button>
          </form>
        </div>

        <!-- CSV Import -->
        <div class="card">
          <div class="card__header"><span class="card__title">Bulk Import</span></div>
          <div class="file-drop" [class.has-file]="csvFile()" (click)="fileInput.click()"
            (dragover)="$event.preventDefault()" (drop)="onDrop($event)">
            @if (csvFile()) {
              <span class="material-icons text-accent">description</span>
              <span>{{ csvFile()!.name }}</span>
            } @else {
              <span class="material-icons" style="font-size:36px;color:var(--text-muted)">upload_file</span>
              <span class="text-secondary">Drop CSV or click to browse</span>
              <span class="text-muted" style="font-size:11px">
                Columns: mobile (required), name, email, tags
              </span>
            }
          </div>
          <input #fileInput type="file" accept=".csv" style="display:none" (change)="onFileSelect($event)">
          <button class="btn btn-secondary w-full" style="margin-top:10px"
            [disabled]="!csvFile() || importing()" (click)="importCsv()">
            @if (importing()) { <span class="spinner-sm-dark"></span> Importing... }
            @else { <span class="material-icons">cloud_upload</span> Import Contacts }
          </button>
          @if (importResult()) {
            <div class="alert alert-success" style="margin-top:10px">
              <span class="material-icons">check_circle</span>
              {{ importResult()!.added }} added, {{ importResult()!.skipped }} skipped
            </div>
          }
        </div>
      </div>

      <!-- Contacts List -->
      <div class="card">
        <div class="card__header">
          <span class="card__title">Contacts</span>
          <span class="text-muted" style="font-size:12px">{{ contacts()?.totalElements || 0 }} total</span>
        </div>

        @if (loading()) {
          <div class="loading-center"><div class="spinner-lg"></div></div>
        } @else if (contacts()?.content?.length) {
          <div style="overflow-x:auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Tags</th>
                  <th>Status</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (c of contacts()!.content; track c.id) {
                  <tr>
                    <td style="font-weight:500;color:var(--text-primary)">
                      {{ c.name || '—' }}
                    </td>
                    <td class="font-mono">+{{ c.mobile }}</td>
                    <td>
                      @if (c.tags) {
                        @for (tag of c.tags.split(','); track tag) {
                          <span class="tag-chip">{{ tag.trim() }}</span>
                        }
                      } @else { <span class="text-muted">—</span> }
                    </td>
                    <td>
                      <span class="badge"
                        [class]="c.optInStatus === 'OPTED_IN' ? 'badge-success' : 'badge-danger'">
                        {{ c.optInStatus === 'OPTED_IN' ? 'Opted In' : 'Opted Out' }}
                      </span>
                    </td>
                    <td class="text-muted" style="font-size:11px">
                      {{ c.createdAt | date:'dd MMM yyyy' }}
                    </td>
                    <td>
                      <div class="action-btns">
                        @if (c.optInStatus === 'OPTED_IN') {
                          <button class="btn btn-sm btn-danger" (click)="optOut(c)"
                            title="Opt out">
                            <span class="material-icons" style="font-size:14px">block</span>
                          </button>
                        }
                        <button class="btn btn-sm btn-danger" (click)="deleteContact(c)"
                          title="Delete">
                          <span class="material-icons" style="font-size:14px">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="pagination-footer">
            <span class="text-muted" style="font-size:12px">
              {{ contacts()!.totalElements | number }} contacts
            </span>
            <div class="pagination">
              <button [disabled]="page === 0" (click)="goPage(page - 1)">
                <span class="material-icons" style="font-size:16px">chevron_left</span>
              </button>
              <span>{{ page + 1 }} / {{ contacts()!.totalPages }}</span>
              <button [disabled]="contacts()!.last" (click)="goPage(page + 1)">
                <span class="material-icons" style="font-size:16px">chevron_right</span>
              </button>
            </div>
          </div>
        } @else {
          <div class="empty-state">
            <div class="icon">👥</div>
            <h3>No contacts yet</h3>
            <p>Add contacts manually or import a CSV file.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .contacts-layout { display: grid; grid-template-columns: 320px 1fr; gap: 20px; align-items: start; }

    .contact-stats {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
      margin-bottom: 16px;
    }
    .cs-item {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: var(--radius-md); padding: 12px; text-align: center;
      .cs-val { font-size: 20px; font-weight: 700; display: block; }
      .cs-lbl { font-size: 10px; color: var(--text-muted); text-transform: uppercase;
                letter-spacing: 0.08em; }
    }

    .file-drop {
      border: 2px dashed var(--border); border-radius: var(--radius-md);
      padding: 28px 16px; text-align: center; cursor: pointer;
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      transition: var(--transition); font-size: 13px;
      &:hover, &.has-file { border-color: #25d366; background: rgba(37,211,102,0.05); }
    }

    .tag-chip {
      display: inline-block; background: var(--bg-elevated); border: 1px solid var(--border);
      color: var(--text-secondary); font-size: 10px; padding: 1px 7px;
      border-radius: 10px; margin: 1px;
    }

    .action-btns { display: flex; gap: 4px; }

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
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block;
    }
    .spinner-sm-dark {
      width: 14px; height: 14px;
      border: 2px solid rgba(0,0,0,0.15);
      border-top-color: var(--text-primary);
      border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block;
    }
    .spinner-lg {
      width: 32px; height: 32px; border: 3px solid var(--border);
      border-top-color: #25d366; border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .pagination-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding-top: 16px; margin-top: 16px; border-top: 1px solid var(--border);
    }

    @media (max-width: 1024px) { .contacts-layout { grid-template-columns: 1fr; } }
  `]
})
export class WaContactsComponent implements OnInit {
  contacts = signal<PagedResponse<WaContact> | null>(null);
  stats = signal<{ total: number; optedIn: number; optedOut: number } | null>(null);
  loading = signal(false);
  adding = signal(false);
  importing = signal(false);
  csvFile = signal<File | null>(null);
  importResult = signal<{ added: number; skipped: number } | null>(null);
  page = 0;

  addForm = this.fb.group({
    mobile: ['', Validators.required],
    name: [''],
    email: [''],
    tags: ['']
  });

  constructor(
    private fb: FormBuilder,
    private waService: WhatsAppService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadContacts();
    this.waService.getContactStats().subscribe(s => this.stats.set(s));
  }

  loadContacts(): void {
    this.loading.set(true);
    this.waService.getContacts(this.page).subscribe({
      next: d => { this.contacts.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  addContact(): void {
    if (this.addForm.invalid) return;
    this.adding.set(true);
    const { mobile, name, email, tags } = this.addForm.value;
    this.waService.addContact(mobile!, name!, email!, tags!).subscribe({
      next: res => {
        this.adding.set(false);
        if (res.success) {
          this.toastr.success('Contact added!');
          this.addForm.reset();
          this.loadContacts();
          this.waService.getContactStats().subscribe(s => this.stats.set(s));
        } else {
          this.toastr.error(res.message);
        }
      },
      error: err => { this.adding.set(false); this.toastr.error(err.error?.message || 'Failed'); }
    });
  }

  importCsv(): void {
    if (!this.csvFile()) return;
    this.importing.set(true);
    this.importResult.set(null);
    this.waService.importContacts(this.csvFile()!).subscribe({
      next: res => {
        this.importing.set(false);
        if (res.success) {
          this.importResult.set(res.data);
          this.toastr.success(res.message);
          this.loadContacts();
          this.waService.getContactStats().subscribe(s => this.stats.set(s));
        }
      },
      error: () => { this.importing.set(false); this.toastr.error('Import failed'); }
    });
  }

  optOut(c: WaContact): void {
    this.waService.optOutContact(c.id).subscribe({
      next: () => { this.toastr.success('Contact opted out'); this.loadContacts(); }
    });
  }

  deleteContact(c: WaContact): void {
    if (!confirm(`Delete contact +${c.mobile}?`)) return;
    this.waService.deleteContact(c.id).subscribe({
      next: () => { this.toastr.success('Contact deleted'); this.loadContacts(); }
    });
  }

  goPage(p: number): void { this.page = p; this.loadContacts(); }

  onFileSelect(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) this.csvFile.set(f);
  }
  onDrop(e: DragEvent): void {
    e.preventDefault();
    const f = e.dataTransfer?.files[0];
    if (f?.name.endsWith('.csv')) this.csvFile.set(f);
  }
}
