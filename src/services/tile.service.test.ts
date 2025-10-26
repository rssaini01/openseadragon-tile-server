// src/services/tile.service.test.ts
import path from 'path';
import { TileService } from './tile.service';
import { DziInfo, ImageMetadata } from '../types';

// In-memory store for fs mock
const store = new Map<string, Buffer | string>();

jest.mock('fs', () => ({
  writeFile: (p: string, data: any, cb: (err: Error | null) => void) => {
    store.set(p, typeof data === 'string' ? data : Buffer.from(data));
    cb(null);
  },
  readFile: (p: string, encoding: any, cb?: any) => {
    const callback = typeof encoding === 'function' ? encoding : cb;
    const data = store.get(p);
    if (data === undefined) {
      callback(new Error('ENOENT'));
    } else {
      callback(null, data);
    }
  },
  existsSync: (p: string) => store.has(p),
  readdirSync: (p: string) => {
    const parts = Array.from(store.keys())
      .map((k) => {
        const rel = path.relative(p, k);
        const first = rel.split(path.sep)[0];
        return first && !first.startsWith('..') ? first : null;
      })
      .filter(Boolean) as string[];
    return Array.from(new Set(parts));
  },
  statSync: (_p: string) => ({
    isDirectory: () => true,
  }),
  rmSync: jest.fn(),
}));

let mockedSharpFactory: any = (_p: string) => ({
  metadata: () => Promise.resolve({ width: 100, height: 100, size: 1000, format: 'jpeg' }),
  tile: () => ({
    jpeg: () => ({ toFile: () => Promise.resolve() }),
    png: () => ({ toFile: () => Promise.resolve() }),
    webp: () => ({ toFile: () => Promise.resolve() }),
    toFile: () => Promise.resolve(),
  }),
});

jest.mock('sharp', () => {
  return (inputPath: string) => mockedSharpFactory(inputPath);
});

jest.mock('../utils/file.utils', () => ({
  ensureDir: async (_p: string) => undefined,
  generateImageId: (_filename: string) => 'img123',
}));

describe('TileService (Jest)', () => {
  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
    mockedSharpFactory = (_p: string) => ({
      metadata: () => Promise.resolve({ width: 1024, height: 512, size: 1234, format: 'jpeg' }),
      tile: () => ({
        jpeg: () => ({ toFile: () => Promise.resolve() }),
        png: () => ({ toFile: () => Promise.resolve() }),
        webp: () => ({ toFile: () => Promise.resolve() }),
        toFile: () => Promise.resolve(),
      }),
    });
  });

  it('generateTiles creates metadata and returns ImageMetadata', async () => {
    // Add mock input file to store
    store.set('/tmp/input.png', Buffer.from('fake-image-data'));
    let savedDziPath = '';
    mockedSharpFactory = (_inputPath: string) => ({
      metadata: () => Promise.resolve({ width: 800, height: 600, size: 2000, format: 'png' }),
      tile: () => ({
        jpeg: () => ({ toFile: (p: string) => { savedDziPath = p; return Promise.resolve(); } }),
        png: () => ({ toFile: (p: string) => { savedDziPath = p; return Promise.resolve(); } }),
        webp: () => ({ toFile: (p: string) => { savedDziPath = p; return Promise.resolve(); } }),
        toFile: (p: string) => { savedDziPath = p; return Promise.resolve(); },
      }),
    });

    const svc = new TileService();
    const result = await svc.generateTiles('/tmp/input.png', 'upload.png', {
      tileSize: 256,
      overlap: 1,
      format: 'jpeg',
      quality: 80,
    });

    expect(result).toBeDefined();
    expect(result.id).toBe('img123');
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);

    const metadataPath = path.join(process.env.TILES_DIR || 'tiles', result.id, 'metadata.json');
    expect(store.has(metadataPath)).toBe(true);
    const saved = store.get(metadataPath) as string;
    expect(saved).toContain('"id": "img123"');
    expect(savedDziPath).toContain(path.join(process.env.TILES_DIR || 'tiles', result.id, 'image.dzi'));
  });

  it('getTile returns tile buffer for existing tile and fallback formats', async () => {
    const svc = new TileService();
    const tilePath = path.join('tiles', 'img123', 'image_files', '0', '1_2.jpeg');
    store.set(tilePath, Buffer.from('jpeg-data'));

    const buf = await svc.getTile('img123', 0, 1, 2);
    expect(buf).toBeDefined();
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.toString()).toBe('jpeg-data');

    store.delete(tilePath);
    const pngPath = path.join('tiles', 'img123', 'image_files', '0', '1_2.png');
    store.set(pngPath, Buffer.from('png-data'));
    const buf2 = await svc.getTile('img123', 0, 1, 2);
    expect(buf2.toString()).toBe('png-data');
  });

  it('getDziDescriptor reads DZI XML', async () => {
    const svc = new TileService();
    const dziPath = path.join('tiles', 'img123', 'image.dzi');
    store.set(dziPath, '<Image></Image>');
    const xml = await svc.getDziDescriptor('img123');
    expect(xml).toBe('<Image></Image>');
  });

  it('getDziJson returns DziInfo based on metadata', async () => {
    const svc = new TileService();
    const metadata: ImageMetadata = {
      id: 'img123',
      filename: 'upload.png',
      originalName: 'input.png',
      width: 800,
      height: 600,
      format: 'png',
      size: 2000,
      tileSize: 256,
      overlap: 1,
      maxLevel: 4,
      dziUrl: '/api/images/img123/dzi',
      tilesUrl: '/api/images/img123/tiles',
      uploadedAt: new Date(),
    };
    jest.spyOn(svc as any, 'getMetadata').mockResolvedValue(metadata);
    const info = await svc.getDziJson('img123');
    expect((info as DziInfo).Image.Url).toContain('/api/images/img123/tiles/');
    expect((info as DziInfo).Image.TileSize).toBe('256');
    expect((info as DziInfo).Image.Size.Width).toBe('800');
  });

  it('listImages reads directories and returns metadata list', async () => {
    const svc = new TileService();
    const meta: ImageMetadata = {
      id: 'img123',
      filename: 'upload.png',
      originalName: 'input.png',
      width: 100,
      height: 100,
      format: 'jpeg',
      size: 100,
      tileSize: 256,
      overlap: 1,
      maxLevel: 1,
      dziUrl: '/api/images/img123/dzi',
      tilesUrl: '/api/images/img123/tiles',
      uploadedAt: new Date(),
    };
    jest.spyOn(svc as any, 'getMetadata').mockResolvedValue(meta);
    const list = await svc.listImages();
    expect(Array.isArray(list)).toBe(true);
  });

  it('deleteImage removes image directory', async () => {
    const svc = new TileService();
    const imagePath = path.join('tiles', 'img123');
    store.set(imagePath, 'dir');
    const fsMock = require('fs');
    await svc.deleteImage('img123');
    expect(fsMock.rmSync).toHaveBeenCalledWith(imagePath, { recursive: true, force: true });
  });
});
