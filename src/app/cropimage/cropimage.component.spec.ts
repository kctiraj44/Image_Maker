import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { CropimageComponent } from './cropimage.component';

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

    expect(zoomSpy).toHaveBeenCalledWith(0.1);
  });

  it('rotates the cropper view', () => {
    const rotateSpy = jasmine.createSpy('rotate');
    component.cropper = { rotate: rotateSpy } as any;

    component.rotateLeft();

    expect(rotateSpy).toHaveBeenCalledWith(-90);
  });
});
