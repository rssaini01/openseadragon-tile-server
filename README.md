# OpenSeadragon Tile Server

A high-performance image tile server for OpenSeadragon using Node.js, TypeScript, Express, and Sharp (libvips).

## Features

- ✅ Deep Zoom Image (DZI) tile generation
- ✅ Support for JPEG, PNG, TIFF, WebP formats
- ✅ On-demand and pre-generated tiles
- ✅ RESTful API
- ✅ CORS enabled
- ✅ Multi-resolution image pyramids
- ✅ Fast tile serving with Sharp
- ✅ File upload with validation
- ✅ Image metadata management
- ✅ TypeScript for type safety

## Prerequisites

- Node.js 18+ (for Sharp native bindings)
- npm or yarn

## Installation

1. Clone or create the project:
```shell
mkdir openseadragon-tile-server
cd openseadragon-tile-server
```

2. Install dependencies:
```shell
npm install
```

3. Create `.env` file (see `.env` section above)

4. Run in development:
```shell
npm run dev
```

5. Build for production:
```shell
npm run build
npm start
```

## Usage

### Upload an Image

```shell
curl -X POST http://localhost:3000/api/images/upload \
-F "image=@/path/to/your/image.jpg"
```

### List All Images

```shell
curl http://localhost:3000/api/images
```

### Get DZI Descriptor (XML)

```shell
curl http://localhost:3000/api/images/{imageId}/dzi
```

### Get DZI Descriptor (JSON)

```shell
curl http://localhost:3000/api/images/{imageId}/dzi.json
```

### Get Tile

```shell
curl http://localhost:3000/api/images/{imageId}/tiles/12/0/0
```

## OpenSeadragon Integration

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/openseadragon/5.0.1/openseadragon.min.js"></script>
</head>
<body>
  <div id="viewer" style="width: 100%; height: 600px;"></div>

  <script>
    OpenSeadragon({
      id: "viewer",
      prefixUrl: "//openseadragon.github.io/openseadragon/images/",
      tileSources: "http://localhost:3000/api/images/YOUR_IMAGE_ID/dzi"
    });
  </script>
</body>
</html>
```

## API Reference

| Method | Endpoint                                         | Description                     |
|--------|--------------------------------------------------|---------------------------------|
| POST   | `/api/images/upload`                             | Upload image and generate tiles |
| GET    | `/api/images`                                    | List all images                 |
| GET    | `/api/images/:imageId/metadata`                  | Get image metadata              |
| GET    | `/api/images/:imageId/dzi`                       | Get DZI XML descriptor          |
| GET    | `/api/images/:imageId/dzi.json`                  | Get DZI JSON descriptor         |
| GET    | `/api/images/:imageId/tiles/:level/:column/:row` | Get specific tile               |
| DELETE | `/api/images/:imageId`                           | Delete image and tiles          |

## Configuration

Edit `.env` to customize:

- `PORT` - Server port (default: 3000)
- `TILE_SIZE` - Tile dimensions (default: 256)
- `TILE_OVERLAP` - Tile overlap in pixels (default: 1)
- `TILE_FORMAT` - Output format: jpeg, png, webp (default: jpeg)
- `TILE_QUALITY` - JPEG/WebP quality 1-100 (default: 80)
- `MAX_FILE_SIZE` - Max upload size in bytes (default: 100MB)

## Performance Tips

1. **Use JPEG for photos** - Smaller file size, faster serving
2. **Use PNG for graphics** - Better quality for diagrams
3. **Adjust tile size** - 256 is standard, 512 for fewer tiles
4. **Enable compression** - Already enabled via `compression` middleware
5. **Use caching** - Add Redis or file caching for production

## Production Deployment

### Docker (Optional)

```Dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### PM2 (Process Manager)

```shell
npm install -g pm2
pm2 start dist/app.js --name tile-server
pm2 save
```

## Troubleshooting

**Sharp installation issues:**
```shell
npm install --platform=linux --arch=x64 sharp
```

**Large file uploads:**
- Increase `MAX_FILE_SIZE` in `.env`
- Configure nginx/Apache for large uploads

## License

MIT

## Contributing

Pull requests welcome!
