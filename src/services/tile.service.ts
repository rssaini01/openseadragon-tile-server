import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { DziInfo, ImageMetadata, TileGenerationOptions } from '../types';
import { ensureDir, generateImageId } from '../utils/file.utils';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

export class TileService {
  private readonly tilesDir: string;

  constructor() {
    this.tilesDir = process.env.TILES_DIR || 'tiles';
    this.ensureTilesDirectory();
  }

  private async ensureTilesDirectory(): Promise<void> {
    await ensureDir(this.tilesDir);
  }

  /**
   * Generate DZI tiles for an uploaded image
   */
  async generateTiles(
    filePath: string,
    filename: string,
    options?: TileGenerationOptions,
  ): Promise<ImageMetadata> {
    const imageId = generateImageId(filename);
    const outputDir = path.join(this.tilesDir, imageId);

    // Ensure output directory exists
    await ensureDir(outputDir);

    // Get image metadata
    const metadata = await sharp(filePath).metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Unable to read image dimensions');
    }

    // Tile generation options
    const tileSize =
      options?.tileSize || parseInt(process.env.TILE_SIZE || '256');
    const overlap =
      options?.overlap || parseInt(process.env.TILE_OVERLAP || '1');
    const format =
      options?.format ||
      (process.env.TILE_FORMAT as 'jpeg' | 'png' | 'webp') ||
      'jpeg';
    const quality =
      options?.quality || parseInt(process.env.TILE_QUALITY || '80');

    // Generate tiles using Sharp's tile() method
    const outputPath = path.join(outputDir, 'image');

    try {
      const sharpInstance = sharp(filePath);

      // Configure tile generation
      let tileInstance = sharpInstance.tile({
        size: tileSize,
        overlap: overlap,
        container: 'fs', // File system container (creates DZI structure)
      });

      // Set output format
      if (format === 'jpeg') {
        tileInstance = tileInstance.jpeg({ quality });
      } else if (format === 'png') {
        tileInstance = tileInstance.png({ quality });
      } else if (format === 'webp') {
        tileInstance = tileInstance.webp({ quality });
      }

      // Generate tiles
      await tileInstance.toFile(outputPath + '.dzi');

      // Calculate max zoom level
      const maxDimension = Math.max(metadata.width, metadata.height);
      const maxLevel = Math.ceil(Math.log2(maxDimension / tileSize));

      // Create metadata
      const imageMetadata: ImageMetadata = {
        id: imageId,
        filename: filename,
        originalName: path.basename(filePath),
        width: metadata.width,
        height: metadata.height,
        format: metadata.format || 'unknown',
        size: metadata.size || 0,
        tileSize,
        overlap,
        maxLevel,
        dziUrl: `/api/images/${imageId}/dzi`,
        tilesUrl: `/api/images/${imageId}/tiles`,
        uploadedAt: new Date(),
      };

      // Save metadata
      await this.saveMetadata(imageId, imageMetadata);

      return imageMetadata;
    } catch (error) {
      throw new Error(`Failed to generate tiles: ${(error as Error).message}`);
    }
  }

  /**
   * Get tile for specific level, column, and row
   */
  async getTile(
    imageId: string,
    level: number,
    column: number,
    row: number,
  ): Promise<Buffer> {
    const tilePath = path.join(
      this.tilesDir,
      imageId,
      'image_files',
      level.toString(),
      `${column}_${row}.jpeg`,
    );

    if (!fs.existsSync(tilePath)) {
      // Try other formats
      const formats = ['jpeg', 'jpg', 'png', 'webp'];
      for (const format of formats) {
        const altPath = path.join(
          this.tilesDir,
          imageId,
          'image_files',
          level.toString(),
          `${column}_${row}.${format}`,
        );
        if (fs.existsSync(altPath)) {
          return await readFile(altPath);
        }
      }
      throw new Error('Tile not found');
    }

    return await readFile(tilePath);
  }

  /**
   * Get DZI XML descriptor
   */
  async getDziDescriptor(imageId: string): Promise<string> {
    const dziPath = path.join(this.tilesDir, imageId, 'image.dzi');

    if (!fs.existsSync(dziPath)) {
      throw new Error('DZI descriptor not found');
    }

    return await readFile(dziPath, 'utf-8');
  }

  /**
   * Get DZI JSON descriptor for OpenSeadragon
   */
  async getDziJson(imageId: string): Promise<DziInfo> {
    const metadata = await this.getMetadata(imageId);

    return {
      Image: {
        xmlns: 'http://schemas.microsoft.com/deepzoom/2008',
        Url: `/api/images/${imageId}/tiles/`,
        Format: 'jpeg',
        Overlap: metadata.overlap.toString(),
        TileSize: metadata.tileSize.toString(),
        Size: {
          Height: metadata.height.toString(),
          Width: metadata.width.toString(),
        },
      },
    };
  }

  /**
   * Get image metadata
   */
  async getMetadata(imageId: string): Promise<ImageMetadata> {
    const metadataPath = path.join(this.tilesDir, imageId, 'metadata.json');

    if (!fs.existsSync(metadataPath)) {
      throw new Error('Metadata not found');
    }

    const data = await readFile(metadataPath, 'utf-8');
    return JSON.parse(data);
  }

  /**
   * Save image metadata
   */
  private async saveMetadata(
    imageId: string,
    metadata: ImageMetadata,
  ): Promise<void> {
    const metadataPath = path.join(this.tilesDir, imageId, 'metadata.json');
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  /**
   * List all available images
   */
  async listImages(): Promise<ImageMetadata[]> {
    const images: ImageMetadata[] = [];

    if (!fs.existsSync(this.tilesDir)) {
      return images;
    }

    const items = fs.readdirSync(this.tilesDir);

    for (const item of items) {
      const itemPath = path.join(this.tilesDir, item);
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        try {
          const metadata = await this.getMetadata(item);
          images.push(metadata);
        } catch (error) {
          // Skip directories without metadata
          console.warn(`No metadata for ${item}`);
        }
      }
    }

    return images;
  }

  /**
   * Delete image and its tiles
   */
  async deleteImage(imageId: string): Promise<void> {
    const imagePath = path.join(this.tilesDir, imageId);

    if (!fs.existsSync(imagePath)) {
      throw new Error('Image not found');
    }

    // Delete directory recursively
    fs.rmSync(imagePath, { recursive: true, force: true });
  }
}
