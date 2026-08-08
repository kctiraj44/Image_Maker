import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EmailService } from '../services/email.service';

@Component({
  selector: 'app-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './success.component.html',
  styleUrls: ['./success.component.css']
})
export class SuccessComponent implements OnInit {
  emailSent = false;
  downloading = false;
  email = '';
  orderId = '';
  total = 0;

  constructor(
    private router: Router,
    private emailService: EmailService
  ) {}

  ngOnInit(): void {
    const orderDetails = this.getOrderDetails();
    this.email = orderDetails.email || '';
    this.orderId = 'ORD-' + Date.now();
    this.total = orderDetails.total || 9.95;

    // Auto-download photo
    this.downloadPhoto();

    // Send confirmation email
    const croppedImage = sessionStorage.getItem('croppedImage') || '';
    this.emailService.sendPhotoAfterPayment({
      to: this.email,
      cardholderName: orderDetails.cardholderName || 'Customer',
      photoData: croppedImage,
      orderId: this.orderId,
      total: this.total
    }).subscribe({
      next: () => { this.emailSent = true; },
      error: () => { this.emailSent = false; }
    });
  }

  private getOrderDetails(): { email: string; cardholderName: string; total: number } {
    try {
      const raw = sessionStorage.getItem('checkoutDetails');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return { email: '', cardholderName: '', total: 9.95 };
    }
  }

  downloadPhoto(): void {
    const croppedImage = sessionStorage.getItem('croppedImage');
    if (!croppedImage) return;
    this.downloading = true;
    const link = document.createElement('a');
    link.href = croppedImage;
    link.download = `passport-photo-${Date.now()}.jpg`;
    document.body.appendChild(link);
    setTimeout(() => {
      link.click();
      document.body.removeChild(link);
      this.downloading = false;
    }, 300);
  }

  createAnother(): void {
    sessionStorage.removeItem('croppedImage');
    sessionStorage.removeItem('selectedImageUrl');
    sessionStorage.removeItem('checkoutDetails');
    this.router.navigate(['/image-upload']);
  }
}
