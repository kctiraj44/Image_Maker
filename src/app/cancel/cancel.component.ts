import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cancel',
  standalone: true,
  template: `
    <div class="cancel-wrapper">
      <div class="cancel-card">
        <div class="cancel-icon">❌</div>
        <h1>Payment Cancelled</h1>
        <p>Your payment was not completed. No charge was made.</p>
        <div class="actions">
          <button (click)="tryAgain()" class="btn-primary">Try Again</button>
          <button (click)="goHome()" class="btn-secondary">Go Home</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cancel-wrapper {
      min-height: 100vh;
      background: #fff5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .cancel-card {
      background: white;
      border-radius: 20px;
      padding: 50px 40px;
      max-width: 420px;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0,0,0,0.08);
    }
    .cancel-icon { font-size: 64px; margin-bottom: 16px; }
    h1 { font-size: 26px; font-weight: 700; color: #c62828; margin-bottom: 12px; }
    p { color: #666; font-size: 15px; margin-bottom: 32px; }
    .actions { display: flex; gap: 12px; }
    button { flex: 1; padding: 14px; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; }
    .btn-primary { background: linear-gradient(135deg, #0052cc, #0A3161); color: white; }
    .btn-secondary { background: #f0f0f0; color: #333; }
  `]
})
export class CancelComponent {
  constructor(private router: Router) {}
  tryAgain(): void { this.router.navigate(['/checkout']); }
  goHome(): void { this.router.navigate(['/']); }
}
