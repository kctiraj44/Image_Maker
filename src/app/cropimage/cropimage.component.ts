import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewEncapsulation,
  ViewChild
} from '@angular/core';
import Cropper from 'cropperjs';
import { ActivatedRoute, Router } from '@angular/router';
import { BackgroundRemovalService } from '../services/background-removal.service';
import { FaceLandmarkAnalysis, FaceLandmarkService } from '../services/face-landmark.service';

interface DetectedFace {
  boundingBox: FaceBounds;
}

interface FaceDetectorInstance {
  detect(image: HTMLImageElement): Promise<DetectedFace[]>;
}

interface FaceDetectorConstructor {
  new (options?: { fastMode?: boolean; maxDetectedFaces?: number }): FaceDetectorInstance;
}

export interface FaceBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PassportCompositionCheck {
  headHeightPercent: number;
  eyeHeightPercent: number;
  headHeightWithinRange: boolean;
  eyeHeightWithinRange: boolean;
  isWithinGuidance: boolean;
}

const MIN_HEAD_HEIGHT_PERCENT = 50;
const MAX_HEAD_HEIGHT_PERCENT = 69;
const MIN_EYE_HEIGHT_PERCENT = 56;
const MAX_EYE_HEIGHT_PERCENT = 69;
const AUTOMATIC_CROP_VERTICAL_OFFSET_RATIO = 0.02;
const TARGET_HEAD_HEIGHT_RATIO = 0.52;

export function calculatePassportCompositionCheck(
  analysis: FaceLandmarkAnalysis,
  crop: Cropper.SetDataOptions,
  imageWidth: number,
  imageHeight: number
): PassportCompositionCheck | null {
  if (!analysis.forehead || !analysis.chin || !analysis.eyeCenter
    || crop.y === undefined || crop.height === undefined || crop.height <= 0) {
    return null;
  }

  const cropBottom = crop.y + crop.height;
  const foreheadY = analysis.forehead.y * imageHeight;
  const chinY = analysis.chin.y * imageHeight;
  const eyeY = analysis.eyeCenter.y * imageHeight;
  const estimatedHairTopY = foreheadY - ((chinY - foreheadY) * 0.12);
  const headHeightPercent = ((chinY - estimatedHairTopY) / crop.height) * 100;
  const eyeHeightPercent = ((cropBottom - eyeY) / crop.height) * 100;
  const headHeightWithinRange = headHeightPercent >= MIN_HEAD_HEIGHT_PERCENT
    && headHeightPercent <= MAX_HEAD_HEIGHT_PERCENT;
  const eyeHeightWithinRange = eyeHeightPercent >= MIN_EYE_HEIGHT_PERCENT
    && eyeHeightPercent <= MAX_EYE_HEIGHT_PERCENT;

  return {
    headHeightPercent,
    eyeHeightPercent,
    headHeightWithinRange,
    eyeHeightWithinRange,
    isWithinGuidance: headHeightWithinRange && eyeHeightWithinRange
  };
}

export function calculateAutomaticCrop(face: FaceBounds, imageWidth: number, imageHeight: number): Cropper.SetDataOptions {
  // The guide uses a 52% head height with the eyes 59% up from the bottom.
  // This keeps both measurements inside the Department of State ranges.
  const targetTopHeadSpaceRatio = 0.14;
  const cropSize = Math.min(
    Math.max(face.height / TARGET_HEAD_HEIGHT_RATIO, face.width * 1.55),
    imageWidth,
    imageHeight
  );
  const x = Math.min(Math.max(face.x + (face.width / 2) - (cropSize / 2), 0), imageWidth - cropSize);
  const y = Math.min(
    Math.max(face.y - (cropSize * targetTopHeadSpaceRatio) + (cropSize * AUTOMATIC_CROP_VERTICAL_OFFSET_RATIO), 0),
    imageHeight - cropSize
  );
  return { x, y, width: cropSize, height: cropSize };
}

export function calculateLandmarkCrop(
  analysis: FaceLandmarkAnalysis,
  imageWidth: number,
  imageHeight: number
): Cropper.SetDataOptions | null {
  if (!analysis.forehead || !analysis.chin || !analysis.eyeCenter || !analysis.faceCenter) {
    return null;
  }

  const foreheadY = analysis.forehead.y * imageHeight;
  const chinY = analysis.chin.y * imageHeight;
  const eyeY = analysis.eyeCenter.y * imageHeight;
  const estimatedHairTopY = foreheadY - ((chinY - foreheadY) * 0.12);
  const cropSize = Math.min(
    // Keep a little horizontal breathing room, but do not let the fallback
    // width make the detected head smaller than the selected 52% target.
    Math.max((chinY - estimatedHairTopY) / TARGET_HEAD_HEIGHT_RATIO, imageWidth * 0.42),
    imageWidth,
    imageHeight
  );
  const x = Math.min(
    Math.max((analysis.faceCenter.x * imageWidth) - (cropSize / 2), 0),
    imageWidth - cropSize
  );
  // The eye line is positioned 59% up from the bottom, as shown by the template.
  const y = Math.min(
    Math.max(eyeY - (cropSize * 0.41) + (cropSize * AUTOMATIC_CROP_VERTICAL_OFFSET_RATIO), 0),
    imageHeight - cropSize
  );
  return { x, y, width: cropSize, height: cropSize };
}

@Component({
  selector: 'app-cropimage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cropimage.component.html',
  styleUrls: ['./cropimage.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class CropimageComponent implements AfterViewInit, OnDestroy {
  private readonly outputSize = 1200;
  private readonly cropBoxDisplaySize = 600;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private backgroundRemovalService: BackgroundRemovalService,
    private faceLandmarkService: FaceLandmarkService
  ) {}

  imageUrl: string | null = null;
  croppedImage: string | null = null;
  finalImageSizeBytes: number | null = null;
  finalOutputSize = this.outputSize;
  backgroundChoice: 'keep' | 'remove' = 'remove';
  autoCropStatus: 'detecting' | 'applied' | 'unavailable' = 'detecting';
  compositionCheck: PassportCompositionCheck | null = null;
  topHairMayBeClipped = false;
  isProcessingPreview = false;
  previewError: string | null = null;


  @ViewChild('imageElement') imageElement?: ElementRef<HTMLImageElement>;
  cropper?: Cropper;

  

  ngOnInit() {
    this.imageUrl = sessionStorage.getItem('selectedImageUrl');
    this.backgroundChoice = sessionStorage.getItem('backgroundChoice') === 'keep' ? 'keep' : 'remove';

    this.route.queryParams.subscribe(params => {
      if (params['download'] === 'success') {
        this.downloadImage();
      }
    });
  }

  moldStatus: 'idle' | 'good' | 'bad' = 'idle';
  private validationThrottle: ReturnType<typeof setTimeout> | null = null;
  private landmarkAnalysis: FaceLandmarkAnalysis | null = null;

  ngAfterViewInit(): void {
    if (!this.imageElement?.nativeElement) {
      return;
    }

    this.cropper = new Cropper(this.imageElement.nativeElement, {
      aspectRatio: 1,
      viewMode: 1,
      autoCropArea: 0.72,
      cropBoxResizable: false,
      cropBoxMovable: false,
      dragMode: 'move',
      guides: false,
      zoomable: true,
      zoomOnWheel:true,
      zoomOnTouch:true,
      movable:true,
      scalable:false,

      ready: ()=> {
          this.cropper?.setCropBoxData({
            width: this.cropBoxDisplaySize,
            height: this.cropBoxDisplaySize
          });
          requestAnimationFrame(() => this.attachPassportGuides());
          void this.createAutomaticPreview();
      },
      crop: () => {
        // Throttle validation to avoid performance impact
        if (this.validationThrottle) clearTimeout(this.validationThrottle);
        this.validationThrottle = setTimeout(() => this.validateFacePosition(), 200);
      }
    });
  }

  async cropImage(): Promise<void> {
    if (!this.cropper) {
      return;
    }

    const canvas = this.cropper.getCroppedCanvas({
      width: this.outputSize,
      height: this.outputSize,
      imageSmoothingQuality: 'high'
    });

    this.isProcessingPreview = true;
    this.previewError = null;

    try {
      const submission = await this.backgroundRemovalService.createPassportJpeg(canvas, true);
      this.croppedImage = submission.dataUrl;
      this.finalImageSizeBytes = submission.sizeBytes;
      this.finalOutputSize = submission.width;
    } catch (error) {
      this.previewError = error instanceof Error
        ? error.message
        : 'We could not prepare the white background. Please try again.';
    } finally {
      this.isProcessingPreview = false;
    }
  }

  private async createAutomaticPreview(): Promise<void> {
    if (!this.cropper || !this.imageElement?.nativeElement) {
      this.autoCropStatus = 'unavailable';
      return;
    }

    try {
      const analysis = await this.faceLandmarkService.analyze(this.imageElement.nativeElement);
      const crop = calculateLandmarkCrop(
        analysis,
        this.imageElement.nativeElement.naturalWidth,
        this.imageElement.nativeElement.naturalHeight
      );
      if (analysis.faceCount !== 1 || !crop) {
        this.landmarkAnalysis = null;
        this.compositionCheck = null;
        this.topHairMayBeClipped = false;
        this.autoCropStatus = 'unavailable';
        this.applyFallbackFraming();
        return;
      }

      this.landmarkAnalysis = analysis;
      this.cropper.setData(crop);
      this.autoCropStatus = 'applied';
      await this.cropImage();
    } catch {
      this.landmarkAnalysis = null;
      this.compositionCheck = null;
      this.topHairMayBeClipped = false;
      this.autoCropStatus = 'unavailable';
      this.applyFallbackFraming();
    }
  }

  private applyFallbackFraming(): void {
    if (!this.cropper || !this.imageElement?.nativeElement) {
      return;
    }

    const { naturalWidth, naturalHeight } = this.imageElement.nativeElement;
    const cropSize = Math.min(naturalWidth, naturalHeight) * 0.72;
    this.cropper.setData({
      x: (naturalWidth - cropSize) / 2,
      // Bias the source crop lower so the face moves upward in the final frame.
      // This brings normally centered uploads nearer the 62%-from-bottom eye guide.
      y: (naturalHeight - cropSize) * 0.72,
      width: cropSize,
      height: cropSize
    });
    void this.cropImage();
  }

  validateFacePosition(): void {
    if (!this.cropper || !this.landmarkAnalysis) {
      this.compositionCheck = null;
      this.moldStatus = 'idle';
      return;
    }

    this.compositionCheck = calculatePassportCompositionCheck(
      this.landmarkAnalysis,
      this.cropper.getData(true),
      this.imageElement?.nativeElement.naturalWidth ?? 0,
      this.imageElement?.nativeElement.naturalHeight ?? 0
    );
    const crop = this.cropper.getData(true);
    const imageHeight = this.imageElement?.nativeElement.naturalHeight ?? 0;
    // Face landmarks do not reliably include tall hairstyles. If the square
    // frame touches the source image's upper boundary, warn rather than imply
    // that the entire hairline is safely included.
    this.topHairMayBeClipped = (crop.y ?? 0) <= Math.max(2, imageHeight * 0.005);
    this.moldStatus = this.compositionCheck?.isWithinGuidance ? 'good' : 'bad';
    this.updateMoldColor(this.moldStatus === 'good');
  }

  private updateMoldColor(valid: boolean): void {
    const cropBox = this.imageElement?.nativeElement
      .parentElement?.querySelector('.cropper-crop-box');
    if (!cropBox) return;

    const svg = cropBox.querySelector('.face-mold-svg');
    if (!svg) return;

    // Keep the fixed mold subtle; it is a visual reference, not a pass/fail result.
    const oval = svg.querySelector('ellipse') as SVGElement | null;
    if (oval) {
      oval.setAttribute('stroke', 'rgba(76,175,80,0.38)');
      oval.setAttribute('stroke-width', '0.9');
    }

    // Flash the oval border
    if (oval) {
      oval.setAttribute('stroke-dasharray', '3,2');
    }
  }

  zoomIn(): void {
    this.cropper?.zoom(0.05);
  }

  zoomOut(): void {
    this.cropper?.zoom(-0.05);
  }

  rotateLeft(): void {
    this.cropper?.rotate(-90);
  }

  rotateRight(): void {
    this.cropper?.rotate(90);
  }

  resetView(): void {
    this.cropper?.reset();
  }

  /**
   * CropperJS listens for touch gestures globally. On mobile, do not let a
   * gesture that started on a button, message, or the page below the canvas
   * reach it. Gestures directly on the photo remain available for positioning.
   */
  protectPageInteraction(event: Event): void {
    const target = event.target instanceof Element ? event.target : null;
    if (!target?.closest('.crop-container')) {
      event.stopPropagation();
    }
  }

  returnToEditing(): void {
    this.croppedImage = null;
    this.finalImageSizeBytes = null;
    this.finalOutputSize = this.outputSize;
  }

  getFinalImageSizeText(): string {
    if (this.finalImageSizeBytes === null) {
      return 'Preparing size…';
    }
    return `${Math.ceil(this.finalImageSizeBytes / 1024)} KB`;
  }

  isWithinPassportFileSizeLimit(): boolean {
    return this.finalImageSizeBytes !== null && this.finalImageSizeBytes <= 240_000;
  }

  getEstimatedCompressionRatio(): number {
    if (this.finalImageSizeBytes === null || this.finalImageSizeBytes <= 0) {
      return 0;
    }

    // A 24-bit RGB image has three bytes per pixel before JPEG
    // encoding. This is an estimate for display only, not a download blocker.
    return (this.finalOutputSize * this.finalOutputSize * 3) / this.finalImageSizeBytes;
  }

  getCompressionRatioText(): string {
    return this.finalImageSizeBytes === null
      ? 'Preparing…'
      : `${this.getEstimatedCompressionRatio().toFixed(1)}:1`;
  }

  getCompositionCheckLabel(): string {
    if (!this.compositionCheck) {
      return 'Manual review needed';
    }
    return this.compositionCheck.isWithinGuidance ? '✓ Within guide' : 'Adjust crop';
  }

  downloadImage() {
    if (!this.croppedImage) return;

    // Store the cropped image for checkout page
    sessionStorage.setItem('croppedImage', this.croppedImage);
    
    // Navigate to checkout page
    this.router.navigate(['/checkout']);
  }



  onImageLoadError() {
    console.error('Could not load image from sessionStorage blob URL.');
    this.imageUrl = null;
  }

  @HostListener('window:keydown', ['$event'])
  movePhotoWithArrowKeys(event: KeyboardEvent): void {
    if (!this.cropper || !event.key.startsWith('Arrow')) {
      return;
    }

    const movement = event.shiftKey ? 10 : 2;
    const moves: Record<string, [number, number]> = {
      ArrowUp: [0, -movement],
      ArrowDown: [0, movement],
      ArrowLeft: [-movement, 0],
      ArrowRight: [movement, 0]
    };

    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      this.cropper.move(move[0], move[1]);
    }
  }

  ngOnDestroy(): void {
    if (this.validationThrottle) clearTimeout(this.validationThrottle);
    if (this.cropper && typeof this.cropper.destroy === 'function') {
      this.cropper.destroy();
    }
  }

  private attachPassportGuides(): void {
    const cropBox = this.imageElement?.nativeElement
      .parentElement
      ?.querySelector('.cropper-crop-box');

    if (!cropBox || cropBox.querySelector('.overlay-guides')) {
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'overlay-guides';
    // Clean measurement template: a square output boundary and head-height guide.
    overlay.innerHTML = `
      <svg class="face-mold-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <!-- The only composition markers: top of head and bottom of chin. -->
        <line x1="8" y1="16" x2="92" y2="16" stroke="rgba(63,194,140,0.82)" stroke-width="0.8" stroke-dasharray="2.3,1.8"/>
        <text x="50" y="13" text-anchor="middle" fill="rgba(25,137,91,0.98)" font-size="3.1" font-weight="700">TOP OF HEAD</text>
        <line x1="8" y1="72" x2="92" y2="72" stroke="rgba(63,194,140,0.82)" stroke-width="0.8" stroke-dasharray="2.3,1.8"/>
        <text x="50" y="77" text-anchor="middle" fill="rgba(25,137,91,0.98)" font-size="3.1" font-weight="700">BOTTOM OF CHIN</text>
      </svg>
    `;

    cropBox.appendChild(overlay);
  }

  private getDataUrlSize(dataUrl: string): number {
    const base64 = dataUrl.split(',')[1] ?? '';
    const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
    return Math.floor((base64.length * 3) / 4) - padding;
  }
}
