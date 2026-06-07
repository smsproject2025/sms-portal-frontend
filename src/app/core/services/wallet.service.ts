import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResponse, Transaction, Wallet } from '../../shared/models/index';

@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly API = `${environment.apiUrl}/wallet`;

  constructor(private http: HttpClient) {}

  getWallet(): Observable<Wallet> {
    return this.http.get<Wallet>(this.API);
  }

  createOrder(amount: number): Observable<ApiResponse<{ orderId: string; amount: string; currency: string; keyId: string }>> {
    return this.http.post<any>(`${this.API}/recharge/create-order`, { amount });
  }

  verifyPayment(payload: {
    amount: number;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Observable<ApiResponse<Wallet>> {
    return this.http.post<ApiResponse<Wallet>>(`${this.API}/recharge/verify`, payload);
  }

  getTransactions(page = 0, size = 20): Observable<PagedResponse<Transaction>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PagedResponse<Transaction>>(`${this.API}/transactions`, { params });
  }
}
