import { Injectable } from '@angular/core';

interface Landmark {
  x: number;
  y: number;
}

interface FaceLandmarkerInstance {
  detect(image: HTMLImageElement): { faceLandmarks: Landmark[][] };
}

export interface FacePoint {
  x: number;
  y: number;
}

export interface FaceLandmarkAnalysis {
  faceCount: number;
  forehead?: FacePoint;
  chin?: FacePoint;
  eyeCenter?: FacePoint;
  faceCenter?: FacePoint;
}

@Injectable({ providedIn: 'root' })
export class FaceLandmarkService {
  private readonly wasmPath = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';
  private readonly modelPath = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task';
  private landmarkerPromise?: Promise<FaceLandmarkerInstance>;

  async analyze(image: HTMLImageElement): Promise<FaceLandmarkAnalysis> {
    const result = (await this.getLandmarker()).detect(image);
    if (result.faceLandmarks.length !== 1) {
      return { faceCount: result.faceLandmarks.length };
    }

    const landmarks = result.faceLandmarks[0];
    const forehead = this.toPoint(landmarks[10]);
    const chin = this.toPoint(landmarks[152]);
    const leftEyeOuter = this.toPoint(landmarks[33]);
    const leftEyeInner = this.toPoint(landmarks[133]);
    const rightEyeInner = this.toPoint(landmarks[362]);
    const rightEyeOuter = this.toPoint(landmarks[263]);

    if (!forehead || !chin || !leftEyeOuter || !leftEyeInner || !rightEyeInner || !rightEyeOuter) {
      return { faceCount: 1 };
    }

    const eyeCenter = this.average([leftEyeOuter, leftEyeInner, rightEyeInner, rightEyeOuter]);
    return {
      faceCount: 1,
      forehead,
      chin,
      eyeCenter,
      faceCenter: { x: (leftEyeOuter.x + rightEyeOuter.x) / 2, y: eyeCenter.y }
    };
  }

  private async getLandmarker(): Promise<FaceLandmarkerInstance> {
    this.landmarkerPromise ??= this.createLandmarker();
    return this.landmarkerPromise;
  }

  private async createLandmarker(): Promise<FaceLandmarkerInstance> {
    const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
    const vision = await FilesetResolver.forVisionTasks(this.wasmPath);
    return FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: this.modelPath },
      runningMode: 'IMAGE',
      numFaces: 2,
      minFaceDetectionConfidence: 0.55,
      minFacePresenceConfidence: 0.55
    });
  }

  private toPoint(landmark: Landmark | undefined): FacePoint | undefined {
    return landmark ? { x: landmark.x, y: landmark.y } : undefined;
  }

  private average(points: FacePoint[]): FacePoint {
    const total = points.reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }), { x: 0, y: 0 });
    return { x: total.x / points.length, y: total.y / points.length };
  }
}
