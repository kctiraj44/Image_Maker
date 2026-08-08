import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminService, Order } from '../services/admin.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  orders: Order[] = [];
  stats = {
    totalOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0
  };

  selectedOrder: Order | null = null;
  showOrderDetail = false;

  constructor(private adminService: AdminService, private router: Router) {}

  ngOnInit(): void {
    console.log('📊 Admin Dashboard loaded');
    this.loadOrders();
    this.loadStats();
  }

  loadOrders(): void {
    this.adminService.getAllOrders().subscribe(orders => {
      this.orders = orders;
      this.loadStats();
    });
  }

  loadStats(): void {
    const completed = this.orders.filter(order => order.status === 'completed');
    const totalRevenue = completed.reduce((sum, order) => sum + order.total, 0);
    this.stats = { totalOrders: this.orders.length, completedOrders: completed.length, totalRevenue, avgOrderValue: completed.length ? totalRevenue / completed.length : 0 };
  }

  viewOrderDetail(order: Order): void {
    this.selectedOrder = order;
    this.showOrderDetail = true;
  }

  closeOrderDetail(): void {
    this.showOrderDetail = false;
    this.selectedOrder = null;
  }

  deleteOrder(orderId: string, event: Event): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this order?')) {
      this.adminService.deleteOrder(orderId).subscribe(() => this.loadOrders());
    }
  }

  clearAllOrders(): void {
    if (confirm('⚠️ This will delete ALL orders. Are you sure?')) {
      this.adminService.clearAllOrders().subscribe(() => this.loadOrders());
    }
  }

  exportOrdersAsCSV(): void {
    if (this.orders.length === 0) {
      alert('No orders to export');
      return;
    }

    const headers = ['Order ID', 'Customer Name', 'Email', 'Package', 'Total', 'Status', 'Date'];
    const rows = this.orders.map(o => [
      o.orderId,
      o.customerName,
      o.email,
      o.package,
      '$' + o.total.toFixed(2),
      o.status,
      new Date(o.createdAt).toLocaleString()
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders_${new Date().getTime()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }
}
