import request from 'supertest';
import express from 'express';

// Mock the controller BEFORE importing the router
const mockUploadImage = jest.fn();
const mockListImages = jest.fn();
const mockGetMetadata = jest.fn();
const mockGetDzi = jest.fn();
const mockGetDziJson = jest.fn();
const mockGetTile = jest.fn();
const mockDeleteImage = jest.fn();

jest.mock('../controllers/image.controller', () => ({
  ImageController: jest.fn().mockImplementation(() => ({
    uploadImage: mockUploadImage,
    listImages: mockListImages,
    getMetadata: mockGetMetadata,
    getDzi: mockGetDzi,
    getDziJson: mockGetDziJson,
    getTile: mockGetTile,
    deleteImage: mockDeleteImage,
  })),
}));

jest.mock('../config/multer.config', () => ({
  upload: { single: () => (_req: any, _res: any, next: any) => next() },
}));

// Import router AFTER mocking
import router from './image.routes';

const app = express();
app.disable('x-powered-by');
app.use(express.json());
app.use('/images', router);

describe('Image Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call uploadImage on POST /images/upload', async () => {
    mockUploadImage.mockImplementation((_req: any, res: any) => res.status(201).send({ ok: true }));

    const res = await request(app).post('/images/upload').attach('image', Buffer.from('test'), 'test.png');

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ok: true });
    expect(mockUploadImage).toHaveBeenCalled();
  });

  it('should call listImages on GET /images', async () => {
    mockListImages.mockImplementation((_req: any, res: any) => res.json([]));

    const res = await request(app).get('/images');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(mockListImages).toHaveBeenCalled();
  });

  it('should call getMetadata on GET /images/:imageId/metadata', async () => {
    mockGetMetadata.mockImplementation((req: any, res: any) => res.json({ id: req.params.imageId }));

    const res = await request(app).get('/images/123/metadata');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: '123' });
    expect(mockGetMetadata).toHaveBeenCalled();
  });

  it('should call getDzi on GET /images/:imageId/dzi', async () => {
    mockGetDzi.mockImplementation((_req: any, res: any) => res.type('xml').send('<dzi/>'));

    const res = await request(app).get('/images/123/dzi');

    expect(res.status).toBe(200);
    expect(res.text).toBe('<dzi/>');
    expect(mockGetDzi).toHaveBeenCalled();
  });

  it('should call getDziJson on GET /images/:imageId/dzi.json', async () => {
    mockGetDziJson.mockImplementation((_req: any, res: any) => res.json({ dzi: true }));

    const res = await request(app).get('/images/123/dzi.json');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ dzi: true });
    expect(mockGetDziJson).toHaveBeenCalled();
  });

  it('should call getTile on GET /images/:imageId/tiles/:level/:column/:row', async () => {
    mockGetTile.mockImplementation((_req: any, res: any) => res.send('tile'));

    const res = await request(app).get('/images/123/tiles/1/2/3');

    expect(res.status).toBe(200);
    expect(res.text).toBe('tile');
    expect(mockGetTile).toHaveBeenCalled();
  });

  it('should call deleteImage on DELETE /images/:imageId', async () => {
    mockDeleteImage.mockImplementation((_req: any, res: any) => res.status(204).send());

    const res = await request(app).delete('/images/123');

    expect(res.status).toBe(204);
    expect(mockDeleteImage).toHaveBeenCalled();
  });

  it('should return 404 for unknown route', async () => {
    const res = await request(app).get('/images/unknown/route');
    expect(res.status).toBe(404);
  });
});
