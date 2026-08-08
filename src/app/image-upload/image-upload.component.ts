import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.css']
})
export class ImageUploadComponent {
  validationMessage: string | null = null;
  readonly maxFileSizeBytes = 10 * 1024 * 1024;

  constructor(private router: Router) {}

  validateFile(file: File | null): string | null {
    if (!file) {
      return 'Please choose an image file.';
    }

    if (file.size <= 0) {
      return 'The selected file is empty.';
    }

    if (file.size > this.maxFileSizeBytes) {
      return 'The selected image is too large. Please choose a file smaller than 10MB.';
    }

    const acceptedTypes = ['image/jpeg', 'image/png'];
    const acceptedExtensions = ['.jpg', '.jpeg', '.png'];
    const fileName = file.name.toLowerCase();
    const isAcceptedType = acceptedTypes.includes(file.type) || acceptedExtensions.some((ext) => fileName.endsWith(ext));

    if (!isAcceptedType) {
      return 'Please upload a JPEG or PNG image.';
    }

    return null;
  }

  navigateToCropPage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      this.validationMessage = 'Please choose an image file.';
      input.value = '';
      return;
    }

    this.validationMessage = this.validateFile(file);

    if (this.validationMessage) {
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const targetSize = 956;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = targetSize;
        canvas.height = targetSize;

        const scale = Math.max(targetSize / img.width, targetSize / img.height);
        const newWidth = img.width * scale;
        const newHeight = img.height * scale;
        const offsetX = (targetSize - newWidth) / 2;
        const offsetY = (targetSize - newHeight) / 2;

        ctx?.drawImage(img, 0, 0, img.width, img.height, offsetX, offsetY, newWidth, newHeight);

        const resizedBase64Image = canvas.toDataURL('image/jpeg');
        sessionStorage.setItem('selectedImageUrl', resizedBase64Image);
        this.router.navigate(['/crop']);
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  }
}