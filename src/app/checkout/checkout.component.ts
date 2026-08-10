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
  lastDownloadType: 'digital' | 'print' | null = null;

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
    this.lastDownloadType = 'digital';
    this.isPreparingDownload = false;
  }

  downloadPhoto(): void {
    if (!this.photoUrl) {
      return;
    }
    // PPI does not affect a digital upload, but adding standard JFIF metadata
    // makes the file display as 300 PPI in print and photo applications.
    this.triggerDownload(this.withJpegDpi(this.photoUrl, 300), 'passport-photo-digital-1200x1200.jpg');
  }

  downloadPrintLayout(): void {
    if (!this.photoUrl || this.isPreparingDownload) {
      return;
    }

    this.isPreparingDownload = true;
    const photo = new Image();
    photo.onload = () => {
      const printCanvas = document.createElement('canvas');
      printCanvas.width = 1200;
      printCanvas.height = 1800;

      const context = printCanvas.getContext('2d', { colorSpace: 'srgb' });
      if (!context) {
        this.isPreparingDownload = false;
        return;
      }

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, printCanvas.width, printCanvas.height);

      // A 4 × 6 inch sheet at 300 PPI. Each 600 × 600 image prints at 2 × 2 inches.
      // Stacking them vertically preserves the 2-inch size and leaves room to cut them apart.
      context.drawImage(photo, 300, 270, 600, 600);
      context.drawImage(photo, 300, 930, 600, 600);

      const printJpeg = printCanvas.toDataURL('image/jpeg', 0.96);
      this.triggerDownload(this.withJpegDpi(printJpeg, 300), 'passport-photo-print-4x6-two-2x2.jpg');
      this.downloadComplete = true;
      this.lastDownloadType = 'print';
      this.isPreparingDownload = false;
    };
    photo.onerror = () => {
      this.isPreparingDownload = false;
    };
    photo.src = this.photoUrl;
  }

  private triggerDownload(href: string, filename: string): void {
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Canvas exports usually label a JPEG as 72/96 DPI even when its pixel layout
   * was designed for print. Write standard JFIF density metadata so print apps
   * default this 1200 × 1800 image to 4 × 6 inches at 300 PPI.
   */
  private withJpegDpi(dataUrl: string, dpi: number): string {
    const [header, encodedImage] = dataUrl.split(',');
    if (!header || !encodedImage || !header.includes('image/jpeg')) {
      return dataUrl;
    }

    const decoded = atob(encodedImage);
    const bytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0));
    const jfifMarker = [0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01,
      (dpi >> 8) & 0xff, dpi & 0xff, (dpi >> 8) & 0xff, dpi & 0xff, 0x00, 0x00];

    let output: Uint8Array;
    const hasJfifHeader = bytes.length >= 18 && bytes[0] === 0xff && bytes[1] === 0xd8
      && bytes[2] === 0xff && bytes[3] === 0xe0 && bytes[6] === 0x4a && bytes[7] === 0x46
      && bytes[8] === 0x49 && bytes[9] === 0x46;

    if (hasJfifHeader) {
      output = bytes.slice();
      output[13] = 0x01; // density unit: dots per inch
      output[14] = (dpi >> 8) & 0xff;
      output[15] = dpi & 0xff;
      output[16] = (dpi >> 8) & 0xff;
      output[17] = dpi & 0xff;
    } else {
      output = new Uint8Array(bytes.length + jfifMarker.length);
      output.set(bytes.slice(0, 2));
      output.set(jfifMarker, 2);
      output.set(bytes.slice(2), 2 + jfifMarker.length);
    }

    let binary = '';
    for (const byte of output) {
      binary += String.fromCharCode(byte);
    }
    return `${header},${btoa(binary)}`;
  }

  retakePhoto(): void {
    sessionStorage.removeItem('croppedImage');
    sessionStorage.removeItem('selectedImageUrl');
    sessionStorage.removeItem('backgroundChoice');
    this.router.navigate(['/image-upload']);
  }
}
