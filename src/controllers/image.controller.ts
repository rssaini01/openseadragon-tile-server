import { Request, Response, NextFunction } from 'express';
import { TileService } from '../services/tile.service';
import { TileGenerationOptions } from '../types';

const tileService = new TileService();

export class ImageController {
  /**
   * Upload and process image
   */
  async uploadImage(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const options: TileGenerationOptions = {
        tileSize: req.body.tileSize ? parseInt(req.body.tileSize) : undefined,
        overlap: req.body.overlap ? parseInt(req.body.overlap) : undefined,
        format: req.body.format as 'jpeg' | 'png' | 'webp' | undefined,
        quality: req.body.quality ? parseInt(req.body.quality) : undefined,
      };

      const metadata = await tileService.generateTiles(
        req.file.path,
        req.file.filename,
        options,
      );

      res.status(201).json({
        message: 'Image uploaded and tiles generated successfully',
        data: metadata,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get DZI XML descriptor
   */
  async getDzi(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { imageId } = req.params;
      const dziXml = await tileService.getDziDescriptor(imageId);

      res.set('Content-Type', 'application/xml');
      res.send(dziXml);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get DZI JSON descriptor
   */
  async getDziJson(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { imageId } = req.params;
      const dziJson = await tileService.getDziJson(imageId);

      res.json(dziJson);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get specific tile
   */
  async getTile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { imageId, level, column, row } = req.params;

      const tile = await tileService.getTile(
        imageId,
        parseInt(level),
        parseInt(column),
        parseInt(row.replace(/\.(jpeg|jpg|png|webp)$/, '')),
      );

      res.set('Content-Type', 'image/jpeg');
      res.send(tile);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get image metadata
   */
  async getMetadata(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { imageId } = req.params;
      const metadata = await tileService.getMetadata(imageId);

      res.json(metadata);
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all images
   */
  async listImages(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const images = await tileService.listImages();

      res.json({
        count: images.length,
        images,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete image
   */
  async deleteImage(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { imageId } = req.params;
      await tileService.deleteImage(imageId);

      res.json({ message: 'Image deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
