
export interface ImageRecord {
  id: number;
  originalName: string;
  newName: string | null;
  cloudStoragePath: string;
  fileSize: number;
  mimeType: string;
  objects: string | null;
  detectedText: string | null;
  location: string | null;
  metadata: string | null;
  analysisStatus: string;
  analysisError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalysisResult {
  objects: string[];
  detectedText: string;
  location: string | null;
  mainObject: string | null;
}

export interface UploadResponse {
  imageId: number;
  message: string;
}

export interface AnalysisProgress {
  status: "processing" | "completed" | "error";
  message?: string;
  result?: {
    imageId: number;
    newName: string;
    objects: string[];
    detectedText: string;
    location: string | null;
  };
}
