import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { BackgroundRemovalService } from '../services/background-removal.service';
import { AdSlotComponent } from '../shared/ad-slot/ad-slot.component';

type BackgroundChoice = 'keep' | 'remove';
type ApplicationType = 'passport' | 'visa' | 'dv' | 'i485' | 'i765';

interface ApplicationOption {
  id: ApplicationType;
  title: string;
  shortLabel: string;
  requirements: string;
  downloadAdvice: string;
  sourceUrl: string;
}

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule, AdSlotComponent],
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.css']
})
export class ImageUploadComponent {
  validationMessage: string | null = null;
  isPreparingImage = false;
  selectedBackgroundChoice: BackgroundChoice | null = null;
  selectedApplication: ApplicationType = 'visa';
  readonly maxFileSizeBytes = 10 * 1024 * 1024;
  readonly applicationOptions: readonly ApplicationOption[] = [
    {
      id: 'visa',
      title: 'U.S. visa / DS-160',
      shortLabel: 'DS-160 visa',
      requirements: 'Digital color JPEG: square, 600–1200 px, sRGB, and no more than 240 KB.',
      downloadAdvice: 'Choose Digital photo for your online application.',
      sourceUrl: 'https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/photos/digital-image-requirements.html'
    },
    {
      id: 'dv',
      title: 'Diversity Visa (DV) entry',
      shortLabel: 'DV lottery',
      requirements: 'Use a current color digital photo and review the photo section of the current DV entry instructions before submitting.',
      downloadAdvice: 'Choose Digital photo; confirm the current DV entry technical requirements before upload.',
      sourceUrl: 'https://travel.state.gov/content/travel/en/us-visas/immigrate/diversity-visa-program-entry.html'
    },
    {
      id: 'passport',
      title: 'U.S. passport',
      shortLabel: 'Passport',
      requirements: 'A recent 2 × 2 inch color photo with a plain white or off-white background. Online renewal accepts digital uploads.',
      downloadAdvice: 'Choose Digital photo for online renewal, or the 4 × 6 print layout for a paper application.',
      sourceUrl: 'https://travel.state.gov/content/travel/en/passports/how-apply/online-renewal-photo.html'
    },
    {
      id: 'i485',
      title: 'USCIS Form I-485',
      shortLabel: 'I-485 adjustment of status',
      requirements: 'Two identical, recent color 2 × 2 inch passport-style photos, printed on thin glossy paper; write your name and A-Number, if any, on the back.',
      downloadAdvice: 'Choose the 4 × 6 print layout, then have it printed and cut into two photos.',
      sourceUrl: 'https://www.uscis.gov/sites/default/files/document/forms/i-485instr.pdf'
    },
    {
      id: 'i765',
      title: 'USCIS Form I-765',
      shortLabel: 'I-765 employment authorization',
      requirements: 'Two identical, recent color 2 × 2 inch passport-style photos, printed on thin glossy paper; write your name and A-Number, if any, on the back.',
      downloadAdvice: 'Choose the 4 × 6 print layout, then have it printed and cut into two photos.',
      sourceUrl: 'https://www.uscis.gov/sites/default/files/document/forms/i-765instr.pdf'
    }
  ];

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

  selectApplication(application: ApplicationType): void {
    this.selectedApplication = application;
  }

  get selectedApplicationOption(): ApplicationOption {
    return this.applicationOptions.find((option) => option.id === this.selectedApplication) ?? this.applicationOptions[0];
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
          sessionStorage.setItem('applicationType', this.selectedApplication);
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
