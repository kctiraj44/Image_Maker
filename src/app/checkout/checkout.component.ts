import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  photoUrl: string | null = null;
  isPreparingDownload = false;
  downloadComplete = false;

  constructor(private readonly router: Router) {}

  ngOnInit(): void {
    this.photoUrl = sessionStorage.getItem('croppedImage');
    if (!this.photoUrl) {
      this.router.navigate(['/image-upload']);
    }
  }

  downloadForFree(): void {
    if (!this.photoUrl || this.isPreparingDownload) {
      return;
    }

    this.isPreparingDownload = true;
    this.downloadPhoto();
    this.downloadComplete = true;
    this.isPreparingDownload = false;
  }

  downloadPhoto(): void {
    if (!this.photoUrl) {
      return;
    }
    const link = document.createElement('a');
    link.href = this.photoUrl;
    link.download = 'passport-photo.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  retakePhoto(): void {
    sessionStorage.removeItem('croppedImage');
    sessionStorage.removeItem('selectedImageUrl');
    sessionStorage.removeItem('backgroundChoice');
    this.router.navigate(['/image-upload']);
  }
}
