import { Router } from 'express';
import { ImageController } from '../controllers/image.controller';
import { upload } from '../config/multer.config';

const router = Router();
const imageController = new ImageController();

// Upload image and generate tiles
router.post(
  '/upload',
  upload.single('image'),
  imageController.uploadImage.bind(imageController),
);

// List all images
router.get('/', imageController.listImages.bind(imageController));

// Get image metadata
router.get(
  '/:imageId/metadata',
  imageController.getMetadata.bind(imageController),
);

// Get DZI XML descriptor
router.get('/:imageId/dzi', imageController.getDzi.bind(imageController));

// Get DZI JSON descriptor
router.get(
  '/:imageId/dzi.json',
  imageController.getDziJson.bind(imageController),
);

// Get specific tile
router.get(
  '/:imageId/tiles/:level/:column/:row',
  imageController.getTile.bind(imageController),
);

// Delete image
router.delete('/:imageId', imageController.deleteImage.bind(imageController));

export default router;
