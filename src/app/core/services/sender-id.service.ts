import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, SenderID } from '../../shared/models/index';

@Injectable({ providedIn: 'root' })
export class SenderIdService {
  private readonly API = `${environment.apiUrl}/sender-ids`;

  constructor(private http: HttpClient) {}

  getMySenderIds(): Observable<SenderID[]> {
    return this.http.get<SenderID[]>(this.API);
  }

  requestSenderId(senderId: string): Observable<ApiResponse<SenderID>> {
    return this.http.post<ApiResponse<SenderID>>(`${this.API}/request`, { senderId });
  }
}
