import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-left">
        <div class="brand">
          <span class="brand-icon">⚡</span>
          <span class="brand-name">SMSPortal</span>
        </div>
        <div class="hero-text">
          <h1>Start sending SMS <span class="text-accent">for free</span> today.</h1>
          <p>Create your account in under 2 minutes. No credit card required to get started.</p>
        </div>
        <ul class="feature-list">
          <li><span class="material-icons text-accent">check_circle</span> Free ₹10 credits on signup</li>
          <li><span class="material-icons text-accent">check_circle</span> Promotional & transactional SMS</li>
          <li><span class="material-icons text-accent">check_circle</span> Real-time delivery reports</li>
          <li><span class="material-icons text-accent">check_circle</span> RESTful API access</li>
          <li><span class="material-icons text-accent">check_circle</span> Custom Sender IDs</li>
        </ul>
      </div>

      <div class="auth-right">
        <div class="auth-card">
          <div class="auth-header">
            <h2>Create account</h2>
            <p>Get started with SMSPortal for free</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" class="form-control" formControlName="name" placeholder="Rahul Sharma"
                [class.is-invalid]="submitted && f['name'].errors">
              @if (submitted && f['name'].errors?.['required']) {
                <div class="form-error"><span class="material-icons">error_outline</span> Name is required</div>
              }
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Email Address</label>
                <input type="email" class="form-control" formControlName="email" placeholder="you@example.com"
                  [class.is-invalid]="submitted && f['email'].errors">
                @if (submitted && f['email'].errors) {
                  <div class="form-error"><span class="material-icons">error_outline</span> Valid email required</div>
                }
              </div>

              <div class="form-group">
                <label>Mobile Number</label>
                <input type="tel" class="form-control" formControlName="mobile" placeholder="9876543210"
                  [class.is-invalid]="submitted && f['mobile'].errors">
                @if (submitted && f['mobile'].errors) {
                  <div class="form-error"><span class="material-icons">error_outline</span> Valid 10-digit mobile</div>
                }
              </div>
            </div>

            <div class="form-group">
              <label>Password</label>
              <input type="password" class="form-control" formControlName="password"
                placeholder="Min. 8 characters" [class.is-invalid]="submitted && f['password'].errors">
              @if (submitted && f['password'].errors?.['minlength']) {
                <div class="form-error"><span class="material-icons">error_outline</span> Minimum 8 characters</div>
              }
            </div>

            @if (error()) {
              <div class="alert alert-danger">
                <span class="material-icons">error</span>{{ error() }}
              </div>
            }

            <button type="submit" class="btn btn-primary w-full btn-lg" [disabled]="loading()">
              @if (loading()) { <span class="spinner"></span> Creating account... }
              @else { Create Account <span class="material-icons">arrow_forward</span> }
            </button>
          </form>

          <div class="auth-footer">
            Already have an account? <a routerLink="/auth/login">Sign in</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1fr 1fr;
      background: var(--bg-base);
    }

    .auth-left {
      background: linear-gradient(135deg, #0d1117 0%, #111827 50%, #0a0e1a 100%);
      padding: 60px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        bottom: -20%;
        left: -10%;
        width: 400px;
        height: 400px;
        background: radial-gradient(circle, rgba(0,229,255,0.05) 0%, transparent 70%);
      }
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: var(--font-heading);
      font-weight: 800;
      font-size: 20px;
    }

    .hero-text {
      h1 { font-size: 44px; font-weight: 800; line-height: 1.15; margin-bottom: 16px; }
      p  { font-size: 15px; color: var(--text-secondary); line-height: 1.7; }
    }

    .feature-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 12px;

      li {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        color: var(--text-secondary);

        .material-icons { font-size: 18px; }
      }
    }

    .auth-right {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 60px 40px;
      background: var(--bg-surface);
      border-left: 1px solid var(--border);
    }

    .auth-card {
      width: 100%;
      max-width: 440px;
    }

    .auth-header {
      margin-bottom: 28px;
      h2 { font-size: 28px; margin-bottom: 6px; }
      p { color: var(--text-secondary); }
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(0,0,0,0.3);
      border-top-color: #000;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }

    .auth-footer {
      margin-top: 24px;
      text-align: center;
      font-size: 14px;
      color: var(--text-secondary);
      a { color: var(--accent); font-weight: 500; }
    }

    @media (max-width: 768px) {
      .auth-page { grid-template-columns: 1fr; }
      .auth-left { display: none; }
      .form-row { grid-template-columns: 1fr; }
    }
  `]
})
export class RegisterComponent {
  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    mobile: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  submitted = false;
  loading = signal(false);
  error = signal('');

  get f() { return this.form.controls; }

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  onSubmit(): void {
    this.submitted = true;
    this.error.set('');
    if (this.form.invalid) return;

    this.loading.set(true);
    this.authService.register(this.form.value as any).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success) {
          this.toastr.success('Account created! Welcome to SMSPortal.');
          this.router.navigate(['/dashboard']);
        } else {
          this.error.set(res.message);
        }
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Registration failed. Please try again.');
      }
    });
  }
}
