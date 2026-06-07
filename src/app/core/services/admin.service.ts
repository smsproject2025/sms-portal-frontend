import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResponse, SenderID, SmsLog } from '../../shared/models/index';

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalSmsSent: number;
  smsSentToday: number;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  mobile: string;
  role: string;
  verified: boolean;
  active: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly API = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.API}/stats`);
  }

  getUsers(page = 0, size = 20): Observable<PagedResponse<AdminUser>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PagedResponse<AdminUser>>(`${this.API}/users`, { params });
  }

  toggleUserActive(id: number): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.API}/users/${id}/toggle-active`, {});
  }

  getPendingSenderIds(page = 0, size = 20): Observable<PagedResponse<SenderID>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PagedResponse<SenderID>>(`${this.API}/sender-ids/pending`, { params });
  }

  approveSenderId(id: number): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.API}/sender-ids/${id}/approve`, {});
  }

  rejectSenderId(id: number, reason: string): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.API}/sender-ids/${id}/reject`, { reason });
  }

  getAllSmsLogs(page = 0, size = 20): Observable<PagedResponse<SmsLog>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PagedResponse<SmsLog>>(`${this.API}/sms-logs`, { params });
  }
}
