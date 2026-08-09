import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { calculateAutomaticCrop, CropimageComponent } from './cropimage.component';

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

  it('creates a square crop that targets a 60 percent head height', () => {
    const crop = calculateAutomaticCrop({ x: 480, y: 220, width: 240, height: 360 }, 1200, 1200);

    expect(crop.width).toBe(600);
    expect(crop.height).toBe(600);
    expect(220 - (crop.y ?? 0)).toBeCloseTo(84, 0);
  });

  it('keeps an automatic crop inside the image bounds', () => {
    const crop = calculateAutomaticCrop({ x: 0, y: 0, width: 180, height: 300 }, 600, 600);

    expect(crop.x).toBeGreaterThanOrEqual(0);
    expect(crop.y).toBeGreaterThanOrEqual(0);
    expect((crop.x ?? 0) + (crop.width ?? 0)).toBeLessThanOrEqual(600);
    expect((crop.y ?? 0) + (crop.height ?? 0)).toBeLessThanOrEqual(600);
  });
});
