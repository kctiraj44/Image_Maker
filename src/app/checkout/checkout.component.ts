import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmailService } from '../services/email.service';
import { AdminService, Order } from '../services/admin.service';

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  features: string[];
  selected: boolean;
}

interface Addon {
  id: string;
  name: string;
  price: number;
  selected: boolean;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  photoUrl: string | null = null;
  promoCode: string = '';
  promoApplied: boolean = false;
  paymentStep: 'review' | 'payment' | 'success' = 'review';
  isProcessing: boolean = false;
  emailSent: boolean = false;

  // Payment form fields (pre-filled with test data)
  cardNumber: string = '4242 4242 4242 4242';
  expiryDate: string = '12/25';
  cvv: string = '123';
  cardholderName: string = 'John Doe';
  email: string = 'kctiraj44@gmail.com';
  agreeToTerms: boolean = true;

  constructor(
    private router: Router,
    private emailService: EmailService,
    private adminService: AdminService
  ) {}

  packages: Package[] = [
    {
      id: 'digital-full',
      name: 'Digital Photo + Full Access',
      description: '30 days full access',
      price: 9.95,
      originalPrice: 12.95,
      discount: 23,
      features: [
        'Instant download in JPG/PNG',
        'No watermarks',
        'Full access for 30 days',
        '100% compliance guaranteed',
        'Print version (A4 300dpi)',
        'Family photos (100 included)'
      ],
      selected: true
    },
    {
      id: 'digital-hd',
      name: 'Digital Photo HD',
      description: 'High resolution only',
      price: 6.95,
      features: [
        'High resolution JPG/PNG',
        'No watermarks',
        '100% compliance guaranteed'
      ],
      selected: false
    }
  ];

  addons: Addon[] = [
    {
      id: 'verification',
      name: 'Human Verification',
      price: 4.95,
      selected: false
    },
    {
      id: 'variations',
      name: 'Extra Photo Variations (+9 styles)',
      price: 6.95,
      selected: false
    },
    {
      id: 'printable',
      name: 'Printable Photo Sheet (A4 PDF)',
      price: 2.95,
      selected: false
    }
  ];

  ngOnInit(): void {
    this.photoUrl = sessionStorage.getItem('croppedImage');
    if (!this.photoUrl) {
      this.router.navigate(['/image-upload']);
    }
  }

  selectPackage(packageId: string): void {
    this.packages.forEach(p => {
      p.selected = p.id === packageId;
    });
  }

  toggleAddon(addonId: string): void {
    const addon = this.addons.find(a => a.id === addonId);
    if (addon) {
      addon.selected = !addon.selected;
    }
  }

  applyPromo(): void {
    if (this.promoCode.trim()) {
      this.promoApplied = true;
    }
  }

  getSelectedPackage(): Package | undefined {
    return this.packages.find(p => p.selected);
  }

  getSubtotal(): number {
    const packagePrice = this.getSelectedPackage()?.price || 0;
    const addonPrice = this.addons
      .filter(a => a.selected)
      .reduce((sum, a) => sum + a.price, 0);
    return packagePrice + addonPrice;
  }

  getTax(): number {
    return this.getSubtotal() * 0.1; // 10% tax
  }

  getDiscount(): number {
    if (this.promoApplied) {
      return this.getSubtotal() * 0.1; // 10% promo discount
    }
    return 0;
  }

  getTotal(): number {
    return this.getSubtotal() + this.getTax() - this.getDiscount();
  }

  retakePhoto(): void {
    sessionStorage.removeItem('croppedImage');
    sessionStorage.removeItem('selectedImageUrl');
    this.router.navigate(['/image-upload']);
  }

  proceedToPayment(): void {
    if (!this.cardholderName.trim() || !this.email.trim()) {
      alert('Please fill in your name and email.');
      return;
    }
    if (!this.agreeToTerms) {
      alert('Please agree to the terms and conditions.');
      return;
    }

    this.isProcessing = true;

    // Simulate payment processing with 2-second delay
    setTimeout(() => {
      this.isProcessing = false;

      const orderId = 'ORD-' + Date.now();

      // Save checkout details for success page
      sessionStorage.setItem('checkoutDetails', JSON.stringify({
        email: this.email,
        cardholderName: this.cardholderName,
        total: this.getTotal(),
        orderId
      }));

      // Save order to admin store
      const order: Order = {
        orderId,
        customerName: this.cardholderName,
        email: this.email,
        package: 'Digital Photo (US 2×2)',
        addons: [],
        subtotal: this.getSubtotal(),
        tax: this.getTax(),
        discount: this.getDiscount(),
        total: this.getTotal(),
        cardLast4: this.cardNumber.replace(/\s/g, '').slice(-4),
        status: 'completed',
        createdAt: new Date().toISOString(),
        photoDownloaded: false,
        emailSent: false
      };
      this.adminService.saveOrder(order);

      // Send confirmation email
      const croppedImage = sessionStorage.getItem('croppedImage') || '';
      this.emailService.sendPhotoAfterPayment({
        to: this.email,
        cardholderName: this.cardholderName,
        photoData: croppedImage,
        orderId,
        total: this.getTotal()
      }).subscribe({
        next: () => {
          order.emailSent = true;
          this.emailSent = true;
        },
        error: () => { this.emailSent = false; }
      });

      // Auto-download photo and show success
      setTimeout(() => this.downloadPhotoAutomatically(), 500);
      this.paymentStep = 'success';
    }, 2000);
  }

  goToPayment(): void {
    this.paymentStep = 'payment';
  }

  backToReview(): void {
    this.paymentStep = 'review';
  }

  downloadPhoto(): void {
    const croppedImage = sessionStorage.getItem('croppedImage');
    if (!croppedImage) return;

    const link = document.createElement('a');
    link.href = croppedImage;
    link.download = 'passport-photo.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getOrderId(): string {
    const orderDetails = sessionStorage.getItem('orderDetails');
    if (orderDetails) {
      try {
        const parsed = JSON.parse(orderDetails);
        return parsed.orderId || '';
      } catch {
        return '';
      }
    }
    return '';
  }

  getSelectedAddons(): Addon[] {
    return this.addons.filter(addon => addon.selected);
  }

  downloadPhotoAutomatically(): void {
    const croppedImage = sessionStorage.getItem('croppedImage');
    if (!croppedImage) return;

    const link = document.createElement('a');
    link.href = croppedImage;
    link.download = `passport-photo-${Date.now()}.jpg`;
    document.body.appendChild(link);
    
    // Small delay to ensure the element is attached
    setTimeout(() => {
      link.click();
      document.body.removeChild(link);
    }, 100);
  }
}
