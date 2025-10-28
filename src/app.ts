import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import imageRoutes from './routes/image.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(morgan('combined'));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for testing
app.use('/static', express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/images', imageRoutes);

// Serve a test page
app.get('/', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>OpenSeadragon Tile Server</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          background: #f5f5f5;
        }
        .container {
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 { color: #333; }
        .upload-form {
          margin: 20px 0;
          padding: 20px;
          background: #f9f9f9;
          border-radius: 4px;
        }
        input[type="file"] {
          margin: 10px 0;
        }
        button {
          background: #007bff;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        button:hover {
          background: #0056b3;
        }
        .info {
          background: #e7f3ff;
          padding: 15px;
          border-left: 4px solid #007bff;
          margin: 20px 0;
        }
        pre {
          background: #f4f4f4;
          padding: 15px;
          border-radius: 4px;
          overflow-x: auto;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🖼️ OpenSeadragon Tile Server</h1>
        <p>High-performance image tile server using Sharp and Express.js</p>

        <div class="upload-form">
          <h2>Upload Image</h2>
          <form id="uploadForm" enctype="multipart/form-data">
            <input type="file" name="image" accept="image/*" required>
            <br><br>
            <button type="submit">Upload & Generate Tiles</button>
          </form>
          <div id="result"></div>
        </div>

        <div class="info">
          <h3>📚 API Endpoints</h3>
          <pre>
POST   /api/images/upload              - Upload image and generate tiles
GET    /api/images                     - List all images
GET    /api/images/:imageId/dzi        - Get DZI XML descriptor
GET    /api/images/:imageId/dzi.json   - Get DZI JSON descriptor
GET    /api/images/:imageId/metadata   - Get image metadata
GET    /api/images/:imageId/tiles/:level/:column/:row - Get specific tile
DELETE /api/images/:imageId            - Delete image
          </pre>
        </div>

        <div class="info">
          <h3>🔗 OpenSeadragon Integration</h3>
          <pre>
OpenSeadragon({
  id: "viewer",
  prefixUrl: "//openseadragon.github.io/openseadragon/images/",
  tileSources: {
    type: 'legacy-image-pyramid',
    levels: [{
      url: 'http://localhost:${PORT}/api/images/YOUR_IMAGE_ID/dzi.json',
      height: IMAGE_HEIGHT,
      width: IMAGE_WIDTH
    }]
  }
});
          </pre>
        </div>
      </div>

      <script>
        document.getElementById('uploadForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const resultDiv = document.getElementById('result');

          resultDiv.innerHTML = '<p>Uploading and generating tiles...</p>';

          try {
            const response = await fetch('/api/images/upload', {
              method: 'POST',
              body: formData
            });

            const data = await response.json();

            if (response.ok) {
              resultDiv.innerHTML = \`
                <div style="background: #d4edda; padding: 15px; margin-top: 15px; border-radius: 4px;">
                  <h3>✅ Success!</h3>
                  <p><strong>Image ID:</strong> \${data.data.id}</p>
                  <p><strong>DZI URL:</strong> <a href="\${data.data.dziUrl}" target="_blank">\${data.data.dziUrl}</a></p>
                  <p><strong>Dimensions:</strong> \${data.data.width} × \${data.data.height}</p>
                  <p><strong>Max Zoom Level:</strong> \${data.data.maxLevel}</p>
                </div>
              \`;
            } else {
              resultDiv.innerHTML = \`<div style="background: #f8d7da; padding: 15px; margin-top: 15px; border-radius: 4px;">❌ Error: \${data.error}</div>\`;
            }
          } catch (error) {
            resultDiv.innerHTML = \`<div style="background: #f8d7da; padding: 15px; margin-top: 15px; border-radius: 4px;">❌ Error: \${error.message}</div>\`;
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
╔═════════════════════════════════════════════════════╗
║   OpenSeadragon Tile Server                         ║
║   Status: Running ✓                                 ║
║   Port: ${PORT}                                        ║
║   Environment: ${process.env.NODE_ENV || 'development'}                          ║
║   URL: http://localhost:${PORT}                        ║
╚═════════════════════════════════════════════════════╝
  `);
});

export default app;
