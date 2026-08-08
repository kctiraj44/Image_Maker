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

@Component({
  selector: 'app-cropimage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cropimage.component.html',
  styleUrls: ['./cropimage.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class CropimageComponent implements AfterViewInit, OnDestroy {
  private readonly outputSize = 600;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private backgroundRemovalService: BackgroundRemovalService
  ) {}

  imageUrl: string | null = null;
  croppedImage: string | null = null;
  isProcessingPreview = false;
  previewError: string | null = null;


  @ViewChild('imageElement') imageElement?: ElementRef<HTMLImageElement>;
  cropper?: Cropper;

  

  ngOnInit() {
    this.imageUrl = sessionStorage.getItem('selectedImageUrl');

    this.route.queryParams.subscribe(params => {
      if (params['download'] === 'success') {
        this.downloadImage();
      }
    });
  }

  moldStatus: 'idle' | 'good' | 'bad' = 'idle';
  private validationThrottle: ReturnType<typeof setTimeout> | null = null;

  ngAfterViewInit(): void {
    if (!this.imageElement?.nativeElement) {
      return;
    }

    this.cropper = new Cropper(this.imageElement.nativeElement, {
      aspectRatio: 1,
      viewMode: 1,
      autoCropArea: 0.9,
      cropBoxResizable: true,
      cropBoxMovable: true,
      dragMode: 'move',
      guides: false,
      zoomable: true,
      zoomOnWheel:true,
      zoomOnTouch:true,
      movable:true,
      scalable:false,

      ready: ()=> {
          this.cropper?.setCropBoxData({
            width: this.outputSize,
            height: this.outputSize
          });
          requestAnimationFrame(() => this.attachPassportGuides());
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
      this.croppedImage = await this.backgroundRemovalService.replaceBackgroundWithWhite(canvas);
    } catch {
      this.previewError = 'We could not prepare the white background. Please try again.';
    } finally {
      this.isProcessingPreview = false;
    }
  }

  validateFacePosition(): void {
    if (!this.cropper) return;
    try {
      // Sample at 80x80 for speed
      const canvas = this.cropper.getCroppedCanvas({ width: 80, height: 80 });
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const { data } = ctx.getImageData(0, 0, 80, 80);

      // Check each facial zone has sufficient content (non-uniform pixels)
      const headOk  = this.zoneHasContent(data, 80, 8, 16);
      const eyesOk  = this.zoneHasContent(data, 80, 28, 42);
      const noseOk  = this.zoneHasContent(data, 80, 44, 56);
      const chinOk  = this.zoneHasContent(data, 80, 66, 76);
      // Ensure face is not cut off at top (head must be visible)
      const topFilled = this.zoneHasContent(data, 80, 2, 8);

      const isAligned = headOk && eyesOk && noseOk && chinOk && topFilled;
      this.moldStatus = isAligned ? 'good' : 'bad';
      this.updateMoldColor(isAligned);
    } catch {
      // Ignore canvas errors (tainted canvas, etc.)
    }
  }

  private zoneHasContent(data: Uint8ClampedArray, w: number, yPct: number, yEndPct: number): boolean {
    const y0 = Math.floor(yPct * w / 100);
    const y1 = Math.floor(yEndPct * w / 100);
    let filled = 0;
    for (let y = y0; y < y1; y++) {
      for (let x = 20; x < 60; x++) {
        const i = (y * w + x) * 4;
        // Count pixels that are not pure black/transparent (actual photo content)
        if (data[i] + data[i+1] + data[i+2] > 60 && data[i+3] > 30) filled++;
      }
    }
    return filled / ((y1 - y0) * 40) > 0.4;
  }

  private updateMoldColor(valid: boolean): void {
    const cropBox = this.imageElement?.nativeElement
      .parentElement?.querySelector('.cropper-crop-box');
    if (!cropBox) return;

    const svg = cropBox.querySelector('.face-mold-svg');
    if (!svg) return;

    const color = valid ? 'rgba(76,175,80,0.95)' : 'rgba(244,67,54,0.9)';
    const glow  = valid ? 'rgba(76,175,80,0.3)' : 'rgba(244,67,54,0.25)';

    // Update oval
    const oval = svg.querySelector('ellipse') as SVGElement | null;
    if (oval) {
      oval.setAttribute('stroke', color);
      oval.setAttribute('stroke-width', '2');
      oval.setAttribute('filter', valid ? '' : '');
    }

    // Update all guide lines
    svg.querySelectorAll('line').forEach((l: SVGElement) => {
      if (!l.getAttribute('stroke')?.includes('255,193,7')) {
        l.setAttribute('stroke', color.replace('0.9', '0.6').replace('0.95', '0.6'));
      }
    });

    // Update eye ovals
    svg.querySelectorAll('circle').forEach((c: SVGElement) => c.setAttribute('fill', color));

    // Update hint
    const hint = cropBox.querySelector('.mold-hint') as HTMLElement | null;
    if (hint) {
      hint.textContent = valid ? '✅ Face aligned correctly!' : '❌ Adjust to match the template';
      hint.style.background = valid ? 'rgba(27,94,32,0.88)' : 'rgba(183,28,28,0.88)';
      hint.style.boxShadow = `0 0 12px ${glow}`;
    }

    // Flash the oval border
    if (oval) {
      oval.setAttribute('stroke-dasharray', valid ? '4,0' : '3,2');
    }
  }

  zoomIn(): void {
    this.cropper?.zoom(0.1);
  }

  zoomOut(): void {
    this.cropper?.zoom(-0.1);
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
    this.cropper?.destroy();
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
    // SVG face mold: align face to template for correct US passport proportions
    overlay.innerHTML = `
      <svg class="face-mold-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <!-- Shoulder guideline -->
        <line x1="10" y1="88" x2="90" y2="88" stroke="rgba(255,255,255,0.35)" stroke-width="0.5" stroke-dasharray="2,2"/>
        <!-- Head oval -->
        <ellipse cx="50" cy="44" rx="22" ry="30"
          fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="1.2" stroke-dasharray="3,2"/>
        <!-- Crown marker -->
        <line x1="40" y1="14" x2="60" y2="14" stroke="rgba(255,193,7,0.9)" stroke-width="1"/>
        <!-- Eye level line -->
        <line x1="30" y1="38" x2="70" y2="38" stroke="rgba(33,150,243,0.7)" stroke-width="0.6" stroke-dasharray="2,2"/>
        <!-- Left eye -->
        <ellipse cx="42" cy="38" rx="4" ry="2.5" fill="none" stroke="rgba(33,150,243,0.9)" stroke-width="0.9"/>
        <!-- Right eye -->
        <ellipse cx="58" cy="38" rx="4" ry="2.5" fill="none" stroke="rgba(33,150,243,0.9)" stroke-width="0.9"/>
        <!-- Nose tip -->
        <circle cx="50" cy="52" r="1.2" fill="rgba(76,175,80,0.9)"/>
        <!-- Mouth -->
        <line x1="44" y1="60" x2="56" y2="60" stroke="rgba(255,152,0,0.85)" stroke-width="0.9"/>
        <!-- Chin marker -->
        <line x1="42" y1="73" x2="58" y2="73" stroke="rgba(244,67,54,0.8)" stroke-width="1"/>
        <!-- Center axis -->
        <line x1="50" y1="5" x2="50" y2="95" stroke="rgba(255,255,255,0.18)" stroke-width="0.4" stroke-dasharray="2,3"/>
        <!-- Labels -->
        <text x="62" y="15" fill="rgba(255,214,80,1)" font-size="4.2" font-family="sans-serif" font-weight="bold">Top of Head</text>
        <text x="62" y="39" fill="rgba(100,181,246,1)" font-size="4.2" font-family="sans-serif" font-weight="bold">Eyes</text>
        <text x="52" y="53" fill="rgba(129,199,132,1)" font-size="4.2" font-family="sans-serif" font-weight="bold">Nose</text>
        <text x="57" y="61" fill="rgba(255,183,77,1)" font-size="4.2" font-family="sans-serif" font-weight="bold">Mouth</text>
        <text x="60" y="74" fill="rgba(239,154,154,1)" font-size="4.2" font-family="sans-serif" font-weight="bold">Chin</text>
      </svg>
      <div class="mold-hint">👆 Move &amp; zoom your photo to match the template</div>
    `;

    cropBox.appendChild(overlay);
  }
}
