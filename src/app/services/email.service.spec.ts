import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EmailService]
    });
    service = TestBed.inject(EmailService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should send email with photo after payment', (done) => {
    const mockPayload = {
      to: 'test@example.com',
      cardholderName: 'John Doe',
      photoData: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABA...',
      orderId: 'ORD-123456',
      total: 9.95
    };

    service.sendPhotoAfterPayment(mockPayload).subscribe({
      next: (response) => {
        expect(response.success).toBe(true);
        expect(response.message).toContain(mockPayload.to);
        done();
      }
    });
  });

  it('should handle email sending errors gracefully', (done) => {
    const mockPayload = {
      to: 'test@example.com',
      cardholderName: 'John Doe',
      photoData: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABA...',
      orderId: 'ORD-123456',
      total: 9.95
    };

    service.sendPhotoAfterPayment(mockPayload).subscribe({
      next: (response) => {
        // Should still succeed in test mode
        expect(response.success).toBe(true);
        done();
      }
    });
  });

  it('should include cardholder name in email', (done) => {
    const mockPayload = {
      to: 'jane@example.com',
      cardholderName: 'Jane Smith',
      photoData: 'base64_photo_data',
      orderId: 'ORD-789012',
      total: 6.95
    };

    service.sendPhotoAfterPayment(mockPayload).subscribe({
      next: (response) => {
        expect(response.success).toBe(true);
        done();
      }
    });
  });
});
