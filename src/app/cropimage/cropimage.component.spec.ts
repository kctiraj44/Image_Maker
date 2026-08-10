import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { calculateAutomaticCrop, calculatePassportCompositionCheck, CropimageComponent } from './cropimage.component';

describe('CropimageComponent', () => {
  let component: CropimageComponent;
  let fixture: ComponentFixture<CropimageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CropimageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { queryParams: of({}) }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CropimageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('zooms in when requested', () => {
    const zoomSpy = jasmine.createSpy('zoom');
    component.cropper = { zoom: zoomSpy } as any;

    component.zoomIn();

    expect(zoomSpy).toHaveBeenCalledWith(0.05);
  });

  it('rotates the cropper view', () => {
    const rotateSpy = jasmine.createSpy('rotate');
    component.cropper = { rotate: rotateSpy } as any;

    component.rotateLeft();

    expect(rotateSpy).toHaveBeenCalledWith(-90);
  });

  it('creates a square crop that targets a 52 percent head height', () => {
    const crop = calculateAutomaticCrop({ x: 480, y: 220, width: 240, height: 360 }, 1200, 1200);

    expect(crop.width).toBeCloseTo(692, 0);
    expect(crop.height).toBeCloseTo(692, 0);
    expect(220 - (crop.y ?? 0)).toBeCloseTo(83, 0);
  });

  it('keeps an automatic crop inside the image bounds', () => {
    const crop = calculateAutomaticCrop({ x: 0, y: 0, width: 180, height: 300 }, 600, 600);

    expect(crop.x).toBeGreaterThanOrEqual(0);
    expect(crop.y).toBeGreaterThanOrEqual(0);
    expect((crop.x ?? 0) + (crop.width ?? 0)).toBeLessThanOrEqual(600);
    expect((crop.y ?? 0) + (crop.height ?? 0)).toBeLessThanOrEqual(600);
  });

  it('accepts landmark measurements inside the published head and eye ranges', () => {
    const result = calculatePassportCompositionCheck({
      faceCount: 1,
      faceCenter: { x: 0.5, y: 0.5 },
      forehead: { x: 0.5, y: 0.25 },
      chin: { x: 0.5, y: 0.75 },
      eyeCenter: { x: 0.5, y: 0.41 }
    }, { x: 0, y: 0, width: 1200, height: 1200 }, 1200, 1200);

    expect(result?.headHeightPercent).toBeCloseTo(56, 1);
    expect(result?.eyeHeightPercent).toBeCloseTo(59, 1);
    expect(result?.isWithinGuidance).toBeTrue();
  });

  it('shows a compression-ratio estimate without blocking a small JPEG', () => {
    component.finalImageSizeBytes = 180_000;

    expect(component.getCompressionRatioText()).toBe('24.0:1');
    expect(component.isWithinPassportFileSizeLimit()).toBeTrue();
  });

});
