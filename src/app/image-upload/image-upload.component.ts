import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { BackgroundRemovalService } from '../services/background-removal.service';

type BackgroundChoice = 'keep' | 'remove';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.css']
})
export class ImageUploadComponent {
  validationMessage: string | null = null;
  isPreparingImage = false;
  selectedBackgroundChoice: BackgroundChoice | null = null;
  readonly maxFileSizeBytes = 10 * 1024 * 1024;

  constructor(
    private router: Router,
    private backgroundRemovalService: BackgroundRemovalService
  ) {}

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

  choosePhoto(choice: BackgroundChoice, fileInput: HTMLInputElement): void {
    this.selectedBackgroundChoice = choice;
    this.validationMessage = null;
    fileInput.click();
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

    const choice = this.selectedBackgroundChoice;
    if (!choice) {
      this.validationMessage = 'Choose how you want to prepare your background first.';
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      this.validationMessage = 'We could not read that image. Please choose another JPEG or PNG file.';
      input.value = '';
    };
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        const targetSize = 1200;
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

        try {
          this.isPreparingImage = choice === 'remove';
          const preparedImage = choice === 'remove'
            ? await this.backgroundRemovalService.replaceBackgroundWithWhite(canvas)
            : canvas.toDataURL('image/jpeg', 0.95);

          sessionStorage.setItem('selectedImageUrl', preparedImage);
          sessionStorage.setItem('backgroundChoice', choice);
          await this.router.navigate(['/crop']);
        } catch (error) {
          this.validationMessage = error instanceof Error
            ? error.message
            : 'We could not remove the background. Please try another photo.';
        } finally {
          this.isPreparingImage = false;
          input.value = '';
        }
      };

      img.onerror = () => {
        this.validationMessage = 'We could not open that image. Please choose another JPEG or PNG file.';
        input.value = '';
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  }
}
