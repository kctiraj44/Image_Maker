import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BackgroundRemovalService {
  private readonly endpoint = `${environment.apiBaseUrl}/api/payment/passport-photo/remove-background`;

  constructor(private readonly http: HttpClient) {}

  async replaceBackgroundWithWhite(source: HTMLCanvasElement): Promise<string> {
    const image = await this.toJpegBlob(source);
    const formData = new FormData();
    formData.append('file', image, 'passport-photo.jpg');

    const processedImage = await firstValueFrom(
      this.http.post(this.endpoint, formData, { responseType: 'blob' })
    );

    if (processedImage.size === 0 || processedImage.type !== 'image/jpeg') {
      throw new Error('The background-removal service did not return an image.');
    }

    return this.toDataUrl(processedImage);
  }

  private toJpegBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error('The cropped image could not be created.'));
      }, 'image/jpeg', 0.95);
    });
  }

  private toDataUrl(image: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('The processed image could not be read.'));
      reader.readAsDataURL(image);
    });
  }
}
