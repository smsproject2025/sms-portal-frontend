import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
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
          <h1>Forgot your<br><span class="text-accent">password?</span></h1>
          <p>No worries — enter your email and we'll send you a secure reset link right away.</p>
        </div>
        <div class="info-box">
          <span class="material-icons">schedule</span>
          <div>
            <strong>Link expires in 1 hour</strong>
            <p>For security, reset links are single-use and expire after 1 hour.</p>
          </div>
        </div>
      </div>

      <div class="auth-right">
        <div class="auth-card">

          @if (!submitted()) {
            <div class="auth-header">
              <div class="icon-wrap">
                <span class="material-icons">lock_reset</span>
              </div>
              <h2>Reset Password</h2>
              <p>Enter the email address linked to your account and we'll send you a reset link.</p>
            </div>

            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="form-group">
                <label>Email Address</label>
                <input type="email" class="form-control" formControlName="email"
                  placeholder="you@example.com" autofocus
                  [class.is-invalid]="touched && f['email'].errors">
                @if (touched && f['email'].errors?.['required']) {
                  <div class="form-error">
                    <span class="material-icons">error_outline</span> Email is required
                  </div>
                }
                @if (touched && f['email'].errors?.['email']) {
                  <div class="form-error">
                    <span class="material-icons">error_outline</span> Enter a valid email address
                  </div>
                }
              </div>

              @if (errorMsg()) {
                <div class="alert alert-danger">
                  <span class="material-icons">error</span> {{ errorMsg() }}
                </div>
              }

              <button type="submit" class="btn btn-primary w-full btn-lg" [disabled]="loading()">
                @if (loading()) { <span class="spinner"></span> Sending... }
                @else { <span class="material-icons">send</span> Send Reset Link }
              </button>
            </form>
          }

          @if (submitted()) {
            <div class="success-state">
              <div class="success-icon">
                <span class="material-icons">mark_email_read</span>
              </div>
              <h2>Check your inbox</h2>
              <p>
                We sent a password reset link to<br>
                <strong class="text-accent">{{ sentTo() }}</strong>
              </p>
              <div class="alert alert-info" style="margin-top:20px;text-align:left">
                <span class="material-icons">info</span>
                <div>
                  Didn't receive it? Check your spam folder or
                  <button class="inline-link" (click)="resend()" [disabled]="resendCooldown() > 0">
                    @if (resendCooldown() > 0) { resend in {{ resendCooldown() }}s }
                    @else { send again }
                  </button>
                </div>
              </div>
            </div>
          }

          <div class="auth-footer">
            <a routerLink="/auth/login">
              <span class="material-icons">arrow_back</span> Back to Login
            </a>
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
      background: linear-gradient(135deg, #0d1117 0%, #0a1929 100%);
      padding: 60px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        bottom: -10%; left: -10%;
        width: 400px; height: 400px;
        background: radial-gradient(circle, rgba(0,229,255,0.05) 0%, transparent 70%);
        pointer-events: none;
      }
    }

    .brand {
      display: flex; align-items: center; gap: 10px;
      font-family: var(--font-heading); font-weight: 800; font-size: 20px;
      color: var(--text-primary);
      .brand-icon { font-size: 24px; }
    }

    .hero-text {
      h1 { font-size: 48px; font-weight: 800; line-height: 1.1; margin-bottom: 16px; }
      p  { font-size: 15px; color: var(--text-secondary); line-height: 1.7; }
    }

    .info-box {
      display: flex; align-items: flex-start; gap: 12px;
      background: rgba(0,229,255,0.06); border: 1px solid rgba(0,229,255,0.15);
      border-radius: var(--radius-md); padding: 16px 18px;
      .material-icons { color: var(--accent); font-size: 22px; margin-top: 2px; flex-shrink: 0; }
      strong { display: block; font-size: 14px; color: var(--text-primary); margin-bottom: 4px; }
      p { margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
    }

    .auth-right {
      display: flex; align-items: center; justify-content: center;
      padding: 60px 40px;
      background: var(--bg-surface);
      border-left: 1px solid var(--border);
    }

    .auth-card { width: 100%; max-width: 400px; }

    .auth-header {
      margin-bottom: 32px;
      .icon-wrap {
        width: 56px; height: 56px; border-radius: var(--radius-lg);
        background: var(--accent-dim); display: flex; align-items: center;
        justify-content: center; margin-bottom: 20px;
        .material-icons { font-size: 28px; color: var(--accent); }
      }
      h2 { font-size: 26px; margin-bottom: 8px; }
      p  { color: var(--text-secondary); font-size: 14px; line-height: 1.6; }
    }

    /* ── Success State ── */
    .success-state {
      text-align: center;
      padding: 8px 0;

      .success-icon {
        width: 72px; height: 72px; border-radius: 50%;
        background: var(--green-dim); border: 2px solid rgba(0,230,118,0.3);
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 20px;
        animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        .material-icons { font-size: 36px; color: var(--green); }
      }

      h2 { font-size: 24px; margin-bottom: 12px; }
      p  { font-size: 14px; color: var(--text-secondary); line-height: 1.7; }
    }

    @keyframes scaleIn {
      from { transform: scale(0); opacity: 0; }
      to   { transform: scale(1); opacity: 1; }
    }

    .inline-link {
      background: none; border: none; color: var(--accent);
      cursor: pointer; font-size: inherit; padding: 0;
      text-decoration: underline;
      &:disabled { color: var(--text-muted); text-decoration: none; cursor: default; }
    }

    .spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(0,0,0,0.3); border-top-color: #000;
      border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block;
    }

    .auth-footer {
      margin-top: 28px;
      text-align: center;
      a {
        display: inline-flex; align-items: center; gap: 6px;
        font-size: 14px; color: var(--text-secondary);
        text-decoration: none;
        .material-icons { font-size: 18px; }
        &:hover { color: var(--accent); }
      }
    }

    @media (max-width: 768px) {
      .auth-page { grid-template-columns: 1fr; }
      .auth-left { display: none; }
    }
  `]
})
export class ForgotPasswordComponent {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  submitted    = signal(false);
  loading      = signal(false);
  errorMsg     = signal('');
  sentTo       = signal('');
  touched      = false;
  resendCooldown = signal(0);
  private cooldownInterval: any;

  get f() { return this.form.controls; }

  constructor(private fb: FormBuilder, private authService: AuthService) {}

  onSubmit(): void {
    this.touched = true;
    this.errorMsg.set('');
    if (this.form.invalid) return;

    this.loading.set(true);
    const email = this.form.value.email!;

    this.authService.forgotPassword(email).subscribe({
      next: res => {
        this.loading.set(false);
        this.sentTo.set(email);
        this.submitted.set(true);
        this.startCooldown();
      },
      error: err => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message || 'Something went wrong. Please try again.');
      }
    });
  }

  resend(): void {
    if (this.resendCooldown() > 0) return;
    this.submitted.set(false);
    this.form.get('email')?.setValue(this.sentTo());
    this.onSubmit();
  }

  private startCooldown(): void {
    this.resendCooldown.set(60);
    this.cooldownInterval = setInterval(() => {
      this.resendCooldown.update(n => {
        if (n <= 1) { clearInterval(this.cooldownInterval); return 0; }
        return n - 1;
      });
    }, 1000);
  }
}
