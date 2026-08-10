import { Injectable } from '@angular/core';
import { removeBackground } from '@imgly/background-removal';

export interface PassportJpeg {
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  compressionRatio: number;
}

@Injectable({ providedIn: 'root' })
export class BackgroundRemovalService {
  // Use 240,000 bytes rather than 240 KiB (245,760 bytes). This is the
  // conservative interpretation of the Department of State's 240 kB limit.
  private readonly maxDigitalFileSizeBytes = 240_000;
  // Do not sacrifice more image quality than this just to reduce file size.
  private readonly minimumSubmissionQuality = 0.7;
  async replaceBackgroundWithWhite(source: HTMLCanvasElement): Promise<string> {
    const image = await this.toJpegBlob(source);
    const foreground = await removeBackground(image, {
      model: 'isnet_quint8',
      proxyToWorker: true,
      output: { format: 'image/png' }
    });

    return this.compositeOnWhite(foreground, source.width, source.height);
  }

  async createPassportJpeg(
    source: HTMLCanvasElement,
    requireEstimatedRatioAtMostTwenty = false
  ): Promise<PassportJpeg> {
    const sourceCanvas = this.toSrgbCanvas(source);
    const outputSizes = requireEstimatedRatioAtMostTwenty
      ? [1200, 1100, 1000, 900, 800, 700, 600]
      : [sourceCanvas.width];

    for (const size of outputSizes) {
      const canvas = this.toSrgbCanvas(sourceCanvas, size, size);
      const blob = await this.createSubmissionJpegBlob(canvas);
      const compressionRatio = (size * size * 3) / blob.size;

      if (!requireEstimatedRatioAtMostTwenty || compressionRatio <= 20) {
        return {
          dataUrl: await this.blobToDataUrl(blob),
          width: size,
          height: size,
          sizeBytes: blob.size,
          compressionRatio
        };
      }
    }

    throw new Error('We could not prepare a white-background JPEG within the requested compression guidance. Please try a different photo.');
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
      const context = canvas.getContext('2d', { colorSpace: 'srgb' });
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
    return this.blobToDataUrl(await this.createSubmissionJpegBlob(canvas));
  }

  private async createSubmissionJpegBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    const highestQualityBlob = await this.canvasToJpegBlob(canvas, 1);

    let selectedBlob: Blob | null = null;
    if (highestQualityBlob.size <= this.maxDigitalFileSizeBytes) {
      selectedBlob = highestQualityBlob;
    } else {
      const lowestQualityBlob = await this.canvasToJpegBlob(canvas, this.minimumSubmissionQuality);
      if (lowestQualityBlob.size <= this.maxDigitalFileSizeBytes) {
        selectedBlob = await this.findHighestAllowedQuality(
          canvas,
          this.minimumSubmissionQuality,
          1,
          lowestQualityBlob
        );
      }
    }

    if (!selectedBlob) {
      throw new Error('The final JPEG cannot be reduced to 240 kB without lowering image quality too far. Please use a simpler, well-lit photo and try again.');
    }

    return selectedBlob;
  }

  private async findHighestAllowedQuality(
    canvas: HTMLCanvasElement,
    lowerQuality: number,
    upperQuality: number,
    initialBlob: Blob
  ): Promise<Blob> {
    let lower = lowerQuality;
    let upper = upperQuality;
    let best = initialBlob;

    // JPEG size is effectively monotonic for a given canvas. A binary search
    // keeps the best visual quality that still fits within the byte limit.
    for (let attempt = 0; attempt < 9; attempt++) {
      const quality = (lower + upper) / 2;
      const blob = await this.canvasToJpegBlob(canvas, quality);
      if (blob.size <= this.maxDigitalFileSizeBytes) {
        best = blob;
        lower = quality;
      } else {
        upper = quality;
      }
    }

    return best;
  }

  private toSrgbCanvas(
    source: HTMLCanvasElement,
    width = source.width,
    height = source.height
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { colorSpace: 'srgb' });
    if (!context) {
      throw new Error('Your browser could not prepare an sRGB image.');
    }
    context.drawImage(source, 0, 0, width, height);
    return canvas;
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
