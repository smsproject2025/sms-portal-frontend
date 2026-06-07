import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/index';

export type WaMessageType = 'TEXT' | 'TEMPLATE' | 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'AUDIO';
export type WaStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'REJECTED';

export interface WaLog {
  id: number; mobile: string; messageType: WaMessageType; message: string;
  templateName: string; mediaUrl: string; mediaCaption: string; status: WaStatus;
  waMessageId: string; cost: number; batchId: string; createdAt: string;
  sentAt: string; deliveredAt: string; readAt: string;
}

export interface WaTemplate {
  id: number; name: string; language: string; body: string; category: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED'; createdAt: string;
}

export interface WaContact {
  id: number; mobile: string; name: string; email: string; tags: string;
  optInStatus: 'OPTED_IN' | 'OPTED_OUT' | 'PENDING'; optInAt: string;
  optOutAt: string; lastMessageAt: string; createdAt: string;
}

export interface WaCampaign {
  id: number; name: string; description: string; messageType: WaMessageType;
  message: string; templateName: string; targetTags: string;
  totalTargeted: number; totalSent: number; totalDelivered: number;
  totalRead: number; totalFailed: number; totalCost: number;
  status: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  scheduledAt: string; startedAt: string; completedAt: string; createdAt: string;
}

export interface WaInboxMessage {
  id: number; fromMobile: string; fromName: string; body: string;
  waMessageId: string; messageType: string; mediaUrl: string;
  readStatus: 'UNREAD' | 'READ'; receivedAt: string; readAt: string;
}

export interface WaStats {
  totalSent: number; totalDelivered: number; totalRead: number;
  totalFailed: number; walletBalance: number; totalSpent: number;
  sentToday: number; deliveryRate: number;
}

export interface PagedResponse<T> {
  content: T[]; totalElements: number; totalPages: number;
  number: number; size: number; first: boolean; last: boolean;
}

@Injectable({ providedIn: 'root' })
export class WhatsAppService {
  private readonly API = `${environment.apiUrl}/whatsapp`;
  constructor(private http: HttpClient) {}

  // Send
  sendText(mobiles: string[], message: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API}/send/text`, { mobiles, message });
  }
  sendTemplate(mobiles: string[], templateName: string, templateLanguage: string, params: string[]): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API}/send/template`, { mobiles, templateName, templateLanguage, params });
  }
  sendMedia(mobiles: string[], mediaUrl: string, mediaType: WaMessageType, caption: string, filename?: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API}/send/media`, { mobiles, mediaUrl, mediaType, caption, filename });
  }

  // Logs
  getLogs(page = 0, size = 20): Observable<PagedResponse<WaLog>> {
    return this.http.get<PagedResponse<WaLog>>(`${this.API}/logs`, { params: new HttpParams().set('page', page).set('size', size) });
  }
  getLogsByStatus(status: WaStatus, page = 0, size = 20): Observable<PagedResponse<WaLog>> {
    return this.http.get<PagedResponse<WaLog>>(`${this.API}/logs/status/${status}`, { params: new HttpParams().set('page', page).set('size', size) });
  }
  getStats(): Observable<WaStats> {
    return this.http.get<WaStats>(`${this.API}/stats`);
  }

  // Templates
  getTemplates(): Observable<WaTemplate[]> {
    return this.http.get<WaTemplate[]>(`${this.API}/templates`);
  }
  createTemplate(name: string, language: string, body: string, category: string): Observable<ApiResponse<WaTemplate>> {
    return this.http.post<ApiResponse<WaTemplate>>(`${this.API}/templates`, { name, language, body, category });
  }

  // Contacts
  getContacts(page = 0, size = 20): Observable<PagedResponse<WaContact>> {
    return this.http.get<PagedResponse<WaContact>>(`${this.API}/contacts`, { params: new HttpParams().set('page', page).set('size', size) });
  }
  addContact(mobile: string, name: string, email: string, tags: string): Observable<ApiResponse<WaContact>> {
    return this.http.post<ApiResponse<WaContact>>(`${this.API}/contacts`, { mobile, name, email, tags });
  }
  importContacts(file: File): Observable<ApiResponse<{ added: number; skipped: number }>> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ApiResponse<any>>(`${this.API}/contacts/import`, form);
  }
  optOutContact(id: number): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.API}/contacts/${id}/opt-out`, {});
  }
  deleteContact(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.API}/contacts/${id}`);
  }
  getContactStats(): Observable<{ total: number; optedIn: number; optedOut: number }> {
    return this.http.get<any>(`${this.API}/contacts/stats`);
  }

  // Campaigns
  getCampaigns(page = 0, size = 20): Observable<PagedResponse<WaCampaign>> {
    return this.http.get<PagedResponse<WaCampaign>>(`${this.API}/campaigns`, { params: new HttpParams().set('page', page).set('size', size) });
  }
  createCampaign(data: any): Observable<ApiResponse<WaCampaign>> {
    return this.http.post<ApiResponse<WaCampaign>>(`${this.API}/campaigns`, data);
  }
  launchCampaign(id: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API}/campaigns/${id}/launch`, {});
  }
  deleteCampaign(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.API}/campaigns/${id}`);
  }

  // Inbox
  getInbox(page = 0, size = 20): Observable<PagedResponse<WaInboxMessage>> {
    return this.http.get<PagedResponse<WaInboxMessage>>(`${this.API}/inbox`, { params: new HttpParams().set('page', page).set('size', size) });
  }
  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.API}/inbox/unread-count`);
  }
  markRead(id: number): Observable<void> {
    return this.http.put<void>(`${this.API}/inbox/${id}/read`, {});
  }
  markAllRead(): Observable<void> {
    return this.http.put<void>(`${this.API}/inbox/mark-all-read`, {});
  }
}
