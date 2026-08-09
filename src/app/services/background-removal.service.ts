import { Injectable } from '@angular/core';
import { removeBackground } from '@imgly/background-removal';

@Injectable({ providedIn: 'root' })
export class BackgroundRemovalService {
  private readonly maxDigitalFileSizeBytes = 240 * 1024;
  async replaceBackgroundWithWhite(source: HTMLCanvasElement): Promise<string> {
    const image = await this.toJpegBlob(source);
    const foreground = await removeBackground(image, {
      model: 'isnet_quint8',
      proxyToWorker: true,
      output: { format: 'image/png' }
    });

    return this.compositeOnWhite(foreground, source.width, source.height);
  }

  async createPassportJpeg(source: HTMLCanvasElement): Promise<string> {
    return this.createSubmissionJpeg(source);
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

  private async compositeOnWhite(image: Blob, width: number, height: number): Promise<string> {
    const objectUrl = URL.createObjectURL(image);
    const foreground = new Image();
    foreground.src = objectUrl;

    try {
      await foreground.decode();
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Your browser could not create the white background.');
      }

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      context.drawImage(foreground, 0, 0, width, height);
      return this.createSubmissionJpeg(canvas);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  private async createSubmissionJpeg(canvas: HTMLCanvasElement): Promise<string> {
    for (let quality = 0.92; quality >= 0.5; quality -= 0.06) {
      const blob = await this.canvasToJpegBlob(canvas, quality);
      if (blob.size <= this.maxDigitalFileSizeBytes) {
        return this.blobToDataUrl(blob);
      }
    }

    throw new Error('The final JPEG is larger than the 240 KB digital-image limit. Please use a simpler, well-lit photo and try again.');
  }

  private canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error('The final JPEG could not be created.'));
      }, 'image/jpeg', quality);
    });
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('The final JPEG could not be read.'));
      reader.readAsDataURL(blob);
    });
  }

}
