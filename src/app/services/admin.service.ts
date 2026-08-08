import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Order {
  orderId: string;
  customerName: string;
  email: string;
  package: string;
  addons: string[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  cardLast4: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
  photoDownloaded: boolean;
  emailSent: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  // In-memory store (H2-style: lives for the duration of the browser session)
  private orders: Order[] = [];
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  public orders$ = this.ordersSubject.asObservable();

  saveOrder(order: Order): void {
    this.orders.push(order);
    this.ordersSubject.next([...this.orders]);
    console.log('💾 Order saved to memory:', order.orderId);
  }

  getAllOrders(): Observable<Order[]> {
    return this.orders$;
  }

  getOrderById(orderId: string): Order | undefined {
    return this.orders.find(o => o.orderId === orderId);
  }

  getOrderStats() {
    const completed = this.orders.filter(o => o.status === 'completed');
    const revenue = completed.reduce((sum, o) => sum + o.total, 0);
    return {
      totalOrders: this.orders.length,
      completedOrders: completed.length,
      totalRevenue: revenue,
      avgOrderValue: completed.length > 0 ? revenue / completed.length : 0
    };
  }

  deleteOrder(orderId: string): void {
    this.orders = this.orders.filter(o => o.orderId !== orderId);
    this.ordersSubject.next([...this.orders]);
  }

  clearAllOrders(): void {
    this.orders = [];
    this.ordersSubject.next([]);
  }
}
