export interface TileGenerationOptions {
  tileSize?: number;
  overlap?: number;
  format?: 'jpeg' | 'png' | 'webp';
  quality?: number;
}

export interface DziInfo {
  Image: {
    xmlns: string;
    Url: string;
    Format: string;
    Overlap: string;
    TileSize: string;
    Size: {
      Height: string;
      Width: string;
    };
  };
}

export interface ImageMetadata {
  id: string;
  filename: string;
  originalName: string;
  width: number;
  height: number;
  format: string;
  size: number;
  tileSize: number;
  overlap: number;
  maxLevel: number;
  dziUrl: string;
  tilesUrl: string;
  uploadedAt: Date;
}

export interface TileRequest {
  imageId: string;
  level: number;
  column: number;
  row: number;
}
