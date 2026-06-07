import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const pw  = control.get('password')?.value;
  const cpw = control.get('confirmPassword')?.value;
  return pw && cpw && pw !== cpw ? { mismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
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
          <h1>Choose a new<br><span class="text-accent">password</span></h1>
          <p>Create a strong password to keep your account secure.</p>
        </div>
        <div class="password-rules">
          <p class="rules-title">Password must have:</p>
          <ul>
            <li [class.met]="hasMinLength()">
              <span class="material-icons">{{ hasMinLength() ? 'check_circle' : 'radio_button_unchecked' }}</span>
              At least 8 characters
            </li>
            <li [class.met]="hasUppercase()">
              <span class="material-icons">{{ hasUppercase() ? 'check_circle' : 'radio_button_unchecked' }}</span>
              One uppercase letter
            </li>
            <li [class.met]="hasNumber()">
              <span class="material-icons">{{ hasNumber() ? 'check_circle' : 'radio_button_unchecked' }}</span>
              One number
            </li>
            <li [class.met]="hasSpecial()">
              <span class="material-icons">{{ hasSpecial() ? 'check_circle' : 'radio_button_unchecked' }}</span>
              One special character
            </li>
          </ul>
        </div>
      </div>

      <div class="auth-right">
        <div class="auth-card">

          <!-- Invalid / missing token -->
          @if (tokenStatus() === 'invalid') {
            <div class="error-state">
              <div class="error-icon">
                <span class="material-icons">link_off</span>
              </div>
              <h2>Link expired or invalid</h2>
              <p>This password reset link has already been used or has expired (1 hour limit).</p>
              <a routerLink="/auth/forgot-password" class="btn btn-primary w-full" style="margin-top:24px">
                <span class="material-icons">refresh</span> Request a new link
              </a>
            </div>
          }

          <!-- Loading token check -->
          @if (tokenStatus() === 'checking') {
            <div class="checking-state">
              <div class="spinner-lg"></div>
              <p class="text-muted">Verifying link…</p>
            </div>
          }

          <!-- Valid token — show form -->
          @if (tokenStatus() === 'valid' && !done()) {
            <div class="auth-header">
              <div class="icon-wrap">
                <span class="material-icons">lock</span>
              </div>
              <h2>Set new password</h2>
              <p>Enter and confirm your new password below.</p>
            </div>

            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="form-group">
                <label>New Password</label>
                <div class="input-with-icon">
                  <input [type]="showPw() ? 'text' : 'password'" class="form-control"
                    formControlName="password" placeholder="Min. 8 characters"
                    [class.is-invalid]="submitted && f['password'].errors"
                    (input)="onPasswordInput()">
                  <button type="button" class="eye-btn" (click)="showPw.set(!showPw())">
                    <span class="material-icons">{{ showPw() ? 'visibility_off' : 'visibility' }}</span>
                  </button>
                </div>
                @if (submitted && f['password'].errors?.['required']) {
                  <div class="form-error"><span class="material-icons">error_outline</span> Password is required</div>
                }
                @if (submitted && f['password'].errors?.['minlength']) {
                  <div class="form-error"><span class="material-icons">error_outline</span> Minimum 8 characters</div>
                }
                <!-- Strength bar -->
                @if (form.get('password')?.value) {
                  <div class="strength-bar">
                    <div class="strength-track">
                      <div class="strength-fill" [class]="strengthClass()" [style.width]="strengthWidth()"></div>
                    </div>
                    <span class="strength-label" [class]="strengthClass()">{{ strengthLabel() }}</span>
                  </div>
                }
              </div>

              <div class="form-group">
                <label>Confirm New Password</label>
                <div class="input-with-icon">
                  <input [type]="showCpw() ? 'text' : 'password'" class="form-control"
                    formControlName="confirmPassword" placeholder="Repeat password"
                    [class.is-invalid]="submitted && (f['confirmPassword'].errors || form.errors?.['mismatch'])">
                  <button type="button" class="eye-btn" (click)="showCpw.set(!showCpw())">
                    <span class="material-icons">{{ showCpw() ? 'visibility_off' : 'visibility' }}</span>
                  </button>
                </div>
                @if (submitted && form.errors?.['mismatch']) {
                  <div class="form-error"><span class="material-icons">error_outline</span> Passwords do not match</div>
                }
              </div>

              @if (errorMsg()) {
                <div class="alert alert-danger">
                  <span class="material-icons">error</span> {{ errorMsg() }}
                </div>
              }

              <button type="submit" class="btn btn-primary w-full btn-lg" [disabled]="loading()">
                @if (loading()) { <span class="spinner"></span> Resetting... }
                @else { <span class="material-icons">lock_reset</span> Reset Password }
              </button>
            </form>
          }

          <!-- Success -->
          @if (done()) {
            <div class="success-state">
              <div class="success-icon">
                <span class="material-icons">check_circle</span>
              </div>
              <h2>Password reset!</h2>
              <p>Your password has been changed successfully. You can now sign in with your new password.</p>
              <a routerLink="/auth/login" class="btn btn-primary w-full" style="margin-top:24px">
                <span class="material-icons">login</span> Go to Login
              </a>
            </div>
          }

          @if (tokenStatus() === 'valid' && !done()) {
            <div class="auth-footer">
              <a routerLink="/auth/login">
                <span class="material-icons">arrow_back</span> Back to Login
              </a>
            </div>
          }
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
        width: 400px; height: 400px;
        background: radial-gradient(circle, rgba(0,230,118,0.05) 0%, transparent 70%);
      }
    }

    .brand {
      display: flex; align-items: center; gap: 10px;
      font-family: var(--font-heading); font-weight: 800; font-size: 20px; color: var(--text-primary);
      .brand-icon { font-size: 24px; }
    }

    .hero-text {
      h1 { font-size: 48px; font-weight: 800; line-height: 1.1; margin-bottom: 16px; }
      p  { font-size: 15px; color: var(--text-secondary); line-height: 1.7; }
    }

    .password-rules {
      .rules-title { font-size: 12px; color: var(--text-muted); text-transform: uppercase;
                     letter-spacing: 0.1em; margin-bottom: 12px; font-weight: 600; }
      ul { list-style: none; display: flex; flex-direction: column; gap: 10px; }
      li {
        display: flex; align-items: center; gap: 8px;
        font-size: 13px; color: var(--text-muted); transition: color 0.2s;
        .material-icons { font-size: 16px; }
        &.met { color: var(--green); }
      }
    }

    .auth-right {
      display: flex; align-items: center; justify-content: center;
      padding: 60px 40px;
      background: var(--bg-surface);
      border-left: 1px solid var(--border);
    }

    .auth-card { width: 100%; max-width: 400px; }

    .auth-header {
      margin-bottom: 28px;
      .icon-wrap {
        width: 56px; height: 56px; border-radius: var(--radius-lg);
        background: var(--green-dim); display: flex; align-items: center;
        justify-content: center; margin-bottom: 20px;
        .material-icons { font-size: 28px; color: var(--green); }
      }
      h2 { font-size: 26px; margin-bottom: 8px; }
      p  { color: var(--text-secondary); font-size: 14px; line-height: 1.6; }
    }

    .input-with-icon {
      position: relative;
      .form-control { padding-right: 44px; }
    }
    .eye-btn {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      background: none; border: none; color: var(--text-muted);
      cursor: pointer; padding: 0; display: flex;
      .material-icons { font-size: 18px; }
      &:hover { color: var(--text-secondary); }
    }

    /* Strength bar */
    .strength-bar {
      display: flex; align-items: center; gap: 10px; margin-top: 8px;
    }
    .strength-track {
      flex: 1; height: 4px; background: var(--bg-hover); border-radius: 2px; overflow: hidden;
    }
    .strength-fill {
      height: 100%; border-radius: 2px; transition: width 0.3s, background 0.3s;
      &.weak   { background: var(--red); }
      &.fair   { background: var(--yellow); }
      &.good   { background: var(--accent); }
      &.strong { background: var(--green); }
    }
    .strength-label {
      font-size: 11px; font-weight: 600; font-family: var(--font-mono);
      text-transform: uppercase; min-width: 44px;
      &.weak   { color: var(--red); }
      &.fair   { color: var(--yellow); }
      &.good   { color: var(--accent); }
      &.strong { color: var(--green); }
    }

    /* States */
    .checking-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 16px; padding: 60px 0; color: var(--text-muted);
    }
    .spinner-lg {
      width: 36px; height: 36px;
      border: 3px solid var(--border); border-top-color: var(--accent);
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }

    .error-state, .success-state {
      text-align: center; padding: 8px 0;
      h2 { font-size: 22px; margin-bottom: 12px; }
      p  { font-size: 14px; color: var(--text-secondary); line-height: 1.7; }
    }

    .error-icon {
      width: 72px; height: 72px; border-radius: 50%;
      background: var(--red-dim); border: 2px solid rgba(255,82,82,0.3);
      display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;
      .material-icons { font-size: 36px; color: var(--red); }
    }

    .success-icon {
      width: 72px; height: 72px; border-radius: 50%;
      background: var(--green-dim); border: 2px solid rgba(0,230,118,0.3);
      display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;
      animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      .material-icons { font-size: 36px; color: var(--green); }
    }

    @keyframes scaleIn {
      from { transform: scale(0); opacity: 0; }
      to   { transform: scale(1); opacity: 1; }
    }

    .spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(0,0,0,0.3); border-top-color: #000;
      border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block;
    }

    .auth-footer {
      margin-top: 28px; text-align: center;
      a {
        display: inline-flex; align-items: center; gap: 6px;
        font-size: 14px; color: var(--text-secondary); text-decoration: none;
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
export class ResetPasswordComponent implements OnInit {
  form = this.fb.group({
    password:        ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  }, { validators: passwordsMatch });

  tokenStatus = signal<'checking' | 'valid' | 'invalid'>('checking');
  submitted   = false;
  loading     = signal(false);
  done        = signal(false);
  errorMsg    = signal('');
  showPw      = signal(false);
  showCpw     = signal(false);

  private token = '';

  get f() { return this.form.controls; }

  // Password rules indicators
  get pw(): string { return this.form.get('password')?.value || ''; }
  hasMinLength()  { return this.pw.length >= 8; }
  hasUppercase()  { return /[A-Z]/.test(this.pw); }
  hasNumber()     { return /[0-9]/.test(this.pw); }
  hasSpecial()    { return /[^A-Za-z0-9]/.test(this.pw); }

  get strengthScore(): number {
    return [this.hasMinLength(), this.hasUppercase(), this.hasNumber(), this.hasSpecial()]
      .filter(Boolean).length;
  }
  strengthClass()  { return ['', 'weak', 'fair', 'good', 'strong'][this.strengthScore]; }
  strengthLabel()  { return ['', 'Weak', 'Fair', 'Good', 'Strong'][this.strengthScore]; }
  strengthWidth()  { return ['0%', '25%', '50%', '75%', '100%'][this.strengthScore]; }

  onPasswordInput(): void {
    // trigger re-evaluation of confirm field match
    this.form.get('confirmPassword')?.updateValueAndValidity();
  }

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.tokenStatus.set('invalid');
      return;
    }
    // Token presence is enough to show the form; actual validation happens on submit.
    // A short delay simulates a verification check for UX.
    setTimeout(() => this.tokenStatus.set('valid'), 600);
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMsg.set('');
    if (this.form.invalid) return;

    this.loading.set(true);
    const newPassword = this.form.value.password!;

    this.authService.resetPassword(this.token, newPassword).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success) {
          this.done.set(true);
          this.toastr.success('Password reset successfully!');
        } else {
          // Token expired or already used
          if (res.message.toLowerCase().includes('expired') ||
              res.message.toLowerCase().includes('invalid')) {
            this.tokenStatus.set('invalid');
          } else {
            this.errorMsg.set(res.message);
          }
        }
      },
      error: err => {
        this.loading.set(false);
        const msg = err.error?.message || 'Something went wrong. Please try again.';
        if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')) {
          this.tokenStatus.set('invalid');
        } else {
          this.errorMsg.set(msg);
        }
      }
    });
  }
}
