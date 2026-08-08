import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Order {
  orderId: string; customerName: string; email: string; package: string; addons: string[];
  subtotal: number; tax: number; discount: number; total: number;
  cardLast4: string; status: 'completed' | 'pending' | 'failed'; createdAt: string;
  photoDownloaded: boolean; emailSent: boolean;
}

interface ApiOrder extends Omit<Order, 'package' | 'addons' | 'cardLast4' | 'photoDownloaded' | 'emailSent'> {
  packageName: string;
  addons: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly endpoint = `${environment.apiBaseUrl}/api/orders`;
  constructor(private readonly http: HttpClient) { }
  getAllOrders(): Observable<Order[]> {
    return this.http.get<ApiOrder[]>(this.endpoint).pipe(
      map(orders => orders.map(order => ({
        ...order,
        package: order.packageName,
        addons: order.addons ? order.addons.split(',').filter(Boolean) : [],
        cardLast4: '',
        photoDownloaded: false,
        emailSent: false
      })))
    );
  }
  saveOrder(order: Order): Observable<Order> { const { package: packageName, cardLast4, photoDownloaded, emailSent, status, createdAt, ...request } = order; return this.http.post<Order>(this.endpoint, { ...request, packageName }); }
  deleteOrder(orderId: string): Observable<void> { return this.http.delete<void>(`${this.endpoint}/${orderId}`); }
  clearAllOrders(): Observable<void> { return this.http.delete<void>(this.endpoint); }
}
