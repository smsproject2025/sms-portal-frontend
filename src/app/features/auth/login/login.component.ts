import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
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
          <h1>Send millions of<br><span class="text-accent">SMS messages</span><br>in seconds.</h1>
          <p>India's fastest bulk SMS gateway with real-time delivery reports, wallet management, and developer API.</p>
        </div>
        <div class="stats-row">
          <div class="stat"><span class="num font-mono">50M+</span><span class="lbl">SMS Sent</span></div>
          <div class="stat"><span class="num font-mono">99.9%</span><span class="lbl">Uptime</span></div>
          <div class="stat"><span class="num font-mono">2s</span><span class="lbl">Delivery</span></div>
        </div>
      </div>

      <div class="auth-right">
        <div class="auth-card">
          <div class="auth-header">
            <h2>Welcome back</h2>
            <p>Sign in to your account</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label>Email Address</label>
              <input type="email" class="form-control" formControlName="email"
                placeholder="you@example.com"
                [class.is-invalid]="submitted && f['email'].errors">
              @if (submitted && f['email'].errors) {
                <div class="form-error">
                  <span class="material-icons">error_outline</span> Valid email required
                </div>
              }
            </div>

            <div class="form-group">
              <div class="label-row">
                <label>Password</label>
                <a routerLink="/auth/forgot-password" class="forgot-link">Forgot password?</a>
              </div>
              <div class="input-with-icon">
                <input [type]="showPassword() ? 'text' : 'password'" class="form-control"
                  formControlName="password" placeholder="••••••••"
                  [class.is-invalid]="submitted && f['password'].errors">
                <button type="button" class="eye-btn" (click)="showPassword.set(!showPassword())">
                  <span class="material-icons">
                    {{ showPassword() ? 'visibility_off' : 'visibility' }}
                  </span>
                </button>
              </div>
              @if (submitted && f['password'].errors) {
                <div class="form-error">
                  <span class="material-icons">error_outline</span> Password required
                </div>
              }
            </div>

            @if (error()) {
              <div class="alert alert-danger">
                <span class="material-icons">error</span>
                {{ error() }}
              </div>
            }

            <button type="submit" class="btn btn-primary w-full btn-lg" [disabled]="loading()">
              @if (loading()) { <span class="spinner"></span> Signing in... }
              @else { Sign In <span class="material-icons">arrow_forward</span> }
            </button>
          </form>

          <div class="auth-footer">
            Don't have an account? <a routerLink="/auth/register">Create one free</a>
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
        top: -20%; right: -10%;
        width: 500px; height: 500px;
        background: radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 70%);
        pointer-events: none;
      }
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: var(--font-heading);
      font-weight: 800;
      font-size: 20px;
      color: var(--text-primary);
      .brand-icon { font-size: 24px; }
    }

    .hero-text {
      h1 { font-size: 52px; font-weight: 800; line-height: 1.1; margin-bottom: 20px; letter-spacing: -1px; }
      p  { font-size: 16px; color: var(--text-secondary); line-height: 1.7; max-width: 400px; }
    }

    .stats-row {
      display: flex;
      gap: 40px;
      .stat {
        display: flex; flex-direction: column; gap: 4px;
        .num { font-size: 28px; font-weight: 700; color: var(--accent); }
        .lbl { font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; }
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

    .auth-card { width: 100%; max-width: 400px; }

    .auth-header {
      margin-bottom: 32px;
      h2 { font-size: 28px; margin-bottom: 6px; }
      p  { color: var(--text-secondary); }
    }

    /* label row with forgot link */
    .label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .forgot-link {
      font-size: 12px;
      color: var(--accent);
      font-weight: 500;
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }

    .input-with-icon {
      position: relative;
      .form-control { padding-right: 44px; }
    }

    .eye-btn {
      position: absolute;
      right: 12px; top: 50%;
      transform: translateY(-50%);
      background: none; border: none;
      color: var(--text-muted); cursor: pointer;
      padding: 0; display: flex;
      .material-icons { font-size: 18px; }
      &:hover { color: var(--text-secondary); }
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
    }
  `]
})
export class LoginComponent {
  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  submitted     = false;
  loading       = signal(false);
  error         = signal('');
  showPassword  = signal(false);

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
    this.authService.login(this.form.value as any).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success) {
          this.toastr.success(`Welcome back, ${res.data.name}!`);
          this.router.navigate(['/dashboard']);
        } else {
          this.error.set(res.message);
        }
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Login failed. Please try again.');
      }
    });
  }
}
