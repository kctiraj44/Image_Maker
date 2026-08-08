import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import emailjs from '@emailjs/browser';

export interface EmailPayload {
  to: string;
  cardholderName: string;
  photoData: string;
  orderId: string;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  // 🔑 EmailJS Credentials
  private readonly SERVICE_ID = 'service_wvi89qd';
  private readonly TEMPLATE_ID = 'template_5r4nhqh';
  private readonly PUBLIC_KEY = 'l8aUGGDJWvHs8-R3c';

  constructor(private http: HttpClient) {
    // Initialize EmailJS
    emailjs.init(this.PUBLIC_KEY);
  }

  sendPhotoAfterPayment(payload: EmailPayload): Observable<{ success: boolean; message: string }> {
    return new Observable(observer => {
      console.log('📧 Sending email to:', payload.to);
      console.log('🆔 Order ID:', payload.orderId);

      // Prepare email template variables - simple message, no photo attachment
      const templateParams = {
        to_email: payload.to,
        to_name: payload.cardholderName,
        order_id: payload.orderId,
        amount: payload.total.toFixed(2)
      };

      console.log('📨 Sending confirmation email...');

      // Send via EmailJS
      emailjs
        .send(this.SERVICE_ID, this.TEMPLATE_ID, templateParams)
        .then(
          (response) => {
            console.log('✅ Email sent successfully!', response);
            observer.next({
              success: true,
              message: `Email sent successfully to ${payload.to}`
            });
            observer.complete();
          },
          (error) => {
            console.error('❌ EmailJS Error:', error);
            console.error('Error Status:', error.status);
            console.error('Error Text:', error.text);
            observer.next({
              success: false,
              message: `Email failed: ${error.text}`
            });
            observer.complete();
          }
        );
    });
  }
}
