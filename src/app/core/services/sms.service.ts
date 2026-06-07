import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, DashboardStats, PagedResponse, SmsLog, SmsRequest, SmsResponse, SmsStatus } from '../../shared/models/index';

@Injectable({ providedIn: 'root' })
export class SmsService {
  private readonly API = `${environment.apiUrl}/sms`;

  constructor(private http: HttpClient) {}

  sendSms(req: SmsRequest): Observable<ApiResponse<SmsResponse>> {
    return this.http.post<ApiResponse<SmsResponse>>(`${this.API}/send`, req);
  }

  sendBulkCsv(file: File, senderId: string, message: string, type: string): Observable<ApiResponse<SmsResponse>> {
    const form = new FormData();
    form.append('file', file);
    form.append('senderId', senderId);
    form.append('message', message);
    form.append('type', type);
    return this.http.post<ApiResponse<SmsResponse>>(`${this.API}/send-bulk-csv`, form);
  }

  getReports(page = 0, size = 20): Observable<PagedResponse<SmsLog>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PagedResponse<SmsLog>>(`${this.API}/reports`, { params });
  }

  getReportsByStatus(status: SmsStatus, page = 0, size = 20): Observable<PagedResponse<SmsLog>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PagedResponse<SmsLog>>(`${this.API}/reports/status/${status}`, { params });
  }
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly API = `${environment.apiUrl}/reports`;
  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.API}/dashboard`);
  }
}
