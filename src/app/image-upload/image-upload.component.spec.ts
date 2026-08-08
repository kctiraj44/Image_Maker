import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ImageUploadComponent } from './image-upload.component';

describe('ImageUploadComponent', () => {
  let component: ImageUploadComponent;
  let fixture: ComponentFixture<ImageUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageUploadComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(ImageUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('accepts jpeg and png files', () => {
    const jpegFile = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
    const pngFile = new File(['photo'], 'photo.png', { type: 'image/png' });

    expect(component.validateFile(jpegFile)).toBeNull();
    expect(component.validateFile(pngFile)).toBeNull();
  });

  it('rejects unsupported file types with a clear message', () => {
    const gifFile = new File(['photo'], 'photo.gif', { type: 'image/gif' });

    expect(component.validateFile(gifFile)).toContain('JPEG or PNG');
  });
});
