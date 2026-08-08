import { Injectable } from '@angular/core';
import { removeBackground } from '@imgly/background-removal';

@Injectable({ providedIn: 'root' })
export class BackgroundRemovalService {
  async replaceBackgroundWithWhite(source: HTMLCanvasElement): Promise<string> {
    const image = await this.toJpegBlob(source);
    const foreground = await removeBackground(image, {
      model: 'isnet_quint8',
      proxyToWorker: true,
      output: { format: 'image/png' }
    });

    return this.compositeOnWhite(foreground, source.width, source.height);
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
      return canvas.toDataURL('image/jpeg', 0.95);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

}
