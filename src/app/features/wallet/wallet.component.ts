import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { WalletService } from '../../core/services/wallet.service';
import { AuthService } from '../../core/services/auth.service';
import { PagedResponse, Transaction, Wallet } from '../../shared/models/index';

declare var Razorpay: any;

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fade-in">
      <div class="page-header">
        <h1>Wallet</h1>
        <p>Manage your balance and transaction history</p>
      </div>

      <div class="wallet-layout">
        <!-- Left: Balance & Recharge -->
        <div>
          <!-- Balance Card -->
          <div class="balance-card">
            <div class="balance-header">
              <div>
                <div class="balance-label">Current Balance</div>
                <div class="balance-amount font-mono">
                  ₹{{ wallet()?.balance | number:'1.2-2' }}
                </div>
              </div>
              <div class="balance-icon">
                <span class="material-icons">account_balance_wallet</span>
              </div>
            </div>
            <div class="balance-stats">
              <div class="bs-item">
                <span class="bs-label">Total Recharged</span>
                <span class="bs-value font-mono text-green">₹{{ wallet()?.totalRecharge | number:'1.2-2' }}</span>
              </div>
              <div class="bs-item">
                <span class="bs-label">Total Spent</span>
                <span class="bs-value font-mono text-red">₹{{ wallet()?.totalSpent | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>

          <!-- Recharge Card -->
          <div class="card">
            <div class="card__header">
              <span class="card__title">Add Balance</span>
            </div>

            <div class="quick-amounts">
              @for (amt of quickAmounts; track amt) {
                <button class="amount-chip" [class.selected]="selectedAmount === amt"
                  (click)="selectAmount(amt)">₹{{ amt }}</button>
              }
            </div>

            <form [formGroup]="rechargeForm" (ngSubmit)="initiatePayment()">
              <div class="form-group" style="margin-top:16px">
                <label>Custom Amount (₹)</label>
                <input type="number" class="form-control" formControlName="amount"
                  placeholder="Enter amount" min="10" step="1">
                @if (rechargeForm.get('amount')?.errors?.['min']) {
                  <div class="form-error"><span class="material-icons">error_outline</span> Minimum ₹10</div>
                }
              </div>

              <button type="submit" class="btn btn-primary w-full" style="margin-top:4px"
                [disabled]="paymentLoading() || rechargeForm.invalid">
                @if (paymentLoading()) { <span class="spinner-sm"></span> Processing... }
                @else { <span class="material-icons">payment</span> Pay with Razorpay }
              </button>
            </form>

            <div class="payment-methods">
              <span>Accepted:</span>
              <span class="pm">UPI</span>
              <span class="pm">Cards</span>
              <span class="pm">Net Banking</span>
              <span class="pm">Wallets</span>
            </div>
          </div>
        </div>

        <!-- Right: Transaction History -->
        <div class="card">
          <div class="card__header">
            <span class="card__title">Transaction History</span>
            <span class="text-muted" style="font-size:12px">{{ transactions()?.totalElements || 0 }} total</span>
          </div>

          @if (txnLoading()) {
            <div style="padding:40px;text-align:center;color:var(--text-muted)">
              <div class="spinner-lg" style="margin:0 auto 12px"></div>
              Loading...
            </div>
          } @else if (transactions()?.content?.length) {
            <div class="txn-list">
              @for (txn of transactions()!.content; track txn.id) {
                <div class="txn-item">
                  <div class="txn-icon" [class]="txn.type === 'CREDIT' ? 'credit' : 'debit'">
                    <span class="material-icons">
                      {{ txn.type === 'CREDIT' ? 'arrow_downward' : 'arrow_upward' }}
                    </span>
                  </div>
                  <div class="txn-info">
                    <div class="txn-desc">{{ txn.description }}</div>
                    <div class="txn-date">{{ txn.createdAt | date:'dd MMM yyyy, HH:mm' }}</div>
                  </div>
                  <div class="txn-amount" [class]="txn.type === 'CREDIT' ? 'credit' : 'debit'">
                    {{ txn.type === 'CREDIT' ? '+' : '-' }}₹{{ txn.amount | number:'1.2-2' }}
                  </div>
                </div>
              }
            </div>

            @if (!transactions()!.last) {
              <button class="btn btn-secondary w-full" style="margin-top:16px"
                (click)="loadMoreTxns()" [disabled]="txnLoading()">
                Load more
              </button>
            }
          } @else {
            <div class="empty-state">
              <div class="icon">💳</div>
              <h3>No transactions yet</h3>
              <p>Your transaction history will appear here.</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wallet-layout {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: 20px;
      align-items: start;
    }

    .balance-card {
      background: linear-gradient(135deg, #0d2137 0%, #0a1929 100%);
      border: 1px solid rgba(0,229,255,0.2);
      border-radius: var(--radius-lg);
      padding: 24px;
      margin-bottom: 16px;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: -30px; right: -30px;
        width: 120px; height: 120px;
        background: radial-gradient(circle, rgba(0,229,255,0.1) 0%, transparent 70%);
      }
    }

    .balance-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }

    .balance-label {
      font-size: 11px;
      color: rgba(0,229,255,0.6);
      text-transform: uppercase;
      letter-spacing: 0.12em;
      margin-bottom: 8px;
    }

    .balance-amount {
      font-size: 36px;
      font-weight: 700;
      color: var(--accent);
      line-height: 1;
    }

    .balance-icon {
      width: 48px; height: 48px;
      border-radius: var(--radius-md);
      background: rgba(0,229,255,0.1);
      border: 1px solid rgba(0,229,255,0.2);
      display: flex; align-items: center; justify-content: center;
      color: var(--accent);
      .material-icons { font-size: 22px; }
    }

    .balance-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid rgba(0,229,255,0.1);
    }

    .bs-item {
      .bs-label { font-size: 10px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 4px; }
      .bs-value { font-size: 16px; font-weight: 700; }
    }

    .quick-amounts {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .amount-chip {
      padding: 6px 16px;
      border-radius: 20px;
      border: 1px solid var(--border);
      background: var(--bg-elevated);
      color: var(--text-secondary);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: var(--transition);

      &:hover { border-color: var(--accent); color: var(--accent); }
      &.selected { background: var(--accent-dim); border-color: var(--accent); color: var(--accent); }
    }

    .payment-methods {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      font-size: 11px;
      color: var(--text-muted);
      flex-wrap: wrap;
    }

    .pm {
      padding: 2px 8px;
      border-radius: 4px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      color: var(--text-secondary);
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

    .txn-list { display: flex; flex-direction: column; }

    .txn-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 0;
      border-bottom: 1px solid var(--border);

      &:last-child { border-bottom: none; }
    }

    .txn-icon {
      width: 36px; height: 36px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      .material-icons { font-size: 16px; }

      &.credit { background: var(--green-dim); color: var(--green); }
      &.debit  { background: var(--red-dim);   color: var(--red); }
    }

    .txn-info { flex: 1; min-width: 0; }
    .txn-desc { font-size: 13px; color: var(--text-primary); margin-bottom: 2px; }
    .txn-date { font-size: 11px; color: var(--text-muted); }

    .txn-amount {
      font-family: var(--font-mono);
      font-size: 14px;
      font-weight: 700;
      flex-shrink: 0;

      &.credit { color: var(--green); }
      &.debit  { color: var(--red); }
    }

    @media (max-width: 1024px) {
      .wallet-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class WalletComponent implements OnInit {
  wallet = signal<Wallet | null>(null);
  transactions = signal<PagedResponse<Transaction> | null>(null);
  paymentLoading = signal(false);
  txnLoading = signal(true);
  selectedAmount = 0;
  txnPage = 0;

  quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  rechargeForm = this.fb.group({
    amount: [null as number | null, [Validators.required, Validators.min(10)]]
  });

  constructor(
    private fb: FormBuilder,
    private walletService: WalletService,
    private auth: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.walletService.getWallet().subscribe(w => this.wallet.set(w));
    this.loadTransactions();
  }

  selectAmount(amount: number): void {
    this.selectedAmount = amount;
    this.rechargeForm.get('amount')?.setValue(amount);
  }

  initiatePayment(): void {
    if (this.rechargeForm.invalid) return;
    const amount = this.rechargeForm.get('amount')?.value!;
    this.paymentLoading.set(true);

    this.walletService.createOrder(amount).subscribe({
      next: res => {
        if (!res.success) {
          this.toastr.error(res.message);
          this.paymentLoading.set(false);
          return;
        }

        const options = {
          key: res.data.keyId,
          amount: parseFloat(res.data.amount) * 100,
          currency: 'INR',
          name: 'SMSPortal',
          description: 'Wallet Recharge',
          order_id: res.data.orderId,
          handler: (response: any) => {
            this.verifyPayment(amount, response);
          },
          prefill: {
            name: this.auth.currentUser()?.name,
            email: this.auth.currentUser()?.email
          },
          theme: { color: '#00e5ff' },
          modal: { ondismiss: () => { this.paymentLoading.set(false); } }
        };

        const rzp = new Razorpay(options);
        rzp.open();
      },
      error: () => {
        this.toastr.error('Could not create payment order');
        this.paymentLoading.set(false);
      }
    });
  }

  verifyPayment(amount: number, response: any): void {
    this.walletService.verifyPayment({
      amount,
      razorpayOrderId: response.razorpay_order_id,
      razorpayPaymentId: response.razorpay_payment_id,
      razorpaySignature: response.razorpay_signature
    }).subscribe({
      next: res => {
        this.paymentLoading.set(false);
        if (res.success) {
          this.wallet.set(res.data);
          this.auth.updateBalance(res.data.balance);
          this.toastr.success(`₹${amount} added to wallet!`);
          this.loadTransactions(true);
        } else {
          this.toastr.error(res.message);
        }
      },
      error: () => {
        this.paymentLoading.set(false);
        this.toastr.error('Payment verification failed');
      }
    });
  }

  loadTransactions(reset = false): void {
    if (reset) { this.txnPage = 0; this.transactions.set(null); }
    this.txnLoading.set(true);
    this.walletService.getTransactions(this.txnPage, 15).subscribe({
      next: data => {
        this.txnLoading.set(false);
        if (reset || !this.transactions()) {
          this.transactions.set(data);
        } else {
          const existing = this.transactions()!;
          this.transactions.set({ ...data, content: [...existing.content, ...data.content] });
        }
      },
      error: () => this.txnLoading.set(false)
    });
  }

  loadMoreTxns(): void {
    this.txnPage++;
    this.loadTransactions();
  }
}
